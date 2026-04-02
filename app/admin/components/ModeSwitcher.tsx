"use client";

import React from "react";
import Link from "next/link";

type ModeValue = "school" | "family";

type ModeSwitcherProps = {
  activeMode?: ModeValue;
};

export default function ModeSwitcher({
  activeMode = "school",
}: ModeSwitcherProps) {
  return (
    <section style={S.wrap}>
      <div style={S.label}>Mode</div>

      <div style={S.row}>
        <Link
          href="/admin/leadership"
          style={{
            ...S.modeBtn,
            ...(activeMode === "school" ? S.modeBtnActive : S.modeBtnInactive),
          }}
        >
          <span style={S.modeTitle}>School</span>
          <span style={S.modeSub}>Leadership, classes, evidence, interventions</span>
        </Link>

        <Link
          href="/admin/parent-dashboard"
          style={{
            ...S.modeBtn,
            ...(activeMode === "family" ? S.modeBtnActive : S.modeBtnInactive),
          }}
        >
          <span style={S.modeTitle}>Family</span>
          <span style={S.modeSub}>Reporting, portfolio, planning, print centre</span>
        </Link>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    display: "grid",
    gap: 10,
    marginBottom: 16,
  },

  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  row: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  modeBtn: {
    display: "grid",
    gap: 4,
    padding: "14px 16px",
    borderRadius: 14,
    textDecoration: "none",
    border: "1px solid #cbd5e1",
    transition: "all 0.15s ease",
  },

  modeBtnActive: {
    background: "#eff6ff",
    borderColor: "#93c5fd",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.10)",
  },

  modeBtnInactive: {
    background: "#ffffff",
    borderColor: "#e2e8f0",
  },

  modeTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#0f172a",
    lineHeight: 1.2,
  },

  modeSub: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    lineHeight: 1.4,
  },
};