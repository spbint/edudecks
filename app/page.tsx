"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";
import useIsMobile from "@/app/components/useIsMobile";

const familyBlocks = [
  {
    title: "Capture with confidence",
    text: "Save real learning moments as they happen.",
  },
  {
    title: "See the bigger picture",
    text: "Build a portfolio that shows growth over time.",
  },
  {
    title: "Report without overwhelm",
    text: "Turn evidence into calm, credible reporting.",
  },
];

const schoolBlocks = [
  {
    title: "For teachers",
    text: "See which learners need attention next and follow through with clarity.",
  },
  {
    title: "For leaders",
    text: "Understand where support, review pressure, or visibility needs attention across classes.",
  },
  {
    title: "For schools",
    text: "Build evidence, strengthen reporting readiness, and keep the whole system calmer and more actionable.",
  },
];

const familyProof = [
  "Capture moments in a few seconds, then let the record build calmly over time.",
  "See portfolio, reporting, and readiness form from real evidence instead of last-minute catch-up.",
];

const schoolProof = [
  "Move from learner follow-up to class triage and leadership visibility without changing systems.",
  "Keep attention on stale evidence, review pressure, and support needs without a chart wall.",
];

const bridgeBlocks = [
  {
    title: "Family",
    text: "What matters next for this child.",
  },
  {
    title: "Teacher",
    text: "Who needs attention next in this class.",
  },
  {
    title: "Leadership",
    text: "Where support is needed next across the school.",
  },
];

function sectionTitle(eyebrow: string, title: string, text: string) {
  return (
    <div style={{ marginBottom: 20, maxWidth: 780 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontSize: 32,
          lineHeight: 1.12,
          fontWeight: 900,
          color: "#0f172a",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.7,
          color: "#334155",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function blockGrid(items: { title: string; text: string }[]) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {items.map((item) => (
        <div key={item.title} style={publicCardStyle()}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            {item.title}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            {item.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function proofPanel(
  label: string,
  title: string,
  detail: string,
  points: string[],
  tone: "family" | "schools"
) {
  const background =
    tone === "family"
      ? "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)"
      : "linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%)";
  const border = tone === "family" ? "#e5e7eb" : "#bfdbfe";
  const accent = tone === "family" ? "#2563eb" : "#6d28d9";

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 20,
        padding: 20,
        background,
        boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          lineHeight: 1.2,
          fontWeight: 900,
          color: "#0f172a",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: "#475569",
          marginBottom: 14,
        }}
      >
        {detail}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {points.map((point, index) => (
          <div
            key={point}
            style={{
              border: "1px solid rgba(148,163,184,0.18)",
              borderRadius: 14,
              padding: "12px 14px",
              background: "#ffffff",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                marginTop: 4,
                flexShrink: 0,
                background:
                  index === 0 ? accent : tone === "family" ? "#0f766e" : "#2563eb",
              }}
            />
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "#334155",
                fontWeight: 700,
              }}
            >
              {point}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const isTablet = useIsMobile(1080);
  const isMobile = useIsMobile(720);

  return (
    <PublicSiteShell
      title="EduDecks"
      eyebrow="One calm learning operating system"
      heroTitle="Know what to do next, whether you are teaching one child or leading a whole school."
      heroText="EduDecks is a calm, evidence-led system for families, teachers, and school leaders who want clarity on what matters most next."
      heroMicrocopy="Choose your path to see how EduDecks works for your learning context."
      heroBadges={["Families / Homeschool", "Teachers", "School leaders"]}
      asideTitle="What EduDecks helps you do"
      asideText="Capture what matters, understand where attention is needed, and move forward with a clearer next step across home learning, classrooms, and schools."
      asideItems={[
        "Capture evidence without turning learning into admin",
        "See the next best move with calmer guidance",
        "Carry context from one role or page into the next",
        "Build confidence for reflection, reporting, and support",
      ]}
      primaryCta={{ label: "For Families / Homeschool", href: "/#families" }}
      secondaryCta={{ label: "For Schools / Teachers", href: "/#schools" }}
      headerAction={{ label: "Sign in", href: "/login" }}
      footerPrimaryCta={{ label: "Start as a family", href: "/start" }}
      footerSecondaryCta={{ label: "Bring EduDecks to your school", href: "/contact" }}
      showWorkflowStrip={false}
    >
      <section
        id="families"
        style={{
          ...publicCardStyle(),
          marginBottom: 24,
          padding: isMobile ? 18 : isTablet ? 24 : 28,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          scrollMarginTop: 116,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isTablet
              ? "minmax(0, 1fr)"
              : "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
            gap: isMobile ? 18 : 22,
            alignItems: "start",
          }}
        >
          <div>
            {sectionTitle(
              "Families / Homeschool",
              "Built for families and homeschool learning",
              "Capture learning simply, build a rich record of progress, and stay confident as reporting and reflection come together."
            )}
            {blockGrid(familyBlocks)}
            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Link
                href="/start"
                style={{
                  ...publicButtonStyle(true),
                  width: isMobile ? "100%" : undefined,
                }}
              >
                Start as a family
              </Link>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#64748b",
                  fontWeight: 700,
                  maxWidth: isMobile ? "100%" : 320,
                }}
              >
                Start with one learning moment, then let the record build.
              </div>
            </div>
          </div>
          <div>
            {proofPanel(
              "Family proof",
              "A calmer path from learning moment to trusted record",
              "The family flow is designed to feel guided from the start, not like a reporting system dropped into the home.",
              familyProof,
              "family"
            )}
          </div>
        </div>
      </section>

      <section
        id="schools"
        style={{
          ...publicCardStyle(),
          marginBottom: 24,
          padding: isMobile ? 18 : isTablet ? 24 : 28,
          background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
          scrollMarginTop: 116,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isTablet
              ? "minmax(0, 1fr)"
              : "minmax(0, 1.05fr) minmax(300px, 0.95fr)",
            gap: isMobile ? 18 : 22,
            alignItems: "start",
          }}
        >
          <div>
            {sectionTitle(
              "Schools / Teachers",
              "Built for classrooms and schools",
              "From learner follow-up to class triage and leadership visibility, EduDecks helps schools focus attention where it matters most without the dashboard overload."
            )}
            {blockGrid(schoolBlocks)}
            <div
              style={{
                marginTop: 18,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Link
                href="/contact"
                style={{
                  ...publicButtonStyle(false),
                  width: isMobile ? "100%" : undefined,
                }}
              >
                Explore the school view
              </Link>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#64748b",
                  fontWeight: 700,
                  maxWidth: isMobile ? "100%" : 320,
                }}
              >
                A good next step for school teams exploring a calmer rollout.
              </div>
            </div>
          </div>
          <div>
            {proofPanel(
              "School proof",
              "One connected operating layer across teaching and leadership",
              "EduDecks is built to keep learner follow-up, class attention, and school visibility connected rather than split across separate tools.",
              schoolProof,
              "schools"
            )}
          </div>
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          marginBottom: 24,
          padding: isMobile ? 18 : isTablet ? 24 : 28,
        }}
      >
        {sectionTitle(
          "The platform story",
          "One system. Different lenses.",
          "EduDecks works across the levels that matter."
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: isMobile ? 12 : 16,
            marginBottom: 18,
          }}
        >
          {bridgeBlocks.map((item, index) => (
            <div
              key={item.title}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: isMobile ? 16 : 20,
                background: index === 1 ? "#f8fafc" : "#ffffff",
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <span
                  style={publicPill(
                    index === 0 ? "#eff6ff" : index === 1 ? "#f8fafc" : "#f5f3ff",
                    index === 0 ? "#2563eb" : index === 1 ? "#334155" : "#6d28d9"
                  )}
                >
                  {item.title}
                </span>
              </div>
              <div
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                {item.text}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "#334155",
            maxWidth: 900,
            fontWeight: 700,
          }}
        >
          Different roles. One calm operating system for learning visibility, action, and progress.
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          marginBottom: 24,
          padding: isMobile ? 18 : isTablet ? 24 : 28,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        {sectionTitle(
          "Why it feels different",
          "Not another dashboard",
          "Most tools show data, add noise, and leave the hard decisions to you. EduDecks helps you focus on what matters now, act on the next best move, and build confidence across learning, support, and reporting."
        )}
      </section>

      <section
        style={{
          borderRadius: 28,
          padding: isMobile ? 20 : isTablet ? 24 : 32,
          marginBottom: 12,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          boxShadow: "0 18px 50px rgba(15,23,42,0.14)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.7)",
            marginBottom: 8,
          }}
        >
          Start with clarity
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.12,
            fontWeight: 900,
            marginBottom: 10,
            maxWidth: 720,
            ...(isMobile ? { fontSize: 30, lineHeight: 1.08 } : null),
          }}
        >
          Know what matters next, then move forward calmly.
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.82)",
            marginBottom: 18,
            maxWidth: 760,
          }}
        >
          EduDecks keeps one product identity across home learning, classrooms, and schools while
          giving each role the right lens on what needs attention next.
        </div>
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
            Start as a family
          </Link>
          <Link
            href="/contact"
            style={{
              ...publicButtonStyle(false),
              background: "transparent",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.28)",
              width: isMobile ? "100%" : undefined,
            }}
          >
            Bring EduDecks to your school
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
