import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { PUBLIC_WORD_BUILDERS } from "@/lib/clean/publicWordBuilders";

export const metadata: Metadata = {
  title: "Homeschool English Worksheets | MyLearna Word Builders",
  description: "Explore homeschool phonics, CVC, spelling, prefixes, suffixes, morphology and Greek and Latin root worksheets with MyLearna Word Builders.",
  alternates: { canonical: "/word-builders" },
  openGraph: { title: "Homeschool English Worksheets | MyLearna Word Builders", description: "Free homeschool-friendly phonics, spelling and morphology worksheet discovery from MyLearna.", url: "https://www.mylearna.com/word-builders", type: "website" },
};

const categories = [
  ["PHONICS_CVC", "Phonics & CVC", "Sound, decoding and early word-building practice."],
  ["AFFIX_SPELLING", "Spelling & Word Building", "Spelling conventions, prefixes, suffixes and morphology."],
  ["ROOTS", "Greek & Latin Roots", "Root-word study for vocabulary and meaningful word analysis."],
] as const;
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, boxShadow: "0 8px 22px rgba(15,23,42,0.04)" };
const pill = (background: string, color: string): React.CSSProperties => ({ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "5px 9px", background, color, whiteSpace: "nowrap", border: `1px solid ${background}` });

export default function WordBuildersPage() {
  return <PublicSiteShell eyebrow="MyLearna Word Builders" heroTitle="Build stronger readers, spellers and word thinkers." heroText="Explore MyLearna Word Builders — homeschool-friendly phonics, spelling, morphology, prefixes, suffixes and Greek & Latin root worksheets that connect back into your learning record." heroBadges={["Phonics & CVC", "Spelling", "Morphology", "Greek & Latin roots"]} primaryCta={{ label: "Start Free", href: "/start-free?source=word-builders" }} secondaryCta={{ label: "Explore Word Builders", href: "#word-builder-resources" }} compactHero>
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: "MyLearna Word Builders", url: "https://www.mylearna.com/word-builders", description: "Homeschool phonics, spelling, morphology and root-word worksheets." }) }} />
      <section style={{ ...card, display: "grid", gap: 14, marginBottom: 24, background: "linear-gradient(135deg,#f8fbff,#f5f3ff)" }}>
        <p style={{ margin: 0, ...pill("#eff6ff", "#1d4ed8") }}>FREE WORKSHEET DISCOVERY</p>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>Use a focused worksheet as a starting point, then bring the learning record, evidence and next steps together in MyLearna.</p>
      </section>
      <section aria-labelledby="categories" style={{ marginBottom: 28 }}>
        <h2 id="categories" style={{ fontSize: 28, color: "#17204b" }}>Explore Word Builders</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>{categories.map(([key, title, description]) => <Link key={key} href={`#${key.toLowerCase()}`} style={{ ...card, textDecoration: "none", color: "inherit" }}><h3 style={{ margin: "0 0 8px", color: "#17204b" }}>{title}</h3><p style={{ margin: 0, color: "#64748b", lineHeight: 1.55 }}>{description}</p></Link>)}</div>
      </section>
      <section id="word-builder-resources" aria-labelledby="resources" style={{ display: "grid", gap: 22 }}>
        <h2 id="resources" style={{ fontSize: 28, color: "#17204b", marginBottom: 0 }}>Worksheet resources</h2>
        {categories.map(([key, title]) => <div key={key} id={key.toLowerCase()}><h3 style={{ color: "#17204b" }}>{title}</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>{PUBLIC_WORD_BUILDERS.filter((item) => item.category === key).map((item) => <Link key={item.slug} href={`/word-builders/${item.slug}`} style={{ ...card, textDecoration: "none", color: "inherit" }}><span style={pill("#f8fafc", "#475569")}>{item.stage.replaceAll("-", " ")}</span><h4 style={{ margin: "12px 0 6px", color: "#17204b" }}>{item.title}</h4><p style={{ margin: 0, color: "#64748b", lineHeight: 1.5, fontSize: 14 }}>View the learning focus and worksheet preview.</p></Link>)}</div></div>)}
      </section>
    </article>
  </PublicSiteShell>;
}
