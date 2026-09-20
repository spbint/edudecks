import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  createCheckout: vi.fn(),
  repository: vi.fn(),
  stripe: vi.fn(),
}));

vi.mock("@/lib/auth/serverRouteAuth", () => ({ getAuthenticatedRouteUser: mocks.getUser }));
vi.mock("@/lib/billing/stripeCheckout.server", () => ({
  BillingCheckoutRequestError: class BillingCheckoutRequestError extends Error {
    constructor(public code: string, public status: number, message: string) { super(message); }
  },
  createOneTimeMediaCheckout: mocks.createCheckout,
  createSupabaseBillingCheckoutRepository: mocks.repository,
}));
vi.mock("@/lib/billing/stripe.server", () => ({
  getStripeClient: mocks.stripe,
  StripeBillingConfigurationError: class StripeBillingConfigurationError extends Error {},
}));

import { POST } from "./route";

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/billing/stripe/checkout", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/billing/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ id: "adult-1", email: "adult@example.com" });
    mocks.repository.mockReturnValue({});
    mocks.stripe.mockReturnValue({});
    mocks.createCheckout.mockResolvedValue({ checkoutIntentId: "intent-1", checkoutUrl: "https://checkout.stripe.test/cs-1" });
  });

  it("requires an authenticated adult", async () => {
    mocks.getUser.mockResolvedValueOnce(null);
    const response = await POST(request({ familyId: "family-1", productKey: "MEDIA_250" }));
    expect(response.status).toBe(401);
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("forwards only the untrusted family and product selection; authority is server-side", async () => {
    const response = await POST(request({
      familyId: "family-1",
      productKey: "MEDIA_250",
      amountMinor: 1,
      currency: "GBP",
      quotaBytes: 1,
      priceId: "price_attacker",
    }));
    expect(response.status).toBe(200);
    expect(mocks.createCheckout).toHaveBeenCalledWith(expect.objectContaining({
      familyId: "family-1",
      productKey: "MEDIA_250",
      requestedByUserId: "adult-1",
    }));
    expect(mocks.createCheckout.mock.calls[0][0]).not.toHaveProperty("amountMinor");
    expect(mocks.createCheckout.mock.calls[0][0]).not.toHaveProperty("currency");
    expect(mocks.createCheckout.mock.calls[0][0]).not.toHaveProperty("quotaBytes");
    expect(mocks.createCheckout.mock.calls[0][0]).not.toHaveProperty("priceId");
  });
});
