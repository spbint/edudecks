import type { Metadata } from "next";
import Link from "next/link";
import MarketplaceHeader from "./MarketplaceHeader";
import { MarketplaceCartProvider } from "./MarketplaceCartProvider";
import { mylearnaBrandTokens } from "@/lib/theme/mylearnaBrand";
import "./marketplace.css";

export const metadata: Metadata = {
  title: { default: "MyLearna Marketplace", template: "%s | MyLearna Marketplace" },
  description: "Affordable resources. Meaningful learning.",
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const brand = mylearnaBrandTokens;
  return <div className="marketplace-shell" style={{
    "--marketplace-font": brand.fontFamily,
    "--marketplace-navy": brand.navy,
    "--marketplace-ink": brand.ink,
    "--marketplace-slate": brand.slate,
    "--marketplace-muted": brand.muted,
    "--marketplace-page": brand.page,
    "--marketplace-surface": brand.surface,
    "--marketplace-warm-surface": brand.warmSurface,
    "--marketplace-border": brand.border,
    "--marketplace-warm-border": brand.warmBorder,
    "--marketplace-accent": brand.accent,
    "--marketplace-accent-strong": brand.accentStrong,
    "--marketplace-accent-soft": brand.accentSoft,
    "--marketplace-focus": brand.focus,
    "--marketplace-radius-sm": brand.radiusSm,
    "--marketplace-radius-md": brand.radiusMd,
    "--marketplace-radius-lg": brand.radiusLg,
    "--marketplace-radius-xl": brand.radiusXl,
    "--marketplace-shadow-card": brand.shadowCard,
    "--marketplace-shadow-raised": brand.shadowRaised,
  } as React.CSSProperties}>
    <MarketplaceCartProvider>
      <MarketplaceHeader />
      {children}
    </MarketplaceCartProvider>
    <footer className="marketplace-footer"><div className="marketplace-footer-inner"><span>MyLearna Marketplace · Affordable resources. Meaningful learning.</span><Link className="marketplace-link" href="/">Back to MyLearna</Link></div></footer>
  </div>;
}
