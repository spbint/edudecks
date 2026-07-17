import type {
  CleanAssessmentSkillStatus,
  CleanAssessmentStatusValue,
} from "@/lib/clean/assessments/types";
import {
  parsePathwayContextFromNodeIds,
  type CleanPathwayCaptureContext,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { PathwayProgressStatus } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import {
  buildPathwayRegistryStepKey,
  buildPathwayStepId,
  getAllPathwaySteps,
  parsePathwayStepId,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  PATHWAY_SUBJECTS,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";

export type UnifiedPathwayStepState = {
  pathwayStepId: string;
  registryItem: PathwayStepRegistryItem;
  assessmentConfidence: CleanAssessmentStatusValue | null;
  assessmentStatusRecord: CleanAssessmentSkillStatus | null;
  linkedEvidenceCount: number;
  linkedEvidenceEntries: CleanEvidenceEntry[];
  latestEvidenceEntry: CleanEvidenceEntry | null;
  latestObservedSkillStatus: CleanAssessmentStatusValue | null;
  pathwayProgressFromEvidence: PathwayProgressStatus | null;
  latestEvidenceProgressLevel: string | null;
  latestEvidenceStatusAt: number;
  latestAssessmentStatusAt: number;
  latestStatusSource: "evidence" | "assessment" | null;
};

export type UnifiedPathwayStepStateIndex = Map<string, UnifiedPathwayStepState>;

export type RecognizedProgressJudgement =
  | "Needs support"
  | "Working towards"
  | "Consolidating"
  | "Secure"
  | "Goal achieved"
  | "Goal achieved + extension";

export type RecognizedProgressJudgementObservation = {
  id: string;
  learnerId: string;
  sourceType: "assessment-status" | "evidence";
  sourceId: string;
  pathwayStepId: string | null;
  subjectTitle: string | null;
  strandTitle: string | null;
  stepTitle: string | null;
  judgement: RecognizedProgressJudgement;
  dateValue: string | null;
  sortValue: number;
};

export type PathwayStrandAssessmentSummary = {
  subjectKey: PathwaySubjectKey;
  subjectTitle: string;
  strandKey: string;
  strandTitle: string;
  strandOrder: number;
  totalSteps: number;
  evidenceLinkedCount: number;
  assessedCount: number;
  secureOrStrongCount: number;
  developingCount: number;
  notAssessedCount: number;
  revisitCount: number;
};

export type PathwaySubjectCurriculumDashboardSummary = {
  subjectKey: PathwaySubjectKey;
  subjectTitle: string;
  subjectOrder: number;
  totalSteps: number;
  evidenceLinkedCount: number;
  assessedCount: number;
  secureOrStrongCount: number;
  developingCount: number;
  notAssessedCount: number;
  revisitCount: number;
  strands: PathwayStrandAssessmentSummary[];
};

type BuildUnifiedPathwayStepStateIndexInput = {
  assessmentStatuses?: CleanAssessmentSkillStatus[];
  evidenceEntries?: CleanEvidenceEntry[];
};

type PathwayStepResolutionInput = {
  subjectKey?: string | null;
  pathwayKey?: string | null;
  stageKey?: string | null;
  stepKey?: string | null;
  stepNumber?: string | null;
  pathwayStepId?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function evidenceSortValue(entry: CleanEvidenceEntry) {
  return (
    Date.parse(safe(entry.updatedAt)) ||
    Date.parse(safe(entry.createdAt)) ||
    Date.parse(`${safe(entry.observedOn)}T00:00:00`) ||
    0
  );
}

function assessmentStatusSortValue(status: CleanAssessmentSkillStatus | null | undefined) {
  return (
    Date.parse(safe(status?.updatedAt)) ||
    Date.parse(safe(status?.createdAt)) ||
    0
  );
}

function normalizeObservedSkillStatus(
  value: string | null | undefined,
): CleanAssessmentStatusValue | null {
  const normalizedValue = safe(value).toLowerCase();

  if (normalizedValue === "not assessed yet") {
    return "Not assessed yet";
  }

  if (normalizedValue === "still developing") {
    return "Still developing";
  }

  if (normalizedValue === "developing") {
    return "Developing";
  }

  if (normalizedValue === "secure") {
    return "Secure";
  }

  if (normalizedValue === "strong") {
    return "Strong";
  }

  return null;
}

function getEvidenceProgressLevel(entry: CleanEvidenceEntry | null | undefined) {
  const text = `${entry?.whatHappened || ""}\n${entry?.reflection || ""}`;
  const match = text.match(/Progress level:\s*([^\n.]+)/i);
  return match?.[1]?.trim() || null;
}

export function normalizeProgressJudgementValue(
  value: string | null | undefined,
): RecognizedProgressJudgement | null {
  const normalizedValue = safe(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!normalizedValue || normalizedValue === "not assessed yet") {
    return null;
  }

  if (normalizedValue === "needs support" || normalizedValue === "still developing") {
    return "Needs support";
  }

  if (normalizedValue === "working towards" || normalizedValue === "developing") {
    return "Working towards";
  }

  if (normalizedValue === "consolidating") {
    return "Consolidating";
  }

  if (normalizedValue === "secure") {
    return "Secure";
  }

  if (normalizedValue === "goal achieved") {
    return "Goal achieved";
  }

  if (normalizedValue === "goal achieved + extension" || normalizedValue === "strong") {
    return "Goal achieved + extension";
  }

  return null;
}

export function isRecognizedProgressJudgement(value: string | null | undefined) {
  return Boolean(normalizeProgressJudgementValue(value));
}

export function getEvidenceProgressJudgement(
  entry: CleanEvidenceEntry | null | undefined,
) {
  const pathwayContext = entry
    ? parsePathwayContextFromNodeIds(entry.curriculumNodeIds)
    : null;

  return (
    normalizeProgressJudgementValue(getEvidenceProgressLevel(entry)) ||
    normalizeProgressJudgementValue(pathwayContext?.observedSkillStatus)
  );
}

export function evidenceHasRecognizedProgressJudgement(
  entry: CleanEvidenceEntry | null | undefined,
) {
  return Boolean(getEvidenceProgressJudgement(entry));
}

export function countRecognizedProgressJudgements(input: {
  assessmentStatuses?: CleanAssessmentSkillStatus[];
  evidenceEntries?: CleanEvidenceEntry[];
  learnerId?: string | null;
}) {
  return buildRecognizedProgressJudgementObservations(input).length;
}

export function resolveEffectiveAssessmentConfidence(
  state: UnifiedPathwayStepState | null | undefined,
): CleanAssessmentStatusValue {
  if (!state) return "Not assessed yet";

  if (state.latestStatusSource === "evidence" && state.latestObservedSkillStatus) {
    return state.latestObservedSkillStatus;
  }

  return state.assessmentConfidence || state.latestObservedSkillStatus || "Not assessed yet";
}

function mapEvidenceProgressLevelToObservedStatus(
  progressLevel: string | null | undefined,
): CleanAssessmentStatusValue | null {
  const normalizedLevel = safe(progressLevel).toLowerCase();

  if (normalizedLevel === "needs support") {
    return "Still developing";
  }

  if (normalizedLevel === "working towards" || normalizedLevel === "consolidating") {
    return "Developing";
  }

  if (normalizedLevel === "goal achieved") {
    return "Secure";
  }

  if (normalizedLevel === "goal achieved + extension") {
    return "Strong";
  }

  return null;
}

export function mapEvidenceProgressLevelToPathwayProgress(
  progressLevel: string | null | undefined,
): PathwayProgressStatus | null {
  const normalizedLevel = safe(progressLevel).toLowerCase();

  if (normalizedLevel === "goal achieved" || normalizedLevel === "goal achieved + extension") {
    return "Secure";
  }

  if (
    normalizedLevel === "needs support" ||
    normalizedLevel === "working towards" ||
    normalizedLevel === "consolidating"
  ) {
    return "Evidence started";
  }

  return null;
}

export function mapObservedSkillStatusToPathwayProgress(
  observedSkillStatus: string | null | undefined,
): PathwayProgressStatus | null {
  const normalizedStatus = safe(observedSkillStatus).toLowerCase();

  if (normalizedStatus === "still developing") {
    return "Practising";
  }

  if (normalizedStatus === "developing") {
    return "Evidence started";
  }

  if (normalizedStatus === "secure" || normalizedStatus === "strong") {
    return "Secure";
  }

  return null;
}

const REGISTRY_ITEMS = getAllPathwaySteps();
const REGISTRY_BY_ID = new Map(REGISTRY_ITEMS.map((item) => [item.id, item]));
const REGISTRY_BY_CANONICAL_STEP = new Map(
  REGISTRY_ITEMS.map((item) => [
    buildPathwayStepId(item.subjectKey, item.strandKey, item.stageKey, item.stepKey),
    item,
  ]),
);
const REGISTRY_BY_CANONICAL_STEP_ANY_SUBJECT = new Map(
  REGISTRY_ITEMS.map((item) => [
    `${item.strandKey}::${item.stageKey}::${item.stepKey}`,
    item,
  ]),
);
const REGISTRY_BY_CANONICAL_NUMBER = new Map(
  REGISTRY_ITEMS.map((item) => [
    `${item.subjectKey}::${item.strandKey}::${item.stageKey}::${item.legacyStepNumber}`,
    item,
  ]),
);
const REGISTRY_BY_CANONICAL_NUMBER_ANY_SUBJECT = new Map(
  REGISTRY_ITEMS.map((item) => [
    `${item.strandKey}::${item.stageKey}::${item.legacyStepNumber}`,
    item,
  ]),
);
const REGISTRY_BY_LEGACY_NUMBER = new Map(
  REGISTRY_ITEMS.map((item) => [
    `${item.subjectKey}::${item.legacyPathwayKey}::${item.stageKey}::${item.legacyStepNumber}`,
    item,
  ]),
);
const REGISTRY_BY_LEGACY_NUMBER_ANY_SUBJECT = new Map(
  REGISTRY_ITEMS.map((item) => [
    `${item.legacyPathwayKey}::${item.stageKey}::${item.legacyStepNumber}`,
    item,
  ]),
);
const KNOWN_SUBJECT_KEYS = new Set<PathwaySubjectKey>(
  PATHWAY_SUBJECTS.map((subject) => subject.key),
);

function progressJudgementSortValue(value: string | null | undefined) {
  return Date.parse(safe(value)) || Date.parse(`${safe(value)}T00:00:00`) || 0;
}

function progressJudgementDateValue(
  primary: string | null | undefined,
  fallback: string | null | undefined,
) {
  return safe(primary) || safe(fallback) || null;
}

function getObservationRegistryItem(pathwayStepId: string | null | undefined) {
  return REGISTRY_BY_ID.get(safe(pathwayStepId)) ?? null;
}

function dedupeObservationKey(observation: RecognizedProgressJudgementObservation) {
  const dateOnly = safe(observation.dateValue).slice(0, 10);
  const stepKey = safe(observation.pathwayStepId) || safe(observation.stepTitle);
  return [
    observation.learnerId,
    stepKey,
    observation.judgement,
    dateOnly,
  ].join("::");
}

function compareProgressJudgementObservations(
  left: RecognizedProgressJudgementObservation,
  right: RecognizedProgressJudgementObservation,
) {
  if (right.sortValue !== left.sortValue) {
    return right.sortValue - left.sortValue;
  }

  return left.id.localeCompare(right.id);
}

export function buildRecognizedProgressJudgementObservations(input: {
  assessmentStatuses?: CleanAssessmentSkillStatus[];
  evidenceEntries?: CleanEvidenceEntry[];
  learnerId?: string | null;
}) {
  const observations: RecognizedProgressJudgementObservation[] = [];
  const learnerScope = safe(input.learnerId);

  (input.assessmentStatuses || []).forEach((status) => {
    if (learnerScope && safe(status.learnerId) !== learnerScope) return;
    const judgement = normalizeProgressJudgementValue(status.status);
    if (!judgement) return;

    const pathwayStepId = safe(status.pathwayStepId) || safe(status.skillKey) || null;
    const registryItem = getObservationRegistryItem(pathwayStepId);
    const dateValue = progressJudgementDateValue(status.updatedAt, status.createdAt);

    observations.push({
      id: `assessment-status:${status.id}`,
      learnerId: safe(status.learnerId),
      sourceType: "assessment-status",
      sourceId: status.id,
      pathwayStepId,
      subjectTitle: registryItem?.subjectTitle || null,
      strandTitle: registryItem?.strandTitle || null,
      stepTitle: registryItem?.stepTitle || null,
      judgement,
      dateValue,
      sortValue: progressJudgementSortValue(dateValue),
    });
  });

  (input.evidenceEntries || []).forEach((entry) => {
    if (learnerScope && safe(entry.learnerId) !== learnerScope) return;
    const judgement = getEvidenceProgressJudgement(entry);
    if (!judgement) return;

    const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
    const pathwayStepId = resolvePathwayStepIdFromContext(pathwayContext);
    const registryItem = getObservationRegistryItem(pathwayStepId);
    const dateValue = progressJudgementDateValue(
      entry.observedOn,
      entry.updatedAt || entry.createdAt,
    );

    observations.push({
      id: `evidence:${entry.id}`,
      learnerId: safe(entry.learnerId),
      sourceType: "evidence",
      sourceId: entry.id,
      pathwayStepId,
      subjectTitle:
        registryItem?.subjectTitle ||
        safe(pathwayContext?.subjectLabel) ||
        safe(entry.learningArea) ||
        null,
      strandTitle: registryItem?.strandTitle || safe(pathwayContext?.pathwayLabel) || null,
      stepTitle: registryItem?.stepTitle || safe(pathwayContext?.stepTitle) || null,
      judgement,
      dateValue,
      sortValue: progressJudgementSortValue(dateValue),
    });
  });

  const deduped = new Map<string, RecognizedProgressJudgementObservation>();
  observations
    .sort((left, right) => {
      if (left.sourceType !== right.sourceType) {
        return left.sourceType === "assessment-status" ? -1 : 1;
      }
      return compareProgressJudgementObservations(left, right);
    })
    .forEach((observation) => {
      const key = dedupeObservationKey(observation);
      if (!deduped.has(key)) {
        deduped.set(key, observation);
      }
    });

  return [...deduped.values()].sort(compareProgressJudgementObservations);
}

function isKnownSubjectKey(value: string): value is PathwaySubjectKey {
  return KNOWN_SUBJECT_KEYS.has(value as PathwaySubjectKey);
}

export function resolveCanonicalPathwayStepIdFromParts(
  input: PathwayStepResolutionInput,
) {
  const pathwayStepId = safe(input.pathwayStepId);
  const parsedPathwayStepId = parsePathwayStepId(pathwayStepId);
  if (parsedPathwayStepId && REGISTRY_BY_ID.has(pathwayStepId)) {
    return pathwayStepId;
  }

  const subjectKey = safe(input.subjectKey);
  const pathwayKey = safe(input.pathwayKey);
  const stageKey = safe(input.stageKey);
  const stepKey = safe(input.stepKey);
  const stepNumber = safe(input.stepNumber);

  if (!pathwayKey || !stageKey) {
    return null;
  }

  if (stepKey && isKnownSubjectKey(subjectKey)) {
    const canonicalMatch = REGISTRY_BY_CANONICAL_STEP.get(
      buildPathwayStepId(subjectKey, pathwayKey, stageKey, stepKey),
    );
    if (canonicalMatch) {
      return canonicalMatch.id;
    }
  }

  if (stepKey) {
    const crossSubjectCanonicalMatch = REGISTRY_BY_CANONICAL_STEP_ANY_SUBJECT.get(
      `${pathwayKey}::${stageKey}::${stepKey}`,
    );
    if (crossSubjectCanonicalMatch) {
      return crossSubjectCanonicalMatch.id;
    }
  }

  if (stepNumber && isKnownSubjectKey(subjectKey)) {
    const canonicalNumberMatch = REGISTRY_BY_CANONICAL_NUMBER.get(
      `${subjectKey}::${pathwayKey}::${stageKey}::${stepNumber}`,
    );
    if (canonicalNumberMatch) {
      return canonicalNumberMatch.id;
    }

    const legacyNumberMatch = REGISTRY_BY_LEGACY_NUMBER.get(
      `${subjectKey}::${pathwayKey}::${stageKey}::${stepNumber}`,
    );
    if (legacyNumberMatch) {
      return legacyNumberMatch.id;
    }
  }

  if (stepNumber) {
    const crossSubjectCanonicalNumberMatch = REGISTRY_BY_CANONICAL_NUMBER_ANY_SUBJECT.get(
      `${pathwayKey}::${stageKey}::${stepNumber}`,
    );
    if (crossSubjectCanonicalNumberMatch) {
      return crossSubjectCanonicalNumberMatch.id;
    }

    const crossSubjectLegacyNumberMatch = REGISTRY_BY_LEGACY_NUMBER_ANY_SUBJECT.get(
      `${pathwayKey}::${stageKey}::${stepNumber}`,
    );
    if (crossSubjectLegacyNumberMatch) {
      return crossSubjectLegacyNumberMatch.id;
    }
  }

  return null;
}

export function resolvePathwayStepIdFromContext(
  context: CleanPathwayCaptureContext | null | undefined,
) {
  if (!context) return null;

  const exactMatch = resolveCanonicalPathwayStepIdFromParts({
    subjectKey: context.subjectKey,
    pathwayKey: context.pathwayKey,
    stageKey: context.stageKey,
    stepKey: context.stepKey,
    stepNumber: context.stepNumber,
    pathwayStepId: context.pathwayStepId,
  });
  if (exactMatch) return exactMatch;

  const titleStepKey = buildPathwayRegistryStepKey(
    context.stepTitle || "",
    context.stepNumber || context.stepKey || "item",
  );
  return resolveCanonicalPathwayStepIdFromParts({
    subjectKey: context.subjectKey,
    pathwayKey: context.pathwayKey,
    stageKey: context.stageKey,
    stepKey: titleStepKey,
    stepNumber: context.stepNumber,
  });
}

function ensureState(
  index: Map<string, UnifiedPathwayStepState>,
  pathwayStepId: string,
) {
  const normalizedPathwayStepId = safe(pathwayStepId);
  const registryItem = REGISTRY_BY_ID.get(normalizedPathwayStepId);

  if (!registryItem) {
    return null;
  }

  const existing = index.get(normalizedPathwayStepId);
  if (existing) {
    return existing;
  }

  const created: UnifiedPathwayStepState = {
    pathwayStepId: normalizedPathwayStepId,
    registryItem,
    assessmentConfidence: null,
    assessmentStatusRecord: null,
    linkedEvidenceCount: 0,
    linkedEvidenceEntries: [],
    latestEvidenceEntry: null,
    latestObservedSkillStatus: null,
    pathwayProgressFromEvidence: null,
    latestEvidenceProgressLevel: null,
    latestEvidenceStatusAt: 0,
    latestAssessmentStatusAt: 0,
    latestStatusSource: null,
  };

  index.set(normalizedPathwayStepId, created);
  return created;
}

function pickLatestAssessmentRecord(
  current: CleanAssessmentSkillStatus | null,
  next: CleanAssessmentSkillStatus,
) {
  if (!current) return next;

  const currentTime =
    Date.parse(safe(current.updatedAt)) || Date.parse(safe(current.createdAt)) || 0;
  const nextTime = Date.parse(safe(next.updatedAt)) || Date.parse(safe(next.createdAt)) || 0;

  return nextTime >= currentTime ? next : current;
}

export function buildUnifiedPathwayStepStateIndex(
  input: BuildUnifiedPathwayStepStateIndexInput,
): UnifiedPathwayStepStateIndex {
  const nextIndex = new Map<string, UnifiedPathwayStepState>();

  (input.assessmentStatuses || []).forEach((statusRecord) => {
    const pathwayStepId = safe(statusRecord.pathwayStepId);
    if (!pathwayStepId) {
      return;
    }

    const state = ensureState(nextIndex, pathwayStepId);
    if (!state) {
      return;
    }

    const latestRecord = pickLatestAssessmentRecord(
      state.assessmentStatusRecord,
      statusRecord,
    );
    state.assessmentStatusRecord = latestRecord;
    state.assessmentConfidence = latestRecord.status;
    state.latestAssessmentStatusAt = assessmentStatusSortValue(latestRecord);
  });

  [...(input.evidenceEntries || [])]
    .sort((left, right) => evidenceSortValue(right) - evidenceSortValue(left))
    .forEach((entry) => {
      const pathwayContext = parsePathwayContextFromNodeIds(entry.curriculumNodeIds);
      const pathwayStepId = resolvePathwayStepIdFromContext(pathwayContext);
      if (!pathwayStepId) {
        return;
      }

      const state = ensureState(nextIndex, pathwayStepId);
      if (!state) {
        return;
      }

      if (!state.linkedEvidenceEntries.some((item) => item.id === entry.id)) {
        state.linkedEvidenceEntries.push(entry);
      }

      if (
        !state.latestEvidenceEntry ||
        evidenceSortValue(entry) >= evidenceSortValue(state.latestEvidenceEntry)
      ) {
        state.latestEvidenceEntry = entry;
        state.latestObservedSkillStatus = normalizeObservedSkillStatus(
          pathwayContext?.observedSkillStatus,
        ) || mapEvidenceProgressLevelToObservedStatus(getEvidenceProgressLevel(entry));
        state.latestEvidenceProgressLevel = getEvidenceProgressLevel(entry);
        state.latestEvidenceStatusAt = evidenceSortValue(entry);
      }
    });

  nextIndex.forEach((state) => {
    const sortedEvidenceEntries = [...state.linkedEvidenceEntries].sort(
      (left, right) => evidenceSortValue(right) - evidenceSortValue(left),
    );
    state.linkedEvidenceEntries = sortedEvidenceEntries;
    state.linkedEvidenceCount = sortedEvidenceEntries.length;
    state.latestEvidenceEntry = sortedEvidenceEntries[0] ?? state.latestEvidenceEntry;
    const latestPathwayContext = state.latestEvidenceEntry
      ? parsePathwayContextFromNodeIds(state.latestEvidenceEntry.curriculumNodeIds)
      : null;
    const latestObservedSkillStatus =
      normalizeObservedSkillStatus(latestPathwayContext?.observedSkillStatus) ||
      mapEvidenceProgressLevelToObservedStatus(getEvidenceProgressLevel(state.latestEvidenceEntry));
    const latestEvidenceProgressLevel = getEvidenceProgressLevel(state.latestEvidenceEntry);
    const latestEvidenceStatusAt = state.latestEvidenceEntry
      ? evidenceSortValue(state.latestEvidenceEntry)
      : 0;
    const latestAssessmentStatusAt = assessmentStatusSortValue(state.assessmentStatusRecord);
    const evidencePathwayProgress =
      mapObservedSkillStatusToPathwayProgress(latestObservedSkillStatus) ||
      mapEvidenceProgressLevelToPathwayProgress(latestEvidenceProgressLevel);
    const assessmentPathwayProgress = mapObservedSkillStatusToPathwayProgress(
      state.assessmentConfidence,
    );
    const evidenceIsLatest =
      Boolean(evidencePathwayProgress) &&
      (!assessmentPathwayProgress || latestEvidenceStatusAt >= latestAssessmentStatusAt);
    state.latestObservedSkillStatus = latestObservedSkillStatus;
    state.latestEvidenceProgressLevel = latestEvidenceProgressLevel;
    state.latestEvidenceStatusAt = latestEvidenceStatusAt;
    state.latestAssessmentStatusAt = latestAssessmentStatusAt;
    state.latestStatusSource = evidenceIsLatest
      ? "evidence"
      : assessmentPathwayProgress
        ? "assessment"
        : state.linkedEvidenceCount > 0
          ? "evidence"
          : null;
    state.pathwayProgressFromEvidence =
      (evidenceIsLatest ? evidencePathwayProgress : assessmentPathwayProgress) ||
      evidencePathwayProgress ||
      (state.linkedEvidenceCount > 0 ? "Evidence started" : null);
  });

  return nextIndex;
}

export function getUnifiedPathwayStepState(
  index: UnifiedPathwayStepStateIndex,
  pathwayStepId: string | null | undefined,
) {
  const normalizedPathwayStepId = safe(pathwayStepId);
  if (!normalizedPathwayStepId) {
    return null;
  }

  return index.get(normalizedPathwayStepId) || null;
}

export function getAssessmentStatusForPathwayStep(
  index: UnifiedPathwayStepStateIndex,
  pathwayStepId: string | null | undefined,
) {
  return getUnifiedPathwayStepState(index, pathwayStepId)?.assessmentStatusRecord || null;
}

export function getEvidenceForPathwayStep(
  index: UnifiedPathwayStepStateIndex,
  pathwayStepId: string | null | undefined,
) {
  return getUnifiedPathwayStepState(index, pathwayStepId)?.linkedEvidenceEntries || [];
}

export function isCompletedPathwayProgressStatus(
  value: string | null | undefined,
) {
  return safe(value).toLowerCase() === "secure";
}

export function isCompletedPathwayEvidenceProgressLevel(
  value: string | null | undefined,
) {
  const normalizedValue = safe(value).toLowerCase();
  return normalizedValue === "goal achieved" || normalizedValue === "goal achieved + extension";
}

export function isCompletedPathwayAssessmentStatus(
  value: string | null | undefined,
) {
  const normalizedValue = safe(value).toLowerCase();
  return normalizedValue === "secure" || normalizedValue === "strong";
}

export function isUnifiedPathwayStepComplete(
  state: UnifiedPathwayStepState | null | undefined,
) {
  return Boolean(
    state &&
      (isCompletedPathwayProgressStatus(state.pathwayProgressFromEvidence) ||
        isCompletedPathwayEvidenceProgressLevel(state.latestEvidenceProgressLevel) ||
        isCompletedPathwayAssessmentStatus(state.latestObservedSkillStatus) ||
        isCompletedPathwayAssessmentStatus(state.assessmentConfidence)),
  );
}

export function getUnifiedPathwayStepEvidenceCount(
  index: UnifiedPathwayStepStateIndex,
  pathwayStepId: string | null | undefined,
) {
  return getUnifiedPathwayStepState(index, pathwayStepId)?.linkedEvidenceCount || 0;
}

function buildStepCounts(
  registryItems: PathwayStepRegistryItem[],
  index: UnifiedPathwayStepStateIndex,
) {
  return registryItems.reduce(
    (totals, item) => {
      const state = getUnifiedPathwayStepState(index, item.id);
      const assessmentConfidence = state?.assessmentConfidence || "Not assessed yet";
      const hasEvidence = (state?.linkedEvidenceCount || 0) > 0;

      if (hasEvidence) {
        totals.evidenceLinkedCount += 1;
      }

      if (
        assessmentConfidence === "Still developing" ||
        assessmentConfidence === "Developing" ||
        assessmentConfidence === "Secure" ||
        assessmentConfidence === "Strong"
      ) {
        totals.assessedCount += 1;
      }

      if (assessmentConfidence === "Secure" || assessmentConfidence === "Strong") {
        totals.secureOrStrongCount += 1;
      }

      if (
        assessmentConfidence === "Still developing" ||
        assessmentConfidence === "Developing"
      ) {
        totals.developingCount += 1;
      }

      if (assessmentConfidence === "Not assessed yet") {
        totals.notAssessedCount += 1;
      }

      if (!hasEvidence || assessmentConfidence === "Not assessed yet") {
        totals.revisitCount += 1;
      }

      return totals;
    },
    {
      totalSteps: registryItems.length,
      evidenceLinkedCount: 0,
      assessedCount: 0,
      secureOrStrongCount: 0,
      developingCount: 0,
      notAssessedCount: 0,
      revisitCount: 0,
    },
  );
}

export function getStrandAssessmentSummary(
  subjectKey: PathwaySubjectKey,
  strandKey: string,
  index: UnifiedPathwayStepStateIndex,
): PathwayStrandAssessmentSummary | null {
  const strandSteps = REGISTRY_ITEMS.filter(
    (item) => item.subjectKey === subjectKey && item.strandKey === safe(strandKey),
  );

  if (!strandSteps.length) {
    return null;
  }

  const subject = PATHWAY_SUBJECTS.find((item) => item.key === subjectKey);
  const counts = buildStepCounts(strandSteps, index);

  return {
    subjectKey,
    subjectTitle: subject?.title || strandSteps[0]?.subjectTitle || "Subject",
    strandKey: safe(strandKey),
    strandTitle: strandSteps[0]?.strandTitle || "Strand",
    strandOrder: strandSteps[0]?.strandOrder || 0,
    ...counts,
  };
}

export function getSubjectCurriculumDashboardSummary(
  subjectKey: PathwaySubjectKey,
  index: UnifiedPathwayStepStateIndex,
): PathwaySubjectCurriculumDashboardSummary | null {
  const subjectSteps = REGISTRY_ITEMS.filter((item) => item.subjectKey === subjectKey);

  if (!subjectSteps.length) {
    return null;
  }

  const subject = PATHWAY_SUBJECTS.find((item) => item.key === subjectKey);
  const strandKeys = [...new Set(subjectSteps.map((item) => item.strandKey))];
  const strands = strandKeys
    .map((strandKey) => getStrandAssessmentSummary(subjectKey, strandKey, index))
    .filter(Boolean)
    .sort((left, right) => {
      if (!left || !right) return 0;
      return left.strandOrder - right.strandOrder;
    }) as PathwayStrandAssessmentSummary[];
  const counts = buildStepCounts(subjectSteps, index);

  return {
    subjectKey,
    subjectTitle: subject?.title || subjectSteps[0]?.subjectTitle || "Subject",
    subjectOrder: subjectSteps[0]?.subjectOrder || 0,
    ...counts,
    strands,
  };
}

export function buildSubjectCurriculumDashboardSummaries(
  index: UnifiedPathwayStepStateIndex,
) {
  return PATHWAY_SUBJECTS.filter((subject) => subject.status === "detailed")
    .map((subject) => getSubjectCurriculumDashboardSummary(subject.key, index))
    .filter(Boolean)
    .sort((left, right) => {
      if (!left || !right) return 0;
      return left.subjectOrder - right.subjectOrder;
    }) as PathwaySubjectCurriculumDashboardSummary[];
}
