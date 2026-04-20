"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";
import useIsMobile from "@/app/components/useIsMobile";

const STEPS = [
  {
    number: "1",
    title: "Plan",
    text: "Set a learning focus for the moment.",
  },
  {
    number: "2",
    title: "Capture",
    text: "Record what actually happened.",
  },
  {
    number: "3",
    title: "Build",
    text: "Turn moments into a structured learning record.",
  },
  {
    number: "4",
    title: "Report",
    text: "See progress clearly over time.",
  },
];

const BENEFITS = [
  "Capture evidence as it happens",
  "Build a record without extra admin",
  "Track progress over time",
  "Be ready for reporting when needed",
];

const AUDIENCES = ["Families", "Homeschool", "Schools"];

function sectionHeader(title: string, text?: string) {
  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 32,
          lineHeight: 1.1,
          fontWeight: 900,
          color: "#0f172a",
        }}
      >
        {title}
      </h2>
      {text ? (
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.7,
            color: "#475569",
          }}
        >
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
      title="EduDecks"
      eyebrow=""
      heroTitle="Capture learning as it happens. Build a record that grows over time."
      heroText="Plan learning, capture real moments, and turn them into clear records for reporting and assessment."
      heroBadges={[]}
      heroMicrocopy={<span>No complex setup. Start with one moment.</span>}
      asideTitle=""
      asideText=""
      asideItems={[]}
      heroAsideVisible={false}
      primaryCta={{ label: "Start a family", href: "/start" }}
      secondaryCta={{ label: "See how it works", href: "/#how-it-works" }}
      headerAction={{ label: "Sign in", href: "/login" }}
      footerPrimaryCta={{ label: "Start a family", href: "/start" }}
      footerSecondaryCta={{ label: "See how it works", href: "/#how-it-works" }}
      showWorkflowStrip={false}
    >
      <section
        id="how-it-works"
        style={{
          ...publicCardStyle(),
          marginBottom: isMobile ? 18 : 22,
          padding: isMobile ? 18 : isTablet ? 24 : 28,
          display: "grid",
          gap: 22,
          scrollMarginTop: 116,
        }}
      >
        {sectionHeader("A clear pathway from learning to reporting")}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.title}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: isMobile ? 16 : 18,
                background: "#ffffff",
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
                  fontWeight: 900,
                }}
              >
                {step.number}
              </div>
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {step.title}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#475569",
                }}
              >
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          borderRadius: 28,
          padding: isMobile ? 20 : isTablet ? 24 : 32,
          marginBottom: isMobile ? 18 : 22,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          boxShadow: "0 18px 50px rgba(15,23,42,0.14)",
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Start now
        </div>
        <div
          style={{
            fontSize: isMobile ? 30 : 34,
            lineHeight: isMobile ? 1.08 : 1.12,
            fontWeight: 900,
            maxWidth: 720,
          }}
        >
          Start your first learning record
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.82)",
            maxWidth: 620,
          }}
        >
          Capture one moment and build from there.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/start"
            style={{
              ...publicButtonStyle(true),
              background: "#ffffff",
              color: "#0f172a",
              border: "1px solid #ffffff",
              width: isMobile ? "100%" : undefined,
            }}
          >
            Start a family
          </Link>
          <Link
            href="/#how-it-works"
            style={{
              ...publicButtonStyle(false),
              background: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.32)",
              width: isMobile ? "100%" : undefined,
            }}
          >
            See how it works
          </Link>
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          marginBottom: isMobile ? 18 : 22,
          padding: isMobile ? 18 : isTablet ? 24 : 28,
          display: "grid",
          gap: 22,
        }}
      >
        {sectionHeader("Built for real learning, not paperwork")}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {BENEFITS.map((item, index) => (
            <div
              key={item}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: isMobile ? 16 : 18,
                background: index % 2 === 0 ? "#ffffff" : "#f8fafc",
                fontSize: 15,
                lineHeight: 1.6,
                color: "#334155",
                fontWeight: 800,
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
          marginBottom: isMobile ? 18 : 22,
          padding: isMobile ? 18 : isTablet ? 24 : 28,
          display: "grid",
          gap: 18,
        }}
      >
        {sectionHeader(
          "Built for families. Ready for schools.",
          "Start with your family's learning. Expand into structured reporting when needed."
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {AUDIENCES.map((item, index) => {
            const tones = [
              ["#eff6ff", "#2563eb"],
              ["#f8fafc", "#334155"],
              ["#f5f3ff", "#6d28d9"],
            ] as const;
            const tone = tones[index] ?? tones[0];
            return (
              <div key={item} style={publicPill(tone[0], tone[1])}>
                {item === "Schools" ? "Schools (future-ready)" : item}
              </div>
            );
          })}
        </div>
      </section>
    </PublicSiteShell>
  );
}
