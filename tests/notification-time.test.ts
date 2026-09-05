import { describe, expect, it } from "vitest";
import { notificationScheduledFor } from "@/domain/schedule/notification-time";

describe("notification due calculation", () => {
  it("converts Asia/Shanghai local reminder to UTC", () => {
    expect(notificationScheduledFor("2026-09-05", "18:00", "Asia/Shanghai", "day_before").toISOString()).toBe("2026-09-04T10:00:00.000Z");
  });
  it("uses the correct offset across DST", () => {
    expect(notificationScheduledFor("2026-03-30", "09:00", "Europe/Berlin", "day_before").toISOString()).toBe("2026-03-29T07:00:00.000Z");
  });
});
