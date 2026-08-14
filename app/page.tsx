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
  label: "Create your family space",
  href: "/start-free?source=home-secondary-family-space",
} as const;

const HEADER_PRIMARY_CTA = {
  label: "Explore MyLearna",
  href: "/demo?source=public-header-demo",
} as const;

const FINAL_PRIMARY_CTA = {
  label: "Explore MyLearna",
  href: "/demo?source=home-final-demo",
} as const;

const FINAL_SECONDARY_CTA = {
  label: "Create your family space",
  href: "/start-free?source=home-final-family-space",
} as const;

const FLOW_STEPS = [
  {
    title: "Plan",
    text: "Organise the week and see what is happening today.",
  },
  {
    title: "Capture",
    text: "Record planned and spontaneous learning quickly while it is still fresh.",
  },
  {
    title: "Keep",
    text: "Choose the moments that belong in your My Portfolio story.",
  },
  {
    title: "Report",
    text: "Build portfolios and create report PDFs without reconstructing the story later.",
  },
] as const;

const VALUE_CARDS = [
  {
    title: "Planning that feeds the day",
    text: "Plan the week or month, then use My Day to follow the learning blocks for today.",
  },
  {
    title: "Quick Capture for real life",
    text: "Record photos, notes, work samples and everyday learning without rebuilding the story later.",
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
      heroTitle="Homeschool learning happens everywhere. MyLearna brings it all together."
      heroText="Plan your week, capture learning as it happens, build meaningful portfolios and create reports—all in one private family space."
      heroBadges={["Plan the week", "Capture real learning", "Build portfolios", "Create reports"]}
      heroMicrocopy={
        <span>
          No account needed for the demo. Use a fictional family, try the workflow and see how MyLearna brings learning together.
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
          padding: isMobile ? 16 : isTablet ? 18 : 20,
          display: "grid",
          gap: 12,
          border: "1px solid #dbeafe",
          background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
        }}
      >
        <div style={publicPill("#eff6ff", "#1d4ed8")}>Built around your homeschool</div>
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
          Keep using the books, worksheets, websites, projects, outings and everyday experiences your family already loves. MyLearna organises the learning around them.
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
          "One connected learning story",
          "Plan → Learn → Capture → Report",
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
            "Everything stays connected",
            "Planning, Quick Capture, portfolios and reports work together so the family’s learning story does not become scattered.",
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
          <div style={publicPill("#f5f3ff", "#6d28d9")}>Family tools that work together</div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: 26, lineHeight: 1.15, fontWeight: 800 }}>
            Start with the tools you need today.
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#334155" }}>
            Plan your week, capture learning, build portfolios and create reports in one private family space. Explore the tools first, then choose the next step that suits your family.
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
          "Everything you need to keep the story together",
          "My Calendar, My Day, Quick Capture, My Portfolio and My Reports stay connected as learning unfolds.",
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {[
            "My Calendar and My Day",
            "Quick Capture",
            "Portfolio",
            "Reports",
            "Printable PDFs",
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
          Bring your homeschool together.
        </h2>
        <p style={{ margin: 0, color: "#334155", lineHeight: 1.55, maxWidth: 760 }}>
          Start with one learner and one real learning moment.
        </p>
        <p style={{ margin: 0, color: "#334155", lineHeight: 1.55, maxWidth: 760 }}>
          Explore the fictional Carter family first, or create your own private family space when you are ready.
        </p>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.55, maxWidth: 760, fontSize: 13 }}>
          Always check local home education requirements before submitting records.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={FINAL_PRIMARY_CTA.href} style={publicButtonStyle(true)}>
            {FINAL_PRIMARY_CTA.label}
          </Link>
          <Link href={FINAL_SECONDARY_CTA.href} style={publicButtonStyle(false)}>
            {FINAL_SECONDARY_CTA.label}
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
