import Link from "next/link";

export default function MarketplaceNotFound() { return <main className="marketplace-main"><div className="marketplace-state"><strong>That Marketplace page is not available.</strong><p>It may have moved or is not published yet.</p><Link className="marketplace-button" href="/marketplace/collections">Browse collections</Link></div></main>; }

