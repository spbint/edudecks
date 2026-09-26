import "server-only";

import type Stripe from "stripe";
import { BILLING_AUTHORITY_ROLES, createBillingAdminClient } from "@/lib/billing/supabaseBilling.server";
import { checkoutReturnOrigin } from "@/lib/billing/stripeCheckout.server";

export class MarketplaceCheckoutRequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "MarketplaceCheckoutRequestError";
  }
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function positiveInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sessionPair(session: Stripe.Checkout.Session) {
  const id = safe(session.id);
  const url = safe(session.url);
  if (!id || !url) {
    throw new MarketplaceCheckoutRequestError(
      "marketplace_checkout_unavailable",
      503,
      "Marketplace checkout is temporarily unavailable.",
    );
  }
  return { id, url };
}

export async function createMarketplaceResourceCheckout(input: {
  familyId: unknown;
  externalProductId: unknown;
  requestedByUserId: string;
  requestedByEmail: string | null | undefined;
  stripe: Pick<Stripe, "checkout">;
}) {
  const familyId = safe(input.familyId);
  const externalProductId = safe(input.externalProductId);
  if (!familyId || !externalProductId) {
    throw new MarketplaceCheckoutRequestError(
      "marketplace_checkout_invalid",
      400,
      "Choose an available Marketplace resource.",
    );
  }

  const db = createBillingAdminClient();
  const authority = await db
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", input.requestedByUserId)
    .in("role", [...BILLING_AUTHORITY_ROLES])
    .maybeSingle();
  if (authority.error) throw new Error(authority.error.message);
  if (!authority.data) {
    throw new MarketplaceCheckoutRequestError(
      "marketplace_checkout_not_authorised",
      403,
      "Only a family owner or parent can purchase Marketplace resources.",
    );
  }

  const catalogue = await db
    .from("marketplace_resources")
    .select("id,external_product_id,handle,title,metadata,is_active,source")
    .eq("source", "mylearna_agent")
    .eq("external_product_id", externalProductId)
    .eq("is_active", true)
    .maybeSingle();
  if (catalogue.error) throw new Error(catalogue.error.message);
  if (!catalogue.data) {
    throw new MarketplaceCheckoutRequestError(
      "marketplace_resource_unavailable",
      404,
      "This Marketplace resource is not available.",
    );
  }

  const metadata = asRecord(catalogue.data.metadata);
  if (safe(metadata.access_model) !== "paid") {
    throw new MarketplaceCheckoutRequestError(
      "marketplace_resource_not_paid",
      409,
      "This resource does not require a Marketplace purchase.",
    );
  }

  const currency = safe(metadata.currency || "AUD").toUpperCase();
  const amountMinor = positiveInteger(metadata.price_minor);
  if (currency !== "AUD" || !amountMinor) {
    throw new MarketplaceCheckoutRequestError(
      "marketplace_price_invalid",
      500,
      "This Marketplace resource is not ready for checkout.",
    );
  }

  const existingEntitlement = await db
    .from("family_marketplace_entitlements")
    .select("id")
    .eq("family_id", familyId)
    .eq("marketplace_resource_id", catalogue.data.id)
    .eq("status", "active")
    .lte("starts_at", new Date().toISOString())
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .limit(1);
  if (existingEntitlement.error) throw new Error(existingEntitlement.error.message);
  if ((existingEntitlement.data ?? []).length) {
    throw new MarketplaceCheckoutRequestError(
      "marketplace_entitlement_exists",
      409,
      "Your family already owns this Marketplace resource.",
    );
  }

  await db
    .from("marketplace_checkout_intents")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("family_id", familyId)
    .eq("marketplace_resource_id", catalogue.data.id)
    .in("status", ["pending", "checkout_created"])
    .lte("expires_at", new Date().toISOString());

  const existing = await db
    .from("marketplace_checkout_intents")
    .select("*")
    .eq("family_id", familyId)
    .eq("marketplace_resource_id", catalogue.data.id)
    .in("status", ["pending", "checkout_created"])
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  let intent = existing.data as Record<string, unknown> | null;
  if (
    intent &&
    (safe(intent.currency) !== currency ||
      Number(intent.amount_minor) !== amountMinor ||
      safe(intent.external_product_id) !== externalProductId)
  ) {
    await db
      .from("marketplace_checkout_intents")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", safe(intent.id));
    intent = null;
  }

  if (!intent) {
    const created = await db
      .from("marketplace_checkout_intents")
      .insert({
        family_id: familyId,
        requested_by_user_id: input.requestedByUserId,
        marketplace_resource_id: catalogue.data.id,
        external_product_id: externalProductId,
        currency,
        amount_minor: amountMinor,
        status: "pending",
        provider: "stripe",
      })
      .select("*")
      .single();
    if (created.error) throw new Error(created.error.message);
    intent = created.data as Record<string, unknown>;
  }

  const intentId = safe(intent.id);
  const origin = checkoutReturnOrigin();

  try {
    const session = await input.stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: intentId,
        customer_email: safe(input.requestedByEmail) || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "aud",
              unit_amount: amountMinor,
              product_data: {
                name: safe(catalogue.data.title),
                metadata: {
                  mylearna_external_product_id: externalProductId,
                },
              },
            },
          },
        ],
        success_url: `${origin}/my-resources?purchase=success&add_marketplace=${encodeURIComponent(externalProductId)}`,
        cancel_url: `${origin}/marketplace/worksheets/${encodeURIComponent(safe(catalogue.data.handle))}?purchase=cancelled`,
        metadata: {
          mylearna_purchase_kind: "marketplace_resource",
          marketplace_checkout_intent_id: intentId,
          family_id: familyId,
          marketplace_resource_id: safe(catalogue.data.id),
          external_product_id: externalProductId,
        },
      },
      { idempotencyKey: `mylearna-marketplace-checkout-${intentId}` },
    );
    const pair = sessionPair(session);
    const updated = await db
      .from("marketplace_checkout_intents")
      .update({
        status: "checkout_created",
        provider_checkout_session_id: pair.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intentId);
    if (updated.error) throw new Error(updated.error.message);
    return { checkoutUrl: pair.url, checkoutIntentId: intentId };
  } catch (error) {
    await db
      .from("marketplace_checkout_intents")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", intentId);
    if (error instanceof MarketplaceCheckoutRequestError) throw error;
    throw new MarketplaceCheckoutRequestError(
      "marketplace_checkout_unavailable",
      503,
      "Marketplace checkout is temporarily unavailable.",
    );
  }
}
