import {
  MEDIA_PRODUCT_KEYS,
  MEDIA_TIER_CATALOG,
  type MediaProductKey,
} from "@/lib/clean/entitlements/mediaTierCatalog";

export type OneTimeMediaProduct = {
  key: MediaProductKey;
  currency: "AUD";
  amountMinor: number;
  quotaBytes: number;
};

function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

const PRODUCT_BY_KEY = new Map<MediaProductKey, OneTimeMediaProduct>(
  MEDIA_TIER_CATALOG.map((tier) => {
    const aud = tier.displayPrices.AUD;
    if (!aud) throw new Error(`Missing AUD media price for ${tier.key}.`);
    return [
      tier.key,
      {
        key: tier.key,
        currency: "AUD" as const,
        amountMinor: toMinorUnits(aud.amount),
        quotaBytes: tier.quotaBytes,
      },
    ];
  }),
);

export function isMediaProductKey(value: unknown): value is MediaProductKey {
  return typeof value === "string" && (MEDIA_PRODUCT_KEYS as readonly string[]).includes(value);
}

export function getOneTimeMediaProduct(productKey: MediaProductKey): OneTimeMediaProduct {
  const product = PRODUCT_BY_KEY.get(productKey);
  if (!product) throw new Error(`Unsupported media product: ${productKey}`);
  return product;
}

export const ONE_TIME_MEDIA_PRODUCTS = MEDIA_PRODUCT_KEYS.map(getOneTimeMediaProduct);
