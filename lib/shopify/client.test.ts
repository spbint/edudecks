import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShopifyError } from "./errors";
import { createCart, shopifyConfigForTest, shopifyRequestForTest } from "./client";

const original = {
  domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  publicToken: process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
  privateToken: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
  version: process.env.SHOPIFY_STOREFRONT_API_VERSION,
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = "test-store.myshopify.com";
  process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN = "public-test-token";
  delete process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  process.env.SHOPIFY_STOREFRONT_API_VERSION = "2026-04";
  vi.restoreAllMocks();
});

describe("Shopify client safety", () => {
  it("fails safely when configuration is missing", async () => {
    delete process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    delete process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
    delete process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
    await expect(shopifyRequestForTest("query Test { shop { name } }", {})).rejects.toMatchObject({ code: "not_configured" });
  });

  it("handles GraphQL errors without exposing the token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ errors: [{ message: "private detail" }] }), { status: 200 })));
    await expect(shopifyRequestForTest("query Test { shop { name } }", {})).rejects.toMatchObject({ code: "graphql" });
    expect(shopifyConfigForTest().token).toBe("public-test-token");
    try { await shopifyRequestForTest("query Test { shop { name } }", {}); } catch (error) { expect((error as Error).message).not.toContain("public-test-token"); }
  });

  it("maps Shopify cart userErrors to a safe error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { cartCreate: { cart: null, userErrors: [{ field: ["lines"], message: "invalid", code: "INVALID" }] } } }), { status: 200 })));
    await expect(createCart("gid://shopify/ProductVariant/1", 1)).rejects.toMatchObject({ code: "user_error" });
  });

  it("does not reveal network or malformed-response details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not-json", { status: 200 })));
    await expect(shopifyRequestForTest("query Test { shop { name } }", {})).rejects.toMatchObject({ code: "invalid_response" });
    const error = new ShopifyError("network", "Shopify Marketplace could not be reached.");
    expect(error.message).not.toContain("token");
  });
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = original.domain;
  process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN = original.publicToken;
  process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = original.privateToken;
  process.env.SHOPIFY_STOREFRONT_API_VERSION = original.version;
});
