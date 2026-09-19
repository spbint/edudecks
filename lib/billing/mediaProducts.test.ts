import { describe, expect, it } from "vitest";
import {
  ONE_TIME_MEDIA_PRODUCTS,
  getOneTimeMediaProduct,
  isMediaProductKey,
} from "@/lib/billing/mediaProducts";

describe("one-time family media products", () => {
  it("uses the exact approved product keys, AUD minor units, and byte allowances", () => {
    expect(ONE_TIME_MEDIA_PRODUCTS).toEqual([
      { key: "MEDIA_100", currency: "AUD", amountMinor: 1495, quotaBytes: 104857600 },
      { key: "MEDIA_250", currency: "AUD", amountMinor: 2195, quotaBytes: 262144000 },
      { key: "MEDIA_500", currency: "AUD", amountMinor: 3495, quotaBytes: 524288000 },
      { key: "MEDIA_1000", currency: "AUD", amountMinor: 5495, quotaBytes: 1073741824 },
    ]);
  });

  it("accepts only approved MyLearna keys", () => {
    expect(isMediaProductKey("MEDIA_250")).toBe(true);
    expect(isMediaProductKey("price_test_arbitrary")).toBe(false);
    expect(getOneTimeMediaProduct("MEDIA_100").currency).toBe("AUD");
  });
});
