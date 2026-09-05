"use client";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useState, useTransition } from "react";
import { LoaderCircle } from "@/components/doodle-icons";
import { toast } from "sonner";
import type { ActionResult } from "@/app/actions";
import { Button } from "./button";

export function ConfirmAction({ title, description, confirmLabel, triggerLabel, action, hiddenFields = {}, variant = "danger" }: {
  title: string; description: string; confirmLabel: string; triggerLabel: string;
  action: (data: FormData) => Promise<ActionResult>; hiddenFields?: Record<string, string>; variant?: "danger" | "secondary";
}) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition();
  return <AlertDialogPrimitive.Root open={open} onOpenChange={setOpen}><AlertDialogPrimitive.Trigger asChild><Button variant={variant === "danger" ? "ghost" : "secondary"} className={variant === "danger" ? "text-danger" : ""} size="sm">{triggerLabel}</Button></AlertDialogPrimitive.Trigger><AlertDialogPrimitive.Portal><AlertDialogPrimitive.Overlay className="dialog-overlay" /><AlertDialogPrimitive.Content className="dialog-content"><AlertDialogPrimitive.Title className="dialog-title">{title}</AlertDialogPrimitive.Title><AlertDialogPrimitive.Description className="dialog-description">{description}</AlertDialogPrimitive.Description><div className="dialog-actions"><AlertDialogPrimitive.Cancel asChild><Button disabled={pending}>取消</Button></AlertDialogPrimitive.Cancel><Button variant={variant} disabled={pending} onClick={() => startTransition(async () => {
    const data = new FormData(); Object.entries(hiddenFields).forEach(([key, value]) => data.set(key, value));
    try { const result = await action(data); if (result.ok) { toast.success(result.message); setOpen(false); } else toast.error(result.message); }
    catch { toast.error("连接中断，请稍后重试"); }
  })}>{pending && <LoaderCircle className="spin" size={15} />}{pending ? "处理中…" : confirmLabel}</Button></div></AlertDialogPrimitive.Content></AlertDialogPrimitive.Portal></AlertDialogPrimitive.Root>;
}
