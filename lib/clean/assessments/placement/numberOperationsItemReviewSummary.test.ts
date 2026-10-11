import { describe, expect, it } from "vitest";
import {
  getNumberOperationsItemReviewSummary,
} from "./numberOperationsItemReviewSummary";

describe("Number & Operations item review summary", () => {
  it("makes the 140-item review estate transparent", () => {
    const summary = getNumberOperationsItemReviewSummary();

    expect(summary.totalItems).toBe(140);
    expect(summary.customerRouteItems).toBe(120);
    expect(summary.confirmationReviewItems).toBe(20);
    expect(summary.statusCounts).toMatchObject({ draft: 140 });
    expect(summary.structuralIssueCount).toBe(0);
    expect(summary.cleanStructuralItems).toBe(140);
    expect(summary.routingOnlyItems).toBe(33);
    expect(summary.accessibilityAlternativeItems).toBe(10);
    expect(summary.pendingTrustedAssetItems).toBe(3);
    expect(summary.attentionCustomerItems).toBe(39);
    expect(summary.routineCustomerItems).toBe(81);
    expect(
      summary.attentionCustomerItems + summary.routineCustomerItems,
    ).toBe(120);
    expect(summary.customerVisualItems).toBe(10);
    expect(summary.customerTextFirstItems).toBe(110);
    expect(summary.customerVisualTypeCounts).toEqual({
      "place-value-blocks": 2,
      "currency-tokens": 3,
      "counter-set": 5,
    });
  });
});
