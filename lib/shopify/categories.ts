import type { ShopifyProductSummary } from "./types";

export const MARKETPLACE_CATEGORIES = [
  { handle: "maths-manipulatives", title: "Maths Manipulatives" },
  { handle: "literacy-books", title: "Literacy & Books" },
  { handle: "science-measurement", title: "Science & Measurement" },
  { handle: "art-craft-design", title: "Art, Craft & Design" },
  { handle: "homeschool-essentials", title: "Homeschool Essentials" },
  { handle: "learning-kits", title: "Learning Kits" },
  { handle: "storage-organisation", title: "Storage & Organisation" },
  { handle: "christian-faith", title: "Christian Faith" },
] as const;

const MARKETPLACE_CATEGORY_HANDLES = new Set<string>(
  MARKETPLACE_CATEGORIES.map((category) => category.handle),
);

export function isApprovedMarketplaceCollectionHandle(handle: string) {
  return MARKETPLACE_CATEGORY_HANDLES.has(handle);
}

export function isMarketplaceProductEligible(
  product: Pick<ShopifyProductSummary, "collections">,
) {
  return product.collections.some((collection) =>
    isApprovedMarketplaceCollectionHandle(collection.handle),
  );
}

export function configuredMarketplaceCategory(handle: string) {
  return MARKETPLACE_CATEGORIES.find((category) => category.handle === handle) ?? null;
}
