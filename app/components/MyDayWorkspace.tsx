"use client";

import Link from "next/link";
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
  MyDayNextUpCard,
  MyDayProgressSignal,
  MyDayQuickCaptureCard,
  MyDayQuickLinks,
  MyDayRecentlyCapturedStrip,
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
      title: "My Day is where today's learning becomes clear",
      note: "Add your first learner first. Then My Day can show what is planned today, what comes next, and what is ready to capture.",
      ctaLabel: "Add your first learner",
      ctaHref: "/family#learner-management",
    };
  }

  return {
    title: "Choose the learner you want to run today for",
    note: "My Day follows the learner in focus so today's blocks, capture actions, and next step all stay relevant.",
    ctaLabel: "Open My Family",
    ctaHref: "/family",
  };
}

function learnerStatusText({
  active,
  blocksCount,
  evidenceCount,
  isActiveLearner,
}: {
  active: boolean;
  blocksCount: number;
  evidenceCount: number;
  isActiveLearner: boolean;
}) {
  if (!active) return "Select to view today";

  if (!isActiveLearner) return "Ready to review";

  if (blocksCount > 0 && evidenceCount > 0) {
    return `${blocksCount} planned, ${evidenceCount} captured`;
  }

  if (blocksCount > 0) {
    return `${blocksCount} planned today`;
  }

  if (evidenceCount > 0) {
    return `${evidenceCount} captured today`;
  }

  return "Ready to plan today";
}

function TodayEmptyGuidance({
  learnerName,
  todayYmd,
  quickCaptureHref,
  canCapture,
}: {
  learnerName: string;
  todayYmd: string;
  quickCaptureHref: string;
  canCapture: boolean;
}) {
  return (
    <section className="grid gap-5 rounded-[26px] border border-dashed border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.92)_100%)] p-6 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
      <div className="grid gap-2">
        <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Today
        </div>
        <div className="text-[22px] font-bold tracking-[-0.03em] text-slate-950">
          Nothing is planned for today yet
        </div>
        <p className="max-w-[64ch] text-[14px] leading-6 text-slate-600">
          My Day will fill in once you add a block in My Plan, shape your weekly rhythm in My
          Calendar, or capture a learning moment for {learnerName}.
        </p>
      </div>

      <div className="grid gap-3 rounded-[20px] border border-slate-200 bg-white/85 p-4">
        <div className="text-[13px] font-bold text-slate-950">Recommended start</div>
        <div className="grid gap-2 text-[13px] leading-5 text-slate-600">
          <div>
            <span className="font-semibold text-slate-900">1.</span> Use My Calendar to shape the
            weekly rhythm behind the day.
          </div>
          <div>
            <span className="font-semibold text-slate-900">2.</span> Build the longer sequence in
            My Programs before it lands in the live week.
          </div>
          <div>
            <span className="font-semibold text-slate-900">3.</span> Shape one clear live block in
            My Plan.
          </div>
          <div>
            <span className="font-semibold text-slate-900">4.</span> Capture a real learning moment
            if today has already started.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          href={`/my-plan?date=${encodeURIComponent(todayYmd)}`}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
        >
          Shape today in My Plan
        </Link>

        <Link
          href="/my-calendar"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Review My Calendar rhythm
        </Link>

        <Link
          href={quickCaptureHref}
          aria-disabled={!canCapture}
          className={[
            "inline-flex items-center justify-center rounded-full border px-5 py-3 text-[13px] font-semibold transition",
            canCapture
              ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              : "pointer-events-none border-slate-100 bg-slate-50 text-slate-400",
          ].join(" ")}
        >
          Capture from today
        </Link>
      </div>

      <p className="text-[12px] leading-5 text-slate-500">
        Start with one clear step. One planned block or one captured learning moment is enough to
        make today visible.
      </p>
    </section>
  );
}

function TodayAtAGlancePanel({
  learnerName,
  blocksCount,
  capturedCount,
  dayState,
  canCapture,
  todayYmd,
  quickCaptureHref,
}: {
  learnerName: string;
  blocksCount: number;
  capturedCount: number;
  dayState: HomeSurfaceState;
  canCapture: boolean;
  todayYmd: string;
  quickCaptureHref: string;
}) {
  const loading = dayState === "loading";
  const hasPlan = blocksCount > 0;
  const hasEvidence = capturedCount > 0;

  const nextAction = loading
    ? "Checking today's learning flow"
    : hasPlan
      ? "Capture or continue the next block"
      : hasEvidence
        ? "Review captured evidence"
        : "Shape today in My Plan";

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Today at a glance
      </div>

      <div className="grid gap-3 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Selected learner</span>
          <span className="font-bold text-slate-950">{learnerName}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Planned blocks</span>
          <span className="font-bold text-slate-950">{loading ? "..." : blocksCount}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Captured today</span>
          <span className="font-bold text-slate-950">{loading ? "..." : capturedCount}</span>
        </div>

        <div className="rounded-[16px] border border-slate-100 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Next best action
          </div>
          <div className="mt-1 font-bold text-slate-950">{nextAction}</div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={`/my-plan?date=${encodeURIComponent(todayYmd)}`}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
          >
            Open My Plan
          </Link>

          <Link
            href={quickCaptureHref}
            aria-disabled={!canCapture}
            className={[
              "inline-flex items-center justify-center rounded-full border px-4 py-2 text-[12px] font-semibold transition",
              canCapture
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                : "pointer-events-none border-slate-100 bg-slate-50 text-slate-400",
            ].join(" ")}
          >
            Quick capture
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function MyDayWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } =
    useFamilyWorkspace();

  const [blocksToday, setBlocksToday] = useState<FamilyCalendarBlockEntry[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [evidenceRows, setEvidenceRows] = useState<MyDayEvidenceRow[]>([]);
  const [loadingDay, setLoadingDay] = useState(true);

  const today = useMemo(() => new Date(), []);
  const todayYmd = useMemo(() => ymd(today), [today]);
  const todayLabel = useMemo(() => formatTodayLabel(today), [today]);

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
          loadFamilyCalendarWindow({ familyProfileId: workspace.profile.id, studentId: activeLearner.id, dateFrom: todayYmd, dateTo: todayYmd }),
          loadFamilyPrograms({ familyId: workspace.profile.id }).catch(() => []),
          loadEvidenceEntriesWithVariants<MyDayEvidenceRow>(EVIDENCE_SELECTS, { studentId: activeLearner.id, limit: 40 }).catch(() => []),
        ]);

        if (!mounted) return;
        setBlocksToday(window.blocks[todayYmd] ?? []);
        setPrograms(allPrograms.filter((program) => !program.learnerId || program.learnerId === activeLearner.id));
        setEvidenceRows(evidence);
      } finally {
        if (mounted) setLoadingDay(false);
      }
    }

    void hydrateDay();
    return () => { mounted = false; };
  }, [activeLearner?.id, canonicalReady, hasActiveLearner, todayYmd, workspace.profile?.id]);

  const learnerSelectorState: HomeSurfaceState = workspaceLoading
    ? "loading"
    : hasLearners
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  const dayState: HomeSurfaceState =
    workspaceLoading || loadingDay
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

  const evidenceToday = useMemo(
    () =>
      evidenceRows.filter((row) => {
        const occurred = row.occurred_on || row.created_at;
        return typeof occurred === "string" && occurred.slice(0, 10) === todayYmd;
      }),
    [evidenceRows, todayYmd],
  );

  const dayView = activeLearnerId
    ? buildMyDayView({
        date: todayYmd,
        learnerId: activeLearnerId,
        blocks: blocksToday,
        programs,
        evidenceRows,
        now: today,
      })
    : null;

  const activeLearnerName = activeLearner?.label || "No learner selected";
  const canCapture = canonicalReady && Boolean(activeLearnerId);

  const quickCaptureHref = activeLearnerId
    ? `/capture?date=${encodeURIComponent(todayYmd)}`
    : "/capture";

  const portfolioHref = "/my-portfolio";

  const headerState: HomeSurfaceState = !hasActiveLearner
    ? "empty"
    : canonicalReady
      ? "live"
      : "placeholder";

  const noLearner = noLearnerStateText(hasLearners);

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => {
    const isActiveLearner = learner.id === activeLearner?.id;

    return {
      id: learner.id,
      label: learner.label,
      note: `${learner.yearLabel || learner.year_band || "Learner"} - ${learnerStatusText({
        active: Boolean(activeLearner),
        blocksCount: isActiveLearner ? blocksToday.length : 0,
        evidenceCount: isActiveLearner ? evidenceToday.length : 0,
        isActiveLearner,
      })}`,
    };
  });

  const heroAsideText =
    hasActiveLearner && !workspaceLoading
      ? `${activeLearnerName}: ${blocksToday.length} planned block${
          blocksToday.length === 1 ? "" : "s"
        }, ${evidenceToday.length} captured learning moment${
          evidenceToday.length === 1 ? "" : "s"
        } today.`
      : "Choose a learner to see today's blocks, capture entry points, and the next useful step.";

  return (
    <FamilyTopNavShell
      subtitle="My Day"
      heroTitle="Move through today's learning with clarity"
      heroText="See what is planned for today, keep the next useful step close, and capture evidence without leaving the flow."
      workflowHelperText="My Calendar sets the weekly rhythm. My Programs shapes the longer sequence. My Plan edits the live week. Capture runs the day. Outputs groups curriculum, portfolio, reports, and progress, while Community stays separate from the core workflow."
      heroAsideTitle="Today at a glance"
      heroAsideText={heroAsideText}
    >
      <div className="grid gap-6 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        <MyDayHeader dateLabel={todayLabel} learnerName={activeLearnerName} state={headerState} />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <TodayLearningFlow
            blocks={
              <>
                {dayView?.blocks.map((block) => (
                  <TodayLearningBlockCard
                    key={block.id}
                    block={block}
                    planHref={`/my-plan?date=${encodeURIComponent(todayYmd)}`}
                    captureHref={`/capture?date=${encodeURIComponent(todayYmd)}&block=${encodeURIComponent(
                      block.id,
                    )}`}
                    canCapture={canCapture}
                    preset={preset}
                  />
                ))}
              </>
            }
            empty={
              !hasActiveLearner ? (
                <section className="grid gap-3 rounded-[26px] border border-dashed border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.9)_100%)] p-6 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Today
                  </div>
                  <div className="text-[20px] font-bold tracking-[-0.02em] text-slate-950">
                    {noLearner.title}
                  </div>
                  <p className="max-w-[56ch] text-[14px] leading-6 text-slate-600">
                    {noLearner.note}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link href={noLearner.ctaHref} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800">{noLearner.ctaLabel}</Link>
                    <Link href="/my-plan" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">See how My Plan works</Link>
                  </div>
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
              ) : blocksToday.length === 0 ? (
                <TodayEmptyGuidance
                  learnerName={activeLearnerName}
                  todayYmd={todayYmd}
                  quickCaptureHref={quickCaptureHref}
                  canCapture={canCapture}
                />
              ) : (
                <MyDayEmptyState />
              )
            }
          />

          <div className="grid content-start gap-4 lg:sticky lg:top-4">
            <TodayAtAGlancePanel
              learnerName={activeLearnerName}
              blocksCount={blocksToday.length}
              capturedCount={evidenceToday.length}
              dayState={dayState}
              canCapture={canCapture}
              todayYmd={todayYmd}
              quickCaptureHref={quickCaptureHref}
            />

            <MyDayNextUpCard
              block={dayView?.nextUp ?? null}
              learnerName={activeLearnerName}
              planHref={
                dayView?.nextUp
                  ? `/my-plan?date=${encodeURIComponent(todayYmd)}&block=${encodeURIComponent(
                      dayView.nextUp.id,
                    )}`
                  : `/my-plan?date=${encodeURIComponent(todayYmd)}`
              }
              captureHref={
                dayView?.nextUp
                  ? `/capture?date=${encodeURIComponent(todayYmd)}&block=${encodeURIComponent(
                      dayView.nextUp.id,
                    )}`
                  : quickCaptureHref
              }
              canCapture={canCapture}
            />
            {dayView ? <MyDayProgressSignal progress={dayView.progress} /> : null}
            <MyDayQuickCaptureCard
              href={quickCaptureHref}
              disabled={!canCapture}
              note={canCapture ? `Capture a learning moment for ${activeLearnerName} without losing today's context.` : hasActiveLearner ? "Capture becomes available once the synced learner workspace is ready." : "Choose a learner first to start capturing from today's flow."}
            />
          </div>
        </section>

        {dayView ? <MyDayRecentlyCapturedStrip items={dayView.recentCaptures} portfolioHref={portfolioHref} /> : null}
        {dayView ? <MyDayNextStep nextStep={dayView.nextStep} /> : null}
        {dayView ? <MyDaySummary summary={dayView.summary} /> : null}
        <MyDayQuickLinks />
      </div>
    </FamilyTopNavShell>
  );
}
