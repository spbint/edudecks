"use client";

import React from "react";
import Link from "next/link";
import PublicSiteShell, {
  publicButtonStyle,
  publicCardStyle,
  publicPill,
} from "@/app/components/PublicSiteShell";

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

export default function HomePage() {
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
          padding: 28,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        {sectionTitle(
          "Families / Homeschool",
          "Built for families and homeschool learning",
          "Capture learning simply, build a rich record of progress, and stay confident as reporting and reflection come together."
        )}
        {blockGrid(familyBlocks)}
        <div style={{ marginTop: 18 }}>
          <Link href="/start" style={publicButtonStyle(true)}>
            Start as a family
          </Link>
        </div>
      </section>

      <section
        id="schools"
        style={{
          ...publicCardStyle(),
          marginBottom: 24,
          padding: 28,
          background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
        }}
      >
        {sectionTitle(
          "Schools / Teachers",
          "Built for classrooms and schools",
          "From learner follow-up to class triage and leadership visibility, EduDecks helps schools focus attention where it matters most without the dashboard overload."
        )}
        {blockGrid(schoolBlocks)}
        <div style={{ marginTop: 18 }}>
          <Link href="/contact" style={publicButtonStyle(false)}>
            Explore the school view
          </Link>
        </div>
      </section>

      <section
        style={{
          ...publicCardStyle(),
          marginBottom: 24,
          padding: 28,
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
            gap: 16,
            marginBottom: 18,
          }}
        >
          {bridgeBlocks.map((item, index) => (
            <div
              key={item.title}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: 20,
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
          padding: 28,
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
          padding: 32,
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
            }}
          >
            Bring EduDecks to your school
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
