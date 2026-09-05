import type { ScheduleExceptionInput, WeekdaySettings } from "./types";

const weekdayKeys: (keyof WeekdaySettings)[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`无效日期：${value}`);
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function addCalendarDays(value: string, amount: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDateOnly(date);
}

export function isWeekdayEnabled(date: string, settings: WeekdaySettings): boolean {
  return settings[weekdayKeys[parseDateOnly(date).getUTCDay()]];
}

export function isValidDutyDate(
  date: string,
  settings: WeekdaySettings,
  exceptions: ScheduleExceptionInput[],
): boolean {
  return isWeekdayEnabled(date, settings) && !exceptions.some((item) => item.date === date);
}

export function getNextValidDutyDate(
  startDate: string,
  settings: WeekdaySettings,
  exceptions: ScheduleExceptionInput[],
): string {
  if (!Object.values(settings).some(Boolean)) throw new Error("至少需要启用一个值日星期");
  const skipped = new Set(exceptions.map((item) => item.date));
  let candidate = startDate;
  for (let attempts = 0; attempts < 3660; attempts += 1) {
    if (isWeekdayEnabled(candidate, settings) && !skipped.has(candidate)) return candidate;
    candidate = addCalendarDays(candidate, 1);
  }
  throw new Error("未来十年内没有可用的值日日期，请检查跳过规则");
}
