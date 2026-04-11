"use client";

import React from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";

/* ───────────────────────── MOCK DATA (TEMP) ───────────────────────── */

const children = [
  {
    id: "1",
    name: "Ava",
    year: "Year 3",
    captures: 2,
    readiness: "Building",
  },
];

/* ───────────────────────── WORKFLOW RIBBON ───────────────────────── */

const steps = [
  { label: "Home", href: "/family" },
  { label: "Calendar", href: "/calendar" },
  { label: "Planner", href: "/planner" },
  { label: "Capture", href: "/capture" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Reports", href: "/reports" },
  { label: "Output", href: "/authority" },
];

function WorkflowRibbon({ current }: { current: string }) {
  return (
    <div style={S.ribbonWrap}>
      <div style={S.ribbon}>
        {steps.map((step, i) => {
          const isActive = step.href === current;

          return (
            <React.Fragment key={step.href}>
              <Link
                href={step.href}
                style={{
                  ...S.step,
                  ...(isActive ? S.stepActive : {}),
                }}
              >
                <span style={S.stepNumber}>{i + 1}</span>
                {step.label}
              </Link>

              {i < steps.length - 1 && <span style={S.arrow}>→</span>}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── CHILD TILE ───────────────────────── */

function ChildTile({ child }: { child: (typeof children)[number] }) {
  return (
    <Link href={`/children/${child.id}`} style={S.childTile}>
      <div style={S.childTopRow}>
        <div>
          <div style={S.childName}>{child.name}</div>
          <div style={S.childMeta}>{child.year}</div>
        </div>

        <div style={S.childArrow}>→</div>
      </div>

      <div style={S.childStats}>
        <div>Captures: {child.captures}</div>
        <div>Status: {child.readiness}</div>
      </div>

      <div style={S.childHint}>Open learner profile</div>
    </Link>
  );
}

/* ───────────────────────── MAIN PAGE ───────────────────────── */

export default function FamilyPage() {
  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Family Home">
      <div style={S.page}>
        {/* HERO */}
        <section style={S.hero}>
          <div style={S.heroMain}>
            <div style={S.eyebrow}>Family workspace</div>
            <h1 style={S.heroTitle}>Keep the family rhythm calm and connected</h1>
            <p style={S.heroText}>
              Keep the next step visible across capture, planning, portfolio,
              and reporting without losing the wider family picture.
            </p>
          </div>

          <div style={S.heroSide}>
            <div style={S.eyebrow}>Family snapshot</div>
            <div style={S.heroSideText}>
              A calm, clear view of the current family workspace and the next
              connected step.
            </div>
          </div>
        </section>

        {/* WORKFLOW RIBBON */}
        <WorkflowRibbon current="/family" />

        {/* CHILDREN */}
        <section style={S.section}>
          <div style={S.sectionTitle}>Your learners</div>

          <div style={S.childGrid}>
            {children.map((child) => (
              <ChildTile key={child.id} child={child} />
            ))}
          </div>
        </section>

        {/* DASHBOARD SNAPSHOT */}
        <section style={S.section}>
          <div style={S.sectionTitle}>This week</div>

          <div style={S.grid}>
            <div style={S.card}>
              <div style={S.cardTitle}>Planning</div>
              <div style={S.cardText}>No blocks planned yet</div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Recent captures</div>
              <div style={S.cardText}>2 learning moments added</div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Portfolio</div>
              <div style={S.cardText}>Building steadily</div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Reports</div>
              <div style={S.cardText}>Not started</div>
            </div>
          </div>
        </section>

        {/* NEXT STEP */}
        <section style={S.section}>
          <div style={S.sectionTitle}>Next best step</div>

          <div style={S.nextStepCard}>
            <div style={S.nextStepText}>
              Add one small learning block in the Calendar to begin shaping your
              week.
            </div>

            <div style={S.nextStepActions}>
              <Link href="/calendar" style={S.smallPrimaryButton}>
                Go to Calendar
              </Link>
            </div>
          </div>
        </section>

        {/* RECENT LEARNING */}
        <section style={S.section}>
          <div style={S.sectionTitle}>Recent learning</div>

          <div style={S.card}>
            <div style={S.cardText}>
              No recent learning yet. Capture one moment to begin your story.
            </div>
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  page: {
    display: "grid",
    gap: 28,
    padding: "22px 24px 32px",
  },

  section: {
    display: "grid",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
  },

  hero: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
    background: "#f8fbff",
    border: "1px solid #dbe6f3",
    borderRadius: 24,
    padding: 22,
  },

  heroMain: {
    display: "grid",
    gap: 10,
    alignContent: "start",
  },

  heroSide: {
    display: "grid",
    gap: 12,
    alignContent: "start",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 20,
  },

  heroTitle: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.08,
    fontWeight: 900,
    letterSpacing: -0.5,
    color: "#0f172a",
  },

  heroText: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#475569",
    maxWidth: 760,
  },

  heroSideText: {
    fontSize: 15,
    lineHeight: 1.8,
    color: "#475569",
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.24em",
    color: "#64748b",
  },

  ribbonWrap: {
    display: "grid",
    gap: 12,
  },

  ribbon: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  step: {
    padding: "10px 14px",
    borderRadius: 14,
    background: "#ffffff",
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #e2e8f0",
    boxShadow: "0 6px 16px rgba(15,23,42,0.03)",
  },

  stepActive: {
    background: "#0f172a",
    color: "#ffffff",
    border: "1px solid #0f172a",
  },

  stepNumber: {
    fontSize: 12,
    opacity: 0.72,
    fontWeight: 900,
  },

  arrow: {
    opacity: 0.45,
    color: "#64748b",
    fontWeight: 700,
  },

  childGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },

  childTile: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    textDecoration: "none",
    color: "#0f172a",
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 12,
  },

  childTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
  },

  childName: {
    fontWeight: 800,
    fontSize: 18,
    lineHeight: 1.2,
  },

  childMeta: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    fontWeight: 600,
  },

  childArrow: {
    fontSize: 18,
    color: "#94a3b8",
    fontWeight: 700,
  },

  childStats: {
    fontSize: 14,
    display: "grid",
    gap: 6,
    color: "#334155",
    lineHeight: 1.5,
  },

  childHint: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2563eb",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },

  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  },

  cardTitle: {
    fontWeight: 800,
    marginBottom: 8,
    fontSize: 16,
    color: "#0f172a",
  },

  cardText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.6,
  },

  nextStepCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    background: "#f8fbff",
    display: "grid",
    gap: 14,
  },

  nextStepText: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#334155",
  },

  nextStepActions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  smallPrimaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 8px 18px rgba(15,23,42,0.12)",
  },
};