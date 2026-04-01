"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

export default function PricingPage() {
  return (
    <PublicSiteShell
      eyebrow="Start free, grow when it matters"
      heroTitle="Start free. Build your child’s learning record with confidence."
      heroText="EduDecks is designed to help families begin without pressure. You can capture learning, build evidence, and explore reporting — all before needing to upgrade."
      heroBadges={["Begin free", "No pressure", "Family-first", "Grow later"]}
      primaryCta={{ label: "Start with one learning moment", href: "/capture" }}
      secondaryCta={{ label: "See How It Works", href: "/get-started" }}
      asideTitle="Why it's free to start"
      asideText="Families need to build confidence first. EduDecks becomes more valuable over time — not on day one."
    >
      {/* FREE PLAN */}
      <section style={{ ...publicCardStyle(), marginBottom: 24 }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          Start free
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#475569",
            marginBottom: 18,
            maxWidth: 720,
          }}
        >
          You can begin building your child’s learning record today — without
          needing to commit to a full system. Start simple, and grow when it
          becomes useful.
        </div>

        <div
          style={{
            border: "1px solid #bfdbfe",
            borderRadius: 18,
            padding: 18,
            background: "#eff6ff",
          }}
        >
          <div style={{ marginBottom: 10 }}>
            <span style={publicPill("#dbeafe", "#1d4ed8")}>Free</span>
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            $0
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#475569",
              marginBottom: 16,
            }}
          >
            Everything you need to begin capturing and building your child’s
            learning story.
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
            {[
              "Capture learning moments quickly",
              "Build a simple portfolio over time",
              "Explore how reports come together",
              "Understand your child’s learning progress",
              "Start without pressure or complexity",
            ].map((feature) => (
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

          <Link href="/capture" style={publicButtonStyle(true)}>
            Start with one learning moment
          </Link>
        </div>
      </section>

      {/* VALUE EXPLANATION */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, 0.9fr)",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div style={publicCardStyle()}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              marginBottom: 10,
              color: "#0f172a",
            }}
          >
            What you’re really building
          </div>

          <div style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
            EduDecks is not just a tool. It helps you build a clear, calm, and
            credible record of your child’s learning over time.
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              "A clear record of real learning",
              "Confidence in your homeschool approach",
              "Evidence that grows over time",
              "Calm, structured reporting when needed",
              "A system that supports — not pressures",
            ].map((item) => (
              <div
                key={item}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  background: "#f8fafc",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={publicCardStyle()}>
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              fontWeight: 800,
              color: "#64748b",
              marginBottom: 8,
            }}
          >
            No pressure
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              marginBottom: 10,
              color: "#0f172a",
            }}
          >
            You do not need everything in place on day one
          </div>

          <div style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
            Most families begin with one or two simple records. That is enough to
            start building clarity and confidence.
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {[
              "Start small and build steadily",
              "Capture learning as it happens",
              "Let the system grow with your child",
              "Upgrade only when it becomes useful",
            ].map((item) => (
              <div
                key={item}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "12px 14px",
                  background: "#ffffff",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUTURE SIGNAL */}
      <section
        style={{
          ...publicCardStyle(),
          background:
            "linear-gradient(135deg, rgba(79,124,240,0.06) 0%, rgba(139,124,246,0.06) 100%)",
          border: "1px solid #bfdbfe",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            marginBottom: 10,
            color: "#0f172a",
          }}
        >
          As your system grows, more support will become available
        </div>

        <div style={{ fontSize: 14, color: "#334155", marginBottom: 18 }}>
          Future upgrades will support deeper planning, stronger reporting, and
          advanced tools — but only when they actually help your workflow.
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {[
            "More advanced reporting tools",
            "Planning and guidance layers",
            "Richer evidence capture options",
            "Premium family workflow features",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "12px 14px",
                background: "#ffffff",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          <Link href="/capture" style={publicButtonStyle(true)}>
            Start free
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}