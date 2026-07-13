import type { CleanAcademicYear, CleanLearningPeriod } from "@/lib/clean/terms/types";

export function isBreakLearningPeriod(
  period: Pick<CleanLearningPeriod, "isBreak" | "periodType">,
) {
  return period.isBreak || period.periodType === "break";
}

export function getTeachingPeriods(periods: CleanLearningPeriod[]) {
  return periods.filter((period) => !isBreakLearningPeriod(period));
}

export function getBreakPeriods(periods: CleanLearningPeriod[]) {
  return periods.filter((period) => isBreakLearningPeriod(period));
}

export function getPeriodForDate(periods: CleanLearningPeriod[], dateValue: string) {
  return (
    periods.find((period) => period.startsOn <= dateValue && period.endsOn >= dateValue) ?? null
  );
}

export function derivePlanningSetupStatus({
  academicYears,
  learningPeriods,
  selectedAcademicYearId,
  today,
}: {
  academicYears: CleanAcademicYear[];
  learningPeriods: CleanLearningPeriod[];
  selectedAcademicYearId?: string | null;
  today: string;
}) {
  const visibleLearningPeriods = selectedAcademicYearId
    ? learningPeriods.filter((period) => period.academicYearId === selectedAcademicYearId)
    : learningPeriods;
  const teachingPeriods = getTeachingPeriods(visibleLearningPeriods);
  const breakPeriods = getBreakPeriods(visibleLearningPeriods);

  return {
    visibleLearningPeriods,
    teachingPeriods,
    breakPeriods,
    hasLearningYear: academicYears.length > 0,
    hasLearningPeriod: teachingPeriods.length > 0,
    hasBreaks: breakPeriods.length > 0,
    activeLearningPeriod: getPeriodForDate(teachingPeriods, today),
    currentBreakPeriod: getPeriodForDate(breakPeriods, today),
    learningPeriodCount: teachingPeriods.length,
    breakCount: breakPeriods.length,
  };
}
