import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { processVerifiedStripeWebhook, type StripeWebhookRepository } from "@/lib/billing/stripeWebhook.server";
import type { MediaProductKey } from "@/lib/clean/entitlements/mediaTierCatalog";

const listLineItems = vi.fn();
const stripe = { checkout: { sessions: { listLineItems } } } as never;

const intent = {
  id: "intent-1",
  familyId: "family-1",
  requestedByUserId: "adult-1",
  productKey: "MEDIA_250" as MediaProductKey,
  currency: "AUD" as "AUD" | "USD" | "GBP",
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

function checkoutEvent(
  overrides: Record<string, unknown> = {},
  currentIntent: typeof intent = intent,
) {
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
        client_reference_id: currentIntent.id,
        currency: currentIntent.currency.toLowerCase(),
        amount_total: currentIntent.amountMinor,
        metadata: {
          checkout_intent_id: currentIntent.id,
          family_id: currentIntent.familyId,
          academic_year_id: currentIntent.academicYearId,
          media_product_key: currentIntent.productKey,
        },
        ...overrides,
      },
    },
  } as never;
}

function intentFor(
  productKey: MediaProductKey,
  currency: "AUD" | "USD" | "GBP",
  amountMinor: number,
) {
  const quotaBytes = {
    MEDIA_100: 104857600,
    MEDIA_250: 262144000,
    MEDIA_500: 524288000,
    MEDIA_1000: 1073741824,
  }[productKey];
  return { ...intent, productKey, currency, amountMinor, quotaBytes };
}

describe("verified Stripe payment processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PRICE_MEDIA_100 = "price_media_100";
    process.env.STRIPE_PRICE_MEDIA_250 = "price_media_250";
    process.env.STRIPE_PRICE_MEDIA_500 = "price_media_500";
    process.env.STRIPE_PRICE_MEDIA_1000 = "price_media_1000";
    listLineItems.mockResolvedValue({ data: [{ quantity: 1, price: { id: "price_media_250" } }] });
  });

  it.each([
    ["AUD", "MEDIA_250", 2195, "price_media_250"],
    ["USD", "MEDIA_100", 999, "price_media_100"],
    ["GBP", "MEDIA_500", 1899, "price_media_500"],
  ] as const)("grants a paid matching %s Checkout Session", async (currency, productKey, amountMinor, priceId) => {
    const currentIntent = intentFor(productKey, currency, amountMinor);
    const repo = repository({
      findCheckoutIntent: vi.fn(async () => currentIntent),
      findCheckoutIntentBySessionId: vi.fn(async () => currentIntent),
    });
    listLineItems.mockResolvedValueOnce({ data: [{ quantity: 1, price: { id: priceId } }] });

    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent({}, currentIntent), rawBody: `{"id":"evt-${currency}"}`, stripe, repository: repo,
    });

    expect(result).toEqual({ outcome: "granted" });
    expect(repo.finalizePaidCheckout).toHaveBeenCalledWith(expect.objectContaining({
      checkoutIntentId: "intent-1",
      checkoutSessionId: "cs-1",
      paymentIntentId: "pi-1",
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

  it.each([
    ["wrong currency", { currency: "usd" }, "checkout_currency_mismatch"],
    ["wrong amount", { amount_total: 1 }, "checkout_amount_mismatch"],
  ])("marks a paid Session for review on %s", async (_label, overrides, errorCode) => {
    const repo = repository();
    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent(overrides), rawBody: errorCode, stripe, repository: repo,
    });
    expect(result).toEqual({ outcome: "review_required" });
    expect(repo.finalizePaidCheckout).not.toHaveBeenCalled();
    expect(repo.recordProviderEvent).toHaveBeenCalledWith(expect.objectContaining({
      processingStatus: "review_required", errorCode,
    }));
  });

  it("marks a foreign Stripe Price for review", async () => {
    listLineItems.mockResolvedValueOnce({ data: [{ quantity: 1, price: { id: "price_foreign" } }] });
    const repo = repository();
    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent(), rawBody: "wrong-price", stripe, repository: repo,
    });
    expect(result).toEqual({ outcome: "review_required" });
    expect(repo.finalizePaidCheckout).not.toHaveBeenCalled();
    expect(repo.recordProviderEvent).toHaveBeenCalledWith(expect.objectContaining({ errorCode: "checkout_price_mismatch" }));
  });

  it.each([
    ["family", { metadata: { checkout_intent_id: "intent-1", family_id: "family-foreign", academic_year_id: "year-2027", media_product_key: "MEDIA_250" } }],
    ["learning year", { metadata: { checkout_intent_id: "intent-1", family_id: "family-1", academic_year_id: "year-foreign", media_product_key: "MEDIA_250" } }],
    ["product", { metadata: { checkout_intent_id: "intent-1", family_id: "family-1", academic_year_id: "year-2027", media_product_key: "MEDIA_100" } }],
  ])("marks mismatched %s metadata for review", async (_label, overrides) => {
    const repo = repository();
    const result = await processVerifiedStripeWebhook({
      event: checkoutEvent(overrides), rawBody: `wrong-${_label}`, stripe, repository: repo,
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
