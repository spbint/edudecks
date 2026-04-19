"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import { loadEvidenceEntriesWithVariants } from "@/lib/familyEvidence";
import {
  deriveLearningIntelligence,
  type LearningIntelligenceInput,
} from "@/lib/learningIntelligence";
import { getReportComplianceContext, buildReportPeriodPresentation, buildReportSubmissionWorkflow, type ReportSubmissionWorkflow } from "@/lib/reportPresentation";
import { listReportDrafts, type ReportDraftRow } from "@/lib/reportDrafts";
import { getEvidenceText, safeText } from "@/lib/system";

type EvidenceRow = {
  id: string;
  student_id?: string | null;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  note?: string | null;
  learning_area?: string | null;
  curriculum_subject?: string | null;
  curriculum_skill?: string | null;
  occurred_on?: string | null;
  created_at?: string | null;
  is_deleted?: boolean | null;
};

function safe(value: unknown) {
  return safeText(typeof value === "string" ? value : String(value ?? ""));
}

function clip(value: string | null | undefined, max = 130) {
  const text = safe(value);
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
}

function daysSince(value?: string | null) {
  const text = safe(value);
  if (!text) return Number.POSITIVE_INFINITY;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
}

function evidenceSummary(row: EvidenceRow) {
  const title = safe(row.title);
  if (title) return title;

  const detail = clip(getEvidenceText(row), 110);
  if (detail) return detail;

  const area = safe(row.learning_area);
  return area ? `${area} learning moment` : "Learning moment";
}

function hasLearningLink(row: EvidenceRow) {
  return Boolean(safe(row.curriculum_subject) || safe(row.curriculum_skill));
}

function buildEvidenceRevisitHref(row: EvidenceRow) {
  const evidenceId = encodeURIComponent(row.id);
  const studentId = safe(row.student_id);
  return studentId
    ? `/portfolio?studentId=${encodeURIComponent(studentId)}&highlightEvidenceId=${evidenceId}`
    : `/portfolio?highlightEvidenceId=${evidenceId}`;
}

function buildPeriodContextLine(input: {
  periodKind: "term" | "semester" | "annual" | "custom";
  hasEvidence: boolean;
  hasReports: boolean;
}) {
  const { periodKind, hasEvidence, hasReports } = input;
  const isTakingShape = hasEvidence || hasReports;

  if (periodKind === "term") {
    return isTakingShape
      ? "You are building your term learning record."
      : "This reporting period is beginning to build.";
  }

  if (periodKind === "semester") {
    return isTakingShape
      ? "This semester's learning is taking shape."
      : "This reporting period is beginning to build.";
  }

  if (periodKind === "annual") {
    return isTakingShape
      ? "This year's learning record is taking shape."
      : "This reporting period is beginning to build.";
  }

  return isTakingShape
    ? "Your learning record is beginning to take shape."
    : "This reporting period is beginning to build.";
}

function buildReportingShapeLine(workflows: ReportSubmissionWorkflow[], draftCount: number) {
  if (workflows.some((workflow) => workflow.state === "prepared")) {
    return "You have reports prepared for your records.";
  }

  if (workflows.some((workflow) => workflow.state === "review")) {
    return "Some reports are ready for review.";
  }

  if (draftCount > 0) {
    return "Your reports are beginning to take shape.";
  }

  return "Your reports will take shape as you continue capturing learning.";
}

function countCoverageAreas(rows: EvidenceRow[]) {
  return new Set(
    rows
      .map((row) => safe(row.learning_area))
      .filter(Boolean),
  ).size;
}

function resolveFamilySummaryDisplay(input: {
  hasSingleLearner: boolean;
  summary: ReturnType<typeof deriveLearningIntelligence>;
}) {
  const { hasSingleLearner, summary } = input;

  if (hasSingleLearner) {
    return {
      ctaLabel: summary.ctaLabel,
      reason: summary.reason,
    };
  }

  if (summary.targetPage === "portfolio") {
    return {
      ctaLabel: "Browse the family portfolio",
      reason: summary.reason,
    };
  }

  if (summary.targetPage === "reports") {
    return {
      ctaLabel: "Review the reports",
      reason: "You already have enough here to begin shaping your reports.",
    };
  }

  return {
    ctaLabel: summary.ctaLabel,
    reason: summary.reason,
  };
}

export default function FamilyHomePage() {
  const { workspace, loading: workspaceLoading, error: workspaceError } = useFamilyWorkspace();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentEvidence, setRecentEvidence] = useState<EvidenceRow[]>([]);
  const [reportDrafts, setReportDrafts] = useState<ReportDraftRow[]>([]);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      setLoading(true);
      setError("");

      try {
        const learnerIds = (workspace.learners ?? [])
          .map((learner) => learner.id)
          .filter((id) => id && !id.startsWith("local-"));

        if (!workspace.userId || learnerIds.length === 0) {
          if (!mounted) return;
          setRecentEvidence([]);
          setReportDrafts([]);
          setError(workspaceError || "");
          return;
        }

        const [evidenceRows, draftRows] = await Promise.all([
          loadEvidenceEntriesWithVariants<EvidenceRow>(
            [
              "id,student_id,title,summary,body,note,learning_area,curriculum_subject,curriculum_skill,occurred_on,created_at,is_deleted",
              "id,student_id,title,summary,body,note,learning_area,occurred_on,created_at,is_deleted",
            ],
            { studentIds: learnerIds, limit: 5 },
          ),
          listReportDrafts(),
        ]);

        if (!mounted) return;

        const learnerIdSet = new Set(learnerIds);
        const familyDrafts = draftRows.filter((draft) => {
          const linkedIds = [safe(draft.student_id), safe(draft.child_id)].filter(Boolean);
          return linkedIds.length === 0 || linkedIds.some((id) => learnerIdSet.has(id));
        });

        setRecentEvidence(evidenceRows.slice(0, 5));
        setReportDrafts(familyDrafts);
      } catch (loadError) {
        console.error("family overview hydrate failed", loadError);
        if (!mounted) return;
        setRecentEvidence([]);
        setReportDrafts([]);
        setError(workspaceError || "We could not load this family overview right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrate();

    return () => {
      mounted = false;
    };
  }, [workspace.learners, workspace.profile, workspace.userId, workspaceError]);

  const latestDraft = reportDrafts[0] ?? null;

  const periodPresentation = useMemo(
    () =>
      buildReportPeriodPresentation({
        periodMode: latestDraft?.period_mode,
      }),
    [latestDraft?.period_mode],
  );

  const workflows = useMemo(() => {
    return reportDrafts
      .map((draft) => {
        const selectedEvidenceIds = draft.selected_evidence_ids ?? [];
        const selectedCoreCount = selectedEvidenceIds.filter(
          (id) => draft.selection_meta?.[id]?.role !== "appendix",
        ).length;
        const appendixCount = selectedEvidenceIds.filter(
          (id) => draft.selection_meta?.[id]?.role === "appendix",
        ).length;

        return buildReportSubmissionWorkflow({
          complianceContext: getReportComplianceContext({
            market: draft.preferred_market || workspace.profile?.preferred_market,
            curriculumPreferences: workspace.profile?.curriculum_preferences ?? null,
          }),
          isSavedDraft: true,
          hasMeaningfulCoverage:
            draft.selected_areas.length > 0 && selectedEvidenceIds.length > 0,
          selectedEvidenceCount: selectedEvidenceIds.length,
          selectedCoreCount,
          includeAppendix: Boolean(draft.include_appendix),
          supportingRecordsCount: appendixCount,
          periodLabel: periodPresentation.label,
        });
      })
      .filter((workflow): workflow is ReportSubmissionWorkflow => Boolean(workflow));
  }, [periodPresentation.label, reportDrafts, workspace.profile?.curriculum_preferences, workspace.profile?.preferred_market]);
  const linkedEvidenceCount = useMemo(
    () => recentEvidence.filter((item) => hasLearningLink(item)).length,
    [recentEvidence],
  );
  const coverageAreaCount = useMemo(() => countCoverageAreas(recentEvidence), [recentEvidence]);
  const recentEvidenceCount = useMemo(
    () =>
      recentEvidence.filter((item) => daysSince(item.occurred_on || item.created_at) <= 30)
        .length,
    [recentEvidence],
  );
  const hasReportSelection = useMemo(
    () => reportDrafts.some((draft) => draft.selected_evidence_ids.length > 0),
    [reportDrafts],
  );
  const familyStudentId = useMemo(() => {
    const learnerIds = (workspace.learners ?? [])
      .map((learner) => safe(learner.id))
      .filter(Boolean);
    return learnerIds.length === 1 ? learnerIds[0] : undefined;
  }, [workspace.learners]);
  const hasSingleLearner = Boolean(familyStudentId);
  const latestEvidenceId = recentEvidence[0]?.id;
  const familyWorkflowSignals = useMemo<LearningIntelligenceInput>(
    () => ({
      studentId: familyStudentId,
      highlightEvidenceId: latestEvidenceId,
      evidenceCount: recentEvidence.length,
      recentEvidenceCount,
      linkedEvidenceCount,
      coverageAreaCount,
      hasSavedDraft: reportDrafts.length > 0,
      hasReportSelection,
    }),
    [
      coverageAreaCount,
      familyStudentId,
      hasReportSelection,
      latestEvidenceId,
      linkedEvidenceCount,
      recentEvidence.length,
      recentEvidenceCount,
      reportDrafts.length,
    ],
  );
  const bestNextMove = useMemo(
    () => deriveLearningIntelligence(familyWorkflowSignals),
    [familyWorkflowSignals],
  );
  const familySummaryDisplay = useMemo(
    () =>
      resolveFamilySummaryDisplay({
        hasSingleLearner,
        summary: bestNextMove,
      }),
    [bestNextMove, hasSingleLearner],
  );

  const periodContextLine = buildPeriodContextLine({
    periodKind: periodPresentation.kind,
    hasEvidence: recentEvidence.length > 0,
    hasReports: reportDrafts.length > 0,
  });
  const reportingShapeLine = buildReportingShapeLine(workflows, reportDrafts.length);

  const pageState = loading || workspaceLoading;

  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Family Home"
      heroTitle="A calm view of this reporting period"
      heroText="Get a calm view of how recent learning, planning, and reporting are coming together."
      heroAsideTitle="Overview"
      heroAsideText="Recent learning and reporting stay lightly connected here so the family record remains easy to follow."
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 pb-10">
        <p className="text-sm leading-7 text-slate-500">
          Everything here builds gradually as you capture and revisit learning.
        </p>
        <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Current period
          </div>
          <p className="mt-2 text-[15px] leading-8 text-slate-600">{periodContextLine}</p>
        </section>

        {!pageState && !error ? (
          <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Best next move
            </div>
            <div className="mt-3 rounded-[18px] border border-blue-100 bg-sky-50/60 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                  {bestNextMove.momentumLabel}
                </span>
                {bestNextMove.thinAreaLabel ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {bestNextMove.thinAreaLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{familySummaryDisplay.reason}</p>
              <div className="mt-3">
                <Link
                  href={bestNextMove.targetHref}
                  className="text-sm font-bold text-blue-700 no-underline"
                >
                  {familySummaryDisplay.ctaLabel}
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Recent learning
          </div>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {recentEvidence.length
              ? "A few recent moments are easy to revisit here."
              : "Recent activity will appear here as you add learning."}
          </p>

          {pageState ? (
            <p className="mt-3 text-sm leading-7 text-slate-500">Loading recent learning...</p>
          ) : recentEvidence.length ? (
            <div className="mt-3 flex flex-col gap-2.5">
              {recentEvidence.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5"
                >
                  <div className="text-sm font-semibold leading-6 text-slate-900">
                    {evidenceSummary(item)}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {clip(getEvidenceText(item), 150) || "Learning reflection recorded."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {hasLearningLink(item) ? (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                        Linked to learning
                      </span>
                    ) : null}
                    {daysSince(item.occurred_on || item.created_at) <= 30 ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        Recent
                      </span>
                    ) : null}
                    <Link
                      href={buildEvidenceRevisitHref(item)}
                      className="text-[12px] font-bold text-blue-700 no-underline"
                    >
                      Revisit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Reporting shape
          </div>
          <p className="mt-2 text-[15px] leading-8 text-slate-600">{reportingShapeLine}</p>
          <div className="mt-2.5">
            <Link href="/reports" className="text-sm font-bold text-blue-700 no-underline">
              View reports
            </Link>
          </div>
        </section>

        {!pageState && !recentEvidence.length && !reportDrafts.length && !error ? (
          <section className="rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <p className="text-sm leading-7 text-slate-500">
              Your learning journey is just beginning. Your reports will begin to take shape as you capture learning.
            </p>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm leading-7 text-amber-900">{error}</p>
          </section>
        ) : null}
      </div>
    </FamilyTopNavShell>
  );
}
