import { Prisma, type Assignment, type ScheduleSettings } from "@prisma/client";
import { addCalendarDays, formatDateOnly, getNextValidDutyDate, isValidDutyDate } from "@/domain/schedule/calendar";
import { selectDutyPair } from "@/domain/schedule/rotation";
import { todayInTimezone } from "@/domain/schedule/notification-time";
import type { ScheduleExceptionInput, WeekdaySettings } from "@/domain/schedule/types";
import { prisma } from "@/lib/db";

export const weekdaySettingsFrom = (settings: ScheduleSettings): WeekdaySettings => ({
  monday: settings.monday, tuesday: settings.tuesday, wednesday: settings.wednesday,
  thursday: settings.thursday, friday: settings.friday, saturday: settings.saturday,
  sunday: settings.sunday,
});

export async function ensureNextAssignment(now = new Date()): Promise<{ assignment: Assignment; created: boolean }> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(773421001)`;
    const settings = await tx.scheduleSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    const today = todayInTimezone(settings.timezone, now);
    const todayDate = new Date(`${today}T00:00:00.000Z`);
    await tx.assignment.updateMany({
      where: { status: "scheduled", dutyDate: { lt: todayDate } },
      data: { status: "completed" },
    });
    const existing = await tx.assignment.findFirst({
      where: { status: "scheduled", dutyDate: { gte: todayDate } }, orderBy: { dutyDate: "asc" },
    });
    if (existing) return { assignment: existing, created: false };

    const members = await tx.member.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
    if (members.length < 2) throw new Error("至少需要 2 名参与值日的成员");
    const state = await tx.rotationState.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    const exceptions = await tx.scheduleException.findMany({ where: { date: { gte: todayDate } } });
    const exceptionInputs = exceptions.map((item): ScheduleExceptionInput => ({ date: formatDateOnly(item.date), reason: item.reason }));
    const start = state.lastAssignmentDate
      ? [today, addCalendarDays(formatDateOnly(state.lastAssignmentDate), 1)].sort().at(-1)!
      : today;
    const dutyDate = getNextValidDutyDate(start, weekdaySettingsFrom(settings), exceptionInputs);
    const pair = selectDutyPair(members, state.cursor);
    const assignment = await tx.assignment.create({ data: {
      dutyDate: new Date(`${dutyDate}T00:00:00.000Z`),
      member1Id: pair.member1.id, member1Name: pair.member1.name, member1Email: pair.member1.email,
      member2Id: pair.member2.id, member2Name: pair.member2.name, member2Email: pair.member2.email,
      cursorBefore: pair.cursorBefore,
    } });
    await tx.rotationState.update({ where: { id: 1 }, data: {
      cursor: pair.nextCursor, lastAssignmentDate: assignment.dutyDate, lastAssignmentId: assignment.id,
    } });
    await tx.workerState.upsert({ where: { id: 1 }, create: { id: 1, lastAssignmentGeneratedAt: now }, update: { lastAssignmentGeneratedAt: now } });
    return { assignment, created: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}

export async function reconcileNextAssignment(): Promise<"unchanged" | "recalculated" | "needs_confirmation"> {
  const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
  if (!settings) return "unchanged";
  const today = todayInTimezone(settings.timezone);
  const assignment = await prisma.assignment.findFirst({ where: {
    status: "scheduled", dutyDate: { gte: new Date(`${today}T00:00:00.000Z`) },
  }, orderBy: { dutyDate: "asc" } });
  if (!assignment) {
    if (await prisma.member.count({ where: { active: true } }) >= 2) {
      await ensureNextAssignment();
      return "recalculated";
    }
    return "unchanged";
  }
  const exception = await prisma.scheduleException.findUnique({ where: { date: assignment.dutyDate } });
  const valid = isValidDutyDate(formatDateOnly(assignment.dutyDate), weekdaySettingsFrom(settings), exception ? [{ date: formatDateOnly(exception.date) }] : []);
  const members = await prisma.member.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const pair = members.length >= 2 ? selectDutyPair(members, assignment.cursorBefore) : null;
  const membersMatch = pair?.member1.id === assignment.member1Id && pair?.member2.id === assignment.member2Id
    && pair.member1.name === assignment.member1Name && pair.member1.email === assignment.member1Email
    && pair.member2.name === assignment.member2Name && pair.member2.email === assignment.member2Email;
  if (valid && membersMatch) return "unchanged";
  if (assignment.notificationSentAt) {
    await prisma.scheduleSettings.update({ where: { id: 1 }, data: { pendingRuleChange: true } });
    return "needs_confirmation";
  }
  await recalculateNextAssignment(assignment.id);
  return "recalculated";
}

export async function recalculateNextAssignment(assignmentId?: string) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(773421001)`;
    const assignment = assignmentId
      ? await tx.assignment.findUnique({ where: { id: assignmentId } })
      : await tx.assignment.findFirst({ where: { status: "scheduled" }, orderBy: { dutyDate: "asc" } });
    if (!assignment) return;
    await tx.notificationLog.updateMany({
      where: { assignmentId: assignment.id, status: { in: ["pending", "processing", "failed"] } },
      data: { status: "skipped", errorMessage: "排班已取消", nextAttemptAt: null, lockedAt: null },
    });
    await tx.assignment.update({ where: { id: assignment.id }, data: { status: "cancelled" } });
    const previous = await tx.assignment.findFirst({
      where: { status: { not: "cancelled" }, dutyDate: { lt: assignment.dutyDate } },
      orderBy: { dutyDate: "desc" },
    });
    await tx.rotationState.upsert({
      where: { id: 1 }, create: { id: 1, cursor: assignment.cursorBefore },
      update: { cursor: assignment.cursorBefore, lastAssignmentDate: previous?.dutyDate || null, lastAssignmentId: previous?.id || null },
    });
    await tx.scheduleSettings.update({ where: { id: 1 }, data: { pendingRuleChange: false } });
  });
  if (await prisma.member.count({ where: { active: true } }) < 2) return null;
  return ensureNextAssignment();
}
