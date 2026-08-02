"use client";

import { FormEvent, useState } from "react";
import { formatShopifyMoney } from "@/lib/shopify/money";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { effectiveMarketplaceQuantityLimit, remainingMarketplaceQuantity } from "@/lib/shopify/inventory";
import { useMarketplaceCart } from "../../MarketplaceCartProvider";

export default function AddToCartPanel({ product }: { product: ShopifyProduct }) {
  const available = product.variants.filter((variant) => variant.availableForSale);
  const [variantId, setVariantId] = useState(available[0]?.id ?? product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { cart, addLine } = useMarketplaceCart();
  const variant = product.variants.find((item) => item.id === variantId) ?? null;
  const existingQuantity = cart?.lines.find((line) => line.merchandise.id === variant?.id)?.quantity ?? 0;
  const maxAdditional = variant ? remainingMarketplaceQuantity(variant.quantityAvailable, existingQuantity) : 0;
  const maximumQuantity = effectiveMarketplaceQuantityLimit(variant?.quantityAvailable);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!variant?.availableForSale) return;
    if (maxAdditional < 1) { setMessage(existingQuantity ? `You already have ${existingQuantity} in your cart. No more are currently available.` : "This item is not currently available."); return; }
    if (quantity > maxAdditional) { setMessage(existingQuantity ? `${existingQuantity} is already in your cart. You can add up to ${maxAdditional} more.` : `Only ${maximumQuantity} are currently available.`); return; }
    setBusy(true); setMessage(null);
    const result = await addLine(variant.id, quantity);
    setMessage(result.ok ? "Added to cart." : result.error || "We could not add that item. Please try again.");
    setBusy(false);
  }
  return <form className="marketplace-detail-form" onSubmit={submit}>
    {product.variants.length > 1 ? <label className="marketplace-label">Options<select className="marketplace-input" value={variantId} onChange={(event) => setVariantId(event.target.value)}>{product.variants.map((item) => <option key={item.id} value={item.id} disabled={!item.availableForSale}>{item.title}{item.availableForSale ? "" : " — unavailable"}</option>)}</select></label> : null}
    <div><span className="marketplace-price">{formatShopifyMoney(variant?.price)}</span>{variant?.compareAtPrice ? <span className="marketplace-compare">{formatShopifyMoney(variant.compareAtPrice)}</span> : null}</div>
    {variant && typeof variant.quantityAvailable === "number" ? <p className="marketplace-stock" role="status">{variant.quantityAvailable} available</p> : null}
    {existingQuantity > 0 ? <p className="marketplace-stock" role="status">{existingQuantity} is already in your cart. You can add up to {maxAdditional} more.</p> : null}
    <label className="marketplace-label" htmlFor="marketplace-quantity">Quantity<input id="marketplace-quantity" className="marketplace-input" type="number" min={1} max={Math.max(1, maxAdditional)} value={Math.min(quantity, Math.max(1, maxAdditional))} disabled={maxAdditional < 1} onChange={(event) => setQuantity(Math.min(Math.max(1, maxAdditional), Math.max(1, Number(event.target.value) || 1)))} /></label>
    <button className="marketplace-button" type="submit" disabled={!variant?.availableForSale || busy || maxAdditional < 1}>{busy ? "Adding…" : variant?.availableForSale && maxAdditional > 0 ? "Add to cart" : "Currently unavailable"}</button>
    {message ? <p role="status" aria-live="polite">{message} {message === "Added to cart." ? <a className="marketplace-link" href="/marketplace/cart">View cart</a> : null}</p> : null}
  </form>;
}
