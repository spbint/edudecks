import { describe, expect, it } from "vitest";
import {
  getNumberOperationsItemReviewSummary,
} from "./numberOperationsItemReviewSummary";

describe("Number & Operations item review summary", () => {
  it("makes the 140-item review estate transparent", () => {
    const summary = getNumberOperationsItemReviewSummary();

    expect(summary.totalItems).toBe(140);
    expect(summary.statusCounts).toMatchObject({ draft: 140 });
    expect(summary.structuralIssueCount).toBe(0);
    expect(summary.cleanStructuralItems).toBe(140);
    expect(summary.routingOnlyItems).toBe(33);
    expect(summary.accessibilityAlternativeItems).toBe(5);
    expect(summary.pendingTrustedAssetItems).toBe(3);
  });
});
