import { describe, expect, it } from "vitest";
import {
  buildNumberOperationsCandidateBandResult,
  buildNumberOperationsEndpointResult,
} from "./numberOperationsPlacementResult";
import {
  buildNumberOperationsRecommendation,
  buildNumberOperationsRecommendations,
} from "./numberOperationsRecommendations";

describe("Number Operations recommendations", () => {
  it("targets the upper edge of a direct candidate band for practice and re-check", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "number-place-value",
      lowerP: 5,
      upperP: 6,
    });

    expect(buildNumberOperationsRecommendation(result)).toMatchObject({
      kind: "practice-next-level",
      targetP: 6,
      title: "Practise toward P6",
      recheckRecommended: true,
      resourceLinkStatus: "not-yet-mapped",
    });
  });

  it("does not turn routing-only evidence into a practice certainty", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "additive-strategies",
      lowerP: 2,
      upperP: 3,
      evidenceLimitations: [
        "Observed strategy evidence is required for high-confidence placement.",
      ],
    });

    expect(buildNumberOperationsRecommendation(result)).toMatchObject({
      kind: "verify-with-observation",
      targetP: 3,
      recheckRecommended: true,
    });
  });

  it("uses extension language at the top endpoint", () => {
    const result = buildNumberOperationsEndpointResult({
      subElementKey: "multiplicative-strategies",
      relation: "at-least",
      pLevel: 10,
    });

    expect(buildNumberOperationsRecommendation(result)).toMatchObject({
      kind: "extend-beyond-progression",
      targetP: 10,
      recheckRecommended: false,
    });
  });

  it("uses support language at the lower endpoint", () => {
    const result = buildNumberOperationsEndpointResult({
      subElementKey: "counting-processes",
      relation: "below-or-around",
      pLevel: 1,
      evidenceLimitations: ["Observed counting behaviour is required."],
    });

    expect(buildNumberOperationsRecommendation(result).kind).toBe(
      "verify-with-observation",
    );
  });

  it("builds one recommendation per independent result", () => {
    const recommendations = buildNumberOperationsRecommendations([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 5,
        upperP: 6,
      }),
      buildNumberOperationsCandidateBandResult({
        subElementKey: "understanding-money",
        lowerP: 7,
        upperP: 8,
      }),
    ]);

    expect(recommendations).toHaveLength(2);
    expect(recommendations.map((item) => item.subElementKey)).toEqual([
      "number-place-value",
      "understanding-money",
    ]);
  });
});
