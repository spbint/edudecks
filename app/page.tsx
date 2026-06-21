"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";
import useIsMobile from "@/app/components/useIsMobile";

const PRIMARY_CTA = {
  label: "Start free during beta",
  href: "/start-free?source=home-primary",
} as const;

const HEADER_PRIMARY_CTA = {
  label: "Start free",
  href: "/start-free?source=home-header",
} as const;

const FLOW_STEPS = [
  {
    title: "Plan",
    text: "Use My Calendar and My Day to organise the week.",
  },
  {
    title: "Learn",
    text: "Use My Pathways for practice, checks and worksheets.",
  },
  {
    title: "Capture",
    text: "Add notes, learning moments and evidence as they happen.",
  },
  {
    title: "Report",
    text: "Turn evidence and pathway checks into portfolios and report-ready outputs.",
  },
] as const;

const VALUE_CARDS = [
  {
    title: "Planning that feeds the day",
    text: "Plan the week or month, then use My Day to follow the learning blocks for today.",
  },
  {
    title: "Pathways with useful outputs",
    text: "Practise, check understanding, open worksheets, and keep completed pathway checks as report-ready evidence.",
  },
  {
    title: "Evidence that keeps moving",
    text: "Capture text evidence, choose portfolio highlights, and bring selected evidence into reports and outputs.",
  },
  {
    title: "Printable records",
    text: "Create family learning record PDFs, plus simple weekly, monthly and daily planning PDFs for the fridge.",
  },
] as const;

function sectionHeader(title: string, text?: string) {
  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 780 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 28,
          lineHeight: 1.15,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {title}
      </h2>
      {text ? (
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#475569" }}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

export default function HomePage() {
  const isTablet = useIsMobile(1080);
  const isMobile = useIsMobile(720);

  return (
    <PublicSiteShell
      title="MyLearna"
      eyebrow=""
      heroTitle="A simple homeschool system for planning, evidence, portfolios and reports."
      heroText="Plan the week, follow today's learning, capture evidence and prepare report-ready records."
      heroBadges={["Plan", "Learn", "Capture", "Report"]}
      heroMicrocopy={
        <span>
          Use MyLearna now while we continue improving with family feedback.
        </span>
      }
      asideTitle=""
      asideText=""
      asideItems={[]}
      heroAsideVisible={false}
      primaryCta={PRIMARY_CTA}
      secondaryCta={{ label: "See how it works", href: "#how-it-works" }}
      headerAction={{ label: "Sign in", href: "/login" }}
      headerPrimaryAction={HEADER_PRIMARY_CTA}
      footerPrimaryCta={PRIMARY_CTA}
      footerSecondaryCta={{ label: "About", href: "/about" }}
      showWorkflowStrip={false}
    >
      <section
        style={{
          ...publicCardStyle(),
          marginBottom: isMobile ? 18 : 22,
          padding: isMobile ? 16 : isTablet ? 18 : 20,
          display: "grid",
          gap: 12,
          border: "1px solid #dbeafe",
          background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
        }}
      >
        <div style={publicPill("#eff6ff", "#1d4ed8")}>Free Beta V1</div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.55,
            color: "#334155",
            maxWidth: 920,
            fontWeight: 500,
          }}
        >
          MyLearna is live in beta for families who want calmer planning,
          evidence, portfolios and records.
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
        {sectionHeader(
          "Plan -> Learn -> Capture -> Report",
          "Turn ordinary homeschool activity into a usable learning record.",
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {FLOW_STEPS.map((step, index) => (
            <div
              key={step.title}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: isMobile ? 14 : 16,
                background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {index + 1}
              </div>
              <div style={{ fontSize: 17, lineHeight: 1.2, fontWeight: 800, color: "#0f172a" }}>
                {step.title}
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#475569" }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 18,
          marginBottom: isMobile ? 18 : 22,
        }}
      >
        <div
          style={{
            ...publicCardStyle(),
            padding: isMobile ? 18 : isTablet ? 22 : 24,
            display: "grid",
            gap: 16,
          }}
        >
          {sectionHeader(
            "What MyLearna helps with now",
            "Free Beta V1 focuses on planning, daily learning, evidence, portfolios and reports.",
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {VALUE_CARDS.map((item) => (
              <div
                key={item.title}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  padding: isMobile ? 14 : 16,
                  background: "#ffffff",
                  display: "grid",
                  gap: 8,
                }}
              >
                <strong style={{ color: "#0f172a", fontSize: 16 }}>{item.title}</strong>
                <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.5 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            border: "1px solid #ddd6fe",
            background: "linear-gradient(180deg, #faf5ff 0%, #ffffff 100%)",
            padding: isMobile ? 18 : isTablet ? 22 : 24,
            display: "grid",
            gap: 16,
          }}
        >
          <div style={publicPill("#f5f3ff", "#6d28d9")}>Free and Family</div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 26, lineHeight: 1.15, fontWeight: 800 }}>
            Start free. Upgrade when you need more.
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#334155" }}>
            Free gives families planning, text evidence, portfolio highlights and
            basic report-ready outputs during beta.
          </p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#334155" }}>
            Family features will unlock deeper curriculum pathways, worksheets,
            activities and richer evidence-based reports as they come online.
          </p>
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          marginBottom: isMobile ? 18 : 22,
          padding: isMobile ? 18 : isTablet ? 22 : 24,
          display: "grid",
          gap: 16,
        }}
      >
        {sectionHeader(
          "Report-ready records without rebuilding the story later",
          "Move checks and capture notes into portfolios, reports and printable outputs.",
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {[
            "Calendar and My Day planning",
            "Pathway practice, checks and worksheets",
            "Text evidence capture",
            "Portfolio highlights",
            "Report and output previews",
            "Printable PDF learning records",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid #dbeafe",
                borderRadius: 16,
                background: "#f8fbff",
                padding: "13px 14px",
                color: "#334155",
                fontSize: 14,
                lineHeight: 1.5,
                fontWeight: 700,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          background: "linear-gradient(135deg, rgba(79,124,240,0.06) 0%, rgba(139,124,246,0.06) 100%)",
          border: "1px solid #bfdbfe",
          display: "grid",
          gap: 14,
        }}
      >
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 26, lineHeight: 1.15, fontWeight: 800 }}>
          Start with the free beta.
        </h2>
        <p style={{ margin: 0, color: "#334155", lineHeight: 1.55, maxWidth: 760 }}>
          Create an account, set up your family, and begin. Always check local
          home education requirements before submitting records.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={PRIMARY_CTA.href} style={publicButtonStyle(true)}>
            {PRIMARY_CTA.label}
          </Link>
          <Link href="/about" style={publicButtonStyle(false)}>
            About MyLearna
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
