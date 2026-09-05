import { addMemberAction } from "@/app/actions";
import { MemberList } from "@/components/member-list";
import { PageHeading } from "@/components/page-heading";
import { prisma } from "@/lib/db";
import { ManagedForm, SubmitButton } from "@/components/managed-form";

export const dynamic = "force-dynamic";
export default async function MembersPage() {
  const members = await prisma.member.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return <div className="content"><PageHeading eyebrow="" title="成员" />
    <section className="card" style={{ marginBottom: 16 }}><div className="card-head"><h2>添加成员</h2></div><div className="card-body"><ManagedForm action={addMemberAction} resetOnSuccess className="form-grid"><div className="field"><label htmlFor="new-member-name">姓名</label><input id="new-member-name" className="input" name="name" required maxLength={80} /></div><div className="field"><label htmlFor="new-member-email">邮箱</label><div className="actions"><input id="new-member-email" className="input" name="email" type="email" placeholder="可选；未填写时不发送提醒" style={{ flex: 1 }} /><SubmitButton variant="primary">添加</SubmitButton></div></div></ManagedForm></div></section>
    <section className="card"><div className="card-head"><h2>成员顺序</h2><span className="muted small">拖动手柄或用键盘调整</span></div><MemberList initialMembers={members} /></section>
  </div>;
}
