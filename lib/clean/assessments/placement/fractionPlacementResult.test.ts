import { describe, expect, it } from "vitest";
import {
  buildFractionCandidateBandResult,
  buildFractionEndpointResult,
} from "./fractionPlacementResult";

describe("Interpreting fractions placement results", () => {
  it("keeps early practical fraction bands routing-only", () => {
    const result = buildFractionCandidateBandResult({
      lowerP: 1,
      upperP: 2,
    });

    expect(result).toMatchObject({
      subElementKey: "interpreting-fractions",
      lowerP: 1,
      upperP: 2,
      confidence: "routing-only",
    });
    expect(result.limitations.join(" ")).toMatch(/physically creating equal parts/i);
  });

  it("builds a visual/provisional number-line fraction band", () => {
    const result = buildFractionCandidateBandResult({
      lowerP: 5,
      upperP: 6,
    });

    expect(result).toMatchObject({
      confidence: "provisional-moderate",
      typicalYearAlignment: "Years 3–4 to Years 4–5",
    });
    expect(result.interpretation).toMatch(/equivalent fractions/i);
    expect(result.interpretation).toMatch(/number lines/i);
    expect(result.limitations.join(" ")).toMatch(/trusted equal-part and number-line visuals/i);
  });

  it("uses open-ended language at P9", () => {
    const result = buildFractionEndpointResult({
      relation: "at-least",
      pLevel: 9,
    });

    expect(result.claim).toBe("Current evidence reaches at least P9.");
    expect(result.interpretation).toMatch(/no higher Interpreting fractions level/i);
    expect(result.nextVerification).toMatch(/rational-number layer/i);
  });

  it("rejects invalid candidate bands", () => {
    expect(() =>
      buildFractionCandidateBandResult({
        lowerP: 6,
        upperP: 6,
      }),
    ).toThrow(/upper level must be greater/i);
  });
});
