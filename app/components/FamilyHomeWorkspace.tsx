"use client";

import React from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";

export default function FamilyHomeWorkspace() {
  const { workspace, activeLearner } = useFamilyWorkspace();
  const totalLearners = workspace.learners.length;
  const savedRecordsLabel =
    workspace.storageMode === "database" ? "Synced to your family workspace" : "Using local family snapshot";

  return (
    <FamilyTopNavShell
      title="MyLearna"
      subtitle="My Learning"
      heroTitle="A personal learning overview for your family"
      heroText="See readiness, recent activity, and the next best move in one calm place. This is the new starting point for planning, curating evidence, and building reports."
      heroAsideTitle="Family snapshot"
      heroAsideText="Keep the current learner close, understand what is ready now, and move forward without needing to reconstruct the story from scratch."
    >
      <div style={styles.page}>
        <section style={styles.heroBand}>
          <div style={styles.heroPrimaryCard}>
            <div style={styles.eyebrow}>Readiness</div>
            <h2 style={styles.heroTitle}>Your learning system is ready for the next gentle step.</h2>
            <div style={styles.helperText}>
              Current learner: <strong>{activeLearner?.label || "Choose a learner in settings"}</strong>
            </div>
            <div style={styles.heroActions}>
              <Link href="/my-plan" style={styles.primaryButton}>
                Open My Plan
              </Link>
              <Link href="/capture" style={styles.secondaryButton}>
                Curate evidence
              </Link>
            </div>
          </div>

          <div style={styles.heroAsideCard}>
            <div style={styles.summaryLabel}>Coverage snapshot</div>
            <div style={styles.summaryValue}>{savedRecordsLabel}</div>
            <div style={styles.helperText}>
              MyLearna keeps planning, evidence, reports, and progress connected so each step stays easier to trust.
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Family</div>
              <div style={styles.summaryValue}>
                {workspace.profile.family_display_name || "Your family"}
              </div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Current learner</div>
              <div style={styles.summaryValue}>{activeLearner?.label || "Not set yet"}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Linked learners</div>
              <div style={styles.summaryValue}>{totalLearners}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Next best move</div>
              <div style={styles.summaryValue}>{activeLearner ? "Capture a fresh learning moment" : "Set your learner context"}</div>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.eyebrow}>Snapshots</div>
              <h2 style={styles.sectionTitle}>Your core spaces at a glance</h2>
              <div style={styles.helperText}>
                Use these cards to move into the next part of the workflow without losing context.
              </div>
            </div>
          </div>

          <div style={styles.quickActionGrid}>
            {[
              { label: "My Plan", href: "/my-plan", detail: "Shape the next learning step and keep the week practical." },
              { label: "My Portfolio", href: "/my-portfolio", detail: "Review the story your evidence is building." },
              { label: "My Reports", href: "/my-reports", detail: "Build clear reports from real learning records." },
              { label: "My Progress", href: "/my-progress", detail: "Review readiness, coverage snapshot, and suggested improvements." },
            ].map((action) => (
              <Link key={action.label} href={action.href} style={styles.quickActionCard}>
                <div style={styles.cardTitle}>{action.label}</div>
                <div style={styles.helperText}>{action.detail}</div>
              </Link>
            ))}
          </div>
        </section>

        <section style={styles.dashboardGrid}>
          <div style={styles.featureCard}>
            <div style={styles.summaryLabel}>My Plan snapshot</div>
            <div style={styles.cardTitle}>Keep the next week light and visible</div>
            <div style={styles.helperText}>
              Start with one or two meaningful blocks, then let the week take shape gently.
            </div>
            <Link href="/my-plan" style={styles.inlineLink}>Go to My Plan</Link>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.summaryLabel}>My Portfolio snapshot</div>
            <div style={styles.cardTitle}>Curate evidence as it accumulates</div>
            <div style={styles.helperText}>
              Review the moments that best show growth, confidence, and consistency.
            </div>
            <Link href="/my-portfolio" style={styles.inlineLink}>Open My Portfolio</Link>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.summaryLabel}>My Reports snapshot</div>
            <div style={styles.cardTitle}>Turn evidence into clearer family reporting</div>
            <div style={styles.helperText}>
              Build report drafts from the records you already have, then refine when you are ready.
            </div>
            <Link href="/my-reports" style={styles.inlineLink}>Build report</Link>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.summaryLabel}>My Progress snapshot</div>
            <div style={styles.cardTitle}>See readiness and your next best move</div>
            <div style={styles.helperText}>
              Keep an eye on what is complete, what needs strengthening, and what can wait.
            </div>
            <Link href="/my-progress" style={styles.inlineLink}>Review progress</Link>
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18, paddingBottom: 56 },
  heroBand: { display: "grid", gap: 16, gridTemplateColumns: "minmax(0,1.25fr) minmax(280px,0.75fr)" },
  heroPrimaryCard: {
    border: "1px solid #dbeafe",
    borderRadius: 24,
    background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(239,246,255,0.94) 62%, rgba(245,243,255,0.92) 100%)",
    padding: 24,
    display: "grid",
    gap: 12,
    boxShadow: "0 18px 40px rgba(15,23,42,0.05)",
  },
  heroAsideCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    background: "#ffffff",
    padding: 24,
    display: "grid",
    gap: 10,
    boxShadow: "0 14px 32px rgba(15,23,42,0.04)",
  },
  section: { display: "grid", gap: 14 },
  sectionHeader: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", flexWrap: "wrap" },
  eyebrow: { fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" },
  heroTitle: { margin: 0, fontSize: 30, lineHeight: 1.1, fontWeight: 900, color: "#0f172a" },
  sectionTitle: { margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" },
  helperText: { fontSize: 13, lineHeight: 1.5, color: "#64748b" },
  heroActions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 },
  primaryButton: {
    borderRadius: 999,
    background: "#0f172a",
    color: "#ffffff",
    textDecoration: "none",
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 800,
  },
  secondaryButton: {
    borderRadius: 999,
    border: "1px solid #dbeafe",
    background: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    padding: "12px 18px",
    fontSize: 14,
    fontWeight: 800,
  },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  summaryCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 8 },
  summaryLabel: { fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  quickActionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 },
  quickActionCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 6, textDecoration: "none" },
  cardTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  dashboardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 },
  featureCard: { border: "1px solid #e5e7eb", borderRadius: 20, background: "#ffffff", padding: 18, display: "grid", gap: 8 },
  inlineLink: { color: "#2563eb", fontSize: 14, fontWeight: 800, textDecoration: "none", marginTop: 4 },
};
