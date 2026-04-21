"use client";

import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import {
  CoverageReadinessCard,
  InsightListCard,
  ProgressMetricCard,
  ProgressNextMoveCard,
  ProgressTrendCard,
  type TrendPoint,
} from "@/app/components/progress/ProgressOverviewComponents";
import { loadEvidenceEntriesWithVariants } from "@/lib/familyEvidence";
import { loadFamilyWeeklyPlan } from "@/lib/familyPlanner";
import { listReportDrafts, type ReportDraftRow } from "@/lib/reportDrafts";
import { listStudentProfileSnapshots } from "@/lib/studentProfileSnapshots";

type EvidenceRow = {
  id: string;
  occurred_on?: string | null;
  created_at?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
};

type SnapshotRow = {
  reporting_readiness?: number | null;
  total_evidence?: number | null;
  evidence_30d?: number | null;
  last_evidence_at?: string | null;
  strong_areas?: string[] | null;
  watch_areas?: string[] | null;
  created_at?: string | null;
};

const EVIDENCE_SELECTS = [
  "id,occurred_on,created_at,learning_area,evidence_type",
];

const PREVIEW_TREND: TrendPoint[] = [
  { label: "W1", value: 2 },
  { label: "W2", value: 3 },
  { label: "W3", value: 4 },
  { label: "W4", value: 4 },
  { label: "W5", value: 5 },
  { label: "W6", value: 6 },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getWeekKey(date: Date) {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((diffDays + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function dateValue(row: EvidenceRow) {
  return safe(row.occurred_on) || safe(row.created_at);
}

function buildTrend(rows: EvidenceRow[]): TrendPoint[] {
  const now = new Date();
  const weekStarts = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (5 - index) * 7);
    return startOfWeek(date);
  });

  const counts = weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const value = rows.filter((row) => {
      const parsed = new Date(`${dateValue(row)}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return false;
      return parsed >= weekStart && parsed <= weekEnd;
    }).length;

    return {
      label: weekStart.toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      value,
    };
  });

  return counts;
}

function percentageFromSignals(args: {
  evidenceCount: number;
  recentEvidenceCount: number;
  coverageCount: number;
  reportCount: number;
  planActions: number;
}) {
  const evidenceScore = Math.min(args.evidenceCount * 5, 40);
  const recentScore = Math.min(args.recentEvidenceCount * 6, 18);
  const coverageScore = Math.min(args.coverageCount * 7, 28);
  const reportScore = Math.min(args.reportCount * 8, 8);
  const planScore = Math.min(args.planActions * 3, 6);
  return Math.max(0, Math.min(100, evidenceScore + recentScore + coverageScore + reportScore + planScore));
}

function readinessLabel(percent: number) {
  if (percent >= 70) return "On track";
  if (percent >= 52) return "Building confidence";
  if (percent >= 30) return "Growing steadily";
  return "Just beginning";
}

function coverageLabel(count: number) {
  if (count >= 5) return "Healthy spread";
  if (count >= 3) return "Growing";
  if (count >= 1) return "Emerging";
  return "Just starting";
}

function momentumLabel(recentCount: number) {
  if (recentCount >= 4) return "Building steadily";
  if (recentCount >= 2) return "Moving";
  if (recentCount >= 1) return "Starting to build";
  return "Waiting for fresh evidence";
}

function deriveAreas(
  rows: EvidenceRow[],
  snapshot?: SnapshotRow | null,
): { strengths: string[]; focusAreas: string[]; coverageCount: number; primaryArea: string } {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const area = safe(row.learning_area);
    if (!area) return;
    counts.set(area, (counts.get(area) ?? 0) + 1);
  });

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const strengths = Array.isArray(snapshot?.strong_areas) && snapshot?.strong_areas?.length
    ? snapshot.strong_areas.slice(0, 5).map((item) => safe(item)).filter(Boolean)
    : ranked.slice(0, 4).map(([area]) => area);

  const focusFromSnapshot = Array.isArray(snapshot?.watch_areas) && snapshot?.watch_areas?.length
    ? snapshot.watch_areas.slice(0, 4).map((item) => safe(item)).filter(Boolean)
    : [];

  const defaultFocus = [];
  if (ranked.some(([, count]) => count <= 1)) {
    defaultFocus.push(...ranked.filter(([, count]) => count <= 1).slice(0, 3).map(([area]) => area));
  }
  if (counts.size < 3) defaultFocus.push("Coverage breadth");
  if (rows.length < 4) defaultFocus.push("Evidence volume");
  if (!rows.some((row) => safe(row.evidence_type).toLowerCase().includes("reflect"))) {
    defaultFocus.push("Reflection");
  }
  defaultFocus.push("Weekly consistency");

  return {
    strengths: [...new Set(strengths.length ? strengths : ["Curiosity", "Creative thinking", "Learning momentum"])].slice(0, 5),
    focusAreas: [...new Set(focusFromSnapshot.length ? focusFromSnapshot : defaultFocus)].slice(0, 4),
    coverageCount: counts.size,
    primaryArea: ranked[0]?.[0] || "Learning story",
  };
}

export default function FamilyProgressWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);
  const [reportDrafts, setReportDrafts] = useState<ReportDraftRow[]>([]);
  const [snapshot, setSnapshot] = useState<SnapshotRow | null>(null);
  const [planActionCount, setPlanActionCount] = useState(0);
  const [loadingInsights, setLoadingInsights] = useState(true);

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const canonicalReady =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local" &&
    Boolean(activeLearner?.id);

  useEffect(() => {
    let mounted = true;

    async function hydrateProgress() {
      if (!hasActiveLearner) {
        if (mounted) {
          setEvidenceRows([]);
          setReportDrafts([]);
          setSnapshot(null);
          setPlanActionCount(0);
          setLoadingInsights(false);
        }
        return;
      }

      if (!canonicalReady || !activeLearner?.id) {
        if (mounted) {
          setEvidenceRows([]);
          setReportDrafts([]);
          setSnapshot(null);
          setPlanActionCount(0);
          setLoadingInsights(false);
        }
        return;
      }

      try {
        setLoadingInsights(true);

        const weekKey = getWeekKey(new Date());
        const [evidence, drafts, snapshots, weeklyPlan] = await Promise.all([
          loadEvidenceEntriesWithVariants<EvidenceRow>(EVIDENCE_SELECTS, {
            studentId: activeLearner.id,
            limit: 60,
          }),
          listReportDrafts().catch(() => []),
          listStudentProfileSnapshots(activeLearner.id).catch(() => []),
          loadFamilyWeeklyPlan({
            familyProfileId: workspace.profile.id,
            studentId: activeLearner.id,
            weekKey,
          }).catch(() => null),
        ]);

        if (!mounted) return;

        setEvidenceRows(evidence);
        setReportDrafts(
          drafts.filter(
            (draft) =>
              draft.student_id === activeLearner.id || draft.child_id === activeLearner.id,
          ),
        );
        setSnapshot((snapshots[0] as SnapshotRow | undefined) ?? null);
        setPlanActionCount(weeklyPlan?.actions.length ?? 0);
      } finally {
        if (mounted) setLoadingInsights(false);
      }
    }

    void hydrateProgress();

    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, canonicalReady, hasActiveLearner, workspace.profile?.id]);

  const progressState: HomeSurfaceState = workspaceLoading || loadingInsights
    ? "loading"
    : !hasLearners || !hasActiveLearner
      ? "empty"
      : canonicalReady
        ? evidenceRows.length || reportDrafts.length || snapshot || planActionCount
          ? "live"
          : "empty"
        : "placeholder";

  const learnerSelectorState: HomeSurfaceState = workspaceLoading
    ? "loading"
    : hasLearners
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  const activeLearnerName = activeLearner?.label || "your learner";
  const evidenceCount = snapshot?.total_evidence ?? evidenceRows.length;
  const recentEvidenceCount =
    snapshot?.evidence_30d ??
    evidenceRows.filter((row) => {
      const value = new Date(`${dateValue(row)}T00:00:00`);
      if (Number.isNaN(value.getTime())) return false;
      return Date.now() - value.getTime() <= 1000 * 60 * 60 * 24 * 30;
    }).length;
  const { strengths, focusAreas, coverageCount, primaryArea } = deriveAreas(evidenceRows, snapshot);
  const reportCount = reportDrafts.length;
  const readinessPercent =
    progressState === "placeholder"
      ? 58
      : percentageFromSignals({
          evidenceCount,
          recentEvidenceCount,
          coverageCount,
          reportCount,
          planActions: planActionCount,
        });

  const trendPoints = useMemo(() => {
    if (progressState === "placeholder") return PREVIEW_TREND;
    const derivedTrend = buildTrend(evidenceRows);
    return derivedTrend.some((point) => point.value > 0) ? derivedTrend : [];
  }, [evidenceRows, progressState]);

  const summaryCards = [
    {
      label: "Readiness",
      value: progressState === "loading" ? "" : readinessLabel(readinessPercent),
      note:
        progressState === "live"
          ? `${activeLearnerName} is ${readinessLabel(readinessPercent).toLowerCase()} right now`
          : hasActiveLearner
            ? `Readiness will sharpen as ${activeLearnerName}'s evidence grows`
            : "Choose a learner to begin",
      state: progressState === "live" ? "derived" : progressState,
      accent: "blue" as const,
    },
    {
      label: "Coverage snapshot",
      value: progressState === "loading" ? "" : coverageLabel(coverageCount),
      note:
        progressState === "live"
          ? `${coverageCount} focus area${coverageCount === 1 ? "" : "s"} currently visible`
          : hasActiveLearner
            ? "Coverage will appear as learning moments collect"
            : "No coverage yet",
      state: progressState === "live" ? "derived" : progressState,
      accent: "violet" as const,
    },
    {
      label: "Evidence available",
      value: progressState === "loading" ? "" : progressState === "placeholder" ? "Preview" : String(evidenceCount),
      note:
        progressState === "live"
          ? `${evidenceCount} evidence item${evidenceCount === 1 ? "" : "s"} for ${activeLearnerName}`
          : hasActiveLearner
            ? `Evidence depth for ${activeLearnerName} will appear here`
            : "Capture starts after learner setup",
      state: progressState === "live" ? "live" : progressState,
      accent: "emerald" as const,
    },
    {
      label: "Current momentum",
      value: progressState === "loading" ? "" : momentumLabel(recentEvidenceCount),
      note:
        progressState === "live"
          ? `${recentEvidenceCount} recent item${recentEvidenceCount === 1 ? "" : "s"} in the last 30 days`
          : hasActiveLearner
            ? `Recent activity for ${activeLearnerName} will sharpen this view`
            : "No current momentum yet",
      state: progressState === "live" ? "derived" : progressState,
      accent: "amber" as const,
    },
  ] satisfies Array<{
    label: string;
    value: string;
    note: string;
    state: HomeSurfaceState;
    accent: "blue" | "violet" | "emerald" | "amber";
  }>;

  const nextMove =
    !hasActiveLearner
      ? {
          title: "Choose a learner first",
          note: "Once a learner is in focus, My Progress can turn planning, evidence, and reports into clearer guidance.",
          href: "/profile",
          cta: "Open My Profile",
          state: "empty" as HomeSurfaceState,
        }
      : progressState === "live" && evidenceCount < 4
        ? {
            title: `Capture one more moment for ${activeLearnerName}`,
            note: "A little more evidence will make strengths, trends, and report readiness easier to trust.",
            href: "/capture",
            cta: "Capture evidence",
            state: "derived" as HomeSurfaceState,
          }
        : progressState === "live" && reportCount === 0
          ? {
              title: `Build a first report for ${activeLearnerName}`,
              note: "You already have enough visible progress to turn the strongest moments into a draft report.",
              href: "/my-reports",
              cta: "Build My Report",
              state: "live" as HomeSurfaceState,
            }
          : {
              title: `Strengthen ${activeLearnerName}'s focus area`,
              note: `Capture or reflect on ${focusAreas[0] || "the next focus area"} to keep progress building steadily.`,
              href: focusAreas[0] === "Weekly consistency" ? "/my-plan" : "/capture",
              cta: focusAreas[0] === "Weekly consistency" ? "Open My Plan" : "Capture evidence",
              state: hasActiveLearner ? progressState : "empty",
            };

  return (
    <FamilyTopNavShell
      subtitle="My Progress"
      heroTitle="My Progress"
      heroText="See what is growing, what needs attention, and what to focus on next."
      heroAsideTitle="Progress snapshot"
      heroAsideText="Use this space to keep growth visible over time."
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <ProgressMetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              note={card.note}
              state={card.state}
              accent={card.accent}
            />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <InsightListCard
            eyebrow="Strengths"
            title="What is working well"
            items={progressState === "placeholder" ? ["Reading comprehension", "Creative reflection", "Science understanding"] : strengths}
            emptyTitle={`No strengths visible yet for ${activeLearnerName}`}
            emptyNote="Capture a few learning moments to begin seeing the strongest areas."
            state={progressState}
            tone="blue"
          />
          <InsightListCard
            eyebrow="Focus areas"
            title="Where to strengthen next"
            items={progressState === "placeholder" ? ["Fractions", "Writing fluency", "Weekly consistency"] : focusAreas}
            emptyTitle="No focus areas yet"
            emptyNote="Once a few signals are visible, this space will suggest the next areas to strengthen."
            state={progressState}
            tone="amber"
          />
        </section>

        <ProgressTrendCard points={trendPoints} state={progressState} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CoverageReadinessCard
            eyebrow="Readiness"
            title="Readiness"
            value={progressState === "loading" ? "" : readinessLabel(readinessPercent)}
            note={
              progressState === "live"
                ? `${activeLearnerName}'s progress is being shaped by planning, evidence, and reports`
                : hasActiveLearner
                  ? "Readiness becomes clearer as the system stays connected"
                  : "Choose a learner to see readiness"
            }
            progress={readinessPercent}
            state={progressState}
          />
          <CoverageReadinessCard
            eyebrow="Coverage"
            title="Coverage"
            value={progressState === "loading" ? "" : coverageLabel(coverageCount)}
            note={
              progressState === "live"
                ? `${primaryArea} is the strongest visible area right now`
                : hasActiveLearner
                  ? "Coverage will grow as evidence spreads across more areas"
                  : "Coverage stays empty until a learner is selected"
            }
            progress={progressState === "placeholder" ? 54 : Math.min(100, coverageCount * 18)}
            state={progressState}
          />
          <CoverageReadinessCard
            eyebrow="Report readiness"
            title="Report readiness"
            value={progressState === "loading" ? "" : reportCount ? "Ready to build" : "Still forming"}
            note={
              progressState === "live"
                ? reportCount
                  ? `${reportCount} draft report${reportCount === 1 ? "" : "s"} already in progress`
                  : `No report draft yet for ${activeLearnerName}`
                : hasActiveLearner
                  ? "Reports become easier once the evidence picture is clearer"
                  : "Report readiness appears after learner setup"
            }
            progress={progressState === "placeholder" ? 44 : reportCount ? 68 : Math.min(42, evidenceCount * 4)}
            state={progressState === "live" ? "derived" : progressState}
          />
        </section>

        <ProgressNextMoveCard
          title={nextMove.title}
          note={nextMove.note}
          href={nextMove.href}
          cta={nextMove.cta}
          state={nextMove.state}
        />
      </div>
    </FamilyTopNavShell>
  );
}
