"use client";

import React, { useMemo, useRef, useState } from "react";
import AssessmentAnchorPlacementRunner from "@/app/components/clean/assessment-lab/AssessmentAnchorPlacementRunner";
import AssessmentNumberOperationsProfileCard from "@/app/components/clean/assessment-lab/AssessmentNumberOperationsProfileCard";
import AssessmentEvidencePreviewCard from "@/app/components/clean/assessment-lab/AssessmentEvidencePreviewCard";
import { buildNumberOperationsProfile } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import { buildNumberOperationsEvidencePreview } from "@/lib/clean/assessments/placement/numberOperationsEvidencePreview";
import { buildNumberOperationsBaselineSummarySnapshot } from "@/lib/clean/assessments/placement/numberOperationsBaselineSnapshot";
import { buildNumberOperationsBaselinePersistenceDraft } from "@/lib/clean/assessments/placement/numberOperationsPersistenceDraft";
import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import type { NumberOperationsSubElementAttemptTrace } from "@/lib/clean/assessments/placement/numberOperationsAttemptTrace";

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

export default function AssessmentNumberOperationsBaselineRunner() {
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
  const startedAtRef = useRef(new Date().toISOString());

  const currentKey = ORDER[currentIndex];
  const profile = useMemo(
    () => buildNumberOperationsProfile(Object.values(resultsByKey)),
    [resultsByKey],
  );

  const reset = () => {
    setCurrentIndex(0);
    setResultsByKey({});
    setUnresolved([]);
    setTracesByKey({});
    setPendingResult(undefined);
    setComplete(false);
    setCompletedAt(null);
    startedAtRef.current = new Date().toISOString();
  };

  const continueBaseline = () => {
    if (pendingResult) {
      setResultsByKey((current) => ({
        ...current,
        [currentKey]: pendingResult,
      }));
    } else if (pendingResult === null) {
      setUnresolved((current) =>
        current.includes(currentKey) ? current : [...current, currentKey],
      );
    } else {
      return;
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
        {unresolved.length ? (
          <div style={{ ...panel, background: "#FFFDF5" }}>
            <strong style={{ color: "#92400E" }}>Evidence still unresolved</strong>
            <p style={{ margin: 0, color: "#6B4F1D", lineHeight: 1.6 }}>
              The baseline deliberately withheld a reportable result for{" "}
              {unresolved.map((key) => LABELS[key]).join(", ")}. This is a valid
              outcome when the current electronic item set cannot support a
              defensible placement.
            </p>
          </div>
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
          Restart Number & Operations baseline
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
          Staff all-in-one baseline proof
        </span>
        <h2 style={{ margin: 0, color: "#17204B" }}>
          Number & Operations baseline
        </h2>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
          Area {currentIndex + 1} of {ORDER.length}:{" "}
          <strong>{LABELS[currentKey]}</strong>. Each area routes independently;
          the final profile does not average the five continua into a single
          level.
        </p>
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
              ? "This area has a reportable staff-lab result."
              : "This area is unresolved with the current electronic evidence."}
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
              ? "View Number & Operations profile"
              : "Continue to next area"}
          </button>
        </div>
      ) : null}

      {profile.assessedSubElements ? (
        <small style={{ color: "#64748B" }}>
          {profile.assessedSubElements} prior area
          {profile.assessedSubElements === 1 ? "" : "s"} currently have a
          reportable result in this run.
        </small>
      ) : null}
    </section>
  );
}
