"use client";

import React, { useMemo, useState } from "react";
import AssessmentAnchorPlacementRunner from "@/app/components/clean/assessment-lab/AssessmentAnchorPlacementRunner";
import AssessmentNumberOperationsProfileCard from "@/app/components/clean/assessment-lab/AssessmentNumberOperationsProfileCard";
import AssessmentEvidencePreviewCard from "@/app/components/clean/assessment-lab/AssessmentEvidencePreviewCard";
import { buildNumberOperationsProfile } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import { buildNumberOperationsEvidencePreview } from "@/lib/clean/assessments/placement/numberOperationsEvidencePreview";
import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

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
  const [pendingResult, setPendingResult] = useState<
    NumberOperationsPlacementResult | null | undefined
  >(undefined);
  const [complete, setComplete] = useState(false);

  const currentKey = ORDER[currentIndex];
  const profile = useMemo(
    () => buildNumberOperationsProfile(Object.values(resultsByKey)),
    [resultsByKey],
  );

  const reset = () => {
    setCurrentIndex(0);
    setResultsByKey({});
    setUnresolved([]);
    setPendingResult(undefined);
    setComplete(false);
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

    return (
      <section style={{ display: "grid", gap: 18 }}>
        <AssessmentNumberOperationsProfileCard profile={finalProfile} />
        <AssessmentEvidencePreviewCard preview={evidencePreview} />
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
