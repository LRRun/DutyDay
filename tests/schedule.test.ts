import { describe, expect, it } from "vitest";
import { getNextValidDutyDate } from "@/domain/schedule/calendar";
import { selectDutyPair } from "@/domain/schedule/rotation";
import { simulateSchedule } from "@/domain/schedule/simulator";

const weekdays = { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false };
const members = ["A", "B", "C", "D", "E"].map((name) => ({ id: name, name, email: `${name}@example.com` }));

describe("rotation engine", () => {
  it("rotates fairly for an odd member count", () => {
    let cursor = 0;
    const pairs = Array.from({ length: 6 }, () => {
      const pair = selectDutyPair(members, cursor); cursor = pair.nextCursor;
      return `${pair.member1.name}+${pair.member2.name}`;
    });
    expect(pairs).toEqual(["A+B", "C+D", "E+A", "B+C", "D+E", "A+B"]);
  });
  it("rejects fewer than two members", () => {
    expect(() => selectDutyPair([], 0)).toThrow("至少需要 2 名");
    expect(() => selectDutyPair(members.slice(0, 1), 0)).toThrow("至少需要 2 名");
  });
});

describe("calendar engine", () => {
  it("skips disabled weekdays and exceptions without touching rotation", () => {
    expect(getNextValidDutyDate("2026-09-05", weekdays, [{ date: "2026-09-07" }])).toBe("2026-09-08");
  });
  it("rejects all weekdays disabled instead of looping", () => {
    expect(() => getNextValidDutyDate("2026-09-04", Object.fromEntries(Object.keys(weekdays).map((key) => [key, false])) as typeof weekdays, [])).toThrow("至少需要启用一个");
  });
  it("handles 30 consecutive skip dates", () => {
    const exceptions = Array.from({ length: 30 }, (_, i) => ({ date: new Date(Date.UTC(2026, 8, 7 + i)).toISOString().slice(0, 10) }));
    expect(getNextValidDutyDate("2026-09-07", weekdays, exceptions)).toBe("2026-10-07");
  });
});

describe("simulation engine", () => {
  it("does not consume pairs on skipped days", () => {
    const output = simulateSchedule({ fromDate: "2026-09-04", numberOfAssignments: 2, activeMembers: members, cursor: 0, weekdaySettings: weekdays, exceptions: [{ date: "2026-09-07" }], timezone: "Asia/Shanghai" });
    expect(output.map((item) => [item.date, item.member1.name, item.member2.name])).toEqual([
      ["2026-09-04", "A", "B"], ["2026-09-08", "C", "D"],
    ]);
  });
});
