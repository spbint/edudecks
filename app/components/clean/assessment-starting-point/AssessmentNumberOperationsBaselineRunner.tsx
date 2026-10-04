"use client";

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

const ORDER: NumberOperationsSubElementKey[] = [
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
  learnerId,
  learnerName,
  mode = "staff-debug",
  userId,
}: {
  learnerId?: string | null;
  learnerName?: string | null;
  mode?: "parent-preview" | "staff-debug";
  userId?: string | null;
}) {
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
  const draftStorageKey = learnerId
    ? `${NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY}:${learnerId}`
    : NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY;

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

  const currentKey = ORDER[currentIndex];
  const budget = useMemo(() => getNumberOperationsBaselineBudget(), []);
  const profile = useMemo(
    () => buildNumberOperationsProfile(Object.values(resultsByKey)),
    [resultsByKey],
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
      },
      userId,
    );
  }, [
    complete,
    mode,
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

    if (currentIndex >= ORDER.length - 1) {
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
    const finalProfile = buildNumberOperationsProfile(finalResults);
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
              },
              userId,
            )
          }
        />
        {unresolved.length ? (
          <div style={{ ...panel, background: "#FFFDF5" }}>
            <strong style={{ color: "#92400E" }}>A few areas still need stronger evidence</strong>
            <p style={{ margin: 0, color: "#6B4F1D", lineHeight: 1.6 }}>
              MyLearna has deliberately left {unresolved.map((key) => LABELS[key]).join(", ")} unresolved rather than guessing. Use the suggested practical learning and check again with fresh evidence later.
            </p>
          </div>
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
              },
              userId,
            )
          }
        />
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
          Start this Maths check again
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
          {mode === "parent-preview" ? "Adaptive Maths starting point" : "Staff all-in-one baseline proof"}
        </span>
        <h2 style={{ margin: 0, color: "#17204B" }}>
          {learnerName ? `${learnerName}'s Number & Operations check` : "Number & Operations baseline"}
        </h2>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
          Area {currentIndex + 1} of {ORDER.length}:{" "}
          <strong>{LABELS[currentKey]}</strong>. MyLearna adapts the questions to find a useful starting point in each area separately, so one strength never hides another place that needs support.
        </p>
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
            }}
          >
            This check adapts as it goes. Clear evidence finishes an area sooner; mixed evidence triggers a few extra questions so MyLearna does not guess.
          </div>
        )}
        <small style={{ color: "#64748B", lineHeight: 1.5 }}>
          Progress and the completed starting-point profile stay in this browser tab for this learner during the staff preview, so recommended practice can return here. No family or learner assessment record is written to the database.
        </small>
        <div
          aria-label="Baseline progress"
          style={{
            height: 8,
            background: "#EEF2F7",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${((currentIndex + 1) / ORDER.length) * 100}%`,
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
            {currentIndex >= ORDER.length - 1
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
