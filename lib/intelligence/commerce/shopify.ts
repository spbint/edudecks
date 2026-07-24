import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";
import type { CommerceFulfilmentType, CommerceProduct, CommerceProvider } from "@/lib/intelligence/commerce/types";

export class ShopifyProviderError extends Error {
  readonly code: "not_configured" | "timeout" | "request_failed" | "invalid_response";

  constructor(code: ShopifyProviderError["code"], message: string) {
    super(message);
    this.name = "ShopifyProviderError";
    this.code = code;
  }
}

interface ShopifyVariantNode {
  id?: unknown;
  title?: unknown;
  availableForSale?: unknown;
  price?: { amount?: unknown; currencyCode?: unknown };
}

interface ShopifyProductNode {
  id?: unknown;
  handle?: unknown;
  title?: unknown;
  description?: unknown;
  tags?: unknown;
  onlineStoreUrl?: unknown;
  featuredImage?: { url?: unknown } | null;
  variants?: { nodes?: unknown };
  priceRange?: { minVariantPrice?: { amount?: unknown; currencyCode?: unknown } };
}

interface ShopifyGraphqlResponse {
  data?: { products?: { nodes?: unknown } };
  errors?: unknown;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : [];
}

function tagValue(tags: string[], prefixes: string[]) {
  const tag = tags.find((item) => prefixes.some((prefix) => item.toLowerCase().startsWith(prefix)));
  if (!tag) return null;
  const separator = tag.indexOf(":");
  return separator >= 0 ? tag.slice(separator + 1).trim() : tag;
}

function prefixedValues(tags: string[], prefixes: string[]) {
  return tags
    .filter((item) => prefixes.some((prefix) => item.toLowerCase().startsWith(prefix)))
    .map((item) => { const separator = Math.max(item.indexOf(":"), item.indexOf("=")); return item.slice(separator + 1).trim(); })
    .filter(Boolean);
}

function fulfilmentFromTags(tags: string[]): CommerceFulfilmentType {
  const value = tagValue(tags, ["fulfilment:", "fulfillment:"]);
  if (value === "mylearna_owned_stock") return value;
  if (value === "dropship_supplier") return value;
  if (value === "future_affiliate_placeholder") return value;
  return "third_party_shopify_seller";
}

function disclosureFor(fulfilment: CommerceFulfilmentType) {
  const fulfilmentDisclosure = fulfilment === "dropship_supplier"
    ? " Dropship supplier fulfilment may apply."
    : fulfilment === "third_party_shopify_seller"
      ? " Third-party Shopify seller fulfilment may apply."
      : "";
  return `MyLearna may earn revenue from purchases.${fulfilmentDisclosure} Price and availability may change.`;
}

function numeric(value: unknown, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function regionStatus(tags: string[], region: string) {
  const taggedRegions = prefixedValues(tags, ["region:", "regions:"]).map((item) => item.toUpperCase());
  if (!taggedRegions.length || taggedRegions.includes("GLOBAL") || taggedRegions.includes("ALL")) return "available" as const;
  return taggedRegions.includes(region.toUpperCase()) ? "available" as const : "region_ineligible" as const;
}

function stockStatus(variant: ShopifyVariantNode | null) {
  if (!variant || typeof variant.availableForSale !== "boolean") return "unknown" as const;
  return variant.availableForSale ? "in_stock" as const : "out_of_stock" as const;
}

function resourceKeysFromTags(tags: string[]) {
  return prefixedValues(tags, ["resource:", "resource-key:", "resource_key:", "resource-key="])
    .map(normaliseResourceKey)
    .filter(Boolean);
}

function chooseVariant(node: ShopifyProductNode) {
  const raw = node.variants && typeof node.variants === "object" ? node.variants.nodes : [];
  const variants = (Array.isArray(raw) ? raw : []) as ShopifyVariantNode[];
  const available = variants.filter((variant) => variant.availableForSale !== false);
  const candidates = available.length ? available : variants;
  return [...candidates].sort((left, right) => numeric(left.price?.amount) - numeric(right.price?.amount))[0] ?? null;
}

export function normalizeShopifyProduct(node: ShopifyProductNode, region: string, now = new Date()): CommerceProduct | null {
  const providerProductId = stringValue(node.id);
  const title = stringValue(node.title);
  if (!providerProductId || !title) return null;
  const tags = stringList(node.tags);
  const variant = chooseVariant(node);
  const price = variant?.price ?? node.priceRange?.minVariantPrice;
  const availability = variant && variant.availableForSale === false ? "unavailable" : regionStatus(tags, region);
  const domain = stringValue(process.env.SHOPIFY_STORE_DOMAIN).replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const handle = stringValue(node.handle);
  const productUrl = stringValue(node.onlineStoreUrl) || (domain && handle ? `https://${domain}/products/${encodeURIComponent(handle)}` : "");
  if (!productUrl) return null;
  const fulfilmentType = fulfilmentFromTags(tags);
  return {
    provider: "shopify",
    providerProductId,
    providerVariantId: stringValue(variant?.id) || providerProductId,
    title,
    summary: stringValue(node.description),
    productUrl,
    imageUrl: stringValue(node.featuredImage?.url) || null,
    price: { amount: numeric(price?.amount), currency: stringValue(price?.currencyCode) || "AUD" },
    availability,
    stockStatus: stockStatus(variant),
    region: region.toUpperCase(),
    fulfilmentType,
    resourceKeys: resourceKeysFromTags(tags),
    tags,
    educationalCategory: tagValue(tags, ["educational-category:", "education-category:", "category:"]),
    priceBand: tagValue(tags, ["price-band:", "price_band:"]),
    ageStages: prefixedValues(tags, ["age:", "stage:", "age-stage:"]),
    subjects: prefixedValues(tags, ["subject:", "concept:"]),
    lastSyncedAt: now.toISOString(),
    disclosure: disclosureFor(fulfilmentType),
  };
}

const PRODUCTS_QUERY = `#graphql
  query Products($query: String!, $first: Int!, $country: CountryCode)
  @inContext(country: $country) {
    products(first: $first, query: $query) {
      nodes {
        id
        handle
        title
        description
        tags
        onlineStoreUrl
        featuredImage { url }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 20) {
          nodes { id title availableForSale price { amount currencyCode } }
        }
      }
    }
  }
`;

function shopifyConfig() {
  const domain = stringValue(process.env.SHOPIFY_STORE_DOMAIN).replace(/^https?:\/\//i, "").replace(/\/$/, "");
  const token = stringValue(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
  if (!domain || !token) throw new ShopifyProviderError("not_configured", "Shopify commerce is not configured.");
  return {
    endpoint: `https://${domain}/api/${stringValue(process.env.SHOPIFY_STOREFRONT_API_VERSION) || "2026-04"}/graphql.json`,
    token,
    timeoutMs: Math.min(Math.max(Number(process.env.SHOPIFY_REQUEST_TIMEOUT_MS) || 8000, 1000), 20000),
    maxProducts: Math.min(Math.max(Number(process.env.SHOPIFY_MAX_PRODUCTS_PER_RESOURCE) || 12, 1), 24),
  };
}

export function createShopifyStorefrontProvider(fetcher: typeof fetch = fetch): CommerceProvider {
  return {
    provider: "shopify",
    async getProductsForResources(resources, context) {
      const config = shopifyConfig();
      const unique = new Map<string, CommerceProduct>();
      for (const resource of resources) {
        const query = normaliseResourceKey(resource.resource.name) || resource.resource.resourceKey;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
        let response: Response;
        try {
          response = await fetcher(config.endpoint, {
            method: "POST",
            headers: { "content-type": "application/json", "X-Shopify-Storefront-Access-Token": config.token },
            body: JSON.stringify({ query: PRODUCTS_QUERY, variables: { query, first: config.maxProducts, country: context.region.toUpperCase() } }),
            signal: controller.signal,
          });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") throw new ShopifyProviderError("timeout", "Shopify catalogue request timed out.");
          throw new ShopifyProviderError("request_failed", "Shopify catalogue is temporarily unavailable.");
        } finally {
          clearTimeout(timeout);
        }
        if (!response.ok) throw new ShopifyProviderError("request_failed", `Shopify catalogue returned HTTP ${response.status}.`);
        let payload: ShopifyGraphqlResponse;
        try { payload = await response.json() as ShopifyGraphqlResponse; } catch { throw new ShopifyProviderError("invalid_response", "Shopify returned an invalid catalogue response."); }
        if (payload.errors) throw new ShopifyProviderError("request_failed", "Shopify catalogue rejected the request.");
        const nodes = payload.data?.products?.nodes;
        for (const node of Array.isArray(nodes) ? nodes : []) {
          const product = normalizeShopifyProduct(node as ShopifyProductNode, context.region, (context.now ?? (() => new Date()))());
          if (product) unique.set(`${product.providerProductId}:${product.providerVariantId}`, product);
        }
      }
      return [...unique.values()];
    },
  };
}
