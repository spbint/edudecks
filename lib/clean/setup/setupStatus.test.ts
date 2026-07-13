import { describe, expect, it } from "vitest";
import { derivePlanningSetupStatus } from "@/lib/clean/setup/setupStatus";
import type { CleanAcademicYear, CleanLearningPeriod } from "@/lib/clean/terms/types";

const academicYear: CleanAcademicYear = {
  id: "year-1",
  familyId: "family-1",
  title: "2026 Learning Year",
  countryCode: "AU",
  jurisdictionCode: "TAS",
  startsOn: "2026-01-01",
  endsOn: "2026-12-31",
  weekStart: "monday",
  notes: null,
  createdByUserId: "user-1",
  createdAt: null,
  updatedAt: null,
};

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

describe("derivePlanningSetupStatus", () => {
  it("does not count breaks as learning periods", () => {
    const status = derivePlanningSetupStatus({
      academicYears: [academicYear],
      learningPeriods: [
        period({
          id: "break-1",
          title: "Term 1 Holidays",
          periodType: "break",
          startsOn: "2026-04-02",
          endsOn: "2026-04-14",
          isBreak: true,
        }),
      ],
      selectedAcademicYearId: "year-1",
      today: "2026-04-05",
    });

    expect(status.hasLearningYear).toBe(true);
    expect(status.hasLearningPeriod).toBe(false);
    expect(status.hasBreaks).toBe(true);
    expect(status.learningPeriodCount).toBe(0);
    expect(status.breakCount).toBe(1);
    expect(status.activeLearningPeriod).toBeNull();
    expect(status.currentBreakPeriod?.title).toBe("Term 1 Holidays");
  });

  it("selects the active period only from genuine teaching periods", () => {
    const status = derivePlanningSetupStatus({
      academicYears: [academicYear],
      learningPeriods: [
        period({ id: "term-1", title: "Term 1" }),
        period({
          id: "break-1",
          title: "Term 1 Holidays",
          periodType: "break",
          startsOn: "2026-04-02",
          endsOn: "2026-04-14",
          isBreak: true,
        }),
      ],
      selectedAcademicYearId: "year-1",
      today: "2026-03-01",
    });

    expect(status.hasLearningPeriod).toBe(true);
    expect(status.learningPeriodCount).toBe(1);
    expect(status.breakCount).toBe(1);
    expect(status.activeLearningPeriod?.title).toBe("Term 1");
    expect(status.currentBreakPeriod).toBeNull();
  });
});
