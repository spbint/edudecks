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
  label: "Join the free beta",
  href: "/beta",
} as const;

const HEADER_PRIMARY_CTA = {
  label: "Join beta",
  href: "/beta",
} as const;

const LIFECYCLE_STEPS = [
  {
    number: "1",
    title: "Plan",
    text: "Organise the week and connect programs to the calendar.",
  },
  {
    number: "2",
    title: "Capture",
    text: "Record what happened from daily learning blocks while it is still fresh.",
  },
  {
    number: "3",
    title: "Portfolio",
    text: "Choose the strongest evidence worth keeping over time.",
  },
  {
    number: "4",
    title: "Reports",
    text: "Prepare reports from selected records when you are ready.",
  },
] as const;

const VALUE_POINTS = [
  "See the week, daily learning, and records in one place.",
  "Build a real learning trail instead of rebuilding the story later.",
  "Move from planning to reports with records that stay connected.",
] as const;

const TRUST_POINTS = [
  "Your family learning records stay private to your account.",
  "Text-first capture is available now.",
  "Media uploads and advanced exports will come later with clear storage controls.",
] as const;

const FIRST_SESSION_STEPS = [
  "Add your learner",
  "Set your country and reporting context",
  "Plan your week",
  "Capture your first learning note",
] as const;

const HERO_PILLS = ["Plan", "Capture", "Portfolio", "Reports"] as const;

function sectionHeader(title: string, text?: string) {
  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 32,
          lineHeight: 1.08,
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
      title="MyLearna"
      eyebrow=""
      heroTitle="Homeschool planning, portfolios and reports made simpler"
      heroText="MyLearna helps homeschool families organise the week, capture learning as it happens, choose portfolio evidence, and prepare reports from real records."
      heroBadges={[...HERO_PILLS]}
      heroMicrocopy={
        <span>
          Ready to join? Request free beta access. Want to understand the flow first?
          Explore the public demo.
        </span>
      }
      asideTitle=""
      asideText=""
      asideItems={[]}
      heroAsideVisible={false}
      primaryCta={PRIMARY_CTA}
      secondaryCta={{ label: "Explore the demo", href: "/demo" }}
      headerAction={{ label: "Sign in", href: "/login" }}
      headerPrimaryAction={HEADER_PRIMARY_CTA}
      footerPrimaryCta={PRIMARY_CTA}
      footerSecondaryCta={{ label: "Explore the demo", href: "/demo" }}
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
        <div style={publicPill("#eff6ff", "#1d4ed8")}>Early access</div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.7,
            color: "#334155",
            maxWidth: 860,
            fontWeight: 700,
          }}
        >
          MyLearna is evolving with feedback from homeschooling families. Help shape the
          homeschool record system we&apos;re building with families.
        </p>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          marginBottom: isMobile ? 18 : 22,
          padding: isMobile ? 18 : isTablet ? 22 : 24,
          display: "grid",
          gap: 12,
          border: "1px solid #bfdbfe",
          background: "#ffffff",
        }}
      >
        <div style={publicPill("#eff6ff", "#1d4ed8")}>Public demo</div>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.7,
            color: "#334155",
            maxWidth: 880,
            fontWeight: 700,
          }}
        >
          See MyLearna in action with a fictional homeschool family. Explore
          planning, pathways, evidence, portfolios, data, reports and sample
          outputs - no account required.
        </p>
        <div>
          <Link href="/demo" style={publicButtonStyle(false)}>
            Explore the demo
          </Link>
        </div>
      </section>

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
        {sectionHeader(
          "A working homeschool record in four steps",
          "Keep the week, the learning notes, the portfolio, and the reports connected as your family moves through the year.",
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {LIFECYCLE_STEPS.map((step) => (
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: 18,
          marginBottom: isMobile ? 18 : 22,
        }}
      >
        <div
          style={{
            ...publicCardStyle(),
            padding: isMobile ? 18 : isTablet ? 24 : 28,
            display: "grid",
            gap: 18,
          }}
        >
          {sectionHeader(
            "Homeschool records without the paperwork spiral",
            "Use MyLearna to keep planning, daily learning, and long-term records moving in one practical flow.",
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {VALUE_POINTS.map((item, index) => (
              <div
                key={item}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: isMobile ? 16 : 18,
                  background: index === 1 ? "#f8fafc" : "#ffffff",
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: "#334155",
                  fontWeight: 800,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            borderRadius: 24,
            border: "1px solid #dbeafe",
            background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
            padding: isMobile ? 18 : isTablet ? 24 : 28,
            display: "grid",
            gap: 16,
          }}
        >
          <div style={publicPill("#eff6ff", "#1d4ed8")}>
            Built around private family records
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            MyLearna is built for private family learning records. Media uploads and
            downloadable exports will be introduced only after storage and privacy controls
            are ready.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {TRUST_POINTS.map((item) => (
              <div
                key={item}
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 16,
                  background: "#ffffff",
                  padding: "12px 14px",
                  color: "#334155",
                  fontSize: 14,
                  lineHeight: 1.6,
                  fontWeight: 700,
                }}
              >
                {item}
              </div>
            ))}
          </div>
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
        {sectionHeader(
          "Your first session",
          "The first win is simple: get one learner set up, plan the week, and capture the first learning note.",
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {FIRST_SESSION_STEPS.map((step, index) => (
            <div
              key={step}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                background: "#ffffff",
                padding: isMobile ? 16 : 18,
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 900,
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.35,
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                {step}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.65,
              color: "#475569",
              maxWidth: 720,
            }}
          >
            Ready to start? Create your account on the next screen. Existing users can sign in
            when they return.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href={PRIMARY_CTA.href}
              style={{
                ...publicButtonStyle(true),
                width: isMobile ? "100%" : undefined,
              }}
            >
              {PRIMARY_CTA.label}
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
