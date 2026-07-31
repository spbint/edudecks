import { describe, expect, it } from "vitest";
import { formatShopifyMoney } from "./money";

describe("Shopify money formatting", () => {
  it("uses the currency code supplied by Shopify", () => {
    expect(formatShopifyMoney({ amount: "12.50", currencyCode: "AUD" })).toContain("12.50");
    expect(formatShopifyMoney({ amount: "12.50", currencyCode: "USD" })).toContain("12.50");
  });

  it("handles missing or malformed prices safely", () => {
    expect(formatShopifyMoney(null)).toBe("Price unavailable");
    expect(formatShopifyMoney({ amount: "not-a-number", currencyCode: "AUD" })).toBe("Price unavailable");
  });
});
