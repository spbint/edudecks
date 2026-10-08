import {
  defaultLearningEvidenceHumanControl,
  LEARNING_EVIDENCE_RESULT_SCHEMA,
  LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
  type LearningEvidenceDevelopmentalStatus,
  type LearningEvidenceResultV1,
  type LearningEvidenceSufficiency,
} from "./learningEvidenceResult";
import {
  projectNumberOperationsLearningProfile,
  type NumberOperationsLearningProfileV1,
} from "./numberOperationsLearningProfile";
import {
  presentMathematicsLearningProfile,
  type MathematicsLearningProfilePresentationV1,
} from "./mathematicsLearningProfilePresentation";
import { NUMBER_OPERATIONS_PROFILE_ORDER } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import type { NumberOperationsSubElementKey } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

const labels: Record<NumberOperationsSubElementKey, string> = {
  "number-place-value": "Number and place value",
  "counting-processes": "Counting processes",
  "additive-strategies": "Additive strategies",
  "multiplicative-strategies": "Multiplicative strategies",
  "understanding-money": "Understanding money",
};

type FixtureArea = {
  status: LearningEvidenceDevelopmentalStatus;
  sufficiency: LearningEvidenceSufficiency;
  assessed?: boolean;
  practicalRequired?: boolean;
  recommendationCategory?: string | null;
};

function fixtureResult(input: {
  continuumId: NumberOperationsSubElementKey;
  area: FixtureArea;
  attemptId: string;
  attemptKind: "initial" | "recheck";
  assessedAt: string;
}): LearningEvidenceResultV1 {
  const assessed = input.area.assessed !== false;
  const practicalRequired = Boolean(input.area.practicalRequired);
  const label = labels[input.continuumId];
  const recommendationCategory = input.area.recommendationCategory;
  const progressionKind = assessed && input.area.status !== "not-enough-evidence"
    ? "band"
    : "unresolved";

  return {
    schema: LEARNING_EVIDENCE_RESULT_SCHEMA,
    schemaVersion: LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
    id: `fixture:${input.attemptId}:${input.continuumId}`,
    learnerId: "fixture-learner",
    product: {
      productId: "mylearna-maths-starting-point-number-operations",
      productVersion: "v1",
      moduleId: "number-operations",
    },
    assessment: {
      assessmentId: "number-operations-baseline",
      assessmentVersion: 1,
      attemptId: input.attemptId,
      attemptKind: input.attemptKind,
    },
    createdAt: input.assessedAt,
    evaluatedAt: input.assessedAt,
    construct: {
      learningDomain: "mathematics",
      continuumId: input.continuumId,
      continuumLabel: label,
      constructId: `fixture-construct:${input.continuumId}`,
      constructName: `${label} learning point`,
      authority: {
        authorityId: "qcaa-numeracy-progressions",
        frameworkId: "MYL-MATH-AU-NUMERACY-V9",
        frameworkVersion: "australian-curriculum-v9",
        mappingVersion: "number-operations-progression-pathways-v1",
      },
      progression: {
        identifier: progressionKind === "band" ? "fixture-band" : "unresolved",
        kind: progressionKind,
        lowerLevel: progressionKind === "band" ? "fixture-lower" : null,
        upperLevel: progressionKind === "band" ? "fixture-upper" : null,
        endpointRelation: null,
      },
    },
    evidence: {
      sources: assessed
        ? [{ sourceType: "electronic-assessment", sourceId: input.attemptId }]
        : [],
      assessmentScope: assessed ? "assessed" : "not-assessed",
      availability: assessed ? "available" : "unknown",
      itemReferences: assessed
        ? [
            {
              itemId: `fixture-item:${input.continuumId}`,
              itemVersion: 1,
              responseProvenance: {
                stage: "fixture",
                progressionLevel: null,
                outcome: "correct",
              },
            },
          ]
        : [],
      sufficiency: {
        state: input.area.sufficiency,
        reasonCodes: assessed ? [] : ["not-in-assessment-scope"],
      },
      practicalConfirmation: {
        state: practicalRequired ? "required" : "not-required",
        evidenceReference: null,
      },
      limitations: practicalRequired
        ? [
            {
              code: "fixture-practical-confirmation",
              description: "Practical confirmation is required.",
              evidenceCeiling: "routing-only",
            },
          ]
        : [],
    },
    interpretation: {
      developmentalStatus: input.area.status,
      sourceMeaning: {
        placementStatus: assessed
          ? progressionKind === "band"
            ? "candidate-band"
            : "unresolved"
          : "not-assessed",
        evidenceClassification: practicalRequired
          ? "routing-only"
          : assessed
            ? "provisional-moderate"
            : "not-applicable",
      },
      explanation: "Synthetic staff-review fixture.",
    },
    provenance: {
      deterministicRule: {
        ruleId: "fixture-number-operations-rule",
        ruleVersion: "v1",
      },
      assessmentVersion: 1,
      sourceItemVersions: assessed
        ? [{ itemId: `fixture-item:${input.continuumId}`, itemVersion: 1 }]
        : [],
      curriculumMappingVersion: "number-operations-progression-pathways-v1",
      evaluatedAt: input.assessedAt,
      originatingSubsystem: "staff-fixture",
      evidenceCeiling: practicalRequired
        ? "routing-only"
        : assessed
          ? "provisional"
          : "no-claim",
    },
    recommendation:
      assessed && recommendationCategory
        ? {
            recommendationId: `fixture-recommendation:${input.continuumId}`,
            recommendationVersion: "fixture-v1",
            category: recommendationCategory,
            label: `Internal recommendation for ${label}`,
            reason: "Synthetic deterministic recommendation.",
            targetConstructId: `fixture-target:${input.continuumId}`,
            targetProgressionIdentifier: "fixture-target",
            handoffTarget: {
              kind: "pathways-review",
              label: `Open ${label} in My Pathways`,
              href: `/my-pathways?subjectKey=mathematics&fixtureArea=${input.continuumId}`,
              referenceId: null,
            },
            pathwayMutation: "not-requested",
          }
        : null,
    humanControl: defaultLearningEvidenceHumanControl(),
  };
}

function fixtureProfile(input: {
  attemptId: string;
  attemptKind: "initial" | "recheck";
  assessedAt: string;
  areas: Record<NumberOperationsSubElementKey, FixtureArea>;
}): NumberOperationsLearningProfileV1 {
  return projectNumberOperationsLearningProfile(
    NUMBER_OPERATIONS_PROFILE_ORDER.map((continuumId) =>
      fixtureResult({
        continuumId,
        area: input.areas[continuumId],
        attemptId: input.attemptId,
        attemptKind: input.attemptKind,
        assessedAt: input.assessedAt,
      }),
    ),
  );
}

const mixedAreas: Record<NumberOperationsSubElementKey, FixtureArea> = {
  "number-place-value": {
    status: "secure",
    sufficiency: "sufficient",
    recommendationCategory: "extend-beyond-progression",
  },
  "counting-processes": {
    status: "consolidating",
    sufficiency: "sufficient",
    recommendationCategory: "practice-next-level",
  },
  "additive-strategies": {
    status: "developing",
    sufficiency: "sufficient",
    recommendationCategory: "practice-next-level",
  },
  "multiplicative-strategies": {
    status: "needs-support",
    sufficiency: "sufficient",
    recommendationCategory: "support-and-recheck",
  },
  "understanding-money": {
    status: "practical-confirmation-required",
    sufficiency: "limited",
    practicalRequired: true,
    recommendationCategory: "verify-with-observation",
  },
};

const focusedAreas = Object.fromEntries(
  NUMBER_OPERATIONS_PROFILE_ORDER.map((continuumId) => [
    continuumId,
    continuumId === "additive-strategies"
      ? {
          status: "developing",
          sufficiency: "sufficient",
          recommendationCategory: "practice-next-level",
        }
      : {
          status: "not-enough-evidence",
          sufficiency: "unknown",
          assessed: false,
          recommendationCategory: null,
        },
  ]),
) as Record<NumberOperationsSubElementKey, FixtureArea>;

const recheckAreas: Record<NumberOperationsSubElementKey, FixtureArea> = {
  "number-place-value": {
    status: "secure",
    sufficiency: "sufficient",
    recommendationCategory: "extend-beyond-progression",
  },
  "counting-processes": {
    status: "secure",
    sufficiency: "sufficient",
    recommendationCategory: "practice-next-level",
  },
  "additive-strategies": {
    status: "consolidating",
    sufficiency: "sufficient",
    recommendationCategory: "practice-next-level",
  },
  "multiplicative-strategies": {
    status: "developing",
    sufficiency: "sufficient",
    recommendationCategory: "practice-next-level",
  },
  "understanding-money": {
    status: "not-enough-evidence",
    sufficiency: "unresolved",
    recommendationCategory: null,
  },
};

export type MathematicsLearningProfileFixture = {
  id: "mixed" | "focused" | "recheck";
  label: string;
  description: string;
  presentation: MathematicsLearningProfilePresentationV1;
};

export function getMathematicsLearningProfileFixtures(): MathematicsLearningProfileFixture[] {
  return [
    {
      id: "mixed",
      label: "Mixed five-area profile",
      description: "Five independent outcomes, including practical confirmation.",
      presentation: presentMathematicsLearningProfile({
        profile: fixtureProfile({
          attemptId: "fixture-mixed-initial",
          attemptKind: "initial",
          assessedAt: "2026-10-09T01:00:00.000Z",
          areas: mixedAreas,
        }),
        learnerDisplayName: "Sample learner",
      }),
    },
    {
      id: "focused",
      label: "Focused attempt",
      description: "One assessed area; the other four remain explicitly unknown.",
      presentation: presentMathematicsLearningProfile({
        profile: fixtureProfile({
          attemptId: "fixture-focused-initial",
          attemptKind: "initial",
          assessedAt: "2026-10-09T02:00:00.000Z",
          areas: focusedAreas,
        }),
        learnerDisplayName: "Sample learner",
      }),
    },
    {
      id: "recheck",
      label: "Recheck profile",
      description: "A later attempt with the recheck classification preserved.",
      presentation: presentMathematicsLearningProfile({
        profile: fixtureProfile({
          attemptId: "fixture-recheck",
          attemptKind: "recheck",
          assessedAt: "2026-11-20T03:00:00.000Z",
          areas: recheckAreas,
        }),
        learnerDisplayName: "Sample learner",
      }),
    },
  ];
}
