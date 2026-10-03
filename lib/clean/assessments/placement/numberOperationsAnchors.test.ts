import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_ANCHOR_SETS,
  getNumberOperationsAnchorSet,
  routeBranchAnchor,
  routeInitialAnchor,
} from "./numberOperationsAnchors";

describe("Number Operations anchor routing", () => {
  it("keeps the P0 catalogue complete and explicit", () => {
    expect(NUMBER_OPERATIONS_ANCHOR_SETS).toHaveLength(5);

    const anchors = NUMBER_OPERATIONS_ANCHOR_SETS.flatMap((set) => set.anchors);
    const slots = anchors.flatMap((anchor) => anchor.slots);
    const reuse = slots.filter((slot) => slot.status.startsWith("reuse-"));

    expect(anchors).toHaveLength(15);
    expect(slots).toHaveLength(30);
    expect(reuse).toHaveLength(11);
    expect(new Set(slots.map((slot) => slot.blueprintId)).size).toBe(30);
  });

  it("uses source-aligned reuse candidates for the audited P6 anchors", () => {
    const npv = getNumberOperationsAnchorSet("number-place-value");
    const multiplicative = getNumberOperationsAnchorSet("multiplicative-strategies");
    expect(npv).not.toBeNull();
    expect(multiplicative).not.toBeNull();
    if (!npv || !multiplicative) return;

    const npvInitial = npv.anchors.find((item) => item.role === "initial");
    expect(npvInitial?.slots.map((slot) => slot.existingItemId)).toEqual([
      "place-value-ops-flexible-renaming-003",
      "place-value-ops-rounding-gap-006",
    ]);

    const multiplicativeInitial = multiplicative.anchors.find((item) => item.role === "initial");
    expect(multiplicativeInitial?.slots.map((slot) => slot.existingItemId)).toEqual([
      "multiplication-division-fluency-context-problem-011",
      "multiplication-division-fluency-sharing-004",
    ]);
    expect(
      multiplicativeInitial?.slots.some(
        (slot) => slot.existingItemId === "multiplication-division-fluency-inverse-working-009",
      ),
    ).toBe(false);
  });

  it("routes a clear initial anchor down, up, or to an extra same-level probe", () => {
    const set = getNumberOperationsAnchorSet("number-place-value");
    expect(set).not.toBeNull();
    if (!set) return;

    expect(routeInitialAnchor(set, [0, 0])).toEqual({
      kind: "down",
      score: 0,
      targetP: 3,
    });
    expect(routeInitialAnchor(set, [1, 1])).toEqual({
      kind: "up",
      score: 2,
      targetP: 9,
    });
    expect(routeInitialAnchor(set, [1, 0])).toEqual({
      kind: "same-level-extra",
      score: 1,
      targetP: 6,
    });
    expect(routeInitialAnchor(set, [1, null])).toEqual({
      kind: "awaiting",
      score: null,
    });
  });

  it("brackets the learner when the branch anchor reverses the initial direction", () => {
    const set = getNumberOperationsAnchorSet("multiplicative-strategies");
    expect(set).not.toBeNull();
    if (!set) return;

    const up = routeInitialAnchor(set, [1, 1]);
    expect(routeBranchAnchor(set, up, [0, 0])).toEqual({
      kind: "bracket",
      lowerP: 6,
      upperP: 9,
    });

    const down = routeInitialAnchor(set, [0, 0]);
    expect(routeBranchAnchor(set, down, [1, 1])).toEqual({
      kind: "bracket",
      lowerP: 3,
      upperP: 6,
    });
  });

  it("continues searching only when both branch items support the same direction", () => {
    const money = getNumberOperationsAnchorSet("understanding-money");
    expect(money).not.toBeNull();
    if (!money) return;

    const up = routeInitialAnchor(money, [1, 1]);
    expect(routeBranchAnchor(money, up, [1, 1])).toEqual({
      kind: "search-up",
      fromP: 8,
    });

    const down = routeInitialAnchor(money, [0, 0]);
    expect(routeBranchAnchor(money, down, [0, 0])).toEqual({
      kind: "search-down",
      fromP: 2,
    });
  });

  it("never turns a mixed initial anchor into a placement bracket", () => {
    const counting = getNumberOperationsAnchorSet("counting-processes");
    expect(counting).not.toBeNull();
    if (!counting) return;

    const mixed = routeInitialAnchor(counting, [1, 0]);
    expect(routeBranchAnchor(counting, mixed, [1, 1])).toEqual({ kind: "awaiting" });
  });
});
