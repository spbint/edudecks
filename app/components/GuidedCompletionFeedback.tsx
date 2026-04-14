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
  fontSize: 13,
  lineHeight: 1.55,
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
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#f8fafc",
        padding: 12,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={rowLabelStyle}>
        <strong>{inPlaceLabel}:</strong> {inPlaceText}
      </div>
      <div style={rowLabelStyle}>
        <strong>{stillNeededLabel}:</strong> {stillNeededText}
      </div>
      <div style={rowLabelStyle}>
        <strong>{nextStepLabel}:</strong> {nextStepText}
      </div>
    </div>
  );
}
