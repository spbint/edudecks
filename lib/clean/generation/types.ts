import type { CleanCalendarItemSourceType } from "@/lib/clean/calendar/types";

export type CleanGenerationMergeStrategy =
  | "fill-empty"
  | "confirm-each"
  | "dry-run";

export type CleanGenerationRunStatus =
  | "preview"
  | "recorded"
  | "applied"
  | "cancelled";

export type CleanGeneratedWeekSuggestion = {
  plannedDate: string;
  title: string;
  learnerId: string | null;
  learningArea: string | null;
  startsAt: string | null;
  endsAt: string | null;
  programId: string | null;
  programSegmentId: string | null;
  sourceType: CleanCalendarItemSourceType;
  sourceTemplateBlockId: string | null;
  sourceProgramSegmentId: string | null;
  sessionLabel: string | null;
  notes: string | null;
  skippedReason: string | null;
};

export type CleanGenerationRun = {
  id: string;
  familyId: string;
  academicYearId: string | null;
  learningPeriodId: string | null;
  masterTemplateId: string | null;
  weekStartsOn: string;
  weekEndsOn: string;
  mergeStrategy: CleanGenerationMergeStrategy;
  status: CleanGenerationRunStatus;
  previewPayload: CleanGeneratedWeekSuggestion[];
  createdItemsCount: number;
  skippedItemsCount: number;
  notes: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanGenerationRunInput = {
  academicYearId?: string | null;
  learningPeriodId?: string | null;
  masterTemplateId?: string | null;
  weekStartsOn: string;
  weekEndsOn: string;
  mergeStrategy?: CleanGenerationMergeStrategy;
  status?: CleanGenerationRunStatus;
  previewPayload?: CleanGeneratedWeekSuggestion[];
  createdItemsCount?: number;
  skippedItemsCount?: number;
  notes?: string | null;
};

export type CleanGenerationRunsOptions = {
  masterTemplateId?: string | null;
  learningPeriodId?: string | null;
  limit?: number;
};

export type BuildCleanGeneratedWeekPreviewInput = {
  weekStartsOn: string;
  weekEndsOn: string;
  templateBlocks: Array<{
    id: string;
    learnerId: string | null;
    weekday: number;
    title: string;
    learningArea: string | null;
    startsAt: string | null;
    endsAt: string | null;
    programId: string | null;
    programSegmentId: string | null;
    notes: string | null;
    sessionLabel: string | null;
  }>;
  blackoutDays?: Array<{
    startsOn: string;
    endsOn: string;
    isLearningBlocked: boolean;
    title: string;
  }>;
  programSegments?: Array<{
    id: string;
    programId: string;
    title: string;
  }>;
};
