import { supabase } from "@/lib/supabaseClient";
import {
  CLEAN_ASSESSMENT_LEGACY_STAGE_MAP,
  CLEAN_ASSESSMENT_STAGE_KEYS,
  CLEAN_ASSESSMENT_SUBJECT_KEYS,
  type CleanAssessmentStageKey,
  type CleanAssessmentSubjectKey,
} from "@/lib/clean/assessments/types";
import {
  CLEAN_ASSESSMENT_ATTEMPT_LOCAL_RESULTS,
  CLEAN_ASSESSMENT_ATTEMPT_MODES,
  CLEAN_ASSESSMENT_ATTEMPT_STATUSES,
  type AssessmentAttemptLocalResult,
  type AssessmentAttemptMode,
  type AssessmentAttemptStatus,
  type CleanAssessmentAttempt,
  type CleanAssessmentAttemptResponse,
  type CleanAssessmentAttemptSnapshot,
  type CleanAssessmentAttemptWithResponses,
  type CompleteCleanAssessmentAttemptInput,
  type CreateCleanAssessmentAttemptInput,
  type CreateCleanAssessmentAttemptResponsesInput,
  type ListCleanAssessmentAttemptsOptions,
} from "@/lib/clean/assessments/attemptTypes";
import {
  getCurrentCleanUserId,
  isCleanSchemaMissingError,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";

type AssessmentAttemptRow = {
  id: string;
  family_id: string;
  learner_id: string;
  subject_key: string;
  strand_key: string;
  stage_key: string;
  pathway_step_id: string;
  step_key: string;
  progression_band_key?: string | null;
  item_bank_key: string;
  mode: string;
  source_route?: string | null;
  status: string;
  item_count?: number | null;
  attempted_count?: number | null;
  auto_correct_count?: number | null;
  auto_incorrect_count?: number | null;
  review_needed_count?: number | null;
  summary_snapshot?: unknown;
  started_at?: string | null;
  completed_at?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type AssessmentAttemptResponseRow = {
  id: string;
  family_id: string;
  learner_id: string;
  assessment_attempt_id: string;
  item_id: string;
  item_order?: number | null;
  progression_step_key?: string | null;
  answer_type: string;
  local_result: string;
  response_text?: string | null;
  selected_option?: string | null;
  item_snapshot?: unknown;
  submitted_at?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

const ATTEMPT_SELECT = [
  "id",
  "family_id",
  "learner_id",
  "subject_key",
  "strand_key",
  "stage_key",
  "pathway_step_id",
  "step_key",
  "progression_band_key",
  "item_bank_key",
  "mode",
  "source_route",
  "status",
  "item_count",
  "attempted_count",
  "auto_correct_count",
  "auto_incorrect_count",
  "review_needed_count",
  "summary_snapshot",
  "started_at",
  "completed_at",
  "created_by_user_id",
  "created_at",
  "updated_at",
].join(",");

const RESPONSE_SELECT = [
  "id",
  "family_id",
  "learner_id",
  "assessment_attempt_id",
  "item_id",
  "item_order",
  "progression_step_key",
  "answer_type",
  "local_result",
  "response_text",
  "selected_option",
  "item_snapshot",
  "submitted_at",
  "created_by_user_id",
  "created_at",
  "updated_at",
].join(",");

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function normalizeNonNegativeInteger(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;

  const rounded = Math.max(0, Math.trunc(numberValue));
  return rounded;
}

function normalizeSnapshot(value: unknown): CleanAssessmentAttemptSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as CleanAssessmentAttemptSnapshot;
}

function normalizeSubjectKey(value: unknown): CleanAssessmentSubjectKey {
  const subjectKey = safe(value);
  return CLEAN_ASSESSMENT_SUBJECT_KEYS.includes(subjectKey as CleanAssessmentSubjectKey)
    ? (subjectKey as CleanAssessmentSubjectKey)
    : "mathematics";
}

function normalizeStageKey(value: unknown): CleanAssessmentStageKey {
  const stageKey = safe(value);
  const normalizedLegacyKey = CLEAN_ASSESSMENT_LEGACY_STAGE_MAP[stageKey.toLowerCase()];
  if (normalizedLegacyKey) {
    return normalizedLegacyKey;
  }

  return CLEAN_ASSESSMENT_STAGE_KEYS.includes(stageKey as CleanAssessmentStageKey)
    ? (stageKey as CleanAssessmentStageKey)
    : "middle-primary";
}

function normalizeAttemptMode(value: unknown): AssessmentAttemptMode {
  const mode = safe(value);
  return CLEAN_ASSESSMENT_ATTEMPT_MODES.includes(mode as AssessmentAttemptMode)
    ? (mode as AssessmentAttemptMode)
    : "diagnostic";
}

function normalizeAttemptStatus(value: unknown): AssessmentAttemptStatus {
  const status = safe(value);
  return CLEAN_ASSESSMENT_ATTEMPT_STATUSES.includes(status as AssessmentAttemptStatus)
    ? (status as AssessmentAttemptStatus)
    : "completed";
}

function normalizeLocalResult(value: unknown): AssessmentAttemptLocalResult {
  const result = safe(value);
  return CLEAN_ASSESSMENT_ATTEMPT_LOCAL_RESULTS.includes(
    result as AssessmentAttemptLocalResult,
  )
    ? (result as AssessmentAttemptLocalResult)
    : "unanswered";
}

function sortAssessmentAttempts(items: CleanAssessmentAttempt[]) {
  return [...items].sort((left, right) => {
    const leftTime =
      Date.parse(left.completedAt || "") ||
      Date.parse(left.createdAt || "") ||
      Date.parse(left.updatedAt || "") ||
      0;
    const rightTime =
      Date.parse(right.completedAt || "") ||
      Date.parse(right.createdAt || "") ||
      Date.parse(right.updatedAt || "") ||
      0;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return left.id.localeCompare(right.id);
  });
}

function sortAssessmentAttemptResponses(items: CleanAssessmentAttemptResponse[]) {
  return [...items].sort((left, right) => {
    if (left.itemOrder !== right.itemOrder) {
      return left.itemOrder - right.itemOrder;
    }

    const leftTime = Date.parse(left.createdAt || "") || 0;
    const rightTime = Date.parse(right.createdAt || "") || 0;

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.id.localeCompare(right.id);
  });
}

function mapAssessmentAttemptRow(row: AssessmentAttemptRow): CleanAssessmentAttempt {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    subjectKey: normalizeSubjectKey(row.subject_key),
    strandKey: safe(row.strand_key),
    stageKey: normalizeStageKey(row.stage_key),
    pathwayStepId: safe(row.pathway_step_id),
    stepKey: safe(row.step_key),
    progressionBandKey: normalizeNullString(row.progression_band_key),
    itemBankKey: safe(row.item_bank_key),
    mode: normalizeAttemptMode(row.mode),
    sourceRoute: normalizeNullString(row.source_route),
    status: normalizeAttemptStatus(row.status),
    itemCount: normalizeNonNegativeInteger(row.item_count),
    attemptedCount: normalizeNonNegativeInteger(row.attempted_count),
    autoCorrectCount: normalizeNonNegativeInteger(row.auto_correct_count),
    autoIncorrectCount: normalizeNonNegativeInteger(row.auto_incorrect_count),
    reviewNeededCount: normalizeNonNegativeInteger(row.review_needed_count),
    summarySnapshot: normalizeSnapshot(row.summary_snapshot),
    startedAt: normalizeNullString(row.started_at),
    completedAt: normalizeNullString(row.completed_at),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function mapAssessmentAttemptResponseRow(
  row: AssessmentAttemptResponseRow,
): CleanAssessmentAttemptResponse {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    assessmentAttemptId: safe(row.assessment_attempt_id),
    itemId: safe(row.item_id),
    itemOrder: Math.max(1, normalizeNonNegativeInteger(row.item_order, 1)),
    progressionStepKey: normalizeNullString(row.progression_step_key),
    answerType: safe(row.answer_type),
    localResult: normalizeLocalResult(row.local_result),
    responseText: normalizeNullString(row.response_text),
    selectedOption: normalizeNullString(row.selected_option),
    itemSnapshot: normalizeSnapshot(row.item_snapshot),
    submittedAt: normalizeNullString(row.submitted_at),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

async function resolveWriteUserId(preferredUserId?: string | null) {
  const explicitUserId = safe(preferredUserId);
  if (explicitUserId) return explicitUserId;

  const currentUserId = await getCurrentCleanUserId();
  return safe(currentUserId) || null;
}

export async function createAssessmentAttempt(
  familyId: string,
  input: CreateCleanAssessmentAttemptInput,
) {
  const createdByUserId = await resolveWriteUserId(input.createdByUserId);
  if (!createdByUserId) {
    throw new Error("You need to sign in before saving an assessment attempt.");
  }

  const normalizedFamilyId = safe(familyId);
  const learnerId = safe(input.learnerId);
  const strandKey = safe(input.strandKey);
  const pathwayStepId = safe(input.pathwayStepId);
  const stepKey = safe(input.stepKey);
  const itemBankKey = safe(input.itemBankKey);

  if (!normalizedFamilyId) {
    throw new Error("A family profile is required.");
  }

  if (!learnerId) {
    throw new Error("A learner is required.");
  }

  if (!strandKey) {
    throw new Error("A strand is required.");
  }

  if (!pathwayStepId) {
    throw new Error("A pathway step is required.");
  }

  if (!stepKey) {
    throw new Error("A step key is required.");
  }

  if (!itemBankKey) {
    throw new Error("An item bank key is required.");
  }

  const response = await supabase
    .from("assessment_attempts")
    .insert({
      family_id: normalizedFamilyId,
      learner_id: learnerId,
      subject_key: normalizeSubjectKey(input.subjectKey),
      strand_key: strandKey,
      stage_key: normalizeStageKey(input.stageKey),
      pathway_step_id: pathwayStepId,
      step_key: stepKey,
      progression_band_key: normalizeNullString(input.progressionBandKey),
      item_bank_key: itemBankKey,
      mode: normalizeAttemptMode(input.mode),
      source_route: normalizeNullString(input.sourceRoute),
      status: normalizeAttemptStatus(input.status),
      item_count: normalizeNonNegativeInteger(input.itemCount),
      attempted_count: normalizeNonNegativeInteger(input.attemptedCount),
      auto_correct_count: normalizeNonNegativeInteger(input.autoCorrectCount),
      auto_incorrect_count: normalizeNonNegativeInteger(input.autoIncorrectCount),
      review_needed_count: normalizeNonNegativeInteger(input.reviewNeededCount),
      summary_snapshot: normalizeSnapshot(input.summarySnapshot),
      started_at: normalizeNullString(input.startedAt),
      completed_at: normalizeNullString(input.completedAt),
      created_by_user_id: createdByUserId,
    })
    .select(ATTEMPT_SELECT)
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to create the assessment attempt.",
      ),
    );
  }

  return mapAssessmentAttemptRow(
    response.data as unknown as AssessmentAttemptRow,
  );
}

export async function createAssessmentAttemptResponses(
  familyId: string,
  input: CreateCleanAssessmentAttemptResponsesInput,
) {
  const createdByUserId = await resolveWriteUserId(input.createdByUserId);
  if (!createdByUserId) {
    throw new Error("You need to sign in before saving assessment responses.");
  }

  const normalizedFamilyId = safe(familyId);
  const learnerId = safe(input.learnerId);
  const assessmentAttemptId = safe(input.assessmentAttemptId);

  if (!normalizedFamilyId) {
    throw new Error("A family profile is required.");
  }

  if (!learnerId) {
    throw new Error("A learner is required.");
  }

  if (!assessmentAttemptId) {
    throw new Error("An assessment attempt is required.");
  }

  if (!input.responses.length) {
    return [] satisfies CleanAssessmentAttemptResponse[];
  }

  const payload = input.responses.map((responseInput) => ({
    family_id: normalizedFamilyId,
    learner_id: learnerId,
    assessment_attempt_id: assessmentAttemptId,
    item_id: safe(responseInput.itemId),
    item_order: Math.max(1, normalizeNonNegativeInteger(responseInput.itemOrder, 1)),
    progression_step_key: normalizeNullString(responseInput.progressionStepKey),
    answer_type: safe(responseInput.answerType),
    local_result: normalizeLocalResult(responseInput.localResult),
    response_text: normalizeNullString(responseInput.responseText),
    selected_option: normalizeNullString(responseInput.selectedOption),
    item_snapshot: normalizeSnapshot(responseInput.itemSnapshot),
    submitted_at: normalizeNullString(responseInput.submittedAt),
    created_by_user_id: createdByUserId,
  }));

  const response = await supabase
    .from("assessment_attempt_responses")
    .insert(payload)
    .select(RESPONSE_SELECT);

  if (response.error) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to save the assessment attempt responses.",
      ),
    );
  }

  return sortAssessmentAttemptResponses(
    (response.data ?? []).map((row) =>
      mapAssessmentAttemptResponseRow(
        row as unknown as AssessmentAttemptResponseRow,
      ),
    ),
  );
}

export async function completeAssessmentAttempt(
  familyId: string,
  input: CompleteCleanAssessmentAttemptInput,
) {
  const normalizedFamilyId = safe(familyId);
  const attemptId = safe(input.attemptId);

  if (!normalizedFamilyId) {
    throw new Error("A family profile is required.");
  }

  if (!attemptId) {
    throw new Error("An assessment attempt is required.");
  }

  const completedAt = normalizeNullString(input.completedAt) || new Date().toISOString();

  const updatePayload = {
    status: "completed",
    completed_at: completedAt,
    item_count:
      input.itemCount === undefined
        ? undefined
        : normalizeNonNegativeInteger(input.itemCount),
    attempted_count: normalizeNonNegativeInteger(input.attemptedCount),
    auto_correct_count: normalizeNonNegativeInteger(input.autoCorrectCount),
    auto_incorrect_count: normalizeNonNegativeInteger(input.autoIncorrectCount),
    review_needed_count: normalizeNonNegativeInteger(input.reviewNeededCount),
    summary_snapshot: normalizeSnapshot(input.summarySnapshot),
  };

  const response = await supabase
    .from("assessment_attempts")
    .update(
      Object.fromEntries(
        Object.entries(updatePayload).filter(([, value]) => value !== undefined),
      ),
    )
    .eq("family_id", normalizedFamilyId)
    .eq("id", attemptId)
    .select(ATTEMPT_SELECT)
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to complete the assessment attempt.",
      ),
    );
  }

  return mapAssessmentAttemptRow(
    response.data as unknown as AssessmentAttemptRow,
  );
}

export async function listAssessmentAttemptsForLearner(
  familyId: string,
  options: ListCleanAssessmentAttemptsOptions,
) {
  const normalizedFamilyId = safe(familyId);
  const learnerId = safe(options.learnerId);

  if (!normalizedFamilyId || !learnerId) {
    return [] satisfies CleanAssessmentAttempt[];
  }

  let query = supabase
    .from("assessment_attempts")
    .select(ATTEMPT_SELECT)
    .eq("family_id", normalizedFamilyId)
    .eq("learner_id", learnerId)
    .order("created_at", { ascending: false });

  const pathwayStepId = safe(options.pathwayStepId);
  const subjectKey = safe(options.subjectKey);
  const strandKey = safe(options.strandKey);
  const stageKey = safe(options.stageKey);
  const stepKey = safe(options.stepKey);
  const progressionBandKey = safe(options.progressionBandKey);
  const itemBankKey = safe(options.itemBankKey);
  const status = safe(options.status);
  const sourceRoute = safe(options.sourceRoute);

  if (subjectKey) {
    query = query.eq("subject_key", normalizeSubjectKey(subjectKey));
  }

  if (strandKey) {
    query = query.eq("strand_key", strandKey);
  }

  if (stageKey) {
    query = query.eq("stage_key", normalizeStageKey(stageKey));
  }

  if (pathwayStepId) {
    query = query.eq("pathway_step_id", pathwayStepId);
  }

  if (stepKey) {
    query = query.eq("step_key", stepKey);
  }

  if (progressionBandKey) {
    query = query.eq("progression_band_key", progressionBandKey);
  }

  if (itemBankKey) {
    query = query.eq("item_bank_key", itemBankKey);
  }

  if (sourceRoute) {
    query = query.eq("source_route", sourceRoute);
  }

  if (status) {
    query = query.eq("status", normalizeAttemptStatus(status));
  }

  if (typeof options.limit === "number" && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const response = await query;

  if (response.error) {
    if (isCleanSchemaMissingError(response.error)) {
      return [] satisfies CleanAssessmentAttempt[];
    }

    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load saved assessment attempts just now.",
      ),
    );
  }

  return sortAssessmentAttempts(
    (response.data ?? []).map((row) =>
      mapAssessmentAttemptRow(row as unknown as AssessmentAttemptRow),
    ),
  );
}

export async function getAssessmentAttemptWithResponses(
  familyId: string,
  assessmentAttemptId: string,
): Promise<CleanAssessmentAttemptWithResponses> {
  const normalizedFamilyId = safe(familyId);
  const attemptId = safe(assessmentAttemptId);

  if (!normalizedFamilyId || !attemptId) {
    return {
      attempt: null,
      responses: [],
    };
  }

  const attemptResponse = await supabase
    .from("assessment_attempts")
    .select(ATTEMPT_SELECT)
    .eq("family_id", normalizedFamilyId)
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptResponse.error) {
    if (isCleanSchemaMissingError(attemptResponse.error)) {
      return {
        attempt: null,
        responses: [],
      };
    }

    throw new Error(
      normalizeCleanErrorMessage(
        attemptResponse.error,
        "We could not load this assessment attempt just now.",
      ),
    );
  }

  if (!attemptResponse.data) {
    return {
      attempt: null,
      responses: [],
    };
  }

  const responsesResult = await supabase
    .from("assessment_attempt_responses")
    .select(RESPONSE_SELECT)
    .eq("family_id", normalizedFamilyId)
    .eq("assessment_attempt_id", attemptId)
    .order("item_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (responsesResult.error) {
    if (isCleanSchemaMissingError(responsesResult.error)) {
      return {
        attempt: mapAssessmentAttemptRow(
          attemptResponse.data as unknown as AssessmentAttemptRow,
        ),
        responses: [],
      };
    }

    throw new Error(
      normalizeCleanErrorMessage(
        responsesResult.error,
        "We could not load this assessment attempt's responses just now.",
      ),
    );
  }

  return {
    attempt: mapAssessmentAttemptRow(
      attemptResponse.data as unknown as AssessmentAttemptRow,
    ),
    responses: sortAssessmentAttemptResponses(
      (responsesResult.data ?? []).map((row) =>
        mapAssessmentAttemptResponseRow(
          row as unknown as AssessmentAttemptResponseRow,
        ),
      ),
    ),
  };
}
