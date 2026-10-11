import { describe, expect, it } from "vitest";
import {
  FRACTION_ANCHOR_SET,
  getFractionEvidenceMode,
} from "./fractionAnchors";
import {
  FRACTION_BOUNDARY_CLUSTERS,
  FRACTION_EXECUTABLE_ANCHORS,
  FRACTION_P6_RESERVE_ITEM,
  FRACTION_SEARCH_CLUSTERS,
} from "./fractionItems";
import {
  resolveAdaptiveInitialWithReserve,
  routeAdaptiveBranch,
  routeAdaptiveInitial,
} from "./adaptiveProgressionRouting";

describe("Interpreting fractions adaptive slice", () => {
  it("uses P3/P6/P9 anchors across the P1-P9 source progression", () => {
    expect(FRACTION_ANCHOR_SET).toMatchObject({
      minP: 1,
      maxP: 9,
      lowerP: 3,
      initialP: 6,
      upperP: 9,
    });
    expect(FRACTION_ANCHOR_SET.anchors.map((anchor) => anchor.pLevel)).toEqual([
      3,
      6,
      9,
    ]);
  });

  it("keeps P1-P2 practical and P3-P6 behind visual review", () => {
    expect(getFractionEvidenceMode(1)).toBe("hybrid-practical");
    expect(getFractionEvidenceMode(2)).toBe("hybrid-practical");
    expect(getFractionEvidenceMode(3)).toBe("trusted-visual-review");
    expect(getFractionEvidenceMode(6)).toBe("trusted-visual-review");
    expect(getFractionEvidenceMode(7)).toBe("direct-digital");
    expect(getFractionEvidenceMode(9)).toBe("direct-digital");
  });

  it("provides complete routing pools", () => {
    expect(Object.values(FRACTION_EXECUTABLE_ANCHORS).flat()).toHaveLength(6);
    expect(FRACTION_P6_RESERVE_ITEM.status).toBe("draft");
    expect(Object.values(FRACTION_SEARCH_CLUSTERS).flat()).toHaveLength(4);
    expect(Object.values(FRACTION_BOUNDARY_CLUSTERS).flat()).toHaveLength(12);
  });

  it("uses the generic reserve and branch rules", () => {
    const mixed = routeAdaptiveInitial(FRACTION_ANCHOR_SET, [1, 0]);
    expect(mixed).toEqual({
      kind: "same-level-extra",
      score: 1,
      targetP: 6,
    });

    const resolved = resolveAdaptiveInitialWithReserve(
      FRACTION_ANCHOR_SET,
      [1, 0],
      0,
    );
    expect(resolved).toEqual({ kind: "down", score: 0, targetP: 3 });

    expect(
      routeAdaptiveBranch(FRACTION_ANCHOR_SET, resolved, [1, 0]),
    ).toEqual({
      kind: "bracket",
      lowerP: 3,
      upperP: 6,
    });
  });

  it("uses the fractional number-line visual at P6", () => {
    const numberLine = FRACTION_EXECUTABLE_ANCHORS[
      "interpreting-fractions-p6"
    ][1];

    expect(numberLine.stimulus).toMatchObject({
      type: "number-line",
      data: {
        min: 0,
        max: 1,
        marker: 2 / 3,
      },
    });
    expect((numberLine.stimulus.data as { step?: number }).step).toBeCloseTo(
      1 / 3,
    );
  });

  it("keeps P1-P2 electronic tasks routing-only", () => {
    for (const item of Object.values(FRACTION_SEARCH_CLUSTERS).flat()) {
      expect(item.analytics?.tags).toContain("routing-only");
    }
  });
});
