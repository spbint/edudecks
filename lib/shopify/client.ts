import { ShopifyError } from "./errors";
import type { ShopifyCart, ShopifyCollection, ShopifyCollectionSummary, ShopifyProduct, ShopifyProductSummary, ShopifyUserError } from "./types";
import { CART_QUERY, COLLECTIONS_QUERY, COLLECTION_QUERY, HOME_QUERY, PRODUCT_QUERY } from "./queries";
import { ADD_CART_LINES_MUTATION, CREATE_CART_MUTATION, REMOVE_CART_LINES_MUTATION, UPDATE_CART_LINES_MUTATION } from "./mutations";

type GraphqlResponse<T> = { data?: T; errors?: Array<{ message?: unknown }> };
type RequestOptions = { cache?: "no-store" | "force-cache"; revalidate?: number };

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

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
  const data = await request<{ collections: { nodes: ShopifyCollectionSummary[] }; products: { nodes: ShopifyProductSummary[] } }>(HOME_QUERY, { collectionFirst: 8, productFirst: 12, country: text(process.env.SHOPIFY_COUNTRY) || undefined }, { revalidate: 300 });
  return { collections: data.collections.nodes, products: data.products.nodes };
}

export async function getCollections() {
  const data = await request<{ collections: { nodes: ShopifyCollectionSummary[] } }>(COLLECTIONS_QUERY, { first: 50 }, { revalidate: 300 });
  return data.collections.nodes;
}

export async function getCollection(handle: string) {
  const data = await request<{ collectionByHandle: ShopifyCollection | null }>(COLLECTION_QUERY, { handle, first: 100 }, { revalidate: 120 });
  return data.collectionByHandle;
}

export async function getProduct(handle: string) {
  const data = await request<{ product: ShopifyProduct | null }>(PRODUCT_QUERY, { handle }, { revalidate: 120 });
  return data.product;
}

export async function getCart(id: string, options: RequestOptions = { cache: "no-store" }) {
  const data = await request<{ cart: ShopifyCart | null }>(CART_QUERY, { id }, options);
  return data.cart;
}

export async function createCart(variantId?: string, quantity = 1) {
  const data = await request<{ cartCreate: { cart: ShopifyCart | null; userErrors: ShopifyUserError[] } }>(CREATE_CART_MUTATION, { input: variantId ? { lines: [{ merchandiseId: variantId, quantity }] } : {} }, { cache: "no-store" });
  userErrors(data.cartCreate.userErrors);
  if (!data.cartCreate.cart) throw new ShopifyError("invalid_response", "Shopify did not return a cart.");
  return data.cartCreate.cart;
}

export async function addCartLine(cartId: string, variantId: string, quantity: number) {
  const data = await request<{ cartLinesAdd: { cart: ShopifyCart | null; userErrors: ShopifyUserError[] } }>(ADD_CART_LINES_MUTATION, { cartId, lines: [{ merchandiseId: variantId, quantity }] }, { cache: "no-store" });
  userErrors(data.cartLinesAdd.userErrors);
  if (!data.cartLinesAdd.cart) throw new ShopifyError("not_found", "That Shopify cart is no longer available.");
  return data.cartLinesAdd.cart;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number) {
  const data = await request<{ cartLinesUpdate: { cart: ShopifyCart | null; userErrors: ShopifyUserError[] } }>(UPDATE_CART_LINES_MUTATION, { cartId, lines: [{ id: lineId, quantity }] }, { cache: "no-store" });
  userErrors(data.cartLinesUpdate.userErrors);
  if (!data.cartLinesUpdate.cart) throw new ShopifyError("not_found", "That Shopify cart is no longer available.");
  return data.cartLinesUpdate.cart;
}

export async function removeCartLine(cartId: string, lineId: string) {
  const data = await request<{ cartLinesRemove: { cart: ShopifyCart | null; userErrors: ShopifyUserError[] } }>(REMOVE_CART_LINES_MUTATION, { cartId, lineIds: [lineId] }, { cache: "no-store" });
  userErrors(data.cartLinesRemove.userErrors);
  if (!data.cartLinesRemove.cart) throw new ShopifyError("not_found", "That Shopify cart is no longer available.");
  return data.cartLinesRemove.cart;
}

export { config as shopifyConfigForTest, request as shopifyRequestForTest };
