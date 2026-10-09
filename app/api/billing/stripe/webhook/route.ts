import { NextResponse } from "next/server";
import {
  getStripeClient,
  getStripeWebhookSecret,
  StripeBillingConfigurationError,
} from "@/lib/billing/stripe.server";
import {
  isMarketplaceStripeEvent,
  processMarketplaceStripeWebhook,
} from "@/lib/billing/marketplaceStripeWebhook.server";
import {
  createSupabaseStripeWebhookRepository,
  processVerifiedStripeWebhook,
} from "@/lib/billing/stripeWebhook.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Webhook signature is required." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
  } catch (error) {
    if (error instanceof StripeBillingConfigurationError) {
      console.error("stripe_webhook_configuration_error", { missing: error.missing });
      return NextResponse.json({ error: "Webhook endpoint is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Webhook signature is invalid." }, { status: 400 });
  }

  try {
    if (isMarketplaceStripeEvent(event)) {
      const result = await processMarketplaceStripeWebhook({
        event,
        rawBody,
      });
      return NextResponse.json({
        received: true,
        purchaseKind: "marketplace_resource",
        outcome: result.outcome,
      });
    }

    const result = await processVerifiedStripeWebhook({
      event,
      rawBody,
      stripe: getStripeClient(),
      repository: createSupabaseStripeWebhookRepository(),
    });
    return NextResponse.json({
      received: true,
      purchaseKind: "media_storage",
      outcome: result.outcome,
    });
  } catch (error) {
    console.error("stripe_webhook_processing_failed", {
      eventType: event.type,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
