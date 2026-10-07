import { describe, expect, it } from "vitest";
import {
  getNumberOperationsItemReviewFlags,
  numberOperationsItemReviewFlagLabel,
} from "./numberOperationsItemReviewFlags";
import {
  getNumberOperationsPlacementItemById,
} from "./numberOperationsItemRegistry";

describe("Number & Operations item review flags", () => {
  it("marks routing-only and accessibility-dependent items explicitly", () => {
    const visual = getNumberOperationsPlacementItemById(
      "myl-search-npv-p01-a-v1",
    );
    expect(visual).toBeTruthy();
    if (!visual) return;

    expect(getNumberOperationsItemReviewFlags(visual)).toEqual(
      expect.arrayContaining([
        "routing-only",
        "accessibility-alternative",
      ]),
    );
  });

  it("does not mark the approved currency asset as pending attention", () => {
    const currency = getNumberOperationsPlacementItemById(
      "myl-anchor-mon-p02-a-v1",
    );
    expect(currency).toBeTruthy();
    if (!currency) return;

    expect(getNumberOperationsItemReviewFlags(currency)).not.toContain(
      "pending-trusted-asset",
    );
    expect(
      numberOperationsItemReviewFlagLabel("pending-trusted-asset"),
    ).toBe("Trusted asset pending review");
  });
});
