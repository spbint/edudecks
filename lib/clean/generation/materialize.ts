import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import { clearCleanPlanningCacheForFamily } from "@/lib/clean/planning/cache";
import { listCleanMasterTemplates, listCleanTemplateBlocks } from "@/lib/clean/templates/client";
import { listCleanAcademicYears, listCleanBlackoutDays, listCleanLearningPeriods } from "@/lib/clean/terms/client";
import { getBreakPeriods, getPeriodForDate, isBreakLearningPeriod } from "@/lib/clean/setup/setupStatus";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import type { CleanGenerationRun } from "@/lib/clean/generation/types";
import {
  applyCleanGeneratedWeek,
  buildCleanGeneratedWeekPreview,
  listCleanGenerationRuns,
} from "@/lib/clean/generation/client";

type MaterializeInput = {
  familyId: string;
  weekStartsOn: string;
  weekEndsOn: string;
  today: string;
  templateId?: string | null;
};

export type CleanOperationalWeekMaterialization = {
  status:
    | "created"
    | "already-materialized"
    | "past-week"
    | "no-usual-week"
    | "choose-usual-week"
    | "outside-learning-year"
    | "blocked-week"
    | "no-applicable-blocks";
  createdItems: CleanCalendarItem[];
  generationRun: CleanGenerationRun | null;
};

const inFlight = new Map<string, Promise<CleanOperationalWeekMaterialization>>();

function key(input: MaterializeInput) {
  return `${input.familyId}:${input.templateId ?? "auto"}:${input.weekStartsOn}`;
}

function empty(status: CleanOperationalWeekMaterialization["status"]): CleanOperationalWeekMaterialization {
  return { status, createdItems: [], generationRun: null };
}

export function filterCleanAutomaticWeekSuggestions<T extends { plannedDate: string }>(
  suggestions: T[],
  input: Pick<MaterializeInput, "weekStartsOn" | "today">,
) {
  if (input.weekStartsOn > input.today) return suggestions;
  return suggestions.filter((suggestion) => suggestion.plannedDate >= input.today);
}

export function hasCleanAppliedGenerationRun(
  runs: Pick<CleanGenerationRun, "masterTemplateId" | "weekStartsOn" | "weekEndsOn" | "status">[],
  input: Pick<MaterializeInput, "templateId" | "weekStartsOn" | "weekEndsOn">,
) {
  return runs.some(
    (run) =>
      run.status === "applied" &&
      run.masterTemplateId === input.templateId &&
      run.weekStartsOn === input.weekStartsOn &&
      run.weekEndsOn === input.weekEndsOn,
  );
}

async function runMaterialization(input: MaterializeInput): Promise<CleanOperationalWeekMaterialization> {
  if (input.weekEndsOn < input.today) return empty("past-week");

  const templates = await listCleanMasterTemplates(input.familyId, { isActive: true, limit: 50 });
  const selectedTemplate = input.templateId
    ? templates.find((template) => template.id === input.templateId) ?? null
    : templates.length === 1
      ? templates[0]
      : null;

  if (!templates.length) return empty("no-usual-week");
  if (!selectedTemplate) return empty("choose-usual-week");

  const runs = await listCleanGenerationRuns(input.familyId, {
    masterTemplateId: selectedTemplate.id,
    weekStartsOn: input.weekStartsOn,
    weekEndsOn: input.weekEndsOn,
    limit: 10,
  });
  if (hasCleanAppliedGenerationRun(runs, {
    templateId: selectedTemplate.id,
    weekStartsOn: input.weekStartsOn,
    weekEndsOn: input.weekEndsOn,
  })) {
    return empty("already-materialized");
  }

  const [academicYears, learningPeriods, blackoutDays, templateBlocks, existingItems] = await Promise.all([
    listCleanAcademicYears(input.familyId, { limit: 50 }),
    listCleanLearningPeriods(input.familyId, { limit: 100 }),
    listCleanBlackoutDays(input.familyId, { limit: 100 }),
    listCleanTemplateBlocks(input.familyId, selectedTemplate.id),
    listCleanCalendarItems(input.familyId, {
      fromDate: input.weekStartsOn,
      toDate: input.weekEndsOn,
      limit: 200,
    }),
  ]);

  if (!templateBlocks.length) return empty("no-applicable-blocks");

  const anchorDate = input.weekStartsOn > input.today ? input.weekStartsOn : input.today;
  const academicYear = academicYears.find(
    (year) => year.startsOn <= anchorDate && year.endsOn >= anchorDate,
  );
  if (!academicYear) return empty("outside-learning-year");

  const periodsForYear = learningPeriods.filter((period) => period.academicYearId === academicYear.id);
  const breakAtAnchor = getPeriodForDate(getBreakPeriods(periodsForYear), anchorDate);
  if (breakAtAnchor) return empty("blocked-week");
  const periodAtAnchor = getPeriodForDate(periodsForYear, anchorDate);
  if (!periodAtAnchor || isBreakLearningPeriod(periodAtAnchor)) return empty("blocked-week");

  const preview = buildCleanGeneratedWeekPreview({
    weekStartsOn: input.weekStartsOn,
    weekEndsOn: input.weekEndsOn,
    templateBlocks,
    blackoutDays: blackoutDays.map((day) => ({
      startsOn: day.startsOn,
      endsOn: day.endsOn,
      isLearningBlocked: day.isLearningBlocked,
      title: day.title,
    })),
    breakPeriods: getBreakPeriods(periodsForYear).map((period) => ({
      startsOn: period.startsOn,
      endsOn: period.endsOn,
      title: period.title,
    })),
    selectedLearningPeriod: {
      title: periodAtAnchor.title,
      startsOn: periodAtAnchor.startsOn,
      endsOn: periodAtAnchor.endsOn,
      isBreak: periodAtAnchor.isBreak,
      periodType: periodAtAnchor.periodType,
    },
  });
  const automaticPreview = filterCleanAutomaticWeekSuggestions(preview, input);
  const applicablePreview = automaticPreview.filter((suggestion) => !suggestion.skippedReason);
  if (!applicablePreview.length) return empty("no-applicable-blocks");

  const result = await applyCleanGeneratedWeek(input.familyId, {
    academicYearId: academicYear.id,
    learningPeriodId: periodAtAnchor.id,
    masterTemplateId: selectedTemplate.id,
    weekStartsOn: input.weekStartsOn,
    weekEndsOn: input.weekEndsOn,
    previewSuggestions: automaticPreview,
    existingCalendarItems: existingItems.map((item) => ({
      plannedDate: item.plannedDate,
      sourceTemplateBlockId: item.sourceTemplateBlockId,
    })),
  });

  clearCleanPlanningCacheForFamily(input.familyId);
  return {
    status: result.createdItems.length ? "created" : "already-materialized",
    createdItems: result.createdItems,
    generationRun: result.generationRun,
  };
}

export function ensureCleanOperationalWeekFromUsualWeek(input: MaterializeInput) {
  const requestKey = key(input);
  const existing = inFlight.get(requestKey);
  if (existing) return existing;
  const request = runMaterialization(input);
  inFlight.set(requestKey, request);
  void request.finally(() => {
    if (inFlight.get(requestKey) === request) inFlight.delete(requestKey);
  });
  return request;
}
