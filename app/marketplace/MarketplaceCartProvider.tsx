"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ShopifyCart } from "@/lib/shopify/types";

type CartContextValue = {
  cart: ShopifyCart | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addLine: (variantId: string, quantity: number) => Promise<boolean>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

async function readResponse(response: Response) {
  const body = await response.json().catch(() => ({})) as { cart?: ShopifyCart | null; error?: string };
  if (!response.ok) throw new Error(body.error || "The Marketplace cart is temporarily unavailable.");
  return body.cart ?? null;
}

export function MarketplaceCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setCart(await readResponse(await fetch("/api/marketplace/cart", { cache: "no-store" }))); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The Marketplace cart is temporarily unavailable."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const mutate = useCallback(async (body: Record<string, unknown>) => {
    setError(null);
    try {
      const next = await readResponse(await fetch("/api/marketplace/cart", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
      setCart(next);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The Marketplace cart is temporarily unavailable.");
      return false;
    }
  }, []);

  const value = useMemo<CartContextValue>(() => ({ cart, loading, error, refresh, addLine: (variantId, quantity) => mutate({ action: "add", variantId, quantity }), updateLine: async (lineId, quantity) => { await mutate({ action: "update", lineId, quantity }); }, removeLine: async (lineId) => { await mutate({ action: "remove", lineId }); } }), [cart, error, loading, mutate, refresh]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useMarketplaceCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useMarketplaceCart must be used inside MarketplaceCartProvider");
  return context;
}

