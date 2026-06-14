"use client";

import React from "react";

type PreviewBadgeProps = {
  compact?: boolean;
  label?: string;
  title?: string;
  style?: React.CSSProperties;
};

const LABEL = "MyLearna is evolving with family feedback.";

export default function PreviewBadge({
  compact = false,
  label = "Preview",
  title = LABEL,
  style,
}: PreviewBadgeProps) {
  return (
    <span
      title={title}
      aria-label={`${label}. ${title}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        borderRadius: 999,
        border: "1px solid #bfdbfe",
        background: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)",
        color: "#1d4ed8",
        padding: compact ? "6px 10px" : "7px 11px",
        fontSize: 12,
        lineHeight: 1,
        fontWeight: 800,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        boxShadow: "0 8px 20px rgba(37,99,235,0.08)",
        ...style,
      }}
    >
      {label}
    </span>
  );
}
