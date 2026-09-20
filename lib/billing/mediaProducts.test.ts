import { describe, expect, it } from "vitest";
import {
  getMediaBillingCurrencyForCountry,
  getOneTimeMediaProduct,
  getOneTimeMediaProductForCurrency,
  isMediaProductKey,
} from "@/lib/billing/mediaProducts";

describe("one-time family media products", () => {
  it.each([
    ["AU", "MEDIA_100", "AUD", 1495],
    ["AU", "MEDIA_250", "AUD", 2195],
    ["AU", "MEDIA_500", "AUD", 3495],
    ["AU", "MEDIA_1000", "AUD", 5495],
    ["US", "MEDIA_100", "USD", 999],
    ["US", "MEDIA_250", "USD", 1499],
    ["US", "MEDIA_500", "USD", 2299],
    ["US", "MEDIA_1000", "USD", 3999],
    ["UK", "MEDIA_100", "GBP", 799],
    ["UK", "MEDIA_250", "GBP", 1199],
    ["UK", "MEDIA_500", "GBP", 1899],
    ["UK", "MEDIA_1000", "GBP", 2999],
  ] as const)("maps %s %s to trusted %s %i minor units", (countryCode, productKey, currency, amountMinor) => {
    expect(getOneTimeMediaProduct(countryCode, productKey)).toMatchObject({
      countryCode,
      key: productKey,
      currency,
      amountMinor,
    });
  });

  it("uses fixed tier byte allowances and rejects unsupported markets", () => {
    expect(getOneTimeMediaProduct("AU", "MEDIA_250")?.quotaBytes).toBe(262144000);
    expect(getOneTimeMediaProduct("US", "MEDIA_1000")?.quotaBytes).toBe(1073741824);
    expect(getOneTimeMediaProduct("INTL", "MEDIA_100")).toBeNull();
    expect(getOneTimeMediaProduct(null, "MEDIA_100")).toBeNull();
    expect(getMediaBillingCurrencyForCountry("UK")).toBe("GBP");
    expect(getMediaBillingCurrencyForCountry("GB")).toBeNull();
  });

  it("accepts only approved product keys and resolves webhook snapshots by currency", () => {
    expect(isMediaProductKey("MEDIA_250")).toBe(true);
    expect(isMediaProductKey("price_test_arbitrary")).toBe(false);
    expect(getOneTimeMediaProductForCurrency("MEDIA_500", "USD")).toMatchObject({
      countryCode: "US",
      amountMinor: 2299,
    });
    expect(getOneTimeMediaProductForCurrency("MEDIA_500", "EUR")).toBeNull();
  });
});
