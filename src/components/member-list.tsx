"use client";

import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { GripVertical, LoaderCircle, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMemberAction, reorderMembersAction, toggleMemberAction, updateMemberAction } from "@/app/actions";
import { ConfirmAction } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AnimalAvatar, animalFor } from "@/components/cozy-icons";

type Member = { id: string; name: string; email: string | null; active: boolean; sortOrder: number };

function EditMember({ member }: { member: Member }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition();
  return <DialogPrimitive.Root open={open} onOpenChange={setOpen}><DialogPrimitive.Trigger asChild><Button variant="ghost" size="sm"><Pencil size={14} />编辑</Button></DialogPrimitive.Trigger><DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay" /><DialogPrimitive.Content className="dialog-content"><DialogPrimitive.Title className="dialog-title">编辑成员</DialogPrimitive.Title><DialogPrimitive.Description className="dialog-description">姓名和邮箱只影响尚未发送通知的排班，历史记录不会改变。</DialogPrimitive.Description><form action={(data) => startTransition(async () => { try { const result = await updateMemberAction(data); if (result.ok) { toast.success(result.message); setOpen(false); } else toast.error(result.message); } catch { toast.error("连接中断，请稍后重试"); } })} className="grid"><input type="hidden" name="id" value={member.id} /><div className="field"><label htmlFor={`name-${member.id}`}>姓名</label><input id={`name-${member.id}`} className="input" name="name" defaultValue={member.name} required maxLength={80} autoFocus /></div><div className="field"><label htmlFor={`email-${member.id}`}>邮箱</label><input id={`email-${member.id}`} className="input" name="email" type="email" defaultValue={member.email || ""} placeholder="未填写时不会发送提醒" /></div><div className="dialog-actions"><DialogPrimitive.Close asChild><Button disabled={pending}>取消</Button></DialogPrimitive.Close><Button variant="primary" type="submit" disabled={pending}>{pending && <LoaderCircle className="spin" size={15} />}{pending ? "正在保存…" : "保存"}</Button></div></form><DialogPrimitive.Close asChild><Button className="dialog-close" variant="ghost" size="icon" aria-label="关闭"><X size={17} /></Button></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>;
}

function MemberActiveSwitch({ member }: { member: Member }) {
  const [checked, setChecked] = useState(member.active); const [pending, startTransition] = useTransition();
  return <div className="actions"><Switch checked={checked} disabled={pending} aria-label={`${checked ? "停用" : "启用"}${member.name}`} onCheckedChange={(next) => { const previous = checked; setChecked(next); startTransition(async () => { try { const data = new FormData(); data.set("id", member.id); const result = await toggleMemberAction(data); if (result.ok) toast.success(result.message); else { setChecked(previous); toast.error(result.message); } } catch { setChecked(previous); toast.error("连接中断，请稍后重试"); } }); }} /><span className="small muted">{checked ? "参与排班" : "已停用"}</span></div>;
}

function SortableRow({ member, order }: { member: Member; order: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: member.id });
  return <tr ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? .55 : 1 }}>
    <td><div className="actions"><Button variant="ghost" size="icon" aria-label={`调整 ${member.name} 的顺序`} {...attributes} {...listeners}><GripVertical size={16} /></Button><span className="muted small">{String(order + 1).padStart(2, "0")}</span></div></td>
    <td><div className="member-cell"><AnimalAvatar kind={animalFor(member.id)} size={44} /><div><strong>{member.name}</strong><div className="muted small">{member.email || "未填写邮箱"}</div></div></div></td>
    <td><MemberActiveSwitch member={member} /></td>
    <td><div className="actions"><EditMember member={member} /><ConfirmAction title={`删除 ${member.name}？`} description="该成员将从成员列表移除。已经生成的历史排班和姓名快照会保留。" triggerLabel="删除" confirmLabel="删除成员" action={deleteMemberAction} hiddenFields={{ id: member.id }} /></div></td>
  </tr>;
}

export function MemberList({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers); const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  function onDragEnd(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const previous = members; const from = members.findIndex((item) => item.id === event.active.id); const to = members.findIndex((item) => item.id === event.over!.id); const next = arrayMove(members, from, to); setMembers(next);
    startTransition(async () => { try { const result = await reorderMembersAction(next.map((item) => item.id)); if (result.ok) toast.success(result.message); else { setMembers(previous); toast.error(result.message); } } catch { setMembers(previous); toast.error("连接中断，请稍后重试"); } });
  }
  if (members.length === 0) return <div className="empty-state"><div><strong>还没有成员</strong><span>添加至少两名成员后，系统会创建下一次排班。</span></div></div>;
  return <DndContext sensors={sensors} onDragEnd={onDragEnd}><SortableContext items={members.map((item) => item.id)} strategy={verticalListSortingStrategy}><div className="table-wrap"><table><thead><tr><th style={{ width: 110 }}>顺序</th><th>成员</th><th>排班状态</th><th style={{ width: 180 }}>操作</th></tr></thead><tbody>{members.map((member, index) => <SortableRow member={member} order={index} key={member.id} />)}</tbody></table></div></SortableContext></DndContext>;
}
