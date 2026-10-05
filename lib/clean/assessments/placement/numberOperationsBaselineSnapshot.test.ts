import { describe, expect, it } from "vitest";
import {
  buildNumberOperationsCandidateBandResult,
} from "./numberOperationsPlacementResult";
import { buildNumberOperationsProfile } from "./numberOperationsProfile";
import { buildNumberOperationsBaselineSummarySnapshot } from "./numberOperationsBaselineSnapshot";
import { buildNumberOperationsSubElementAttemptTrace } from "./numberOperationsAttemptTrace";

describe("Number Operations baseline summary snapshot", () => {
  it("creates a complete versioned summary without pretending it fits the pathway-attempt table", () => {
    const keys = [
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ] as const;

    const profile = buildNumberOperationsProfile(
      keys.map((subElementKey) =>
        buildNumberOperationsCandidateBandResult({
          subElementKey,
          lowerP: 5,
          upperP: 6,
        }),
      ),
    );

    const numberResult = profile.results.find(
      (result) => result.subElementKey === "number-place-value",
    );
    const numberTrace = buildNumberOperationsSubElementAttemptTrace({
      subElementKey: "number-place-value",
      subElementLabel: "Number and place value",
      stages: [
        {
          stage: "initial",
          pLevel: 6,
          responses: [
            {
              itemId: "myl-anchor-npv-p06-a-v1",
              selectedOptionIds: ["four-thousands-three-hundreds"],
              correct: false,
              skillId: "npv-p6-flexible-renaming",
              misconceptionTags: ["flexible-renaming-error"],
            },
          ],
        },
      ],
      routeTrace: ["Initial evidence routed down from P6 to P3."],
      result: numberResult || null,
    });

    const snapshot = buildNumberOperationsBaselineSummarySnapshot({
      profile,
      subElementAttempts: [numberTrace],
      startedAt: "2026-10-03T08:00:00Z",
      completedAt: "2026-10-03T08:25:00Z",
    });

    expect(snapshot).toMatchObject({
      schema: "mylearna-number-operations-baseline-summary",
      schemaVersion: 1,
      formId: "number-operations-baseline",
      formVersion: 1,
      mode: "diagnostic",
      status: "complete",
      assessedSubElements: 5,
      expectedSubElements: 5,
      scopeSubElements: [
        "number-place-value",
        "counting-processes",
        "additive-strategies",
        "multiplicative-strategies",
        "understanding-money",
      ],
      unresolvedSubElements: [],
    });
    expect(snapshot.persistencePolicy).toEqual({
      pathwayAttemptCompatible: false,
      reason: expect.stringMatching(/spans multiple independent progression sub-elements/i),
      saveFormalEvidenceAutomatically: false,
      parentConfirmationRequiredForEvidence: true,
      updatePathwayStatusAutomatically: false,
      updateAssessmentConfidenceAutomatically: false,
    });
    expect(snapshot.evidencePreview.requiresParentConfirmation).toBe(true);
    expect(snapshot.subElementAttempts).toHaveLength(1);
    expect(snapshot.subElementAttempts[0].stages[0].responses[0].itemId).toBe(
      "myl-anchor-npv-p06-a-v1",
    );
  });

  it("stays partial when any sub-element remains unresolved", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 4,
        upperP: 5,
      }),
    ]);

    const snapshot = buildNumberOperationsBaselineSummarySnapshot({
      profile,
      unresolvedSubElements: ["counting-processes"],
      startedAt: "2026-10-03T08:00:00Z",
      completedAt: "2026-10-03T08:05:00Z",
    });

    expect(snapshot.status).toBe("partial");
    expect(snapshot.unresolvedSubElements).toEqual(["counting-processes"]);
  });

  it("rejects invalid time ordering", () => {
    const profile = buildNumberOperationsProfile([]);

    expect(() =>
      buildNumberOperationsBaselineSummarySnapshot({
        profile,
        startedAt: "2026-10-03T09:00:00Z",
        completedAt: "2026-10-03T08:00:00Z",
      }),
    ).toThrow(/must not be earlier/i);
  });
});


it("marks a successful focused one-area snapshot complete for that scope", () => {
  const result = buildNumberOperationsCandidateBandResult({
    subElementKey: "additive-strategies",
    lowerP: 5,
    upperP: 6,
  });
  const profile = buildNumberOperationsProfile([result], {
    expectedSubElementKeys: ["additive-strategies"],
  });

  const snapshot = buildNumberOperationsBaselineSummarySnapshot({
    profile,
    unresolvedSubElements: ["understanding-money"],
    startedAt: "2026-10-03T08:00:00Z",
    completedAt: "2026-10-03T08:05:00Z",
  });

  expect(snapshot).toMatchObject({
    status: "complete",
    assessedSubElements: 1,
    expectedSubElements: 1,
    scopeSubElements: ["additive-strategies"],
    unresolvedSubElements: [],
  });
  expect(snapshot.persistencePolicy.reason).toMatch(
    /focused starting-point check.*rather than one canonical My Pathways step/i,
  );
});


it("drops attempt traces outside a focused requested scope", () => {
  const additive = buildNumberOperationsCandidateBandResult({
    subElementKey: "additive-strategies",
    lowerP: 5,
    upperP: 6,
  });
  const profile = buildNumberOperationsProfile([additive], {
    expectedSubElementKeys: ["additive-strategies"],
  });

  const outsideTrace = buildNumberOperationsSubElementAttemptTrace({
    subElementKey: "understanding-money",
    subElementLabel: "Understanding money",
    stages: [],
    routeTrace: [],
    result: null,
  });

  const snapshot = buildNumberOperationsBaselineSummarySnapshot({
    profile,
    subElementAttempts: [outsideTrace],
    unresolvedSubElements: ["understanding-money"],
    startedAt: "2026-10-03T08:00:00Z",
    completedAt: "2026-10-03T08:05:00Z",
  });

  expect(snapshot.scopeSubElements).toEqual(["additive-strategies"]);
  expect(snapshot.unresolvedSubElements).toEqual([]);
  expect(snapshot.subElementAttempts).toEqual([]);
});
