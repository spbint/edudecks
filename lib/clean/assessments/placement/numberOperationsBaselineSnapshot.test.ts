import { describe, expect, it } from "vitest";
import {
  buildNumberOperationsCandidateBandResult,
} from "./numberOperationsPlacementResult";
import { buildNumberOperationsProfile } from "./numberOperationsProfile";
import { buildNumberOperationsBaselineSummarySnapshot } from "./numberOperationsBaselineSnapshot";

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

    const snapshot = buildNumberOperationsBaselineSummarySnapshot({
      profile,
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
