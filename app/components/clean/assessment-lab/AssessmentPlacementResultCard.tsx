"use client";

import React from "react";
import type { NumberOperationsPlacementResult } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

const section: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 8,
};

export default function AssessmentPlacementResultCard({
  result,
}: {
  result: NumberOperationsPlacementResult;
}) {
  const band =
    result.status === "candidate-band" && result.lowerP && result.upperP
      ? `P${result.lowerP}–P${result.upperP}`
      : result.endpoint
        ? result.endpoint.relation === "at-least"
          ? `At least P${result.endpoint.pLevel}`
          : `Below / around P${result.endpoint.pLevel}`
        : "Evidence band";

  return (
    <section
      style={{
        border: "1px solid #D9D0FF",
        borderRadius: 22,
        background: "#F8F5FF",
        padding: "clamp(18px, 4vw, 26px)",
        display: "grid",
        gap: 16,
      }}
    >
      <div style={{ display: "grid", gap: 5 }}>
        <span
          style={{
            color: "#6C4DF6",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          MyLearna Mathematics · assessment intelligence
        </span>
        <h2
          style={{
            margin: 0,
            color: "#17204B",
            fontSize: "clamp(27px, 4vw, 38px)",
          }}
        >
          {result.subElementLabel}
        </h2>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <strong style={{ color: "#17204B", fontSize: 28 }}>{band}</strong>
          <span
            style={{
              border: "1px solid #D9D0FF",
              borderRadius: 999,
              padding: "6px 10px",
              color: result.confidence === "routing-only" ? "#92400E" : "#166534",
              background:
                result.confidence === "routing-only" ? "#FFF7ED" : "#F0FDF4",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {result.confidence === "routing-only"
              ? "Routing evidence"
              : "Provisional evidence band"}
          </span>
        </div>
      </div>

      <div style={section}>
        <strong style={{ color: "#17204B" }}>Current evidence</strong>
        <span style={{ color: "#5B6478", lineHeight: 1.65 }}>{result.claim}</span>
        <span style={{ color: "#17204B", lineHeight: 1.65 }}>
          {result.interpretation}
        </span>
      </div>

      {result.typicalYearAlignment ? (
        <div style={section}>
          <strong style={{ color: "#17204B" }}>
            Typical Australian Curriculum Mathematics alignment
          </strong>
          <span style={{ color: "#5B6478", lineHeight: 1.55 }}>
            {result.typicalYearAlignment}
          </span>
          <small style={{ color: "#64748B", lineHeight: 1.5 }}>
            This alignment is contextual only. The progression evidence remains
            the primary result.
          </small>
        </div>
      ) : null}

      <div style={section}>
        <strong style={{ color: "#17204B" }}>What MyLearna should check next</strong>
        <span style={{ color: "#5B6478", lineHeight: 1.65 }}>
          {result.nextVerification}
        </span>
      </div>

      <details style={section}>
        <summary style={{ cursor: "pointer", color: "#17204B", fontWeight: 850 }}>
          Evidence and limitations
        </summary>
        <ul style={{ margin: "6px 0 0", color: "#5B6478", lineHeight: 1.6 }}>
          {result.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
