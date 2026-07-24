import { afterEach, describe, expect, it, vi } from "vitest";
import { createShopifyStorefrontProvider, normalizeShopifyProduct, ShopifyProviderError } from "@/lib/intelligence/commerce/shopify";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const node = (overrides: Record<string, unknown> = {}) => ({
  id: "gid://shopify/Product/1", handle: "science-kit", title: "Science paper kit", description: "A reusable learning resource.", tags: ["resource:paper", "subject:science", "age:8-10", "region:AU", "fulfilment:third_party_shopify_seller"], onlineStoreUrl: "https://shop.example/products/science-kit", featuredImage: { url: "https://cdn.example/image.jpg" }, priceRange: { minVariantPrice: { amount: "12.50", currencyCode: "AUD" } }, variants: { nodes: [{ id: "gid://shopify/ProductVariant/1", availableForSale: true, price: { amount: "12.50", currencyCode: "AUD" } }] }, ...overrides,
});

describe("Shopify Storefront provider", () => {
  it("normalizes catalogue fields without exposing credentials", () => {
    const product = normalizeShopifyProduct(node(), "AU", new Date("2026-07-24T00:00:00.000Z"));
    expect(product).toMatchObject({ provider: "shopify", providerProductId: "gid://shopify/Product/1", providerVariantId: "gid://shopify/ProductVariant/1", price: { amount: 12.5, currency: "AUD" }, resourceKeys: ["paper"], region: "AU", lastSyncedAt: "2026-07-24T00:00:00.000Z" });
    expect(product?.disclosure).toContain("may earn revenue");
  });

  it("marks unavailable variants and wrong regions", () => {
    expect(normalizeShopifyProduct(node({ tags: ["resource:paper", "region:NZ"] }), "AU")?.availability).toBe("region_ineligible");
    expect(normalizeShopifyProduct(node({ variants: { nodes: [{ id: "v", availableForSale: false, price: { amount: "1", currencyCode: "AUD" } }] } }), "AU")?.availability).toBe("unavailable");
  });

  it("retrieves products server-side through Storefront GraphQL", async () => {
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "shop.example");
    vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "server-only-token");
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: { products: { nodes: [node()] } } }), { status: 200 }));
    const products = await createShopifyStorefrontProvider(fetcher).getProductsForResources([{ recommendationId: "r", required: true, learnerAgeOrStage: "8-10", subjects: ["science"], curriculumConcepts: [], parentPreferences: null, resource: { name: "paper", resourceKey: "paper", category: "material", quantity: null, required: true, url: null, notes: "" }, sourceRecommendation: {} as never }], { region: "AU", now: () => new Date("2026-07-24T00:00:00.000Z") });
    expect(products[0].title).toBe("Science paper kit");
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/graphql.json"), expect.objectContaining({ headers: expect.objectContaining({ "X-Shopify-Storefront-Access-Token": "server-only-token" }) }));
  });

  it("degrades with typed provider failures", async () => {
    vi.stubEnv("SHOPIFY_STORE_DOMAIN", "shop.example");
    vi.stubEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN", "token");
    const fetcher = vi.fn(async () => { throw new Error("network"); });
    await expect(createShopifyStorefrontProvider(fetcher).getProductsForResources([], { region: "AU" })).resolves.toEqual([]);
    await expect(createShopifyStorefrontProvider(fetcher).getProductsForResources([{ recommendationId: "r", required: true, learnerAgeOrStage: null, subjects: [], curriculumConcepts: [], parentPreferences: null, resource: { name: "paper", resourceKey: "paper", category: null, quantity: null, required: true, url: null, notes: "" }, sourceRecommendation: {} as never }], { region: "AU" })).rejects.toMatchObject({ code: "request_failed" } satisfies Partial<ShopifyProviderError>);
  });
});
