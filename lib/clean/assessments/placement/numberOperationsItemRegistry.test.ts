import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
  getNumberOperationsPlacementItemById,
  getNumberOperationsPlacementItemInventory,
} from "./numberOperationsItemRegistry";

describe("Number Operations placement item registry", () => {
  it("contains the full first-slice item estate with unique IDs", () => {
    expect(NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY).toHaveLength(120);

    const ids = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.map(
      (entry) => entry.item.id,
    );
    expect(new Set(ids).size).toBe(120);
  });

  it("keeps every registry item versioned and draft-only", () => {
    const inventory = getNumberOperationsPlacementItemInventory();

    expect(inventory.every((item) => item.version === 1)).toBe(true);
    expect(inventory.every((item) => item.status === "draft")).toBe(true);
    expect(
      inventory.every((item) => item.curriculumCode?.startsWith("MYL-MATH-PROG-")),
    ).toBe(true);
  });

  it("tracks where each item belongs", () => {
    const anchor = getNumberOperationsPlacementItemById(
      "myl-anchor-npv-p06-a-v1",
    );
    const boundary = getNumberOperationsPlacementItemById(
      "myl-boundary-npv-p05-b-v1",
    );

    expect(anchor).toMatchObject({
      poolKind: "anchor",
      poolKey: "number-place-value-p6",
    });
    expect(boundary).toMatchObject({
      poolKind: "boundary",
      poolKey: "number-place-value-p5",
    });
  });

  it("does not use unknown score-bearing stimulus types", () => {
    const allowed = new Set([
      "none",
      "counter-set",
      "ten-frame",
      "number-line",
      "array",
      "place-value-blocks",
      "fraction-bar",
      "currency-tokens",
      "shape-set",
    ]);

    for (const entry of NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY) {
      expect(allowed.has(entry.item.stimulus.type)).toBe(true);
    }
  });
});
