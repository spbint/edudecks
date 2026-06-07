"use client";

import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

type LandingSection = {
  title: string;
  text: string;
};

type RelatedLink = {
  href: string;
  label: string;
};

type PublicSeoLandingPageProps = {
  badges: string[];
  ctaHref: string;
  ctaLabel?: string;
  heroText: string;
  relatedLinks: RelatedLink[];
  sections: LandingSection[];
  title: string;
};

export default function PublicSeoLandingPage({
  badges,
  ctaHref,
  ctaLabel = "Join the MyLearna beta",
  heroText,
  relatedLinks,
  sections,
  title,
}: PublicSeoLandingPageProps) {
  return (
    <PublicSiteShell
      title="MyLearna"
      heroTitle={title}
      heroText={heroText}
      heroBadges={badges}
      primaryCta={{ label: ctaLabel, href: ctaHref }}
      secondaryCta={{ label: "Read the FAQ", href: "/faq" }}
      headerAction={{ label: "Sign in", href: "/login" }}
      headerPrimaryAction={{ label: "Join beta", href: "/beta" }}
      footerPrimaryCta={{ label: ctaLabel, href: ctaHref }}
      footerSecondaryCta={{ label: "Explore the demo", href: "/demo" }}
      compactHero
    >
      <section
        style={{
          ...publicCardStyle(),
          marginBottom: 22,
          display: "grid",
          gap: 18,
        }}
      >
        <div style={publicPill("#eff6ff", "#1d4ed8")}>Parent guide</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          {sections.map((section) => (
            <article
              key={section.title}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                background: "#ffffff",
                padding: 18,
                display: "grid",
                gap: 10,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: "#0f172a",
                  fontSize: 20,
                  lineHeight: 1.2,
                  fontWeight: 900,
                }}
              >
                {section.title}
              </h2>
              <p
                style={{
                  margin: 0,
                  color: "#475569",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {section.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          marginBottom: 22,
          background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
          border: "1px solid #bfdbfe",
          display: "grid",
          gap: 14,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: 24,
            lineHeight: 1.2,
            fontWeight: 900,
          }}
        >
          Start with one useful record
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.7 }}>
          MyLearna is designed to help families begin simply, then connect planning,
          learning evidence, portfolios and reports over time.
        </p>
        <div>
          <Link href={ctaHref} style={publicButtonStyle(true)}>
            {ctaLabel}
          </Link>
        </div>
      </section>

      <section style={{ ...publicCardStyle(), display: "grid", gap: 14 }}>
        <h2
          style={{
            margin: 0,
            color: "#0f172a",
            fontSize: 22,
            lineHeight: 1.2,
            fontWeight: 900,
          }}
        >
          Related MyLearna guides
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {relatedLinks.map((link) => (
            <Link key={link.href} href={link.href} style={publicButtonStyle(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}
