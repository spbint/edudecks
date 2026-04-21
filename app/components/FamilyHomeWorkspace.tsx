"use client";

import React from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";

export default function FamilyHomeWorkspace() {
  const { workspace, activeLearner } = useFamilyWorkspace();

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Family Home"
      heroTitle="Family home for learners, capture, and reporting"
      heroText="Manage learners, confirm the current learner, and move clearly into the next family workflow stage from one place."
      heroAsideTitle="Current workspace"
      heroAsideText="Use this page to orient the family, manage learners, and move into capture, planning, or reporting with the right learner in view."
    >
      <div style={styles.page}>
        <section style={styles.section}>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Family name</div>
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
              <div style={styles.summaryValue}>{workspace.learners.length}</div>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.eyebrow}>Next steps</div>
              <h2 style={styles.sectionTitle}>Move the family record forward</h2>
              <div style={styles.helperText}>
                Open the next workspace you need after reviewing family context.
              </div>
            </div>
          </div>

          <div style={styles.quickActionGrid}>
            {[
              { label: "Open planner", href: "/planner", detail: "Shape the next learning step." },
              { label: "Open portfolio", href: "/portfolio", detail: "Review the learning record." },
              { label: "Open reports", href: "/reports", detail: "See reporting progress." },
              { label: "Open settings", href: "/settings", detail: "Review family settings." },
            ].map((action) => (
              <Link key={action.label} href={action.href} style={styles.quickActionCard}>
                <div style={styles.cardTitle}>{action.label}</div>
                <div style={styles.helperText}>{action.detail}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18, paddingBottom: 56 },
  section: { display: "grid", gap: 14 },
  sectionHeader: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", flexWrap: "wrap" },
  eyebrow: { fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" },
  sectionTitle: { margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" },
  helperText: { fontSize: 13, lineHeight: 1.5, color: "#64748b" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  summaryCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 8 },
  summaryLabel: { fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  quickActionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 },
  quickActionCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 6, textDecoration: "none" },
  cardTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
};
