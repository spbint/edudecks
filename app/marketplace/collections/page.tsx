import type { Metadata } from "next";
import Link from "next/link";
import { getCollections } from "@/lib/shopify/client";
import { ShopifyError, safeShopifyMessage } from "@/lib/shopify/errors";

export const metadata: Metadata = { title: "Collections", description: "Browse MyLearna Marketplace collections." };
export const revalidate = 300;

export default async function CollectionsPage() {
  let collections: Awaited<ReturnType<typeof getCollections>> = [];
  let failure: unknown = null;
  try {
    collections = await getCollections();
  } catch (error) { failure = error; }
  if (failure) return <main className="marketplace-main"><div className="marketplace-page-heading"><div className="marketplace-eyebrow">Browse</div><h1>Collections</h1></div><div className="marketplace-state" role="alert">{failure instanceof ShopifyError ? safeShopifyMessage(failure) : "We could not load collections right now."}</div></main>;
  return <main className="marketplace-main"><div className="marketplace-page-heading"><div className="marketplace-eyebrow">Browse</div><h1>Collections</h1><p>Find practical resources for family learning, teaching and discovery.</p></div>{collections.length ? <div className="marketplace-collection-grid">{collections.map((collection) => <Link className="marketplace-collection-card" key={collection.id} href={`/marketplace/collections/${encodeURIComponent(collection.handle)}`}>{collection.image ? <img src={collection.image.url} alt="" /> : null}<span>{collection.title}</span></Link>)}</div> : <div className="marketplace-state">No collections are available yet.</div>}</main>;
}
