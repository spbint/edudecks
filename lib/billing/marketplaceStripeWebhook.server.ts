import "server-only";

import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { createBillingAdminClient } from "@/lib/billing/supabaseBilling.server";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? safe(session.payment_intent)
    : safe(session.payment_intent?.id);
}

function metadata(session: Stripe.Checkout.Session) {
  return session.metadata ?? {};
}

export function isMarketplaceStripeEvent(event: Stripe.Event) {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.async_payment_failed"
  ) {
    return false;
  }
  const session = event.data.object as Stripe.Checkout.Session;
  return safe(session.metadata?.mylearna_purchase_kind) === "marketplace_resource";
}

export async function processMarketplaceStripeWebhook(input: {
  event: Stripe.Event;
  rawBody: string;
}) {
  if (!isMarketplaceStripeEvent(input.event)) {
    return { outcome: "ignored" as const };
  }

  const event = input.event;
  const session = event.data.object as Stripe.Checkout.Session;
  const intentId = safe(metadata(session).marketplace_checkout_intent_id);
  const checkoutSessionId = safe(session.id);
  const payloadHash = createHash("sha256").update(input.rawBody).digest("hex");
  const db = createBillingAdminClient();

  if (!intentId || !checkoutSessionId) {
    return { outcome: "review_required" as const };
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const update = await db
      .from("marketplace_checkout_intents")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", intentId)
      .eq("provider_checkout_session_id", checkoutSessionId)
      .in("status", ["pending", "checkout_created"]);
    if (update.error) throw new Error(update.error.message);
    return { outcome: "failed" as const };
  }

  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return { outcome: "unpaid" as const };
  }

  const intentResponse = await db
    .from("marketplace_checkout_intents")
    .select("id,family_id,marketplace_resource_id,external_product_id,currency,amount_minor,provider_checkout_session_id,status")
    .eq("id", intentId)
    .maybeSingle();
  if (intentResponse.error) throw new Error(intentResponse.error.message);
  const intent = intentResponse.data;
  if (!intent) return { outcome: "review_required" as const };

  const eventMeta = metadata(session);
  if (
    safe(eventMeta.family_id) !== safe(intent.family_id) ||
    safe(eventMeta.marketplace_resource_id) !== safe(intent.marketplace_resource_id) ||
    safe(eventMeta.external_product_id) !== safe(intent.external_product_id) ||
    safe(intent.provider_checkout_session_id) !== checkoutSessionId ||
    safe(session.currency).toUpperCase() !== safe(intent.currency).toUpperCase() ||
    Number(session.amount_total) !== Number(intent.amount_minor)
  ) {
    await db
      .from("marketplace_checkout_intents")
      .update({ status: "review_required", updated_at: new Date().toISOString() })
      .eq("id", intentId);
    return { outcome: "review_required" as const };
  }

  const paymentIntent = paymentIntentId(session);
  if (!paymentIntent) return { outcome: "review_required" as const };

  const finalized = await db.rpc("mylearna_finalize_marketplace_paid_checkout", {
    p_checkout_intent_id: intentId,
    p_checkout_session_id: checkoutSessionId,
    p_payment_intent_id: paymentIntent,
    p_provider_event_id: event.id,
    p_event_type: event.type,
    p_payload_hash: payloadHash,
  });
  if (finalized.error) throw new Error(finalized.error.message);
  const row = Array.isArray(finalized.data) ? finalized.data[0] : finalized.data;
  const outcome = safe((row as { outcome?: unknown } | null)?.outcome);
  if (!["granted","already_paid","duplicate_event","review_required"].includes(outcome)) {
    throw new Error("Marketplace Stripe finalisation returned an invalid outcome.");
  }
  return { outcome };
}
