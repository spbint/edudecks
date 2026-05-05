"use client";

import { useEffect, useMemo, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
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

const FAMILY_DAY_ID = "__family-day";

const EVIDENCE_SELECTS = [
  "id,title,summary,occurred_on,created_at,evidence_type,linked_learning_plan_item_id",
];

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
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
  const nextBlock = view.nextUp ?? view.blocks.find((b) => b.evidenceCount === 0);
  return nextBlock ? `Next: ${nextBlock.subject || nextBlock.title}` : "Review";
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

  const learnerIds = workspace.learners.map((l) => l.id).filter(Boolean);
  const hasLearners = workspace.learners.length > 0;
  const isFamilyDay = dayScope === "family" && hasLearners;
  const activeLearnerId = activeLearner?.id || "";

  useEffect(() => {
    let mounted = true;

    async function hydrateDay() {
      try {
        setLoadingDay(true);

        const [allPrograms, learnerPayloads] = await Promise.all([
          loadFamilyPrograms({ familyId: workspace.profile?.id || "" }).catch(() => []),
          Promise.all(
            learnerIds.map(async (learnerId) => {
              const [window, evidence] = await Promise.all([
                loadFamilyCalendarWindow({
                  familyProfileId: workspace.profile?.id || "",
                  studentId: learnerId,
                  dateFrom: todayYmd,
                  dateTo: todayYmd,
                }).catch(() => ({ blocks: {} })),
                loadEvidenceEntriesWithVariants<MyDayEvidenceRow>(EVIDENCE_SELECTS, {
                  studentId: learnerId,
                  limit: 40,
                }).catch(() => []),
              ]);

              const blocksByDate =
                (window.blocks ?? {}) as Record<string, FamilyCalendarBlockEntry[]>;

              return {
                learnerId,
                blocks: blocksByDate[todayYmd] ?? [],
                evidence,
              };
            }),
          ),
        ]);

        if (!mounted) return;

        setPrograms(allPrograms);
        setBlocksByLearnerId(Object.fromEntries(learnerPayloads.map(p => [p.learnerId, p.blocks])));
        setEvidenceRowsByLearnerId(Object.fromEntries(learnerPayloads.map(p => [p.learnerId, p.evidence])));
      } finally {
        if (mounted) setLoadingDay(false);
      }
    }

    void hydrateDay();
    return () => { mounted = false; };
  }, [learnerIds, todayYmd, workspace.profile?.id]);

  const dayViewsByLearnerId = useMemo(() => {
    const map: Record<string, MyDayView> = {};

    workspace.learners.forEach((learner) => {
      map[learner.id] = buildMyDayView({
        date: todayYmd,
        learnerId: learner.id,
        blocks: blocksByLearnerId[learner.id] ?? [],
        programs,
        evidenceRows: evidenceRowsByLearnerId[learner.id] ?? [],
        now: today,
      });
    });

    return map;
  }, [blocksByLearnerId, evidenceRowsByLearnerId, programs, today, todayYmd, workspace.learners]);

  const familyRows = workspace.learners.map((learner) => {
    const view = dayViewsByLearnerId[learner.id];
    return {
      learner,
      view,
      blocksCount: view?.blocks.length ?? 0,
      capturedCount: evidenceRowsByLearnerId[learner.id]?.length ?? 0,
      nextStepLabel: nextStepLabel(view),
    };
  });

  const canCapture =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local";

  const presetByLearnerId = useMemo<Record<string, FrameworkPreset>>(
    () =>
      Object.fromEntries(
        workspace.learners.map((learner) => {
          const config = resolveEffectiveLearnerLearningConfig(workspace.profile, learner);

          return [
            learner.id,
            presetFromFrameworkSelection({
              country: config.country,
              frameworkId: config.frameworkId,
              jurisdictionId: config.jurisdictionId,
            }),
          ];
        }),
      ),
    [workspace.learners, workspace.profile],
  );

  const learnerOptions: LearnerOption[] = hasLearners
    ? [
        { id: FAMILY_DAY_ID, label: "Family day", note: "Combined view" },
        ...workspace.learners.map((l) => ({
          id: l.id,
          label: l.label,
          note: learnerStatusText(
            dayViewsByLearnerId[l.id]?.blocks.length ?? 0,
            evidenceRowsByLearnerId[l.id]?.length ?? 0,
          ),
        })),
      ]
    : [];
  const learnerSelectorState =
    workspaceLoading || loadingDay
      ? "loading"
      : workspace.syncIssue && !hasLearners
        ? "placeholder"
        : hasLearners
          ? "derived"
          : "empty";

  const handleSelectLearner = (id: string) => {
    if (id === FAMILY_DAY_ID) {
      setDayScope("family");
    } else {
      setDayScope("learner");
      setActiveLearner(id);
    }
  };

  return (
    <FamilyTopNavShell
      subtitle="My Day"
      heroTitle="My Day"
      heroText="Run today's blocks."
    >
      <div className="grid gap-6">

        <LearnerSelector
          familyName={workspace.profile?.family_display_name || "Family"}
          learners={learnerOptions}
          activeLearnerId={isFamilyDay ? FAMILY_DAY_ID : activeLearnerId}
          onSelectLearner={handleSelectLearner}
          state={learnerSelectorState}
        />

        <MyDayHeader dateLabel={todayLabel} learnerName={isFamilyDay ? "Family day" : activeLearner?.label || ""} state="live" />

        <TodayLearningFlow
          blocks={
            isFamilyDay ? (
              <div className="space-y-4">
                {familyRows.map((row) => (
                  <div key={row.learner.id}>
                    <h3 className="font-bold">{row.learner.label}</h3>
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
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {dayViewsByLearnerId[activeLearnerId]?.blocks.map((block) => (
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
            )
          }
        />

        <MyDayQuickLinks />

      </div>
    </FamilyTopNavShell>
  );
}
