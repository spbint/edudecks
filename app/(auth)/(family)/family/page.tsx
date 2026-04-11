"use client";

import React from "react";
import Link from "next/link";
import FamilyTopNavShell, {
  FamilyCommandLayer,
} from "@/app/components/FamilyTopNavShell";

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
  { label: "Workspace", href: "/family" },
  { label: "Calendar", href: "/calendar" },
  { label: "Planner", href: "/planner" },
  { label: "Capture", href: "/capture" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Reports", href: "/reports" },
  { label: "Output", href: "/authority" },
];

function WorkflowRibbon({ current }: { current: string }) {
  return (
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
  );
}

/* ───────────────────────── CHILD TILE ───────────────────────── */

function ChildTile({ child }: any) {
  return (
    <Link href={`/children/${child.id}`} style={S.childTile}>
      <div style={S.childName}>{child.name}</div>
      <div style={S.childMeta}>{child.year}</div>

      <div style={S.childStats}>
        <div>Captures: {child.captures}</div>
        <div>Status: {child.readiness}</div>
      </div>
    </Link>
  );
}

/* ───────────────────────── MAIN PAGE ───────────────────────── */

export default function FamilyPage() {
  return (
    <FamilyTopNavShell title="EduDecks Family" subtitle="Family Home">
      <div style={S.page}>

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
              <div>No blocks planned yet</div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Recent captures</div>
              <div>2 learning moments added</div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Portfolio</div>
              <div>Building steadily</div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Reports</div>
              <div>Not started</div>
            </div>
          </div>
        </section>

        {/* NEXT STEP */}
        <section style={S.section}>
          <div style={S.sectionTitle}>Next best step</div>

          <div style={S.nextStep}>
            Add one small learning block in the Calendar to begin shaping your week.
          </div>

          <Link href="/calendar" style={S.primaryButton}>
            Go to Calendar
          </Link>
        </section>

        {/* RECENT LEARNING */}
        <section style={S.section}>
          <div style={S.sectionTitle}>Recent learning</div>

          <div style={S.card}>
            No recent learning yet. Capture one moment to begin your story.
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: any = {
  page: {
    display: "grid",
    gap: 24,
    padding: "24px",
  },

  section: {
    display: "grid",
    gap: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
  },

  /* Ribbon */
  ribbon: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    background: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },

  step: {
    padding: "8px 12px",
    borderRadius: 10,
    background: "#fff",
    textDecoration: "none",
    color: "#111",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  stepActive: {
    background: "#0f172a",
    color: "#fff",
  },

  stepNumber: {
    fontSize: 12,
    opacity: 0.6,
  },

  arrow: {
    opacity: 0.4,
  },

  /* Children */
  childGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },

  childTile: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    textDecoration: "none",
    color: "#111",
    background: "#fff",
  },

  childName: {
    fontWeight: 800,
    fontSize: 16,
  },

  childMeta: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },

  childStats: {
    fontSize: 13,
    display: "grid",
    gap: 4,
  },

  /* Dashboard */
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    background: "#fff",
  },

  cardTitle: {
    fontWeight: 700,
    marginBottom: 6,
  },

  nextStep: {
    padding: 16,
    background: "#f1f5f9",
    borderRadius: 12,
  },

  primaryButton: {
    display: "inline-block",
    marginTop: 10,
    padding: "10px 14px",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 600,
  },
};