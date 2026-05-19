import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  isCleanSchemaMissingError,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  CLEAN_ASSESSMENT_STAGE_KEYS,
  CLEAN_ASSESSMENT_STATUS_VALUES,
  CLEAN_ASSESSMENT_SUBJECT_KEYS,
  type CleanAssessmentSkillStatus,
  type CleanAssessmentStageKey,
  type CleanAssessmentStatusValue,
  type CleanAssessmentSubjectKey,
  type ListCleanAssessmentSkillStatusesOptions,
  type UpsertCleanAssessmentSkillStatusInput,
} from "@/lib/clean/assessments/types";

type AssessmentSkillStatusRow = {
  id: string;
  family_id: string;
  learner_id: string;
  subject_key: string;
  skill_key: string;
  stage_key: string;
  status: string;
  note?: string | null;
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

function normalizeSubjectKey(value: unknown): CleanAssessmentSubjectKey {
  const subjectKey = safe(value);
  return CLEAN_ASSESSMENT_SUBJECT_KEYS.includes(subjectKey as CleanAssessmentSubjectKey)
    ? (subjectKey as CleanAssessmentSubjectKey)
    : "mathematics";
}

function normalizeStageKey(value: unknown): CleanAssessmentStageKey {
  const stageKey = safe(value);
  return CLEAN_ASSESSMENT_STAGE_KEYS.includes(stageKey as CleanAssessmentStageKey)
    ? (stageKey as CleanAssessmentStageKey)
    : "Middle Primary";
}

function normalizeStatusValue(value: unknown): CleanAssessmentStatusValue {
  const status = safe(value);
  return CLEAN_ASSESSMENT_STATUS_VALUES.includes(status as CleanAssessmentStatusValue)
    ? (status as CleanAssessmentStatusValue)
    : "Not assessed yet";
}

function toCleanAssessmentSkillStatus(
  row: AssessmentSkillStatusRow,
): CleanAssessmentSkillStatus {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    subjectKey: normalizeSubjectKey(row.subject_key),
    skillKey: safe(row.skill_key),
    stageKey: normalizeStageKey(row.stage_key),
    status: normalizeStatusValue(row.status),
    note: normalizeNullString(row.note),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
  };
}

function sortStatuses(items: CleanAssessmentSkillStatus[]) {
  return [...items].sort((left, right) => {
    const updatedCompare = (right.updatedAt || "").localeCompare(left.updatedAt || "");
    if (updatedCompare !== 0) return updatedCompare;

    const subjectCompare = left.subjectKey.localeCompare(right.subjectKey);
    if (subjectCompare !== 0) return subjectCompare;

    const skillCompare = left.skillKey.localeCompare(right.skillKey);
    if (skillCompare !== 0) return skillCompare;

    return left.stageKey.localeCompare(right.stageKey);
  });
}

export async function listCleanAssessmentSkillStatuses(
  familyId: string,
  learnerId: string,
  options: ListCleanAssessmentSkillStatusesOptions = {},
) {
  const normalizedFamilyId = safe(familyId);
  const normalizedLearnerId = safe(learnerId);

  if (!normalizedFamilyId || !normalizedLearnerId) {
    return [] satisfies CleanAssessmentSkillStatus[];
  }

  let query = supabase
    .from("assessment_skill_statuses")
    .select(
      "id,family_id,learner_id,subject_key,skill_key,stage_key,status,note,created_by_user_id,created_at,updated_at",
    )
    .eq("family_id", normalizedFamilyId)
    .eq("learner_id", normalizedLearnerId)
    .order("updated_at", { ascending: false });

  const subjectKey = safe(options.subjectKey);
  if (subjectKey) {
    query = query.eq("subject_key", subjectKey);
  }

  const response = await query;

  if (response.error) {
    if (isCleanSchemaMissingError(response.error)) {
      return [] satisfies CleanAssessmentSkillStatus[];
    }

    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "We could not load saved assessment skill statuses just now.",
      ),
    );
  }

  return sortStatuses(
    (response.data ?? []).map((row) =>
      toCleanAssessmentSkillStatus(row as AssessmentSkillStatusRow),
    ),
  );
}

export async function upsertCleanAssessmentSkillStatus(
  familyId: string,
  input: UpsertCleanAssessmentSkillStatusInput,
) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before saving a skill status.");
  }

  const normalizedFamilyId = safe(familyId);
  const learnerId = safe(input.learnerId);
  const skillKey = safe(input.skillKey);

  if (!normalizedFamilyId) {
    throw new Error("A family profile is required.");
  }

  if (!learnerId) {
    throw new Error("A learner is required.");
  }

  if (!skillKey) {
    throw new Error("A skill is required.");
  }

  const response = await supabase
    .from("assessment_skill_statuses")
    .upsert(
      {
        family_id: normalizedFamilyId,
        learner_id: learnerId,
        subject_key: normalizeSubjectKey(input.subjectKey),
        skill_key: skillKey,
        stage_key: normalizeStageKey(input.stageKey),
        status: normalizeStatusValue(input.status),
        note: normalizeNullString(input.note),
        created_by_user_id: currentUserId,
      },
      {
        onConflict: "family_id,learner_id,subject_key,skill_key,stage_key",
      },
    )
    .select(
      "id,family_id,learner_id,subject_key,skill_key,stage_key,status,note,created_by_user_id,created_at,updated_at",
    )
    .maybeSingle();

  if (response.error || !response.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        response.error,
        "Unable to save the skill status.",
      ),
    );
  }

  return toCleanAssessmentSkillStatus(response.data as AssessmentSkillStatusRow);
}
