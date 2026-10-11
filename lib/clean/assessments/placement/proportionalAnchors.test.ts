import { describe, expect, it } from "vitest";
import { PROPORTIONAL_ANCHOR_SET } from "./proportionalAnchors";
import {
  PROPORTIONAL_BOUNDARY_CLUSTERS,
  PROPORTIONAL_EXECUTABLE_ANCHORS,
  PROPORTIONAL_P4_RESERVE_ITEM,
  PROPORTIONAL_SEARCH_CLUSTERS,
} from "./proportionalItems";
import {
  resolveAdaptiveInitialWithReserve,
  routeAdaptiveBranch,
  routeAdaptiveInitial,
} from "./adaptiveProgressionRouting";

describe("Proportional thinking adaptive slice", () => {
  it("uses P2/P4/P6 anchors across the P1-P7 source progression", () => {
    expect(PROPORTIONAL_ANCHOR_SET).toMatchObject({
      minP: 1,
      maxP: 7,
      lowerP: 2,
      initialP: 4,
      upperP: 6,
    });
  });

  it("provides complete routing pools", () => {
    expect(Object.values(PROPORTIONAL_EXECUTABLE_ANCHORS).flat()).toHaveLength(6);
    expect(PROPORTIONAL_P4_RESERVE_ITEM.status).toBe("draft");
    expect(Object.values(PROPORTIONAL_SEARCH_CLUSTERS).flat()).toHaveLength(4);
    expect(Object.values(PROPORTIONAL_BOUNDARY_CLUSTERS).flat()).toHaveLength(6);
  });

  it("uses generic reserve and branch routing", () => {
    const mixed = routeAdaptiveInitial(PROPORTIONAL_ANCHOR_SET, [1, 0]);
    expect(mixed.kind).toBe("same-level-extra");

    const resolved = resolveAdaptiveInitialWithReserve(
      PROPORTIONAL_ANCHOR_SET,
      [1, 0],
      1,
    );
    expect(resolved).toEqual({ kind: "up", score: 2, targetP: 6 });
    expect(
      routeAdaptiveBranch(PROPORTIONAL_ANCHOR_SET, resolved, [1, 0]),
    ).toEqual({ kind: "bracket", lowerP: 4, upperP: 6 });
  });

  it("keeps every item versioned and draft-only", () => {
    const all = [
      ...Object.values(PROPORTIONAL_EXECUTABLE_ANCHORS).flat(),
      PROPORTIONAL_P4_RESERVE_ITEM,
      ...Object.values(PROPORTIONAL_SEARCH_CLUSTERS).flat(),
      ...Object.values(PROPORTIONAL_BOUNDARY_CLUSTERS).flat(),
    ];
    expect(all).toHaveLength(17);
    expect(all.every((item) => item.version === 1 && item.status === "draft")).toBe(true);
  });
});
