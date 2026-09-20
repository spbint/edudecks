import {
  EVIDENCE_MEDIA_TIER_BYTES,
  type EvidenceMediaTierKey,
} from "@/lib/clean/entitlements/evidenceMedia";

export const MEDIA_PRODUCT_KEYS = [
  "MEDIA_100",
  "MEDIA_250",
  "MEDIA_500",
  "MEDIA_1000",
] as const;

export type MediaProductKey = (typeof MEDIA_PRODUCT_KEYS)[number];
export type SupportedMediaDisplayCurrency = "AUD" | "USD" | "GBP" | "NZD";

export type MediaTierDisplayPrice = {
  currency: SupportedMediaDisplayCurrency;
  amount: number;
  label: string;
};

export type MediaTierCatalogItem = {
  key: MediaProductKey;
  displayName: string;
  allowanceLabel: string;
  quotaBytes: number;
  billingPeriod: "annual";
  familyShared: true;
  displayPrices: Partial<Record<SupportedMediaDisplayCurrency, MediaTierDisplayPrice>>;
  availableForPurchase: boolean;
};

function displayPrice(currency: SupportedMediaDisplayCurrency, amount: number, label: string) {
  return {
    currency,
    amount,
    label: `${label}${amount.toFixed(2)}/year`,
  };
}

const TIER_KEY_BY_PRODUCT_KEY: Record<MediaProductKey, EvidenceMediaTierKey> = {
  MEDIA_100: "media_100",
  MEDIA_250: "media_250",
  MEDIA_500: "media_500",
  MEDIA_1000: "media_1000",
};

export const MEDIA_TIER_CATALOG: readonly MediaTierCatalogItem[] = [
  {
    key: "MEDIA_100",
    displayName: "Media 100",
    allowanceLabel: "100 MB",
    quotaBytes: EVIDENCE_MEDIA_TIER_BYTES[TIER_KEY_BY_PRODUCT_KEY.MEDIA_100],
    billingPeriod: "annual",
    familyShared: true,
    displayPrices: {
      AUD: displayPrice("AUD", 14.95, "A$"),
      USD: displayPrice("USD", 9.99, "US$"),
      GBP: displayPrice("GBP", 7.99, "£"),
    },
    availableForPurchase: true,
  },
  {
    key: "MEDIA_250",
    displayName: "Media 250",
    allowanceLabel: "250 MB",
    quotaBytes: EVIDENCE_MEDIA_TIER_BYTES[TIER_KEY_BY_PRODUCT_KEY.MEDIA_250],
    billingPeriod: "annual",
    familyShared: true,
    displayPrices: {
      AUD: displayPrice("AUD", 21.95, "A$"),
      USD: displayPrice("USD", 14.99, "US$"),
      GBP: displayPrice("GBP", 11.99, "£"),
    },
    availableForPurchase: true,
  },
  {
    key: "MEDIA_500",
    displayName: "Media 500",
    allowanceLabel: "500 MB",
    quotaBytes: EVIDENCE_MEDIA_TIER_BYTES[TIER_KEY_BY_PRODUCT_KEY.MEDIA_500],
    billingPeriod: "annual",
    familyShared: true,
    displayPrices: {
      AUD: displayPrice("AUD", 34.95, "A$"),
      USD: displayPrice("USD", 22.99, "US$"),
      GBP: displayPrice("GBP", 18.99, "£"),
    },
    availableForPurchase: true,
  },
  {
    key: "MEDIA_1000",
    displayName: "Media 1000",
    allowanceLabel: "1 GB",
    quotaBytes: EVIDENCE_MEDIA_TIER_BYTES[TIER_KEY_BY_PRODUCT_KEY.MEDIA_1000],
    billingPeriod: "annual",
    familyShared: true,
    displayPrices: {
      AUD: displayPrice("AUD", 54.95, "A$"),
      USD: displayPrice("USD", 39.99, "US$"),
      GBP: displayPrice("GBP", 29.99, "£"),
    },
    availableForPurchase: true,
  },
];

export type MediaStorageWarningState = "normal" | "most_used" | "nearly_full" | "full" | "unavailable";

export type MediaStorageUsagePresentation = {
  percentUsed: number;
  usageBytes: number;
  warningState: MediaStorageWarningState;
  warningCopy: string | null;
};

export function getMediaStorageUsagePresentation(
  quotaBytes: number,
  usedBytes: number,
  reservedBytes: number,
): MediaStorageUsagePresentation {
  const safeQuotaBytes = Math.max(0, quotaBytes);
  const usageBytes = Math.max(0, usedBytes) + Math.max(0, reservedBytes);

  if (safeQuotaBytes === 0) {
    return {
      percentUsed: 0,
      usageBytes,
      warningState: "unavailable",
      warningCopy: "Media storage is not available for this learning year.",
    };
  }

  const percentUsed = Math.min(100, Math.round((usageBytes / safeQuotaBytes) * 100));
  if (percentUsed >= 100) {
    return {
      percentUsed,
      usageBytes,
      warningState: "full",
      warningCopy: "You’ve reached your current media allowance. More storage options are coming soon.",
    };
  }
  if (percentUsed >= 90) {
    return {
      percentUsed,
      usageBytes,
      warningState: "nearly_full",
      warningCopy: "You’re nearly at your media limit. More storage options are coming soon.",
    };
  }
  if (percentUsed >= 75) {
    return {
      percentUsed,
      usageBytes,
      warningState: "most_used",
      warningCopy: "You’re using most of your media storage.",
    };
  }
  return { percentUsed, usageBytes, warningState: "normal", warningCopy: null };
}

export function getMediaAllowanceSourceLabel(
  source: string | null,
  isCompatibilityFallback: boolean,
) {
  if (isCompatibilityFallback || source === "legacy_beta_compatibility" || source === "free") {
    return "Free media allowance";
  }
  if (source === "founding") return "Founding family media allowance";
  if (source === "complimentary") return "Complimentary family media allowance";
  return "Family media allowance";
}

export function formatMediaStorageBytes(bytes: number) {
  const safeBytes = Math.max(0, bytes);
  const mib = 1024 * 1024;
  const gib = 1024 * mib;
  if (safeBytes >= gib) return `${(safeBytes / gib).toFixed(safeBytes % gib === 0 ? 0 : 1)} GB`;
  if (safeBytes >= mib) return `${(safeBytes / mib).toFixed(safeBytes % mib === 0 ? 0 : 1)} MB`;
  if (safeBytes >= 1024) return `${(safeBytes / 1024).toFixed(1)} KB`;
  return `${safeBytes} bytes`;
}
