"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import { type FamilySettings } from "@/lib/familySettings";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  title?: string | null;
  summary?: string | null;
  created_at?: string | null;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatTimestamp(value: string | null | undefined) {
  const clean = safe(value);
  if (!clean) return "Just now";

  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return clean;

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function FamilyProfilePage() {
  const { workspace, activeLearner } = useFamilyWorkspace();
  const [recentEvidence, setRecentEvidence] = useState<EvidenceRow[]>([]);

  const profile = workspace.profile as FamilySettings;

  useEffect(() => {
    let mounted = true;

    async function hydrateReadModels() {
      if (!workspace.userId || !hasSupabaseEnv) {
        if (mounted) {
          setRecentEvidence([]);
        }
        return;
      }

      const learnerIds = workspace.learners
        .map((learner) => learner.id)
        .filter((id) => !id.startsWith("local-"));

      if (!learnerIds.length) {
        if (mounted) {
          setRecentEvidence([]);
        }
        return;
      }

      try {
        const evidenceRes = await supabase
          .from("evidence_entries")
          .select("id,student_id,title,summary,created_at")
          .in("student_id", learnerIds)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(6);

        if (!mounted) return;

        if (evidenceRes.error) {
          console.error("profile read model hydrate failed", evidenceRes.error);
          setRecentEvidence([]);
          return;
        }

        setRecentEvidence((evidenceRes.data ?? []) as EvidenceRow[]);
      } catch (readError) {
        console.error("profile read model hydrate failed", readError);
        if (mounted) {
          setRecentEvidence([]);
        }
      }
    }

    void hydrateReadModels();

    return () => {
      mounted = false;
    };
  }, [workspace.learners, workspace.userId]);

  const learnerNameById = useMemo(
    () =>
      new Map(
        workspace.learners.map((learner) => [
          learner.id,
          safe(learner.label) || "Unnamed learner",
        ]),
      ),
    [workspace.learners],
  );

  const effectiveLearningConfig = useMemo(
    () => resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner),
    [activeLearner, workspace.profile],
  );

  return (
    <FamilyTopNavShell
      subtitle="My Profile"
      heroTitle="Keep family details visible and current"
      heroText="Use this view to confirm the active learner, see the resolved learning setup, and keep recent evidence close without leaving the shared family workspace."
      heroAsideTitle="Shared family workspace"
      heroAsideText="Profile stays on the shared family shell, while family-wide defaults remain in My Family and My Settings."
    >
      <div style={S.page}>
        <section style={S.section}>
          <div style={S.sectionHeader}>
            <div>
              <div style={S.eyebrow}>Family summary</div>
              <h2 style={S.sectionTitle}>Current profile state</h2>
              <div style={S.helperText}>
                The active learner inherits family defaults unless a learner override is set in My Family.
              </div>
            </div>
          </div>

          <div style={S.summaryGrid}>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Current learner</div>
              <div style={S.summaryValue}>
                {activeLearner?.label || "No learner selected"}
              </div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Framework</div>
              <div style={S.summaryValue}>
                {effectiveLearningConfig.frameworkLabel}
              </div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Jurisdiction</div>
              <div style={S.summaryValue}>
                {effectiveLearningConfig.jurisdictionLabel}
              </div>
            </div>
            <div style={S.summaryCard}>
              <div style={S.summaryLabel}>Reporting mode</div>
              <div style={S.summaryValue}>
                {effectiveLearningConfig.reportingMode}
              </div>
            </div>
          </div>

          <div style={S.actionRow}>
            <Link href="/family" style={S.linkButton}>
              Open My Family
            </Link>
            <Link href="/settings" style={S.linkButton}>
              Open My Settings
            </Link>
          </div>

          <div style={S.infoCard}>
            <div style={S.summaryLabel}>Workspace mode</div>
            <div style={S.helperText}>
              {workspace.storageMode === "database"
                ? "Connected family workspace"
                : "Local family workspace snapshot"}
            </div>
            <div style={S.helperText}>
              {safe(profile.family_display_name) || "MyLearna Family"}
            </div>
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionHeader}>
            <div>
              <div style={S.eyebrow}>Learning record</div>
              <h2 style={S.sectionTitle}>Recent learning</h2>
              <div style={S.helperText}>
                The latest evidence tied to learners in this shared family workspace.
              </div>
            </div>
          </div>

          <div style={S.activityGridSingle}>
            {recentEvidence.length ? (
              recentEvidence.map((row) => (
                <div key={row.id} style={S.learningRow}>
                  <div style={S.learningRowText}>
                    <div style={S.cardTitle}>
                      {safe(row.title) || "Untitled learning"}
                    </div>
                    <div style={S.helperText}>
                      {learnerNameById.get(safe(row.student_id)) || "Unknown learner"}
                      {" - "}
                      {formatTimestamp(row.created_at)}
                    </div>
                    {safe(row.summary) ? (
                      <div style={S.activityRow}>{safe(row.summary)}</div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div style={S.emptyCard}>
                <div style={S.cardTitle}>No learning captured yet</div>
                <div style={S.helperText}>
                  Recent evidence will appear here once a learning moment is saved.
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18, paddingBottom: 56 },
  section: { display: "grid", gap: 14 },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "end",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#64748b",
  },
  sectionTitle: { margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" },
  helperText: { fontSize: 13, lineHeight: 1.5, color: "#64748b" },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 12,
  },
  summaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
    display: "grid",
    gap: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  linkButton: {
    textDecoration: "none",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    background: "#ffffff",
    color: "#0f172a",
    padding: "11px 14px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  infoCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
    display: "grid",
    gap: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: 900, color: "#0f172a" },
  activityGridSingle: { display: "grid", gap: 12 },
  learningRow: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#f8fafc",
    padding: 14,
    display: "grid",
    gap: 8,
  },
  learningRowText: { display: "grid", gap: 4 },
  activityRow: { fontSize: 14, lineHeight: 1.55, color: "#334155" },
  emptyCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 18,
    display: "grid",
    gap: 8,
  },
};
