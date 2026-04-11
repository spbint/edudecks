"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import {
  loadFamilyWorkspace,
  resolveEffectiveActiveLearnerId,
  setActiveLearnerId,
  type FamilyLearner,
} from "@/lib/familyWorkspace";
import {
  DEFAULT_FAMILY_SETTINGS,
  loadChildrenFromLocalStorage,
  loadSettingsFromLocalStorage,
  type FamilySettings,
} from "@/lib/familySettings";
import { supabase } from "@/lib/supabaseClient";

type EvidenceRow = {
  id: string;
  student_id: string | null;
  created_at?: string | null;
};

type ReportRow = {
  id: string;
  updated_at?: string | null;
};

type LearnerTile = {
  id: string;
  name: string;
  year: string;
  captures: number;
  readiness: string;
};

type PlannerRow = {
  studentId: string;
  updatedAt?: string;
};

const LOCAL_PLAN_KEY = "edudecks_plan";

async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  label: string,
  ms = 8000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${ms}ms.`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function loadPlannerRows(): PlannerRow[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_PLAN_KEY);
    if (!raw) return [];

    return Object.values(
      JSON.parse(raw) as Record<string, { studentId?: string; updatedAt?: string }>,
    )
      .map((item) => ({
        studentId: safe(item.studentId),
        updatedAt: safe(item.updatedAt),
      }))
      .filter((item) => item.studentId);
  } catch {
    return [];
  }
}

function buildLocalLearners(): FamilyLearner[] {
  return loadChildrenFromLocalStorage().map((child) => {
    const yearLevel = safe(child.year_level);
    const yearLabel =
      safe(child.yearLabel) || (yearLevel ? `Year ${yearLevel}` : "");

    return {
      id: child.id,
      label: child.label,
      yearLabel,
      year_level: yearLevel ? Number(yearLevel) || null : null,
      connectedAt: child.connectedAt ?? null,
    };
  });
}

function buildLocalProfile(): FamilySettings {
  return {
    ...DEFAULT_FAMILY_SETTINGS,
    ...loadSettingsFromLocalStorage(),
  };
}

function ChildTile({ child, isDefault }: { child: LearnerTile; isDefault: boolean }) {
  return (
    <div style={S.childCard}>
      <div style={S.childHeader}>
        <div>
          <div style={S.childName}>{child.name}</div>
          <div style={S.childMeta}>{child.year}</div>
        </div>
        {isDefault ? <span style={S.defaultChip}>Default learner</span> : null}
      </div>

      <div style={S.childStats}>
        <div style={S.statPill}>
          <span style={S.statLabel}>Captures</span>
          <span style={S.statValue}>{child.captures}</span>
        </div>
        <div style={S.statPill}>
          <span style={S.statLabel}>Readiness</span>
          <span style={S.statValue}>{child.readiness}</span>
        </div>
      </div>

      <div style={S.childActions}>
        <Link href="/calendar" style={S.smallPrimaryButton}>
          Build learning block
        </Link>
        <Link href="/capture" style={S.smallSecondaryButton}>
          Capture learning
        </Link>
      </div>
    </div>
  );
}

function WorkflowRibbon() {
  const items = [
    { label: "Home", href: "/family", active: true },
    { label: "Calendar", href: "/calendar" },
    { label: "Planner", href: "/planner" },
    { label: "Capture", href: "/capture" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Reports", href: "/reports" },
    { label: "Output", href: "/reports/output" },
  ];

  return (
    <div style={S.ribbon}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          <Link
            href={item.href}
            style={item.active ? S.ribbonItemActive : S.ribbonItem}
          >
            <span style={S.ribbonIndex}>{index + 1}</span>
            {item.label}
          </Link>
          {index < items.length - 1 ? <span style={S.ribbonArrow}>→</span> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function FamilyHomePage() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [learners, setLearners] = useState<FamilyLearner[]>([]);
  const [defaultLearnerId, setDefaultLearnerId] = useState("");
  const [captureRows, setCaptureRows] = useState<EvidenceRow[]>([]);
  const [reportRows, setReportRows] = useState<ReportRow[]>([]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      setBusy(true);
      setError("");

      try {
        const workspace = await withTimeout(
          loadFamilyWorkspace(),
          "load family workspace",
        );

        if (!mounted) return;

        const nextLearners = workspace.learners ?? [];
        const nextProfile = workspace.profile ?? buildLocalProfile();

        if (!nextLearners.length) {
          const localLearners = buildLocalLearners();
          setLearners(localLearners);

          const effectiveLearnerId = resolveEffectiveActiveLearnerId(
            localLearners,
            nextProfile,
          );
          setDefaultLearnerId(effectiveLearnerId);

          if (effectiveLearnerId) {
            setActiveLearnerId(effectiveLearnerId);
          }

          setCaptureRows([]);
          setReportRows([]);
          return;
        }

        setLearners(nextLearners);

        const effectiveLearnerId = resolveEffectiveActiveLearnerId(
          nextLearners,
          nextProfile,
        );
        setDefaultLearnerId(effectiveLearnerId);

        if (effectiveLearnerId) {
          setActiveLearnerId(effectiveLearnerId);
        }

        if (!workspace.userId) {
          setCaptureRows([]);
          setReportRows([]);
          return;
        }

        const learnerIds = nextLearners
          .map((learner) => learner.id)
          .filter((id) => !id.startsWith("local-"));

        if (!learnerIds.length) {
          setCaptureRows([]);
          setReportRows([]);
          return;
        }

        const [evidenceRes, reportRes] = await withTimeout(
          Promise.all([
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
          ]),
          "load family evidence and reports",
        );

        if (!mounted) return;

        setCaptureRows((evidenceRes.data ?? []) as EvidenceRow[]);
        setReportRows((reportRes.data ?? []) as ReportRow[]);
      } catch (err) {
        console.error("Family workspace load failed", err);
        if (!mounted) return;

        const localLearners = buildLocalLearners();
        const localProfile = buildLocalProfile();

        if (localLearners.length) {
          setLearners(localLearners);

          const effectiveLearnerId = resolveEffectiveActiveLearnerId(
            localLearners,
            localProfile,
          );
          setDefaultLearnerId(effectiveLearnerId);

          if (effectiveLearnerId) {
            setActiveLearnerId(effectiveLearnerId);
          }

          setCaptureRows([]);
          setReportRows([]);
          setError("");
        } else {
          setLearners([]);
          setDefaultLearnerId("");
          setCaptureRows([]);
          setReportRows([]);
          setError("We could not load the family workspace right now.");
        }
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
      const captures = captureRows.filter(
        (row) => row.student_id === learner.id,
      ).length;

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

  const nextLearner =
    learnerTiles.find((learner) => learner.id === defaultLearnerId) ||
    learnerTiles[0] ||
    null;

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
        <WorkflowRibbon />

        <section style={S.section}>
          <div style={S.sectionTitle}>Your learners</div>

          {busy ? (
            <div style={S.card}>
              <div style={S.cardText}>Loading linked learners…</div>
            </div>
          ) : learnerTiles.length ? (
            <div style={S.childGrid}>
              {learnerTiles.map((child) => (
                <ChildTile
                  key={child.id}
                  child={child}
                  isDefault={child.id === defaultLearnerId}
                />
              ))}
            </div>
          ) : error ? (
            <div style={S.errorCard}>{error}</div>
          ) : (
            <div style={S.card}>
              <div style={S.cardText}>
                No learners are linked yet. Add a learner once in profile and the
                family workspace will follow everywhere.
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

          <div style={S.summaryGrid}>
            <div style={S.summaryCard}>
              <div style={S.summaryTitle}>Planning</div>
              <div style={S.summaryText}>
                {recentPlanCount > 0
                  ? `${recentPlanCount} saved planner moment(s)`
                  : "No planner work saved yet"}
              </div>
            </div>

            <div style={S.summaryCard}>
              <div style={S.summaryTitle}>Recent captures</div>
              <div style={S.summaryText}>
                {recentCaptureCount > 0
                  ? `${recentCaptureCount} capture(s) linked`
                  : "No captures linked yet"}
              </div>
            </div>

            <div style={S.summaryCard}>
              <div style={S.summaryTitle}>Portfolio</div>
              <div style={S.summaryText}>
                {recentCaptureCount > 0
                  ? "Building from captured learning"
                  : "Waiting for the first captured moment"}
              </div>
            </div>

            <div style={S.summaryCard}>
              <div style={S.summaryTitle}>Reports</div>
              <div style={S.summaryText}>
                {recentReportCount > 0
                  ? `${recentReportCount} report draft(s)`
                  : "Not started"}
              </div>
            </div>
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionTitle}>Next best step</div>
          <div style={S.nextStepCard}>
            <div style={S.cardText}>
              {nextLearner
                ? `Next, place one calm learning block for ${nextLearner.name} in Calendar, then capture one real moment from the week.`
                : "Add one learner in profile to begin shaping the week."}
            </div>

            <div style={S.nextStepActions}>
              {nextLearner ? (
                <>
                  <Link href="/calendar" style={S.smallPrimaryButton}>
                    Go to calendar
                  </Link>
                  <Link href="/capture" style={S.smallSecondaryButton}>
                    Capture learning
                  </Link>
                </>
              ) : (
                <Link href="/profile#manage-family" style={S.smallPrimaryButton}>
                  Manage family
                </Link>
              )}
            </div>
          </div>
        </section>

        <section style={S.section}>
          <div style={S.sectionTitle}>Recent learning</div>
          <div style={S.card}>
            <div style={S.cardText}>
              {recentCaptureCount > 0
                ? `You have ${recentCaptureCount} captured learning moment(s). Open Portfolio to review the strongest record.`
                : "No recent learning yet. Capture one real moment to begin your story."}
            </div>
          </div>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { display: "grid", gap: 18, paddingBottom: 64 },
  ribbon: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
  },
  ribbonItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    borderRadius: 14,
    border: "1px solid #dbe3f0",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: 14,
  },
  ribbonItemActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    borderRadius: 14,
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "#ffffff",
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: 14,
  },
  ribbonIndex: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: 999,
    background: "rgba(255,255,255,0.18)",
    fontSize: 11,
    fontWeight: 900,
  },
  ribbonArrow: {
    color: "#94a3b8",
    fontWeight: 700,
  },
  section: { display: "grid", gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
  },
  errorCard: {
    border: "1px solid #fdba74",
    borderRadius: 18,
    background: "#fff7ed",
    color: "#9a3412",
    padding: 16,
    fontSize: 14,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 1.65,
    color: "#475569",
  },
  childGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 14,
  },
  childCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
    display: "grid",
    gap: 12,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  childHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  childName: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
  },
  childMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
  },
  defaultChip: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
  },
  childStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  statPill: {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    borderRadius: 999,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: "8px 10px",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 700,
  },
  statValue: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: 900,
  },
  childActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
    gap: 14,
  },
  summaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
    display: "grid",
    gap: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#0f172a",
  },
  summaryText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 1.55,
  },
  nextStepCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 16,
    display: "grid",
    gap: 14,
  },
  nextStepActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  smallPrimaryButton: {
    textDecoration: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#ffffff",
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: 14,
  },
  smallSecondaryButton: {
    textDecoration: "none",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#0f172a",
    padding: "10px 14px",
    fontWeight: 800,
    fontSize: 14,
  },
};