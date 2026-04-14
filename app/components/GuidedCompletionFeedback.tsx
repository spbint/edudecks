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
  lineHeight: 1.6,
  color: "#334155",
  fontWeight: 700,
};

const secondaryTextStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  color: "#64748b",
  fontWeight: 700,
};

const primaryRowStyle: React.CSSProperties = {
  padding: "8px 0",
  borderTop: "1px solid #e2e8f0",
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
  const hasSecondaryCues = Boolean(
    (momentumLabel && momentumText) ||
      (continuityLabel && continuityText) ||
      (confidenceLabel && confidenceText),
  );

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        background: "#f8fafc",
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      {hasSecondaryCues ? (
        <div
          style={{
            display: "grid",
            gap: 6,
          }}
        >
          {momentumLabel && momentumText ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                flexWrap: "wrap",
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
            <div style={secondaryTextStyle}>
              <strong>{continuityLabel}:</strong> {continuityText}
            </div>
          ) : null}
          {confidenceLabel && confidenceText ? (
            <div style={secondaryTextStyle}>
              <strong>{confidenceLabel}:</strong> {confidenceText}
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        style={{
          display: "grid",
          gap: 0,
          borderTop: hasSecondaryCues ? "1px solid #e2e8f0" : "none",
          paddingTop: hasSecondaryCues ? 2 : 0,
        }}
      >
        <div style={{ ...rowLabelStyle, ...primaryRowStyle, borderTop: "none", paddingTop: 0 }}>
          <strong>{inPlaceLabel}:</strong> {inPlaceText}
        </div>
        <div style={primaryRowStyle}>
          <div style={rowLabelStyle}>
            <strong>{stillNeededLabel}:</strong> {stillNeededText}
          </div>
          </div>
        <div style={primaryRowStyle}>
          <div style={rowLabelStyle}>
            <strong>{nextStepLabel}:</strong> {nextStepText}
          </div>
        </div>
      </div>
      {nextValidMoveLabel && nextValidMoveText ? (
        <div
          style={{
            ...secondaryTextStyle,
            borderTop: "1px solid #e2e8f0",
            paddingTop: 10,
          }}
        >
          <strong>{nextValidMoveLabel}:</strong>{" "}
          {nextValidMoveHref ? (
            <Link
              href={nextValidMoveHref}
              style={{
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 800,
                lineHeight: 1.55,
              }}
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
