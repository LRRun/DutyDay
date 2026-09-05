"use client";

import { LoaderCircle } from "@/components/doodle-icons";
import { createContext, useContext, useRef, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/app/actions";
import { Button } from "@/components/ui/button";

type ServerAction = (data: FormData) => Promise<ActionResult>;
const PendingContext = createContext(false);

export function ManagedForm({ action, successMessage, resetOnSuccess = false, className, children, ...props }: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: ServerAction; successMessage?: string; resetOnSuccess?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  return <PendingContext.Provider value={pending}><form ref={ref} className={className} {...props} action={(formData) => startTransition(async () => {
    try {
      const result = await action(formData);
      if (result.ok) { toast.success(successMessage || result.message); if (resetOnSuccess) ref.current?.reset(); }
      else toast.error(result.message);
    } catch { toast.error("连接中断，请稍后重试"); }
  })}><fieldset disabled={pending} className="form-fieldset">{children}</fieldset></form></PendingContext.Provider>;
}

export function SubmitButton({ children, pendingLabel = "正在保存…", ...props }: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const pending = useContext(PendingContext);
  return <Button type="submit" disabled={pending} {...props}>{pending && <LoaderCircle className="spin" size={15} />}{pending ? pendingLabel : children}</Button>;
}

export function ActionButton({ action, successMessage, children, ...props }: Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  action: () => Promise<ActionResult>; successMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  return <Button disabled={pending} {...props} onClick={() => startTransition(async () => {
    try { const result = await action(); result.ok ? toast.success(successMessage || result.message) : toast.error(result.message); }
    catch { toast.error("连接中断，请稍后重试"); }
  })}>{pending && <LoaderCircle className="spin" size={15} />}{pending ? "处理中…" : children}</Button>;
}
