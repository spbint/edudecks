import {
  defaultLearningEvidenceHumanControl,
  LEARNING_EVIDENCE_RESULT_SCHEMA,
  LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
  type LearningEvidenceAvailability,
  type LearningEvidenceDevelopmentalStatus,
  type LearningEvidenceItemReference,
  type LearningEvidenceLimitation,
  type LearningEvidenceRecommendation,
  type LearningEvidenceResultV1,
} from "./learningEvidenceResult";
import {
  projectNumberOperationsLearningProfile,
  type NumberOperationsLearningProfileV1,
} from "./numberOperationsLearningProfile";
import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";
import type { NumberOperationsBaselineSummarySnapshot } from "@/lib/clean/assessments/placement/numberOperationsBaselineSnapshot";
import type { NumberOperationsSubElementAttemptTrace } from "@/lib/clean/assessments/placement/numberOperationsAttemptTrace";
import { NUMBER_OPERATIONS_PROFILE_ORDER } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import type { NumberOperationsRecommendation } from "@/lib/clean/assessments/placement/numberOperationsRecommendations";

export const NUMBER_OPERATIONS_RESULT_PROJECTION = {
  productId: "mylearna-maths-starting-point-number-operations",
  productVersion: "v1",
  moduleId: "number-operations",
  deterministicRuleId: "mylearna-number-operations-starting-point-engine",
  deterministicRuleVersion: "v1",
  authorityId: "qcaa-numeracy-progressions",
  frameworkVersion: "australian-curriculum-v9",
  curriculumMappingVersion: "number-operations-progression-pathways-v1",
  originatingSubsystem: "maths-starting-point-number-operations",
  recommendationVersion: "number-operations-recommendation-v1",
} as const;

export type StartingPointResultProjectionInput = {
  learnerId: string;
  attemptId: string;
  attemptKind: "initial" | "recheck";
  completion: NumberOperationsBaselineSummarySnapshot;
  itemVersions: Readonly<Record<string, number>>;
  evidenceAvailabilityByContinuum?: Partial<
    Record<NumberOperationsSubElementKey, LearningEvidenceAvailability>
  >;
};

export type StartingPointResultProjection = {
  results: LearningEvidenceResultV1[];
  profile: NumberOperationsLearningProfileV1;
};

const continuumLabels = Object.fromEntries(
  NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.assessedAreas.map((area) => [
    area.key,
    area.label,
  ]),
) as Record<NumberOperationsSubElementKey, string>;

function iso(value: string, field: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`${field} must be a valid ISO-compatible datetime.`);
  }
  return new Date(timestamp).toISOString();
}

function progressionFor(result: NumberOperationsPlacementResult | null) {
  if (
    result?.status === "candidate-band" &&
    result.lowerP !== undefined &&
    result.upperP !== undefined
  ) {
    return {
      identifier: `P${result.lowerP}-P${result.upperP}`,
      kind: "band" as const,
      lowerLevel: `P${result.lowerP}`,
      upperLevel: `P${result.upperP}`,
      endpointRelation: null,
    };
  }
  if (result?.status === "endpoint" && result.endpoint) {
    return {
      identifier:
        result.endpoint.relation === "at-least"
          ? `at-least-P${result.endpoint.pLevel}`
          : `below-or-around-P${result.endpoint.pLevel}`,
      kind: "endpoint" as const,
      lowerLevel:
        result.endpoint.relation === "at-least"
          ? `P${result.endpoint.pLevel}`
          : null,
      upperLevel:
        result.endpoint.relation === "below-or-around"
          ? `P${result.endpoint.pLevel}`
          : null,
      endpointRelation: result.endpoint.relation,
    };
  }
  return {
    identifier: "unresolved",
    kind: "unresolved" as const,
    lowerLevel: null,
    upperLevel: null,
    endpointRelation: null,
  };
}

function developmentalStatusFor(
  result: NumberOperationsPlacementResult | null,
): LearningEvidenceDevelopmentalStatus {
  if (!result) return "not-enough-evidence";
  if (result.confidence === "routing-only") {
    return "practical-confirmation-required";
  }
  if (result.status === "candidate-band") return "developing";
  if (result.endpoint?.relation === "below-or-around") return "needs-support";
  return "consolidating";
}

function evidenceCeilingFor(result: NumberOperationsPlacementResult | null) {
  if (!result) return "no-claim" as const;
  return result.confidence === "routing-only"
    ? ("routing-only" as const)
    : ("provisional" as const);
}

function itemReferencesFor(
  trace: NumberOperationsSubElementAttemptTrace | null,
  itemVersions: Readonly<Record<string, number>>,
): LearningEvidenceItemReference[] {
  const byId = new Map<string, LearningEvidenceItemReference>();
  for (const stage of trace?.stages ?? []) {
    for (const response of stage.responses) {
      const itemVersion = itemVersions[response.itemId];
      if (!Number.isInteger(itemVersion) || itemVersion < 1) {
        throw new Error(
          `Learning evidence provenance requires a version for item ${response.itemId}.`,
        );
      }
      byId.set(response.itemId, {
        itemId: response.itemId,
        itemVersion,
        responseProvenance: {
          stage: stage.stage,
          progressionLevel: `P${stage.pLevel}`,
          outcome: response.correct ? "correct" : "incorrect",
        },
      });
    }
  }
  return [...byId.values()];
}

function limitationsFor(input: {
  result: NumberOperationsPlacementResult | null;
  trace: NumberOperationsSubElementAttemptTrace | null;
  assessed: boolean;
  unresolved: boolean;
}) {
  const evidenceCeiling = evidenceCeilingFor(input.result);
  const descriptions = new Set([
    ...(input.result?.limitations ?? []),
    ...(input.trace?.evidenceLimitations ?? []),
  ]);
  const limitations: LearningEvidenceLimitation[] = [...descriptions].map(
    (description, index) => ({
      code: `source-limitation-${index + 1}`,
      description,
      evidenceCeiling,
    }),
  );
  if (!input.assessed) {
    limitations.push({
      code: "not-in-assessment-scope",
      description: "This continuum was not in scope for this assessment attempt.",
      evidenceCeiling: "no-claim",
    });
  } else if (input.unresolved) {
    limitations.push({
      code: "unresolved-evidence",
      description:
        "The deterministic assessment left this continuum unresolved rather than inferring a result.",
      evidenceCeiling: "no-claim",
    });
  }
  return limitations;
}

function recommendationFor(input: {
  continuumId: NumberOperationsSubElementKey;
  recommendation: NumberOperationsRecommendation | null;
}): LearningEvidenceRecommendation | null {
  const recommendation = input.recommendation;
  if (!recommendation) return null;
  const targetProgressionIdentifier =
    recommendation.targetP == null ? null : `P${recommendation.targetP}`;
  const targetConstructId = targetProgressionIdentifier
    ? `MYL-MATH-AU-NUMERACY-V9::${input.continuumId}::${targetProgressionIdentifier}`
    : null;
  return {
    recommendationId: [
      "number-operations",
      input.continuumId,
      recommendation.kind,
      targetProgressionIdentifier ?? "unresolved",
    ].join(":"),
    recommendationVersion: NUMBER_OPERATIONS_RESULT_PROJECTION.recommendationVersion,
    category: recommendation.kind,
    label: recommendation.title,
    reason: recommendation.rationale,
    targetConstructId,
    targetProgressionIdentifier,
    handoffTarget: {
      kind: recommendation.practiceTarget.kind,
      label: recommendation.practiceTarget.label,
      href: recommendation.practiceTarget.href,
      referenceId: recommendation.practiceTarget.moduleId,
    },
    pathwayMutation: "not-requested",
  };
}

function projectContinuum(input: {
  context: StartingPointResultProjectionInput;
  continuumId: NumberOperationsSubElementKey;
  evaluatedAt: string;
}): LearningEvidenceResultV1 {
  const { context, continuumId, evaluatedAt } = input;
  const assessed = context.completion.scopeSubElements.includes(continuumId);
  const sourceResult =
    context.completion.profile.results.find(
      (result) => result.subElementKey === continuumId,
    ) ?? null;
  const trace =
    context.completion.subElementAttempts.find(
      (attempt) => attempt.subElementKey === continuumId,
    ) ?? null;
  const unresolved =
    context.completion.unresolvedSubElements.includes(continuumId) ||
    (assessed && !sourceResult);
  const progression = progressionFor(sourceResult);
  const itemReferences = itemReferencesFor(trace, context.itemVersions);
  const evidenceCeiling = evidenceCeilingFor(sourceResult);
  const practicalConfirmationRequired =
    assessed && (unresolved || sourceResult?.confidence === "routing-only");
  const availability =
    context.evidenceAvailabilityByContinuum?.[continuumId] ??
    (!assessed
      ? "unknown"
      : itemReferences.length
        ? "available"
        : unresolved
          ? "unavailable"
          : "unknown");
  const sufficiency = !assessed
    ? "unknown"
    : unresolved
      ? "unresolved"
      : sourceResult?.confidence === "routing-only"
        ? "limited"
        : sourceResult
          ? "sufficient"
          : "not-enough-evidence";
  const recommendation = recommendationFor({
    continuumId,
    recommendation:
      context.completion.profile.recommendations.find(
        (candidate) => candidate.subElementKey === continuumId,
      ) ?? null,
  });
  const continuumLabel = continuumLabels[continuumId];
  const constructId = [
    context.completion.frameworkId,
    continuumId,
    progression.identifier,
  ].join("::");
  const limitations = limitationsFor({
    result: sourceResult,
    trace,
    assessed,
    unresolved,
  });

  return {
    schema: LEARNING_EVIDENCE_RESULT_SCHEMA,
    schemaVersion: LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
    id: `ler:v1:${context.attemptId}:${continuumId}`,
    learnerId: context.learnerId,
    product: {
      productId: NUMBER_OPERATIONS_RESULT_PROJECTION.productId,
      productVersion: NUMBER_OPERATIONS_RESULT_PROJECTION.productVersion,
      moduleId: NUMBER_OPERATIONS_RESULT_PROJECTION.moduleId,
    },
    assessment: {
      assessmentId: context.completion.formId,
      assessmentVersion: context.completion.formVersion,
      attemptId: context.attemptId,
      attemptKind: context.attemptKind,
    },
    createdAt: evaluatedAt,
    evaluatedAt,
    construct: {
      learningDomain: "mathematics",
      continuumId,
      continuumLabel,
      constructId,
      constructName: `${continuumLabel} ${progression.identifier}`,
      authority: {
        authorityId: NUMBER_OPERATIONS_RESULT_PROJECTION.authorityId,
        frameworkId: context.completion.frameworkId,
        frameworkVersion: NUMBER_OPERATIONS_RESULT_PROJECTION.frameworkVersion,
        mappingVersion: NUMBER_OPERATIONS_RESULT_PROJECTION.curriculumMappingVersion,
      },
      progression,
    },
    evidence: {
      sources: assessed
        ? [{ sourceType: "electronic-assessment", sourceId: context.attemptId }]
        : [],
      assessmentScope: assessed ? "assessed" : "not-assessed",
      availability,
      itemReferences,
      sufficiency: {
        state: sufficiency,
        reasonCodes: limitations.map((limitation) => limitation.code),
      },
      practicalConfirmation: {
        state: practicalConfirmationRequired ? "required" : "not-required",
        evidenceReference: null,
      },
      limitations,
    },
    interpretation: {
      developmentalStatus: developmentalStatusFor(sourceResult),
      sourceMeaning: {
        placementStatus: !assessed
          ? "not-assessed"
          : unresolved || !sourceResult
            ? "unresolved"
            : sourceResult.status,
        evidenceClassification:
          sourceResult?.confidence ?? "not-applicable",
      },
      explanation: !assessed
        ? "This continuum was outside the scope of this attempt and remains unknown."
        : sourceResult?.interpretation ??
          "The current evidence is unresolved. MyLearna does not infer a developmental claim from missing or inaccessible evidence.",
    },
    provenance: {
      deterministicRule: {
        ruleId: NUMBER_OPERATIONS_RESULT_PROJECTION.deterministicRuleId,
        ruleVersion: NUMBER_OPERATIONS_RESULT_PROJECTION.deterministicRuleVersion,
      },
      assessmentVersion: context.completion.formVersion,
      sourceItemVersions: itemReferences.map(({ itemId, itemVersion }) => ({
        itemId,
        itemVersion,
      })),
      curriculumMappingVersion:
        NUMBER_OPERATIONS_RESULT_PROJECTION.curriculumMappingVersion,
      evaluatedAt,
      originatingSubsystem:
        NUMBER_OPERATIONS_RESULT_PROJECTION.originatingSubsystem,
      evidenceCeiling,
    },
    recommendation,
    humanControl: defaultLearningEvidenceHumanControl(),
  };
}

export function projectStartingPointCompletion(
  input: StartingPointResultProjectionInput,
): StartingPointResultProjection {
  if (!input.learnerId.trim()) {
    throw new Error("Learning evidence result requires a learner ID.");
  }
  if (!input.attemptId.trim()) {
    throw new Error("Learning evidence result requires an attempt ID.");
  }
  const evaluatedAt = iso(input.completion.completedAt, "completedAt");
  const results = NUMBER_OPERATIONS_PROFILE_ORDER.map((continuumId) =>
    projectContinuum({ context: input, continuumId, evaluatedAt }),
  );
  return {
    results,
    profile: projectNumberOperationsLearningProfile(results),
  };
}
