import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Homeschool Answers | MyLearna",
  description:
    "Practical, source-backed answers to the questions homeschool families ask about planning, evidence, portfolios, progress and reports.",
  path: "/homeschool-answers",
});

const guideHref = "/homeschool-record-keeping";
const starterKitHref = "/resources/homeschool-answers/record-keeping/MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf";

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    background: "#ffffff",
    padding: 24,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  };
}

function buttonStyle(primary = false): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderRadius: 12,
    padding: "10px 15px",
    border: `1px solid ${primary ? "#2563eb" : "#cbd5e1"}`,
    background: primary ? "#2563eb" : "#ffffff",
    color: primary ? "#ffffff" : "#1f2937",
    fontWeight: 750,
    fontSize: 14,
    textDecoration: "none",
  };
}

export default function HomeschoolAnswersPage() {
  return (
    <PublicSiteShell
      eyebrow="MyLearna Homeschool Answers"
      heroTitle="Homeschool Answers"
      heroText="Practical, source-backed answers to the questions homeschool families ask about planning, evidence, portfolios, progress and reports."
      heroBadges={["Record keeping", "Evidence", "Portfolio", "Reports"]}
      primaryCta={{ label: "Read the guide", href: guideHref }}
      secondaryCta={{ label: "Explore MyLearna", href: "/demo?source=answers-hub" }}
      compactHero
    >
      <article>
        <section style={{ ...cardStyle(), marginBottom: 24 }}>
          <p style={{ margin: "0 0 8px", color: "#64748b", fontWeight: 800, fontSize: 13 }}>One practical resource, published first</p>
          <h2 style={{ margin: "0 0 10px", fontSize: 28, lineHeight: 1.2 }}>What Homeschool Records Should You Keep?</h2>
          <p style={{ margin: "0 0 6px", fontSize: 18, color: "#334155" }}>A Practical Guide for U.S. Families</p>
          <p style={{ margin: "0 0 18px", lineHeight: 1.7, color: "#475569" }}>A practical guide to what to keep, what to skip, learning evidence, portfolios, reports and a simple weekly routine. Keep the story, not the pile.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>{["Record keeping", "Evidence", "Portfolio", "Reports"].map((topic) => <span key={topic} style={{ borderRadius: 999, padding: "6px 10px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: 13, fontWeight: 750 }}>{topic}</span>)}</div>
          <p style={{ margin: "0 0 18px", color: "#64748b", lineHeight: 1.6 }}>Last reviewed: August 9, 2026</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href={guideHref} style={buttonStyle(true)}>Read the guide</Link>
            <a href={starterKitHref} download="MyLearna-Homeschool-Record-Keeping-Starter-Kit.pdf" style={buttonStyle(false)}>Download the Starter Kit (PDF)</a>
          </div>
        </section>
        <section style={{ ...cardStyle(), marginBottom: 24, background: "#f8fafc" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 23 }}>Proof before signup</h2>
          <p style={{ margin: 0, lineHeight: 1.7, color: "#475569" }}>Read the guide, download the ungated Starter Kit or explore the fictional Carter Family demo before creating a family space.</p>
        </section>
      </article>
    </PublicSiteShell>
  );
}
