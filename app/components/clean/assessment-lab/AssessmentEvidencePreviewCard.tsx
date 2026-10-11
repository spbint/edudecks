"use client";

import React from "react";
import type { NumberOperationsEvidencePreview } from "@/lib/clean/assessments/placement/numberOperationsEvidencePreview";

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 16,
  display: "grid",
  gap: 8,
};

export default function AssessmentEvidencePreviewCard({
  preview,
}: {
  preview: NumberOperationsEvidencePreview;
}) {
  return (
    <section
      style={{
        border: "1px solid #D9D0FF",
        borderRadius: 22,
        background: "#FBFAFF",
        padding: "clamp(18px, 4vw, 26px)",
        display: "grid",
        gap: 14,
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
          Assessment evidence preview
        </span>
        <h3 style={{ margin: 0, color: "#17204B", fontSize: 24 }}>
          {preview.title}
        </h3>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
          {preview.summary}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {preview.resultBands.map((result) => (
          <article key={result.subElementKey} style={panel}>
            <strong style={{ color: "#17204B" }}>{result.subElementLabel}</strong>
            <span style={{ color: "#6C4DF6", fontWeight: 900 }}>
              {result.bandLabel}
            </span>
            <small
              style={{
                color:
                  result.confidence === "routing-only" ? "#92400E" : "#166534",
                fontWeight: 800,
              }}
            >
              {result.confidence === "routing-only"
                ? "Routing evidence only"
                : "Provisional evidence band"}
            </small>
          </article>
        ))}
      </div>

      <div style={{ ...panel, background: "#FFFDF5" }}>
        <strong style={{ color: "#92400E" }}>Not saved yet</strong>
        <span style={{ color: "#6B4F1D", lineHeight: 1.55 }}>
          This assessment result can become Portfolio and report evidence after
          explicit parent confirmation. The staff baseline does not create a
          Capture record, Portfolio item, report statement or learner-status
          update automatically.
        </span>
      </div>
    </section>
  );
}
