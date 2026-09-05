import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { processDueNotifications } from "@/services/notification-service";
import { ensureNextAssignment } from "@/services/scheduler-service";

export async function tick() {
  const now = new Date();
  log("info", "worker", "scheduler.tick.started", "Worker tick 开始");
  let lastError: string | null = null;
  try {
    const result = await ensureNextAssignment(now);
    log("info", "worker", "assignment.ensure.success", result.created ? "已创建下一次排班" : "下一次排班已存在", { assignmentId: result.assignment.id });
    await prisma.workerState.upsert({ where: { id: 1 }, create: { id: 1, lastSchedulerSuccessAt: now }, update: { lastSchedulerSuccessAt: now } });
  } catch (error) {
    lastError = error instanceof Error ? error.message : "排班任务失败";
    log("error", "worker", "assignment.ensure.failed", lastError);
  }
  try {
    await processDueNotifications(now);
    await prisma.workerState.upsert({ where: { id: 1 }, create: { id: 1, lastNotificationRunAt: now }, update: { lastNotificationRunAt: now } });
  } catch (error) {
    lastError = error instanceof Error ? error.message : "通知任务失败";
    log("error", "worker", "notification.run.failed", lastError);
  }
  await prisma.workerState.upsert({ where: { id: 1 }, create: {
    id: 1, lastTickAt: now, lastError, workerVersion: process.env.WORKER_VERSION || "development",
  }, update: { lastTickAt: now, lastError, workerVersion: process.env.WORKER_VERSION || "development" } });
}
