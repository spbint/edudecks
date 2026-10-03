import { describe, expect, it } from "vitest";
import {
  buildChanceCandidateBandResult,
  buildChanceEndpointResult,
} from "./chancePlacementResult";

describe("Understanding chance placement results", () => {
  it("keeps a P1-P2 band routing-only because everyday chance is contextual", () => {
    const result = buildChanceCandidateBandResult({
      lowerP: 1,
      upperP: 2,
    });

    expect(result).toMatchObject({
      subElementKey: "understanding-chance",
      lowerP: 1,
      upperP: 2,
      confidence: "routing-only",
    });
    expect(result.limitations.join(" ")).toMatch(/context-sensitive/i);
  });

  it("builds a direct/provisional numerical probability band", () => {
    const result = buildChanceCandidateBandResult({
      lowerP: 4,
      upperP: 5,
    });

    expect(result).toMatchObject({
      confidence: "provisional-moderate",
      typicalYearAlignment: "Year 6 to Year 7",
    });
    expect(result.interpretation).toMatch(/theoretical probability/i);
    expect(result.interpretation).toMatch(/compound-event/i);
  });

  it("uses open-ended language at P6", () => {
    const result = buildChanceEndpointResult({
      relation: "at-least",
      pLevel: 6,
    });

    expect(result.claim).toBe("Current evidence reaches at least P6.");
    expect(result.interpretation).toMatch(/no higher Understanding chance level/i);
    expect(result.nextVerification).toMatch(/probability\\/statistics/i);
  });

  it("rejects invalid candidate bands", () => {
    expect(() =>
      buildChanceCandidateBandResult({
        lowerP: 4,
        upperP: 4,
      }),
    ).toThrow(/upper level must be greater/i);
  });
});
