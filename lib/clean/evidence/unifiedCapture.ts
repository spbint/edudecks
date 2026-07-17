import {
  createCleanEvidenceEntry,
  updateCleanEvidenceEntry,
} from "@/lib/clean/evidence/client";
import type {
  CleanEvidenceEntry,
  CleanEvidenceEntryInput,
  CleanEvidenceEntryUpdate,
} from "@/lib/clean/evidence/types";
import {
  normalizeProgressJudgementValue,
  type RecognizedProgressJudgement,
} from "@/lib/clean/pathways/pathwayStepState";

export type UnifiedCaptureSourceType =
  | "my-capture"
  | "my-pathways"
  | "my-assessments"
  | "worksheet"
  | "calendar"
  | "portfolio"
  | "reports"
  | "manual";

export type UnifiedCaptureDraft = {
  familyId: string;
  learnerId: string;
  activityDate: string;
  title?: string | null;
  whatHappened: string;
  learningArea?: string | null;
  subjectKey?: string | null;
  strandKey?: string | null;
  stageKey?: string | null;
  pathwayStepId?: string | null;
  stepKey?: string | null;
  stepTitle?: string | null;
  progressJudgement?: string | null;
  parentNote?: string | null;
  learnerReflection?: string | null;
  attachmentUrls?: string[];
  sourceType?: UnifiedCaptureSourceType;
  sourceId?: string | null;
  clientSubmissionId?: string | null;
  programId?: string | null;
  calendarItemId?: string | null;
  curriculumNodeIds?: string[];
  includeInPortfolio: boolean;
  includeInReport: boolean;
};

export type UnifiedCaptureSaveResult = {
  entry: CleanEvidenceEntry;
  duplicate: boolean;
  progressJudgement: RecognizedProgressJudgement | null;
};

type SaveUnifiedCaptureOptions = {
  entryId?: string | null;
  createEntry?: typeof createCleanEvidenceEntry;
  updateEntry?: typeof updateCleanEvidenceEntry;
};

const inFlightSaves = new Map<string, Promise<UnifiedCaptureSaveResult>>();

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeUnifiedCaptureDate(value: string | null | undefined) {
  const normalizedValue = safe(value);
  const dateOnly = normalizedValue.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";

  if (!dateOnly) {
    throw new Error("Choose a date of learning.");
  }

  const parsed = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Choose a valid date of learning.");
  }

  return dateOnly;
}

function buildUnifiedCaptureReflection(draft: UnifiedCaptureDraft) {
  const progressJudgement = normalizeProgressJudgementValue(draft.progressJudgement);
  const existingReflection = safe(draft.learnerReflection);
  const lines = [
    progressJudgement ? `Progress level: ${progressJudgement}` : "",
    safe(draft.parentNote) ? `Parent note: ${safe(draft.parentNote)}` : "",
    existingReflection ? `Learner reflection: ${existingReflection}` : "",
    safe(draft.sourceType) ? `Source: ${safe(draft.sourceType)}` : "",
  ];

  return lines.filter(Boolean).join("\n") || null;
}

export function buildUnifiedCaptureEvidenceInput(
  draft: UnifiedCaptureDraft,
): CleanEvidenceEntryInput {
  const familyId = safe(draft.familyId);
  const learnerId = safe(draft.learnerId);
  const whatHappened = safe(draft.whatHappened);
  const observedOn = normalizeUnifiedCaptureDate(draft.activityDate);

  if (!familyId) {
    throw new Error("A family workspace is required before recording learning.");
  }

  if (!learnerId) {
    throw new Error("Choose the learner who completed the learning.");
  }

  if (!whatHappened) {
    throw new Error("Add what happened before recording learning.");
  }

  return {
    learnerId,
    observedOn,
    title: safe(draft.title) || null,
    whatHappened,
    reflection: buildUnifiedCaptureReflection(draft),
    learningArea: safe(draft.learningArea) || null,
    programId: safe(draft.programId) || null,
    calendarItemId: safe(draft.calendarItemId) || null,
    curriculumNodeIds: draft.curriculumNodeIds ?? [],
    includeInPortfolio: draft.includeInPortfolio === true,
    includeInReport: draft.includeInReport === true,
  };
}

export function buildUnifiedCaptureIdempotencyKey(draft: UnifiedCaptureDraft) {
  const explicitKey = safe(draft.clientSubmissionId);
  if (explicitKey) return explicitKey;

  return [
    safe(draft.familyId),
    safe(draft.learnerId),
    normalizeUnifiedCaptureDate(draft.activityDate),
    safe(draft.sourceType) || "manual",
    safe(draft.sourceId),
    safe(draft.pathwayStepId),
    safe(draft.stepKey),
  ].join("::");
}

export async function saveUnifiedLearningCapture(
  draft: UnifiedCaptureDraft,
  options: SaveUnifiedCaptureOptions = {},
): Promise<UnifiedCaptureSaveResult> {
  const familyId = safe(draft.familyId);
  const entryId = safe(options.entryId);
  const key = entryId ? "" : buildUnifiedCaptureIdempotencyKey(draft);
  const existingSave = key ? inFlightSaves.get(key) : null;

  if (existingSave) {
    const result = await existingSave;
    return { ...result, duplicate: true };
  }

  const savePromise = (async () => {
    const input = buildUnifiedCaptureEvidenceInput(draft);
    const progressJudgement = normalizeProgressJudgementValue(draft.progressJudgement);

    if (entryId) {
      const update = input satisfies CleanEvidenceEntryUpdate;
      const entry = await (options.updateEntry ?? updateCleanEvidenceEntry)(
        familyId,
        entryId,
        update,
      );
      return { entry, duplicate: false, progressJudgement };
    }

    const entry = await (options.createEntry ?? createCleanEvidenceEntry)(familyId, input);
    return { entry, duplicate: false, progressJudgement };
  })();

  if (key) {
    inFlightSaves.set(key, savePromise);
  }

  try {
    return await savePromise;
  } finally {
    if (key) {
      inFlightSaves.delete(key);
    }
  }
}
