import {
  MEDIA_PRODUCT_KEYS,
  MEDIA_TIER_CATALOG,
  type MediaProductKey,
} from "@/lib/clean/entitlements/mediaTierCatalog";

export const MEDIA_BILLING_COUNTRIES = ["AU", "US", "UK"] as const;
export const MEDIA_BILLING_CURRENCIES = ["AUD", "USD", "GBP"] as const;

export type MediaBillingCountry = (typeof MEDIA_BILLING_COUNTRIES)[number];
export type MediaBillingCurrency = (typeof MEDIA_BILLING_CURRENCIES)[number];

export type OneTimeMediaProduct = {
  key: MediaProductKey;
  countryCode: MediaBillingCountry;
  currency: MediaBillingCurrency;
  amountMinor: number;
  quotaBytes: number;
};

const QUOTA_BYTES_BY_KEY = Object.fromEntries(
  MEDIA_TIER_CATALOG.map((tier) => [tier.key, tier.quotaBytes]),
) as Record<MediaProductKey, number>;

const COUNTRY_CURRENCY: Record<MediaBillingCountry, MediaBillingCurrency> = {
  AU: "AUD",
  US: "USD",
  UK: "GBP",
};

const AMOUNT_MINOR_BY_TIER_AND_CURRENCY: Record<
  MediaProductKey,
  Record<MediaBillingCurrency, number>
> = {
  MEDIA_100: { AUD: 1495, USD: 999, GBP: 799 },
  MEDIA_250: { AUD: 2195, USD: 1499, GBP: 1199 },
  MEDIA_500: { AUD: 3495, USD: 2299, GBP: 1899 },
  MEDIA_1000: { AUD: 5495, USD: 3999, GBP: 2999 },
};

function safe(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

export function isMediaProductKey(value: unknown): value is MediaProductKey {
  return typeof value === "string" && (MEDIA_PRODUCT_KEYS as readonly string[]).includes(value);
}

export function isMediaBillingCurrency(value: unknown): value is MediaBillingCurrency {
  return (MEDIA_BILLING_CURRENCIES as readonly string[]).includes(safe(value));
}

export function getMediaBillingCountry(value: unknown): MediaBillingCountry | null {
  const countryCode = safe(value);
  return (MEDIA_BILLING_COUNTRIES as readonly string[]).includes(countryCode)
    ? (countryCode as MediaBillingCountry)
    : null;
}

export function getMediaBillingCurrencyForCountry(
  countryCode: unknown,
): MediaBillingCurrency | null {
  const country = getMediaBillingCountry(countryCode);
  return country ? COUNTRY_CURRENCY[country] : null;
}

export function getOneTimeMediaProduct(
  countryCode: unknown,
  productKey: MediaProductKey,
): OneTimeMediaProduct | null {
  const country = getMediaBillingCountry(countryCode);
  if (!country) return null;

  const currency = COUNTRY_CURRENCY[country];
  return {
    key: productKey,
    countryCode: country,
    currency,
    amountMinor: AMOUNT_MINOR_BY_TIER_AND_CURRENCY[productKey][currency],
    quotaBytes: QUOTA_BYTES_BY_KEY[productKey],
  };
}

export function getOneTimeMediaProductForCurrency(
  productKey: MediaProductKey,
  currency: unknown,
): OneTimeMediaProduct | null {
  const trustedCurrency = safe(currency);
  const country = MEDIA_BILLING_COUNTRIES.find(
    (candidate) => COUNTRY_CURRENCY[candidate] === trustedCurrency,
  );
  return country ? getOneTimeMediaProduct(country, productKey) : null;
}

export const ONE_TIME_MEDIA_PRODUCTS = MEDIA_BILLING_COUNTRIES.flatMap((countryCode) =>
  MEDIA_PRODUCT_KEYS.map((productKey) => getOneTimeMediaProduct(countryCode, productKey)!),
);
