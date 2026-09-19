import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { processVerifiedStripeWebhook, type StripeWebhookRepository } from "@/lib/billing/stripeWebhook.server";

const listLineItems = vi.fn();
const stripe = { checkout: { sessions: { listLineItems } } } as never;

const intent = {
  id: "intent-1",
  familyId: "family-1",
  requestedByUserId: "adult-1",
  productKey: "MEDIA_250" as const,
  currency: "AUD" as const,
  amountMinor: 2195,
  academicYearId: "year-2027",
  periodStartsOn: "2027-01-01",
  periodEndsOn: "2027-12-31",
  periodLabel: "2027 Learning Year",
  quotaBytes: 262144000,
  provider: "stripe" as const,
  providerCustomerId: "cus-1",
  providerCheckoutSessionId: "cs-1",
  providerPaymentIntentId: null,
  expiresAt: "2027-09-01T12:45:00.000Z",
  status: "checkout_created",
};

function repository(overrides: Partial<StripeWebhookRepository> = {}) {
  return {
    findCheckoutIntent: vi.fn(async () => intent),
    findCheckoutIntentBySessionId: vi.fn(async () => intent),
    recordProviderEvent: vi.fn(async () => undefined),
    markCheckoutFailed: vi.fn(async () => undefined),
    finalizePaidCheckout: vi.fn(async () => "granted" as const),
    ...overrides,
  } satisfies StripeWebhookRepository;
}

function checkoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt-1",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs-1",
        mode: "payment",
        payment_status: "paid",
        payment_intent: "pi-1",
        customer: "cus-1",
        client_reference_id: "intent-1",
        currency: "aud",
        amount_total: 2195,
        metadata: {
          checkout_intent_id: "intent-1",
          family_id: "family-1",
          academic_year_id: "year-2027",
          media_product_key: "MEDIA_250",
        },
        ...overrides,
      },
    },
  } as never;
}

describe("verified Stripe payment processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PRICE_MEDIA_100_AUD = "price_media_100";
    process.env.STRIPE_PRICE_MEDIA_250_AUD = "price_media_250";
    process.env.STRIPE_PRICE_MEDIA_500_AUD = "price_media_500";
    process.env.STRIPE_PRICE_MEDIA_1000_AUD = "price_media_1000";
    listLineItems.mockResolvedValue({ data: [{ quantity: 1, price: { id: "price_media_250" } }] });
  });

  it("grants exactly once only after a paid matching one-time Checkout Session", async () => {
    const repo = repository();
    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent(), rawBody: '{"id":"evt-1"}', stripe, repository: repo,
    });
    expect(result).toEqual({ outcome: "granted" });
    expect(repo.finalizePaidCheckout).toHaveBeenCalledWith(expect.objectContaining({
      checkoutIntentId: "intent-1",
      checkoutSessionId: "cs-1",
      paymentIntentId: "pi-1",
      eventId: "evt-1",
      eventType: "checkout.session.completed",
      payloadHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it("does not grant an unpaid completed Session", async () => {
    const repo = repository();
    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent({ payment_status: "unpaid" }), rawBody: "unpaid", stripe, repository: repo,
    });
    expect(result).toEqual({ outcome: "unpaid" });
    expect(repo.finalizePaidCheckout).not.toHaveBeenCalled();
    expect(repo.recordProviderEvent).toHaveBeenCalledWith(expect.objectContaining({ processingStatus: "ignored" }));
  });

  it("requires metadata, customer, session, currency, amount, and trusted Price to match", async () => {
    const repo = repository();
    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent({ amount_total: 1 }), rawBody: "mismatch", stripe, repository: repo,
    });
    expect(result).toEqual({ outcome: "review_required" });
    expect(repo.finalizePaidCheckout).not.toHaveBeenCalled();
    expect(repo.recordProviderEvent).toHaveBeenCalledWith(expect.objectContaining({
      processingStatus: "review_required", errorCode: "checkout_amount_mismatch",
    }));
  });

  it("does not grant when a foreign product/Price is supplied", async () => {
    listLineItems.mockResolvedValueOnce({ data: [{ quantity: 1, price: { id: "price_foreign" } }] });
    const repo = repository();
    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent(), rawBody: "wrong-price", stripe, repository: repo,
    });
    expect(result).toEqual({ outcome: "review_required" });
    expect(repo.finalizePaidCheckout).not.toHaveBeenCalled();
  });

  it("delegates duplicate events and duplicate PaymentIntents to the transactional grant function", async () => {
    const repo = repository({ finalizePaidCheckout: vi.fn(async () => "duplicate_event" as const) });
    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent(), rawBody: "duplicate", stripe, repository: repo,
    });
    expect(result).toEqual({ outcome: "duplicate_event" });
    expect(repo.finalizePaidCheckout).toHaveBeenCalledOnce();
  });

  it("handles delayed payment success and failure without granting on failure", async () => {
    const repo = repository();
    const success = checkoutEvent() as { type: string };
    success.type = "checkout.session.async_payment_succeeded";
    await expect(processVerifiedStripeWebhook({ event: success as never, rawBody: "async-success", stripe, repository: repo }))
      .resolves.toEqual({ outcome: "granted" });

    const failure = checkoutEvent() as { type: string };
    failure.type = "checkout.session.async_payment_failed";
    await expect(processVerifiedStripeWebhook({ event: failure as never, rawBody: "async-failure", stripe, repository: repo }))
      .resolves.toEqual({ outcome: "failed" });
    expect(repo.markCheckoutFailed).toHaveBeenCalledWith("intent-1");
  });
});
