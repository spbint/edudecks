import "server-only";

import Stripe from "stripe";
import type { MediaProductKey } from "@/lib/clean/entitlements/mediaTierCatalog";
import { getOneTimeMediaProduct } from "@/lib/billing/mediaProducts";

const PRICE_ENVIRONMENT_KEYS: Record<MediaProductKey, string> = {
  MEDIA_100: "STRIPE_PRICE_MEDIA_100_AUD",
  MEDIA_250: "STRIPE_PRICE_MEDIA_250_AUD",
  MEDIA_500: "STRIPE_PRICE_MEDIA_500_AUD",
  MEDIA_1000: "STRIPE_PRICE_MEDIA_1000_AUD",
};

export class StripeBillingConfigurationError extends Error {
  constructor(public readonly missing: string) {
    super(`Missing required Stripe billing configuration: ${missing}`);
    this.name = "StripeBillingConfigurationError";
  }
}

function requiredEnvironment(name: string) {
  const value = String(process.env[name] ?? "").trim();
  if (!value) throw new StripeBillingConfigurationError(name);
  return value;
}

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  if (!stripeClient) {
    // The installed SDK selects its current supported API version. Deliberately
    // do not pin a version here without an explicit Stripe-version review.
    stripeClient = new Stripe(requiredEnvironment("STRIPE_SECRET_KEY"));
  }
  return stripeClient;
}

export function getStripeWebhookSecret() {
  return requiredEnvironment("STRIPE_WEBHOOK_SECRET");
}

export type TrustedStripeMediaProduct = ReturnType<typeof getTrustedStripeMediaProduct>;

export function getTrustedStripeMediaProduct(productKey: MediaProductKey) {
  const product = getOneTimeMediaProduct(productKey);
  return {
    ...product,
    stripePriceId: requiredEnvironment(PRICE_ENVIRONMENT_KEYS[productKey]),
  };
}

export function findTrustedStripeMediaProductByPriceId(priceId: string) {
  const normalizedPriceId = String(priceId ?? "").trim();
  if (!normalizedPriceId) return null;

  const productKeys: MediaProductKey[] = [
    "MEDIA_100",
    "MEDIA_250",
    "MEDIA_500",
    "MEDIA_1000",
  ];
  for (const productKey of productKeys) {
    const product = getTrustedStripeMediaProduct(productKey);
    if (product.stripePriceId === normalizedPriceId) return product;
  }
  return null;
}

export function createStripeIntegrationIdentifier() {
  const suffix = Array.from({ length: 8 }, () =>
    "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26)),
  ).join("");
  return `mylearna_media_${suffix}`;
}
