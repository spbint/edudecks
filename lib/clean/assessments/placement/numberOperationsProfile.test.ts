import { describe, expect, it } from "vitest";
import {
  buildNumberOperationsCandidateBandResult,
  buildNumberOperationsEndpointResult,
} from "./numberOperationsPlacementResult";
import { buildNumberOperationsProfile } from "./numberOperationsProfile";

describe("Number Operations profile", () => {
  it("preserves independent sub-element results instead of averaging them", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 6,
        upperP: 7,
      }),
      buildNumberOperationsCandidateBandResult({
        subElementKey: "multiplicative-strategies",
        lowerP: 4,
        upperP: 5,
      }),
      buildNumberOperationsEndpointResult({
        subElementKey: "understanding-money",
        relation: "at-least",
        pLevel: 8,
      }),
    ]);

    expect(profile).toMatchObject({
      expectedSubElementKeys: [
        "number-place-value",
        "counting-processes",
        "additive-strategies",
        "multiplicative-strategies",
        "understanding-money",
      ],
      expectedSubElements: 5,
      assessedSubElements: 3,
      complete: false,
      directOrProvisionalCount: 3,
      routingOnlyCount: 0,
    });
    expect(profile.results.map((result) => result.subElementKey)).toEqual([
      "number-place-value",
      "multiplicative-strategies",
      "understanding-money",
    ]);
    expect(profile.overallStatement).toMatch(/does not infer missing sub-elements/i);
    expect(profile.overallStatement).toMatch(/does not.*average/i);
  });

  it("tracks routing-only evidence separately", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "counting-processes",
        lowerP: 1,
        upperP: 2,
        evidenceLimitations: [
          "Observed counting behaviour is not available in this unsupervised route.",
        ],
      }),
    ]);

    expect(profile.routingOnlyCount).toBe(1);
    expect(profile.directOrProvisionalCount).toBe(0);
  });

  it("marks the profile complete only when all five sub-elements are represented", () => {
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

    expect(profile.complete).toBe(true);
    expect(profile.assessedSubElements).toBe(5);
    expect(profile.overallStatement).toMatch(/all five sub-elements/i);
  });
});


it("treats a focused one-area profile as complete for that requested scope", () => {
  const result = buildNumberOperationsCandidateBandResult({
    subElementKey: "additive-strategies",
    lowerP: 5,
    upperP: 6,
  });

  const profile = buildNumberOperationsProfile([result], {
    expectedSubElementKeys: ["additive-strategies"],
  });

  expect(profile).toMatchObject({
    expectedSubElementKeys: ["additive-strategies"],
    expectedSubElements: 1,
    assessedSubElements: 1,
    complete: true,
  });
  expect(profile.overallStatement).toMatch(/selected area only/i);
  expect(profile.overallStatement).toMatch(/not.*whole/i);
});

it("ignores results outside an explicitly requested focused scope", () => {
  const profile = buildNumberOperationsProfile(
    [
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 5,
        upperP: 6,
      }),
      buildNumberOperationsCandidateBandResult({
        subElementKey: "understanding-money",
        lowerP: 5,
        upperP: 6,
      }),
    ],
    { expectedSubElementKeys: ["understanding-money"] },
  );

  expect(profile.results.map((result) => result.subElementKey)).toEqual([
    "understanding-money",
  ]);
  expect(profile.complete).toBe(true);
});
