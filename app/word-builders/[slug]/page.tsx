import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { getPublicWordBuilder, PUBLIC_WORD_BUILDERS } from "@/lib/clean/publicWordBuilders";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 18, boxShadow: "0 8px 22px rgba(15,23,42,0.04)" };
const pill = (background: string, color: string): React.CSSProperties => ({ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "5px 9px", background, color, whiteSpace: "nowrap", border: `1px solid ${background}` });
const button = (primary = false): React.CSSProperties => ({ border: `1px solid ${primary ? "#2563eb" : "#cbd5e1"}`, background: primary ? "#2563eb" : "#fff", color: primary ? "#fff" : "#1f2937", borderRadius: 12, padding: "9px 13px", fontWeight: 650, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 });

export function generateStaticParams() { return PUBLIC_WORD_BUILDERS.map((item) => ({ slug: item.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = getPublicWordBuilder((await params).slug);
  if (!item) return {};
  return { title: `${item.title} Worksheet | MyLearna`, description: item.description, alternates: { canonical: `/word-builders/${item.slug}` }, openGraph: { title: item.pinTitle, description: item.description, url: `https://www.mylearna.com/word-builders/${item.slug}`, type: "article", images: [{ url: `https://www.mylearna.com${item.image}`, alt: `${item.title} worksheet preview` }] } };
}

export default async function WordBuilderResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const item = getPublicWordBuilder((await params).slug);
  if (!item) notFound();
  return <PublicSiteShell eyebrow="MyLearna Word Builders" heroTitle={`${item.title} worksheet`} heroText={item.description} heroBadges={[item.category.replaceAll("_", " "), item.stage.replaceAll("-", " ")]} primaryCta={{ label: "Start Free", href: "/start-free?source=word-builder-resource" }} secondaryCta={{ label: "Explore Word Builders", href: "/word-builders" }} compactHero>
    <article style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24, alignItems: "start" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: `${item.title} Worksheet`, description: item.description, url: `https://www.mylearna.com/word-builders/${item.slug}`, image: `https://www.mylearna.com${item.image}`, publisher: { "@type": "Organization", name: "MyLearna", url: "https://www.mylearna.com" } }) }} />
      <section style={{ ...card, textAlign: "center" }}><Image src={item.image} alt={`${item.title} worksheet preview`} width={1000} height={1500} style={{ width: "100%", height: "auto", maxHeight: "720px", objectFit: "contain" }} priority /></section>
      <aside style={{ ...card, display: "grid", gap: 14 }}><span style={pill("#eff6ff", "#1d4ed8")}>WORD BUILDERS</span><h2 style={{ margin: 0, color: "#17204b" }}>A focused place to start</h2><p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>{item.meaning ?? item.description}</p>{item.skillFocus ? <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}><strong>Learning focus:</strong> {item.skillFocus}.</p> : null}<p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>This preview is for discovery. Start free to connect learning, evidence and progress in one private family space.</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><Link href="/start-free?source=word-builder-resource" style={button(true)}>Start Free</Link><Link href="/word-builders" style={button(false)}>All Word Builders</Link></div></aside>
    </article>
  </PublicSiteShell>;
}
