import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieValues, getCartMock, createCartMock, addCartLineMock, updateCartLineMock, removeCartLineMock, isCartValidMock, isVariantEligibleMock } = vi.hoisted(() => ({
  cookieValues: new Map<string, string>(),
  getCartMock: vi.fn(),
  createCartMock: vi.fn(),
  addCartLineMock: vi.fn(),
  updateCartLineMock: vi.fn(),
  removeCartLineMock: vi.fn(),
  isCartValidMock: vi.fn(),
  isVariantEligibleMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ get: (name: string) => cookieValues.has(name) ? { value: cookieValues.get(name) } : undefined })) }));
vi.mock("@/lib/shopify/client", () => ({
  getCart: getCartMock,
  createCart: createCartMock,
  addCartLine: addCartLineMock,
  updateCartLine: updateCartLineMock,
  removeCartLine: removeCartLineMock,
  isMarketplaceCartValid: isCartValidMock,
  isMarketplaceVariantEligible: isVariantEligibleMock,
}));

import { GET, POST } from "./route";

const validCart = { id: "cart-v2", checkoutUrl: "https://checkout.shopify.com/cart-v2", totalQuantity: 1, cost: { subtotalAmount: { amount: "12", currencyCode: "AUD" }, totalAmount: { amount: "12", currencyCode: "AUD" } }, lines: [] };

function request(body: Record<string, unknown>) {
  return new Request("http://localhost/api/marketplace/cart", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
}

function deletedCookieNames(response: Response) {
  return response.headers.getSetCookie().map((cookie) => cookie.split("=", 1)[0]);
}

describe("Marketplace cart isolation", () => {
  beforeEach(() => {
    cookieValues.clear();
    vi.clearAllMocks();
    isCartValidMock.mockReturnValue(true);
    isVariantEligibleMock.mockResolvedValue(true);
    getCartMock.mockResolvedValue(validCart);
    createCartMock.mockResolvedValue(validCart);
    addCartLineMock.mockResolvedValue(validCart);
    updateCartLineMock.mockResolvedValue(validCart);
    removeCartLineMock.mockResolvedValue(validCart);
  });

  it("ignores and deletes the legacy cookie", async () => {
    cookieValues.set("mylearna_marketplace_cart_id", "legacy-cart");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cart: null });
    expect(getCartMock).not.toHaveBeenCalled();
    expect(deletedCookieNames(response)).toContain("mylearna_marketplace_cart_id");
  });

  it("uses the v2 cookie and deletes any legacy cookie", async () => {
    cookieValues.set("mylearna_marketplace_cart_id", "legacy-cart");
    cookieValues.set("mylearna_marketplace_cart_v2_id", "v2-cart");
    const response = await GET();
    expect(getCartMock).toHaveBeenCalledWith("v2-cart");
    expect(await response.json()).toEqual({ cart: validCart });
    expect(deletedCookieNames(response)).toContain("mylearna_marketplace_cart_id");
  });

  it("adds an approved physical variant and sets the v2 cookie", async () => {
    const response = await POST(request({ action: "add", variantId: "approved-variant", quantity: 1 }));
    expect(isVariantEligibleMock).toHaveBeenCalledWith("approved-variant");
    expect(createCartMock).toHaveBeenCalledWith("approved-variant", 1);
    expect(response.status).toBe(200);
    expect(deletedCookieNames(response)).toContain("mylearna_marketplace_cart_id");
    expect(response.headers.getSetCookie().some((cookie) => cookie.startsWith("mylearna_marketplace_cart_v2_id="))).toBe(true);
  });

  it("rejects an unapproved variant before creating or modifying a cart", async () => {
    isVariantEligibleMock.mockResolvedValue(false);
    const response = await POST(request({ action: "add", variantId: "excluded-variant", quantity: 1 }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ code: "marketplace_item_unavailable", error: "This item is not available in MyLearna Marketplace." });
    expect(createCartMock).not.toHaveBeenCalled();
    expect(addCartLineMock).not.toHaveBeenCalled();
    expect(getCartMock).not.toHaveBeenCalled();
  });

  it("clears an invalid v2 cart and returns no checkout cart", async () => {
    cookieValues.set("mylearna_marketplace_cart_v2_id", "invalid-cart");
    isCartValidMock.mockReturnValue(false);
    const response = await GET();
    expect(getCartMock).toHaveBeenCalledWith("invalid-cart");
    expect(await response.json()).toEqual({ cart: null });
    expect(deletedCookieNames(response)).toContain("mylearna_marketplace_cart_v2_id");
    expect(response.headers.get("set-cookie")).not.toContain("checkout.shopify.com");
  });

  it("continues serving a valid physical v2 cart", async () => {
    cookieValues.set("mylearna_marketplace_cart_v2_id", "valid-cart");
    const response = await GET();
    expect(response.status).toBe(200);
    expect((await response.json()).cart.checkoutUrl).toContain("checkout.shopify.com");
  });
});
