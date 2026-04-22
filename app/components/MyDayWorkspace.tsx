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
  MyDayEmptyState,
  MyDayHeader,
  MyDayNextStep,
  MyDayQuickCaptureCard,
  MyDayQuickLinks,
  MyDaySummary,
  TodayLearningBlockCard,
  TodayLearningFlow,
} from "@/app/components/day/MyDayOverviewComponents";
import { loadEvidenceEntriesWithVariants } from "@/lib/familyEvidence";
import { loadFamilyCalendarWindow } from "@/lib/familyPlanner";
import { loadFamilyPrograms } from "@/lib/familyPlanningTemplates";
import { presetFromFrameworkSelection, type FrameworkPreset } from "@/lib/curriculumFrameworks";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import { buildMyDayView, type MyDayEvidenceRow } from "@/lib/myDay";
import type { Program } from "@/lib/familyPlanningTemplates";
import type { FamilyCalendarBlockEntry } from "@/lib/familyPlanner";

const EVIDENCE_SELECTS = [
  "id,title,summary,occurred_on,created_at,evidence_type,linked_learning_plan_item_id",
];

function ymd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTodayLabel(date: Date) {
  return date.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function noLearnerStateText(hasLearners: boolean) {
  if (!hasLearners) {
    return {
      title: "Add a learner to begin using My Day",
      note: "Daily learning becomes useful once a learner is linked to the family workspace.",
    };
  }
  return {
    title: "Choose a learner to see today clearly",
    note: "My Day follows the learner in focus so the blocks, capture actions, and next step all stay relevant.",
  };
}

export default function MyDayWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [blocksToday, setBlocksToday] = useState<FamilyCalendarBlockEntry[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [evidenceRows, setEvidenceRows] = useState<MyDayEvidenceRow[]>([]);
  const [loadingDay, setLoadingDay] = useState(true);

  const today = useMemo(() => new Date(), []);
  const todayYmd = useMemo(() => ymd(today), [today]);
  const todayLabel = useMemo(() => formatTodayLabel(today), [today]);

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || learner.year_band || "Learner",
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

    async function hydrateDay() {
      if (!hasActiveLearner) {
        if (mounted) {
          setBlocksToday([]);
          setPrograms([]);
          setEvidenceRows([]);
          setLoadingDay(false);
        }
        return;
      }

      if (!canonicalReady || !activeLearner?.id || !workspace.profile?.id) {
        if (mounted) {
          setBlocksToday([]);
          setPrograms([]);
          setEvidenceRows([]);
          setLoadingDay(false);
        }
        return;
      }

      try {
        setLoadingDay(true);

        const [window, allPrograms, evidence] = await Promise.all([
          loadFamilyCalendarWindow({
            familyProfileId: workspace.profile.id,
            studentId: activeLearner.id,
            dateFrom: todayYmd,
            dateTo: todayYmd,
          }),
          loadFamilyPrograms({ familyId: workspace.profile.id }).catch(() => []),
          loadEvidenceEntriesWithVariants<MyDayEvidenceRow>(EVIDENCE_SELECTS, {
            studentId: activeLearner.id,
            limit: 40,
          }).catch(() => []),
        ]);

        if (!mounted) return;

        setBlocksToday(window.blocks[todayYmd] ?? []);
        setPrograms(
          allPrograms.filter((program) => !program.learnerId || program.learnerId === activeLearner.id),
        );
        setEvidenceRows(evidence);
      } finally {
        if (mounted) setLoadingDay(false);
      }
    }

    void hydrateDay();

    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, canonicalReady, hasActiveLearner, todayYmd, workspace.profile?.id]);

  const learnerSelectorState: HomeSurfaceState = workspaceLoading
    ? "loading"
    : hasLearners
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  const dayState: HomeSurfaceState = workspaceLoading || loadingDay
    ? "loading"
    : !hasLearners || !hasActiveLearner
      ? "empty"
      : canonicalReady
        ? blocksToday.length || evidenceRows.length
          ? "live"
          : "empty"
        : "placeholder";

  const effectiveConfig = hasActiveLearner
    ? resolveEffectiveLearnerLearningConfig(workspace.profile, activeLearner)
    : null;

  const preset: FrameworkPreset | null = effectiveConfig
    ? presetFromFrameworkSelection({
        country: effectiveConfig.country,
        frameworkId: effectiveConfig.frameworkId,
        jurisdictionId: effectiveConfig.jurisdictionId,
      })
    : null;

  const activeLearnerId = activeLearner?.id || "";

  const dayView = activeLearnerId
    ? buildMyDayView({
        date: todayYmd,
        learnerId: activeLearnerId,
        blocks: blocksToday,
        programs,
        evidenceRows,
      })
    : null;

  const activeLearnerName = activeLearner?.label || "No learner selected";
  const canCapture = canonicalReady && Boolean(activeLearnerId);
  const quickCaptureHref = activeLearnerId
    ? `/capture?learner=${encodeURIComponent(activeLearnerId)}&date=${encodeURIComponent(todayYmd)}`
    : "/capture";

  const headerState: HomeSurfaceState = !hasActiveLearner
    ? "empty"
    : canonicalReady
      ? "live"
      : "placeholder";

  const noLearner = noLearnerStateText(hasLearners);

  return (
    <FamilyTopNavShell
      subtitle="My Day"
      heroTitle="Move through today's learning with clarity"
      heroText="See what is planned for today, keep the next useful step close, and capture evidence without leaving the flow."
      heroAsideTitle="Today at a glance"
      heroAsideText="My Day brings together today's blocks, capture entry points, and the next step without replacing the wider planning system."
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        <MyDayHeader
          dateLabel={todayLabel}
          learnerName={activeLearnerName}
          state={headerState}
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <TodayLearningFlow
            blocks={
              <>
                {dayView?.blocks.map((block) => (
                  <TodayLearningBlockCard
                    key={block.id}
                    block={block}
                    planHref={`/my-plan?date=${encodeURIComponent(todayYmd)}`}
                    captureHref={`/capture?learner=${encodeURIComponent(activeLearnerId)}&date=${encodeURIComponent(todayYmd)}&block=${encodeURIComponent(block.id)}`}
                    canCapture={canCapture}
                    preset={preset}
                  />
                ))}
              </>
            }
            empty={
              !hasActiveLearner ? (
                <section className="grid gap-2 rounded-[24px] border border-dashed border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.03)]">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Today</div>
                  <div className="text-[18px] font-bold tracking-tight text-slate-950">{noLearner.title}</div>
                  <p className="text-[14px] leading-6 text-slate-600">{noLearner.note}</p>
                </section>
              ) : dayState === "loading" ? (
                <div className="grid gap-4">
                  {[0, 1].map((item) => (
                    <div
                      key={item}
                      className="h-44 animate-pulse rounded-[22px] border border-slate-200 bg-slate-100"
                    />
                  ))}
                </div>
              ) : (
                <MyDayEmptyState />
              )
            }
          />

          <div className="grid content-start gap-4">
            <MyDayQuickCaptureCard
              href={quickCaptureHref}
              disabled={!canCapture}
              note={
                canCapture
                  ? `Capture a learning moment for ${activeLearnerName} without losing today's context.`
                  : hasActiveLearner
                    ? "Capture becomes available once the synced learner workspace is ready."
                    : "Choose a learner first to start capturing from today's flow."
              }
            />
          </div>
        </section>

        {dayView ? <MyDaySummary summary={dayView.summary} /> : null}

        {dayView ? <MyDayNextStep nextStep={dayView.nextStep} /> : null}

        <MyDayQuickLinks />
      </div>
    </FamilyTopNavShell>
  );
}
