import { describe, expect, it } from "vitest";
import { effectiveMarketplaceQuantityLimit, MARKETPLACE_MAX_QUANTITY, remainingMarketplaceQuantity } from "./inventory";

describe("Marketplace inventory limits", () => {
  it("caps finite stock at the available quantity", () => {
    expect(effectiveMarketplaceQuantityLimit(10)).toBe(10);
    expect(effectiveMarketplaceQuantityLimit(40)).toBe(MARKETPLACE_MAX_QUANTITY);
  });

  it("retains the application maximum when inventory is not tracked", () => {
    expect(effectiveMarketplaceQuantityLimit(null)).toBe(20);
    expect(effectiveMarketplaceQuantityLimit(undefined)).toBe(20);
  });

  it("subtracts the existing cart quantity from remaining stock", () => {
    expect(remainingMarketplaceQuantity(10, 1)).toBe(9);
    expect(remainingMarketplaceQuantity(10, 10)).toBe(0);
  });
});
