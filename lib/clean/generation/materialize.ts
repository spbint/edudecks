import {
  deleteCleanCalendarItem,
  listCleanCalendarItems,
  updateCleanCalendarItem,
} from "@/lib/clean/calendar/client";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import { clearCleanPlanningCacheForFamily } from "@/lib/clean/planning/cache";
import { listCleanMasterTemplates, listCleanTemplateBlocks } from "@/lib/clean/templates/client";
import { listCleanAcademicYears, listCleanBlackoutDays, listCleanLearningPeriods } from "@/lib/clean/terms/client";
import { getBreakPeriods, getPeriodForDate, isBreakLearningPeriod } from "@/lib/clean/setup/setupStatus";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import type { CleanGeneratedWeekSuggestion, CleanGenerationRun } from "@/lib/clean/generation/types";
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
  academicYearId?: string | null;
};

export type CleanOperationalWeekMaterialization = {
  status:
    | "created"
    | "reconciled"
    | "already-current"
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

export type CleanMasterWeekRangeMaterialization = {
  weeks: CleanOperationalWeekMaterialization[];
  createdItems: CleanCalendarItem[];
  updatedItemsCount: number;
  removedItemsCount: number;
};

const inFlight = new Map<string, Promise<CleanOperationalWeekMaterialization>>();

function key(input: MaterializeInput) {
  return `${input.familyId}:${input.templateId ?? "auto"}:${input.weekStartsOn}`;
}

function empty(status: CleanOperationalWeekMaterialization["status"]): CleanOperationalWeekMaterialization {
  return { status, createdItems: [], generationRun: null };
}

function addDays(dateValue: string, offset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function getWeekStart(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  const weekday = date.getDay();
  date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return date.toISOString().slice(0, 10);
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

type ReconciliationSuggestion = CleanGeneratedWeekSuggestion;

function normalizeFingerprintText(value: string | null | undefined) {
  return String(value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function buildCleanGeneratedOccurrenceKey(
  item: Pick<ReconciliationSuggestion, "plannedDate" | "sourceTemplateBlockId">,
) {
  const blockId = String(item.sourceTemplateBlockId ?? "").trim();
  return blockId ? `${item.plannedDate}::${blockId}` : null;
}

export function buildCleanLegacyGeneratedFingerprint(
  item: Pick<ReconciliationSuggestion, "plannedDate" | "title" | "learnerId" | "startsAt" | "endsAt" | "learningArea">,
) {
  return [
    item.plannedDate,
    normalizeFingerprintText(item.learnerId),
    normalizeFingerprintText(item.title),
    item.startsAt ?? "",
    item.endsAt ?? "",
    normalizeFingerprintText(item.learningArea),
  ].join("|");
}

export function deriveCleanReconciliationCandidates({
  desired,
  previouslyGenerated,
  liveItems,
}: {
  desired: ReconciliationSuggestion[];
  previouslyGenerated: ReconciliationSuggestion[];
  liveItems: Array<Pick<ReconciliationSuggestion, "plannedDate" | "title" | "learnerId" | "startsAt" | "endsAt" | "learningArea" | "sourceTemplateBlockId"> & { sourceType?: string | null }>;
}) {
  const liveKeys = new Set(
    liveItems.map((item) => buildCleanGeneratedOccurrenceKey(item)).filter(Boolean),
  );
  const legacyGeneratedFingerprints = new Set(
    liveItems
      .filter((item) => item.sourceType === "generated" && !item.sourceTemplateBlockId)
      .map((item) => buildCleanLegacyGeneratedFingerprint(item)),
  );
  const previouslyGeneratedKeys = new Set(
    previouslyGenerated
      .filter((item) => !item.skippedReason)
      .map((item) => buildCleanGeneratedOccurrenceKey(item))
      .filter(Boolean),
  );

  return desired.filter((item) => {
    const key = buildCleanGeneratedOccurrenceKey(item);
    if (key && liveKeys.has(key)) return false;
    if (legacyGeneratedFingerprints.has(buildCleanLegacyGeneratedFingerprint(item))) return false;
    if (key && previouslyGeneratedKeys.has(key)) return false;
    return true;
  });
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
    limit: 1000,
  });
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
  // Program-aware blocks are retained in storage but dormant while Programs is
  // not an active product surface. They never create generic Calendar rows.
  const materializableTemplateBlocks = templateBlocks.filter(
    (block) => !block.learnerProgramAssignmentId,
  );

  const anchorDate = input.weekStartsOn > input.today ? input.weekStartsOn : input.today;
  const academicYear = input.academicYearId
    ? academicYears.find((year) => year.id === input.academicYearId) ?? null
    : academicYears.find((year) => year.startsOn <= anchorDate && year.endsOn >= anchorDate) ?? null;
  const periodsForYear = academicYear
    ? learningPeriods.filter((period) => period.academicYearId === academicYear.id)
    : [];
  const teachingPeriods = periodsForYear.filter((period) => !isBreakLearningPeriod(period));

  const preview = buildCleanGeneratedWeekPreview({
    weekStartsOn: input.weekStartsOn,
    weekEndsOn: input.weekEndsOn,
    templateBlocks: materializableTemplateBlocks,
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
    selectedLearningPeriod: null,
  });
  const automaticPreview = filterCleanAutomaticWeekSuggestions(preview, input).map((suggestion) => {
    if (suggestion.skippedReason || !teachingPeriods.length) return suggestion;
    const teachingPeriod = getPeriodForDate(teachingPeriods, suggestion.plannedDate);
    return teachingPeriod
      ? suggestion
      : { ...suggestion, skippedReason: "This date falls outside your configured learning periods." };
  });
  const desiredPreview = automaticPreview.filter((suggestion) => !suggestion.skippedReason);
  const previouslyGenerated = runs
    .filter((run) => run.status === "applied")
    .flatMap((run) => run.previewPayload);
  const evidenceEntries = await listCleanEvidenceEntries(input.familyId, {
    fromDate: input.today,
    toDate: input.weekEndsOn,
    limit: 1000,
  });
  const protectedItemIds = new Set(
    evidenceEntries
      .map((entry) => entry.calendarItemId)
      .filter((calendarItemId): calendarItemId is string => Boolean(calendarItemId)),
  );
  const desiredByKey = new Map(
    desiredPreview.map((item) => [buildCleanGeneratedOccurrenceKey(item), item]),
  );
  const materializableBlockIds = new Set(materializableTemplateBlocks.map((block) => block.id));
  const historicalBlockIds = new Set(
    runs
      .flatMap((run) => run.previewPayload.map((item) => item.sourceTemplateBlockId))
      .filter((blockId): blockId is string => typeof blockId === "string" && materializableBlockIds.has(blockId)),
  );
  for (const existing of existingItems) {
    if (
      existing.sourceType !== "generated" ||
      !existing.sourceTemplateBlockId ||
      existing.plannedDate < input.today ||
      existing.completedAt ||
      protectedItemIds.has(existing.id) ||
      !historicalBlockIds.has(existing.sourceTemplateBlockId)
    ) continue;
    const desired = desiredByKey.get(buildCleanGeneratedOccurrenceKey(existing));
    if (!desired) {
      await deleteCleanCalendarItem(input.familyId, existing.id);
      continue;
    }
    if (
      existing.title !== desired.title ||
      existing.learnerId !== desired.learnerId ||
      existing.learningArea !== desired.learningArea ||
      existing.startsAt !== desired.startsAt ||
      existing.endsAt !== desired.endsAt ||
      existing.programId !== desired.programId ||
      existing.programSegmentId !== desired.programSegmentId ||
      existing.description !== desired.notes ||
      existing.sessionLabel !== desired.sessionLabel
    ) {
      await updateCleanCalendarItem(input.familyId, existing.id, {
        title: desired.title,
        learnerId: desired.learnerId,
        learningArea: desired.learningArea,
        startsAt: desired.startsAt,
        endsAt: desired.endsAt,
        programId: desired.programId,
        programSegmentId: desired.programSegmentId,
        description: desired.notes,
        sessionLabel: desired.sessionLabel,
      });
    }
  }
  const reconciliationCandidates = deriveCleanReconciliationCandidates({
    desired: desiredPreview,
    previouslyGenerated,
    liveItems: existingItems,
  });
  if (!reconciliationCandidates.length) {
    clearCleanPlanningCacheForFamily(input.familyId);
    return empty(runs.some((run) => run.status === "applied") ? "already-current" : "no-applicable-blocks");
  }

  const result = await applyCleanGeneratedWeek(input.familyId, {
    academicYearId: academicYear?.id ?? null,
    learningPeriodId: null,
    masterTemplateId: selectedTemplate.id,
    weekStartsOn: input.weekStartsOn,
    weekEndsOn: input.weekEndsOn,
    previewSuggestions: reconciliationCandidates,
    existingCalendarItems: existingItems.map((item) => ({
      plannedDate: item.plannedDate,
      sourceTemplateBlockId: item.sourceTemplateBlockId,
    })),
  });

  clearCleanPlanningCacheForFamily(input.familyId);
  return {
    status: runs.some((run) => run.status === "applied") ? "reconciled" : "created",
    createdItems: result.createdItems,
    generationRun: result.generationRun,
  };
}

export function ensureCleanOperationalWeekFromUsualWeek(input: MaterializeInput) {
  const requestKey = key(input);
  const existing = inFlight.get(requestKey);
  if (existing) return existing;
  const request = runMaterialization(input);
  const trackedRequest = request.then(
    (result) => {
      if (inFlight.get(requestKey) === trackedRequest) inFlight.delete(requestKey);
      return result;
    },
    (error: unknown) => {
      if (inFlight.get(requestKey) === trackedRequest) inFlight.delete(requestKey);
      throw error;
    },
  );
  inFlight.set(requestKey, trackedRequest);
  return trackedRequest;
}

export async function materializeMasterWeekRange(input: Omit<MaterializeInput, "weekStartsOn" | "weekEndsOn"> & {
  startsOn: string;
  endsOn: string;
}) {
  const weeks: CleanOperationalWeekMaterialization[] = [];
  const startsOn = input.startsOn < input.today ? input.today : input.startsOn;
  for (let weekStartsOn = getWeekStart(startsOn); weekStartsOn <= input.endsOn; weekStartsOn = addDays(weekStartsOn, 7)) {
    const weekEndsOn = addDays(weekStartsOn, 6);
    if (weekEndsOn < startsOn) continue;
    weeks.push(await ensureCleanOperationalWeekFromUsualWeek({
      ...input,
      weekStartsOn,
      weekEndsOn: weekEndsOn > input.endsOn ? input.endsOn : weekEndsOn,
    }));
  }
  clearCleanPlanningCacheForFamily(input.familyId);
  return {
    weeks,
    createdItems: weeks.flatMap((week) => week.createdItems),
    updatedItemsCount: 0,
    removedItemsCount: 0,
  } satisfies CleanMasterWeekRangeMaterialization;
}
