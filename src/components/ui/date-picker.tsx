"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "@/components/doodle-icons";
import { useEffect, useRef, useState } from "react";
import { CalendarIcon } from "@/components/cozy-icons";
import { Button } from "@/components/ui/button";

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value ? date : null;
}

export function DatePicker({ id, name, defaultValue = "", label = "日期", required = false }: { id?: string; name: string; defaultValue?: string; label?: string; required?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => (parseDate(defaultValue) || new Date()).getMonth());
  const [year, setYear] = useState(() => (parseDate(defaultValue) || new Date()).getFullYear());
  const input = useRef<HTMLInputElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const selected = parseDate(value);
  const today = localDate(new Date());
  useEffect(() => {
    const field = input.current;
    const form = field?.form;
    const reset = () => setValue(defaultValue);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue]);
  useEffect(() => { input.current?.setCustomValidity(value && !parseDate(value) ? "请输入有效日期，格式为 YYYY-MM-DD" : ""); }, [value]);
  const changeOpen = (next: boolean) => {
    if (next) { const date = selected || new Date(); setYear(date.getFullYear()); setMonth(date.getMonth()); }
    setOpen(next);
  };
  const choose = (next: string) => { setValue(next); setOpen(false); };
  const shiftMonth = (amount: number) => { const date = new Date(year, month + amount, 1); setYear(date.getFullYear()); setMonth(date.getMonth()); };
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <div className="date-input-wrap">
      <input ref={input} id={id} className="input date-text" name={name} value={value} onChange={(event) => setValue(event.target.value)} placeholder="年-月-日" aria-label={label} required={required} maxLength={10} inputMode="numeric" autoComplete="off" />
      <Dialog.Trigger asChild><button className="date-open" type="button" aria-label={`选择${label}`}><CalendarIcon size={24} /></button></Dialog.Trigger>
    </div>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content date-dialog" aria-describedby={undefined} onOpenAutoFocus={(event) => { event.preventDefault(); requestAnimationFrame(() => grid.current?.querySelector<HTMLButtonElement>('[data-current="true"]')?.focus()); }}>
      <div className="date-title"><CalendarIcon size={28} /><Dialog.Title className="dialog-title">选择{label}</Dialog.Title><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="关闭日历"><X size={17} /></Button></Dialog.Close></div>
      <div className="date-month"><Button size="icon" aria-label="上个月" onClick={() => shiftMonth(-1)}><ChevronLeft size={18} /></Button><span aria-live="polite">{year} 年 {month + 1} 月</span><Button size="icon" aria-label="下个月" onClick={() => shiftMonth(1)}><ChevronRight size={18} /></Button></div>
      <div className="date-grid" ref={grid} role="group" aria-label={`${year}年${month + 1}月`} onKeyDown={(event) => {
        const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
        if (delta === undefined) return;
        const buttons = Array.from(grid.current?.querySelectorAll<HTMLButtonElement>('button') || []);
        const index = buttons.indexOf(event.target as HTMLButtonElement);
        if (index >= 0) { event.preventDefault(); buttons[Math.max(0, Math.min(buttons.length - 1, index + delta))]?.focus(); }
      }}>
        {["一", "二", "三", "四", "五", "六", "日"].map(day => <span className="date-weekday" key={day}>{day}</span>)}
        {Array.from({ length: 42 }, (_, index) => {
          const day = new Date(year, month, index - offset + 1, 12); const iso = localDate(day); const inMonth = day.getMonth() === month;
          return <button key={iso} type="button" className={`date-cell ${inMonth ? "" : "date-outside"} ${iso === value ? "date-selected" : ""} ${iso === today ? "date-today" : ""}`} aria-label={iso} aria-pressed={iso === value} aria-current={iso === today ? "date" : undefined} data-current={iso === value || (!selected && iso === today) || (!selected && day.getDate() === 1 && inMonth)} onClick={() => choose(iso)}>{day.getDate()}</button>;
        })}
      </div>
      <div className="date-footer"><Button size="sm" variant="ghost" onClick={() => choose("")}>清空</Button><Button size="sm" variant="primary" onClick={() => choose(today)}>今天</Button></div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
