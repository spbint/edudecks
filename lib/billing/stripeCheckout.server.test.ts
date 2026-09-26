import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  BillingCheckoutRequestError,
  checkoutReturnOrigin,
  createOneTimeMediaCheckout,
  type BillingCheckoutRepository,
} from "@/lib/billing/stripeCheckout.server";

const createCustomer = vi.fn();
const createSession = vi.fn();
const retrieveSession = vi.fn();
const expireSession = vi.fn();

const stripe = {
  customers: { create: createCustomer },
  checkout: { sessions: { create: createSession, retrieve: retrieveSession, expire: expireSession } },
} as never;

function repository(overrides: Partial<BillingCheckoutRepository> = {}) {
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
    providerCheckoutSessionId: null,
    providerPaymentIntentId: null,
    expiresAt: "2027-09-01T12:45:00.000Z",
    status: "pending",
  };
  return {
    userCanInitiateBilling: vi.fn(async () => true),
    getFamilyBillingProfile: vi.fn(async () => ({ countryCode: "AU", jurisdictionCode: "TAS" })),
    getCurrentAcademicYear: vi.fn(async () => ({
      id: "year-2027",
      startsOn: "2027-01-01",
      endsOn: "2027-12-31",
      label: "2027 Learning Year",
    })),
    hasCurrentExplicitMediaEntitlement: vi.fn(async () => false),
    findOpenCheckoutIntent: vi.fn(async () => null),
    findFamilyStripeCustomer: vi.fn(async () => "cus-existing"),
    saveFamilyStripeCustomer: vi.fn(async (_familyId: string, customerId: string) => customerId),
    createCheckoutIntent: vi.fn(async () => intent),
    markCheckoutCreated: vi.fn(async () => undefined),
    markCheckoutExpired: vi.fn(async () => undefined),
    markCheckoutFailed: vi.fn(async () => undefined),
    ...overrides,
  } satisfies BillingCheckoutRepository;
}

function requestInput(repo: BillingCheckoutRepository, overrides: Record<string, unknown> = {}) {
  return {
    familyId: "family-1",
    productKey: "MEDIA_250",
    requestedByUserId: "adult-1",
    requestedByEmail: "adult@example.com",
    repository: repo,
    stripe,
    now: new Date("2027-09-01T12:00:00.000Z"),
    ...overrides,
  };
}

describe("one-time Stripe media Checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PRICE_MEDIA_100 = "price_media_100";
    process.env.STRIPE_PRICE_MEDIA_250 = "price_media_250";
    process.env.STRIPE_PRICE_MEDIA_500 = "price_media_500";
    process.env.STRIPE_PRICE_MEDIA_1000 = "price_media_1000";
    process.env.MYLEARNA_APP_URL = "https://www.mylearna.com";
    createSession.mockResolvedValue({ id: "cs-1", url: "https://checkout.stripe.test/cs-1" });
    retrieveSession.mockReset();
    expireSession.mockReset();
    createCustomer.mockResolvedValue({ id: "cus-created" });
  });

  function openIntent(overrides: Record<string, unknown> = {}) {
    return {
      id: "intent-open",
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
      providerCustomerId: "cus-existing",
      providerCheckoutSessionId: "cs-open",
      providerPaymentIntentId: null,
      expiresAt: "2027-09-01T12:45:00.000Z",
      status: "checkout_created",
      ...overrides,
    };
  }

  it("uses the current learning year even after its midpoint and snapshots trusted product facts before redirecting", async () => {
    const repo = repository();
    const result = await createOneTimeMediaCheckout(requestInput(repo));

    expect(result).toEqual({ checkoutUrl: "https://checkout.stripe.test/cs-1", checkoutIntentId: "intent-1" });
    expect(repo.getCurrentAcademicYear).toHaveBeenCalledWith("family-1", new Date("2027-09-01T12:00:00.000Z"));
    expect(repo.createCheckoutIntent).toHaveBeenCalledWith(expect.objectContaining({
      productKey: "MEDIA_250",
      currency: "AUD",
      amountMinor: 2195,
      quotaBytes: 262144000,
      academicYearId: "year-2027",
      periodEndsOn: "2027-12-31",
    }));
    expect(repo.markCheckoutCreated).toHaveBeenCalledWith("intent-1", "cs-1");
    expect(createSession).toHaveBeenCalledAfter(repo.createCheckoutIntent as ReturnType<typeof vi.fn>);
    expect(createSession).toHaveBeenCalledWith(expect.anything(), {
      idempotencyKey: "mylearna-media-checkout-intent-1",
    });
    expect(createSession.mock.calls[0][0].expires_at).toBe(1819802700);
    expect(createSession.mock.calls[0][0].currency).toBe("aud");
  });

  it("uses only the trusted server Price and opaque metadata", async () => {
    const repo = repository();
    await createOneTimeMediaCheckout(requestInput(repo, {
      productKey: "MEDIA_1000",
      amountMinor: 1,
      quotaBytes: 1,
      priceId: "price_attacker",
      currency: "GBP",
      academicYearId: "foreign-year",
    }));

    const call = createSession.mock.calls[0][0];
    expect(call.mode).toBe("payment");
    expect(call.currency).toBe("aud");
    expect(call.line_items).toEqual([{ price: "price_media_1000", quantity: 1 }]);
    expect(call.metadata).toEqual({
      checkout_intent_id: "intent-1",
      family_id: "family-1",
      academic_year_id: "year-2027",
      media_product_key: "MEDIA_1000",
    });
    expect(JSON.stringify(call.metadata)).not.toMatch(/learner|evidence|child|filename/i);
  });

  it("reuses an existing family Stripe Customer and creates one only when absent", async () => {
    const existing = repository();
    await createOneTimeMediaCheckout(requestInput(existing));
    expect(createCustomer).not.toHaveBeenCalled();
    expect(createSession.mock.calls[0][0].customer).toBe("cus-existing");

    const absent = repository({ findFamilyStripeCustomer: vi.fn(async () => null) });
    await createOneTimeMediaCheckout(requestInput(absent));
    expect(createCustomer).toHaveBeenCalledWith(
      { email: "adult@example.com", metadata: { family_id: "family-1" } },
      { idempotencyKey: "mylearna-family-stripe-customer-family-1" },
    );
    expect(absent.saveFamilyStripeCustomer).toHaveBeenCalledWith("family-1", "cus-created");
  });

  it("passes the trusted instant to canonical Learning Year resolution", async () => {
    const repo = repository({
      getFamilyBillingProfile: vi.fn(async () => ({ countryCode: "AU", jurisdictionCode: "WA" })),
    });
    await createOneTimeMediaCheckout(requestInput(repo, {
      now: new Date("2027-01-01T13:30:00.000Z"),
    }));
    expect(repo.getCurrentAcademicYear).toHaveBeenCalledWith("family-1", new Date("2027-01-01T13:30:00.000Z"));
  });

  it("resumes an existing same-product open Checkout without creating anything new", async () => {
    const repo = repository({ findOpenCheckoutIntent: vi.fn(async () => openIntent()) });
    retrieveSession.mockResolvedValue({ id: "cs-open", url: "https://checkout.stripe.test/cs-open", status: "open" });

    const result = await createOneTimeMediaCheckout(requestInput(repo));

    expect(result).toEqual({ checkoutUrl: "https://checkout.stripe.test/cs-open", checkoutIntentId: "intent-open" });
    expect(retrieveSession).toHaveBeenCalledWith("cs-open");
    expect(createSession).not.toHaveBeenCalled();
    expect(createCustomer).not.toHaveBeenCalled();
    expect(repo.createCheckoutIntent).not.toHaveBeenCalled();
    expect(expireSession).not.toHaveBeenCalled();
  });

  it("preserves the database concurrency boundary when a competing request wins the intent insert", async () => {
    const repo = repository({
      createCheckoutIntent: vi.fn(async () => {
        throw new BillingCheckoutRequestError("media_checkout_already_open", 409, "already open");
      }),
      findOpenCheckoutIntent: vi.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(openIntent()),
    });
    retrieveSession.mockResolvedValue({ id: "cs-open", url: "https://checkout.stripe.test/cs-open", status: "open" });

    const result = await createOneTimeMediaCheckout(requestInput(repo));

    expect(result.checkoutIntentId).toBe("intent-open");
    expect(repo.createCheckoutIntent).toHaveBeenCalledOnce();
    expect(createSession).not.toHaveBeenCalled();
    expect(createCustomer).not.toHaveBeenCalled();
  });

  it("expires an expired Stripe Checkout and allows a fresh intent", async () => {
    const repo = repository({ findOpenCheckoutIntent: vi.fn(async () => openIntent()) });
    retrieveSession.mockResolvedValue({ id: "cs-open", url: "https://checkout.stripe.test/cs-open", status: "expired" });

    await createOneTimeMediaCheckout(requestInput(repo));

    expect(repo.markCheckoutExpired).toHaveBeenCalledWith("intent-open");
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(expireSession).not.toHaveBeenCalled();
  });

  it("expires a different open commercial snapshot before creating the requested tier", async () => {
    const repo = repository({ findOpenCheckoutIntent: vi.fn(async () => openIntent({ productKey: "MEDIA_100" as const, amountMinor: 1495, quotaBytes: 104857600 })) });
    retrieveSession.mockResolvedValue({ id: "cs-open", url: "https://checkout.stripe.test/cs-open", status: "open" });

    await createOneTimeMediaCheckout(requestInput(repo));

    expect(expireSession).toHaveBeenCalledWith("cs-open");
    expect(repo.markCheckoutExpired).toHaveBeenCalledWith("intent-open");
    expect(repo.createCheckoutIntent).toHaveBeenCalledWith(expect.objectContaining({ productKey: "MEDIA_250" }));
    expect(createSession).toHaveBeenCalledTimes(1);
  });

  it("does not resume a prior Checkout when the authoritative family market changes", async () => {
    const repo = repository({
      getFamilyBillingProfile: vi.fn(async () => ({ countryCode: "US", jurisdictionCode: "CA" })),
      findOpenCheckoutIntent: vi.fn(async () => openIntent()),
    });
    retrieveSession.mockResolvedValue({ id: "cs-open", url: "https://checkout.stripe.test/cs-open", status: "open" });

    await createOneTimeMediaCheckout(requestInput(repo));

    expect(expireSession).toHaveBeenCalledWith("cs-open");
    expect(repo.markCheckoutExpired).toHaveBeenCalledWith("intent-open");
    expect(repo.createCheckoutIntent).toHaveBeenCalledWith(expect.objectContaining({ currency: "USD", amountMinor: 1499 }));
    expect(createSession.mock.calls[0][0]).toMatchObject({ currency: "usd" });
  });

  it.each(["complete", "processing"] as const)("does not create another checkout when payment is %s", async (status) => {
    const repo = repository({ findOpenCheckoutIntent: vi.fn(async () => openIntent()) });
    retrieveSession.mockResolvedValue({ id: "cs-open", url: "https://checkout.stripe.test/cs-open", status: status === "processing" ? "complete" : status });

    await expect(createOneTimeMediaCheckout(requestInput(repo))).rejects.toMatchObject({
      code: "media_checkout_payment_processing",
      status: 409,
    });
    expect(createSession).not.toHaveBeenCalled();
    expect(expireSession).not.toHaveBeenCalled();
  });

  it.each([
    ["US", "CA", "MEDIA_100", "usd", 999, "price_media_100"],
    ["UK", "ENG", "MEDIA_500", "gbp", 1899, "price_media_500"],
  ] as const)("uses the family market for %s Checkout", async (countryCode, jurisdictionCode, productKey, currency, amountMinor, priceId) => {
    const repo = repository({
      getFamilyBillingProfile: vi.fn(async () => ({ countryCode, jurisdictionCode })),
    });

    await createOneTimeMediaCheckout(requestInput(repo, { productKey }));

    expect(repo.createCheckoutIntent).toHaveBeenCalledWith(expect.objectContaining({
      productKey,
      currency: currency.toUpperCase(),
      amountMinor,
    }));
    expect(createSession.mock.calls[0][0]).toMatchObject({
      currency,
      line_items: [{ price: priceId, quantity: 1 }],
    });
  });

  it.each([
    ["caregiver without parent billing authority", repository({ userCanInitiateBilling: vi.fn(async () => false) }), "billing_not_authorised", 403],
    ["unsupported family market", repository({ getFamilyBillingProfile: vi.fn(async () => ({ countryCode: "NZ", jurisdictionCode: "WGN" })) }), "billing_country_unsupported", 409],
    ["missing family jurisdiction", repository({ getFamilyBillingProfile: vi.fn(async () => ({ countryCode: "AU", jurisdictionCode: null })) }), "billing_jurisdiction_required", 409],
    ["no current academic year", repository({ getCurrentAcademicYear: vi.fn(async () => null) }), "current_learning_year_required", 409],
    ["existing explicit entitlement", repository({ hasCurrentExplicitMediaEntitlement: vi.fn(async () => true) }), "media_entitlement_already_current", 409],
  ])("rejects %s without creating a provider checkout", async (_label, repo, code, status) => {
    await expect(createOneTimeMediaCheckout(requestInput(repo))).rejects.toMatchObject({ code, status });
    expect(createSession).not.toHaveBeenCalled();
  });

  it("rejects unsupported product keys and never treats beta compatibility as an explicit paid entitlement", async () => {
    const repo = repository();
    await expect(createOneTimeMediaCheckout(requestInput(repo, { productKey: "price_attacker" }))).rejects.toMatchObject({
      code: "billing_request_invalid",
      status: 400,
    } satisfies Partial<BillingCheckoutRequestError>);

    await createOneTimeMediaCheckout(requestInput(repo));
    expect(repo.hasCurrentExplicitMediaEntitlement).toHaveBeenCalledWith("family-1", "year-2027");
    expect(createSession).toHaveBeenCalledTimes(1);
  });

  it("records a safe failed intent when Stripe cannot create Checkout", async () => {
    createSession.mockRejectedValueOnce(new Error("Stripe unavailable"));
    const repo = repository();
    await expect(createOneTimeMediaCheckout(requestInput(repo))).rejects.toMatchObject({
      code: "stripe_checkout_unavailable",
      status: 503,
    });
    expect(repo.markCheckoutFailed).toHaveBeenCalledWith("intent-1", "checkout_creation_failed");
  });

  it("requires a configured server origin and never uses the browser request origin", () => {
    const original = process.env.MYLEARNA_APP_URL;
    delete process.env.MYLEARNA_APP_URL;
    expect(() => checkoutReturnOrigin()).toThrow(/temporarily unavailable/i);
    process.env.MYLEARNA_APP_URL = "https://www.mylearna.com/unsafe-path";
    expect(() => checkoutReturnOrigin()).toThrow(/temporarily unavailable/i);
    if (original === undefined) delete process.env.MYLEARNA_APP_URL;
    else process.env.MYLEARNA_APP_URL = original;
  });
});
