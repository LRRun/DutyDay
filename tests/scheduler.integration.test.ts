import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { ensureNextAssignment, recalculateNextAssignment } from "@/services/scheduler-service";
import { prepareNotificationLogs, processDueNotifications } from "@/services/notification-service";

const integration = process.env.RUN_INTEGRATION_TESTS === "1" ? describe : describe.skip;

integration("scheduler PostgreSQL integration", () => {
  beforeEach(async () => {
    await prisma.notificationLog.deleteMany(); await prisma.assignment.deleteMany(); await prisma.member.deleteMany();
    await prisma.scheduleException.deleteMany(); await prisma.rotationState.deleteMany(); await prisma.scheduleSettings.deleteMany(); await prisma.workerState.deleteMany();
    await prisma.scheduleSettings.create({ data: { id: 1 } }); await prisma.rotationState.create({ data: { id: 1 } });
    await prisma.member.createMany({ data: [0, 1, 2].map((sortOrder) => ({ name: `M${sortOrder}`, email: `m${sortOrder}@example.com`, sortOrder })) });
  });
  it("remains idempotent across ten calls", async () => {
    for (let i = 0; i < 10; i += 1) await ensureNextAssignment(new Date("2026-09-04T00:00:00Z"));
    expect(await prisma.assignment.count()).toBe(1);
  });
  it("remains idempotent across concurrent calls", async () => {
    await Promise.all([1, 2, 3].map(() => ensureNextAssignment(new Date("2026-09-04T00:00:00Z"))));
    expect(await prisma.assignment.count()).toBe(1);
    expect((await prisma.rotationState.findUniqueOrThrow({ where: { id: 1 } })).cursor).toBe(2);
  });
  it("deduplicates notification logs", async () => {
    await ensureNextAssignment(new Date("2026-09-04T00:00:00Z"));
    await Promise.all([prepareNotificationLogs(), prepareNotificationLogs()]);
    expect(await prisma.notificationLog.count()).toBe(2);
  });
  it("skips an expired day-before notification instead of sending incorrect copy", async () => {
    const { assignment } = await ensureNextAssignment(new Date("2026-09-04T00:00:00Z"));
    await processDueNotifications(new Date("2026-09-04T11:00:00Z"));
    expect(await prisma.notificationLog.count({ where: { status: "skipped" } })).toBe(2);
    expect((await prisma.assignment.findUniqueOrThrow({ where: { id: assignment.id } })).notificationStatus).toBe("skipped");
  });
  it("preserves notification audit records when an assignment is recalculated", async () => {
    const { assignment } = await ensureNextAssignment(new Date("2026-09-04T00:00:00Z"));
    await prepareNotificationLogs();
    await recalculateNextAssignment(assignment.id);
    expect((await prisma.assignment.findUniqueOrThrow({ where: { id: assignment.id } })).status).toBe("cancelled");
    expect(await prisma.notificationLog.count({ where: { assignmentId: assignment.id, status: "skipped" } })).toBe(2);
    expect(await prisma.assignment.count({ where: { status: "scheduled" } })).toBe(1);
  });
});
