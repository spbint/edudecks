import { describe, expect, it } from "vitest";
import {
  formatMediaStorageBytes,
  getMediaAllowanceSourceLabel,
  getMediaStorageUsagePresentation,
  MEDIA_PRODUCT_KEYS,
  MEDIA_TIER_CATALOG,
} from "@/lib/clean/entitlements/mediaTierCatalog";

describe("family media tier catalogue", () => {
  it("defines the approved family-shared annual products with exact byte allowances", () => {
    expect(MEDIA_PRODUCT_KEYS).toEqual(["MEDIA_100", "MEDIA_250", "MEDIA_500", "MEDIA_1000"]);
    expect(MEDIA_TIER_CATALOG.map((tier) => tier.quotaBytes)).toEqual([
      104857600,
      262144000,
      524288000,
      1073741824,
    ]);
    expect(MEDIA_TIER_CATALOG.every((tier) => tier.billingPeriod === "annual")).toBe(true);
    expect(MEDIA_TIER_CATALOG.every((tier) => tier.familyShared)).toBe(true);
  });

  it("keeps commercial display pricing separate from allowance authority", () => {
    expect(MEDIA_TIER_CATALOG.map((tier) => tier.displayPrices.AUD?.label)).toEqual([
      "A$14.95/year",
      "A$21.95/year",
      "A$34.95/year",
      "A$54.95/year",
    ]);
    expect(MEDIA_TIER_CATALOG.every((tier) => tier.availableForPurchase === false)).toBe(true);
    expect(JSON.stringify(MEDIA_TIER_CATALOG).toLowerCase()).not.toContain("stripe");
    expect(MEDIA_TIER_CATALOG[0].displayPrices).toHaveProperty("AUD");
  });

  it("presents compatibility as beta access, never as a purchase", () => {
    expect(getMediaAllowanceSourceLabel("legacy_beta_compatibility", true)).toBe(
      "Beta media allowance",
    );
    expect(getMediaAllowanceSourceLabel("founding", false)).toBe(
      "Founding family media allowance",
    );
  });

  it("calculates safe customer warning states and byte labels", () => {
    expect(getMediaStorageUsagePresentation(100, 74, 0)).toMatchObject({
      percentUsed: 74,
      warningState: "normal",
    });
    expect(getMediaStorageUsagePresentation(100, 75, 0).warningState).toBe("most_used");
    expect(getMediaStorageUsagePresentation(100, 90, 0).warningState).toBe("nearly_full");
    expect(getMediaStorageUsagePresentation(100, 100, 1).warningState).toBe("full");
    expect(getMediaStorageUsagePresentation(0, 0, 0).warningState).toBe("unavailable");
    expect(formatMediaStorageBytes(262144000)).toBe("250 MB");
  });
});
