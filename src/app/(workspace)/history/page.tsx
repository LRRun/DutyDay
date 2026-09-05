import { PageHeading } from "@/components/page-heading";
import { prisma } from "@/lib/db";
import { formatDateOnly } from "@/domain/schedule/calendar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";

export const dynamic = "force-dynamic";
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; from?: string; to?: string; page?: string }> }) {
  const p = await searchParams;
  const page = Math.max(1, Number(p.page || 1));
  const where = {
    ...(p.status && ["scheduled", "completed", "cancelled"].includes(p.status) ? { status: p.status as "scheduled" | "completed" | "cancelled" } : {}),
    ...(p.q ? { OR: [{ member1Name: { contains: p.q, mode: "insensitive" as const } }, { member2Name: { contains: p.q, mode: "insensitive" as const } }] } : {}),
    ...((p.from || p.to) ? { dutyDate: { ...(p.from ? { gte: new Date(`${p.from}T00:00:00Z`) } : {}), ...(p.to ? { lte: new Date(`${p.to}T00:00:00Z`) } : {}) } } : {}),
  };
  const [items, total] = await Promise.all([prisma.assignment.findMany({ where, orderBy: { dutyDate: "desc" }, skip: (page - 1) * 20, take: 20 }), prisma.assignment.count({ where })]);
  return <div className="content"><PageHeading eyebrow="" title="历史记录" />
    <section className="card"><div className="card-head"><form className="actions" method="get"><input className="input" name="q" defaultValue={p.q} placeholder="搜索成员" aria-label="搜索成员" style={{ width: 190 }} /><DatePicker name="from" defaultValue={p.from} label="开始日期" /><DatePicker name="to" defaultValue={p.to} label="结束日期" /><div style={{ width: 140 }}><Select name="status" defaultValue={p.status || "all"} ariaLabel="排班状态" options={[{value:"all",label:"全部状态"},{value:"scheduled",label:"待执行"},{value:"completed",label:"已完成"},{value:"cancelled",label:"已取消"}]} /></div><Button type="submit">筛选</Button></form><span className="muted small">共 {total} 条</span></div>
      <div className="table-wrap"><table><thead><tr><th>日期</th><th>成员</th><th>通知</th><th>状态</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{formatDateOnly(item.dutyDate)}</td><td><strong>{item.member1Name}</strong><span className="muted"> · </span><strong>{item.member2Name}</strong></td><td>{item.notificationSentAt ? <span className="pill good">已发送</span> : <span className="pill off">{{ pending:"待发送",partial:"部分发送",failed:"发送失败",skipped:"已跳过" }[item.notificationStatus] || item.notificationStatus}</span>}</td><td><span className="pill">{{ scheduled: "待执行", completed: "已完成", cancelled: "已取消" }[item.status]}</span></td></tr>)}{items.length === 0 && <tr><td colSpan={4}><div className="empty-state"><div><strong>没有符合条件的记录</strong><span>调整筛选条件后重试。</span></div></div></td></tr>}</tbody></table></div>
      <div className="card-body actions" style={{ justifyContent: "flex-end" }}>{page > 1 && <a className="ui-button ui-button-secondary" href={`?${new URLSearchParams({ ...p, page: String(page - 1) })}`}>上一页</a>}{page * 20 < total && <a className="ui-button ui-button-secondary" href={`?${new URLSearchParams({ ...p, page: String(page + 1) })}`}>下一页</a>}</div>
    </section>
  </div>;
}
