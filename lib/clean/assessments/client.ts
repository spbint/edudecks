import { supabase } from "@/lib/supabaseClient";
import {
  getCurrentCleanUserId,
  isCleanSchemaMissingError,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  CLEAN_ASSESSMENT_LEGACY_STAGE_MAP,
  CLEAN_ASSESSMENT_STAGE_KEYS,
  CLEAN_ASSESSMENT_STATUS_VALUES,
  CLEAN_ASSESSMENT_SUBJECT_KEYS,
  type CleanAssessmentEvidenceLink,
  type CleanAssessmentSkillStatus,
  type CleanAssessmentStageKey,
  type CleanAssessmentStatusValue,
  type CleanAssessmentSubjectKey,
  type ListCleanAssessmentSkillStatusesOptions,
  type UpsertCleanAssessmentSkillStatusInput,
} from "@/lib/clean/assessments/types";
import { parsePathwayStepId } from "@/lib/clean/pathways/pathwayStepRegistry";

type AssessmentSkillStatusRow = {
  id: string;
  family_id: string;
  learner_id: string;
  subject_key: string;
  skill_key: string;
  stage_key: string;
  pathway_step_id?: string | null;
  strand_key?: string | null;
  step_key?: string | null;
  status: string;
  note?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

const ASSESSMENT_STATUS_SELECT = [
  "id",
  "family_id",
  "learner_id",
  "subject_key",
  "skill_key",
  "stage_key",
  "pathway_step_id",
  "strand_key",
  "step_key",
  "status",
  "note",
  "created_by_user_id",
  "created_at",
  "updated_at",
].join(",");

const ASSESSMENT_STATUS_LEGACY_SELECT = [
  "id",
  "family_id",
  "learner_id",
  "subject_key",
  "skill_key",
  "stage_key",
  "status",
  "note",
  "created_by_user_id",
  "created_at",
  "updated_at",
].join(",");

const ASSESSMENT_SOURCE_CONTEXT = "my-assessments" as const;
const ASSESSMENT_SOURCE_PREFIX = "assessment-source:";
const ASSESSMENT_STATUS_RECORD_PREFIX = "assessment-status-record:";
const ASSESSMENT_STATUS_SAVED_AT_PREFIX = "assessment-status-saved-at:";
const ASSESSMENT_SUBJECT_PREFIX = "assessment-subject:";
const ASSESSMENT_SKILL_PREFIX = "assessment-skill:";
const ASSESSMENT_STAGE_PREFIX = "assessment-stage:";
const ASSESSMENT_STATUS_PREFIX = "assessment-status:";

const ASSESSMENT_EVIDENCE_PREFIXES = [
  ASSESSMENT_SOURCE_PREFIX,
  ASSESSMENT_STATUS_RECORD_PREFIX,
  ASSESSMENT_STATUS_SAVED_AT_PREFIX,
  ASSESSMENT_SUBJECT_PREFIX,
  ASSESSMENT_SKILL_PREFIX,
  ASSESSMENT_STAGE_PREFIX,
  ASSESSMENT_STATUS_PREFIX,
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeNullString(value: unknown) {
  const text = safe(value);
  return text || null;
}

function encodeNodeValue(value: string) {
  return encodeURIComponent(value);
}

function decodeNodeValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function dedupeNodeIds(nodeIds: string[]) {
  return [...new Set(nodeIds.map((nodeId) => safe(nodeId)).filter(Boolean))];
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

function normalizeStatusValue(value: unknown): CleanAssessmentStatusValue {
  const status = safe(value);
  return CLEAN_ASSESSMENT_STATUS_VALUES.includes(status as CleanAssessmentStatusValue)
    ? (status as CleanAssessmentStatusValue)
    : "Not assessed yet";
}

function isAssessmentPathwayColumnMissingError(error: unknown) {
  const message = safe((error as { message?: unknown })?.message).toLowerCase();
  return (
    message.includes("pathway_step_id") ||
    message.includes("strand_key") ||
    message.includes("step_key")
  );
}

export function buildAssessmentEvidenceLinkKey(
  statusRecordId: string,
  statusSavedAt: string | null,
) {
  const normalizedStatusRecordId = safe(statusRecordId);
  if (!normalizedStatusRecordId) return "";

  return `${normalizedStatusRecordId}::${safe(statusSavedAt)}`;
}

export function encodeAssessmentEvidenceNodeIds(
  existingNodeIds: string[],
  link: CleanAssessmentEvidenceLink,
) {
  const preservedNodeIds = existingNodeIds.filter(
    (nodeId) =>
      !ASSESSMENT_EVIDENCE_PREFIXES.some((prefix) => safe(nodeId).startsWith(prefix)),
  );

  const nextNodeIds = [...preservedNodeIds, `${ASSESSMENT_SOURCE_PREFIX}${ASSESSMENT_SOURCE_CONTEXT}`];

  if (safe(link.statusRecordId)) {
    nextNodeIds.push(
      `${ASSESSMENT_STATUS_RECORD_PREFIX}${encodeNodeValue(safe(link.statusRecordId))}`,
    );
  }

  if (safe(link.statusSavedAt)) {
    nextNodeIds.push(
      `${ASSESSMENT_STATUS_SAVED_AT_PREFIX}${encodeNodeValue(safe(link.statusSavedAt))}`,
    );
  }

  if (safe(link.subjectKey)) {
    nextNodeIds.push(`${ASSESSMENT_SUBJECT_PREFIX}${encodeNodeValue(safe(link.subjectKey))}`);
  }

  if (safe(link.skillKey)) {
    nextNodeIds.push(`${ASSESSMENT_SKILL_PREFIX}${encodeNodeValue(safe(link.skillKey))}`);
  }

  if (safe(link.stageKey)) {
    nextNodeIds.push(`${ASSESSMENT_STAGE_PREFIX}${encodeNodeValue(safe(link.stageKey))}`);
  }

  if (safe(link.assessmentStatus)) {
    nextNodeIds.push(
      `${ASSESSMENT_STATUS_PREFIX}${encodeNodeValue(safe(link.assessmentStatus))}`,
    );
  }

  return dedupeNodeIds(nextNodeIds);
}

export function parseAssessmentEvidenceLinkFromNodeIds(nodeIds: string[]) {
  let sourceContext = "";
  let statusRecordId = "";
  let statusSavedAt: string | null = null;
  let subjectKey = "";
  let skillKey = "";
  let stageKey = "";
  let assessmentStatus = "";

  for (const nodeId of nodeIds) {
    const normalizedNodeId = safe(nodeId);
    if (!normalizedNodeId) continue;

    if (normalizedNodeId.startsWith(ASSESSMENT_SOURCE_PREFIX)) {
      sourceContext = safe(normalizedNodeId.slice(ASSESSMENT_SOURCE_PREFIX.length));
      continue;
    }

    if (normalizedNodeId.startsWith(ASSESSMENT_STATUS_RECORD_PREFIX)) {
      statusRecordId = decodeNodeValue(
        normalizedNodeId.slice(ASSESSMENT_STATUS_RECORD_PREFIX.length),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(ASSESSMENT_STATUS_SAVED_AT_PREFIX)) {
      statusSavedAt = normalizeNullString(
        decodeNodeValue(normalizedNodeId.slice(ASSESSMENT_STATUS_SAVED_AT_PREFIX.length)),
      );
      continue;
    }

    if (normalizedNodeId.startsWith(ASSESSMENT_SUBJECT_PREFIX)) {
      subjectKey = decodeNodeValue(normalizedNodeId.slice(ASSESSMENT_SUBJECT_PREFIX.length));
      continue;
    }

    if (normalizedNodeId.startsWith(ASSESSMENT_SKILL_PREFIX)) {
      skillKey = decodeNodeValue(normalizedNodeId.slice(ASSESSMENT_SKILL_PREFIX.length));
      continue;
    }

    if (normalizedNodeId.startsWith(ASSESSMENT_STAGE_PREFIX)) {
      stageKey = decodeNodeValue(normalizedNodeId.slice(ASSESSMENT_STAGE_PREFIX.length));
      continue;
    }

    if (normalizedNodeId.startsWith(ASSESSMENT_STATUS_PREFIX)) {
      assessmentStatus = decodeNodeValue(normalizedNodeId.slice(ASSESSMENT_STATUS_PREFIX.length));
    }
  }

  if (
    sourceContext !== ASSESSMENT_SOURCE_CONTEXT ||
    !safe(statusRecordId) ||
    !safe(subjectKey) ||
    !safe(skillKey) ||
    !safe(stageKey) ||
    !safe(assessmentStatus)
  ) {
    return null;
  }

  return {
    sourceContext: ASSESSMENT_SOURCE_CONTEXT,
    statusRecordId: safe(statusRecordId),
    statusSavedAt,
    subjectKey: normalizeSubjectKey(subjectKey),
    skillKey: safe(skillKey),
    stageKey: normalizeStageKey(stageKey),
    assessmentStatus: normalizeStatusValue(assessmentStatus),
  } satisfies CleanAssessmentEvidenceLink;
}

function toCleanAssessmentSkillStatus(
  row: AssessmentSkillStatusRow,
): CleanAssessmentSkillStatus {
  const subjectKey = normalizeSubjectKey(row.subject_key);
  const skillKey = safe(row.skill_key);
  const pathwayStepId = safe(row.pathway_step_id) || skillKey;
  const parsedPathwayStep = parsePathwayStepId(pathwayStepId);
  const canonicalPathwayStep =
    parsedPathwayStep && parsedPathwayStep.subjectKey === subjectKey ? parsedPathwayStep : null;

  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    learnerId: safe(row.learner_id),
    subjectKey,
    skillKey,
    stageKey: normalizeStageKey(row.stage_key),
    status: normalizeStatusValue(row.status),
    note: normalizeNullString(row.note),
    createdByUserId: safe(row.created_by_user_id),
    createdAt: normalizeNullString(row.created_at),
    updatedAt: normalizeNullString(row.updated_at),
    pathwayStepId: canonicalPathwayStep ? pathwayStepId : null,
    strandKey: normalizeNullString(row.strand_key) || canonicalPathwayStep?.strandKey || null,
    stepKey: normalizeNullString(row.step_key) || canonicalPathwayStep?.stepKey || null,
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
    .select(ASSESSMENT_STATUS_SELECT)
    .eq("family_id", normalizedFamilyId)
    .eq("learner_id", normalizedLearnerId)
    .order("updated_at", { ascending: false });

  const subjectKey = safe(options.subjectKey);
  if (subjectKey) {
    query = query.eq("subject_key", subjectKey);
  }

  let response = await query;

  if (response.error && isAssessmentPathwayColumnMissingError(response.error)) {
    let legacyQuery = supabase
      .from("assessment_skill_statuses")
      .select(ASSESSMENT_STATUS_LEGACY_SELECT)
      .eq("family_id", normalizedFamilyId)
      .eq("learner_id", normalizedLearnerId)
      .order("updated_at", { ascending: false });

    if (subjectKey) {
      legacyQuery = legacyQuery.eq("subject_key", subjectKey);
    }

    response = await legacyQuery;
  }

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
      toCleanAssessmentSkillStatus(row as unknown as AssessmentSkillStatusRow),
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
  const subjectKey = normalizeSubjectKey(input.subjectKey);
  const pathwayStepId = safe(input.pathwayStepId) || skillKey;
  const parsedPathwayStep = parsePathwayStepId(pathwayStepId);
  const canonicalPathwayStep =
    parsedPathwayStep && parsedPathwayStep.subjectKey === subjectKey ? parsedPathwayStep : null;

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
        subject_key: subjectKey,
        skill_key: skillKey,
        stage_key: normalizeStageKey(input.stageKey),
        pathway_step_id: normalizeNullString(canonicalPathwayStep ? pathwayStepId : ""),
        strand_key: normalizeNullString(
          safe(input.strandKey) || canonicalPathwayStep?.strandKey,
        ),
        step_key: normalizeNullString(
          safe(input.stepKey) || canonicalPathwayStep?.stepKey,
        ),
        status: normalizeStatusValue(input.status),
        note: normalizeNullString(input.note),
        created_by_user_id: currentUserId,
      },
      {
        onConflict: "family_id,learner_id,subject_key,skill_key,stage_key",
      },
    )
    .select(ASSESSMENT_STATUS_SELECT)
    .maybeSingle();

  const fallbackResponse =
    response.error && isAssessmentPathwayColumnMissingError(response.error)
      ? await supabase
          .from("assessment_skill_statuses")
          .upsert(
            {
              family_id: normalizedFamilyId,
              learner_id: learnerId,
              subject_key: subjectKey,
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
          .select(ASSESSMENT_STATUS_LEGACY_SELECT)
          .maybeSingle()
      : response;

  if (fallbackResponse.error || !fallbackResponse.data) {
    throw new Error(
      normalizeCleanErrorMessage(
        fallbackResponse.error,
        "Unable to save the skill status.",
      ),
    );
  }

  return toCleanAssessmentSkillStatus(
    fallbackResponse.data as unknown as AssessmentSkillStatusRow,
  );
}
