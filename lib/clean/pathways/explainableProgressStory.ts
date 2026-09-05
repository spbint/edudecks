import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import {
  getExactStepAutoCheckStatusForPathwayStep,
  getFallbackAutoCheckStatusForAttempt,
  type NumberAutoCheckStatus,
} from "@/lib/clean/assessments/numberPathwayAssessmentAlignment";
import { getStepAssessmentForPathwayStep } from "@/lib/clean/assessments/stepAssessmentRegistry";
import {
  evidenceProgressToParentStatus,
  storedProgressToParentStatus,
  type ParentProgressStatus,
} from "@/lib/clean/pathways/parentProgress";
import {
  getEvidenceProgressJudgement,
  type UnifiedPathwayStepState,
} from "@/lib/clean/pathways/pathwayStepState";

export type ExplainableProgressNextAction =
  | "add-completed-work"
  | "confirm-progress"
  | "more-support"
  | "check-understanding"
  | "next-step"
  | "review-this-step";

export type ExplainableProgressStory = {
  currentProgress: ParentProgressStatus;
  currentProgressSource: "parent-confirmation" | "not-confirmed";
  currentProgressConfirmedAt: string | null;
  supportingEvidenceCount: number;
  latestEvidence: {
    id: string;
    title: string;
    observedOn: string | null;
  } | null;
  latestObservedProgress: ParentProgressStatus | null;
  latestObservedAt: string | null;
  completedCheckCount: number;
  latestCheck: {
    id: string;
    completedAt: string | null;
    correctCount: number;
    itemCount: number;
    incorrectCount: number;
    reviewNeededCount: number;
    factualStatus: NumberAutoCheckStatus;
  } | null;
  hasSignalConflict: boolean;
  conflictExplanation: string | null;
  nextAction: ExplainableProgressNextAction;
};

function dateValue(...values: Array<string | null | undefined>) {
  return values.find((value) => String(value ?? "").trim())?.trim() || null;
}

function timestamp(value: string | null | undefined) {
  return Date.parse(value || "") || 0;
}

function statusRank(status: ParentProgressStatus) {
  return {
    "Not checked yet": 0,
    "Needs support": 1,
    Developing: 2,
    Consolidating: 3,
    Secure: 4,
  }[status];
}

function autoCheckToParentStatus(status: NumberAutoCheckStatus): ParentProgressStatus {
  return status;
}

function getCompletedAttemptsForStep(
  attempts: CleanAssessmentAttempt[],
  pathwayStepId: string,
) {
  return attempts
    .filter(
      (attempt) =>
        attempt.status === "completed" && attempt.pathwayStepId === pathwayStepId,
    )
    .sort(
      (left, right) =>
        timestamp(dateValue(right.completedAt, right.updatedAt, right.createdAt)) -
        timestamp(dateValue(left.completedAt, left.updatedAt, left.createdAt)),
    );
}

function selectNextAction(input: {
  currentProgress: ParentProgressStatus;
  hasConfirmation: boolean;
  hasSupportingSignal: boolean;
  hasSignalConflict: boolean;
}): ExplainableProgressNextAction {
  if (!input.hasConfirmation) {
    return input.hasSupportingSignal ? "confirm-progress" : "add-completed-work";
  }

  if (input.hasSignalConflict) return "review-this-step";
  if (input.currentProgress === "Needs support") return "more-support";
  if (input.currentProgress === "Developing") return "more-support";
  if (input.currentProgress === "Consolidating") return "check-understanding";
  if (input.currentProgress === "Secure") return "next-step";
  return "add-completed-work";
}

/**
 * Builds a display-only story from persisted signals. A parent confirmation is
 * intentionally authoritative here: newer work or checks remain dated support,
 * never an automatic replacement for the parent's current progress choice.
 */
export function buildExplainableProgressStory(input: {
  pathwayStepId: string;
  stepState: UnifiedPathwayStepState | null | undefined;
  attempts?: CleanAssessmentAttempt[];
}): ExplainableProgressStory {
  const stepState = input.stepState || null;
  const parentStatus = stepState?.assessmentStatusRecord || null;
  const currentProgress = parentStatus
    ? storedProgressToParentStatus(parentStatus.status)
    : "Not checked yet";
  const currentProgressConfirmedAt = parentStatus
    ? dateValue(parentStatus.updatedAt, parentStatus.createdAt)
    : null;
  const latestEvidenceEntry = stepState?.latestEvidenceEntry || null;
  const latestObservedEvidenceEntry =
    stepState?.linkedEvidenceEntries.find((entry) => Boolean(getEvidenceProgressJudgement(entry))) ||
    null;
  const latestObservedProgress = evidenceProgressToParentStatus(
    getEvidenceProgressJudgement(latestObservedEvidenceEntry),
  );
  const latestObservedAt = latestObservedProgress && latestObservedEvidenceEntry
    ? dateValue(
        latestObservedEvidenceEntry.updatedAt,
        latestObservedEvidenceEntry.createdAt,
        latestObservedEvidenceEntry.observedOn,
      )
    : null;
  const completedAttempts = getCompletedAttemptsForStep(
    input.attempts || [],
    input.pathwayStepId,
  );
  const latestAttempt = completedAttempts[0] || null;
  const stepAssessment = getStepAssessmentForPathwayStep({
    pathwayStepId: input.pathwayStepId,
    stepKey: latestAttempt?.stepKey || null,
    strandKey: latestAttempt?.strandKey || null,
  });
  const exactCheck = latestAttempt
    ? getExactStepAutoCheckStatusForPathwayStep(completedAttempts, {
        pathwayStepId: input.pathwayStepId,
        subjectKey: latestAttempt.subjectKey,
        strandKey: latestAttempt.strandKey,
        stepKey: latestAttempt.stepKey,
        stepAssessmentKey: stepAssessment?.key || null,
      })
    : null;
  const latestCheckStatus = latestAttempt
    ? exactCheck?.attempt
      ? exactCheck.status
      : getFallbackAutoCheckStatusForAttempt(latestAttempt)
    : "Not checked yet";
  const latestCheckAt = latestAttempt
    ? dateValue(latestAttempt.completedAt, latestAttempt.updatedAt, latestAttempt.createdAt)
    : null;
  const parentStatusRank = statusRank(currentProgress);
  const confirmationAt = timestamp(currentProgressConfirmedAt);
  const observedConflicts = Boolean(
    parentStatus &&
      latestObservedProgress &&
      timestamp(latestObservedAt) > confirmationAt &&
      statusRank(latestObservedProgress) < parentStatusRank,
  );
  const checkConflicts = Boolean(
    parentStatus &&
      latestAttempt &&
      timestamp(latestCheckAt) > confirmationAt &&
      statusRank(autoCheckToParentStatus(latestCheckStatus)) < parentStatusRank,
  );
  const hasSignalConflict = observedConflicts || checkConflicts;

  return {
    currentProgress,
    currentProgressSource: parentStatus ? "parent-confirmation" : "not-confirmed",
    currentProgressConfirmedAt,
    supportingEvidenceCount: stepState?.linkedEvidenceCount || 0,
    latestEvidence: latestEvidenceEntry
      ? {
          id: latestEvidenceEntry.id,
          title: latestEvidenceEntry.title || "Learning record",
          observedOn: dateValue(
            latestEvidenceEntry.observedOn,
            latestEvidenceEntry.updatedAt,
            latestEvidenceEntry.createdAt,
          ),
        }
      : null,
    latestObservedProgress,
    latestObservedAt,
    completedCheckCount: completedAttempts.length,
    latestCheck: latestAttempt
      ? {
          id: latestAttempt.id,
          completedAt: latestCheckAt,
          correctCount: latestAttempt.autoCorrectCount,
          itemCount: latestAttempt.itemCount,
          incorrectCount: latestAttempt.autoIncorrectCount,
          reviewNeededCount: latestAttempt.reviewNeededCount,
          factualStatus: latestCheckStatus,
        }
      : null,
    hasSignalConflict,
    conflictExplanation: hasSignalConflict
      ? "Recent work suggests this step may be worth reviewing."
      : null,
    nextAction: selectNextAction({
      currentProgress,
      hasConfirmation: Boolean(parentStatus),
      hasSupportingSignal: Boolean(
        (stepState?.linkedEvidenceCount || 0) || completedAttempts.length,
      ),
      hasSignalConflict,
    }),
  };
}
