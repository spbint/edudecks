import "server-only";

import Stripe from "stripe";
import {
  MEDIA_PRODUCT_KEYS,
  type MediaProductKey,
} from "@/lib/clean/entitlements/mediaTierCatalog";
import type { OneTimeMediaProduct } from "@/lib/billing/mediaProducts";

const PRICE_ENVIRONMENT_KEYS: Record<MediaProductKey, string> = {
  MEDIA_100: "STRIPE_PRICE_MEDIA_100",
  MEDIA_250: "STRIPE_PRICE_MEDIA_250",
  MEDIA_500: "STRIPE_PRICE_MEDIA_500",
  MEDIA_1000: "STRIPE_PRICE_MEDIA_1000",
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
    stripeClient = new Stripe(requiredEnvironment("STRIPE_SECRET_KEY"));
  }
  return stripeClient;
}

export function getStripeWebhookSecret() {
  return requiredEnvironment("STRIPE_WEBHOOK_SECRET");
}

export type TrustedStripeMediaProduct = ReturnType<typeof getTrustedStripeMediaProduct>;

export function getTrustedStripeMediaProduct(product: OneTimeMediaProduct) {
  return {
    ...product,
    stripePriceId: requiredEnvironment(PRICE_ENVIRONMENT_KEYS[product.key]),
  };
}

export function findTrustedStripeMediaProductKeyByPriceId(priceId: string) {
  const normalizedPriceId = String(priceId ?? "").trim();
  if (!normalizedPriceId) return null;

  for (const productKey of MEDIA_PRODUCT_KEYS) {
    if (requiredEnvironment(PRICE_ENVIRONMENT_KEYS[productKey]) === normalizedPriceId) {
      return productKey;
    }
  }
  return null;
}

export function createStripeIntegrationIdentifier() {
  const suffix = Array.from({ length: 8 }, () =>
    "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26)),
  ).join("");
  return `mylearna_media_${suffix}`;
}
