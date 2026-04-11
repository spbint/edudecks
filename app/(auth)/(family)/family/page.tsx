"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  loadFamilyWorkspace,
  syncEffectiveActiveLearner,
  type FamilyLearner,
} from "@/lib/familyWorkspace";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  created_at?: string | null;
};

type ReportRow = {
  id: string;
  updated_at?: string | null;
};

type SavedPlan = {
  studentId: string;
  updatedAt: string;
};

type LearnerTile = {
  id: string;
  name: string;
  year: string;
  captures: number;
  readiness: string;
};

const LOCAL_PLAN_KEY = "edudecks_plan";

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

function ChildTile({ child }: { child: LearnerTile }) {
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

export default function FamilyPage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [learners, setLearners] = useState<FamilyLearner[]>([]);
  const [captureRows, setCaptureRows] = useState<EvidenceRow[]>([]);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);
  const [defaultLearnerId, setDefaultLearnerId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      setBusy(true);
      setError("");

      try {
        const workspace = await loadFamilyWorkspace();
        if (!mounted) return;

        setLearners(workspace.learners);
        setDefaultLearnerId(syncEffectiveActiveLearner(workspace.learners, workspace.profile));

        if (!hasSupabaseEnv || !workspace.userId || !workspace.learners.length) {
          setBusy(false);
          return;
        }

        const learnerIds = workspace.learners.map((learner) => learner.id);
        const [evidenceRes, reportRes] = await Promise.all([
          supabase
            .from("evidence_entries")
            .select("id,student_id,created_at")
            .in("student_id", learnerIds)
            .order("created_at", { ascending: false })
            .limit(24),
          supabase
            .from("report_drafts")
            .select("id,updated_at")
            .eq("user_id", workspace.userId)
            .order("updated_at", { ascending: false })
            .limit(12),
        ]);

        if (!mounted) return;

        setCaptureRows((evidenceRes.data ?? []) as EvidenceRow[]);
        setReportRows((reportRes.data ?? []) as ReportRow[]);
      } catch (err) {
        console.error("Family workspace load failed", err);
        if (!mounted) return;
        setError("We could not load the family workspace right now.");
      } finally {
        if (mounted) setBusy(false);
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const learnerTiles = useMemo(() => {
    return learners.map((learner) => {
      const captures = captureRows.filter((row) => row.student_id === learner.id).length;
      const readiness =
        captures >= 4 ? "Strong" : captures >= 1 ? "Building" : "Ready to begin";

      return {
        id: learner.id,
        name: learner.label,
        year: learner.yearLabel || "Year level not set",
        captures,
        readiness,
      } satisfies LearnerTile;
    });
  }, [captureRows, learners]);

  const plannerRows = useMemo(() => loadPlannerRows(), []);
  const recentCaptureCount = captureRows.length;
  const recentPlanCount = plannerRows.length;
  const recentReportCount = reportRows.length;
  const nextLearner = learnerTiles.find((learner) => learner.id === defaultLearnerId) || learnerTiles[0] || null;

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Family Home"
      heroTitle="Keep the family rhythm calm and connected"
      heroText="Keep the next step visible across capture, planning, portfolio, and reporting without losing the wider family picture."
      heroAsideTitle="Family snapshot"
      heroAsideText="A calm, clear view of the current family workspace and the next connected step."
    >
      <div style={S.page}>
        <WorkflowRibbon current="/family" />

        <section style={S.section}>
          <div style={S.sectionTitle}>Your learners</div>

          {busy ? (
            <div style={S.card}>
              <div style={S.cardText}>Loading linked learners…</div>
            </div>
          ) : error ? (
            <div style={S.errorCard}>{error}</div>
          ) : learnerTiles.length ? (
            <div style={S.childGrid}>
              {learnerTiles.map((child) => (
                <ChildTile key={child.id} child={child} />
              ))}
            </div>
          ) : (
            <div style={S.card}>
              <div style={S.cardText}>
                No learners are linked yet. Add a learner once in profile and the family workspace will follow everywhere.
              </div>
              <div style={S.nextStepActions}>
                <Link href="/profile#manage-family" style={S.smallPrimaryButton}>
                  Go to profile
                </Link>
              </div>
            </div>
          )}
        </section>

        <section style={S.section}>
          <div style={S.sectionTitle}>This week</div>

          <div style={S.grid}>
            <div style={S.card}>
              <div style={S.cardTitle}>Planning</div>
              <div style={S.cardText}>
                {recentPlanCount ? `${recentPlanCount} saved planner update${recentPlanCount === 1 ? "" : "s"}` : "No planner work saved yet"}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Recent captures</div>
              <div style={S.cardText}>
                {recentCaptureCount ? `${recentCaptureCount} linked learning moment${recentCaptureCount === 1 ? "" : "s"}` : "No captures linked yet"}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Portfolio</div>
              <div style={S.cardText}>
                {recentCaptureCount ? "Building from real captured moments" : "Waiting for the first captured moment"}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>Reports</div>
              <div style={S.cardText}>
                {recentReportCount ? `${recentReportCount} report draft${recentReportCount === 1 ? "" : "s"} in progress` : "Not started"}
              </div>
            </div>
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionTitle}>Next best step</div>

          <div style={S.nextStepCard}>
            <div style={S.nextStepText}>
              {nextLearner
                ? `Keep ${nextLearner.name} moving by placing one small learning block in Calendar or capturing the next useful moment.`
                : "Add one learner in profile to begin shaping the week."}
            </div>

            <div style={S.nextStepActions}>
              <Link href={nextLearner ? "/calendar" : "/profile#manage-family"} style={S.smallPrimaryButton}>
                {nextLearner ? "Go to Calendar" : "Manage family"}
              </Link>
            </div>
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionTitle}>Recent learning</div>

          <div style={S.card}>
            <div style={S.cardText}>
              {recentCaptureCount
                ? `${recentCaptureCount} captured learning moment${recentCaptureCount === 1 ? "" : "s"} are now feeding the family workspace.`
                : "No recent learning yet. Capture one real moment to begin your story."}
            </div>
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

function loadPlannerRows(): SavedPlan[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_PLAN_KEY);
    if (!raw) return [];
    return Object.values(JSON.parse(raw) as Record<string, SavedPlan>);
  } catch {
    return [];
  }
}

const S: Record<string, React.CSSProperties> = {
  page: {
    display: "grid",
    gap: 28,
    padding: "0 0 32px",
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
    display: "grid",
    gap: 12,
  },
  errorCard: {
    border: "1px solid #fed7aa",
    borderRadius: 18,
    padding: 16,
    background: "#fff7ed",
    color: "#9a3412",
    fontSize: 14,
    lineHeight: 1.7,
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
