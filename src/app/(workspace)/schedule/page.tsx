import { EdgeFriends } from "@/components/cozy-scene";
import { addCalendarDays, formatDateOnly, isWeekdayEnabled } from "@/domain/schedule/calendar";
import { simulateSchedule } from "@/domain/schedule/simulator";
import { todayInTimezone } from "@/domain/schedule/notification-time";
import { AnimalAvatar, animalFor } from "@/components/cozy-icons";
import { PageHeading } from "@/components/page-heading";
import { prisma } from "@/lib/db";
import { weekdayZh } from "@/lib/presentation";
import { weekdaySettingsFrom } from "@/services/scheduler-service";

export const dynamic = "force-dynamic";

function CalendarPair({ members, tentative = false }: { members: { id: string; name: string }[]; tentative?: boolean }) {
  return <div className="calendar-assignment">
    <div className="calendar-people">{members.map((member, index) => <div className="calendar-person" key={`${member.id}-${index}`}>
      <AnimalAvatar kind={animalFor(member.id)} size={26} />
      <strong>{member.name}</strong>
    </div>)}</div>
    <span className={`calendar-status ${tentative ? "is-tentative" : "is-confirmed"}`}>{tentative ? "暂定" : "正式"}</span>
  </div>;
}


export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: monthParam } = await searchParams;
  const [settings, members, exceptions, rotation] = await Promise.all([
    prisma.scheduleSettings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.member.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.scheduleException.findMany({ orderBy: { date: "asc" } }),
    prisma.rotationState.findUnique({ where: { id: 1 } }),
  ]);
  const today = todayInTimezone(settings.timezone);
  const month = /^\d{4}-\d{2}$/.test(monthParam || "") ? monthParam! : today.slice(0, 7);
  const monthStart = `${month}-01`;
  const first = new Date(`${monthStart}T00:00:00Z`);
  const gridStart = addCalendarDays(monthStart, -first.getUTCDay());
  const gridEnd = addCalendarDays(gridStart, 41);
  const assignments = await prisma.assignment.findMany({ where: { dutyDate: { gte: new Date(`${gridStart}T00:00:00Z`), lte: new Date(`${gridEnd}T00:00:00Z`) }, status: { not: "cancelled" } } });
  const next = await prisma.assignment.findFirst({ where: { status: "scheduled", dutyDate: { gte: new Date(`${today}T00:00:00Z`) } }, orderBy: { dutyDate: "asc" } });
  let previews: ReturnType<typeof simulateSchedule> = [];
  try { previews = simulateSchedule({ fromDate: next ? addCalendarDays(formatDateOnly(next.dutyDate), 1) : today, numberOfAssignments: 40, activeMembers: members, cursor: rotation?.cursor || 0, weekdaySettings: weekdaySettingsFrom(settings), exceptions: exceptions.map((e) => ({ date: formatDateOnly(e.date), reason: e.reason })), timezone: settings.timezone }); } catch {}
  const formal = new Map(assignments.map((item) => [formatDateOnly(item.dutyDate), item]));
  const preview = new Map(previews.map((item) => [item.date, item]));
  const exception = new Map(exceptions.map((item) => [formatDateOnly(item.date), item]));
  const previousMonth = (() => { const d = new Date(`${monthStart}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); })();
  const nextMonth = (() => { const d = new Date(`${monthStart}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 1); return d.toISOString().slice(0, 7); })();
  return <div className="content schedule-content"><PageHeading eyebrow="" title="排班日历" action={<div className="actions"><a className="ui-button ui-button-secondary" href={`?month=${previousMonth}`}>上个月</a><span className="ui-button ui-button-secondary" aria-current="date">{month}</span><a className="ui-button ui-button-secondary" href={`?month=${nextMonth}`}>下个月</a></div>} />
    <div className="actions small muted" style={{ marginBottom: 14 }}><span className="pill good">正式</span><span className="pill preview-key">暂定</span><span className="pill skip-key">跳过</span></div>
    <div className="calendar-notebook"><div className="calendar-edge"><EdgeFriends /></div><div className="notebook-wave" aria-hidden="true" /><section className="table-wrap"><div className="calendar">{weekdayZh.map((day) => <div className="calendar-weekday" key={day}><strong className="small">{day}</strong></div>)}{Array.from({ length: 42 }, (_, index) => {
      const date = addCalendarDays(gridStart, index); const f = formal.get(date); const p = preview.get(date); const e = exception.get(date); const inMonth = date.startsWith(month);
      const disabled = !isWeekdayEnabled(date, weekdaySettingsFrom(settings));
      return <div className={`calendar-day ${inMonth ? "" : "other"} ${date === today ? "is-today" : ""} ${disabled && !f && !p && !e ? "is-rest" : ""}`} key={date}><span className="calendar-num">{Number(date.slice(-2))}{date === today ? " · 今天" : ""}</span>{f ? <CalendarPair members={[{ id: f.member1Id, name: f.member1Name }, { id: f.member2Id, name: f.member2Name }]} /> : p ? <CalendarPair members={[p.member1, p.member2]} tentative /> : e ? <div className="calendar-event skip">跳过 · {e.reason}</div> : disabled ? <div className="calendar-event skip">休息</div> : null}</div>;
    })}</div></section><div className="notebook-footer" aria-hidden="true"><span className="footer-wave" /></div></div>
  </div>;
}
