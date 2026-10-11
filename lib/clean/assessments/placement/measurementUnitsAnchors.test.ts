import { describe, expect, it } from "vitest";
import {
  MEASUREMENT_UNITS_ANCHOR_SET,
  getMeasurementUnitsEvidenceMode,
} from "./measurementUnitsAnchors";
import {
  MEASUREMENT_UNITS_BOUNDARY_CLUSTERS,
  MEASUREMENT_UNITS_EXECUTABLE_ANCHORS,
  MEASUREMENT_UNITS_P6_RESERVE_ITEM,
  MEASUREMENT_UNITS_SEARCH_CLUSTERS,
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

  it("completes the first adaptive measurement route inventory", () => {
    expect(Object.keys(MEASUREMENT_UNITS_SEARCH_CLUSTERS)).toEqual([
      "understanding-units-measurement-p1",
      "understanding-units-measurement-p2",
      "understanding-units-measurement-p10",
    ]);
    expect(Object.values(MEASUREMENT_UNITS_SEARCH_CLUSTERS).flat()).toHaveLength(6);

    expect(Object.keys(MEASUREMENT_UNITS_BOUNDARY_CLUSTERS)).toEqual([
      "understanding-units-measurement-p4",
      "understanding-units-measurement-p5",
      "understanding-units-measurement-p7",
      "understanding-units-measurement-p8",
    ]);
    expect(Object.values(MEASUREMENT_UNITS_BOUNDARY_CLUSTERS).flat()).toHaveLength(12);
  });

  it("keeps P1-P4 electronic content explicitly routing-only", () => {
    const earlyItems = [
      ...MEASUREMENT_UNITS_SEARCH_CLUSTERS["understanding-units-measurement-p1"],
      ...MEASUREMENT_UNITS_SEARCH_CLUSTERS["understanding-units-measurement-p2"],
      ...MEASUREMENT_UNITS_EXECUTABLE_ANCHORS["understanding-units-measurement-p3"],
      ...MEASUREMENT_UNITS_BOUNDARY_CLUSTERS["understanding-units-measurement-p4"],
    ];

    expect(
      earlyItems.every((item) => item.analytics?.tags?.includes("routing-only")),
    ).toBe(true);
  });

  it("uses direct digital evidence for the upper measurement boundary and endpoint pools", () => {
    const upperItems = [
      ...MEASUREMENT_UNITS_BOUNDARY_CLUSTERS["understanding-units-measurement-p7"],
      ...MEASUREMENT_UNITS_BOUNDARY_CLUSTERS["understanding-units-measurement-p8"],
      ...MEASUREMENT_UNITS_EXECUTABLE_ANCHORS["understanding-units-measurement-p9"],
      ...MEASUREMENT_UNITS_SEARCH_CLUSTERS["understanding-units-measurement-p10"],
    ];

    expect(
      upperItems.every((item) =>
        item.analytics?.tags?.some((tag) =>
          ["direct-digital", "formula-area", "formula-volume"].includes(tag),
        ),
      ),
    ).toBe(true);
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
