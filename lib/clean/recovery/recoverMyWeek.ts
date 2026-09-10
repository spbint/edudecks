import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import { isBreakLearningPeriod } from "@/lib/clean/setup/setupStatus";
import type { CleanLearningPeriod } from "@/lib/clean/terms/types";
import { isPathwayStepEligibleForOnDeck } from "@/lib/clean/onDeck/learningQueue";
import {
  getAllPathwaySteps,
  normalizePathwayStepId,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";

export type RecoverableLearningItem = {
  calendarItem: CleanCalendarItem;
  registryItem: PathwayStepRegistryItem | null;
  reason: "pathway-linked" | "whole-family" | "unresolved";
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isDateInRange(dateValue: string, startsOn: string, endsOn: string) {
  return Boolean(dateValue && startsOn && endsOn && dateValue >= startsOn && dateValue <= endsOn);
}

export function isCalendarItemInActiveLearningPeriod(
  item: Pick<CleanCalendarItem, "plannedDate">,
  periods: readonly CleanLearningPeriod[],
) {
  if (
    periods.some(
      (period) =>
        isBreakLearningPeriod(period) &&
        isDateInRange(item.plannedDate, period.startsOn, period.endsOn),
    )
  ) {
    return false;
  }

  return periods.some(
    (period) =>
      !isBreakLearningPeriod(period) &&
      isDateInRange(item.plannedDate, period.startsOn, period.endsOn),
  );
}

export function getRecoverableLearningItems(input: {
  calendarItems: readonly CleanCalendarItem[];
  today: string;
  weekStart: string;
  weekEnd: string;
  learningPeriods: readonly CleanLearningPeriod[];
}) {
  return input.calendarItems
    .filter(
      (item) =>
        item.plannedDate >= input.weekStart &&
        item.plannedDate <= input.weekEnd &&
        item.plannedDate < input.today &&
        !item.completedAt &&
        isCalendarItemInActiveLearningPeriod(item, input.learningPeriods),
    )
    .sort(
      (left, right) =>
        left.plannedDate.localeCompare(right.plannedDate) ||
        safe(left.startsAt).localeCompare(safe(right.startsAt)) ||
        left.title.localeCompare(right.title),
    )
    .map((calendarItem) => resolveRecoverableLearningItem(calendarItem));
}

export function resolveRecoverableLearningItem(
  calendarItem: CleanCalendarItem,
): RecoverableLearningItem {
  if (!calendarItem.learnerId) {
    return { calendarItem, registryItem: null, reason: "whole-family" };
  }

  // Calendar text is descriptive only. A step is Pathways-linked only when
  // the row carries explicit canonical context; never infer it from a title.
  const pathwayStepId = normalizePathwayStepId(calendarItem.pathwayStepId);
  const registryItem = pathwayStepId
    ? getAllPathwaySteps().find((step) => step.id === pathwayStepId) || null
    : null;
  const activeRegistryItem = isPathwayStepEligibleForOnDeck(registryItem)
    ? registryItem
    : null;

  return {
    calendarItem,
    registryItem: activeRegistryItem,
    reason: activeRegistryItem ? "pathway-linked" : "unresolved",
  };
}
