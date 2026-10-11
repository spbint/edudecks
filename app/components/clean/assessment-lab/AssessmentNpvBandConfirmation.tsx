"use client";

import React, { useState } from "react";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { NPV_CONFIRMATION_CLUSTERS } from "@/lib/clean/assessments/placement/numberOperationsNpvConfirmationItems";
import {
  evaluateNpvAdjacentBandConfirmation,
  type NpvAdjacentBandConfirmation,
} from "@/lib/clean/assessments/placement/numberOperationsNpvConfirmation";

type Stage = "idle" | "lower" | "upper" | "result";

const panel: React.CSSProperties = {
  border: "1px solid #D9D0FF",
  borderRadius: 18,
  background: "#FBFAFF",
  padding: 16,
  display: "grid",
  gap: 12,
};

export default function AssessmentNpvBandConfirmation({
  lowerP,
  upperP,
  onConfirmed,
}: {
  lowerP: number;
  upperP: number;
  onConfirmed?: (result: NpvAdjacentBandConfirmation) => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [lowerResponses, setLowerResponses] = useState<MyLearnaAssessmentResponse[]>([]);
  const [result, setResult] = useState<NpvAdjacentBandConfirmation | null>(null);

  const lowerItems =
    NPV_CONFIRMATION_CLUSTERS[lowerP as keyof typeof NPV_CONFIRMATION_CLUSTERS] || null;
  const upperItems =
    NPV_CONFIRMATION_CLUSTERS[upperP as keyof typeof NPV_CONFIRMATION_CLUSTERS] || null;

  if (!lowerItems || !upperItems || upperP !== lowerP + 1) return null;

  if (stage === "idle") {
    return (
      <section style={panel}>
        <strong style={{ color: "#17204B" }}>Fresh adjacent-band confirmation</strong>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
          Run four different questions to check both sides of P{lowerP}–P{upperP}.
          These are not repeats of the routing items and do not show correctness during the check.
        </p>
        <button
          type="button"
          onClick={() => setStage("lower")}
          style={{
            border: "1px solid #6C4DF6",
            borderRadius: 12,
            background: "#6C4DF6",
            color: "#ffffff",
            minHeight: 44,
            padding: "9px 14px",
            fontWeight: 850,
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          Confirm this band
        </button>
      </section>
    );
  }

  if (stage === "lower") {
    return (
      <section style={{ display: "grid", gap: 12 }}>
        <div style={panel}>
          <strong style={{ color: "#17204B" }}>Confirmation part 1 of 2 · P{lowerP}</strong>
        </div>
        <AssessmentPlayerV1
          key={`confirm-lower-${lowerP}-${upperP}`}
          title={`Number and place value · fresh P${lowerP} confirmation`}
          items={[...lowerItems]}
          mode="placement"
          onComplete={(responses) => {
            setLowerResponses(responses);
            setStage("upper");
          }}
        />
      </section>
    );
  }

  if (stage === "upper") {
    return (
      <section style={{ display: "grid", gap: 12 }}>
        <div style={panel}>
          <strong style={{ color: "#17204B" }}>Confirmation part 2 of 2 · P{upperP}</strong>
        </div>
        <AssessmentPlayerV1
          key={`confirm-upper-${lowerP}-${upperP}`}
          title={`Number and place value · fresh P${upperP} confirmation`}
          items={[...upperItems]}
          mode="placement"
          onComplete={(upperResponses) => {
            const confirmation = evaluateNpvAdjacentBandConfirmation({
              lowerP,
              upperP,
              lowerResponses,
              upperResponses,
            });
            setResult(confirmation);
            setStage("result");
            onConfirmed?.(confirmation);
          }}
        />
      </section>
    );
  }

  if (!result) return null;

  return (
    <section style={panel} role="status">
      <span
        style={{
          color: result.confidence === "confirmation-supported" ? "#166534" : "#92400E",
          fontSize: 12,
          fontWeight: 900,
          textTransform: "uppercase",
        }}
      >
        {result.confidence === "confirmation-supported"
          ? "Fresh confirmation complete"
          : "More evidence still needed"}
      </span>
      <strong style={{ color: "#17204B", fontSize: 20 }}>{result.claim}</strong>
      <span style={{ color: "#5B6478", lineHeight: 1.6 }}>{result.interpretation}</span>
      <div style={{ color: "#17204B", lineHeight: 1.55 }}>
        <strong>Next:</strong> {result.nextAction}
      </div>
      <small style={{ color: "#64748B" }}>
        Fresh confirmation: P{lowerP} {result.lowerCorrect}/{result.lowerTotal}; P{upperP}{" "}
        {result.upperCorrect}/{result.upperTotal}. These counts are shown to staff in the lab; the learner-facing
        placement flow should lead with the evidence statement, not a score.
      </small>
      <button
        type="button"
        onClick={() => {
          setLowerResponses([]);
          setResult(null);
          setStage("lower");
        }}
        style={{
          border: "1px solid #CDD3E1",
          borderRadius: 10,
          background: "#ffffff",
          color: "#17204B",
          minHeight: 40,
          padding: "8px 12px",
          fontWeight: 800,
          cursor: "pointer",
          width: "fit-content",
        }}
      >
        Run fresh confirmation again
      </button>
    </section>
  );
}