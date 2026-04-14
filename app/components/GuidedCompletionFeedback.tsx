"use client";

import React from "react";

type GuidedCompletionFeedbackProps = {
  inPlaceLabel?: string;
  inPlaceText: string;
  stillNeededLabel?: string;
  stillNeededText: string;
  nextStepLabel?: string;
  nextStepText: string;
};

const rowLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: "#64748b",
};

const rowTextStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  color: "#334155",
  fontWeight: 700,
};

export default function GuidedCompletionFeedback({
  inPlaceLabel = "In place",
  inPlaceText,
  stillNeededLabel = "Still needed",
  stillNeededText,
  nextStepLabel = "Next step",
  nextStepText,
}: GuidedCompletionFeedbackProps) {
  return (
    <div
      style={{
        border: "1px solid #dbeafe",
        borderRadius: 14,
        background: "#ffffff",
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "grid", gap: 3 }}>
        <div style={rowLabelStyle}>{inPlaceLabel}</div>
        <div style={rowTextStyle}>{inPlaceText}</div>
      </div>
      <div style={{ display: "grid", gap: 3 }}>
        <div style={rowLabelStyle}>{stillNeededLabel}</div>
        <div style={rowTextStyle}>{stillNeededText}</div>
      </div>
      <div style={{ display: "grid", gap: 3 }}>
        <div style={rowLabelStyle}>{nextStepLabel}</div>
        <div style={rowTextStyle}>{nextStepText}</div>
      </div>
    </div>
  );
}
