import type { Metadata } from "next";
import Link from "next/link";
import MarketplaceHeader from "./MarketplaceHeader";
import { MarketplaceCartProvider } from "./MarketplaceCartProvider";
import "./marketplace.css";

export const metadata: Metadata = {
  title: { default: "MyLearna Marketplace", template: "%s | MyLearna Marketplace" },
  description: "Affordable resources. Meaningful learning.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <div className="marketplace-shell">
    <MarketplaceCartProvider>
      <MarketplaceHeader />
      {children}
    </MarketplaceCartProvider>
    <footer className="marketplace-footer"><div className="marketplace-footer-inner"><span>MyLearna Marketplace · Affordable resources. Meaningful learning.</span><Link className="marketplace-link" href="/">Back to MyLearna</Link></div></footer>
  </div>;
}
