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
  ReportEvidenceHighlights,
  ReportInsightCard,
  ReportMetricCard,
  ReportNextMoveCard,
  ReportReadinessCard,
} from "@/app/components/reports/ReportOverviewComponents";
import { loadEvidenceEntriesWithVariants } from "@/lib/familyEvidence";
import { loadFamilyCalendarWindow, type FamilyCalendarBlockEntry } from "@/lib/familyPlanner";
import { frameworkPreset } from "@/lib/curriculumFrameworks";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import {
  buildCurriculumOutcomeSignals,
  summarizeCurriculumSignals,
  type CurriculumEvidenceSignalRow,
  type CurriculumPlannerSignalBlock,
} from "@/lib/curriculumSignals";
import { listReportDrafts, type ReportDraftRow } from "@/lib/reportDrafts";

type EvidenceRow = CurriculumEvidenceSignalRow & {
  title?: string | null;
  summary?: string | null;
  note?: string | null;
};

const EVIDENCE_SELECTS = [
  "id,title,summary,note,occurred_on,created_at,learning_area,evidence_type,curriculum_outcome_ids,outcome_status_by_id",
  "id,title,summary,note,occurred_on,created_at,learning_area,evidence_type",
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function readinessLabel(percent: number) {
  if (percent >= 75) return "Ready to draft";
  if (percent >= 50) return "Building steadily";
  if (percent >= 30) return "Still forming";
  return "Just beginning";
}

function dedupe(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function topLabelsFromStatus(
  signals: ReturnType<typeof buildCurriculumOutcomeSignals>,
  status: "understood" | "in_progress" | "needs_support",
) {
  return dedupe(
    [...signals.values()]
      .filter((signal) => signal.status === status)
      .sort((a, b) => b.evidenceCount - a.evidenceCount)
      .map((signal) => signal.meta.label),
  ).slice(0, 5);
}

export default function FamilyReportsWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);
  const [plannerBlocks, setPlannerBlocks] = useState<CurriculumPlannerSignalBlock[]>([]);
  const [drafts, setDrafts] = useState<ReportDraftRow[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

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
  const learningConfig = resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner);
  const preset = frameworkPreset(
    learningConfig.country === "us" || learningConfig.country === "uk"
      ? learningConfig.country
      : "au",
  );

  useEffect(() => {
    let mounted = true;

    async function hydrateReports() {
      if (!hasActiveLearner) {
        if (mounted) {
          setEvidenceRows([]);
          setPlannerBlocks([]);
          setDrafts([]);
          setLoadingReports(false);
        }
        return;
      }

      if (!canonicalReady || !activeLearner?.id) {
        if (mounted) {
          setEvidenceRows([]);
          setPlannerBlocks([]);
          setDrafts([]);
          setLoadingReports(false);
        }
        return;
      }

      try {
        setLoadingReports(true);
        const monday = startOfWeek(new Date());
        const friday = addDays(monday, 4);
        const [evidence, calendarWindow, reportDrafts] = await Promise.all([
          loadEvidenceEntriesWithVariants<EvidenceRow>(EVIDENCE_SELECTS, {
            studentId: activeLearner.id,
            limit: 80,
          }),
          loadFamilyCalendarWindow({
            familyProfileId: workspace.profile.id,
            studentId: activeLearner.id,
            dateFrom: ymd(monday),
            dateTo: ymd(friday),
          }).catch(() => ({ dayNotes: {}, blocks: {} })),
          listReportDrafts().catch(() => []),
        ]);

        if (!mounted) return;

        const nextPlannerBlocks: CurriculumPlannerSignalBlock[] = Object.entries(calendarWindow.blocks).flatMap(
          ([date, items]: [string, FamilyCalendarBlockEntry[]]) =>
            items.map((item) => ({
              id: item.id,
              subject: item.subject,
              date,
              curriculumOutcomeIds: item.curriculumOutcomeIds ?? [],
            })),
        );

        setEvidenceRows(evidence);
        setPlannerBlocks(nextPlannerBlocks);
        setDrafts(
          reportDrafts.filter(
            (draft) =>
              draft.student_id === activeLearner.id || draft.child_id === activeLearner.id,
          ),
        );
      } finally {
        if (mounted) setLoadingReports(false);
      }
    }

    void hydrateReports();
    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, canonicalReady, hasActiveLearner, workspace.profile?.id]);

  const reportsState: HomeSurfaceState = workspaceLoading || loadingReports
    ? "loading"
    : !hasLearners || !hasActiveLearner
      ? "empty"
      : canonicalReady
        ? evidenceRows.length || drafts.length || plannerBlocks.length
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

  const signals = useMemo(
    () =>
      buildCurriculumOutcomeSignals({
        preset,
        evidenceRows,
        plannerBlocks,
      }),
    [evidenceRows, plannerBlocks, preset],
  );

  const signalSummary = useMemo(() => summarizeCurriculumSignals(signals), [signals]);
  const understood = topLabelsFromStatus(signals, "understood");
  const developing = topLabelsFromStatus(signals, "in_progress");
  const focusAreas = topLabelsFromStatus(signals, "needs_support");
  const explicitLinkedEvidence = evidenceRows.filter(
    (row) => Array.isArray(row.curriculum_outcome_ids) && row.curriculum_outcome_ids.length > 0,
  );
  const latestDraft = drafts[0] ?? null;
  const readinessPercent = reportsState === "placeholder"
    ? 54
    : Math.min(
        100,
        Math.round(
          signalSummary.confidence * 0.55 +
            signalSummary.explicitEvidenceCount * 4 +
            (latestDraft ? 12 : 0),
        ),
      );

  const summaryCards: Array<{
    label: string;
    value: string;
    note: string;
    state: HomeSurfaceState;
    accent: "blue" | "violet" | "emerald" | "amber";
  }> = [
    {
      label: "Report readiness",
      value: reportsState === "loading" ? "" : readinessLabel(readinessPercent),
      note:
        reportsState === "live"
          ? `${signalSummary.explicitCount} explicitly linked outcomes are helping shape this report`
          : hasActiveLearner
            ? "Readiness will sharpen as explicit curriculum links grow"
            : "Choose a learner to begin",
      state: reportsState,
      accent: "blue" as const,
    },
    {
      label: "Coverage",
      value: reportsState === "loading" ? "" : `${signalSummary.explicitCount || 0} linked`,
      note:
        reportsState === "live"
          ? `${signalSummary.counts.understood} understood and ${signalSummary.counts.in_progress} in progress`
          : hasActiveLearner
            ? "Coverage becomes clearer once outcomes are linked"
            : "No linked outcomes yet",
      state: reportsState,
      accent: "violet" as const,
    },
    {
      label: "Evidence available",
      value: reportsState === "loading" ? "" : String(explicitLinkedEvidence.length),
      note:
        reportsState === "live"
          ? `${explicitLinkedEvidence.length} evidence item${explicitLinkedEvidence.length === 1 ? "" : "s"} linked to curriculum`
          : hasActiveLearner
            ? "Linked evidence will appear here"
            : "No learner selected",
      state: reportsState,
      accent: "emerald" as const,
    },
    {
      label: "Last report",
      value: reportsState === "loading" ? "" : latestDraft ? "Draft ready" : "Not yet",
      note:
        latestDraft
          ? latestDraft.title
          : hasActiveLearner
            ? "No draft report yet for this learner"
            : "Choose a learner to begin",
      state: latestDraft ? "derived" : reportsState,
      accent: "amber" as const,
    },
  ];

  const evidenceHighlights = explicitLinkedEvidence
    .slice(0, 4)
    .map((row) => ({
      title: safe(row.title) || "Linked learning evidence",
      note:
        safe(row.summary) ||
        safe(row.note) ||
        `${(row.curriculum_outcome_ids ?? []).length} linked outcome${(row.curriculum_outcome_ids ?? []).length === 1 ? "" : "s"}`,
      href: `/my-portfolio?learner=${encodeURIComponent(activeLearner?.id || "")}&evidence=${encodeURIComponent(row.id)}`,
    }));

  const nextMove =
    !hasActiveLearner
      ? {
          title: "Choose a learner first",
          note: "Once a learner is selected, reports can pull in explicit coverage and linked evidence.",
          href: "/profile",
          cta: "Open My Profile",
          state: "empty" as HomeSurfaceState,
        }
      : signalSummary.explicitEvidenceCount === 0
        ? {
            title: `Capture curriculum-linked evidence for ${activeLearner?.label || "this learner"}`,
            note: "One or two linked captures will make strengths and focus areas easier to trust in the report.",
            href: "/capture",
            cta: "Capture Evidence",
            state: reportsState,
          }
        : focusAreas.length
          ? {
              title: `Strengthen ${focusAreas[0]} next`,
              note: "A little more evidence in this area will make the report feel more balanced and more defensible.",
              href: "/my-plan",
              cta: "Open My Plan",
              state: reportsState,
            }
          : {
              title: `Build ${activeLearner?.label || "this learner"}'s report draft`,
              note: "You already have enough linked evidence and curriculum coverage to draft a clearer family report.",
              href: "/reports/output",
              cta: "Build My Report",
              state: reportsState,
            };

  return (
    <FamilyTopNavShell
      subtitle="My Reports"
      heroTitle="My Reports"
      heroText="Bring together evidence, linked outcomes, and clear next steps in one calmer reporting view."
      heroAsideTitle="Reporting snapshot"
      heroAsideText="Reports stay calmer when explicit curriculum links and supporting evidence do the heavy lifting quietly underneath."
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
            <ReportMetricCard
              key={card.label}
              label={card.label}
              value={card.value}
              note={card.note}
              state={card.state}
              accent={card.accent}
            />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ReportInsightCard
            eyebrow="Strengths"
            title="Strengths"
            items={reportsState === "placeholder" ? ["Recognises natural numbers", "Creates informative writing", "Shares science conclusions"] : understood}
            emptyTitle="No strengths visible yet"
            emptyNote="Understood outcomes will appear here once linked evidence begins to settle."
            state={reportsState}
            tone="blue"
          />
          <ReportInsightCard
            eyebrow="Developing areas"
            title="Developing areas"
            items={reportsState === "placeholder" ? ["Measures and compares length", "Builds writing fluency"] : developing}
            emptyTitle="No developing areas yet"
            emptyNote="In-progress outcomes will appear here once explicit curriculum links begin to build."
            state={reportsState}
            tone="amber"
          />
          <ReportInsightCard
            eyebrow="Focus areas"
            title="Focus areas"
            items={reportsState === "placeholder" ? ["Fractions", "Weekly consistency"] : focusAreas}
            emptyTitle="No focus areas yet"
            emptyNote="Needs-support outcomes will appear here only when the linked evidence truly points that way."
            state={reportsState}
            tone="rose"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <ReportEvidenceHighlights items={evidenceHighlights} state={reportsState} />
          <ReportReadinessCard
            title="Readiness"
            value={reportsState === "loading" ? "" : readinessLabel(readinessPercent)}
            note={
              reportsState === "live"
                ? `${signalSummary.explicitEvidenceCount} explicit evidence link${signalSummary.explicitEvidenceCount === 1 ? "" : "s"} are informing this reporting view`
                : hasActiveLearner
                  ? "Readiness improves as evidence and curriculum stay connected"
                  : "Choose a learner to begin"
            }
            progress={readinessPercent}
            state={reportsState}
          />
        </section>

        <ReportNextMoveCard
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
