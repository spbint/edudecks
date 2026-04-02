"use client";

import React from "react";

/* ───────────────────────── TYPES ───────────────────────── */

type Klass = {
  name?: string | null;
  year_level?: number | null;
  teacher_name?: string | null;
} | null;

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function fmtYear(y: number | null | undefined) {
  return y == null ? "" : `Year ${y}`;
}

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function StudentQuickViewDrawer({
  klass,
}: {
  klass: Klass;
}) {
  return (
    <div style={S.card}>
      {/* ───── CLASS SUMMARY (FIXED) ───── */}
      <div style={S.metaText}>
        {klass
          ? `${safe(klass?.name) || "Class"}${
              klass?.year_level != null
                ? ` • ${fmtYear(klass?.year_level)}`
                : ""
            }`
          : "No class assigned"}

        {safe(klass?.teacher_name)
          ? ` • ${safe(klass?.teacher_name)}`
          : ""}
      </div>
    </div>
  );
}

/* ───────────────────────── STYLES ───────────────────────── */

const S: Record<string, React.CSSProperties> = {
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: 16,
  },
  metaText: {
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
  },
};