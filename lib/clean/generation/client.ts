import { createCleanCalendarItems } from "@/lib/clean/calendar/client";
import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import type {
  CleanApplyGeneratedWeekInput,
  CleanApplyGeneratedWeekResult,
  CleanApplyGeneratedWeekSkippedItem,
  BuildCleanGeneratedWeekPreviewInput,
  CleanGeneratedWeekSuggestion,
  CleanGenerationMergeStrategy,
  CleanGenerationRun,
  CleanGenerationRunInput,
  CleanGenerationRunsOptions,
  CleanGenerationRunStatus,
} from "@/lib/clean/generation/types";

type GenerationRunRow = {
  id: string;
  family_id: string;
  academic_year_id?: string | null;
  learning_period_id?: string | null;
  master_template_id?: string | null;
  week_starts_on: string;
  week_ends_on: string;
  merge_strategy?: string | null;
  status?: string | null;
  preview_payload?: unknown;
  created_items_count?: number | null;
  skipped_items_count?: number | null;
  notes?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(safe(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMergeStrategy(value: unknown): CleanGenerationMergeStrategy {
  const strategy = safe(value);
  if (strategy === "confirm-each" || strategy === "dry-run") return strategy;
  return "fill-empty";
}

function normalizeRunStatus(value: unknown): CleanGenerationRunStatus {
  const status = safe(value);
  if (status === "recorded" || status === "applied" || status === "cancelled") {
    return status;
  }
  return "preview";
}

function normalizePreviewPayload(value: unknown): CleanGeneratedWeekSuggestion[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      plannedDate: safe(row.plannedDate),
      title: safe(row.title),
      learnerId: normalizeNullString(row.learnerId),
      learningArea: normalizeNullString(row.learningArea),
      startsAt: normalizeNullString(row.startsAt),
      endsAt: normalizeNullString(row.endsAt),
      programId: normalizeNullString(row.programId),
      programSegmentId: normalizeNullString(row.programSegmentId),
      sourceType: safe(row.sourceType) === "template" ? "template" : "generated",
      sourceTemplateBlockId: normalizeNullString(row.sourceTemplateBlockId),
      sourceProgramSegmentId: normalizeNullString(row.sourceProgramSegmentId),
      sessionLabel: normalizeNullString(row.sessionLabel),
      notes: normalizeNullString(row.notes),
      skippedReason: normalizeNullString(row.skippedReason),
    };
  });
}

function toCleanGenerationRun(row: GenerationRunRow): CleanGenerationRun {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    academicYearId: normalizeNullString(row.academic_year_id),
    learningPeriodId: normalizeNullString(row.learning_period_id),
    masterTemplateId: normalizeNullString(row.master_template_id),
    weekStartsOn: safe(row.week_starts_on),
    weekEndsOn: safe(row.week_ends_on),
    mergeStrategy: normalizeMergeStrategy(row.merge_strategy),
    status: normalizeRunStatus(row.status),
    previewPayload: normalizePreviewPayload(row.preview_payload),
    createdItemsCount: normalizeNumber(row.created_items_count),
    skippedItemsCount: normalizeNumber(row.skipped_items_count),
    notes: normalizeNullString(row.notes),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortGenerationRuns(items: CleanGenerationRun[]) {
  return [...items].sort((left, right) => right.weekStartsOn.localeCompare(left.weekStartsOn));
}

function toIsoWeekday(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 0;
  const weekday = date.getDay();
  return weekday === 0 ? 7 : weekday;
}

function combineDateAndTime(dateValue: string, timeValue: string | null) {
  const time = safe(timeValue);
  if (!time) return null;
  const normalized = time.length === 5 ? `${time}:00` : time;
  const date = new Date(`${dateValue}T${normalized}`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function eachDateBetween(startsOn: string, endsOn: string) {
  const dates: string[] = [];
  const current = new Date(`${startsOn}T00:00:00`);
  const end = new Date(`${endsOn}T00:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) {
    return dates;
  }

  while (current <= end) {
    const local = new Date(current.getTime() - current.getTimezoneOffset() * 60000);
    dates.push(local.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function isDateBetween(dateValue: string, startsOn: string, endsOn: string) {
  return startsOn <= dateValue && endsOn >= dateValue;
}

function getSuggestionKey(plannedDate: string, sourceTemplateBlockId: string | null) {
  const blockId = safe(sourceTemplateBlockId);
  if (!blockId) return "";
  return `${plannedDate}::${blockId}`;
}

function buildSuggestionFromBlock(
  dateValue: string,
  block: BuildCleanGeneratedWeekPreviewInput["templateBlocks"][number],
  skippedReason: string | null,
): CleanGeneratedWeekSuggestion {
  return {
    plannedDate: dateValue,
    title: block.title,
    learnerId: block.learnerId,
    learningArea: block.learningArea,
    startsAt: combineDateAndTime(dateValue, block.startsAt),
    endsAt: combineDateAndTime(dateValue, block.endsAt),
    programId: block.programId,
    programSegmentId: block.programSegmentId,
    sourceType: "generated",
    sourceTemplateBlockId: block.id,
    sourceProgramSegmentId: block.programSegmentId,
    sessionLabel: block.sessionLabel,
    notes: block.notes,
    skippedReason,
  };
}

export function buildCleanGeneratedWeekPreview(
  input: BuildCleanGeneratedWeekPreviewInput,
) {
  const blackoutDays = input.blackoutDays ?? [];
  const breakPeriods = input.breakPeriods ?? [];
  const selectedLearningPeriod = input.selectedLearningPeriod ?? null;

  const suggestions: CleanGeneratedWeekSuggestion[] = [];

  for (const dateValue of eachDateBetween(input.weekStartsOn, input.weekEndsOn)) {
    const weekday = toIsoWeekday(dateValue);
    const matchingBlocks = input.templateBlocks.filter((block) => block.weekday === weekday);

    if (
      selectedLearningPeriod &&
      !isDateBetween(
        dateValue,
        selectedLearningPeriod.startsOn,
        selectedLearningPeriod.endsOn,
      )
    ) {
      for (const block of matchingBlocks) {
        suggestions.push(
          buildSuggestionFromBlock(
            dateValue,
            block,
            `Skipped because this date sits outside ${selectedLearningPeriod.title}.`,
          ),
        );
      }
      continue;
    }

    if (
      selectedLearningPeriod &&
      (selectedLearningPeriod.isBreak || safe(selectedLearningPeriod.periodType) === "break")
    ) {
      for (const block of matchingBlocks) {
        suggestions.push(
          buildSuggestionFromBlock(
            dateValue,
            block,
            `Skipped because ${selectedLearningPeriod.title} is marked as a break.`,
          ),
        );
      }
      continue;
    }

    const breakPeriod = breakPeriods.find((period) =>
      isDateBetween(dateValue, period.startsOn, period.endsOn),
    );

    if (breakPeriod) {
      for (const block of matchingBlocks) {
        suggestions.push(
          buildSuggestionFromBlock(
            dateValue,
            block,
            `Skipped because ${breakPeriod.title} is marked as a break.`,
          ),
        );
      }
      continue;
    }

    const blackout = blackoutDays.find(
      (item) =>
        item.isLearningBlocked &&
        item.startsOn <= dateValue &&
        item.endsOn >= dateValue,
    );

    if (blackout) {
      for (const block of matchingBlocks) {
        suggestions.push(
          buildSuggestionFromBlock(
            dateValue,
            block,
            `Skipped because ${blackout.title} blocks learning on this day.`,
          ),
        );
      }
      continue;
    }

    for (const block of matchingBlocks) {
      suggestions.push(buildSuggestionFromBlock(dateValue, block, null));
    }
  }

  return suggestions.sort((left, right) => {
    const dateCompare = left.plannedDate.localeCompare(right.plannedDate);
    if (dateCompare !== 0) return dateCompare;
    return safe(left.startsAt).localeCompare(safe(right.startsAt));
  });
}

export async function applyCleanGeneratedWeek(
  familyId: string,
  input: CleanApplyGeneratedWeekInput,
): Promise<CleanApplyGeneratedWeekResult> {
  const existingKeys = new Set(
    input.existingCalendarItems
      .map((item) => getSuggestionKey(item.plannedDate, item.sourceTemplateBlockId))
      .filter(Boolean),
  );

  const skippedItems: CleanApplyGeneratedWeekSkippedItem[] = [];
  const suggestionsToCreate: CleanGeneratedWeekSuggestion[] = [];

  for (const suggestion of input.previewSuggestions) {
    if (suggestion.skippedReason) {
      skippedItems.push({
        ...suggestion,
        skippedReason: suggestion.skippedReason,
      });
      continue;
    }

    const suggestionKey = getSuggestionKey(
      suggestion.plannedDate,
      suggestion.sourceTemplateBlockId,
    );

    if (suggestionKey && existingKeys.has(suggestionKey)) {
      skippedItems.push({
        ...suggestion,
        skippedReason: "Already planned",
      });
      continue;
    }

    suggestionsToCreate.push(suggestion);

    if (suggestionKey) {
      existingKeys.add(suggestionKey);
    }
  }

  const generationRun = await createCleanGenerationRun(familyId, {
    academicYearId: input.academicYearId ?? null,
    learningPeriodId: input.learningPeriodId ?? null,
    masterTemplateId: input.masterTemplateId ?? null,
    weekStartsOn: input.weekStartsOn,
    weekEndsOn: input.weekEndsOn,
    mergeStrategy: "fill-empty",
    status: "applied",
    previewPayload: input.previewSuggestions,
    createdItemsCount: suggestionsToCreate.length,
    skippedItemsCount: skippedItems.length,
    notes: "Applied from weekly rhythm.",
  });

  const createdItems = suggestionsToCreate.length
    ? await createCleanCalendarItems(
        familyId,
        suggestionsToCreate.map((suggestion) => ({
          title: suggestion.title,
          plannedDate: suggestion.plannedDate,
          learnerId: suggestion.learnerId,
          programId: suggestion.programId,
          programSegmentId: suggestion.programSegmentId,
          description: suggestion.notes,
          startsAt: suggestion.startsAt,
          endsAt: suggestion.endsAt,
          learningArea: suggestion.learningArea,
          sessionLabel: suggestion.sessionLabel,
          sourceType: "generated",
          sourceTemplateBlockId: suggestion.sourceTemplateBlockId,
          sourceProgramSegmentId: suggestion.sourceProgramSegmentId,
          generationRunId: generationRun.id,
        })),
      )
    : [];

  return {
    generationRun,
    createdItems,
    skippedItems,
  };
}

export async function listCleanGenerationRuns(
  familyId: string,
  options: CleanGenerationRunsOptions = {},
) {
  let query = supabase
    .from("generation_runs")
    .select(
      "id,family_id,academic_year_id,learning_period_id,master_template_id,week_starts_on,week_ends_on,merge_strategy,status,preview_payload,created_items_count,skipped_items_count,notes,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", familyId)
    .order("week_starts_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (safe(options.masterTemplateId)) {
    query = query.eq("master_template_id", safe(options.masterTemplateId));
  }

  if (safe(options.learningPeriodId)) {
    query = query.eq("learning_period_id", safe(options.learningPeriodId));
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;
  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load recent week plans just now.",
      ),
    );
  }

  return sortGenerationRuns(
    (response.data ?? []).map((row) => toCleanGenerationRun(row as GenerationRunRow)),
  );
}

export async function createCleanGenerationRun(
  familyId: string,
  input: CleanGenerationRunInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before saving this week plan.");
  }

  const weekStartsOn = safe(input.weekStartsOn);
  const weekEndsOn = safe(input.weekEndsOn);

  if (!weekStartsOn || !weekEndsOn) {
    throw new Error("A generation week range is required.");
  }

  const response = await supabase
    .from("generation_runs")
    .insert({
      family_id: familyId,
      academic_year_id: normalizeNullString(input.academicYearId),
      learning_period_id: normalizeNullString(input.learningPeriodId),
      master_template_id: normalizeNullString(input.masterTemplateId),
      week_starts_on: weekStartsOn,
      week_ends_on: weekEndsOn,
      merge_strategy: normalizeMergeStrategy(input.mergeStrategy),
      status: normalizeRunStatus(input.status),
      preview_payload: input.previewPayload ?? [],
      created_items_count: input.createdItemsCount ?? 0,
      skipped_items_count: input.skippedItemsCount ?? 0,
      notes: normalizeNullString(input.notes),
      created_by_user_id: currentUserId,
    })
    .select(
      "id,family_id,academic_year_id,learning_period_id,master_template_id,week_starts_on,week_ends_on,merge_strategy,status,preview_payload,created_items_count,skipped_items_count,notes,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to save this week plan.",
      ),
    );
  }

  return toCleanGenerationRun(response.data as GenerationRunRow);
}
