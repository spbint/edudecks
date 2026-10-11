import { describe, expect, it } from "vitest";
import {
  CHANCE_ANCHOR_SET,
  getChanceEvidenceMode,
} from "./chanceAnchors";
import {
  CHANCE_BOUNDARY_CLUSTERS,
  CHANCE_EXECUTABLE_ANCHORS,
  CHANCE_P4_RESERVE_ITEM,
  CHANCE_SEARCH_CLUSTERS,
} from "./chanceItems";
import {
  resolveAdaptiveInitialWithReserve,
  routeAdaptiveBranch,
  routeAdaptiveInitial,
} from "./adaptiveProgressionRouting";

describe("Understanding chance adaptive slice", () => {
  it("uses P2/P4/P6 anchors across the P1-P6 source progression", () => {
    expect(CHANCE_ANCHOR_SET).toMatchObject({
      minP: 1,
      maxP: 6,
      lowerP: 2,
      initialP: 4,
      upperP: 6,
    });
    expect(CHANCE_ANCHOR_SET.anchors.map((anchor) => anchor.pLevel)).toEqual([
      2,
      4,
      6,
    ]);
  });

  it("keeps only the earliest everyday-chance layer routing-only", () => {
    expect(getChanceEvidenceMode(1)).toBe("contextual-routing");
    expect(getChanceEvidenceMode(2)).toBe("direct-digital");
    expect(getChanceEvidenceMode(6)).toBe("direct-digital");
  });

  it("provides complete anchor, search and boundary pools", () => {
    expect(Object.values(CHANCE_EXECUTABLE_ANCHORS).flat()).toHaveLength(6);
    expect(CHANCE_P4_RESERVE_ITEM.status).toBe("draft");
    expect(Object.values(CHANCE_SEARCH_CLUSTERS).flat()).toHaveLength(2);
    expect(Object.values(CHANCE_BOUNDARY_CLUSTERS).flat()).toHaveLength(6);
  });

  it("uses the generic reserve and branch rules", () => {
    const mixed = routeAdaptiveInitial(CHANCE_ANCHOR_SET, [1, 0]);
    expect(mixed).toEqual({
      kind: "same-level-extra",
      score: 1,
      targetP: 4,
    });

    const resolved = resolveAdaptiveInitialWithReserve(
      CHANCE_ANCHOR_SET,
      [1, 0],
      1,
    );
    expect(resolved).toEqual({ kind: "up", score: 2, targetP: 6 });

    expect(
      routeAdaptiveBranch(CHANCE_ANCHOR_SET, resolved, [1, 0]),
    ).toEqual({
      kind: "bracket",
      lowerP: 4,
      upperP: 6,
    });
  });

  it("marks P1 items contextual routing-only", () => {
    for (const item of CHANCE_SEARCH_CLUSTERS["understanding-chance-p1"]) {
      expect(item.analytics?.tags).toContain("contextual-routing");
      expect(item.analytics?.tags).toContain("routing-only");
    }
  });
});
