import { Bell, CalendarClock, CalendarOff, Server, ChevronRight } from "@/components/doodle-icons";
import { EdgeFriends } from "@/components/cozy-scene";
import { addCalendarDays, formatDateOnly } from "@/domain/schedule/calendar";
import { simulateSchedule } from "@/domain/schedule/simulator";
import { todayInTimezone } from "@/domain/schedule/notification-time";
import { prisma } from "@/lib/db";
import { displayDutyDate, displayTime, weekdayZh } from "@/lib/presentation";
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
  return <div className="content dashboard-content reference-dashboard"><header className="reference-intro"><span>Duty Day · 概览</span><h1>把日常，过得可可爱爱<span aria-hidden="true"> ♥</span></h1><p>两个人一组，轮流值日，一起照顾我们的小天地。</p></header>
    <DashboardWebMcpTools workerHealthy={healthy} nextAssignment={assignment ? { date: formatDateOnly(assignment.dutyDate), members: [assignment.member1Name, assignment.member2Name], notificationStatus: assignment.notificationStatus } : null} />
    {settings.pendingRuleChange && <div className="notice" style={{ marginBottom: 16 }} role="alert"><strong>排班规则已变化</strong><div style={{ marginTop: 5 }}>下一次排班已经发出通知，不会自动修改。请选择保留或重新安排。</div><div className="actions" style={{ marginTop: 12 }}><ActionButton action={keepAssignmentAction}>保留当前排班</ActionButton><ConfirmAction title="重新安排下一次值日？" description="原排班会标记为已取消，已经发出的邮件无法撤回。系统会按最新规则创建新排班。" triggerLabel="重新安排" confirmLabel="确认重新安排" action={recalculateAction} variant="secondary" /></div></div>}
    <div className="reference-layout"><div className="reference-primary">
      <section className="reference-hero">
        <div className="reference-mascots"><EdgeFriends /></div>
        <div className="reference-hero-head"><h2>下一次值日</h2>{assignment && <span className="status"><span className="dot" />正式排班</span>}</div>
        {assignment ? <div className="reference-duty-body"><div className="reference-date"><strong>{assignment.dutyDate.getUTCMonth()+1}月{assignment.dutyDate.getUTCDate()}日</strong><span>{weekdayZh[assignment.dutyDate.getUTCDay()]}</span><div className="status"><Bell size={21} />{assignment.notificationSentAt ? "通知已发送" : settings.emailEnabled ? `${settings.notificationMode === "same_day" ? "当天" : settings.notificationMode === "both" ? "前一天和当天" : "前一天"} ${settings.notificationTime} 提醒` : "未启用邮件提醒"}</div></div>
          <div className="reference-team"><div className="reference-people"><div><AnimalAvatar kind={animalFor(assignment.member1Id)} size={76}/><strong>{assignment.member1Name}</strong></div><SparklesIcon size={32}/><div><AnimalAvatar kind={animalFor(assignment.member2Id)} size={76}/><strong>{assignment.member2Name}</strong></div></div><p className="reference-cheer">{formatDateOnly(assignment.dutyDate) === todayInTimezone(settings.timezone) ? "今天轮到你们啦！" : "下一次，交给你们啦！"}<span aria-hidden="true"> ✦</span></p></div>
        </div> : <div className="empty-state"><div><strong>还需要两位值日搭档</strong><span>添加成员后，一起照顾我们的小天地。</span><a className="ui-button ui-button-primary" href="/members">管理成员</a></div></div>}
        <div className="reference-garden" aria-hidden="true"/><span className="reference-hero-note" aria-hidden="true">一起让<br/>小家更温暖 ♡</span>
      </section>
      <section className="reference-upcoming"><div className="reference-section-head"><h2><CalendarClock size={25}/>接下来</h2><span>未来的日子，一起加油！</span></div><ul>{previews.map(item => <li key={item.date}><a href={`/schedule?month=${item.date.slice(0,7)}`}><span className="reference-row-date">{displayDutyDate(new Date(`${item.date}T00:00:00Z`)).split(" ")[0]}<small>{displayDutyDate(new Date(`${item.date}T00:00:00Z`)).split(" ")[1]}</small></span><span className="reference-row-people"><span><AnimalAvatar kind={animalFor(item.member1.id)} size={34}/>{item.member1.name}</span><span className="muted">·</span><span><AnimalAvatar kind={animalFor(item.member2.id)} size={34}/>{item.member2.name}</span></span><ChevronRight size={18}/></a></li>)}{!previews.length && <li className="empty-state">暂无后续排班，请检查成员和排班设置。</li>}</ul></section>
      </div><aside className="reference-secondary"><p className="reference-margin-note" aria-hidden="true">平凡的日子<br/>也会闪闪发光 ✧</p><section className="reference-system"><div className="reference-section-head"><h2><Server size={23}/>系统状态</h2></div><ul><li><span>排班服务</span><span className={`pill ${healthy ? "good" : "off"}`}>{healthy ? "运行正常" : "需要检查"}</span></li><li><span>最近在线</span><span>{displayTime(worker?.lastTickAt, settings.timezone)}</span></li><li><span>排班更新</span><span>{displayTime(worker?.lastSchedulerSuccessAt, settings.timezone)}</span></li><li><span>提醒检查</span><span>{displayTime(worker?.lastNotificationRunAt, settings.timezone)}</span></li><li><span>提醒失败</span><span className={`pill ${failedNotifications ? "off" : "good"}`}>{failedNotifications} 条</span></li></ul></section>
      <section className="reference-exceptions"><div className="reference-section-head"><h2><CalendarOff size={23}/>近期跳过</h2></div>{upcomingExceptions.length ? <ul>{upcomingExceptions.map(item => <li key={item.id}><span>{formatDateOnly(item.date)}</span><strong>{item.reason}</strong></li>)}</ul> : <div className="reference-rest"><img src="/illustrations/sleep-cat-flat.png" alt="" width={180} height={120}/><strong>没有即将到来的跳过日期</strong><p>可在设置中添加公司假期。</p></div>}</section></aside></div>
  </div>;
}
