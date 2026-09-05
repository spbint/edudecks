import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import {
  getExactStepAutoCheckStatusForPathwayStep,
  getFallbackAutoCheckStatusForAttempt,
  type NumberAutoCheckStatus,
} from "@/lib/clean/assessments/numberPathwayAssessmentAlignment";
import { getStepAssessmentForPathwayStep } from "@/lib/clean/assessments/stepAssessmentRegistry";

export type ComparableLearningObservation = {
  attemptId: string;
  observedAt: string;
  status: NumberAutoCheckStatus;
};

function observationTimestamp(attempt: CleanAssessmentAttempt) {
  return attempt.completedAt || attempt.updatedAt || attempt.createdAt || null;
}

/**
 * Returns only durable, completed auto-check observations for one exact
 * pathway focus. The existing assessment player treats its depth options as
 * alternate item counts on the same canonical status scale, so they remain
 * comparable without numeric conversion or trend inference.
 */
export function listComparableLearningObservations(input: {
  attempts: readonly CleanAssessmentAttempt[];
  learnerId: string;
  subjectKey: string;
  strandKey: string;
  stageKey: string;
  pathwayStepId: string;
  stepKey: string;
}) {
  const stepAssessment = getStepAssessmentForPathwayStep({
    pathwayStepId: input.pathwayStepId,
    stepKey: input.stepKey,
    strandKey: input.strandKey,
  });
  return input.attempts
    .filter((attempt) => {
      const observedAt = observationTimestamp(attempt);
      return (
        attempt.status === "completed" &&
        Boolean(observedAt) &&
        attempt.learnerId === input.learnerId &&
        attempt.subjectKey === input.subjectKey &&
        attempt.strandKey === input.strandKey &&
        attempt.stageKey === input.stageKey &&
        attempt.pathwayStepId === input.pathwayStepId &&
        attempt.stepKey === input.stepKey
      );
    })
    .map((attempt) => ({
      attemptId: attempt.id,
      observedAt: observationTimestamp(attempt)!,
      status: (() => {
        const exact = getExactStepAutoCheckStatusForPathwayStep([attempt], {
          subjectKey: input.subjectKey,
          strandKey: input.strandKey,
          pathwayStepId: input.pathwayStepId,
          stepKey: input.stepKey,
          stepAssessmentKey: stepAssessment?.key || null,
        });
        return exact.attempt
          ? exact.status
          : getFallbackAutoCheckStatusForAttempt(attempt);
      })(),
    }))
    .sort(
      (left, right) =>
        Date.parse(right.observedAt) - Date.parse(left.observedAt) ||
        left.attemptId.localeCompare(right.attemptId),
    );
}
