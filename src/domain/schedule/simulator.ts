import { addCalendarDays, getNextValidDutyDate } from "./calendar";
import { selectDutyPair } from "./rotation";
import type { DutyMember, ScheduleExceptionInput, SimulatedAssignment, WeekdaySettings } from "./types";

export function simulateSchedule(input: {
  fromDate: string;
  numberOfAssignments: number;
  activeMembers: DutyMember[];
  cursor: number;
  weekdaySettings: WeekdaySettings;
  exceptions: ScheduleExceptionInput[];
  timezone: string;
}): SimulatedAssignment[] {
  if (input.numberOfAssignments < 0 || input.numberOfAssignments > 3660) {
    throw new Error("预览次数必须在 0 到 3660 之间");
  }
  if (input.activeMembers.length < 2) throw new Error("至少需要 2 名参与值日的成员");
  const result: SimulatedAssignment[] = [];
  let cursor = input.cursor;
  let candidate = input.fromDate;
  for (let index = 0; index < input.numberOfAssignments; index += 1) {
    const date = getNextValidDutyDate(candidate, input.weekdaySettings, input.exceptions);
    const pair = selectDutyPair(input.activeMembers, cursor);
    result.push({ date, member1: pair.member1, member2: pair.member2, cursorBefore: pair.cursorBefore });
    cursor = pair.nextCursor;
    candidate = addCalendarDays(date, 1);
  }
  return result;
}
