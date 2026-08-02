import type { Metadata } from "next";
import Link from "next/link";
import { getHome } from "@/lib/shopify/client";
import { ShopifyError } from "@/lib/shopify/errors";
import { MARKETPLACE_CATEGORIES } from "@/lib/shopify/categories";
import MarketplaceProductCard from "./MarketplaceProductCard";

export const metadata: Metadata = { title: "Affordable resources for meaningful learning", description: "Educational supplies, practical learning kits and structured programs for families and educators." };
export const revalidate = 300;

export default async function MarketplaceHomePage() {
  let home: Awaited<ReturnType<typeof getHome>> | null = null;
  let unavailable = false;
  try { home = await getHome(); } catch (error) { unavailable = error instanceof ShopifyError; }
  const liveCollections = new Map(home?.collections.map((collection) => [collection.handle, collection]) ?? []);
  return <main className="marketplace-main">
    <section className="marketplace-hero" aria-labelledby="marketplace-heading">
      <div className="marketplace-hero-copy"><div className="marketplace-eyebrow">MyLearna Marketplace</div><h1 id="marketplace-heading">Affordable resources. Meaningful learning.</h1><p>Educational supplies, practical learning kits and structured programs for families and educators.</p><div className="marketplace-hero-actions"><Link className="marketplace-button" href="/marketplace/collections">Explore the collection</Link></div></div>
      <div className="marketplace-hero-art" aria-hidden="true"><div className="marketplace-hero-art-card"><strong>Made for curious families.</strong><span>Resources that help learning happen in everyday life.</span></div></div>
    </section>
    {unavailable ? <section className="marketplace-state" role="alert"><strong>The Marketplace is temporarily unavailable.</strong><p>Please try again shortly.</p></section> : null}
    <section className="marketplace-section" aria-labelledby="collections-heading"><div className="marketplace-section-heading"><div><h2 id="collections-heading">Shop by collection</h2><p>Choose a starting point for your next learning moment.</p></div><Link className="marketplace-link" href="/marketplace/collections">View all</Link></div>
      <div className="marketplace-collection-grid">{MARKETPLACE_CATEGORIES.map((category) => { const collection = liveCollections.get(category.handle); return <Link className="marketplace-collection-card" key={category.handle} href={`/marketplace/collections/${category.handle}`}>{collection?.image ? <img src={collection.image.url} alt="" /> : null}<span>{category.title}</span></Link>; })}</div>
    </section>
    <section className="marketplace-section" aria-labelledby="products-heading"><div className="marketplace-section-heading"><div><h2 id="products-heading">New learning resources</h2><p>Physical resources selected for practical learning.</p></div></div>
      {home?.products.length ? <div className="marketplace-product-grid">{home.products.map((product) => <MarketplaceProductCard key={product.id} product={product} />)}</div> : home ? <div className="marketplace-state">Physical learning resources are being added to the Marketplace.</div> : null}
    </section>
  </main>;
}
