import type { ShopifyMoney } from "./types";

export function formatShopifyMoney(money: ShopifyMoney | null | undefined) {
  if (!money) return "Price unavailable";
  const amount = Number(money.amount);
  if (!Number.isFinite(amount)) return "Price unavailable";
  if (amount === 0) return "Free";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: money.currencyCode }).format(amount);
  } catch {
    return `${money.amount} ${money.currencyCode}`;
  }
}
