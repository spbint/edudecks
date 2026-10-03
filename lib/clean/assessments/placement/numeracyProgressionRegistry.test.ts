import { describe, expect, it } from "vitest";
import {
  NUMERACY_PROGRESSION_ELEMENTS,
  NUMERACY_PROGRESSION_SUB_ELEMENTS,
  getNumeracyImplementationSummary,
  getNumeracyProgressionSubElement,
} from "./numeracyProgressionRegistry";

describe("complete numeracy progression registry", () => {
  it("encodes the three source elements and all 14 sub-elements", () => {
    expect(NUMERACY_PROGRESSION_ELEMENTS.map((item) => item.key)).toEqual([
      "number-sense-algebra",
      "measurement-geometry",
      "statistics-probability",
    ]);
    expect(NUMERACY_PROGRESSION_SUB_ELEMENTS).toHaveLength(14);
    expect(new Set(NUMERACY_PROGRESSION_SUB_ELEMENTS.map((item) => item.key)).size).toBe(14);
  });

  it("preserves the source progression ceilings", () => {
    expect(getNumeracyProgressionSubElement("number-place-value")?.maxP).toBe(10);
    expect(getNumeracyProgressionSubElement("counting-processes")?.maxP).toBe(8);
    expect(getNumeracyProgressionSubElement("interpreting-fractions")?.maxP).toBe(9);
    expect(getNumeracyProgressionSubElement("proportional-thinking")?.maxP).toBe(7);
    expect(getNumeracyProgressionSubElement("understanding-geometric-properties")?.maxP).toBe(7);
    expect(getNumeracyProgressionSubElement("positioning-locating")?.maxP).toBe(5);
    expect(getNumeracyProgressionSubElement("understanding-chance")?.maxP).toBe(6);
    expect(getNumeracyProgressionSubElement("interpreting-representing-data")?.maxP).toBe(8);
  });

  it("marks the five Number & Operations lanes plus Measurement and Chance cross-strand proofs implemented", () => {
    const summary = getNumeracyImplementationSummary();

    expect(summary).toMatchObject({
      elementCount: 3,
      subElementCount: 14,
      implementedCount: 7,
      firstSliceCount: 5,
      crossStrandProofCount: 2,
      blueprintNextCount: 7,
    });
    expect(summary.implemented.map((item) => item.key)).toEqual([
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
      "understanding-units-measurement",
      "understanding-chance",
    ]);
    expect(summary.crossStrandProof.map((item) => item.key)).toEqual([
      "understanding-units-measurement",
      "understanding-chance",
    ]);
  });

  it("keeps every sub-element source-addressable", () => {
    expect(
      NUMERACY_PROGRESSION_SUB_ELEMENTS.every(
        (item) =>
          item.minP === 1 &&
          item.maxP >= item.minP &&
          item.sourcePages.length > 0,
      ),
    ).toBe(true);
  });
});
