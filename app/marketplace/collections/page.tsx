import type { Metadata } from "next";
import Link from "next/link";
import { getCollections } from "@/lib/shopify/client";
import { ShopifyError, safeShopifyMessage } from "@/lib/shopify/errors";
import { MARKETPLACE_CATEGORIES } from "@/lib/shopify/categories";

export const metadata: Metadata = { title: "Collections", description: "Browse MyLearna Marketplace collections." };
export const revalidate = 300;

export default async function CollectionsPage() {
  let collections: Awaited<ReturnType<typeof getCollections>> = [];
  let failure: unknown = null;
  try {
    collections = await getCollections();
  } catch (error) { failure = error; }
  if (failure) return <main className="marketplace-main"><div className="marketplace-page-heading"><div className="marketplace-eyebrow">Browse</div><h1>Collections</h1></div><div className="marketplace-state" role="alert">{failure instanceof ShopifyError ? safeShopifyMessage(failure) : "We could not load collections right now."}</div></main>;
  const liveCollections = new Map(collections.map((collection) => [collection.handle, collection]));
  return <main className="marketplace-main"><div className="marketplace-page-heading"><div className="marketplace-eyebrow">Browse</div><h1>Collections</h1><p>Find practical resources for family learning, teaching and discovery.</p></div><div className="marketplace-collection-grid">{MARKETPLACE_CATEGORIES.map((category) => { const collection = liveCollections.get(category.handle); return <Link className="marketplace-collection-card" key={category.handle} href={`/marketplace/collections/${category.handle}`}>{collection?.image ? <img src={collection.image.url} alt="" /> : null}<span>{category.title}</span></Link>; })}</div></main>;
}
