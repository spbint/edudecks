import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import { getEvidenceProgressJudgement, type UnifiedPathwayStepStateIndex } from "@/lib/clean/pathways/pathwayStepState";
import {
  DETAILED_SUBJECT_CONFIGS,
} from "@/lib/clean/pathways/detailedSubjectConfigs";
import {
  getAllPathwaySteps,
  getDefaultPathwayStepIdForWorkspace,
  normalizePathwayStepId,
  type PathwayStepRegistryItem,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import { inferPathwayStageFromYearLevel } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import { PATHWAY_SUBJECTS } from "@/lib/clean/pathways/pathwaySubjects";
import { isCustomerPathwaySubjectActive } from "@/lib/clean/pathways/pathwaySubjectAvailability";

export type CurrentLearningCandidateSource =
  | "parent-confirmation"
  | "observed-evidence"
  | "linked-evidence"
  | "completed-check"
  | "existing-focus";

export type CurrentLearningCandidate = {
  pathwayStepId: string;
  registryItem: PathwayStepRegistryItem;
  source: CurrentLearningCandidateSource;
  recency: number;
};

export function getDefaultCurrentPathwayStepIds(learnerYearLevel: string | null | undefined) {
  const currentFocusStageKey = inferPathwayStageFromYearLevel(learnerYearLevel);

  return PATHWAY_SUBJECTS.filter((subject) =>
    isCustomerPathwaySubjectActive(subject, DETAILED_SUBJECT_CONFIGS[subject.key]),
  ).flatMap((subject) => {
    const config = DETAILED_SUBJECT_CONFIGS[subject.key];
    if (!config) return [];

    const workspace = config.workspaceBuilders[config.defaultStrandKey]?.(currentFocusStageKey);
    const pathwayStepId = workspace
      ? getDefaultPathwayStepIdForWorkspace(subject.key, workspace)
      : null;
    return pathwayStepId ? [pathwayStepId] : [];
  });
}

const sourcePriority: Record<CurrentLearningCandidateSource, number> = {
  "parent-confirmation": 0,
  "observed-evidence": 1,
  "linked-evidence": 2,
  "completed-check": 3,
  "existing-focus": 4,
};

function timestamp(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const parsed = Date.parse(String(value ?? ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function prefer(next: CurrentLearningCandidate, current: CurrentLearningCandidate | undefined) {
  if (!current) return true;
  const nextPriority = sourcePriority[next.source];
  const currentPriority = sourcePriority[current.source];
  return nextPriority < currentPriority || (nextPriority === currentPriority && next.recency > current.recency);
}

/**
 * Selects up to three real, canonical pathway steps for the learner hub.
 * It deliberately uses only persisted canonical context; generic records never
 * become pathway candidates.
 */
export function selectCurrentLearningCandidates(input: {
  stepIndex: UnifiedPathwayStepStateIndex;
  attempts?: CleanAssessmentAttempt[];
  fallbackPathwayStepIds?: readonly string[];
  limit?: number;
}): CurrentLearningCandidate[] {
  const registryById = new Map(getAllPathwaySteps().map((step) => [step.id, step]));
  const candidates = new Map<string, CurrentLearningCandidate>();
  const add = (candidate: CurrentLearningCandidate) => {
    if (prefer(candidate, candidates.get(candidate.pathwayStepId))) {
      candidates.set(candidate.pathwayStepId, candidate);
    }
  };

  input.stepIndex.forEach((state, pathwayStepId) => {
    const canonicalPathwayStepId = normalizePathwayStepId(pathwayStepId);
    const registryItem = registryById.get(canonicalPathwayStepId);
    if (!registryItem) return;
    if (state.assessmentStatusRecord) {
      add({ pathwayStepId: canonicalPathwayStepId, registryItem, source: "parent-confirmation", recency: timestamp(state.assessmentStatusRecord.updatedAt, state.assessmentStatusRecord.createdAt) });
    }
    state.linkedEvidenceEntries.forEach((entry) => {
      add({
        pathwayStepId: canonicalPathwayStepId,
        registryItem,
        source: getEvidenceProgressJudgement(entry) ? "observed-evidence" : "linked-evidence",
        recency: timestamp(entry.updatedAt, entry.createdAt, entry.observedOn),
      });
    });
  });

  (input.attempts || []).forEach((attempt) => {
    if (attempt.status !== "completed") return;
    const canonicalPathwayStepId = normalizePathwayStepId(attempt.pathwayStepId);
    const registryItem = registryById.get(canonicalPathwayStepId);
    if (!registryItem) return;
    add({ pathwayStepId: canonicalPathwayStepId, registryItem, source: "completed-check", recency: timestamp(attempt.completedAt, attempt.updatedAt, attempt.createdAt) });
  });

  (input.fallbackPathwayStepIds || []).forEach((pathwayStepId) => {
    const canonicalPathwayStepId = normalizePathwayStepId(pathwayStepId);
    const registryItem = registryById.get(canonicalPathwayStepId);
    if (registryItem) {
      add({
        pathwayStepId: canonicalPathwayStepId,
        registryItem,
        source: "existing-focus",
        recency: 0,
      });
    }
  });

  return [...candidates.values()]
    .sort((left, right) => sourcePriority[left.source] - sourcePriority[right.source] || right.recency - left.recency || left.registryItem.id.localeCompare(right.registryItem.id))
    .slice(0, input.limit ?? 3);
}
