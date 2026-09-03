"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

const INCLUDED_FEATURES = [
  "Plan learning across the week and use My Day",
  "Capture learning moments, including photos and notes",
  "Build a learner Portfolio from saved evidence",
  "Use My Learna to understand the learning record",
  "Prepare and create useful learning reports and PDFs",
] as const;

export default function PricingPage() {
  return (
    <PublicSiteShell
      eyebrow="Free to use"
      heroTitle="MyLearna Homeschool is free to use."
      heroText="Plan learning, capture what happens, build portfolios and create reports in one private family space — with no subscription or credit card required."
      heroBadges={["$0", "No subscription", "No credit card", "Private family space"]}
      primaryCta={{ label: "Create your free family space", href: "/start-free?source=pricing-primary-family-space" }}
      secondaryCta={{ label: "See how learning becomes a report", href: "/demo?source=pricing-secondary-demo" }}
      asideTitle="One simple price"
      asideText="There are no paid tiers for MyLearna Homeschool. The Homeschool product is currently available at $0."
    >
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div style={{ marginBottom: 10 }}>
          <span style={publicPill("#dbeafe", "#1d4ed8")}>Free</span>
        </div>

        <div style={{ fontSize: 34, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
          $0
        </div>

        <h2 style={{ margin: "0 0 10px", fontSize: 24, lineHeight: 1.2, color: "#0f172a" }}>
          Use MyLearna Homeschool without a paid plan.
        </h2>

        <p style={{ margin: "0 0 18px", fontSize: 15, lineHeight: 1.6, color: "#475569", maxWidth: 760 }}>
          Create your family space and use the Homeschool features currently available. There is no subscription to choose and no upgrade tier to unlock.
        </p>

        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          {INCLUDED_FEATURES.map((feature) => (
            <div
              key={feature}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "12px 14px",
                background: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
                color: "#334155",
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        <Link href="/start-free?source=pricing-card-family-space" style={publicButtonStyle(true)}>
          Create your free family space
        </Link>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <div style={publicCardStyle()}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10, color: "#0f172a" }}>
            What free means
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
            You can build a real homeschool learning record without entering payment details or choosing between product tiers.
          </p>
        </div>

        <div style={publicCardStyle()}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10, color: "#0f172a" }}>
            Use it at your pace
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
            Start with one learner and one learning moment, then keep using the same connected Plan → Capture → Portfolio → Report workflow as your records build.
          </p>
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
        <h2 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>See the learning record come together</h2>
        <p style={{ margin: 0, fontSize: 14, color: "#334155", lineHeight: 1.6, maxWidth: 760 }}>
          Explore the fictional Carter family to see how a learning moment moves from today into a Portfolio and a report, or create your own private family space now.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/demo?source=pricing-bottom-demo" style={publicButtonStyle(true)}>
            See how learning becomes a report
          </Link>
          <Link href="/start-free?source=pricing-bottom-family-space" style={publicButtonStyle(false)}>
            Create your free family space
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
