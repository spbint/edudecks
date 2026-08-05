import { describe, expect, it } from "vitest";
import {
  canAddBreakOrHoliday,
  validateLearningPeriodDates,
  validateLearningYearDateChange,
  validateLearningYearDates,
} from "./setupConstraints";
import type { CleanLearningPeriod } from "@/lib/clean/terms/types";

const year = { startsOn: "2026-01-01", endsOn: "2026-12-31" };

function period(overrides: Partial<CleanLearningPeriod> = {}): CleanLearningPeriod {
  return {
    id: "period-1",
    familyId: "family-1",
    academicYearId: "year-1",
    title: "Term 1",
    periodType: "term",
    startsOn: "2026-02-01",
    endsOn: "2026-03-31",
    isBreak: false,
    notes: null,
    createdByUserId: "user-1",
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe("calendar setup constraints", () => {
  it("requires an ordered, complete learning year range", () => {
    expect(validateLearningYearDates("", "2026-12-31")).toBeTruthy();
    expect(validateLearningYearDates("2026-12-31", "2026-01-01")).toContain("after");
    expect(validateLearningYearDates("2026-01-01", "2026-01-01")).toContain("after");
    expect(validateLearningYearDates("2026-01-01", "2026-12-31")).toBeNull();
  });

  it("prevents moving a year boundary around existing periods", () => {
    expect(
      validateLearningYearDateChange("2026-03-01", "2026-12-31", [
        { startsOn: "2026-02-01", endsOn: "2026-03-31" },
      ]),
    ).toContain("contain");
    expect(
      validateLearningYearDateChange("2026-01-01", "2026-12-31", [
        { startsOn: "2026-02-01", endsOn: "2026-03-31" },
      ]),
    ).toBeNull();
  });

  it("allows the first teaching period but not a break before it", () => {
    expect(canAddBreakOrHoliday([])).toBe(false);
    expect(canAddBreakOrHoliday([period()])).toBe(true);
    expect(
      validateLearningPeriodDates({
        academicYear: year,
        startsOn: "2026-01-01",
        endsOn: "2026-01-15",
        isBreak: true,
        existingPeriods: [],
      }),
    ).toBeNull();
  });

  it("prevents same-kind overlaps and dates outside the year", () => {
    expect(
      validateLearningPeriodDates({
        academicYear: year,
        startsOn: "2026-03-15",
        endsOn: "2026-04-15",
        isBreak: false,
        existingPeriods: [period()],
      }),
    ).toContain("overlaps");
    expect(
      validateLearningPeriodDates({
        academicYear: year,
        startsOn: "2025-12-01",
        endsOn: "2026-01-15",
        isBreak: false,
        existingPeriods: [],
      }),
    ).toContain("inside");
    expect(
      validateLearningPeriodDates({
        academicYear: year,
        startsOn: "2026-06-01",
        endsOn: "2026-06-15",
        isBreak: true,
        existingPeriods: [period({ id: "break-1", isBreak: true, periodType: "break", startsOn: "2026-06-05", endsOn: "2026-06-10" })],
      }),
    ).toContain("break");
  });
});
