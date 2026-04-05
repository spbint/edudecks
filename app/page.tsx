"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
} from "@/app/components/PublicSiteShell";

export default function HomePage() {
  return (
    <PublicSiteShell
      eyebrow="Homeschool-first workflow"
      heroTitle="Start with one simple learning moment, then let EduDecks guide what comes next."
      heroText="EduDecks helps nervous homeschool parents begin gently. Try one small learning moment first, then move into planning, calendar, capture, reporting, and building a portfolio when you are ready. We'll start with a simple weekly plan for your child."
      heroMicrocopy="No signup needed to try it first."
      heroBadges={[]}
      primaryCta={{ label: "Start your first learning moment", href: "/start" }}
      secondaryCta={null}
      headerAction={{ label: "Sign in", href: "/login" }}
      footerPrimaryCta={null}
      footerSecondaryCta={null}
      asideTitle="Why families feel calmer"
      asideText="You do not need to feel like a teacher, planner, or assessor on day one. Start with one real moment, and EduDecks helps you shape the next step without turning home into school."
    >
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
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 0.4,
            color: "rgba(255,255,255,0.82)",
            marginBottom: 10,
          }}
        >
          Most families start here ↓
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 12 }}>
          Start your first learning moment
        </div>
        <div style={{ marginBottom: 18, opacity: 0.95, lineHeight: 1.7, maxWidth: 760 }}>
          One small step is enough. Try a simple learning moment first, then EduDecks helps you
          shape what to plan, what to keep, and what to turn into a report later.
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href="/start"
            style={{
              ...publicButtonStyle(true),
              background: "#ffffff",
              color: "#2563eb",
              border: "1px solid #ffffff",
            }}
          >
            Start your first learning moment
          </Link>
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.84)",
            fontWeight: 700,
          }}
        >
          Takes less than 30 seconds · You can change this later
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gap: 6,
            maxWidth: 360,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.74)",
            }}
          >
            What happens next
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#ffffff", fontWeight: 700 }}>
            1. Add one small plan
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#ffffff", fontWeight: 700 }}>
            2. Capture what happens
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#ffffff", fontWeight: 700 }}>
            3. We build your record for you
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Link
            href="/get-started"
            style={{
              color: "rgba(255,255,255,0.88)",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "underline",
            }}
          >
            See how it works
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
