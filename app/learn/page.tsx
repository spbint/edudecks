import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteShell from "@/app/components/PublicSiteShell";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Learning Library | MyLearna",
  description:
    "Explore how children learn from a homeschool perspective: learning science, educational thinkers, philosophies, play, motivation, memory and teaching at home.",
  path: "/learn",
});

const categories = [
  ["How Learning Works", "Memory, attention, knowledge, practice, feedback and the processes that help learning stick."],
  ["Educational Thinkers", "Piaget, Vygotsky, Bruner, Bandura and other thinkers who shaped how we understand learning."],
  ["Educational Philosophies", "Montessori, Reggio Emilia, Steiner/Waldorf and the ideas behind different approaches to education."],
  ["Play & Development", "Free play, guided play, imagination, exploration and what play can contribute to learning."],
  ["Learning Science", "Retrieval, spacing, cognitive load, metacognition and what modern research can tell us."],
  ["Teaching at Home", "How direct teaching, conversation, projects, practice and independence can work together."],
  ["Homeschool Approaches", "Classical education, Charlotte Mason, unschooling and other traditions viewed without tribalism."],
] as const;

const upcoming = [
  ["02", "Piaget and Homeschooling: What His Theory of Child Development Still Teaches Us"],
  ["03", "Vygotsky: Why the Right Help Changes What a Child Can Do"],
  ["04", "Montessori: What Homeschool Parents Can Actually Take From It"],
  ["05", "Reggio Emilia: Curiosity, Relationships and Making Learning Visible"],
  ["06", "Steiner/Waldorf: Imagination, Rhythm and Development"],
  ["07", "Classical Education: Why Homeschool Families Are Drawn to It"],
] as const;

const card: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  background: "#ffffff",
  padding: 24,
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "6px 10px",
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  fontSize: 13,
  fontWeight: 750,
};

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

export default function LearningLibraryPage() {
  return (
    <PublicSiteShell
      eyebrow="MyLearna Learning Library"
      heroTitle="Understand how children learn."
      heroText="A homeschool-focused library exploring learning science, educational thinkers, philosophies, play, motivation, memory and teaching at home."
      heroBadges={["Learning science", "Educational thinkers", "Play", "Homeschool approaches"]}
      primaryCta={{ label: "Start with Article 001", href: "/learn/how-do-children-learn" }}
      secondaryCta={{ label: "Homeschool Answers", href: "/homeschool-answers" }}
      compactHero
    >
      <article>
        <section style={{ ...card, marginBottom: 24, background: "linear-gradient(135deg,#f8fbff,#f5f3ff)" }}>
          <p style={{ margin: "0 0 8px", color: "#64748b", fontWeight: 800, fontSize: 13 }}>ARTICLE 001</p>
          <h2 style={{ margin: "0 0 12px", fontSize: "clamp(25px,4vw,36px)", lineHeight: 1.15 }}>How Do Children Actually Learn? A Homeschool Parent&apos;s Guide</h2>
          <p style={{ margin: "0 0 18px", lineHeight: 1.7, color: "#475569", fontSize: 17 }}>Children learn through knowledge, experience, practice, relationships, guidance, play, feedback and gradually increasing independence. This guide introduces the major ideas without asking families to join a single educational camp.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>{["Foundations", "Learning science", "Homeschool perspective"].map((tag) => <span key={tag} style={pill}>{tag}</span>)}</div>
          <Link href="/learn/how-do-children-learn" style={buttonStyle(true)}>Read the guide</Link>
        </section>

        <section style={{ marginBottom: 28 }} aria-labelledby="categories-heading">
          <h2 id="categories-heading" style={{ margin: "0 0 14px", fontSize: 28 }}>Explore the library</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {categories.map(([title, description]) => <Link key={title} href={`/learn/how-do-children-learn#${title.toLowerCase().replaceAll(" & ", "-").replaceAll(" ", "-")}`} style={{ ...card, textDecoration: "none", color: "inherit", padding: 20 }}><h3 style={{ margin: "0 0 8px", color: "#17204b", fontSize: 18 }}>{title}</h3><p style={{ margin: 0, color: "#64748b", lineHeight: 1.55, fontSize: 14 }}>{description}</p></Link>)}
          </div>
        </section>

        <section style={{ ...card, marginBottom: 28, background: "#f8fafc" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 25 }}>Understand the ideas. Understand your child.</h2>
          <p style={{ margin: "0 0 14px", color: "#475569", lineHeight: 1.7 }}>MyLearna does not ask families to become Montessori, Classical, Reggio, Steiner or unschooling families.</p>
          <p style={{ margin: "0 0 10px", color: "#475569", lineHeight: 1.7 }}>We explore what each approach can help us understand, what evidence supports or challenges it, where limitations exist, and what the idea might mean for a real child learning at home.</p>
          <p style={{ margin: 0, color: "#17204b", fontWeight: 750 }}>The lens is informed, balanced and non-ideological.</p>
        </section>

        <section aria-labelledby="coming-next-heading">
          <h2 id="coming-next-heading" style={{ margin: "0 0 14px", fontSize: 28 }}>Coming next</h2>
          <div style={{ display: "grid", gap: 10 }}>{upcoming.map(([number, title]) => <div key={number} style={{ ...card, display: "flex", gap: 16, alignItems: "baseline", padding: "16px 20px" }}><strong style={{ color: "#2563eb", minWidth: 28 }}>{number}</strong><span style={{ color: "#334155", lineHeight: 1.5 }}>{title}</span></div>)}</div>
        </section>
      </article>
    </PublicSiteShell>
  );
}
