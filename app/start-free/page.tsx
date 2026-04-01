"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell from "@/app/components/PublicSiteShell";

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#ffffff",
    padding: 24,
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  };
}

function stepCardStyle(tone: "blue" | "green" | "amber" | "violet"): React.CSSProperties {
  const tones = {
    blue: {
      border: "#bfdbfe",
      bg: "#eff6ff",
      fg: "#1d4ed8",
    },
    green: {
      border: "#bbf7d0",
      bg: "#f0fdf4",
      fg: "#166534",
    },
    amber: {
      border: "#fed7aa",
      bg: "#fff7ed",
      fg: "#9a3412",
    },
    violet: {
      border: "#ddd6fe",
      bg: "#f5f3ff",
      fg: "#6d28d9",
    },
  };

  const t = tones[tone];

  return {
    border: `1px solid ${t.border}`,
    borderRadius: 18,
    background: t.bg,
    padding: 18,
    color: t.fg,
  };
}

function primaryButtonStyle(): React.CSSProperties {
  return {
    minHeight: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "1px solid #2563eb",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function secondaryButtonStyle(): React.CSSProperties {
  return {
    minHeight: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 800,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function infoRowStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#f8fafc",
    padding: "12px 14px",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#334155",
    fontWeight: 700,
  };
}

export default function StartFreePage() {
  return (
    <PublicSiteShell
      eyebrow="Start free"
      heroTitle="Begin simply. Build confidence steadily."
      heroText="EduDecks is designed so families can start with one child and one learning moment — not a full system on day one. You can grow into stronger records, portfolio, and reports over time."
      heroBadges={["Start free", "No pressure", "Family-first", "Build over time"]}
      primaryCta={{ label: "Create free account", href: "/signup" }}
      secondaryCta={{ label: "I already have an account", href: "/login" }}
      asideTitle="A calm way to begin"
      asideText="You do not need a polished setup, perfect evidence, or a complete plan before you begin. EduDecks is built to grow with your family."
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.05fr) minmax(320px,0.95fr)",
          gap: 22,
          alignItems: "start",
          marginBottom: 22,
        }}
      >
        <div style={cardStyle()}>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            What happens after you start free
          </div>

          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
              marginBottom: 18,
              maxWidth: 760,
            }}
          >
            The first goal is not to build everything. It is simply to begin.
            EduDecks helps you capture one useful learning moment, then build
            from there with clarity and confidence.
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div style={stepCardStyle("blue")}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.05,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Step 1
              </div>
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  marginBottom: 8,
                  color: "#0f172a",
                }}
              >
                Create your free account
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#334155",
                }}
              >
                Start with a simple family account so EduDecks can save your
                child records, portfolio moments, and reporting progress over
                time.
              </div>
            </div>

            <div style={stepCardStyle("green")}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.05,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Step 2
              </div>
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  marginBottom: 8,
                  color: "#0f172a",
                }}
              >
                Add your first child
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#334155",
                }}
              >
                One child profile is enough to begin. You do not need your full
                family structure perfectly set up before the system becomes
                useful.
              </div>
            </div>

            <div style={stepCardStyle("amber")}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.05,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Step 3
              </div>
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  marginBottom: 8,
                  color: "#0f172a",
                }}
              >
                Capture one learning moment
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#334155",
                }}
              >
                A short note about something your child did, understood, or
                improved is enough to start building a real learning record.
              </div>
            </div>

            <div style={stepCardStyle("violet")}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.05,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Step 4
              </div>
              <div
                style={{
                  fontSize: 18,
                  lineHeight: 1.2,
                  fontWeight: 900,
                  marginBottom: 8,
                  color: "#0f172a",
                }}
              >
                Grow into portfolio and reports later
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#334155",
                }}
              >
                As evidence grows, EduDecks helps you organise it, shape it into
                calm reports, and eventually move into stronger authority-ready
                workflows.
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link href="/signup" style={primaryButtonStyle()}>
              Create free account
            </Link>
            <Link href="/login" style={secondaryButtonStyle()}>
              I already have an account
            </Link>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              lineHeight: 1.6,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            No credit card required. Start free and build from there.
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={cardStyle()}>
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing: 1.05,
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 8,
              }}
            >
              Why families start here
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={infoRowStyle()}>
                You do not need perfect evidence before the system becomes useful.
              </div>
              <div style={infoRowStyle()}>
                You do not need to think like a teacher to get started.
              </div>
              <div style={infoRowStyle()}>
                You do not need a full-year plan before capturing real learning.
              </div>
              <div style={infoRowStyle()}>
                You remain in control of what is recorded, curated, and reported.
              </div>
            </div>
          </div>

          <div style={cardStyle()}>
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              This is the best first move if you are just getting started
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
              }}
            >
              EduDecks works best when families begin with real learning rather
              than trying to set up everything perfectly first. Start free, add
              one child, and capture one useful moment. The rest can grow later.
            </div>
          </div>

          <div style={cardStyle()}>
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 900,
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              Already started with EduDecks?
            </div>

            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "#475569",
                marginBottom: 14,
              }}
            >
              Sign back in to continue from your family dashboard, saved reports,
              and next recommended steps.
            </div>

            <Link href="/login" style={secondaryButtonStyle()}>
              Go to sign in
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}