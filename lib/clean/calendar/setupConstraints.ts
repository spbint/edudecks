import type { CleanAcademicYear, CleanLearningPeriod } from "@/lib/clean/terms/types";
import { isBreakLearningPeriod } from "@/lib/clean/setup/setupStatus";

type DateRange = {
  startsOn: string;
  endsOn: string;
};

function overlaps(left: DateRange, right: DateRange) {
  return left.startsOn <= right.endsOn && right.startsOn <= left.endsOn;
}

export function validateLearningYearDates(startsOn: string, endsOn: string) {
  if (!startsOn || !endsOn) return "Choose both a learning year start and end date.";
  if (startsOn >= endsOn) return "The learning year end date must be after the start date.";
  return null;
}

export function validateLearningYearDateChange(
  startsOn: string,
  endsOn: string,
  dependentPeriods: DateRange[],
) {
  const dateError = validateLearningYearDates(startsOn, endsOn);
  if (dateError) return dateError;

  const outsidePeriod = dependentPeriods.find(
    (period) => period.startsOn < startsOn || period.endsOn > endsOn,
  );
  return outsidePeriod
    ? "The learning year must continue to contain every existing learning period."
    : null;
}

export function validateLearningPeriodDates({
  academicYear,
  startsOn,
  endsOn,
  isBreak,
  existingPeriods,
  excludeId,
}: {
  academicYear: Pick<CleanAcademicYear, "startsOn" | "endsOn">;
  startsOn: string;
  endsOn: string;
  isBreak: boolean;
  existingPeriods: CleanLearningPeriod[];
  excludeId?: string;
}) {
  if (!startsOn || !endsOn) {
    return isBreak
      ? "Choose both a break start and end date."
      : "Choose both a learning period start and end date.";
  }
  if (startsOn >= endsOn) {
    return isBreak
      ? "The break end date must be after the start date."
      : "The learning period end date must be after the start date.";
  }
  if (startsOn < academicYear.startsOn || endsOn > academicYear.endsOn) {
    return isBreak
      ? "The break must sit inside the learning year."
      : "The learning period must sit inside the learning year.";
  }

  const sameKindOverlap = existingPeriods.find(
    (period) =>
      period.id !== excludeId &&
      isBreakLearningPeriod(period) === isBreak &&
      overlaps(period, { startsOn, endsOn }),
  );
  if (sameKindOverlap) {
    return isBreak
      ? "This break overlaps another break or holiday. Adjust the dates so breaks do not overlap."
      : `This learning period overlaps with ${sameKindOverlap.title}. Adjust the dates so terms do not overlap.`;
  }

  return null;
}

export function canAddBreakOrHoliday(periods: CleanLearningPeriod[]) {
  return periods.some((period) => !isBreakLearningPeriod(period));
}
