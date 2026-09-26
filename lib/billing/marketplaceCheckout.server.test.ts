import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  db: vi.fn(),
}));

vi.mock("@/lib/billing/supabaseBilling.server", () => ({
  BILLING_AUTHORITY_ROLES: ["owner", "parent"],
  createBillingAdminClient: () => mocks.db(),
}));
vi.mock("@/lib/billing/stripeCheckout.server", () => ({
  checkoutReturnOrigin: () => "https://www.mylearna.com",
}));

import { createMarketplaceResourceCheckout } from "@/lib/billing/marketplaceCheckout.server";

function chain(result: unknown) {
  const api: Record<string, any> = {};
  for (const method of ["select","eq","in","lte","or","limit","update","insert"]) {
    api[method] = vi.fn(() => api);
  }
  api.maybeSingle = vi.fn(async () => result);
  api.single = vi.fn(async () => result);
  return api;
}

describe("Marketplace Stripe Checkout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses server-authoritative price metadata and never trusts client amount fields", async () => {
    const authority = chain({ data: { id: "member-1" }, error: null });
    const catalogue = chain({
      data: {
        id: "resource-1",
        external_product_id: "MYL-AUTO-1",
        handle: "paid-worksheet",
        title: "Paid Worksheet",
        source: "mylearna_agent",
        is_active: true,
        metadata: { access_model: "paid", currency: "AUD", price_minor: 495 },
      },
      error: null,
    });
    const entitlement = chain({ data: [], error: null });
    const expire = chain({ data: null, error: null });
    const existing = chain({ data: null, error: null });
    const created = chain({
      data: {
        id: "intent-1",
        family_id: "family-1",
        marketplace_resource_id: "resource-1",
        external_product_id: "MYL-AUTO-1",
        currency: "AUD",
        amount_minor: 495,
      },
      error: null,
    });
    const mark = chain({ data: null, error: null });

    let call = 0;
    mocks.db.mockReturnValue({
      from: vi.fn(() => {
        call += 1;
        return [authority,catalogue,entitlement,expire,existing,created,mark][call - 1];
      }),
    });

    const create = vi.fn(async (params) => ({
      id: "cs_test_1",
      url: "https://checkout.stripe.test/cs_test_1",
      ...params,
    }));
    const stripe = { checkout: { sessions: { create } } } as never;

    const result = await createMarketplaceResourceCheckout({
      familyId: "family-1",
      externalProductId: "MYL-AUTO-1",
      requestedByUserId: "user-1",
      requestedByEmail: "parent@example.com",
      stripe,
    });

    expect(result.checkoutUrl).toContain("checkout.stripe.test");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        line_items: [
          expect.objectContaining({
            quantity: 1,
            price_data: expect.objectContaining({
              currency: "aud",
              unit_amount: 495,
            }),
          }),
        ],
      }),
      expect.objectContaining({ idempotencyKey: "mylearna-marketplace-checkout-intent-1" }),
    );
  });
});
