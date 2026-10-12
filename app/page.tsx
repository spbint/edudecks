"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";
import useIsMobile from "@/app/components/useIsMobile";

const HERO_PRIMARY_CTA = {
  label: "Explore MyLearna",
  href: "/demo?source=home-primary-demo",
} as const;

const HERO_SECONDARY_CTA = {
  label: "See how it works",
  href: "#how-it-works",
} as const;

const HEADER_PRIMARY_CTA = {
  label: "Explore MyLearna",
  href: "/demo?source=public-header-demo",
} as const;

const FINAL_PRIMARY_CTA = {
  label: "View the demo",
  href: "/demo?source=home-final-demo",
} as const;

const FINAL_SECONDARY_CTA = {
  label: "Existing family? Sign in",
  href: "/login",
} as const;

const LEARNING_LOOP = [
  {
    title: "Understand",
    text: "See what current evidence suggests, without reducing a child to one score.",
  },
  {
    title: "Learn",
    text: "Use a clear next-learning recommendation to choose what to teach next.",
  },
  {
    title: "Capture",
    text: "Keep work samples, observations and everyday learning alongside the assessment view.",
  },
  {
    title: "Recheck",
    text: "Check learning again when the time is right, using the same trusted assessment approach.",
  },
  {
    title: "See change",
    text: "Compare evidence over time without manufacturing a generic growth score.",
  },
  {
    title: "Report",
    text: "Build Portfolio and reports from the learning evidence already collected.",
  },
] as const;

const PROOF_POINTS = [
  {
    title: "Understand their learning",
    text: "See what current assessment evidence suggests and where the useful starting point appears to be.",
  },
  {
    title: "See the evidence",
    text: "Bring structured assessment together with work samples, observations and everyday learning while keeping each source clear.",
  },
  {
    title: "Know what comes next",
    text: "Use clear next-learning recommendations rather than an invented overall Maths score.",
  },
  {
    title: "See change over time",
    text: "Recheck learning and see what changed, what evidence changed and what remains unresolved.",
  },
  {
    title: "Keep the proof",
    text: "Use Capture, Portfolio and reports to keep the authentic learning story that supports your records.",
  },
] as const;

function SectionHeader({ title, text }: { title: string; text?: string }) {
  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 800 }}>
      <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.15, fontWeight: 800, color: "#0f172a" }}>
        {title}
      </h2>
      {text ? <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#475569" }}>{text}</p> : null}
    </div>
  );
}

export default function HomePage() {
  const isTablet = useIsMobile(1080);
  const isMobile = useIsMobile(720);

  return (
    <PublicSiteShell
      title="MyLearna"
      eyebrow="MyLearna Homeschool"
      heroTitle="Know what they know. Know what to do next."
      heroText="MyLearna brings assessment evidence and everyday learning together so you can understand where your child is, see why, and know what to teach next."
      heroBadges={["Understand current learning", "See the evidence", "Choose what comes next", "Build proof over time"]}
      heroMicrocopy={
        <span>
          Learning intelligence is being built progressively across MyLearna, starting with Maths Starting Point — Number &amp; Operations. Explore a fictional family without creating an account.
        </span>
      }
      asideTitle=""
      asideText=""
      asideItems={[]}
      heroAsideVisible={false}
      primaryCta={HERO_PRIMARY_CTA}
      secondaryCta={HERO_SECONDARY_CTA}
      headerAction={{ label: "Sign in", href: "/login" }}
      headerPrimaryAction={HEADER_PRIMARY_CTA}
      footerPrimaryCta={FINAL_PRIMARY_CTA}
      footerSecondaryCta={{ label: "About", href: "/about" }}
      showWorkflowStrip={false}
    >
      <section
        style={{
          ...publicCardStyle(),
          marginBottom: isMobile ? 18 : 22,
          padding: isMobile ? 18 : isTablet ? 22 : 24,
          display: "grid",
          gap: 12,
          border: "1px solid #dbeafe",
          background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
        }}
      >
        <div style={publicPill("#eff6ff", "#1d4ed8")}>Homeschool learning intelligence</div>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#17204b", maxWidth: 900, fontWeight: 750 }}>
          Most homeschool apps help you organise homeschooling. MyLearna helps you understand the learning.
        </p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#475569", maxWidth: 900 }}>
          Planning and calendars still support the week. Capture, Portfolio and reports still keep the record. The central promise is a clearer view of what your child currently appears to know, what evidence supports that view and what to do next.
        </p>
      </section>

      <section
        id="how-it-works"
        style={{
          ...publicCardStyle(),
          marginBottom: isMobile ? 18 : 22,
          padding: isMobile ? 18 : isTablet ? 22 : 24,
          display: "grid",
          gap: 18,
          scrollMarginTop: 116,
        }}
      >
        <SectionHeader
          title="One useful learning loop"
          text="Understand → Learn → Capture → Recheck → See change → Report"
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
          {LEARNING_LOOP.map((step, index) => (
            <article
              key={step.title}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: isMobile ? 14 : 16,
                background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                display: "grid",
                gap: 10,
                alignContent: "start",
              }}
            >
              <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 999, background: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 800 }}>
                {index + 1}
              </span>
              <h3 style={{ margin: 0, fontSize: 17, lineHeight: 1.2, fontWeight: 800, color: "#0f172a" }}>{step.title}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#475569" }}>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...publicCardStyle(), marginBottom: isMobile ? 18 : 22, padding: isMobile ? 18 : isTablet ? 22 : 24, display: "grid", gap: 18 }}>
        <SectionHeader
          title="Understand the learning. Keep the story."
          text="Assessment and everyday learning evidence work together without being treated as the same claim. A photo, observation or work sample is authentic evidence; it does not automatically become mastery."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 14 }}>
          {PROOF_POINTS.map((point) => (
            <article key={point.title} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: isMobile ? 14 : 16, background: "#ffffff", display: "grid", gap: 8 }}>
              <h3 style={{ margin: 0, color: "#17204b", fontSize: 17 }}>{point.title}</h3>
              <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.55 }}>{point.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 18, marginBottom: isMobile ? 18 : 22 }}>
        <article style={{ ...publicCardStyle(), padding: isMobile ? 18 : isTablet ? 22 : 24, display: "grid", gap: 14, alignContent: "start" }}>
          <div style={publicPill("#f5f3ff", "#6d28d9")}>Honest about what is known</div>
          <h2 style={{ margin: 0, color: "#17204b", fontSize: 26, lineHeight: 1.15 }}>No one Maths score. No hidden certainty.</h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            MyLearna keeps learning areas independent, explains what the evidence suggests and shows when evidence is incomplete or practical confirmation is still needed.
          </p>
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6, fontSize: 14 }}>
            The current trusted assessment view covers Number &amp; Operations. It does not claim to assess all of Mathematics or every subject.
          </p>
        </article>
        <article style={{ borderRadius: 18, border: "1px solid #bbf7d0", background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)", padding: isMobile ? 18 : isTablet ? 22 : 24, display: "grid", gap: 14, alignContent: "start" }}>
          <div style={publicPill("#dcfce7", "#166534")}>For Australian homeschool families</div>
          <h2 style={{ margin: 0, color: "#17204b", fontSize: 26, lineHeight: 1.15 }}>Understand their learning. Keep the evidence. Be ready to report.</h2>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            Learning intelligence is the core value. Portfolio and reporting make the evidence useful when families need to demonstrate the learning later.
          </p>
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6, fontSize: 14 }}>
            New registrations remain paused while MyLearna prepares for its planned January 2027 Australian reopening. Existing families can still sign in.
          </p>
        </article>
      </section>

      <section style={{ ...publicCardStyle(), background: "linear-gradient(135deg, rgba(79,124,240,0.07) 0%, rgba(139,124,246,0.07) 100%)", border: "1px solid #bfdbfe", display: "grid", gap: 14 }}>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 26, lineHeight: 1.15, fontWeight: 800 }}>
          See how MyLearna turns evidence into a useful next step.
        </h2>
        <p style={{ margin: 0, color: "#334155", lineHeight: 1.6, maxWidth: 780 }}>
          Explore the fictional Carter family, then follow learning from understanding and Capture through to Portfolio and reports. No account is needed for the demo.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={FINAL_PRIMARY_CTA.href} style={publicButtonStyle(true)}>{FINAL_PRIMARY_CTA.label}</Link>
          <Link href={FINAL_SECONDARY_CTA.href} style={publicButtonStyle(false)}>{FINAL_SECONDARY_CTA.label}</Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
