"use client";

import Link from "next/link";
import { formatShopifyMoney } from "@/lib/shopify/money";
import { useMarketplaceCart } from "../MarketplaceCartProvider";

export default function CartView() {
  const { cart, loading, error, updateLine, removeLine, refresh } = useMarketplaceCart();
  if (loading) return <div className="marketplace-state" role="status">Loading your cart…</div>;
  if (error && !cart) return <div className="marketplace-state" role="alert"><strong>We could not load your cart.</strong><p>{error}</p><button className="marketplace-button secondary" type="button" onClick={() => void refresh()}>Try again</button></div>;
  if (!cart || !cart.lines.length) return <div className="marketplace-state"><strong>Your cart is empty.</strong><p>Explore the Marketplace and add a resource when you find one that fits.</p><Link className="marketplace-button" href="/marketplace/collections">Browse collections</Link></div>;
  return <div className="marketplace-cart"><div aria-live="polite">{error ? <p role="alert">{error}</p> : null}</div>{cart.lines.map((line) => <div className="marketplace-cart-line" key={line.id}>{line.merchandise.product.featuredImage ? <img src={line.merchandise.product.featuredImage.url} alt={line.merchandise.product.featuredImage.altText || line.merchandise.product.title} /> : <span />}<div><Link className="marketplace-link" href={`/marketplace/products/${encodeURIComponent(line.merchandise.product.handle)}`}>{line.merchandise.product.title}</Link><p style={{ margin: "5px 0", color: "#66708c" }}>{formatShopifyMoney(line.cost.amountPerQuantity)}</p><label className="marketplace-label" htmlFor={`quantity-${line.id}`}>Quantity<input id={`quantity-${line.id}`} className="marketplace-input" type="number" min={1} max={20} value={line.quantity} onChange={(event) => void updateLine(line.id, Math.min(20, Math.max(1, Number(event.target.value) || 1)))} /></label></div><button className="marketplace-button secondary" type="button" onClick={() => void removeLine(line.id)}>Remove</button></div>)}<div className="marketplace-cart-summary"><div><div>Subtotal</div><strong>{formatShopifyMoney(cart.cost.subtotalAmount)}</strong></div>{cart.checkoutUrl ? <a className="marketplace-button" href={cart.checkoutUrl} target="_blank" rel="noreferrer noopener">Continue to secure checkout</a> : <span>Checkout is temporarily unavailable.</span>}</div></div>;
}
