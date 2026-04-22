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
  CoverageLegend,
  CoverageSummaryCards,
  CurriculumFrameworkSummaryBar,
  CurriculumMapEmptyState,
  CurriculumNextMoveCard,
  type CoverageStatus,
  type OutcomeCoverageView,
  StrandCoverageCard,
  SubjectCoverageTabs,
  type StrandCoverageView,
  type SubjectCoverageTabData,
} from "@/app/components/curriculum/CurriculumMapOverviewComponents";
import {
  frameworkPreset,
} from "@/lib/curriculumFrameworks";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import { loadEvidenceEntriesWithVariants } from "@/lib/familyEvidence";
import { loadFamilyCalendarWindow } from "@/lib/familyPlanner";
import {
  buildCurriculumOutcomeSignals,
  summarizeCurriculumSignals,
  type CurriculumEvidenceSignalRow,
  type CurriculumPlannerSignalBlock,
} from "@/lib/curriculumSignals";

type EvidenceRow = CurriculumEvidenceSignalRow;

const EVIDENCE_SELECTS = [
  "id,occurred_on,created_at,learning_area,evidence_type,curriculum_outcome_ids,outcome_status_by_id",
  "id,occurred_on,created_at,learning_area,evidence_type",
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

function recentLabel(value?: string | null) {
  const trimmed = safe(value);
  if (!trimmed) return "Not yet";
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  const diffDays = Math.round((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Today";
  if (diffDays <= 7) return `${diffDays}d ago`;
  return parsed.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function FamilyCurriculumMapWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [evidenceRows, setEvidenceRows] = useState<EvidenceRow[]>([]);
  const [plannerSubjects, setPlannerSubjects] = useState<string[]>([]);
  const [plannerBlocks, setPlannerBlocks] = useState<CurriculumPlannerSignalBlock[]>([]);
  const [loadingCoverage, setLoadingCoverage] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [expandedStrands, setExpandedStrands] = useState<Record<string, string | null>>({});

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const learnerSetupHref = hasLearners ? "/family" : "/family#learner-management";
  const learnerSetupCta = hasLearners ? "Open My Family" : "Add your first learner";
  const canonicalReady =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local" &&
    Boolean(activeLearner?.id);

  useEffect(() => {
    let mounted = true;

    async function hydrateCurriculum() {
      if (!hasActiveLearner) {
        if (mounted) {
          setEvidenceRows([]);
          setPlannerSubjects([]);
          setPlannerBlocks([]);
          setLoadingCoverage(false);
        }
        return;
      }

      if (!canonicalReady || !activeLearner?.id) {
        if (mounted) {
          setEvidenceRows([]);
          setPlannerSubjects([]);
          setPlannerBlocks([]);
          setLoadingCoverage(false);
        }
        return;
      }

      try {
        setLoadingCoverage(true);

        const monday = startOfWeek(new Date());
        const friday = addDays(monday, 4);

        const [evidence, calendarWindow] = await Promise.all([
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
        ]);

        if (!mounted) return;

        const weekSubjects = Object.values(calendarWindow.blocks)
          .flat()
          .map((item) => safe(item.subject))
          .filter(Boolean);
        const weekBlocks = Object.entries(calendarWindow.blocks).flatMap(([date, items]) =>
          items.map((item) => ({
            id: item.id,
            subject: item.subject,
            date,
            curriculumOutcomeIds: item.curriculumOutcomeIds ?? [],
          })),
        );

        setEvidenceRows(evidence);
        setPlannerSubjects(weekSubjects);
        setPlannerBlocks(weekBlocks);
      } finally {
        if (mounted) setLoadingCoverage(false);
      }
    }

    void hydrateCurriculum();

    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, canonicalReady, hasActiveLearner, workspace.profile?.id]);

  const learningConfig = resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner);
  const preset = frameworkPreset(
    learningConfig.country === "us" || learningConfig.country === "uk"
      ? learningConfig.country
      : "au",
  );

  useEffect(() => {
    if (!selectedSubjectId || !preset.subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(preset.subjects[0]?.id || "");
    }
  }, [preset, selectedSubjectId]);

  const mapState: HomeSurfaceState = workspaceLoading || loadingCoverage
    ? "loading"
    : !hasLearners || !hasActiveLearner
      ? "empty"
      : canonicalReady
        ? evidenceRows.length || plannerSubjects.length
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

  const fallbackPlannerBlocks = useMemo(
    () =>
      plannerSubjects.map((subject, index) => ({
        id: `fallback-${index}`,
        subject,
        date: null,
        curriculumOutcomeIds: [],
      })),
    [plannerSubjects],
  );

  const outcomeSignals = useMemo(
    () =>
      buildCurriculumOutcomeSignals({
        preset,
        evidenceRows,
        plannerBlocks: plannerBlocks.length ? plannerBlocks : fallbackPlannerBlocks,
      }),
    [evidenceRows, fallbackPlannerBlocks, plannerBlocks, preset],
  );

  const subjectViews = useMemo(() => {
    return preset.subjects.map((subject) => {
      const strands: StrandCoverageView[] = subject.strands.map((strand) => {
        const counts: Record<CoverageStatus, number> = {
          not_started: 0,
          in_progress: 0,
          understood: 0,
          needs_support: 0,
        };

        const outcomes: OutcomeCoverageView[] = strand.outcomes.map((outcome, index) => {
          const signal = outcomeSignals.get(outcome.code);
          const status = signal?.status ?? "not_started";
          counts[status] += 1;

          return {
            id: `${subject.id}-${strand.id}-${outcome.code}`,
            code: outcome.code,
            label: outcome.label,
            status,
            evidenceCount: signal?.evidenceCount ?? 0,
            lastTouchedAt: signal?.lastTouchedAt ? recentLabel(signal.lastTouchedAt) : null,
            viewHref: signal?.evidenceIds.length
              ? `/my-portfolio?learner=${encodeURIComponent(activeLearner?.id || "")}&evidence=${encodeURIComponent(signal.evidenceIds.join(","))}`
              : `/my-portfolio?learner=${encodeURIComponent(activeLearner?.id || "")}&subject=${encodeURIComponent(subject.title)}`,
          };
        });

        return {
          id: strand.id,
          title: strand.title,
          counts,
          outcomes,
        };
      });

      const totalCounts = strands.reduce<Record<CoverageStatus, number>>(
        (acc, strand) => {
          acc.not_started += strand.counts.not_started;
          acc.in_progress += strand.counts.in_progress;
          acc.understood += strand.counts.understood;
          acc.needs_support += strand.counts.needs_support;
          return acc;
        },
        { not_started: 0, in_progress: 0, understood: 0, needs_support: 0 },
      );

      return {
        id: subject.id,
        title: subject.title,
        strands,
        counts: totalCounts,
      };
    });
  }, [activeLearner?.id, outcomeSignals, preset]);

  const selectedSubject =
    subjectViews.find((subject) => subject.id === selectedSubjectId) ?? subjectViews[0];
  const selectedSubjectKey = selectedSubject?.id || "";

  const signalSummary = useMemo(() => summarizeCurriculumSignals(outcomeSignals), [outcomeSignals]);
  const summaryCounts = signalSummary.counts;
  const coverageConfidence = mapState === "placeholder" ? 62 : signalSummary.confidence;

  const summaryCards = [
    {
      label: "Coverage confidence",
      value: mapState === "loading" ? "" : mapState === "empty" ? "Not yet" : `${coverageConfidence}%`,
      note:
        mapState === "live"
          ? "Coverage becomes clearer as planning and evidence connect"
          : hasActiveLearner
            ? "Coverage confidence will build from tagged blocks and captures"
            : "Choose a learner to begin",
    },
    {
      label: "Understood",
      value: mapState === "loading" ? "" : String(summaryCounts.understood),
      note: "Outcomes that already feel secure",
    },
    {
      label: "In progress",
      value: mapState === "loading" ? "" : String(summaryCounts.in_progress),
      note: "Outcomes currently strengthening",
    },
    {
      label: "Focus areas",
      value: mapState === "loading" ? "" : String(summaryCounts.needs_support + summaryCounts.not_started),
      note: "Outcomes that still need attention",
    },
  ];

  const subjectTabs: SubjectCoverageTabData[] = subjectViews.map((subject) => ({
    id: subject.id,
    title: subject.title,
    counts: subject.counts,
  }));

  useEffect(() => {
    if (!selectedSubject) return;
    setExpandedStrands((prev) => {
      const current = prev[selectedSubjectKey];
      if (current) return prev;
      return { ...prev, [selectedSubjectKey]: selectedSubject.strands[0]?.id || null };
    });
  }, [selectedSubject, selectedSubjectKey]);

  const nextMove =
    !hasActiveLearner
      ? {
          title: "Choose a learner first",
          note: "Once a learner is in focus, Curriculum Map can turn planning and evidence into visible coverage.",
          href: learnerSetupHref,
          cta: learnerSetupCta,
          state: "empty" as HomeSurfaceState,
        }
      : mapState === "empty"
        ? {
            title: `Tag the first curriculum signal for ${activeLearner?.label || "this learner"}`,
            note: "Start by planning one tagged learning block or capturing one linked learning moment.",
            href: "/my-plan",
            cta: "Open My Plan",
            state: "empty" as HomeSurfaceState,
          }
        : {
            title: `Strengthen ${selectedSubject?.title || "the next subject"} coverage`,
            note:
              summaryCounts.needs_support > 0
                ? `Add one more capture to support ${selectedSubject?.strands.find((strand) => strand.counts.needs_support > 0)?.title || "the next strand"}.`
                : `Plan one learning block for ${selectedSubject?.strands.find((strand) => strand.counts.not_started > 0)?.title || "the next strand"} this week.`,
            href: summaryCounts.needs_support > 0 ? "/capture" : "/my-plan",
            cta: summaryCounts.needs_support > 0 ? "Capture Evidence" : "Open My Plan",
            state: mapState,
          };

  return (
    <FamilyTopNavShell
      subtitle="Curriculum Map"
      heroTitle="Curriculum Map"
      heroText="See what has been covered, what is strengthening, and what to focus on next."
      heroAsideTitle="Coverage Snapshot"
      heroAsideText="Keep curriculum visible without turning planning into admin."
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        <CurriculumFrameworkSummaryBar
          framework={learningConfig.frameworkLabel}
          jurisdiction={learningConfig.jurisdictionLabel}
          yearBand={learningConfig.yearBand}
          subjectsLabel={preset.subjects.map((subject) => subject.title).slice(0, 4).join(", ")}
          state={mapState}
        />

        <CoverageSummaryCards cards={summaryCards} state={mapState} />

        <SubjectCoverageTabs
          subjects={subjectTabs}
          selectedSubjectId={selectedSubjectKey}
          onSelect={setSelectedSubjectId}
          state={mapState}
        />

        <CoverageLegend />

        {mapState === "empty" && hasActiveLearner ? (
          <CurriculumMapEmptyState learnerName={activeLearner?.label || "this learner"} />
        ) : null}

        <section className="grid gap-4">
          <div className="grid gap-1.5">
            <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Strand coverage
            </div>
            <h2 className="text-[18px] font-bold tracking-tight text-slate-950">
              {selectedSubject?.title || "Coverage"}
            </h2>
          </div>

          <div className="grid gap-4">
            {(selectedSubject?.strands || []).map((strand) => (
              <StrandCoverageCard
                key={strand.id}
                strand={strand}
                expanded={expandedStrands[selectedSubjectKey] === strand.id}
                onToggle={() =>
                  setExpandedStrands((prev) => ({
                    ...prev,
                    [selectedSubjectKey]:
                      prev[selectedSubjectKey] === strand.id ? null : strand.id,
                  }))
                }
                state={mapState}
              />
            ))}
          </div>
        </section>

        <CurriculumNextMoveCard
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
