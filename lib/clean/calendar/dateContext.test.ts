import { describe, expect, it } from "vitest";
import { resolveCalendarPageLevelCreateDate } from "./dateContext";

describe("Calendar page-level Add date context", () => {
  it("uses the real current day when it belongs to the visible week", () => {
    expect(
      resolveCalendarPageLevelCreateDate({
        boardView: "week",
        focusedDate: "2026-09-05",
        selectedMonthStart: "2026-09-01",
        selectedWeekStart: "2026-08-31",
        selectedWeekEnd: "2026-09-06",
        today: "2026-09-05",
      }),
    ).toBe("2026-09-05");
  });

  it("uses a date inside the future visible week instead of real-world today", () => {
    expect(
      resolveCalendarPageLevelCreateDate({
        boardView: "week",
        focusedDate: "2026-10-26",
        selectedMonthStart: "2026-10-01",
        selectedWeekStart: "2026-10-26",
        selectedWeekEnd: "2026-11-01",
        today: "2026-09-05",
      }),
    ).toBe("2026-10-26");
  });

  it("uses a date inside the selected month when today is outside the viewed month", () => {
    expect(
      resolveCalendarPageLevelCreateDate({
        boardView: "month",
        focusedDate: "2026-10-14",
        selectedMonthStart: "2026-10-01",
        selectedWeekStart: "2026-10-12",
        selectedWeekEnd: "2026-10-18",
        today: "2026-09-05",
      }),
    ).toBe("2026-10-14");
  });

  it("falls back to the selected month start when the focused date is outside the month", () => {
    expect(
      resolveCalendarPageLevelCreateDate({
        boardView: "month",
        focusedDate: "2026-09-28",
        selectedMonthStart: "2026-10-01",
        selectedWeekStart: "2026-09-28",
        selectedWeekEnd: "2026-10-04",
        today: "2026-09-05",
      }),
    ).toBe("2026-10-01");
  });
});
