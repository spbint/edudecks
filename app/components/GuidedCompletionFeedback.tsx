"use client";

import Link from "next/link";
import React from "react";

type GuidedCompletionFeedbackProps = {
  momentumLabel?: string;
  momentumText?: string;
  continuityLabel?: string;
  continuityText?: string;
  confidenceLabel?: string;
  confidenceText?: string;
  nextValidMoveLabel?: string;
  nextValidMoveText?: string;
  nextValidMoveHref?: string;
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
  momentumLabel,
  momentumText,
  continuityLabel,
  continuityText,
  confidenceLabel,
  confidenceText,
  nextValidMoveLabel,
  nextValidMoveText,
  nextValidMoveHref,
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
      {momentumLabel && momentumText ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            width: "fit-content",
            maxWidth: "100%",
            borderRadius: 999,
            border: "1px solid #dbeafe",
            background: "#eff6ff",
            color: "#1e3a8a",
            padding: "6px 10px",
            fontSize: 12,
            lineHeight: 1.45,
            fontWeight: 700,
          }}
        >
          <strong>{momentumLabel}</strong>
          <span>{momentumText}</span>
        </div>
      ) : null}
      {continuityLabel && continuityText ? (
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: "#64748b",
            fontWeight: 700,
          }}
        >
          <strong>{continuityLabel}:</strong> {continuityText}
        </div>
      ) : null}
      {confidenceLabel && confidenceText ? (
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: "#64748b",
            fontWeight: 700,
          }}
        >
          <strong>{confidenceLabel}:</strong> {confidenceText}
        </div>
      ) : null}
      <div style={rowLabelStyle}>
        <strong>{inPlaceLabel}:</strong> {inPlaceText}
      </div>
      <div style={rowLabelStyle}>
        <strong>{stillNeededLabel}:</strong> {stillNeededText}
      </div>
      <div style={rowLabelStyle}>
        <strong>{nextStepLabel}:</strong> {nextStepText}
      </div>
      {nextValidMoveLabel && nextValidMoveText ? (
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: "#64748b",
            fontWeight: 700,
          }}
        >
          <strong>{nextValidMoveLabel}:</strong>{" "}
          {nextValidMoveHref ? (
            <Link
              href={nextValidMoveHref}
              style={{ color: "#2563eb", textDecoration: "none", fontWeight: 800 }}
            >
              {nextValidMoveText}
            </Link>
          ) : (
            nextValidMoveText
          )}
        </div>
      ) : null}
    </div>
  );
}
