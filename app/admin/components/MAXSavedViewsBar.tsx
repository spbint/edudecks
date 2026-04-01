"use client";

import React from "react";

/* =========================================================
   MAX SAVED VIEWS / ROLE PRESETS BAR
   System-level command context switcher
========================================================= */

export type SavedView = {
  key: string;
  label: string;
  description: string;
  accent: string;
};

const DEFAULT_VIEWS: SavedView[] = [
  {
    key: "leadership",
    label: "Leadership",
    description: "Whole-school oversight",
    accent: "#2563eb",
  },
  {
    key: "reporting",
    label: "Reporting Season",
    description: "Portfolio & reports focus",
    accent: "#7c3aed",
  },
  {
    key: "intervention",
    label: "Intervention Focus",
    description: "Highest-risk learners",
    accent: "#ea580c",
  },
  {
    key: "parent",
    label: "Parent Mode",
    description: "Family visibility",
    accent: "#16a34a",
  },
  {
    key: "homeschool",
    label: "Homeschool Audit",
    description: "Compliance coverage",
    accent: "#0891b2",
  },
  {
    key: "crisis",
    label: "Crisis Mode",
    description: "Immediate risks",
    accent: "#dc2626",
  },
];

/* ========================================================= */

export default function MAXSavedViewsBar({
  active,
  onChange,
}: {
  active?: string;
  onChange?: (key: string) => void;
}) {
  return (
    <section
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
      }}
    >
      <div
        style={{
          fontSize: 12,
          textTransform: "uppercase",
          color: "#93c5fd",
          fontWeight: 900,
          marginBottom: 10,
        }}
      >
        Saved Views / Role Presets
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {DEFAULT_VIEWS.map((v) => {
          const isActive = active === v.key;

          return (
            <button
              key={v.key}
              onClick={() => onChange?.(v.key)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${isActive ? v.accent : "#334155"}`,
                background: isActive ? v.accent : "#1e293b",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div>{v.label}</div>

              <div
                style={{
                  fontSize: 11,
                  opacity: 0.8,
                  marginTop: 2,
                  fontWeight: 700,
                }}
              >
                {v.description}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}