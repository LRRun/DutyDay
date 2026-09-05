import { NotificationStatus, NotificationType } from "@prisma/client";
import { formatDateOnly } from "@/domain/schedule/calendar";
import { notificationScheduledFor, todayInTimezone } from "@/domain/schedule/notification-time";
import { renderEmailTemplate } from "@/domain/notifications/email-template";
import { prisma } from "@/lib/db";
import { getEmailProvider } from "@/lib/email/provider";
import { log } from "@/lib/logger";

const retryMinutes = [5, 15, 30];

function typesForMode(mode: string): NotificationType[] {
  if (mode === "both") return [NotificationType.day_before, NotificationType.same_day];
  return [mode as NotificationType];
}

export async function prepareNotificationLogs() {
  const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
  if (!settings?.emailEnabled) return;
  const assignments = await prisma.assignment.findMany({ where: { status: "scheduled" } });
  for (const assignment of assignments) {
    for (const type of typesForMode(settings.notificationMode)) {
      const scheduledFor = notificationScheduledFor(formatDateOnly(assignment.dutyDate), settings.notificationTime, settings.timezone, type);
      const recipients = [
        { id: assignment.member1Id, email: assignment.member1Email },
        { id: assignment.member2Id, email: assignment.member2Email },
      ];
      await prisma.notificationLog.createMany({
        skipDuplicates: true,
        data: recipients.map((member) => ({
          assignmentId: assignment.id, memberId: member.id, email: member.email || "",
            notificationType: type, scheduledFor, status: member.email ? "pending" : "skipped",
            errorMessage: member.email ? null : "成员未填写邮箱",
        })),
      });
    }
  }
}

function renderEmail(logItem: { notificationType: NotificationType; memberId: string; assignment: {
  dutyDate: Date; member1Id: string; member1Name: string; member2Name: string;
} }, settings: {
  dayBeforeSubjectTemplate: string; dayBeforeBodyTemplate: string;
  sameDaySubjectTemplate: string; sameDayBodyTemplate: string;
}) {
  const sameDay = logItem.notificationType === NotificationType.same_day;
  const self = logItem.memberId === logItem.assignment.member1Id ? logItem.assignment.member1Name : logItem.assignment.member2Name;
  const partner = logItem.memberId === logItem.assignment.member1Id ? logItem.assignment.member2Name : logItem.assignment.member1Name;
  return renderEmailTemplate(
    sameDay ? settings.sameDaySubjectTemplate : settings.dayBeforeSubjectTemplate,
    sameDay ? settings.sameDayBodyTemplate : settings.dayBeforeBodyTemplate,
    { recipient_name: self, partner_name: partner, duty_date: formatDateOnly(logItem.assignment.dutyDate), member_1_name: logItem.assignment.member1Name, member_2_name: logItem.assignment.member2Name },
  );
}

async function refreshAssignmentNotificationState(assignmentId: string) {
  const logs = await prisma.notificationLog.findMany({ where: { assignmentId }, select: { status: true, attemptCount: true, sentAt: true } });
  const sent = logs.filter((item) => item.status === "sent");
  const retryable = logs.some((item) => item.status === "pending" || item.status === "processing" || (item.status === "failed" && item.attemptCount < 3));
  const exhausted = logs.some((item) => item.status === "failed" && item.attemptCount >= 3);
  const notificationStatus = retryable ? (sent.length ? "partial" : "pending") : exhausted ? "failed" : sent.length ? "sent" : "skipped";
  await prisma.assignment.update({ where: { id: assignmentId }, data: {
    notificationStatus,
    ...(sent.length ? { notificationSentAt: sent.map((item) => item.sentAt).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0] } : {}),
  } });
}

export async function processDueNotifications(now = new Date()) {
  await prepareNotificationLogs();
  const settings = await prisma.scheduleSettings.findUnique({ where: { id: 1 } });
  if (!settings?.emailEnabled) return;
  await prisma.notificationLog.updateMany({
    where: { status: "processing", lockedAt: { lt: new Date(now.getTime() - 10 * 60_000) } },
    data: { status: "failed", nextAttemptAt: now, errorMessage: "发送任务超时，已重新入队" },
  });
  const due = await prisma.notificationLog.findMany({
    where: {
      assignment: { status: "scheduled" },
      OR: [
        { status: "pending", scheduledFor: { lte: now } },
        { status: "failed", attemptCount: { lt: 3 }, nextAttemptAt: { lte: now } },
      ],
    }, orderBy: { scheduledFor: "asc" }, take: 50,
  });
  for (const item of due) {
    const claimed = await prisma.notificationLog.updateMany({
      where: { id: item.id, status: item.status, attemptCount: item.attemptCount },
      data: { status: "processing", lockedAt: now, attemptCount: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;
    const logItem = await prisma.notificationLog.findUnique({ where: { id: item.id }, include: { assignment: true } });
    if (!logItem) continue;
    const localToday = todayInTimezone(settings.timezone, now);
    const dutyDate = formatDateOnly(logItem.assignment.dutyDate);
    const missed = logItem.notificationType === "day_before" ? localToday >= dutyDate : localToday > dutyDate;
    if (missed) {
      await prisma.notificationLog.update({ where: { id: item.id }, data: { status: "skipped", errorMessage: "已错过提醒时间窗口", lockedAt: null } });
      await refreshAssignmentNotificationState(logItem.assignmentId);
      continue;
    }
    try {
      const provider = getEmailProvider();
      const content = renderEmail(logItem, settings);
      const sent = await provider.sendEmail({ to: logItem.email, ...content });
      await prisma.notificationLog.update({ where: { id: item.id }, data: {
        status: "sent", sentAt: new Date(), providerMessageId: sent.messageId, errorMessage: null, lockedAt: null,
      } });
      await refreshAssignmentNotificationState(logItem.assignmentId);
      await prisma.workerState.upsert({ where: { id: 1 }, create: { id: 1, lastEmailSentAt: new Date() }, update: { lastEmailSentAt: new Date() } });
      log("info", "worker", "notification.sent", "邮件已发送", { notificationId: item.id });
    } catch (error) {
      const attempt = item.attemptCount + 1;
      const exhausted = attempt >= 3;
      await prisma.notificationLog.update({ where: { id: item.id }, data: {
        status: NotificationStatus.failed, errorMessage: error instanceof Error ? error.message : "未知邮件错误",
        nextAttemptAt: exhausted ? null : new Date(now.getTime() + retryMinutes[attempt - 1] * 60_000), lockedAt: null,
      } });
      await refreshAssignmentNotificationState(logItem.assignmentId);
      log("error", "worker", "notification.failed", "邮件发送失败", { notificationId: item.id, attempt });
    }
  }
}
