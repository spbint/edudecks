import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection } from "@/lib/shopify/client";
import MarketplaceProductCard from "../../MarketplaceProductCard";
import { configuredMarketplaceCategory } from "@/lib/shopify/categories";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  try { const collection = await getCollection((await params).handle); return collection ? { title: collection.seo.title || collection.title, description: collection.seo.description || collection.description || undefined } : { title: "Collection not found" }; } catch { return { title: "Collection" }; }
}

export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const handle = (await params).handle;
  let collection: Awaited<ReturnType<typeof getCollection>> = null;
  try {
    collection = await getCollection(handle);
  } catch { return <main className="marketplace-main"><div className="marketplace-state" role="alert">We could not load this collection right now.</div></main>; }
  if (!collection) {
    const configured = configuredMarketplaceCategory(handle);
    if (!configured) notFound();
    return <main className="marketplace-main"><div className="marketplace-page-heading"><Link className="marketplace-link" href="/marketplace/collections">All collections</Link><h1>{configured.title}</h1><p>This category is ready for Marketplace products as they are published.</p></div><div className="marketplace-state">No products are available in this category yet.</div></main>;
  }
  const configured = configuredMarketplaceCategory(handle);
  return <main className="marketplace-main"><div className="marketplace-page-heading"><Link className="marketplace-link" href="/marketplace/collections">All collections</Link><h1>{configured?.title ?? "Marketplace collection"}</h1>{collection.description ? <p>{collection.description}</p> : null}</div>{collection.products.length ? <div className="marketplace-product-grid">{collection.products.map((product) => <MarketplaceProductCard key={product.id} product={product} />)}</div> : <div className="marketplace-state">This collection is empty right now.</div>}</main>;
}
