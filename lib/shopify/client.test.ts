import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShopifyError } from "./errors";
import {
  addCartLine,
  createCart,
  getCart,
  getCollection,
  getCollections,
  getHome,
  getMarketplaceVariantAvailability,
  getProduct,
  isMarketplaceCartValid,
  isMarketplaceVariantEligible,
  removeCartLine,
  shopifyConfigForTest,
  shopifyRequestForTest,
  updateCartLine,
} from "./client";
import {
  MARKETPLACE_CATEGORIES,
  isApprovedMarketplaceCollectionHandle,
  isMarketplaceProductEligible,
} from "./categories";

const original = {
  domain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  publicToken: process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
  privateToken: process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
  version: process.env.SHOPIFY_STOREFRONT_API_VERSION,
  country: process.env.SHOPIFY_COUNTRY,
};

const image = {
  url: "https://cdn.shopify.com/image.jpg",
  altText: "Maths Counting Bears",
  width: 100,
  height: 100,
};
const variant = {
  id: "gid://shopify/ProductVariant/1",
  title: "Standard",
  availableForSale: true,
  quantityAvailable: 4,
  selectedOptions: [{ name: "Format", value: "Standard" }],
  price: { amount: "12.00", currencyCode: "AUD" },
  compareAtPrice: null,
  image,
};
const approvedCollection = {
  id: "gid://shopify/Collection/1",
  handle: "maths-manipulatives",
  title: "Maths Manipulatives",
  image,
};
const excludedCollection = {
  id: "gid://shopify/Collection/2",
  handle: "frontpage",
  title: "Home",
  image,
};
const christianFaithCollection = {
  id: "gid://shopify/Collection/3",
  handle: "christian-faith",
  title: "Christian Faith",
  image,
};
const productSummary = {
  id: "gid://shopify/Product/1",
  handle: "maths-counting-bears",
  title: "Maths Counting Bears",
  vendor: "gofindgod.com",
  productType: "Education",
  tags: ["maths"],
  availableForSale: true,
  featuredImage: image,
  priceRange: { minVariantPrice: variant.price, maxVariantPrice: variant.price },
  collections: [approvedCollection],
};
const excludedProductSummary = {
  ...productSummary,
  id: "gid://shopify/Product/2",
  handle: "excluded-resource",
  collections: [excludedCollection],
};
const rawProductSummary = {
  ...productSummary,
  collections: { nodes: productSummary.collections },
};
const rawExcludedProductSummary = {
  ...excludedProductSummary,
  collections: { nodes: excludedProductSummary.collections },
};
const rawProduct = {
  ...productSummary,
  description: "A useful resource.",
  descriptionHtml: "<p>A useful resource.</p>",
  images: { nodes: [image] },
  variants: { nodes: [variant] },
  collections: { nodes: [approvedCollection] },
  seo: { title: "Maths Counting Bears", description: "A useful resource." },
};
const rawExcludedProduct = {
  ...rawProduct,
  ...excludedProductSummary,
  collections: { nodes: [excludedCollection] },
};
const cartLine = {
  id: "gid://shopify/CartLine/1",
  quantity: 1,
  cost: { totalAmount: variant.price, amountPerQuantity: variant.price },
  merchandise: {
    id: variant.id,
    title: variant.title,
    availableForSale: true,
    quantityAvailable: variant.quantityAvailable,
    product: {
      handle: productSummary.handle,
      title: productSummary.title,
      featuredImage: image,
      collections: { nodes: [approvedCollection] },
    },
    price: variant.price,
  },
};
const rawCart = {
  id: "gid://shopify/Cart/1",
  checkoutUrl: "https://checkout.shopify.com/cart/1",
  buyerIdentity: { countryCode: "AU" },
  totalQuantity: 1,
  cost: { subtotalAmount: variant.price, totalAmount: variant.price },
  lines: { nodes: [cartLine] },
};

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function queryFrom(init?: RequestInit) {
  return JSON.parse(String(init?.body)) as {
    query: string;
    variables: Record<string, unknown>;
  };
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
    await expect(
      shopifyRequestForTest("query Test { shop { name } }", {}),
    ).rejects.toMatchObject({ code: "not_configured" });
  });

  it("does not expose tokens or provider GraphQL errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ errors: [{ message: "private detail" }] }), {
          status: 200,
        }),
      ),
    );
    await expect(
      shopifyRequestForTest("query Test { shop { name } }", {}),
    ).rejects.toMatchObject({ code: "graphql" });
    expect(shopifyConfigForTest().token).toBe("public-test-token");
    try {
      await shopifyRequestForTest("query Test { shop { name } }", {});
    } catch (error) {
      expect((error as Error).message).not.toContain("public-test-token");
      expect((error as Error).message).not.toContain("private detail");
    }
  });

  it("maps stock warnings to a safe availability error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          cartCreate: {
            cart: rawCart,
            userErrors: [],
            warnings: [
              { code: "MERCHANDISE_NOT_ENOUGH_STOCK", message: "private stock detail" },
            ],
          },
        }),
      ),
    );
    await expect(createCart(variant.id, 1)).rejects.toMatchObject({
      code: "quantity_unavailable",
      message: "Shopify could not add the requested quantity because availability changed.",
    });
  });

  it("does not reveal malformed response details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not-json", { status: 200 })));
    await expect(
      shopifyRequestForTest("query Test { shop { name } }", {}),
    ).rejects.toMatchObject({ code: "invalid_response" });
    expect(new ShopifyError("network", "Shopify Marketplace could not be reached.").message).not.toContain(
      "token",
    );
  });
});

describe("Marketplace catalogue isolation", () => {
  it("uses the deliberately approved physical collection allowlist", () => {
    expect(MARKETPLACE_CATEGORIES.map((category) => category.handle)).toEqual([
      "maths-manipulatives",
      "literacy-books",
      "science-measurement",
      "art-craft-design",
      "homeschool-essentials",
      "learning-kits",
      "storage-organisation",
      "christian-faith",
    ]);
    expect(isApprovedMarketplaceCollectionHandle("christian-faith")).toBe(true);
    expect(isApprovedMarketplaceCollectionHandle("frontpage")).toBe(false);
    expect(isApprovedMarketplaceCollectionHandle("faith-based-resources")).toBe(false);
    expect(isMarketplaceProductEligible(productSummary)).toBe(true);
    expect(isMarketplaceProductEligible(excludedProductSummary)).toBe(false);
  });

  it("makes Bible Backpack - Caring eligible only through christian-faith membership", () => {
    const bibleBackpackCaring = {
      ...productSummary,
      handle: "bible-backpack-caring",
      title: "Bible Backpack - Caring",
      vendor: "gofindgod.com",
      collections: [christianFaithCollection],
    };
    expect(isMarketplaceProductEligible(bibleBackpackCaring)).toBe(true);
    expect(
      isMarketplaceProductEligible({
        ...bibleBackpackCaring,
        collections: [excludedCollection],
      }),
    ).toBe(false);
  });

  it("filters unapproved collections and products from home and collection listings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        const { query } = queryFrom(init);
        if (query.includes("query MarketplaceHome")) {
          return jsonResponse({
            collections: { nodes: [approvedCollection, excludedCollection] },
            products: { nodes: [rawProductSummary, rawExcludedProductSummary] },
          });
        }
        return jsonResponse({ collections: { nodes: [approvedCollection, excludedCollection] } });
      }),
    );
    expect((await getHome()).collections.map((item) => item.handle)).toEqual([
      "maths-manipulatives",
    ]);
    expect((await getHome()).products.map((item) => item.handle)).toEqual([
      "maths-counting-bears",
    ]);
    expect((await getCollections()).map((item) => item.handle)).toEqual([
      "maths-manipulatives",
    ]);
  });

  it("does not query an unapproved direct collection handle", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getCollection("frontpage")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns no product for an unapproved direct product handle", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ product: rawExcludedProduct })));
    await expect(getProduct("excluded-resource")).resolves.toBeNull();
  });

  it("rechecks every product returned inside an approved collection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          collectionByHandle: {
            ...approvedCollection,
            description: "Approved maths resources.",
            seo: { title: null, description: null },
            products: { nodes: [rawProductSummary, rawExcludedProductSummary] },
          },
        }),
      ),
    );
    const collection = await getCollection("maths-manipulatives");
    expect(collection?.products.map((item) => item.handle)).toEqual([
      "maths-counting-bears",
    ]);
  });
});

describe("Shopify connection and cart normalization", () => {
  it("normalizes product, collection, and cart connections", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        const { query } = queryFrom(init);
        if (query.includes("query MarketplaceProduct")) return jsonResponse({ product: rawProduct });
        if (query.includes("query MarketplaceCollection")) {
          return jsonResponse({
            collectionByHandle: {
              ...approvedCollection,
              description: "Approved maths resources.",
              seo: { title: null, description: null },
              products: { nodes: [rawProductSummary] },
            },
          });
        }
        if (query.includes("query MarketplaceCart")) return jsonResponse({ cart: rawCart });
        if (query.includes("mutation MarketplaceCreateCart")) {
          return jsonResponse({ cartCreate: { cart: rawCart, userErrors: [], warnings: [] } });
        }
        if (query.includes("mutation MarketplaceAddCartLines")) {
          return jsonResponse({ cartLinesAdd: { cart: rawCart, userErrors: [], warnings: [] } });
        }
        if (query.includes("mutation MarketplaceUpdateCartLines")) {
          return jsonResponse({ cartLinesUpdate: { cart: rawCart, userErrors: [], warnings: [] } });
        }
        return jsonResponse({ cartLinesRemove: { cart: rawCart, userErrors: [], warnings: [] } });
      }),
    );

    const product = await getProduct(productSummary.handle);
    expect(product?.images).toEqual([image]);
    expect(product?.variants).toEqual([variant]);
    expect(product?.collections).toEqual([approvedCollection]);
    expect((await getCollection("maths-manipulatives"))?.products).toEqual([productSummary]);

    const carts = [
      await getCart("cart-id"),
      await createCart(variant.id, 1),
      await addCartLine("cart-id", variant.id, 1),
      await updateCartLine("cart-id", cartLine.id, 1),
      await removeCartLine("cart-id", cartLine.id),
    ];
    for (const cart of carts) {
      expect(cart?.lines.map((line) => line.id)).toEqual([cartLine.id]);
      expect(cart?.lines[0].merchandise.product.collections).toEqual([approvedCollection]);
      expect(cart && isMarketplaceCartValid(cart)).toBe(true);
    }
  });

  it("normalizes malformed connection nodes to empty arrays and fails closed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          product: {
            ...rawProduct,
            images: { nodes: null },
            variants: { nodes: "not-an-array" },
            collections: { nodes: null },
          },
        }),
      ),
    );
    await expect(getProduct(productSummary.handle)).resolves.toBeNull();
  });

  it("creates carts with the configured buyer country", async () => {
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      const { variables } = queryFrom(init);
      expect((variables.input as Record<string, unknown>).buyerIdentity).toEqual({
        countryCode: "AU",
      });
      return jsonResponse({ cartCreate: { cart: rawCart, userErrors: [], warnings: [] } });
    });
    vi.stubGlobal("fetch", fetchMock);
    await createCart(variant.id, 1);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("updates a cart whose buyer country is absent or different", async () => {
    const requests: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        const { query } = queryFrom(init);
        requests.push(query);
        if (query.includes("query MarketplaceCart")) {
          return jsonResponse({ cart: { ...rawCart, buyerIdentity: { countryCode: "US" } } });
        }
        return jsonResponse({
          cartBuyerIdentityUpdate: { cart: rawCart, userErrors: [], warnings: [] },
        });
      }),
    );
    expect((await getCart("cart-id"))?.buyerIdentity?.countryCode).toBe("AU");
    expect(requests[1]).toContain("MarketplaceCartBuyerIdentityUpdate");
  });

  it("resolves variant eligibility and inventory from product collections", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          node: {
            id: variant.id,
            availableForSale: true,
            quantityAvailable: 4,
            product: { collections: { nodes: [approvedCollection] } },
          },
        }),
      ),
    );
    await expect(isMarketplaceVariantEligible(variant.id)).resolves.toBe(true);
    await expect(getMarketplaceVariantAvailability(variant.id)).resolves.toEqual({
      eligible: true,
      availableForSale: true,
      quantityAvailable: 4,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          node: {
            id: "excluded-variant",
            availableForSale: true,
            quantityAvailable: 10,
            product: { collections: { nodes: [excludedCollection] } },
          },
        }),
      ),
    );
    await expect(isMarketplaceVariantEligible("excluded-variant")).resolves.toBe(false);
  });

  it("rejects a cart containing any product outside the approved collections", () => {
    const eligibleCart = {
      ...rawCart,
      lines: [
        {
          ...cartLine,
          merchandise: {
            ...cartLine.merchandise,
            product: {
              ...cartLine.merchandise.product,
              collections: [approvedCollection],
            },
          },
        },
      ],
    };
    const ineligibleCart = {
      ...eligibleCart,
      lines: [
        {
          ...eligibleCart.lines[0],
          merchandise: {
            ...eligibleCart.lines[0].merchandise,
            product: {
              ...eligibleCart.lines[0].merchandise.product,
              collections: [excludedCollection],
            },
          },
        },
      ],
    };
    expect(isMarketplaceCartValid(eligibleCart)).toBe(true);
    expect(isMarketplaceCartValid(ineligibleCart)).toBe(false);
  });
});

afterEach(() => {
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN = original.domain;
  process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN = original.publicToken;
  process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN = original.privateToken;
  process.env.SHOPIFY_STOREFRONT_API_VERSION = original.version;
  process.env.SHOPIFY_COUNTRY = original.country;
});
