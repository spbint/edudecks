import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  processMediaWebhook: vi.fn(),
  processMarketplaceWebhook: vi.fn(),
  isMarketplaceEvent: vi.fn(),
}));

vi.mock("@/lib/billing/stripe.server", () => ({
  getStripeClient: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
  getStripeWebhookSecret: () => "whsec_test",
  StripeBillingConfigurationError: class StripeBillingConfigurationError extends Error {},
}));
vi.mock("@/lib/billing/stripeWebhook.server", () => ({
  createSupabaseStripeWebhookRepository: vi.fn(() => ({})),
  processVerifiedStripeWebhook: mocks.processMediaWebhook,
}));
vi.mock("@/lib/billing/marketplaceStripeWebhook.server", () => ({
  isMarketplaceStripeEvent: mocks.isMarketplaceEvent,
  processMarketplaceStripeWebhook: mocks.processMarketplaceWebhook,
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
    mocks.isMarketplaceEvent.mockReturnValue(false);
    mocks.processMediaWebhook.mockResolvedValue({ outcome: "granted" });
    mocks.processMarketplaceWebhook.mockResolvedValue({ outcome: "granted" });
  });

  it("rejects absent or invalid Stripe signatures before webhook processing", async () => {
    expect((await POST(request())).status).toBe(400);
    expect(mocks.constructEvent).not.toHaveBeenCalled();

    mocks.constructEvent.mockImplementationOnce(() => { throw new Error("invalid"); });
    expect((await POST(request("raw-body", "bad-signature"))).status).toBe(400);
    expect(mocks.processMediaWebhook).not.toHaveBeenCalled();
    expect(mocks.processMarketplaceWebhook).not.toHaveBeenCalled();
  });

  it("keeps existing media payments on the existing processor", async () => {
    const response = await POST(request("raw-body", "valid-signature"));
    expect(response.status).toBe(200);
    expect(mocks.processMediaWebhook).toHaveBeenCalledWith(expect.objectContaining({ rawBody: "raw-body" }));
    expect(mocks.processMarketplaceWebhook).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      received: true,
      purchaseKind: "media_storage",
      outcome: "granted",
    });
  });

  it("dispatches Marketplace resource payments to the entitlement processor", async () => {
    mocks.isMarketplaceEvent.mockReturnValueOnce(true);
    const response = await POST(request("marketplace-body", "valid-signature"));
    expect(response.status).toBe(200);
    expect(mocks.processMarketplaceWebhook).toHaveBeenCalledWith(expect.objectContaining({
      rawBody: "marketplace-body",
    }));
    expect(mocks.processMediaWebhook).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      received: true,
      purchaseKind: "marketplace_resource",
      outcome: "granted",
    });
  });

  it("returns a retriable failure when verified commercial finalisation cannot complete", async () => {
    mocks.processMediaWebhook.mockRejectedValueOnce(new Error("temporary database failure"));
    const response = await POST(request("raw-body", "valid-signature"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Webhook processing failed." });
  });
});
