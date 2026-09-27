import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/lib/billing/supabaseBilling.server", () => ({
  createBillingAdminClient: () => ({ from, rpc }),
}));

import { isMarketplaceStripeEvent, processMarketplaceStripeWebhook } from "@/lib/billing/marketplaceStripeWebhook.server";

function paidEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt-market-1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs-market-1",
        mode: "payment",
        payment_status: "paid",
        payment_intent: "pi-market-1",
        currency: "aud",
        amount_total: 495,
        metadata: {
          mylearna_purchase_kind: "marketplace_resource",
          marketplace_checkout_intent_id: "intent-market-1",
          family_id: "family-1",
          marketplace_resource_id: "resource-1",
          external_product_id: "MYL-AUTO-1",
        },
        ...overrides,
      },
    },
  } as never;
}

describe("Marketplace Stripe webhook", () => {
  it("recognises Marketplace Checkout events", () => {
    expect(isMarketplaceStripeEvent(paidEvent())).toBe(true);
  });

  it("finalises a matching paid Checkout Session", async () => {
    const maybeSingle = vi.fn(async () => ({
      data: {
        id: "intent-market-1",
        family_id: "family-1",
        marketplace_resource_id: "resource-1",
        external_product_id: "MYL-AUTO-1",
        currency: "AUD",
        amount_minor: 495,
        provider_checkout_session_id: "cs-market-1",
        status: "checkout_created",
      },
      error: null,
    }));
    const chain: Record<string, any> = { select: vi.fn(() => chain), eq: vi.fn(() => chain), maybeSingle };
    from.mockReturnValue(chain);
    rpc.mockResolvedValue({ data: [{ outcome: "granted" }], error: null });

    await expect(processMarketplaceStripeWebhook({
      event: paidEvent(),
      rawBody: '{"id":"evt-market-1"}',
    })).resolves.toEqual({ outcome: "granted" });

    expect(rpc).toHaveBeenCalledWith(
      "mylearna_finalize_marketplace_paid_checkout",
      expect.objectContaining({
        p_checkout_intent_id: "intent-market-1",
        p_checkout_session_id: "cs-market-1",
        p_payment_intent_id: "pi-market-1",
      }),
    );
  });
});
