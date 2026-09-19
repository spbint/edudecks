import "server-only";

import type Stripe from "stripe";
import { createHash } from "node:crypto";
import type { BillingCheckoutIntent } from "@/lib/billing/stripeCheckout.server";
import {
  findTrustedStripeMediaProductByPriceId,
  getTrustedStripeMediaProduct,
} from "@/lib/billing/stripe.server";
import { createBillingAdminClient } from "@/lib/billing/supabaseBilling.server";

type StripeWebhookGateway = Pick<Stripe, "checkout">;

export type StripeWebhookRepository = {
  findCheckoutIntent(intentId: string): Promise<BillingCheckoutIntent | null>;
  findCheckoutIntentBySessionId(sessionId: string): Promise<BillingCheckoutIntent | null>;
  recordProviderEvent(input: {
    eventId: string;
    eventType: string;
    payloadHash: string;
    processingStatus: "ignored" | "failed" | "review_required";
    errorCode?: string;
    safeErrorSummary?: string;
  }): Promise<void>;
  markCheckoutFailed(intentId: string): Promise<void>;
  finalizePaidCheckout(input: {
    checkoutIntentId: string;
    checkoutSessionId: string;
    paymentIntentId: string;
    eventId: string;
    eventType: "checkout.session.completed" | "checkout.session.async_payment_succeeded";
    payloadHash: string;
  }): Promise<"granted" | "already_granted" | "already_paid" | "duplicate_event" | "review_required">;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function hashStripeWebhookPayload(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? session.payment_intent : "";
}

function stripePriceId(lineItem: Stripe.LineItem) {
  if (typeof lineItem.price === "string") return lineItem.price;
  return safe(lineItem.price?.id);
}

function metadataMatches(session: Stripe.Checkout.Session, intent: BillingCheckoutIntent) {
  const metadata = session.metadata ?? {};
  return (
    safe(session.client_reference_id) === intent.id &&
    safe(metadata.checkout_intent_id) === intent.id &&
    safe(metadata.family_id) === intent.familyId &&
    safe(metadata.academic_year_id) === intent.academicYearId &&
    safe(metadata.media_product_key) === intent.productKey
  );
}

async function recordReview(
  repository: StripeWebhookRepository,
  event: Stripe.Event,
  payloadHash: string,
  errorCode: string,
  safeErrorSummary: string,
) {
  await repository.recordProviderEvent({
    eventId: event.id,
    eventType: event.type,
    payloadHash,
    processingStatus: "review_required",
    errorCode,
    safeErrorSummary,
  });
  return { outcome: "review_required" as const };
}

export async function processVerifiedStripeWebhook(input: {
  event: Stripe.Event;
  rawBody: string;
  stripe: StripeWebhookGateway;
  repository: StripeWebhookRepository;
}) {
  const payloadHash = hashStripeWebhookPayload(input.rawBody);
  const event = input.event;

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const intent = await input.repository.findCheckoutIntentBySessionId(safe(session.id));
    if (intent) await input.repository.markCheckoutFailed(intent.id);
    await input.repository.recordProviderEvent({
      eventId: event.id,
      eventType: event.type,
      payloadHash,
      processingStatus: "failed",
      errorCode: "stripe_async_payment_failed",
      safeErrorSummary: "Stripe reported that a delayed payment did not succeed.",
    });
    return { outcome: "failed" as const };
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    await input.repository.recordProviderEvent({
      eventId: event.id,
      eventType: event.type,
      payloadHash,
      processingStatus: "ignored",
    });
    return { outcome: "ignored" as const };
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    await input.repository.recordProviderEvent({
      eventId: event.id,
      eventType: event.type,
      payloadHash,
      processingStatus: "ignored",
      errorCode: "payment_not_paid",
      safeErrorSummary: "Stripe Checkout has not confirmed payment.",
    });
    return { outcome: "unpaid" as const };
  }

  const intentId = safe(session.client_reference_id);
  const checkoutSessionId = safe(session.id);
  const intent = intentId ? await input.repository.findCheckoutIntent(intentId) : null;
  if (!intent || !checkoutSessionId) {
    return recordReview(
      input.repository,
      event,
      payloadHash,
      "checkout_intent_missing",
      "Verified payment did not contain a matching MyLearna checkout intent.",
    );
  }

  if (
    intent.provider !== "stripe" ||
    intent.providerCheckoutSessionId !== checkoutSessionId ||
    safe(session.customer) !== intent.providerCustomerId ||
    !metadataMatches(session, intent)
  ) {
    return recordReview(
      input.repository,
      event,
      payloadHash,
      "checkout_intent_mismatch",
      "Verified payment did not match its MyLearna checkout snapshot.",
    );
  }

  const trustedProduct = getTrustedStripeMediaProduct(intent.productKey);
  if (
    session.currency?.toUpperCase() !== trustedProduct.currency ||
    session.amount_total !== trustedProduct.amountMinor ||
    intent.currency !== trustedProduct.currency ||
    intent.amountMinor !== trustedProduct.amountMinor ||
    intent.quotaBytes !== trustedProduct.quotaBytes
  ) {
    return recordReview(
      input.repository,
      event,
      payloadHash,
      "checkout_amount_mismatch",
      "Verified payment did not match its approved media product.",
    );
  }

  const lineItems = await input.stripe.checkout.sessions.listLineItems(checkoutSessionId, { limit: 2 });
  const lineItem = lineItems.data[0];
  const mappedProduct = lineItem ? findTrustedStripeMediaProductByPriceId(stripePriceId(lineItem)) : null;
  if (
    lineItems.data.length !== 1 ||
    !lineItem ||
    lineItem.quantity !== 1 ||
    !mappedProduct ||
    mappedProduct.key !== trustedProduct.key
  ) {
    return recordReview(
      input.repository,
      event,
      payloadHash,
      "checkout_price_mismatch",
      "Verified payment did not contain the approved media price.",
    );
  }

  const paymentIntent = paymentIntentId(session);
  if (!paymentIntent) {
    return recordReview(
      input.repository,
      event,
      payloadHash,
      "payment_intent_missing",
      "Verified payment is missing its provider payment reference.",
    );
  }

  return {
    outcome: await input.repository.finalizePaidCheckout({
      checkoutIntentId: intent.id,
      checkoutSessionId,
      paymentIntentId: paymentIntent,
      eventId: event.id,
      eventType: event.type,
      payloadHash,
    }),
  };
}

function asBillingIntent(row: Record<string, unknown>): BillingCheckoutIntent {
  return {
    id: safe(row.id),
    familyId: safe(row.family_id),
    requestedByUserId: safe(row.requested_by_user_id),
    productKey: row.product_key as BillingCheckoutIntent["productKey"],
    currency: "AUD",
    amountMinor: Number(row.amount_minor),
    academicYearId: safe(row.academic_year_id),
    periodStartsOn: safe(row.period_starts_on),
    periodEndsOn: safe(row.period_ends_on),
    periodLabel: safe(row.period_label),
    quotaBytes: Number(row.quota_bytes),
    provider: "stripe",
    providerCustomerId: safe(row.provider_customer_id),
    providerCheckoutSessionId: safe(row.provider_checkout_session_id) || null,
    providerPaymentIntentId: safe(row.provider_payment_intent_id) || null,
    expiresAt: safe(row.expires_at),
    status: safe(row.status),
  };
}

function throwDatabaseError(error: { message?: string } | null, fallback: string): never {
  throw new Error(safe(error?.message) || fallback);
}

export function createSupabaseStripeWebhookRepository(): StripeWebhookRepository {
  const db = createBillingAdminClient();
  async function findIntent(column: "id" | "provider_checkout_session_id", value: string) {
    if (!value) return null;
    const response = await db
      .from("billing_checkout_intents")
      .select("*")
      .eq(column, value)
      .maybeSingle();
    if (response.error) throwDatabaseError(response.error, "Unable to load checkout intent.");
    return response.data ? asBillingIntent(response.data as Record<string, unknown>) : null;
  }
  return {
    findCheckoutIntent: (intentId) => findIntent("id", intentId),
    findCheckoutIntentBySessionId: (sessionId) => findIntent("provider_checkout_session_id", sessionId),
    async recordProviderEvent(input) {
      const response = await db.from("billing_provider_events").insert({
        provider: "stripe",
        event_id: input.eventId,
        event_type: input.eventType,
        processing_status: input.processingStatus,
        payload_hash: input.payloadHash,
        processed_at: new Date().toISOString(),
        error_code: input.errorCode ?? null,
        safe_error_summary: input.safeErrorSummary ?? null,
      });
      if (response.error && response.error.code !== "23505") {
        throwDatabaseError(response.error, "Unable to record Stripe event.");
      }
    },
    async markCheckoutFailed(intentId) {
      const response = await db
        .from("billing_checkout_intents")
        .update({ status: "failed" })
        .eq("id", intentId)
        .in("status", ["pending", "checkout_created"]);
      if (response.error) throwDatabaseError(response.error, "Unable to record payment failure.");
    },
    async finalizePaidCheckout(input) {
      const response = await db.rpc("mylearna_finalize_stripe_paid_checkout", {
        p_checkout_intent_id: input.checkoutIntentId,
        p_checkout_session_id: input.checkoutSessionId,
        p_payment_intent_id: input.paymentIntentId,
        p_provider_event_id: input.eventId,
        p_event_type: input.eventType,
        p_payload_hash: input.payloadHash,
      });
      if (response.error) throwDatabaseError(response.error, "Unable to finalise verified payment.");
      const row = Array.isArray(response.data) ? response.data[0] : response.data;
      const outcome = safe((row as { outcome?: unknown } | null)?.outcome);
      if (
        outcome !== "granted" &&
        outcome !== "already_granted" &&
        outcome !== "already_paid" &&
        outcome !== "duplicate_event" &&
        outcome !== "review_required"
      ) {
        throw new Error("Stripe payment finalisation returned an invalid outcome.");
      }
      return outcome;
    },
  };
}
