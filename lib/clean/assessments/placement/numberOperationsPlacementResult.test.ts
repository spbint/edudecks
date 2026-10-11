import { describe, expect, it } from "vitest";
import {
  buildNpvCandidateBandResult,
  buildNpvEndpointResult,
  buildNumberOperationsCandidateBandResult,
} from "./numberOperationsPlacementResult";

describe("Number Operations placement result model", () => {
  it("builds an adjacent NPV candidate band without pretending it is a calibrated score", () => {
    const result = buildNpvCandidateBandResult({
      lowerP: 4,
      upperP: 5,
    });

    expect(result).toMatchObject({
      frameworkId: "MYL-MATH-AU-NUMERACY-V9",
      subElementKey: "number-place-value",
      status: "candidate-band",
      lowerP: 4,
      upperP: 5,
      confidence: "provisional-moderate",
      typicalYearAlignment: "Years 1–2 to Year 2",
    });
    expect(result.claim).toContain("between P4 and P5");
    expect(result.interpretation).toContain("reads, orders and renames numbers");
    expect(result.nextVerification).toContain("Verify P5");
    expect(result.limitations.join(" ")).toMatch(/not a calibrated psychometric score/i);
  });

  it("drops the confidence ceiling when the route passed through hybrid evidence", () => {
    const result = buildNpvCandidateBandResult({
      lowerP: 1,
      upperP: 2,
      evidenceLimitations: [
        "Observed strategy evidence is not available in this unsupervised route.",
      ],
    });

    expect(result.confidence).toBe("routing-only");
    expect(result.limitations).toContain(
      "Observed strategy evidence is not available in this unsupervised route.",
    );
  });

  it("builds useful candidate-band interpretation for non-NPV sub-elements", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "multiplicative-strategies",
      lowerP: 6,
      upperP: 7,
    });

    expect(result).toMatchObject({
      subElementLabel: "Multiplicative strategies",
      status: "candidate-band",
      lowerP: 6,
      upperP: 7,
      confidence: "provisional-moderate",
    });
    expect(result.interpretation).toMatch(/single-digit multiplication\/division/i);
    expect(result.interpretation).toMatch(/inverse operations/i);
    expect(result.typicalYearAlignment).toBe("Years 4–5");
  });

  it("adds contextual year alignment to money evidence without turning it into the primary placement", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "understanding-money",
      lowerP: 7,
      upperP: 8,
    });

    expect(result.typicalYearAlignment).toBe("Years 4–6 to Years 6–8");
    expect(result.claim).toContain("between P7 and P8");
  });

  it("keeps money interpretations within the constructs actually sampled", () => {
    const lowerBand = buildNumberOperationsCandidateBandResult({
      subElementKey: "understanding-money",
      lowerP: 7,
      upperP: 8,
    });
    const upperBand = buildNumberOperationsCandidateBandResult({
      subElementKey: "understanding-money",
      lowerP: 8,
      upperP: 9,
    });

    expect(lowerBand.interpretation).toMatch(/subscription costs/i);
    expect(lowerBand.interpretation).toMatch(/discounts and simple interest/i);
    expect(upperBand.interpretation).toMatch(/best buys and percentage profit\/loss/i);
  });

  it("uses open-ended language at the top of the progression", () => {
    const result = buildNpvEndpointResult({
      relation: "at-least",
      pLevel: 10,
    });

    expect(result.claim).toBe("Current evidence reaches at least P10.");
    expect(result.interpretation).toMatch(/no higher level/i);
    expect(result.nextVerification).toMatch(/full Australian Curriculum Mathematics layer/i);
  });

  it("rejects an invalid candidate band", () => {
    expect(() =>
      buildNpvCandidateBandResult({ lowerP: 5, upperP: 5 }),
    ).toThrow(/upper level must be greater/i);
  });
});
