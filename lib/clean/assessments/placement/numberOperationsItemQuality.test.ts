import { describe, expect, it } from "vitest";
import {
  auditNumberOperationsPlacementItems,
  validatePlacementItem,
} from "./numberOperationsItemQuality";
import {
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
} from "./numberOperationsItemRegistry";

describe("Number Operations placement item quality", () => {
  it("passes the structural quality gate across the full canonical bank", () => {
    expect(auditNumberOperationsPlacementItems()).toEqual([]);
  });

  it("detects an invalid correct option without mutating the registry", () => {
    const source = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.find(
      (entry) => entry.item.response.type === "single-choice",
    );
    expect(source).toBeTruthy();
    if (!source) return;

    const issues = validatePlacementItem({
      ...source,
      item: {
        ...source.item,
        response: {
          ...source.item.response,
          correctOptionIds: ["does-not-exist"],
        },
      },
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-correct-option" }),
      ]),
    );
  });
});
