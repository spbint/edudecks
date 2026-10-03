import { describe, expect, it } from "vitest";
import {
  ASSESSMENT_PLACEMENT_ITEM_REGISTRY,
  getAssessmentPlacementItemById,
  getAssessmentPlacementItemInventory,
} from "./assessmentPlacementItemRegistry";

describe("cross-strand assessment placement item registry", () => {
  it("contains the Number first slice plus Measurement units proof with unique IDs", () => {
    expect(ASSESSMENT_PLACEMENT_ITEM_REGISTRY).toHaveLength(180);

    const ids = ASSESSMENT_PLACEMENT_ITEM_REGISTRY.map(
      (entry) => entry.item.id,
    );
    expect(new Set(ids).size).toBe(180);
  });

  it("tracks both implemented lanes", () => {
    const inventory = getAssessmentPlacementItemInventory();
    expect(
      inventory.filter((item) => item.lane === "number-operations"),
    ).toHaveLength(140);
    expect(
      inventory.filter((item) => item.lane === "measurement-units"),
    ).toHaveLength(25);
    expect(
      inventory.filter((item) => item.lane === "chance"),
    ).toHaveLength(15);
  });

  it("finds the trusted graduated-scale measurement item", () => {
    expect(
      getAssessmentPlacementItemById("myl-anchor-uom-p06-a-v1"),
    ).toMatchObject({
      lane: "measurement-units",
      poolKind: "anchor",
      poolKey: "understanding-units-measurement-p6",
      item: {
        version: 1,
        stimulus: {
          type: "graduated-scale",
        },
      },
    });
  });

  it("finds the upper Chance conditional-probability item", () => {
    expect(
      getAssessmentPlacementItemById("myl-anchor-cha-p06-a-v1"),
    ).toMatchObject({
      lane: "chance",
      poolKind: "anchor",
      poolKey: "understanding-chance-p6",
      item: {
        version: 1,
        response: {
          type: "short-answer",
        },
      },
    });
  });

  it("keeps every cross-strand item draft and versioned", () => {
    for (const entry of ASSESSMENT_PLACEMENT_ITEM_REGISTRY) {
      expect(entry.item.status).toBe("draft");
      expect(entry.item.version).toBeGreaterThanOrEqual(1);
      expect(entry.item.id).toMatch(
        new RegExp("-v" + entry.item.version + "$"),
      );
    }
  });
});
