import type { Metadata } from "next";
import CartView from "./CartView";

export const metadata: Metadata = { title: "Cart", description: "Review your MyLearna Marketplace cart." };

export default function CartPage() { return <main className="marketplace-main"><div className="marketplace-page-heading"><div className="marketplace-eyebrow">MyLearna Marketplace</div><h1>Your cart</h1><p>Prices and availability are confirmed at checkout.</p></div><CartView /></main>; }
