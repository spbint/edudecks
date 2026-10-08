import {
  LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
  type LearningEvidenceAttemptKind,
  type LearningEvidenceResultV1,
} from "./learningEvidenceResult";
import { NUMBER_OPERATIONS_PROFILE_ORDER } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import type { NumberOperationsSubElementKey } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

export const NUMBER_OPERATIONS_LEARNING_PROFILE_SCHEMA =
  "mylearna-number-operations-learning-profile" as const;
export const NUMBER_OPERATIONS_LEARNING_PROFILE_SCHEMA_VERSION = 1 as const;

export type NumberOperationsLearningProfileV1 = {
  schema: typeof NUMBER_OPERATIONS_LEARNING_PROFILE_SCHEMA;
  schemaVersion: typeof NUMBER_OPERATIONS_LEARNING_PROFILE_SCHEMA_VERSION;
  resultSchemaVersion: typeof LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION;
  learnerId: string;
  product: LearningEvidenceResultV1["product"];
  assessment: {
    assessmentId: string;
    assessmentVersion: number;
    attemptId: string;
    attemptKind: LearningEvidenceAttemptKind;
  };
  assessedAt: string;
  scopeContinuumIds: NumberOperationsSubElementKey[];
  continua: Array<{
    continuumId: NumberOperationsSubElementKey;
    displayLabel: string;
    resultId: string;
    developmentalStatus: LearningEvidenceResultV1["interpretation"]["developmentalStatus"];
    evidenceSufficiency: LearningEvidenceResultV1["evidence"]["sufficiency"];
    progression: LearningEvidenceResultV1["construct"]["progression"];
    constructReference: {
      constructId: string;
      authority: LearningEvidenceResultV1["construct"]["authority"];
    };
    practicalConfirmation: LearningEvidenceResultV1["evidence"]["practicalConfirmation"];
    recommendedNextLearning: LearningEvidenceResultV1["recommendation"];
    provenanceReference: {
      resultId: string;
      deterministicRule: LearningEvidenceResultV1["provenance"]["deterministicRule"];
    };
  }>;
};

function assertSharedContext(
  first: LearningEvidenceResultV1,
  candidate: LearningEvidenceResultV1,
) {
  if (
    candidate.learnerId !== first.learnerId ||
    candidate.assessment.attemptId !== first.assessment.attemptId ||
    candidate.assessment.assessmentId !== first.assessment.assessmentId ||
    candidate.assessment.assessmentVersion !== first.assessment.assessmentVersion ||
    candidate.assessment.attemptKind !== first.assessment.attemptKind ||
    candidate.product.productId !== first.product.productId ||
    candidate.product.productVersion !== first.product.productVersion
  ) {
    throw new Error(
      "Number & Operations profile results must share one learner, product and assessment attempt.",
    );
  }
}

export function projectNumberOperationsLearningProfile(
  results: LearningEvidenceResultV1[],
): NumberOperationsLearningProfileV1 {
  const first = results[0];
  if (!first) {
    throw new Error("Number & Operations profile requires canonical evidence results.");
  }

  const byContinuum = new Map<string, LearningEvidenceResultV1>();
  for (const result of results) {
    assertSharedContext(first, result);
    if (byContinuum.has(result.construct.continuumId)) {
      throw new Error(
        `Number & Operations profile received duplicate continuum ${result.construct.continuumId}.`,
      );
    }
    byContinuum.set(result.construct.continuumId, result);
  }

  const ordered = NUMBER_OPERATIONS_PROFILE_ORDER.map((continuumId) => {
    const result = byContinuum.get(continuumId);
    if (!result) {
      throw new Error(
        `Number & Operations profile is missing canonical result ${continuumId}.`,
      );
    }
    return { continuumId, result };
  });

  if (byContinuum.size !== NUMBER_OPERATIONS_PROFILE_ORDER.length) {
    throw new Error("Number & Operations profile accepts only the five canonical continua.");
  }

  return {
    schema: NUMBER_OPERATIONS_LEARNING_PROFILE_SCHEMA,
    schemaVersion: NUMBER_OPERATIONS_LEARNING_PROFILE_SCHEMA_VERSION,
    resultSchemaVersion: LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
    learnerId: first.learnerId,
    product: { ...first.product },
    assessment: { ...first.assessment },
    assessedAt: first.evaluatedAt,
    scopeContinuumIds: ordered.flatMap(({ continuumId, result }) =>
      result.evidence.assessmentScope === "assessed" ? [continuumId] : [],
    ),
    continua: ordered.map(({ continuumId, result }) => ({
      continuumId,
      displayLabel: result.construct.continuumLabel,
      resultId: result.id,
      developmentalStatus: result.interpretation.developmentalStatus,
      evidenceSufficiency: {
        state: result.evidence.sufficiency.state,
        reasonCodes: [...result.evidence.sufficiency.reasonCodes],
      },
      progression: { ...result.construct.progression },
      constructReference: {
        constructId: result.construct.constructId,
        authority: { ...result.construct.authority },
      },
      practicalConfirmation: { ...result.evidence.practicalConfirmation },
      recommendedNextLearning: result.recommendation
        ? {
            ...result.recommendation,
            handoffTarget: { ...result.recommendation.handoffTarget },
          }
        : null,
      provenanceReference: {
        resultId: result.id,
        deterministicRule: { ...result.provenance.deterministicRule },
      },
    })),
  };
}
