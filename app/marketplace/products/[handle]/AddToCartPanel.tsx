"use client";

import { FormEvent, useState } from "react";
import { formatShopifyMoney } from "@/lib/shopify/money";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { useMarketplaceCart } from "../../MarketplaceCartProvider";

export default function AddToCartPanel({ product }: { product: ShopifyProduct }) {
  const available = product.variants.filter((variant) => variant.availableForSale);
  const [variantId, setVariantId] = useState(available[0]?.id ?? product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { addLine } = useMarketplaceCart();
  const variant = product.variants.find((item) => item.id === variantId) ?? null;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!variant?.availableForSale) return;
    setBusy(true); setMessage(null);
    const added = await addLine(variant.id, quantity);
    setMessage(added ? "Added to cart." : "We could not add that item. Please try again.");
    setBusy(false);
  }
  return <form className="marketplace-detail-form" onSubmit={submit}>
    {product.variants.length > 1 ? <label className="marketplace-label">Options<select className="marketplace-input" value={variantId} onChange={(event) => setVariantId(event.target.value)}>{product.variants.map((item) => <option key={item.id} value={item.id} disabled={!item.availableForSale}>{item.title}{item.availableForSale ? "" : " — unavailable"}</option>)}</select></label> : null}
    <div><span className="marketplace-price">{formatShopifyMoney(variant?.price)}</span>{variant?.compareAtPrice ? <span className="marketplace-compare">{formatShopifyMoney(variant.compareAtPrice)}</span> : null}</div>
    <label className="marketplace-label" htmlFor="marketplace-quantity">Quantity<input id="marketplace-quantity" className="marketplace-input" type="number" min={1} max={20} value={quantity} onChange={(event) => setQuantity(Math.min(20, Math.max(1, Number(event.target.value) || 1)))} /></label>
    <button className="marketplace-button" type="submit" disabled={!variant?.availableForSale || busy}>{busy ? "Adding…" : variant?.availableForSale ? "Add to cart" : "Currently unavailable"}</button>
    {message ? <p role="status" aria-live="polite">{message} {message === "Added to cart." ? <a className="marketplace-link" href="/marketplace/cart">View cart</a> : null}</p> : null}
  </form>;
}

