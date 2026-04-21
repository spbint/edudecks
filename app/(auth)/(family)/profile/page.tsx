"use client";

import React from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";

export default function FamilyProfilePage() {
  const { workspace, activeLearner } = useFamilyWorkspace();

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Profile"
      heroTitle="Keep learner details tidy and connected"
      heroText="Manage learners and confirm the active learner for the wider workflow."
      heroAsideTitle="Family workspace"
      heroAsideText="Profile now focuses on learner management and recent family activity."
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
              <div style={styles.summaryLabel}>Currently viewing</div>
              <div style={styles.summaryValue}>{activeLearner?.label || "Not set yet"}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>Linked learners</div>
              <div style={styles.summaryValue}>{workspace.learners.length}</div>
            </div>
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18, paddingBottom: 56 },
  section: { display: "grid", gap: 14 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  summaryCard: { border: "1px solid #e5e7eb", borderRadius: 18, background: "#ffffff", padding: 16, display: "grid", gap: 8 },
  summaryLabel: { fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
};
