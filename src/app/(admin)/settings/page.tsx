import { SettingsPanel } from "@/components/settings-panel";
import { PageHeading } from "@/components/page-heading";
import { formatDateOnly } from "@/domain/schedule/calendar";
import { prisma } from "@/lib/db";
import { displayTime } from "@/lib/presentation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, exceptions, worker] = await Promise.all([
    prisma.scheduleSettings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.scheduleException.findMany({ orderBy: { date: "asc" } }),
    prisma.workerState.findUnique({ where: { id: 1 } }),
  ]);
  const healthy = !!worker?.lastTickAt && Date.now() - worker.lastTickAt.getTime() < 5 * 60_000;
  return <div className="content"><PageHeading eyebrow="" title="设置" /><SettingsPanel
    settings={{ monday:settings.monday,tuesday:settings.tuesday,wednesday:settings.wednesday,thursday:settings.thursday,friday:settings.friday,saturday:settings.saturday,sunday:settings.sunday,emailEnabled:settings.emailEnabled,notificationMode:settings.notificationMode,notificationTime:settings.notificationTime,timezone:settings.timezone,dayBeforeSubjectTemplate:settings.dayBeforeSubjectTemplate,dayBeforeBodyTemplate:settings.dayBeforeBodyTemplate,sameDaySubjectTemplate:settings.sameDaySubjectTemplate,sameDayBodyTemplate:settings.sameDayBodyTemplate }}
    exceptions={exceptions.map((item) => ({ id:item.id,date:formatDateOnly(item.date),reason:item.reason }))}
    system={{ healthy, database:"已连接", workerVersion:worker?.workerVersion || "—", lastTick:displayTime(worker?.lastTickAt,settings.timezone), lastScheduler:displayTime(worker?.lastSchedulerSuccessAt,settings.timezone), lastNotification:displayTime(worker?.lastNotificationRunAt,settings.timezone), lastError:worker?.lastError || null, smtpConfigured:!!process.env.SMTP_HOST && !!process.env.SMTP_FROM }}
  /></div>;
}
