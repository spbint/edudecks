import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildNumberOperationsBaselineSummarySnapshot } from "@/lib/clean/assessments/placement/numberOperationsBaselineSnapshot";
import { buildNumberOperationsSubElementAttemptTrace } from "@/lib/clean/assessments/placement/numberOperationsAttemptTrace";
import {
  buildNumberOperationsCandidateBandResult,
  buildNumberOperationsEndpointResult,
  type NumberOperationsPlacementResult,
} from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import {
  buildNumberOperationsProfile,
  NUMBER_OPERATIONS_PROFILE_ORDER,
} from "@/lib/clean/assessments/placement/numberOperationsProfile";
import {
  NUMBER_OPERATIONS_RESULT_PROJECTION,
  projectStartingPointCompletion,
  type StartingPointResultProjectionInput,
} from "./startingPointResultProjection";

function placementResults() {
  return [
    buildNumberOperationsCandidateBandResult({
      subElementKey: "number-place-value",
      lowerP: 4,
      upperP: 5,
    }),
    buildNumberOperationsCandidateBandResult({
      subElementKey: "counting-processes",
      lowerP: 3,
      upperP: 4,
    }),
    buildNumberOperationsCandidateBandResult({
      subElementKey: "additive-strategies",
      lowerP: 2,
      upperP: 3,
      evidenceLimitations: ["Observed strategy evidence is still required."],
    }),
    buildNumberOperationsEndpointResult({
      subElementKey: "multiplicative-strategies",
      relation: "below-or-around",
      pLevel: 2,
    }),
    buildNumberOperationsEndpointResult({
      subElementKey: "understanding-money",
      relation: "at-least",
      pLevel: 10,
    }),
  ];
}

function traceFor(result: NumberOperationsPlacementResult, index: number) {
  const pLevel = result.lowerP ?? result.endpoint?.pLevel ?? 1;
  return buildNumberOperationsSubElementAttemptTrace({
    subElementKey: result.subElementKey,
    subElementLabel: result.subElementLabel,
    stages: [{
      stage: "initial",
      pLevel,
      responses: [{
        itemId: `canonical-${result.subElementKey}`,
        selectedOptionIds: [],
        responseValue: String(index + 1),
        correct: true,
        skillId: `skill-${result.subElementKey}`,
        misconceptionTags: [],
        timeSpentSeconds: 4,
      }],
    }],
    routeTrace: [`initial:P${pLevel}`],
    evidenceLimitations:
      result.confidence === "routing-only"
        ? ["Electronic evidence is routing-only for this construct."]
        : [],
    result,
  });
}

function projectionInput(overrides: Partial<StartingPointResultProjectionInput> = {}) {
  const results = placementResults();
  const profile = buildNumberOperationsProfile(results);
  const completion = buildNumberOperationsBaselineSummarySnapshot({
    profile,
    subElementAttempts: results.map(traceFor),
    startedAt: "2026-10-09T01:00:00.000Z",
    completedAt: "2026-10-09T02:00:00.000Z",
  });
  const itemVersions = Object.fromEntries(
    results.map((result, index) => [
      `canonical-${result.subElementKey}`,
      index + 1,
    ]),
  );
  return {
    learnerId: "learner-123",
    attemptId: "attempt-123",
    attemptKind: "initial" as const,
    completion,
    itemVersions,
    ...overrides,
  };
}

describe("Starting Point Learning Evidence Result projection", () => {
  it("projects five independent canonical results and one five-continuum profile", () => {
    const projected = projectStartingPointCompletion(projectionInput());
    expect(projected.results).toHaveLength(5);
    expect(projected.results.map((result) => result.construct.continuumId)).toEqual(
      NUMBER_OPERATIONS_PROFILE_ORDER,
    );
    expect(projected.profile.continua).toHaveLength(5);
    expect(new Set(projected.profile.continua.map((entry) => entry.resultId)).size).toBe(5);
  });

  it("preserves item/version, rule, mapping and recommendation provenance", () => {
    const projected = projectStartingPointCompletion(projectionInput());
    const additive = projected.results.find(
      (result) => result.construct.continuumId === "additive-strategies",
    );
    expect(additive).toBeDefined();
    expect(additive?.evidence.itemReferences).toEqual([
      expect.objectContaining({
        itemId: "canonical-additive-strategies",
        itemVersion: 3,
        responseProvenance: expect.objectContaining({ outcome: "correct" }),
      }),
    ]);
    expect(additive?.provenance).toMatchObject({
      deterministicRule: {
        ruleId: NUMBER_OPERATIONS_RESULT_PROJECTION.deterministicRuleId,
        ruleVersion: NUMBER_OPERATIONS_RESULT_PROJECTION.deterministicRuleVersion,
      },
      curriculumMappingVersion:
        NUMBER_OPERATIONS_RESULT_PROJECTION.curriculumMappingVersion,
      evidenceCeiling: "routing-only",
      sourceItemVersions: [{
        itemId: "canonical-additive-strategies",
        itemVersion: 3,
      }],
    });
    expect(additive?.evidence.limitations.map((entry) => entry.description)).toEqual(
      expect.arrayContaining([
        "Observed strategy evidence is still required.",
        "Electronic evidence is routing-only for this construct.",
      ]),
    );
    expect(additive?.recommendation).toMatchObject({
      category: "verify-with-observation",
      recommendationVersion:
        NUMBER_OPERATIONS_RESULT_PROJECTION.recommendationVersion,
      pathwayMutation: "not-requested",
    });
  });

  it("maps deterministic engine meanings into bounded developmental statuses", () => {
    const projected = projectStartingPointCompletion(projectionInput());
    const statusByContinuum = Object.fromEntries(
      projected.results.map((result) => [
        result.construct.continuumId,
        result.interpretation.developmentalStatus,
      ]),
    );
    expect(statusByContinuum).toEqual({
      "number-place-value": "developing",
      "counting-processes": "developing",
      "additive-strategies": "practical-confirmation-required",
      "multiplicative-strategies": "needs-support",
      "understanding-money": "consolidating",
    });
  });

  it("keeps unresolved and inaccessible evidence unknown rather than failed", () => {
    const input = projectionInput();
    const remaining = input.completion.profile.results.filter(
      (result) => result.subElementKey !== "counting-processes",
    );
    const completion = buildNumberOperationsBaselineSummarySnapshot({
      profile: buildNumberOperationsProfile(remaining),
      unresolvedSubElements: ["counting-processes"],
      subElementAttempts: input.completion.subElementAttempts,
      startedAt: input.completion.startedAt,
      completedAt: input.completion.completedAt,
    });
    const projected = projectStartingPointCompletion({
      ...input,
      completion,
      evidenceAvailabilityByContinuum: {
        "counting-processes": "inaccessible",
      },
    });
    const counting = projected.results.find(
      (result) => result.construct.continuumId === "counting-processes",
    );
    expect(counting).toMatchObject({
      evidence: {
        availability: "inaccessible",
        sufficiency: { state: "unresolved" },
        practicalConfirmation: { state: "required" },
      },
      interpretation: {
        developmentalStatus: "not-enough-evidence",
        sourceMeaning: { placementStatus: "unresolved" },
      },
      recommendation: null,
    });
    expect(counting?.interpretation.developmentalStatus).not.toBe("needs-support");
  });

  it("keeps out-of-scope continua explicit and unknown for a focused assessment", () => {
    const input = projectionInput();
    const npv = input.completion.profile.results.find(
      (result) => result.subElementKey === "number-place-value",
    )!;
    const completion = buildNumberOperationsBaselineSummarySnapshot({
      profile: buildNumberOperationsProfile([npv], {
        expectedSubElementKeys: ["number-place-value"],
      }),
      subElementAttempts: input.completion.subElementAttempts.filter(
        (trace) => trace.subElementKey === "number-place-value",
      ),
      startedAt: input.completion.startedAt,
      completedAt: input.completion.completedAt,
    });
    const projected = projectStartingPointCompletion({ ...input, completion });
    expect(projected.profile.continua).toHaveLength(5);
    expect(projected.profile.scopeContinuumIds).toEqual(["number-place-value"]);
    expect(projected.results.slice(1).every((result) =>
      result.evidence.assessmentScope === "not-assessed" &&
      result.evidence.sufficiency.state === "unknown" &&
      result.evidence.sources.length === 0,
    )).toBe(true);
  });

  it("is pure and deterministic and requires complete item-version provenance", () => {
    const input = projectionInput();
    const before = JSON.stringify(input);
    expect(projectStartingPointCompletion(input)).toEqual(
      projectStartingPointCompletion(input),
    );
    expect(JSON.stringify(input)).toBe(before);
    expect(() =>
      projectStartingPointCompletion({ ...input, itemVersions: {} }),
    ).toThrow(/requires a version for item/i);
  });

  it("preserves initial/recheck identity and allows longitudinal records to coexist", () => {
    const initial = projectStartingPointCompletion(projectionInput());
    const recheckInput = projectionInput({
      attemptId: "attempt-456",
      attemptKind: "recheck",
    });
    const recheckCompletion = {
      ...recheckInput.completion,
      completedAt: "2026-11-09T02:00:00.000Z",
    };
    const recheck = projectStartingPointCompletion({
      ...recheckInput,
      completion: recheckCompletion,
    });
    expect(initial.profile.assessment.attemptKind).toBe("initial");
    expect(recheck.profile.assessment.attemptKind).toBe("recheck");
    expect(initial.results[0].construct.constructId).toBe(
      recheck.results[0].construct.constructId,
    );
    expect(initial.results[0].id).not.toBe(recheck.results[0].id);
    expect(initial.results[0].evaluatedAt).not.toBe(recheck.results[0].evaluatedAt);
  });

  it("does not create an overall score, percentage, pass/fail or Pathways mutation", () => {
    const serialized = JSON.stringify(projectStartingPointCompletion(projectionInput()));
    for (const forbidden of [
      "overallScore",
      "overallMaths",
      "percentage",
      "percentile",
      "passFail",
      "pathwayMutationEnabled",
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(serialized).toContain('"pathwayMutation":"not-requested"');
  });

  it("adapts from authoritative output without scoring, routing or recommendation logic", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "lib/clean/educationalIntelligence/startingPointResultProjection.ts",
      ),
      "utf8",
    );
    for (const forbidden of [
      "scoreAssessmentItem",
      "routeInitialAnchor",
      "routeBranchAnchor",
      "routeSearchCluster",
      "applyBoundaryEvidence",
      "buildNumberOperationsRecommendation(",
      "createClient(",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
