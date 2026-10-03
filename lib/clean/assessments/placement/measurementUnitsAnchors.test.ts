import { describe, expect, it } from "vitest";
import {
  MEASUREMENT_UNITS_ANCHOR_SET,
  getMeasurementUnitsEvidenceMode,
} from "./measurementUnitsAnchors";
import {
  MEASUREMENT_UNITS_EXECUTABLE_ANCHORS,
  MEASUREMENT_UNITS_P6_RESERVE_ITEM,
} from "./measurementUnitsItems";
import {
  resolveAdaptiveInitialWithReserve,
  routeAdaptiveBranch,
  routeAdaptiveInitial,
} from "./adaptiveProgressionRouting";

describe("measurement-units adaptive anchor slice", () => {
  it("uses P3/P6/P9 anchors across the P1-P10 source progression", () => {
    expect(MEASUREMENT_UNITS_ANCHOR_SET).toMatchObject({
      minP: 1,
      maxP: 10,
      lowerP: 3,
      initialP: 6,
      upperP: 9,
    });
    expect(MEASUREMENT_UNITS_ANCHOR_SET.anchors.map((anchor) => anchor.pLevel)).toEqual([
      3,
      6,
      9,
    ]);
  });

  it("keeps early measurement behind a practical evidence ceiling", () => {
    expect(getMeasurementUnitsEvidenceMode(1)).toBe("hybrid-practical");
    expect(getMeasurementUnitsEvidenceMode(3)).toBe("hybrid-practical");
    expect(getMeasurementUnitsEvidenceMode(5)).toBe("trusted-visual-review");
    expect(getMeasurementUnitsEvidenceMode(6)).toBe("trusted-visual-review");
    expect(getMeasurementUnitsEvidenceMode(7)).toBe("direct-digital");
    expect(getMeasurementUnitsEvidenceMode(10)).toBe("direct-digital");
  });

  it("provides two executable items at each anchor plus a P6 reserve probe", () => {
    expect(Object.keys(MEASUREMENT_UNITS_EXECUTABLE_ANCHORS)).toEqual([
      "understanding-units-measurement-p3",
      "understanding-units-measurement-p6",
      "understanding-units-measurement-p9",
    ]);
    expect(Object.values(MEASUREMENT_UNITS_EXECUTABLE_ANCHORS).flat()).toHaveLength(6);
    expect(MEASUREMENT_UNITS_P6_RESERVE_ITEM.status).toBe("draft");
  });

  it("uses the same generic reserve and branch rules as Number Operations", () => {
    const mixed = routeAdaptiveInitial(MEASUREMENT_UNITS_ANCHOR_SET, [1, 0]);
    expect(mixed).toEqual({
      kind: "same-level-extra",
      score: 1,
      targetP: 6,
    });

    const resolvedUp = resolveAdaptiveInitialWithReserve(
      MEASUREMENT_UNITS_ANCHOR_SET,
      [1, 0],
      1,
    );
    expect(resolvedUp).toEqual({ kind: "up", score: 2, targetP: 9 });

    expect(
      routeAdaptiveBranch(MEASUREMENT_UNITS_ANCHOR_SET, resolvedUp, [0, 1]),
    ).toEqual({
      kind: "bracket",
      lowerP: 6,
      upperP: 9,
    });
  });

  it("marks the P3 proxies routing-only rather than proof of physical measurement", () => {
    for (const item of MEASUREMENT_UNITS_EXECUTABLE_ANCHORS[
      "understanding-units-measurement-p3"
    ]) {
      expect(item.analytics?.tags).toContain("routing-only");
      expect(item.analytics?.tags).toContain("hybrid-practical");
    }
  });
});
