"use client";

import React from "react";

export type SaveStatusState =
  | "idle"
  | "saving"
  | "saved"
  | "retrying"
  | "unsaved"
  | "error";

type SaveStatusProps = {
  status: SaveStatusState;
  style?: React.CSSProperties;
  align?: "left" | "center" | "right";
};

export function getSaveStatusLabel(status: SaveStatusState): string {
  if (status === "saving") return "Saving…";
  if (status === "saved") return "Saved";
  if (status === "retrying") return "Trying again…";
  return "Not saved yet";
}

export default function SaveStatus({
  status,
  style,
  align = "left",
}: SaveStatusProps) {
  const textAlign =
    align === "center" ? "center" : align === "right" ? "right" : "left";

  const color =
    status === "saved"
      ? "#166534"
      : status === "saving" || status === "retrying"
      ? "#475569"
      : "#64748b";

  return (
    <div
      aria-live="polite"
      style={{
        fontSize: 12,
        lineHeight: 1.5,
        fontWeight: 700,
        color,
        textAlign,
        ...style,
      }}
    >
      {getSaveStatusLabel(status)}
    </div>
  );
}
