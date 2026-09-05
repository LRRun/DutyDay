import { Bell, CalendarClock, CalendarOff, Server } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { addCalendarDays, formatDateOnly } from "@/domain/schedule/calendar";
import { simulateSchedule } from "@/domain/schedule/simulator";
import { todayInTimezone } from "@/domain/schedule/notification-time";
import { prisma } from "@/lib/db";
import { displayDutyDate, displayTime } from "@/lib/presentation";
import { weekdaySettingsFrom } from "@/services/scheduler-service";
import { keepAssignmentAction, recalculateAction } from "@/app/actions";
import { DashboardWebMcpTools } from "@/components/webmcp-tools";
import { ActionButton } from "@/components/managed-form";
import { ConfirmAction } from "@/components/ui/alert-dialog";
import { AnimalAvatar, SparklesIcon, animalFor } from "@/components/cozy-icons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [settings, assignment, members, exceptions, worker, failedNotifications] = await Promise.all([
    prisma.scheduleSettings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.assignment.findFirst({ where: { status: "scheduled" }, orderBy: { dutyDate: "asc" } }),
    prisma.member.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.scheduleException.findMany({ orderBy: { date: "asc" } }),
    prisma.workerState.findUnique({ where: { id: 1 } }),
    prisma.notificationLog.count({ where: { status: "failed" } }),
  ]);
  const rotation = await prisma.rotationState.findUnique({ where: { id: 1 } });
  const fromDate = assignment ? addCalendarDays(formatDateOnly(assignment.dutyDate), 1) : todayInTimezone(settings.timezone);
  let previews: ReturnType<typeof simulateSchedule> = [];
  try { previews = simulateSchedule({ fromDate, numberOfAssignments: 4, activeMembers: members, cursor: rotation?.cursor || 0, weekdaySettings: weekdaySettingsFrom(settings), exceptions: exceptions.map((e) => ({ date: formatDateOnly(e.date), reason: e.reason })), timezone: settings.timezone }); } catch {}
  const healthy = !!worker?.lastTickAt && Date.now() - worker.lastTickAt.getTime() < 5 * 60_000;
  const upcomingExceptions = exceptions.filter((item) => formatDateOnly(item.date) >= todayInTimezone(settings.timezone)).slice(0, 4);
  return <div className="content"><PageHeading eyebrow="" title="概览" />
    <DashboardWebMcpTools workerHealthy={healthy} nextAssignment={assignment ? { date: formatDateOnly(assignment.dutyDate), members: [assignment.member1Name, assignment.member2Name], notificationStatus: assignment.notificationStatus } : null} />
    {settings.pendingRuleChange && <div className="notice" style={{ marginBottom: 16 }} role="alert"><strong>排班规则已变化</strong><div style={{ marginTop: 5 }}>下一次排班已经发出通知，不会自动修改。请选择保留或重新安排。</div><div className="actions" style={{ marginTop: 12 }}><ActionButton action={keepAssignmentAction}>保留当前排班</ActionButton><ConfirmAction title="重新安排下一次值日？" description="原排班会标记为已取消，已经发出的邮件无法撤回。系统会按最新规则创建新排班。" triggerLabel="重新安排" confirmLabel="确认重新安排" action={recalculateAction} variant="secondary" /></div></div>}
    <div className="grid grid-2">
      <section className="card hero-duty"><div className="card-head"><h2>下一次值日</h2><span className="status"><span className="dot" />正式排班</span></div><div className="card-body" style={{ flex: 1 }}>
        {assignment ? <><div className="hero-date">{displayDutyDate(assignment.dutyDate)}</div><div className="pair"><div className="person-card"><AnimalAvatar kind={animalFor(assignment.member1Id)} size={70} /><span className="person">{assignment.member1Name}</span></div><span className="pair-plus"><SparklesIcon size={28} /></span><div className="person-card"><AnimalAvatar kind={animalFor(assignment.member2Id)} size={70} /><span className="person">{assignment.member2Name}</span></div></div><div className="status"><Bell size={15} />{assignment.notificationSentAt ? "通知已发送" : settings.emailEnabled ? `${settings.notificationMode === "same_day" ? "当天" : "前一天"} ${settings.notificationTime} 提醒` : "未启用邮件提醒"}</div></> : <div className="empty-state"><div><strong>无法创建下一次排班</strong><span>请启用至少两名成员，并检查值日星期设置。</span><div style={{ marginTop: 16 }}><a className="ui-button ui-button-primary" href="/members">管理成员</a></div></div></div>}
      </div></section>
      <section className="card"><div className="card-head"><h2>系统状态</h2><Server size={16} className="muted" /></div><div className="card-body"><ul className="list">
        <li className="list-row"><span>Worker</span><span className={`pill ${healthy ? "good" : "off"}`}>{healthy ? "运行正常" : "需要检查"}</span></li>
        <li className="list-row"><span className="muted">最近心跳</span><span>{displayTime(worker?.lastTickAt, settings.timezone)}</span></li>
        <li className="list-row"><span className="muted">最近调度</span><span>{displayTime(worker?.lastSchedulerSuccessAt, settings.timezone)}</span></li>
        <li className="list-row"><span className="muted">最近通知检查</span><span>{displayTime(worker?.lastNotificationRunAt, settings.timezone)}</span></li>
        <li className="list-row"><span className="muted">发送失败</span><span className={`pill ${failedNotifications ? "" : "good"}`}>{failedNotifications}</span></li>
      </ul></div></section>
      <section className="card"><div className="card-head"><h2>接下来</h2><CalendarClock size={16} className="muted" /></div><div className="card-body"><ul className="list">{previews.map((item) => <li className="list-row" key={item.date}><span>{displayDutyDate(new Date(`${item.date}T00:00:00Z`))}</span><strong>{item.member1.name} · {item.member2.name}</strong></li>)}{previews.length === 0 && <li className="empty-state"><div><strong>没有可预览的排班</strong><span>检查成员和排班设置。</span></div></li>}</ul></div></section>
      <section className="card"><div className="card-head"><h2>近期跳过</h2><CalendarOff size={16} className="muted" /></div><div className="card-body"><ul className="list">{upcomingExceptions.map((item) => <li className="list-row" key={item.id}><span>{formatDateOnly(item.date)}</span><strong>{item.reason}</strong></li>)}{upcomingExceptions.length === 0 && <li className="empty-state"><div><strong>没有即将到来的跳过日期</strong><span>可在设置中添加公司假期。</span></div></li>}</ul></div></section>
    </div>
  </div>;
}
