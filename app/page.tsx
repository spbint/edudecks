"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

export default function HomePage() {
  return (
    <PublicSiteShell
      eyebrow="Homeschool-first workflow"
      heroTitle="Homeschool records that build confidence, not overwhelm."
      heroText="Capture meaningful learning, curate a strong portfolio, plan intentionally, and produce credible reports — all in one calm, homeschool-first workflow."
      heroBadges={["Capture", "Portfolio", "Planning", "Reporting"]}
      primaryCta={{ label: "Start Free", href: "/capture" }}
      secondaryCta={{ label: "Get Started", href: "/get-started" }}
      asideTitle="Why families switch"
      asideText="EduDecks Family helps families move beyond scattered notes, spreadsheets, and last-minute reporting panic into one connected system."
    >
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
          One connected workflow
        </div>
        <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, marginBottom: 16 }}>
          Instead of juggling separate tools, the whole family workflow connects.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {[
            ["Capture", "/capture"],
            ["Portfolio", "/portfolio"],
            ["Goals", "/goals"],
            ["Planner", "/planner"],
            ["Reports", "/reports"],
          ].map(([label, href]) => (
            <div key={label} style={publicCardStyle()}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{label}</div>
              <Link href={href} style={publicButtonStyle(false)}>
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
          Built for real homeschooling
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            "Mixed ages and flexible rhythms",
            "Classical, eclectic, unschooling, or hybrid",
            "Portfolio-based reporting support",
            "Authority-friendly documentation",
            "No school-at-home pressure",
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
          Start with one learning moment
        </div>
        <div style={{ marginBottom: 18, opacity: 0.95, lineHeight: 1.7 }}>
          You do not need perfect records. You just need a starting point.
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
            Open Quick Capture
          </Link>
          <Link
            href="/contact"
            style={{
              ...publicButtonStyle(false),
              background: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          >
            Join Waitlist
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}