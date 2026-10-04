import { describe, expect, it } from "vitest";
import { buildNumberOperationsProfile } from "./numberOperationsProfile";
import {
  buildNumberOperationsCandidateBandResult,
  buildNumberOperationsEndpointResult,
} from "./numberOperationsPlacementResult";
import { buildNumberOperationsParentUtility } from "./numberOperationsParentUtility";

describe("Number & Operations parent utility projection", () => {
  it("turns a direct candidate band into a next-learning action without making one whole-child level", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 5,
        upperP: 6,
      }),
    ]);

    const utility = buildNumberOperationsParentUtility(profile);

    expect(utility).toMatchObject({
      complete: false,
      assessedAreas: 1,
      expectedAreas: 5,
    });
    expect(utility.areas[0]).toMatchObject({
      state: "build-next",
      headline: "Ready to build on the next step",
      technicalBand: "P5–P6",
      recheckRecommended: true,
      pathwaysLabel: "Open Number and place value in My Pathways",
    });
    const pathwayUrl = new URL(
      utility.areas[0]!.pathwaysHref,
      "https://mylearna.test",
    );
    expect(pathwayUrl.searchParams.get("subjectKey")).toBe("mathematics");
    expect(pathwayUrl.searchParams.get("strandKey")).toBe("number-and-place-value");
    expect(utility.trustNote).toMatch(
      /not a grade, score, diagnosis or single maths level/i,
    );
  });

  it("prioritises evidence that needs practical verification before ordinary practice", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 5,
        upperP: 6,
      }),
      buildNumberOperationsCandidateBandResult({
        subElementKey: "additive-strategies",
        lowerP: 2,
        upperP: 3,
        evidenceLimitations: [
          "Observed strategy evidence is required for high-confidence placement.",
        ],
      }),
    ]);

    const utility = buildNumberOperationsParentUtility(profile);

    expect(utility.startHere).toMatchObject({
      subElementKey: "additive-strategies",
      state: "verify-in-learning",
      headline: "Check this in everyday learning",
      pathwaysLabel: "Open Operations and calculation in My Pathways",
    });
  });

  it("uses foundation and extension language at progression endpoints", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsEndpointResult({
        subElementKey: "counting-processes",
        relation: "below-or-around",
        pLevel: 1,
        evidenceLimitations: ["Observed counting behaviour is required."],
      }),
      buildNumberOperationsEndpointResult({
        subElementKey: "multiplicative-strategies",
        relation: "at-least",
        pLevel: 10,
      }),
    ]);

    const utility = buildNumberOperationsParentUtility(profile);

    expect(
      utility.areas.find((area) => area.subElementKey === "counting-processes"),
    ).toMatchObject({ state: "verify-in-learning" });
    expect(
      utility.areas.find(
        (area) => area.subElementKey === "multiplicative-strategies",
      ),
    ).toMatchObject({ state: "extend", headline: "Ready for extension" });
  });
});
