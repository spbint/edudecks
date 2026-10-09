import { NUMBER_OPERATIONS_PROFILE_ORDER } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import type { NumberOperationsSubElementKey } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import {
  compareLearningEvidenceResults,
  type LearningEvidenceComparisonV1,
} from "./learningEvidenceComparison";
import type { LearningEvidenceResultV1 } from "./learningEvidenceResult";
import { projectNumberOperationsLearningProfile } from "./numberOperationsLearningProfile";

export const NUMBER_OPERATIONS_LEARNING_CHANGE_SCHEMA =
  "mylearna-number-operations-learning-change" as const;
export const NUMBER_OPERATIONS_LEARNING_CHANGE_SCHEMA_VERSION = 1 as const;

export type NumberOperationsLearningChangeV1 = {
  schema: typeof NUMBER_OPERATIONS_LEARNING_CHANGE_SCHEMA;
  schemaVersion: typeof NUMBER_OPERATIONS_LEARNING_CHANGE_SCHEMA_VERSION;
  learnerId: string;
  product: LearningEvidenceResultV1["product"];
  previousAttempt: {
    attemptId: string;
    attemptKind: "initial" | "recheck";
    assessmentId: string;
    assessmentVersion: number;
    evaluatedAt: string;
  };
  currentAttempt: {
    attemptId: string;
    attemptKind: "initial" | "recheck";
    assessmentId: string;
    assessmentVersion: number;
    evaluatedAt: string;
  };
  continua: Array<{
    continuumId: NumberOperationsSubElementKey;
    displayLabel: string;
    comparison: LearningEvidenceComparisonV1;
  }>;
};

function attemptReference(results: LearningEvidenceResultV1[]) {
  const first = results[0];
  if (!first) throw new Error("Longitudinal comparison requires canonical results.");
  return {
    attemptId: first.assessment.attemptId,
    attemptKind: first.assessment.attemptKind,
    assessmentId: first.assessment.assessmentId,
    assessmentVersion: first.assessment.assessmentVersion,
    evaluatedAt: first.evaluatedAt,
  };
}

export function projectNumberOperationsLearningChange(input: {
  previousResults: LearningEvidenceResultV1[];
  currentResults: LearningEvidenceResultV1[];
}): NumberOperationsLearningChangeV1 {
  const previousProfile = projectNumberOperationsLearningProfile(
    input.previousResults,
  );
  const currentProfile = projectNumberOperationsLearningProfile(
    input.currentResults,
  );
  if (previousProfile.learnerId !== currentProfile.learnerId) {
    throw new Error("Number & Operations comparison requires one learner.");
  }
  if (
    previousProfile.product.productId !== currentProfile.product.productId ||
    previousProfile.product.moduleId !== currentProfile.product.moduleId
  ) {
    throw new Error("Number & Operations comparison requires one product module.");
  }

  const previousByContinuum = new Map(
    input.previousResults.map((result) => [result.construct.continuumId, result]),
  );
  const currentByContinuum = new Map(
    input.currentResults.map((result) => [result.construct.continuumId, result]),
  );

  return {
    schema: NUMBER_OPERATIONS_LEARNING_CHANGE_SCHEMA,
    schemaVersion: NUMBER_OPERATIONS_LEARNING_CHANGE_SCHEMA_VERSION,
    learnerId: previousProfile.learnerId,
    product: { ...previousProfile.product },
    previousAttempt: attemptReference(input.previousResults),
    currentAttempt: attemptReference(input.currentResults),
    continua: NUMBER_OPERATIONS_PROFILE_ORDER.map((continuumId) => {
      const previous = previousByContinuum.get(continuumId);
      const current = currentByContinuum.get(continuumId);
      if (!previous || !current) {
        throw new Error(`Missing longitudinal result for ${continuumId}.`);
      }
      return {
        continuumId,
        displayLabel: current.construct.continuumLabel,
        comparison: compareLearningEvidenceResults(previous, current),
      };
    }),
  };
}
