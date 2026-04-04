"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getPostOnboardingStage,
  getWeeklyRhythmCue,
  postOnboardingConfig,
  type PostOnboardingStage,
} from "@/lib/postOnboarding";
import {
  buildGuidedContext,
  getCompletionMessage,
  getGuidedReturnState,
  getReturnGuidance,
  type GuidedReturnState,
} from "@/lib/guidedReturn";
import {
  buildGuidedProgressSignals,
  getConfidenceState,
  getNextMilestone,
  getProgressSignal,
  type GuidedProgressPage,
  type GuidedProgressSignals,
} from "@/lib/guidedProgress";

type PostOnboardingPanelProps = {
  stage?: PostOnboardingStage | null;
};

const CHILDREN_KEY = "edudecks_children_seed_v1";
const ACTIVE_STUDENT_KEY = "edudecks_active_student_id";
const PLAN_KEY = "edudecks_plan";
const REPORT_DRAFT_INDEX_KEY = "edudecks.reports.savedDraftIds";
const REPORT_ACTIVE_DRAFT_KEY = "edudecks.reports.activeDraftId";

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getWeekKey(date = new Date()): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((diffDays + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function mapStageToProgressPage(stage: PostOnboardingStage): GuidedProgressPage {
  if (stage === "planning") return "planner";
  return stage;
}

function readLocalDraft(storage: Storage, draftId: string) {
  if (!draftId) return null;
  return parseJson<{
    selectedEvidenceIds?: string[];
    selectedAreas?: string[];
  } | null>(storage.getItem(`edudecks.reports.draft.${draftId}`), null);
}

function readGuidedProgressSignals(
  page: GuidedProgressPage
): GuidedProgressSignals {
  if (typeof window === "undefined") {
    return buildGuidedProgressSignals({ page });
  }

  const storage = window.localStorage;
  const searchParams = new URLSearchParams(window.location.search);
  const children = parseJson<any[]>(storage.getItem(CHILDREN_KEY), []);
  const activeStudentId = safeText(storage.getItem(ACTIVE_STUDENT_KEY));
  const activeChild =
    children.find((child) => safeText(child?.id) === activeStudentId) ||
    children[0] ||
    null;

  const evidenceCount = Math.max(
    safeNumber(activeChild?.evidenceCount ?? activeChild?.evidence_count ?? activeChild?.entries),
    0
  );
  const distinctLearningAreas = Math.max(
    safeNumber(
      activeChild?.recentAreaCount ?? activeChild?.recent_area_count ?? activeChild?.coverage
    ),
    0
  );

  const requestedDraftId = safeText(searchParams.get("draftId"));
  const activeDraftId = safeText(storage.getItem(REPORT_ACTIVE_DRAFT_KEY));
  const savedDraftIds = parseJson<string[]>(storage.getItem(REPORT_DRAFT_INDEX_KEY), []);
  const draftId = requestedDraftId || activeDraftId || safeText(savedDraftIds[0]);
  const localDraft = readLocalDraft(storage, draftId);
  const selectedEvidenceCount = Array.isArray(localDraft?.selectedEvidenceIds)
    ? localDraft!.selectedEvidenceIds.length
    : 0;
  const draftAreaCount = Array.isArray(localDraft?.selectedAreas)
    ? localDraft!.selectedAreas.filter(Boolean).length
    : 0;

  if (page === "planner") {
    const planMap = parseJson<Record<string, any>>(storage.getItem(PLAN_KEY), {});
    const currentPlan = activeStudentId
      ? planMap[`${activeStudentId}:${getWeekKey()}`]
      : null;

    return buildGuidedProgressSignals({
      page,
      hasWeeklyFocus: Boolean(
        safeText(currentPlan?.focusTitle) || safeText(currentPlan?.selectedGoal)
      ),
      checklistCount: Array.isArray(currentPlan?.actions) ? currentPlan.actions.length : 0,
    });
  }

  if (page === "reports") {
    return buildGuidedProgressSignals({
      page,
      hasDraft: Boolean(draftId),
      selectedEvidenceCount,
      distinctLearningAreas: Math.max(draftAreaCount, distinctLearningAreas),
    });
  }

  if (page === "output") {
    return buildGuidedProgressSignals({
      page,
      hasDraft: Boolean(draftId),
      selectedEvidenceCount,
      distinctLearningAreas: Math.max(draftAreaCount, distinctLearningAreas),
      outputOpened: true,
    });
  }

  if (page === "authority") {
    return buildGuidedProgressSignals({
      page,
      hasDraft: Boolean(draftId),
      selectedEvidenceCount,
      distinctLearningAreas: Math.max(draftAreaCount, distinctLearningAreas),
      authorityStarted: true,
    });
  }

  return buildGuidedProgressSignals({
    page,
    evidenceCount: Math.max(evidenceCount, selectedEvidenceCount),
    distinctLearningAreas: Math.max(distinctLearningAreas, draftAreaCount),
  });
}

function labelStyle(): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#64748b",
  };
}

function helperCardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    background: "#ffffff",
    padding: 14,
  };
}

export default function PostOnboardingPanel({ stage }: PostOnboardingPanelProps) {
  const pathname = usePathname();
  const resolvedStage = stage ?? getPostOnboardingStage(pathname);
  const [returnState, setReturnState] = useState<GuidedReturnState | null>(null);
  const progressPage = resolvedStage ? mapStageToProgressPage(resolvedStage) : "capture";
  const [progressSignals, setProgressSignals] = useState<GuidedProgressSignals>(() =>
    buildGuidedProgressSignals({ page: progressPage })
  );

  if (!resolvedStage) return null;

  const content = postOnboardingConfig[resolvedStage];
  const rhythmCue = getWeeklyRhythmCue();
  const planningSurface = resolvedStage === "planning";
  const context = useMemo(
    () =>
      buildGuidedContext({
        page: progressPage,
        reportReady:
          resolvedStage === "output" || resolvedStage === "authority",
      }),
    [progressPage, resolvedStage]
  );
  const returnMessage = returnState ? getReturnGuidance(context, returnState) : "";
  const completionMessage = getCompletionMessage(context);
  const confidenceState = getConfidenceState(progressSignals);
  const progressSignal = getProgressSignal(progressSignals);
  const nextMilestone = getNextMilestone(progressSignals);

  useEffect(() => {
    setReturnState(getGuidedReturnState());
    setProgressSignals(readGuidedProgressSignals(progressPage));
  }, [progressPage]);

  return (
    <section
      aria-label="Guided mode"
      style={{
        border: planningSurface ? "1px solid #cbdcf5" : "1px solid #dbe7f3",
        borderRadius: 20,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
        padding: 18,
        boxShadow: planningSurface
          ? "0 14px 34px rgba(15,23,42,0.06)"
          : "0 10px 30px rgba(15,23,42,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div style={labelStyle()}>Guided mode</div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 999,
            padding: "6px 10px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1d4ed8",
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: "nowrap",
          }}
        >
          {confidenceState}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: planningSurface
            ? "minmax(0, 1fr) minmax(280px, 0.95fr)"
            : "minmax(0, 1.1fr) minmax(260px, 0.9fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: planningSurface ? 26 : 24,
              lineHeight: 1.2,
              fontWeight: 900,
              color: "#0f172a",
            }}
          >
            {content.title}
          </h2>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 15,
              lineHeight: 1.7,
              color: "#475569",
              maxWidth: 760,
            }}
          >
            {content.reassurance}
          </p>
          <div
            style={{
              marginTop: 12,
              fontSize: 13,
              lineHeight: 1.6,
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            {rhythmCue.label}: {rhythmCue.text}
          </div>
        </div>

        <div style={helperCardStyle()}>
          <div style={labelStyle()}>What to do now</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 1.65,
              color: "#334155",
              fontWeight: 700,
            }}
          >
            {content.next}
          </div>

          {returnMessage ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: "#4b5563",
                lineHeight: 1.6,
              }}
            >
              {returnMessage}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: "1px solid #eef2f7",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.6,
                fontWeight: 700,
              }}
            >
              {progressSignal}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              Next milestone: {nextMilestone}
            </div>
          </div>

          {completionMessage ? (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 8,
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                fontSize: 13,
                color: "#065f46",
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              {completionMessage}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
