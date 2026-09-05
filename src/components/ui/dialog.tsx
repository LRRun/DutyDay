"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./button";

export function Dialog({ trigger, title, description, children }: { trigger: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return <DialogPrimitive.Root><DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger><DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay" /><DialogPrimitive.Content className="dialog-content"><div><DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title>{description && <DialogPrimitive.Description className="dialog-description">{description}</DialogPrimitive.Description>}</div>{children}<DialogPrimitive.Close asChild><Button className="dialog-close" variant="ghost" size="icon" aria-label="关闭"><X size={17} /></Button></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>;
}
