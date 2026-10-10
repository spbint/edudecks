import { describe, expect, it } from "vitest";
import {
  buildMeasurementUnitsCandidateBandResult,
  buildMeasurementUnitsEndpointResult,
} from "./measurementUnitsPlacementResult";

describe("Measurement units placement results", () => {
  it("keeps lower practical bands routing-only", () => {
    const result = buildMeasurementUnitsCandidateBandResult({
      lowerP: 3,
      upperP: 4,
    });

    expect(result).toMatchObject({
      subElementKey: "understanding-units-measurement",
      lowerP: 3,
      upperP: 4,
      confidence: "routing-only",
    });
    expect(result.interpretation).toMatch(/uniform informal units/i);
    expect(result.limitations.join(" ")).toMatch(/observed use/i);
    expect(result.nextVerification).toMatch(/observed practical measurement evidence/i);
  });

  it("builds a direct/provisional upper measurement band", () => {
    const result = buildMeasurementUnitsCandidateBandResult({
      lowerP: 8,
      upperP: 9,
    });

    expect(result).toMatchObject({
      confidence: "provisional-moderate",
      typicalYearAlignment: "Years 6–7 to Years 7–9",
    });
    expect(result.interpretation).toMatch(/converts metric units/i);
    expect(result.interpretation).toMatch(/right-prism volume/i);
  });

  it("uses open-ended language at P10", () => {
    const result = buildMeasurementUnitsEndpointResult({
      relation: "at-least",
      pLevel: 10,
    });

    expect(result.claim).toBe("Current evidence reaches at least P10.");
    expect(result.interpretation).toMatch(/no higher level/i);
    expect(result.nextVerification).toMatch(/full Australian Curriculum Mathematics/i);
  });

  it("rejects invalid candidate bands", () => {
    expect(() =>
      buildMeasurementUnitsCandidateBandResult({
        lowerP: 6,
        upperP: 6,
      }),
    ).toThrow(/upper level must be greater/i);
  });
});
