import { describe, expect, it } from "vitest";
import {
  findBreakForDate,
  formatCalendarTimeRange,
  normalizeLearningAreaLabel,
  resolveLearningAreaControl,
  resolveStoredLearningArea,
  validateCalendarTimeMode,
} from "@/lib/clean/calendar/planningIntegrity";
import type { CleanLearningPeriod } from "@/lib/clean/terms/types";

function period(overrides: Partial<CleanLearningPeriod>): CleanLearningPeriod {
  return {
    id: "period-1",
    familyId: "family-1",
    academicYearId: "year-1",
    title: "Term 1",
    periodType: "term",
    startsOn: "2026-02-01",
    endsOn: "2026-04-01",
    isBreak: false,
    notes: null,
    createdByUserId: "user-1",
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe("calendar planning integrity", () => {
  it("finds break conflicts without treating terms as breaks", () => {
    const breakPeriod = period({
      id: "break-1",
      title: "Term 1 Holidays",
      periodType: "break",
      startsOn: "2026-04-02",
      endsOn: "2026-04-14",
      isBreak: true,
    });

    expect(findBreakForDate("2026-04-05", [period({}), breakPeriod])?.title).toBe(
      "Term 1 Holidays",
    );
    expect(findBreakForDate("2026-03-05", [period({}), breakPeriod])).toBeNull();
  });

  it("accepts valid timed blocks and formats complete ranges", () => {
    const result = validateCalendarTimeMode({
      mode: "timed",
      startTime: "10:00",
      endTime: "11:00",
    });

    expect(result).toEqual({ ok: true, startsAt: "10:00", endsAt: "11:00" });
    expect(formatCalendarTimeRange("10:00", "11:00")).toBe("10:00\u201311:00");
  });

  it("rejects partial and reversed timed blocks", () => {
    expect(
      validateCalendarTimeMode({ mode: "timed", startTime: "", endTime: "19:00" }).ok,
    ).toBe(false);
    expect(
      validateCalendarTimeMode({ mode: "timed", startTime: "12:00", endTime: "11:00" }).ok,
    ).toBe(false);
  });

  it("stores and displays untimed blocks explicitly", () => {
    expect(validateCalendarTimeMode({ mode: "untimed", startTime: "", endTime: "" })).toEqual({
      ok: true,
      startsAt: null,
      endsAt: null,
    });
    expect(formatCalendarTimeRange(null, "19:00")).toBe("Any time");
    expect(formatCalendarTimeRange(null, null)).toBe("Any time");
  });

  it("normalizes controlled and legacy learning areas without losing custom labels", () => {
    expect(resolveStoredLearningArea("Mathematics", "")).toBe("Mathematics");
    expect(resolveStoredLearningArea("Other", "Life skills")).toBe("Life skills");
    expect(normalizeLearningAreaLabel("Numeracy")).toBe("Mathematics");
    expect(normalizeLearningAreaLabel("PE")).toBe("Health and Physical Education");
    expect(resolveLearningAreaControl("Reading")).toEqual({ area: "Other", customLabel: "Reading" });
  });
});

