import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShopifyError } from "./errors";
import { addCartLine, createCart, getCart, getCollection, getCollections, getHome, getProduct, isMarketplaceVariantEligible, removeCartLine, shopifyConfigForTest, shopifyRequestForTest, updateCartLine } from "./client";
import { MARKETPLACE_CATEGORIES, isApprovedMarketplaceCollectionHandle, isMarketplaceProductEligible } from "./categories";

const original = {
  domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  publicToken: process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
  privateToken: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
  version: process.env.SHOPIFY_STOREFRONT_API_VERSION,
  country: process.env.SHOPIFY_COUNTRY,
};

const image = { url: "https://cdn.shopify.com/image.jpg", altText: "A learning resource", width: 100, height: 100 };
const variant = { id: "gid://shopify/ProductVariant/1", title: "Standard", availableForSale: true, quantityAvailable: 4, selectedOptions: [{ name: "Format", value: "Standard" }], price: { amount: "12.00", currencyCode: "AUD" }, compareAtPrice: null, image };
const productCollection = { id: "gid://shopify/Collection/1", handle: "learning-kits", title: "Learning Kits", image };
const productSummary = { id: "gid://shopify/Product/1", handle: "learning-resource", title: "Learning resource", vendor: "MyLearna", productType: "Education", tags: ["science"], availableForSale: true, featuredImage: image, priceRange: { minVariantPrice: variant.price, maxVariantPrice: variant.price }, collections: [productCollection] };
const rawProductSummary = { ...productSummary, collections: { nodes: [productCollection] } };
const rawProduct = { ...productSummary, description: "A useful resource.", descriptionHtml: "<p>A useful resource.</p>", images: { nodes: [image] }, variants: { nodes: [variant] }, collections: { nodes: [productCollection] }, seo: { title: "Learning resource", description: "A useful resource." } };
const cartLine = { id: "gid://shopify/CartLine/1", quantity: 1, cost: { totalAmount: variant.price, amountPerQuantity: variant.price }, merchandise: { id: variant.id, title: variant.title, availableForSale: true, quantityAvailable: variant.quantityAvailable, product: { handle: productSummary.handle, title: productSummary.title, featuredImage: image, collections: { nodes: [productCollection] } }, price: variant.price } };
const rawCart = { id: "gid://shopify/Cart/1", checkoutUrl: "https://checkout.shopify.com/cart/1", buyerIdentity: { countryCode: "AU" }, totalQuantity: 1, cost: { subtotalAmount: variant.price, totalAmount: variant.price }, lines: { nodes: [cartLine] } };

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ data }), { status: 200, headers: { "content-type": "application/json" } });
}

function stubConnectionResponses() {
  vi.stubGlobal("fetch", vi.fn(async (_input: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { query: string };
    if (body.query.includes("mutation MarketplaceCreateCart")) return jsonResponse({ cartCreate: { cart: rawCart, userErrors: [], warnings: [] } });
    if (body.query.includes("mutation MarketplaceAddCartLines")) return jsonResponse({ cartLinesAdd: { cart: rawCart, userErrors: [], warnings: [] } });
    if (body.query.includes("mutation MarketplaceUpdateCartLines")) return jsonResponse({ cartLinesUpdate: { cart: rawCart, userErrors: [], warnings: [] } });
    if (body.query.includes("mutation MarketplaceRemoveCartLines")) return jsonResponse({ cartLinesRemove: { cart: rawCart, userErrors: [], warnings: [] } });
    if (body.query.includes("query MarketplaceCart")) return jsonResponse({ cart: rawCart });
    if (body.query.includes("query MarketplaceProduct")) return jsonResponse({ product: rawProduct });
    if (body.query.includes("query MarketplaceCollection")) return jsonResponse({ collectionByHandle: { id: "gid://shopify/Collection/1", handle: "learning-kits", title: "Learning Kits", description: "Practical learning kits.", image, seo: { title: "Learning Kits", description: "Practical learning kits." }, products: { nodes: [rawProductSummary] } } });
    throw new Error("Unexpected Shopify test query");
  }));
}

function stubCatalogueResponses() {
  const excludedProduct = { ...productSummary, id: "gid://shopify/Product/2", handle: "excluded-resource", collections: [{ id: "gid://shopify/Collection/2", handle: "frontpage", title: "Home", image }] };
  const excludedCollection = { id: "gid://shopify/Collection/2", handle: "frontpage", title: "Home", image };
  vi.stubGlobal("fetch", vi.fn(async (_input: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { query: string };
    if (body.query.includes("query MarketplaceHome")) return jsonResponse({ collections: { nodes: [productCollection, excludedCollection] }, products: { nodes: [rawProductSummary, { ...excludedProduct, collections: { nodes: excludedProduct.collections } }] } });
    if (body.query.includes("query MarketplaceCollections")) return jsonResponse({ collections: { nodes: [productCollection, excludedCollection] } });
    if (body.query.includes("query MarketplaceProduct")) return jsonResponse({ product: excludedProduct });
    throw new Error("Unexpected Shopify catalogue test query");
  }));
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = "test-store.myshopify.com";
  process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN = "public-test-token";
  delete process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  process.env.SHOPIFY_STOREFRONT_API_VERSION = "2026-04";
  process.env.SHOPIFY_COUNTRY = "AU";
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

  it("maps Shopify cart warnings to safe errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { cartCreate: { cart: rawCart, userErrors: [], warnings: [{ code: "MERCHANDISE_NOT_ENOUGH_STOCK", message: "private stock detail" }] } } }), { status: 200 })));
    await expect(createCart("gid://shopify/ProductVariant/1", 1)).rejects.toMatchObject({ code: "quantity_unavailable", message: "Shopify could not add the requested quantity because availability changed." });
  });

  it("does not reveal network or malformed-response details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not-json", { status: 200 })));
    await expect(shopifyRequestForTest("query Test { shop { name } }", {})).rejects.toMatchObject({ code: "invalid_response" });
    const error = new ShopifyError("network", "Shopify Marketplace could not be reached.");
    expect(error.message).not.toContain("token");
  });
});

describe("Shopify connection normalization", () => {
  it("normalizes product image, variant, and collection connections", async () => {
    stubConnectionResponses();
    const product = await getProduct("learning-resource");
    expect(product?.images).toEqual([image]);
    expect(product?.variants).toEqual([variant]);
    expect(product?.collections).toEqual([{ id: "gid://shopify/Collection/1", handle: "learning-kits", title: "Learning Kits", image }]);
    expect(product?.variants.filter((item) => item.availableForSale)).toHaveLength(1);
  });

  it("normalizes collection product connections", async () => {
    stubConnectionResponses();
    const collection = await getCollection("learning-kits");
    expect(collection?.products).toEqual([productSummary]);
  });

  it("uses the default Storefront context for price-bearing catalogue queries", async () => {
    const requests: Array<{ query: string; variables: Record<string, unknown> }> = [];
    vi.stubGlobal("fetch", vi.fn(async (_input: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { query: string; variables: Record<string, unknown> };
      requests.push(body);
      if (body.query.includes("query MarketplaceHome")) return jsonResponse({ collections: { nodes: [productCollection] }, products: { nodes: [rawProductSummary] } });
      if (body.query.includes("query MarketplaceProduct")) return jsonResponse({ product: rawProduct });
      return jsonResponse({ collectionByHandle: { id: "gid://shopify/Collection/1", handle: "learning-kits", title: "Learning Kits", description: "", image, seo: { title: null, description: null }, products: { nodes: [rawProductSummary] } } });
    }));
    await getHome();
    await getProduct("learning-resource");
    await getCollection("learning-kits");
    expect(requests).toHaveLength(3);
    const homeRequest = requests.find((request) => request.query.includes("query MarketplaceHome"));
    expect(homeRequest?.query).toContain("sortKey: CREATED_AT");
    expect(homeRequest?.query).toContain("reverse: true");
    expect(homeRequest?.variables.productFirst).toBe(8);
    for (const request of requests) {
      expect(request.query).not.toContain("@inContext(country");
      expect(request.variables).not.toHaveProperty("country");
    }
  });

  it("exposes only approved physical catalogue categories and products", async () => {
    stubCatalogueResponses();
    expect(MARKETPLACE_CATEGORIES.map((category) => category.handle)).toEqual([
      "maths-manipulatives",
      "literacy-books",
      "science-measurement",
      "art-craft-design",
      "homeschool-essentials",
      "learning-kits",
      "storage-organisation",
    ]);
    expect(isApprovedMarketplaceCollectionHandle("frontpage")).toBe(false);
    expect(isApprovedMarketplaceCollectionHandle("faith-based-resources")).toBe(false);
    expect(isMarketplaceProductEligible(productSummary)).toBe(true);
    expect(isMarketplaceProductEligible({ ...productSummary, collections: [{ ...productCollection, handle: "frontpage" }] })).toBe(false);
    const home = await getHome();
    const collections = await getCollections();
    expect(home.collections.map((collection) => collection.handle)).toEqual(["learning-kits"]);
    expect(home.products.map((product) => product.handle)).toEqual(["learning-resource"]);
    expect(collections.map((collection) => collection.handle)).toEqual(["learning-kits"]);
  });

  it("returns no product for an unapproved Shopify handle", async () => {
    stubCatalogueResponses();
    await expect(getProduct("excluded-resource")).resolves.toBeNull();
  });

  it("does not query an unapproved collection handle", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getCollection("frontpage")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes empty or malformed nodes as empty arrays", async () => {
    const malformedProduct = { ...rawProduct, images: { nodes: null }, variants: { nodes: "not-an-array" }, collections: { nodes: [productCollection] } };
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ product: malformedProduct })));
    const product = await getProduct("learning-resource");
    expect(product?.images).toEqual([]);
    expect(product?.variants).toEqual([]);
    expect(product?.collections).toEqual([productCollection]);
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ collectionByHandle: { id: "gid://shopify/Collection/1", handle: "learning-kits", title: "Learning Kits", description: "", image, seo: { title: null, description: null }, products: { nodes: null } } })));
    const collection = await getCollection("learning-kits");
    expect(collection?.products).toEqual([]);
  });

  it("normalizes cart lines after retrieval and every cart mutation", async () => {
    stubConnectionResponses();
    const carts = [
      await getCart("cart-id"),
      await createCart(variant.id, 1),
      await addCartLine("cart-id", variant.id, 1),
      await updateCartLine("cart-id", cartLine.id, 2),
      await removeCartLine("cart-id", cartLine.id),
    ];
    for (const cart of carts) {
      expect(cart?.lines.length).toBe(1);
      expect(cart?.lines.map((line) => line.id)).toEqual([cartLine.id]);
    }
  });

  it("creates carts with the configured buyer country", async () => {
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { variables: { input: Record<string, unknown> } };
      expect(body.variables.input.buyerIdentity).toEqual({ countryCode: "AU" });
      return jsonResponse({ cartCreate: { cart: rawCart, userErrors: [] } });
    });
    vi.stubGlobal("fetch", fetchMock);
    await createCart(variant.id, 1);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("updates an existing cart when its buyer country is missing or different", async () => {
    for (const existingCountry of [null, "US"]) {
      const requests: string[] = [];
      vi.stubGlobal("fetch", vi.fn(async (_input: unknown, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { query: string };
        requests.push(body.query);
        if (body.query.includes("query MarketplaceCart")) return jsonResponse({ cart: { ...rawCart, buyerIdentity: { countryCode: existingCountry } } });
        if (body.query.includes("mutation MarketplaceCartBuyerIdentityUpdate")) return jsonResponse({ cartBuyerIdentityUpdate: { cart: rawCart, userErrors: [], warnings: [] } });
        throw new Error("Unexpected Shopify test query");
      }));
      const cart = await getCart("cart-id");
      expect(cart?.buyerIdentity?.countryCode).toBe("AU");
      expect(requests).toHaveLength(2);
      expect(requests[1]).toContain("mutation MarketplaceCartBuyerIdentityUpdate");
    }
  });

  it("does not update an existing cart that already has the configured country", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ cart: rawCart }));
    vi.stubGlobal("fetch", fetchMock);
    const cart = await getCart("cart-id");
    expect(cart?.buyerIdentity?.countryCode).toBe("AU");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("resolves variant eligibility from the variant product collections", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ node: { id: variant.id, availableForSale: true, quantityAvailable: variant.quantityAvailable, product: { collections: { nodes: [productCollection] } } } })));
    await expect(isMarketplaceVariantEligible(variant.id)).resolves.toBe(true);
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ node: { id: "excluded-variant", availableForSale: false, quantityAvailable: null, product: { collections: { nodes: [{ ...productCollection, handle: "frontpage" }] } } } })));
    await expect(isMarketplaceVariantEligible("excluded-variant")).resolves.toBe(false);
  });
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = original.domain;
  process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN = original.publicToken;
  process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = original.privateToken;
  process.env.SHOPIFY_STOREFRONT_API_VERSION = original.version;
  process.env.SHOPIFY_COUNTRY = original.country;
});
