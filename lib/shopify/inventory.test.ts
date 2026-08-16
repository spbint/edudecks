import { describe, expect, it } from "vitest";
import {
  effectiveMarketplaceQuantityLimit,
  MARKETPLACE_MAX_QUANTITY,
  remainingMarketplaceQuantity,
} from "./inventory";

describe("Marketplace inventory limits", () => {
  it("caps requested quantities at finite Shopify inventory", () => {
    expect(effectiveMarketplaceQuantityLimit(4)).toBe(4);
    expect(effectiveMarketplaceQuantityLimit(0)).toBe(0);
    expect(effectiveMarketplaceQuantityLimit(100)).toBe(MARKETPLACE_MAX_QUANTITY);
  });

  it("keeps the application cap when inventory is not tracked", () => {
    expect(effectiveMarketplaceQuantityLimit(null)).toBe(MARKETPLACE_MAX_QUANTITY);
    expect(effectiveMarketplaceQuantityLimit(undefined)).toBe(MARKETPLACE_MAX_QUANTITY);
  });

  it("subtracts quantities already present in the cart", () => {
    expect(remainingMarketplaceQuantity(10, 3)).toBe(7);
    expect(remainingMarketplaceQuantity(2, 4)).toBe(0);
  });
});
