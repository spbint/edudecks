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
  MyDayHeader,
  MyDayQuickLinks,
  TodayLearningBlockCard,
  TodayLearningFlow,
} from "@/app/components/day/MyDayOverviewComponents";
import { loadEvidenceEntriesWithVariants } from "@/lib/familyEvidence";
import { loadFamilyCalendarWindow } from "@/lib/familyPlanner";
import { loadFamilyPrograms } from "@/lib/familyPlanningTemplates";
import { presetFromFrameworkSelection, type FrameworkPreset } from "@/lib/curriculumFrameworks";
import { resolveEffectiveLearnerLearningConfig } from "@/lib/familyLearningConfig";
import { buildMyDayView, type MyDayEvidenceRow, type MyDayView } from "@/lib/myDay";
import type { Program } from "@/lib/familyPlanningTemplates";
import type { FamilyCalendarBlockEntry } from "@/lib/familyPlanner";
import type { FamilyLearner } from "@/lib/familyWorkspace";

const FAMILY_DAY_ID = "__family-day";

const EVIDENCE_SELECTS = [
  "id,title,summary,occurred_on,created_at,evidence_type,linked_learning_plan_item_id",
];

type LearnerDayRow = {
  learner: FamilyLearner;
  view: MyDayView;
  blocksCount: number;
  capturedCount: number;
  nextStepLabel: string;
};

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

function plural(value: number, singular: string, pluralLabel = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralLabel}`;
}

function noLearnerStateText(hasLearners: boolean) {
  if (!hasLearners) {
    return {
      title: "Choose a learner for today",
      note: "Add one learner to see today's blocks.",
      ctaLabel: "Add your first learner",
      ctaHref: "/family#learner-management",
    };
  }

  return {
    title: "Choose a learner for today",
    note: "Blocks and capture follow the selected learner.",
    ctaLabel: "Open My Family",
    ctaHref: "/family",
  };
}

function learnerStatusText(blocksCount: number, capturedCount: number) {
  if (blocksCount > 0 && capturedCount > 0) {
    return `${plural(blocksCount, "block")} planned, ${capturedCount} captured`;
  }
  if (blocksCount > 0) return `${plural(blocksCount, "block")} planned`;
  if (capturedCount > 0) return `${capturedCount} captured`;
  return "Shape day";
}

function nextStepLabel(view: MyDayView) {
  if (!view.blocks.length) return "Shape day";
  const nextBlock = view.nextUp ?? view.blocks.find((block) => block.evidenceCount === 0) ?? null;
  if (nextBlock) return `Next: ${nextBlock.subject || nextBlock.title}`;
  return "Review";
}

function TodayEmptyGuidance({
  title = "No blocks planned yet",
  todayYmd,
  quickCaptureHref,
  canCapture,
}: {
  title?: string;
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
          {title}
        </div>
        <p className="max-w-[42ch] text-[14px] leading-6 text-slate-600">
          Add one block in My Plan or capture what already happened.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          href={`/my-plan?date=${encodeURIComponent(todayYmd)}`}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
        >
          Shape day in My Plan
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
    </section>
  );
}

function LoadingFlowSkeleton() {
  return (
    <div className="grid gap-4">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-44 animate-pulse rounded-[22px] border border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}

function TodayAtAGlancePanel({
  learnerName,
  blocksCount,
  capturedCount,
  dayState,
  todayYmd,
}: {
  learnerName: string;
  blocksCount: number;
  capturedCount: number;
  dayState: HomeSurfaceState;
  todayYmd: string;
}) {
  const loading = dayState === "loading";
  const nextAction = loading
    ? "Checking today"
    : blocksCount > 0
      ? "Continue"
      : capturedCount > 0
        ? "Review"
        : "Shape day";

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Today at a glance
      </div>

      <div className="grid gap-3 text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Learner</span>
          <span className="font-bold text-slate-950">{learnerName}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Blocks</span>
          <span className="font-bold text-slate-950">{loading ? "..." : blocksCount}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500">Captured</span>
          <span className="font-bold text-slate-950">{loading ? "..." : capturedCount}</span>
        </div>

        <div className="rounded-[16px] border border-slate-100 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Next action
          </div>
          <div className="mt-1 font-bold text-slate-950">{nextAction}</div>
        </div>

        <Link
          href={`/my-plan?date=${encodeURIComponent(todayYmd)}`}
          className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
        >
          {blocksCount > 0 ? "Continue in My Plan" : "Shape day"}
        </Link>
      </div>
    </div>
  );
}

function FamilyDayAtAGlancePanel({
  rows,
  dayState,
  todayYmd,
}: {
  rows: LearnerDayRow[];
  dayState: HomeSurfaceState;
  todayYmd: string;
}) {
  const loading = dayState === "loading";

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Today at a glance
      </div>

      <div className="grid gap-2">
        {rows.map((row) => (
          <div
            key={row.learner.id}
            className="grid gap-2 rounded-[16px] border border-slate-200 bg-slate-50 px-3 py-3 text-[13px] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="min-w-0">
              <div className="font-bold text-slate-950">{row.learner.label}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-[12px] font-semibold text-slate-500">
                <span>{loading ? "..." : plural(row.blocksCount, "block")}</span>
                <span>{loading ? "..." : `${row.capturedCount} captured`}</span>
              </div>
            </div>
            <div className="text-[12px] font-semibold text-slate-700">
              {loading ? "Checking" : row.nextStepLabel}
            </div>
          </div>
        ))}
      </div>

      <Link
        href={`/my-plan?date=${encodeURIComponent(todayYmd)}`}
        className="mt-4 inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-slate-800"
      >
        Shape family day
      </Link>
    </div>
  );
}

function FamilyLearnerEmptyCard({ learnerName }: { learnerName: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-slate-200 bg-white px-4 py-4">
      <div className="text-[14px] font-semibold text-slate-950">No blocks planned yet</div>
      <div className="mt-1 text-[13px] leading-5 text-slate-500">
        Shape day for {learnerName} in My Plan.
      </div>
    </div>
  );
}

function FamilyDayFlow({
  rows,
  todayYmd,
  canCapture,
  presetByLearnerId,
}: {
  rows: LearnerDayRow[];
  todayYmd: string;
  canCapture: boolean;
  presetByLearnerId: Record<string, FrameworkPreset | null>;
}) {
  return (
    <div className="grid gap-5">
      {rows.map((row) => (
        <section key={row.learner.id} className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[16px] font-bold tracking-[-0.01em] text-slate-950">
              {row.learner.label}
            </h3>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-600">
              {plural(row.blocksCount, "block")}
            </span>
          </div>

          {row.view.blocks.length ? (
            <div className="grid gap-4">
              {row.view.blocks.map((block) => (
                <TodayLearningBlockCard
                  key={`${row.learner.id}-${block.id}`}
                  block={block}
                  planHref={`/my-plan?date=${encodeURIComponent(todayYmd)}&learner=${encodeURIComponent(row.learner.id)}`}
                  captureHref={`/capture?learner=${encodeURIComponent(row.learner.id)}&date=${encodeURIComponent(todayYmd)}&block=${encodeURIComponent(block.id)}`}
                  canCapture={canCapture}
                  preset={presetByLearnerId[row.learner.id] ?? null}
                />
              ))}
            </div>
          ) : (
            <FamilyLearnerEmptyCard learnerName={row.learner.label} />
          )}
        </section>
      ))}
    </div>
  );
}

export default function MyDayWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } =
    useFamilyWorkspace();
  const [dayScope, setDayScope] = useState<"family" | "learner">("family");
  const [blocksByLearnerId, setBlocksByLearnerId] = useState<Record<string, FamilyCalendarBlockEntry[]>>({});
  const [evidenceRowsByLearnerId, setEvidenceRowsByLearnerId] = useState<Record<string, MyDayEvidenceRow[]>>({});
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingDay, setLoadingDay] = useState(true);

  const today = useMemo(() => new Date(), []);
  const todayYmd = useMemo(() => ymd(today), [today]);
  const todayLabel = useMemo(() => formatTodayLabel(today), [today]);
  const learnerIds = useMemo(
    () => workspace.learners.map((learner) => learner.id).filter(Boolean),
    [workspace.learners],
  );

  const hasLearners = workspace.learners.length > 0;
  const isFamilyDay = dayScope === "family" && hasLearners;
  const activeLearnerId = activeLearner?.id || "";

  const canonicalDayReady =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local" &&
    learnerIds.length > 0;

  useEffect(() => {
    let mounted = true;

    async function hydrateDay() {
      if (!canonicalDayReady || !workspace.profile?.id) {
        if (mounted) {
          setBlocksByLearnerId({});
          setEvidenceRowsByLearnerId({});
          setPrograms([]);
          setLoadingDay(false);
        }
        return;
      }

      try {
        setLoadingDay(true);
        const [allPrograms, learnerPayloads] = await Promise.all([
          loadFamilyPrograms({ familyId: workspace.profile.id }).catch(() => []),
          Promise.all(
            learnerIds.map(async (learnerId) => {
              const [window, evidence] = await Promise.all([
                loadFamilyCalendarWindow({
                  familyProfileId: workspace.profile.id,
                  studentId: learnerId,
                  dateFrom: todayYmd,
                  dateTo: todayYmd,
                }).catch(() => ({ dayNotes: {}, blocks: {} })),
                loadEvidenceEntriesWithVariants<MyDayEvidenceRow>(EVIDENCE_SELECTS, {
                  studentId: learnerId,
                  limit: 40,
                }).catch(() => []),
              ]);

              return {
                learnerId,
                blocks: window.blocks[todayYmd] ?? [],
                evidence,
              };
            }),
          ),
        ]);

        if (!mounted) return;

        setPrograms(allPrograms);
        setBlocksByLearnerId(
          Object.fromEntries(learnerPayloads.map((payload) => [payload.learnerId, payload.blocks])),
        );
        setEvidenceRowsByLearnerId(
          Object.fromEntries(learnerPayloads.map((payload) => [payload.learnerId, payload.evidence])),
        );
      } finally {
        if (mounted) setLoadingDay(false);
      }
    }

    void hydrateDay();
    return () => {
      mounted = false;
    };
  }, [canonicalDayReady, learnerIds, todayYmd, workspace.profile?.id]);

  const dayViewsByLearnerId = useMemo(() => {
    const next: Record<string, MyDayView> = {};

    workspace.learners.forEach((learner) => {
      const learnerPrograms = programs.filter((program) => !program.learnerId || program.learnerId === learner.id);
      next[learner.id] = buildMyDayView({
        date: todayYmd,
        learnerId: learner.id,
        blocks: blocksByLearnerId[learner.id] ?? [],
        programs: learnerPrograms,
        evidenceRows: evidenceRowsByLearnerId[learner.id] ?? [],
        now: today,
      });
    });

    return next;
  }, [blocksByLearnerId, evidenceRowsByLearnerId, programs, today, todayYmd, workspace.learners]);

  const evidenceTodayByLearnerId = useMemo(() => {
    const next: Record<string, MyDayEvidenceRow[]> = {};

    workspace.learners.forEach((learner) => {
      next[learner.id] = (evidenceRowsByLearnerId[learner.id] ?? []).filter((row) => {
        const occurred = row.occurred_on || row.created_at;
        return typeof occurred === "string" && occurred.slice(0, 10) === todayYmd;
      });
    });

    return next;
  }, [evidenceRowsByLearnerId, todayYmd, workspace.learners]);

  const presetByLearnerId = useMemo(() => {
    const next: Record<string, FrameworkPreset | null> = {};

    workspace.learners.forEach((learner) => {
      const config = resolveEffectiveLearnerLearningConfig(workspace.profile, learner);
      next[learner.id] = presetFromFrameworkSelection({
        country: config.country,
        frameworkId: config.frameworkId,
        jurisdictionId: config.jurisdictionId,
      });
    });

    return next;
  }, [workspace.learners, workspace.profile]);

  const familyRows = useMemo<LearnerDayRow[]>(
    () =>
      workspace.learners.map((learner) => {
        const view = dayViewsByLearnerId[learner.id] ?? buildMyDayView({
          date: todayYmd,
          learnerId: learner.id,
          blocks: [],
          programs: [],
          evidenceRows: [],
          now: today,
        });

        return {
          learner,
          view,
          blocksCount: view.blocks.length,
          capturedCount: evidenceTodayByLearnerId[learner.id]?.length ?? 0,
          nextStepLabel: nextStepLabel(view),
        };
      }),
    [dayViewsByLearnerId, evidenceTodayByLearnerId, today, todayYmd, workspace.learners],
  );

  const familyBlocksCount = familyRows.reduce((sum, row) => sum + row.blocksCount, 0);
  const familyCapturedCount = familyRows.reduce((sum, row) => sum + row.capturedCount, 0);
  const activeDayView = activeLearnerId ? dayViewsByLearnerId[activeLearnerId] ?? null : null;
  const activeEvidenceToday = activeLearnerId ? evidenceTodayByLearnerId[activeLearnerId] ?? [] : [];
  const activeBlocksCount = activeDayView?.blocks.length ?? 0;
  const activeCapturedCount = activeEvidenceToday.length;

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
      : !hasLearners
        ? "empty"
        : isFamilyDay
          ? canonicalDayReady
            ? familyBlocksCount || familyCapturedCount
              ? "live"
              : "empty"
            : "placeholder"
          : activeLearner
            ? canonicalDayReady
              ? activeBlocksCount || activeCapturedCount
                ? "live"
                : "empty"
              : "placeholder"
            : "empty";

  const canCapture = canonicalDayReady;
  const noLearner = noLearnerStateText(hasLearners);
  const quickCaptureHref = activeLearnerId
    ? `/capture?learner=${encodeURIComponent(activeLearnerId)}&date=${encodeURIComponent(todayYmd)}`
    : `/capture?date=${encodeURIComponent(todayYmd)}`;

  const handleSelectLearner = (learnerId: string) => {
    if (learnerId === FAMILY_DAY_ID) {
      setDayScope("family");
      return;
    }

    setDayScope("learner");
    setActiveLearner(learnerId);
  };

  const learnerOptions: LearnerOption[] = hasLearners
    ? [
        {
          id: FAMILY_DAY_ID,
          label: "Family day",
          note:
            workspaceLoading || loadingDay
              ? "Checking all learners"
              : `${plural(familyBlocksCount, "block")} planned, ${familyCapturedCount} captured`,
        },
        ...workspace.learners.map((learner) => {
          const view = dayViewsByLearnerId[learner.id];
          const blocksCount = view?.blocks.length ?? 0;
          const capturedCount = evidenceTodayByLearnerId[learner.id]?.length ?? 0;

          return {
            id: learner.id,
            label: learner.label,
            note: `${learner.yearLabel || learner.year_band || "Learner"} - ${learnerStatusText(blocksCount, capturedCount)}`,
          };
        }),
      ]
    : [];

  const headerLearnerName = isFamilyDay ? "Family day" : activeLearner?.label || "No learner selected";
  const heroAsideText = isFamilyDay
    ? `${familyBlocksCount} blocks, ${familyCapturedCount} captured.`
    : activeLearner
      ? `${activeBlocksCount} blocks, ${activeCapturedCount} captured.`
      : "Choose a learner.";

  return (
    <FamilyTopNavShell
      subtitle="My Day"
      heroTitle="My Day"
      heroText="Run today's blocks."
      workflowHelperText="Plan the block, run it, capture it."
      heroAsideTitle="Today at a glance"
      heroAsideText={heroAsideText}
    >
      <div className="grid gap-6 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={isFamilyDay ? FAMILY_DAY_ID : activeLearner?.id}
          onSelectLearner={handleSelectLearner}
          state={learnerSelectorState}
        />

        <MyDayHeader dateLabel={todayLabel} learnerName={headerLearnerName} state={dayState} />

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
          {isFamilyDay ? (
            <TodayLearningFlow
              blocks={
                <FamilyDayFlow
                  rows={familyRows}
                  todayYmd={todayYmd}
                  canCapture={canCapture}
                  presetByLearnerId={presetByLearnerId}
                />
              }
              empty={
                dayState === "loading" ? (
                  <LoadingFlowSkeleton />
                ) : !hasLearners ? (
                  <section className="grid gap-3 rounded-[26px] border border-dashed border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Today
                    </div>
                    <div className="text-[20px] font-bold tracking-[-0.02em] text-slate-950">
                      {noLearner.title}
                    </div>
                    <p className="max-w-[42ch] text-[14px] leading-6 text-slate-600">{noLearner.note}</p>
                    <Link
                      href={noLearner.ctaHref}
                      className="inline-flex w-fit items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
                    >
                      {noLearner.ctaLabel}
                    </Link>
                  </section>
                ) : familyBlocksCount === 0 ? (
                  <TodayEmptyGuidance
                    title="No family blocks planned yet"
                    todayYmd={todayYmd}
                    quickCaptureHref={`/capture?date=${encodeURIComponent(todayYmd)}`}
                    canCapture={canCapture}
                  />
                ) : undefined
              }
            />
          ) : (
            <TodayLearningFlow
              blocks={
                <div className="grid gap-4">
                  {activeDayView?.blocks.map((block) => (
                    <TodayLearningBlockCard
                      key={block.id}
                      block={block}
                      planHref={`/my-plan?date=${encodeURIComponent(todayYmd)}&learner=${encodeURIComponent(activeLearnerId)}`}
                      captureHref={`/capture?learner=${encodeURIComponent(activeLearnerId)}&date=${encodeURIComponent(todayYmd)}&block=${encodeURIComponent(block.id)}`}
                      canCapture={canCapture && Boolean(activeLearnerId)}
                      preset={activeLearnerId ? presetByLearnerId[activeLearnerId] ?? null : null}
                    />
                  ))}
                </div>
              }
              empty={
                !activeLearner ? (
                  <section className="grid gap-3 rounded-[26px] border border-dashed border-slate-200/90 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.045)]">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Today
                    </div>
                    <div className="text-[20px] font-bold tracking-[-0.02em] text-slate-950">
                      {noLearner.title}
                    </div>
                    <p className="max-w-[42ch] text-[14px] leading-6 text-slate-600">{noLearner.note}</p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link
                        href={noLearner.ctaHref}
                        className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-slate-800"
                      >
                        {noLearner.ctaLabel}
                      </Link>
                      <Link
                        href={`/my-plan?date=${encodeURIComponent(todayYmd)}`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Shape day in My Plan
                      </Link>
                    </div>
                  </section>
                ) : dayState === "loading" ? (
                  <LoadingFlowSkeleton />
                ) : activeBlocksCount === 0 ? (
                  <TodayEmptyGuidance
                    todayYmd={todayYmd}
                    quickCaptureHref={quickCaptureHref}
                    canCapture={canCapture && Boolean(activeLearnerId)}
                  />
                ) : undefined
              }
            />
          )}

          <div className="grid content-start gap-4 lg:sticky lg:top-4">
            {isFamilyDay ? (
              <FamilyDayAtAGlancePanel
                rows={familyRows}
                dayState={dayState}
                todayYmd={todayYmd}
              />
            ) : (
              <TodayAtAGlancePanel
                learnerName={activeLearner?.label || "No learner selected"}
                blocksCount={activeBlocksCount}
                capturedCount={activeCapturedCount}
                dayState={dayState}
                todayYmd={todayYmd}
              />
            )}
          </div>
        </section>

        <MyDayQuickLinks />
      </div>
    </FamilyTopNavShell>
  );
}
