"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AssessmentAnchorPlacementRunner from "@/app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner";
import AssessmentNumberOperationsProfileCard from "@/app/components/clean/assessment-starting-point/AssessmentNumberOperationsProfileCard";
import AssessmentNumberOperationsParentUtilityCard from "@/app/components/clean/assessment-starting-point/AssessmentNumberOperationsParentUtilityCard";
import AssessmentEvidencePreviewCard from "@/app/components/clean/assessment-starting-point/AssessmentEvidencePreviewCard";
import AssessmentEvidenceConfirmationCard from "@/app/components/clean/assessment-starting-point/AssessmentEvidenceConfirmationCard";
import { buildNumberOperationsProfile } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import { buildNumberOperationsParentUtility } from "@/lib/clean/assessments/placement/numberOperationsParentUtility";
import { buildNumberOperationsEvidencePreview } from "@/lib/clean/assessments/placement/numberOperationsEvidencePreview";
import { buildNumberOperationsBaselineSummarySnapshot } from "@/lib/clean/assessments/placement/numberOperationsBaselineSnapshot";
import { buildNumberOperationsBaselinePersistenceDraft } from "@/lib/clean/assessments/placement/numberOperationsPersistenceDraft";
import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import type { NumberOperationsSubElementAttemptTrace } from "@/lib/clean/assessments/placement/numberOperationsAttemptTrace";
import {
  NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY,
  buildNumberOperationsBaselineDraft,
  parseNumberOperationsBaselineDraft,
} from "@/lib/clean/assessments/placement/numberOperationsBaselineDraft";
import { getNumberOperationsBaselineBudget } from "@/lib/clean/assessments/placement/numberOperationsBaselineBudget";
import { trackCoreJourneyEvent } from "@/lib/clean/analytics/productAnalytics";
import { MATHS_STARTING_POINT_RELEASE } from "@/lib/clean/assessments/mathsStartingPointRelease";
import { saveNumberOperationsBaseline } from "@/lib/clean/assessments/placement/numberOperationsBaselinePersistenceClient";
import { buildNumberOperationsUnresolvedGuidance } from "@/lib/clean/assessments/placement/numberOperationsUnresolvedGuidance";

const DEFAULT_ORDER: NumberOperationsSubElementKey[] = [
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
];

const LABELS: Record<NumberOperationsSubElementKey, string> = {
  "number-place-value": "Number and place value",
  "counting-processes": "Counting processes",
  "additive-strategies": "Additive strategies",
  "multiplicative-strategies": "Multiplicative strategies",
  "understanding-money": "Understanding money",
};

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 20,
  background: "#ffffff",
  padding: "clamp(18px, 4vw, 26px)",
  display: "grid",
  gap: 14,
};

export default function AssessmentNumberOperationsBaselineRunner({
  familyId,
  familyStorageMode,
  learnerId,
  learnerName,
  mode = "staff-debug",
  userId,
  subElementKeys,
}: {
  familyId?: string | null;
  familyStorageMode?: "database" | "local";
  learnerId?: string | null;
  learnerName?: string | null;
  mode?: "parent-preview" | "staff-debug";
  userId?: string | null;
  subElementKeys?: NumberOperationsSubElementKey[];
}) {
  const requestedScopeKey = (subElementKeys || []).join("|");
  const order = useMemo(() => {
    const requested = requestedScopeKey
      .split("|")
      .filter(
        (key): key is NumberOperationsSubElementKey =>
          DEFAULT_ORDER.includes(key as NumberOperationsSubElementKey),
      );
    const unique = Array.from(new Set(requested));
    return unique.length ? unique : DEFAULT_ORDER;
  }, [requestedScopeKey]);
  const isFullScope =
    order.length === DEFAULT_ORDER.length &&
    order.every((key, index) => key === DEFAULT_ORDER[index]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultsByKey, setResultsByKey] = useState<
    Partial<Record<NumberOperationsSubElementKey, NumberOperationsPlacementResult>>
  >({});
  const [unresolved, setUnresolved] = useState<NumberOperationsSubElementKey[]>([]);
  const [tracesByKey, setTracesByKey] = useState<
    Partial<Record<NumberOperationsSubElementKey, NumberOperationsSubElementAttemptTrace>>
  >({});
  const [pendingResult, setPendingResult] = useState<
    NumberOperationsPlacementResult | null | undefined
  >(undefined);
  const [complete, setComplete] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const startedAtRef = useRef(new Date().toISOString());
  const completionTrackedRef = useRef(false);
  const hydratedCompleteRef = useRef(false);
  const persistenceSubmissionIdRef = useRef<string | null>(null);
  const [persistenceSaving, setPersistenceSaving] = useState(false);
  const [persistenceMessage, setPersistenceMessage] = useState("");
  const [savedAttemptId, setSavedAttemptId] = useState("");
  const learnerStorageSuffix = learnerId ? `:${learnerId}` : "";
  const scopeStorageSuffix = isFullScope ? "" : `:scope-${order.join("+")}`;
  const draftStorageKey =
    `${NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY}${learnerStorageSuffix}${scopeStorageSuffix}`;

  useEffect(() => {
    const draft = parseNumberOperationsBaselineDraft(
      window.sessionStorage.getItem(draftStorageKey),
    );
    if (draft) {
      setCurrentIndex(draft.currentIndex);
      setResultsByKey(draft.resultsByKey);
      setUnresolved(draft.unresolvedSubElements);
      setTracesByKey(draft.tracesByKey);
      startedAtRef.current = draft.startedAt;
      if (draft.status === "complete") {
        hydratedCompleteRef.current = true;
        setCompletedAt(draft.completedAt);
        setComplete(true);
      }
    }
    setDraftHydrated(true);
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftHydrated) return;
    if (complete && !completedAt) return;

    const draft = buildNumberOperationsBaselineDraft({
      status: complete ? "complete" : "in_progress",
      currentIndex,
      resultsByKey,
      unresolvedSubElements: unresolved,
      tracesByKey: complete ? {} : tracesByKey,
      startedAt: startedAtRef.current,
      completedAt: complete ? completedAt : null,
    });
    window.sessionStorage.setItem(
      draftStorageKey,
      JSON.stringify(draft),
    );
  }, [
    complete,
    completedAt,
    currentIndex,
    draftHydrated,
    resultsByKey,
    tracesByKey,
    unresolved,
    draftStorageKey,
  ]);

  const currentKey =
    order[Math.min(currentIndex, order.length - 1)] || DEFAULT_ORDER[0];
  const budget = useMemo(() => getNumberOperationsBaselineBudget(), []);
  const currentAreaBudget = budget.bySubElement.find(
    (area) => area.key === currentKey,
  );
  const pauseHref = useMemo(() => {
    const params = new URLSearchParams({ subjectKey: "mathematics" });
    const cleanLearnerId = String(learnerId ?? "").trim();
    if (cleanLearnerId) params.set("learnerId", cleanLearnerId);
    return `/my-pathways?${params.toString()}`;
  }, [learnerId]);
  const startingPointReturnHref = useMemo(() => {
    const params = new URLSearchParams();
    const cleanLearnerId = String(learnerId ?? "").trim();
    if (cleanLearnerId) params.set("learnerId", cleanLearnerId);
    if (order.length === 1 && order[0]) params.set("area", order[0]);
    return params.size
      ? `/assessments/maths-starting-point?${params.toString()}`
      : "/assessments/maths-starting-point";
  }, [learnerId, order]);
  const profile = useMemo(
    () =>
      buildNumberOperationsProfile(Object.values(resultsByKey), {
        expectedSubElementKeys: order,
      }),
    [order, resultsByKey],
  );
  const completedAreaCount = Math.min(
    order.length,
    currentIndex + (pendingResult !== undefined ? 1 : 0),
  );
  const responseCount = useMemo(
    () =>
      Object.values(tracesByKey).reduce(
        (total, trace) =>
          total +
          (trace?.stages.reduce(
            (stageTotal, stage) => stageTotal + stage.responses.length,
            0,
          ) ?? 0),
        0,
      ),
    [tracesByKey],
  );

  useEffect(() => {
    if (
      !complete ||
      completionTrackedRef.current ||
      hydratedCompleteRef.current
    ) {
      return;
    }
    completionTrackedRef.current = true;
    trackCoreJourneyEvent(
      "maths_starting_point_completed",
      {
        area: "maths_starting_point",
        featureArea: "assessment",
        subjectKey: "mathematics",
        itemCount: responseCount,
        presentation: mode,
        viewType: order.length === 1 ? "focused" : "full",
      },
      userId,
    );
  }, [
    complete,
    mode,
    order.length,
    profile.assessedSubElements,
    responseCount,
    unresolved.length,
    userId,
  ]);

  const reset = () => {
    setCurrentIndex(0);
    setResultsByKey({});
    setUnresolved([]);
    setTracesByKey({});
    setPendingResult(undefined);
    setComplete(false);
    setCompletedAt(null);
    startedAtRef.current = new Date().toISOString();
    completionTrackedRef.current = false;
    hydratedCompleteRef.current = false;
    persistenceSubmissionIdRef.current = null;
    setPersistenceSaving(false);
    setPersistenceMessage("");
    setSavedAttemptId("");
    window.sessionStorage.removeItem(draftStorageKey);
  };

  const continueBaseline = () => {
    if (pendingResult === undefined) return;

    trackCoreJourneyEvent(
      "maths_starting_point_area_resolved",
      {
        area: "maths_starting_point",
        featureArea: "assessment",
        subjectKey: "mathematics",
        position: currentIndex + 1,
        presentation: mode,
        viewType: order.length === 1 ? "focused" : "full",
      },
      userId,
    );

    if (pendingResult) {
      setResultsByKey((current) => ({
        ...current,
        [currentKey]: pendingResult,
      }));
    } else if (pendingResult === null) {
      setUnresolved((current) =>
        current.includes(currentKey) ? current : [...current, currentKey],
      );
    }

    if (currentIndex >= order.length - 1) {
      setCompletedAt(new Date().toISOString());
      setComplete(true);
      setPendingResult(undefined);
      return;
    }

    setCurrentIndex((current) => current + 1);
    setPendingResult(undefined);
  };

  if (complete) {
    const finalResults = Object.values(resultsByKey);
    const finalProfile = buildNumberOperationsProfile(finalResults, {
      expectedSubElementKeys: order,
    });
    const parentUtility = buildNumberOperationsParentUtility(finalProfile, {
      learnerId,
    });
    const evidencePreview = buildNumberOperationsEvidencePreview(finalProfile);
    const baselineSnapshot = buildNumberOperationsBaselineSummarySnapshot({
      profile: finalProfile,
      unresolvedSubElements: unresolved,
      subElementAttempts: Object.values(tracesByKey).filter(
        (trace): trace is NumberOperationsSubElementAttemptTrace => Boolean(trace),
      ),
      startedAt: startedAtRef.current,
      completedAt: completedAt || new Date().toISOString(),
    });
    const persistenceDraft =
      buildNumberOperationsBaselinePersistenceDraft(baselineSnapshot);
    const replayTraceCount = Object.values(tracesByKey).filter(Boolean).length;
    const hasCompleteReplayTrace = replayTraceCount === order.length;
    const persistenceContextReady =
      mode === "parent-preview" &&
      MATHS_STARTING_POINT_RELEASE.persistenceEnabled &&
      !MATHS_STARTING_POINT_RELEASE.customerVisible &&
      familyStorageMode === "database" &&
      Boolean(String(familyId ?? "").trim()) &&
      Boolean(String(learnerId ?? "").trim());
    const canRunStaffPersistenceSmoke =
      persistenceContextReady && hasCompleteReplayTrace;
    const persistenceReplayRequired =
      persistenceContextReady && !hasCompleteReplayTrace;

    const runStaffPersistenceSmoke = async () => {
      if (!canRunStaffPersistenceSmoke || persistenceSaving) return;

      setPersistenceSaving(true);
      setPersistenceMessage("");
      try {
        if (!persistenceSubmissionIdRef.current) {
          const randomId =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          persistenceSubmissionIdRef.current = `maths-start-${randomId}`;
        }

        const saved = await saveNumberOperationsBaseline({
          familyId: String(familyId),
          learnerId: String(learnerId),
          clientSubmissionId: persistenceSubmissionIdRef.current,
          draft: persistenceDraft,
        });
        setSavedAttemptId(saved.attemptId);
        setPersistenceMessage(
          "Staff persistence smoke succeeded. Customer visibility remains disabled.",
        );
      } catch (error) {
        setPersistenceMessage(
          error instanceof Error
            ? error.message
            : "The staff persistence smoke could not be completed.",
        );
      } finally {
        setPersistenceSaving(false);
      }
    };
    const unresolvedGuidance =
      buildNumberOperationsUnresolvedGuidance(unresolved);

    return (
      <section style={{ display: "grid", gap: 18 }}>
        <AssessmentNumberOperationsParentUtilityCard
          utility={parentUtility}
          onActionSelected={(_area, destination) =>
            trackCoreJourneyEvent(
              "maths_starting_point_next_action_selected",
              {
                area: "maths_starting_point",
                featureArea: "assessment",
                subjectKey: "mathematics",
                destination,
                presentation: mode,
                viewType: order.length === 1 ? "focused" : "full",
              },
              userId,
            )
          }
        />
        {unresolvedGuidance.length ? (
          <section style={{ ...panel, background: "#FFFDF5", gap: 12 }}>
            <div style={{ display: "grid", gap: 4 }}>
              <strong style={{ color: "#92400E" }}>
                A few areas need real-life evidence
              </strong>
              <p style={{ margin: 0, color: "#6B4F1D", lineHeight: 1.6 }}>
                MyLearna has left these areas open rather than guessing. Try one
                simple observation when it fits naturally, then use fresh evidence
                before making a stronger starting-point judgement.
              </p>
            </div>
            {unresolvedGuidance.map((guidance) => (
              <details
                key={guidance.subElementKey}
                style={{
                  border: "1px solid #F5D08A",
                  borderRadius: 12,
                  background: "#FFFFFF",
                  padding: "10px 12px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    color: "#17204B",
                    fontWeight: 850,
                  }}
                >
                  {guidance.label}: {guidance.headline}
                </summary>
                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    marginTop: 8,
                    color: "#4B5563",
                    lineHeight: 1.55,
                  }}
                >
                  <span>{guidance.tryThis}</span>
                  <strong style={{ color: "#475569" }}>What to notice</strong>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {guidance.evidenceToLookFor.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/my-capture?${new URLSearchParams({
                      ...(learnerId ? { learnerId } : {}),
                      learningArea: "mathematics",
                      learningAreaLabel: "Mathematics",
                      returnTo: startingPointReturnHref,
                    }).toString()}`}
                    style={{
                      width: "fit-content",
                      border: "1px solid #17204B",
                      borderRadius: 10,
                      background: "#FFFFFF",
                      color: "#17204B",
                      padding: "8px 11px",
                      textDecoration: "none",
                      fontWeight: 850,
                    }}
                  >
                    Capture what you noticed
                  </Link>
                </div>
              </details>
            ))}
          </section>
        ) : null}
        <AssessmentEvidenceConfirmationCard
          preview={evidencePreview}
          presentation={mode === "parent-preview" ? "parent" : "staff"}
          onConfirmationPreviewed={({ includeInPortfolio, includeInReport }) =>
            trackCoreJourneyEvent(
              "maths_starting_point_evidence_confirmation_previewed",
              {
                area: "maths_starting_point",
                featureArea: "assessment",
                subjectKey: "mathematics",
                includeInPortfolio,
                includeInReport,
                presentation: mode,
                viewType: order.length === 1 ? "focused" : "full",
              },
              userId,
            )
          }
        />
        {persistenceReplayRequired ? (
          <section
            style={{
              ...panel,
              borderColor: "#F5D08A",
              background: "#FFFDF5",
            }}
          >
            <span
              style={{
                color: "#92400E",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Staff-only persistence safeguard
            </span>
            <strong style={{ color: "#17204B" }}>
              Re-run this check before the persistence smoke
            </strong>
            <span style={{ color: "#6B4F1D", lineHeight: 1.55 }}>
              Completed browser summaries deliberately drop raw response traces.
              The trusted server replay needs the full current-tab route evidence,
              so MyLearna will not persist a rehydrated summary without those traces.
            </span>
          </section>
        ) : null}
        {canRunStaffPersistenceSmoke ? (
          <section
            style={{
              ...panel,
              borderColor: "#D9D0FF",
              background: "#F8F5FF",
            }}
          >
            <span
              style={{
                color: "#6C4DF6",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Staff-only persistence smoke
            </span>
            <strong style={{ color: "#17204B" }}>
              Save this completed baseline through the trusted server replay
            </strong>
            <span style={{ color: "#5B6478", lineHeight: 1.55 }}>
              This control appears only while persistence is enabled and customer
              visibility remains off. It does not publish items, expose the route to
              families or create Portfolio/report evidence.
            </span>
            <button
              type="button"
              onClick={() => void runStaffPersistenceSmoke()}
              disabled={persistenceSaving}
              style={{
                border: 0,
                borderRadius: 11,
                minHeight: 44,
                padding: "10px 14px",
                background: persistenceSaving ? "#A5B4FC" : "#6C4DF6",
                color: "#FFFFFF",
                fontWeight: 850,
                cursor: persistenceSaving ? "wait" : "pointer",
                width: "fit-content",
              }}
            >
              {persistenceSaving
                ? "Saving trusted baseline..."
                : savedAttemptId
                  ? "Retry idempotent save"
                  : "Run staff persistence smoke"}
            </button>
            {persistenceMessage ? (
              <span role="status" style={{ color: "#475569", lineHeight: 1.5 }}>
                {persistenceMessage}
                {savedAttemptId ? ` Attempt ID: ${savedAttemptId}` : ""}
              </span>
            ) : null}
          </section>
        ) : null}

        {mode === "staff-debug" ? (
          <>
            <AssessmentNumberOperationsProfileCard profile={finalProfile} />
            <AssessmentEvidencePreviewCard preview={evidencePreview} />
            <details style={panel}>
          <summary style={{ cursor: "pointer", color: "#17204B", fontWeight: 850 }}>
            Baseline data handoff · schema v{baselineSnapshot.schemaVersion}
          </summary>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <strong style={{ color: "#17204B" }}>
              {baselineSnapshot.status === "complete" ? "Complete baseline snapshot" : "Partial baseline snapshot"}
            </strong>
            <span style={{ color: "#5B6478", lineHeight: 1.55 }}>
              This versioned object is ready for future persistence work, but it is intentionally not written to
              the existing pathway-scoped assessment_attempts table.
            </span>
            <pre
              style={{
                margin: 0,
                maxHeight: 360,
                overflow: "auto",
                borderRadius: 12,
                background: "#0F172A",
                color: "#E2E8F0",
                padding: 14,
                fontSize: 12,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(baselineSnapshot, null, 2)}
            </pre>
          </div>
        </details>
        <details style={panel}>
          <summary style={{ cursor: "pointer", color: "#17204B", fontWeight: 850 }}>
            Future persistence rows · {persistenceDraft.responses.length} response
            {persistenceDraft.responses.length === 1 ? "" : "s"}
          </summary>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <span style={{ color: "#5B6478", lineHeight: 1.55 }}>
              Read-only staff preview. No family ID, learner ID, database ID or user ID is created here.
            </span>
            <pre
              style={{
                margin: 0,
                maxHeight: 360,
                overflow: "auto",
                borderRadius: 12,
                background: "#0F172A",
                color: "#E2E8F0",
                padding: 14,
                fontSize: 12,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
              }}
            >
              {JSON.stringify(persistenceDraft, null, 2)}
            </pre>
          </div>
            </details>
          </>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            border: "1px solid #17204B",
            background: "#17204B",
            color: "#ffffff",
            borderRadius: 12,
            minHeight: 44,
            padding: "9px 14px",
            fontWeight: 850,
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          Start this Number &amp; Operations check again
        </button>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div style={panel}>
        <span
          style={{
            color: "#6C4DF6",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {mode === "parent-preview" ? "Number & Operations Starting Point" : "Staff all-in-one baseline proof"}
        </span>
        <h2 style={{ margin: 0, color: "#17204B" }}>
          {learnerName ? `${learnerName}'s Number & Operations check` : "Number & Operations baseline"}
        </h2>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
          Area {currentIndex + 1} of {order.length}:{" "}
          <strong>{LABELS[currentKey]}</strong>. MyLearna adapts the questions to find a useful starting point in each area separately, so one strength never hides another place that needs support.
        </p>
        {mode === "parent-preview" ? (
          <small style={{ color: "#64748B", lineHeight: 1.5 }}>
            Some questions may feel unusually easy or hard. That is expected:
            MyLearna moves up or down from the evidence rather than assuming a
            level from the learner&apos;s age or year.
          </small>
        ) : null}
        {mode === "staff-debug" ? (
          <div
            style={{
              border: "1px solid #D9D0FF",
              borderRadius: 14,
              background: "#F8F5FF",
              padding: 12,
              display: "grid",
              gap: 4,
            }}
          >
            <strong style={{ color: "#17204B" }}>Adaptive question budget</strong>
            <span style={{ color: "#5B6478", lineHeight: 1.5 }}>
              The current five-area route is bounded between {budget.minimumQuestions} and{" "}
              {budget.maximumQuestions} questions. Strong or clearly weak evidence can
              finish an area sooner; ambiguous evidence triggers reserve or boundary probes.
            </span>
          </div>
        ) : (
          <div
            style={{
              border: "1px solid #D9D0FF",
              borderRadius: 14,
              background: "#F8F5FF",
              padding: 12,
              color: "#5B6478",
              lineHeight: 1.55,
              display: "grid",
              gap: 4,
            }}
          >
            <strong style={{ color: "#17204B" }}>
              {order.length === 1 ? "One focused Number & Operations area" : "Five separate Number & Operations areas"}
            </strong>
            <span>
              A fully electronic area uses {currentAreaBudget?.minimumQuestions ?? 6}–{currentAreaBudget?.maximumQuestions ?? 11} questions. MyLearna may stop sooner when practical or observed evidence is more trustworthy than another screen question.
            </span>
            {order.length > 1 ? (
              <span>
                MyLearna pauses between areas. You can leave after an area and return in this browser tab without losing the areas already completed.
              </span>
            ) : (
              <span>
                This focused check gives a useful result for this area only. It does not pretend to describe the learner&apos;s whole Number &amp; Operations profile.
              </span>
            )}
          </div>
        )}
        <small style={{ color: "#64748B", lineHeight: 1.5 }}>
          {MATHS_STARTING_POINT_RELEASE.persistenceEnabled
            ? "Progress stays in this browser tab during the check. Only the explicit staff-only persistence smoke after completion can write a trusted baseline record; customer evidence writes remain disabled."
            : "Progress and the completed starting-point profile stay in this browser tab for this learner during the staff preview, so recommended practice can return here. No family or learner assessment record is written to the database."}
        </small>
        {mode === "parent-preview" &&
        order.length > 1 &&
        currentIndex > 0 &&
        pendingResult === undefined ? (
          <Link
            href={pauseHref}
            style={{
              width: "fit-content",
              color: "#17204B",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Pause here and return to My Pathways
          </Link>
        ) : null}
        <div
          role="progressbar"
          aria-label="Starting-point areas completed"
          aria-valuemin={0}
          aria-valuemax={order.length}
          aria-valuenow={completedAreaCount}
          style={{
            height: 8,
            background: "#EEF2F7",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(completedAreaCount / order.length) * 100}%`,
              height: "100%",
              background: "#6C4DF6",
            }}
          />
        </div>
      </div>

      <AssessmentAnchorPlacementRunner
        key={currentKey}
        anchorSetKey={currentKey}
        allowBandConfirmation={false}
        presentation={mode === "parent-preview" ? "parent" : "staff"}
        onResult={setPendingResult}
        onAttemptTrace={(trace) =>
          setTracesByKey((current) => ({
            ...current,
            [currentKey]: trace,
          }))
        }
      />

      {pendingResult !== undefined ? (
        <div style={panel}>
          <strong style={{ color: "#17204B" }}>
            {pendingResult
              ? "MyLearna has enough evidence to guide the next learning action in this area."
              : "MyLearna needs a practical or observed example before it can guide this area confidently."}
          </strong>
          <button
            type="button"
            onClick={continueBaseline}
            style={{
              border: "1px solid #6C4DF6",
              background: "#6C4DF6",
              color: "#ffffff",
              borderRadius: 12,
              minHeight: 44,
              padding: "9px 14px",
              fontWeight: 850,
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            {currentIndex >= order.length - 1
              ? "See the starting-point profile"
              : "Continue to the next area"}
          </button>
        </div>
      ) : null}

      {profile.assessedSubElements ? (
        <small style={{ color: "#64748B" }}>
          {profile.assessedSubElements} prior area
          {profile.assessedSubElements === 1 ? "" : "s"} currently have a{" "}
          {mode === "parent-preview"
            ? "usable starting point"
            : "reportable result"}{" "}
          in this run.
        </small>
      ) : null}
    </section>
  );
}
