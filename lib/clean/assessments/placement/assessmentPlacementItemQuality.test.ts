import { describe, expect, it } from "vitest";
import {
  auditAssessmentPlacementItems,
  validateAssessmentPlacementItem,
} from "./assessmentPlacementItemQuality";
import { ASSESSMENT_PLACEMENT_ITEM_REGISTRY } from "./assessmentPlacementItemRegistry";

describe("cross-strand assessment placement item quality", () => {
  it("passes the structural quality gate across Number and Measurement lanes", () => {
    expect(auditAssessmentPlacementItems()).toEqual([]);
  });

  it("includes the graduated-scale Measurement item in the same quality gate", () => {
    const entry = ASSESSMENT_PLACEMENT_ITEM_REGISTRY.find(
      (candidate) => candidate.item.id === "myl-anchor-uom-p06-a-v1",
    );
    expect(entry).toBeTruthy();
    if (!entry) return;

    expect(validateAssessmentPlacementItem(entry)).toEqual([]);
  });
});
