import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  processWebhook: vi.fn(),
}));

vi.mock("@/lib/billing/stripe.server", () => ({
  getStripeClient: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
  getStripeWebhookSecret: () => "whsec_test",
  StripeBillingConfigurationError: class StripeBillingConfigurationError extends Error {},
}));
vi.mock("@/lib/billing/stripeWebhook.server", () => ({
  createSupabaseStripeWebhookRepository: vi.fn(() => ({})),
  processVerifiedStripeWebhook: mocks.processWebhook,
}));

import { POST } from "./route";

function request(body = "{}", signature?: string) {
  return new Request("http://localhost/api/billing/stripe/webhook", {
    method: "POST",
    body,
    headers: signature ? { "stripe-signature": signature } : undefined,
  });
}

describe("POST /api/billing/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.constructEvent.mockReturnValue({ id: "evt-1", type: "checkout.session.completed" });
    mocks.processWebhook.mockResolvedValue({ outcome: "granted" });
  });

  it("rejects absent or invalid Stripe signatures before webhook processing", async () => {
    expect((await POST(request())).status).toBe(400);
    expect(mocks.constructEvent).not.toHaveBeenCalled();

    mocks.constructEvent.mockImplementationOnce(() => { throw new Error("invalid"); });
    expect((await POST(request("raw-body", "bad-signature"))).status).toBe(400);
    expect(mocks.processWebhook).not.toHaveBeenCalled();
  });

  it("uses the raw request body for verified webhook processing", async () => {
    const response = await POST(request("raw-body", "valid-signature"));
    expect(response.status).toBe(200);
    expect(mocks.constructEvent).toHaveBeenCalledWith("raw-body", "valid-signature", "whsec_test");
    expect(mocks.processWebhook).toHaveBeenCalledWith(expect.objectContaining({ rawBody: "raw-body" }));
    await expect(response.json()).resolves.toEqual({ received: true, outcome: "granted" });
  });

  it("returns a retriable failure when verified commercial finalisation cannot complete", async () => {
    mocks.processWebhook.mockRejectedValueOnce(new Error("temporary database failure"));
    const response = await POST(request("raw-body", "valid-signature"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Webhook processing failed." });
  });
});
