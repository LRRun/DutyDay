"use client";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "@/components/doodle-icons";

export function Select({ name, defaultValue, ariaLabel, options }: { name: string; defaultValue: string; ariaLabel: string; options: { value: string; label: string }[] }) {
  return <SelectPrimitive.Root name={name} defaultValue={defaultValue}><SelectPrimitive.Trigger className="select-trigger" aria-label={ariaLabel}><SelectPrimitive.Value /><SelectPrimitive.Icon><ChevronDown size={15} /></SelectPrimitive.Icon></SelectPrimitive.Trigger><SelectPrimitive.Portal><SelectPrimitive.Content className="select-content" position="popper" sideOffset={5}><SelectPrimitive.Viewport>{options.map((option) => <SelectPrimitive.Item className="select-item" value={option.value} key={option.value}><SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator className="select-indicator"><Check size={14} /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>)}</SelectPrimitive.Viewport></SelectPrimitive.Content></SelectPrimitive.Portal></SelectPrimitive.Root>;
}
