"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

const WORKFLOW_STEPS = [
  {
    title: "Planning",
    description: "Shape what comes next with a calm, simple weekly focus.",
    href: "/planner",
    step: "01",
    nextLabel: "Then capture",
  },
  {
    title: "Capture",
    description: "Log real learning simply, so small moments do not get lost.",
    href: "/capture",
    step: "02",
    nextLabel: "Then report",
  },
  {
    title: "Reports",
    description: "Turn learning into a trusted summary you can build on.",
    href: "/reports",
    step: "03",
    nextLabel: "Then portfolio",
  },
  {
    title: "Portfolio",
    description: "Build the bigger learning story over time, without pressure.",
    href: "/portfolio",
    step: "04",
    nextLabel: "",
  },
];

export default function HomePage() {
  return (
    <PublicSiteShell
      eyebrow="Homeschool-first workflow"
      heroTitle="Start with one simple learning moment, then let EduDecks guide what comes next."
      heroText="EduDecks helps nervous homeschool parents begin gently. Try one small learning moment first, then move into planning, reporting, and building a portfolio when you are ready."
      heroMicrocopy="No signup needed to try it first."
      heroBadges={["Planning", "Capture", "Reports", "Portfolio"]}
      primaryCta={{ label: "Start your first learning moment", href: "/capture" }}
      secondaryCta={{ label: "See how it works", href: "/get-started" }}
      headerAction={{ label: "Sign in", href: "/login" }}
      footerPrimaryCta={{
        label: "Start your first learning moment",
        href: "/capture",
      }}
      footerSecondaryCta={{ label: "See how it works", href: "/get-started" }}
      asideTitle="Why families feel calmer"
      asideText="You do not need to feel like a teacher, planner, or assessor on day one. Start with one real moment, and EduDecks helps you shape the next step without turning home into school."
    >
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
          One connected workflow
        </div>
        <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
          The full workflow is planning, capture, reports, and portfolio. You can still begin with
          one learning moment, and we will guide the rest from there.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          {WORKFLOW_STEPS.map((item, index, items) => (
            <Link
              key={item.title}
              href={item.href}
              style={{
                ...publicCardStyle(),
                textDecoration: "none",
                color: "inherit",
                display: "grid",
                gap: 10,
                minHeight: 176,
                alignContent: "start",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <span style={publicPill("#eff6ff", "#1d4ed8")}>{item.step}</span>
                {index < items.length - 1 ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#94a3b8",
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.nextLabel} <span style={{ fontSize: 16, fontWeight: 900 }}>&rarr;</span>
                  </span>
                ) : null}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{item.title}</div>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                {item.description}
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-start" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <Link href="/capture" style={publicButtonStyle(true)}>
              Start your first learning moment
            </Link>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              Start with one learning moment, then we&apos;ll guide you through planning,
              reporting, and building your portfolio.
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
          Built for real homeschooling
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            "Start gently, even if you do not feel confident yet.",
            "Follow your own homeschool rhythm, not a school dashboard.",
            "Keep simple records without chasing perfection.",
            "Build trusted summaries over time, not in a last-minute rush.",
            "Stay focused on your child, not admin.",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                background: "#f8fafc",
                fontSize: 14,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          borderRadius: 24,
          padding: 28,
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
          color: "#ffffff",
          boxShadow: "0 18px 50px rgba(15,23,42,0.1)",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>
          Start your first learning moment
        </div>
        <div style={{ marginBottom: 18, opacity: 0.95, lineHeight: 1.7, maxWidth: 760 }}>
          One small step is enough. Try a simple learning moment first, then EduDecks helps you
          shape what to plan, what to keep, and what to turn into a report later.
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/capture"
            style={{
              ...publicButtonStyle(true),
              background: "#ffffff",
              color: "#2563eb",
              border: "1px solid #ffffff",
            }}
          >
            Start your first learning moment
          </Link>
          <Link
            href="/get-started"
            style={{
              ...publicButtonStyle(false),
              background: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          >
            See how it works
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
