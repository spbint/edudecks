"use client";

import Link from "next/link";
import { useState } from "react";
import { useMarketplaceCart } from "./MarketplaceCartProvider";
import { MARKETPLACE_CATEGORIES } from "@/lib/shopify/categories";

export default function MarketplaceHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart } = useMarketplaceCart();
  return <header className="marketplace-header">
    <div className="marketplace-header-inner">
      <Link className="marketplace-brand" href="/marketplace" aria-label="MyLearna Marketplace home"><span className="marketplace-brand-mark" aria-hidden="true">ML</span><span className="marketplace-brand-copy"><strong>MyLearna</strong><span>Marketplace</span></span></Link>
      <nav className="marketplace-nav" aria-label="Marketplace categories">
        <Link href="/marketplace/collections">Shop all</Link>
        <details className="marketplace-category-menu"><summary>Browse categories</summary><div className="marketplace-category-menu-panel">{MARKETPLACE_CATEGORIES.map((category) => <Link key={category.handle} href={`/marketplace/collections/${category.handle}`}>{category.title}</Link>)}</div></details>
      </nav>
      <div className="marketplace-header-actions">
        <Link className="marketplace-header-link marketplace-header-link-primary" href="/">Open MyLearna</Link>
        <Link className="marketplace-cart-link" href="/marketplace/cart" aria-label={`Cart with ${cart?.totalQuantity ?? 0} items`}><span aria-hidden="true">Cart</span><span className="marketplace-cart-count">{cart?.totalQuantity ?? 0}</span></Link>
        <button className="marketplace-menu-button" type="button" aria-expanded={menuOpen} aria-controls="marketplace-mobile-nav" onClick={() => setMenuOpen((open) => !open)}>Menu</button>
      </div>
    </div>
    {menuOpen ? <nav id="marketplace-mobile-nav" className="marketplace-mobile-nav" aria-label="Mobile Marketplace navigation">
      <Link href="/marketplace/collections" onClick={() => setMenuOpen(false)}>Shop all</Link>
      <span className="marketplace-mobile-nav-heading">Browse categories</span>
      {MARKETPLACE_CATEGORIES.map((category) => <Link key={category.handle} href={`/marketplace/collections/${category.handle}`} onClick={() => setMenuOpen(false)}>{category.title}</Link>)}
      <Link href="/" onClick={() => setMenuOpen(false)}>Open MyLearna</Link>
    </nav> : null}
  </header>;
}
