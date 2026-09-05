import { formatInTimeZone } from "date-fns-tz";

export const weekdayZh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
export function displayDutyDate(date: Date) { return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日 ${weekdayZh[date.getUTCDay()]}`; }
export function displayTime(date: Date | null | undefined, timezone = "Asia/Shanghai") {
  return date ? formatInTimeZone(date, timezone, "yyyy-MM-dd HH:mm") : "—";
}
