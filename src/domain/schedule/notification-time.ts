import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { addCalendarDays } from "./calendar";

export type NotificationKind = "day_before" | "same_day";

export function notificationScheduledFor(
  dutyDate: string,
  time: string,
  timezone: string,
  type: NotificationKind,
): Date {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("提醒时间格式必须为 HH:mm");
  const localDate = type === "day_before" ? addCalendarDays(dutyDate, -1) : dutyDate;
  return fromZonedTime(`${localDate}T${time}:00`, timezone);
}

export function todayInTimezone(timezone: string, now = new Date()): string {
  return formatInTimeZone(now, timezone, "yyyy-MM-dd");
}
