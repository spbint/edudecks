import { ShopifyError } from "./errors";
import type { ShopifyCart, ShopifyCartLine, ShopifyCollection, ShopifyCollectionSummary, ShopifyImage, ShopifyProduct, ShopifyProductSummary, ShopifyProductVariant, ShopifyUserError } from "./types";
import { isApprovedMarketplaceCollectionHandle, isMarketplaceProductEligible } from "./categories";
import { CART_QUERY, COLLECTIONS_QUERY, COLLECTION_QUERY, HOME_QUERY, PRODUCT_QUERY, VARIANT_QUERY } from "./queries";
import { ADD_CART_LINES_MUTATION, CREATE_CART_MUTATION, REMOVE_CART_LINES_MUTATION, UPDATE_CART_LINES_MUTATION } from "./mutations";

type GraphqlResponse<T> = { data?: T; errors?: Array<{ message?: unknown }> };
type RequestOptions = { cache?: "no-store" | "force-cache"; revalidate?: number };
type ShopifyConnection<T> = { nodes?: T[] | null } | null | undefined;
type RawShopifyProductSummary = Omit<ShopifyProductSummary, "collections"> & {
  collections?: ShopifyConnection<ShopifyCollectionSummary>;
};
type RawShopifyProduct = Omit<ShopifyProduct, "images" | "variants" | "collections"> & {
  images?: ShopifyConnection<ShopifyImage>;
  variants?: ShopifyConnection<ShopifyProductVariant>;
  collections?: ShopifyConnection<ShopifyCollectionSummary>;
};
type RawShopifyCollection = Omit<ShopifyCollection, "products"> & {
  products?: ShopifyConnection<RawShopifyProductSummary>;
};
type RawShopifyCartLine = Omit<ShopifyCartLine, "merchandise"> & {
  merchandise: Omit<ShopifyCartLine["merchandise"], "product"> & {
    product: Omit<ShopifyCartLine["merchandise"]["product"], "collections"> & {
      collections?: ShopifyConnection<ShopifyCollectionSummary>;
    };
  };
};
type RawShopifyCart = Omit<ShopifyCart, "lines"> & {
  lines?: ShopifyConnection<RawShopifyCartLine>;
};

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

function connectionNodes<T>(connection: ShopifyConnection<T> | unknown): T[] {
  const nodes = connection && typeof connection === "object" && "nodes" in connection
    ? (connection as { nodes?: unknown }).nodes
    : null;
  return Array.isArray(nodes) ? nodes as T[] : [];
}

function normalizeProduct(product: RawShopifyProduct | null | undefined): ShopifyProduct | null {
  if (!product) return null;
  return {
    ...product,
    images: connectionNodes<ShopifyImage>(product.images),
    variants: connectionNodes<ShopifyProductVariant>(product.variants),
    collections: connectionNodes<ShopifyCollectionSummary>(product.collections),
  };
}

function normalizeProductSummary(product: RawShopifyProductSummary): ShopifyProductSummary {
  return { ...product, collections: connectionNodes<ShopifyCollectionSummary>(product.collections) };
}

function normalizeCollection(collection: RawShopifyCollection | null | undefined): ShopifyCollection | null {
  if (!collection) return null;
  return { ...collection, products: connectionNodes<RawShopifyProductSummary>(collection.products).map(normalizeProductSummary) };
}

function normalizeCart(cart: RawShopifyCart | null | undefined): ShopifyCart | null {
  if (!cart) return null;
  return {
    ...cart,
    lines: connectionNodes<RawShopifyCartLine>(cart.lines).map((line) => ({
      ...line,
      merchandise: {
        ...line.merchandise,
        product: {
          ...line.merchandise.product,
          collections: connectionNodes<ShopifyCollectionSummary>(line.merchandise.product.collections),
        },
      },
    })),
  };
}

export function isMarketplaceCartValid(cart: ShopifyCart) {
  return cart.lines.every((line) => isMarketplaceProductEligible({ collections: line.merchandise.product.collections }));
}

function config() {
  const domain = text(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN).replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const apiVersion = text(process.env.SHOPIFY_STOREFRONT_API_VERSION) || "2026-04";
  const publicToken = text(process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN);
  const privateToken = text(process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN);
  if (!domain || (!publicToken && !privateToken)) throw new ShopifyError("not_configured", "Shopify Marketplace configuration is incomplete.");
  return {
    endpoint: `https://${domain}/api/${apiVersion}/graphql.json`,
    token: publicToken || privateToken,
    header: publicToken ? "X-Shopify-Storefront-Access-Token" : "Shopify-Storefront-Private-Token",
    timeoutMs: Math.min(Math.max(Number(process.env.SHOPIFY_REQUEST_TIMEOUT_MS) || 8000, 1000), 20000),
  };
}

async function request<T>(query: string, variables: Record<string, unknown>, options: RequestOptions = {}) {
  const shopify = config();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), shopify.timeoutMs);
  let response: Response;
  try {
    response = await fetch(shopify.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", [shopify.header]: shopify.token },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      cache: options.cache ?? "force-cache",
      ...(options.revalidate ? { next: { revalidate: options.revalidate } } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new ShopifyError("network", "Shopify Marketplace timed out.");
    throw new ShopifyError("network", "Shopify Marketplace could not be reached.");
  } finally { clearTimeout(timer); }
  if (!response.ok) throw new ShopifyError("network", "Shopify Marketplace returned an unavailable response.", response.status);
  let payload: GraphqlResponse<T>;
  try { payload = await response.json() as GraphqlResponse<T>; } catch { throw new ShopifyError("invalid_response", "Shopify Marketplace returned an invalid response."); }
  if (payload.errors?.length) throw new ShopifyError("graphql", "Shopify Marketplace rejected the request.");
  if (!payload.data) throw new ShopifyError("invalid_response", "Shopify Marketplace returned incomplete data.");
  return payload.data;
}

function userErrors(errors: ShopifyUserError[] | undefined) {
  if (errors?.length) throw new ShopifyError("user_error", "Shopify could not complete that cart request.");
}

export async function getHome() {
  const data = await request<{ collections: ShopifyConnection<ShopifyCollectionSummary>; products: ShopifyConnection<RawShopifyProductSummary> }>(HOME_QUERY, { collectionFirst: 8, productFirst: 12, country: text(process.env.SHOPIFY_COUNTRY) || undefined }, { revalidate: 300 });
  return {
    collections: connectionNodes<ShopifyCollectionSummary>(data.collections).filter((collection) => isApprovedMarketplaceCollectionHandle(collection.handle)),
    products: connectionNodes<RawShopifyProductSummary>(data.products).map(normalizeProductSummary).filter(isMarketplaceProductEligible),
  };
}

export async function getCollections() {
  const data = await request<{ collections: ShopifyConnection<ShopifyCollectionSummary> }>(COLLECTIONS_QUERY, { first: 50 }, { revalidate: 300 });
  return connectionNodes<ShopifyCollectionSummary>(data.collections).filter((collection) => isApprovedMarketplaceCollectionHandle(collection.handle));
}

export async function getCollection(handle: string) {
  if (!isApprovedMarketplaceCollectionHandle(handle)) return null;
  const data = await request<{ collectionByHandle: RawShopifyCollection | null }>(COLLECTION_QUERY, { handle, first: 100 }, { revalidate: 120 });
  return normalizeCollection(data.collectionByHandle);
}

export async function getProduct(handle: string) {
  const data = await request<{ product: RawShopifyProduct | null }>(PRODUCT_QUERY, { handle }, { revalidate: 120 });
  const product = normalizeProduct(data.product);
  return product && isMarketplaceProductEligible(product) ? product : null;
}

export async function isMarketplaceVariantEligible(variantId: string) {
  const data = await request<{ node: { id: string; product: { collections?: ShopifyConnection<ShopifyCollectionSummary> } | null } | null }>(VARIANT_QUERY, { id: variantId }, { cache: "no-store" });
  const product = data.node?.product;
  return Boolean(product && isMarketplaceProductEligible({ collections: connectionNodes<ShopifyCollectionSummary>(product.collections) }));
}

export async function getCart(id: string, options: RequestOptions = { cache: "no-store" }) {
  const data = await request<{ cart: RawShopifyCart | null }>(CART_QUERY, { id }, options);
  return normalizeCart(data.cart);
}

export async function createCart(variantId?: string, quantity = 1) {
  const data = await request<{ cartCreate: { cart: RawShopifyCart | null; userErrors: ShopifyUserError[] } }>(CREATE_CART_MUTATION, { input: variantId ? { lines: [{ merchandiseId: variantId, quantity }] } : {} }, { cache: "no-store" });
  userErrors(data.cartCreate.userErrors);
  const cart = normalizeCart(data.cartCreate.cart);
  if (!cart) throw new ShopifyError("invalid_response", "Shopify did not return a cart.");
  return cart;
}

export async function addCartLine(cartId: string, variantId: string, quantity: number) {
  const data = await request<{ cartLinesAdd: { cart: RawShopifyCart | null; userErrors: ShopifyUserError[] } }>(ADD_CART_LINES_MUTATION, { cartId, lines: [{ merchandiseId: variantId, quantity }] }, { cache: "no-store" });
  userErrors(data.cartLinesAdd.userErrors);
  const cart = normalizeCart(data.cartLinesAdd.cart);
  if (!cart) throw new ShopifyError("not_found", "That Shopify cart is no longer available.");
  return cart;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number) {
  const data = await request<{ cartLinesUpdate: { cart: RawShopifyCart | null; userErrors: ShopifyUserError[] } }>(UPDATE_CART_LINES_MUTATION, { cartId, lines: [{ id: lineId, quantity }] }, { cache: "no-store" });
  userErrors(data.cartLinesUpdate.userErrors);
  const cart = normalizeCart(data.cartLinesUpdate.cart);
  if (!cart) throw new ShopifyError("not_found", "That Shopify cart is no longer available.");
  return cart;
}

export async function removeCartLine(cartId: string, lineId: string) {
  const data = await request<{ cartLinesRemove: { cart: RawShopifyCart | null; userErrors: ShopifyUserError[] } }>(REMOVE_CART_LINES_MUTATION, { cartId, lineIds: [lineId] }, { cache: "no-store" });
  userErrors(data.cartLinesRemove.userErrors);
  const cart = normalizeCart(data.cartLinesRemove.cart);
  if (!cart) throw new ShopifyError("not_found", "That Shopify cart is no longer available.");
  return cart;
}

export { config as shopifyConfigForTest, request as shopifyRequestForTest };
