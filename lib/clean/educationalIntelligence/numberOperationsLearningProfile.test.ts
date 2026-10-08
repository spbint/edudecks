import { describe, expect, it } from "vitest";
import {
  LEARNING_EVIDENCE_RESULT_SCHEMA,
  LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
  type LearningEvidenceResultV1,
} from "./learningEvidenceResult";
import { projectNumberOperationsLearningProfile } from "./numberOperationsLearningProfile";
import {
  NUMBER_OPERATIONS_PROFILE_ORDER,
} from "@/lib/clean/assessments/placement/numberOperationsProfile";
import type {
  NumberOperationsSubElementKey,
} from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

function resultFor(
  continuumId: NumberOperationsSubElementKey,
  index: number,
): LearningEvidenceResultV1 {
  const assessed = index < 3;
  const label = continuumId.replaceAll("-", " ");
  const evaluatedAt = "2026-10-09T02:00:00.000Z";
  return {
    schema: LEARNING_EVIDENCE_RESULT_SCHEMA,
    schemaVersion: LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION,
    id: `ler:v1:attempt-profile:${continuumId}`,
    learnerId: "learner-profile",
    product: {
      productId: "mylearna-maths-starting-point-number-operations",
      productVersion: "v1",
      moduleId: "number-operations",
    },
    assessment: {
      assessmentId: "number-operations-baseline",
      assessmentVersion: 1,
      attemptId: "attempt-profile",
      attemptKind: "initial",
    },
    createdAt: evaluatedAt,
    evaluatedAt,
    construct: {
      learningDomain: "mathematics",
      continuumId,
      continuumLabel: label,
      constructId: `framework::${continuumId}::${assessed ? "P3-P4" : "unresolved"}`,
      constructName: `${label} ${assessed ? "P3-P4" : "unresolved"}`,
      authority: {
        authorityId: "qcaa-numeracy-progressions",
        frameworkId: "MYL-MATH-AU-NUMERACY-V9",
        frameworkVersion: "australian-curriculum-v9",
        mappingVersion: "number-operations-progression-pathways-v1",
      },
      progression: {
        identifier: assessed ? "P3-P4" : "unresolved",
        kind: assessed ? "band" : "unresolved",
        lowerLevel: assessed ? "P3" : null,
        upperLevel: assessed ? "P4" : null,
        endpointRelation: null,
      },
    },
    evidence: {
      sources: assessed
        ? [{ sourceType: "electronic-assessment", sourceId: "attempt-profile" }]
        : [],
      assessmentScope: assessed ? "assessed" : "not-assessed",
      availability: assessed ? "available" : "unknown",
      itemReferences: [],
      sufficiency: {
        state: assessed ? "sufficient" : "unknown",
        reasonCodes: assessed ? [] : ["not-in-assessment-scope"],
      },
      practicalConfirmation: {
        state: "not-required",
        evidenceReference: null,
      },
      limitations: [],
    },
    interpretation: {
      developmentalStatus: assessed ? "developing" : "not-enough-evidence",
      sourceMeaning: {
        placementStatus: assessed ? "candidate-band" : "not-assessed",
        evidenceClassification: assessed
          ? "provisional-moderate"
          : "not-applicable",
      },
      explanation: assessed ? "Evidence supports a bounded band." : "Unknown.",
    },
    provenance: {
      deterministicRule: {
        ruleId: "mylearna-number-operations-starting-point-engine",
        ruleVersion: "v1",
      },
      assessmentVersion: 1,
      sourceItemVersions: [],
      curriculumMappingVersion: "number-operations-progression-pathways-v1",
      evaluatedAt,
      originatingSubsystem: "maths-starting-point-number-operations",
      evidenceCeiling: assessed ? "provisional" : "no-claim",
    },
    recommendation: null,
    humanControl: {
      reviewState: "not-reviewed",
      humanNoteReference: null,
      portfolioInclusion: "not-decided",
      confirmationState: "not-confirmed",
    },
  };
}

describe("Number & Operations Learning Profile V1", () => {
  const results = NUMBER_OPERATIONS_PROFILE_ORDER.map(resultFor);

  it("retains all five continua independently, including explicit unknowns", () => {
    const profile = projectNumberOperationsLearningProfile(results);
    expect(profile.continua.map((entry) => entry.continuumId)).toEqual(
      NUMBER_OPERATIONS_PROFILE_ORDER,
    );
    expect(profile.scopeContinuumIds).toEqual(
      NUMBER_OPERATIONS_PROFILE_ORDER.slice(0, 3),
    );
    expect(profile.continua[3]).toMatchObject({
      developmentalStatus: "not-enough-evidence",
      evidenceSufficiency: { state: "unknown" },
    });
  });

  it("is a pure deterministic projection with no overall score or percentage", () => {
    const before = JSON.stringify(results);
    const first = projectNumberOperationsLearningProfile(results);
    const second = projectNumberOperationsLearningProfile(results);
    expect(first).toEqual(second);
    expect(JSON.stringify(results)).toBe(before);
    const serialized = JSON.stringify(first);
    for (const forbidden of ["overallScore", "percentage", "percentile", "rank", "passFail"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });

  it("rejects missing, duplicate or cross-attempt canonical records", () => {
    expect(() => projectNumberOperationsLearningProfile(results.slice(0, 4))).toThrow(
      /missing canonical result/i,
    );
    expect(() =>
      projectNumberOperationsLearningProfile([...results, results[0]]),
    ).toThrow(/duplicate continuum/i);
    expect(() =>
      projectNumberOperationsLearningProfile([
        ...results.slice(0, 4),
        {
          ...results[4],
          assessment: { ...results[4].assessment, attemptId: "other-attempt" },
        },
      ]),
    ).toThrow(/share one learner, product and assessment attempt/i);
  });
});
