"use client";

import React, { useEffect, useMemo, useState } from "react";

type RolePresetKey =
  | "leadership"
  | "teacher"
  | "parent"
  | "homeschool"
  | "reporting";

export type RolePreset = {
  key: RolePresetKey;
  label: string;
  shortLabel: string;
  description: string;
  chips: string[];
  tone: {
    bg: string;
    border: string;
    text: string;
    pillBg: string;
    pillText: string;
    soft: string;
  };
  filters: Record<string, any>;
};

type Props = {
  storageKey?: string;
  title?: string;
  subtitle?: string;
  onPresetChange?: (preset: RolePreset) => void;
  onReset?: () => void;
  compact?: boolean;
};

const PRESETS: RolePreset[] = [
  {
    key: "leadership",
    label: "Leadership",
    shortLabel: "Leadership",
    description:
      "School-wide oversight with risk, readiness, invisible students, and strategic heatmap thinking.",
    chips: ["Risk-first", "School-wide", "Strategic"],
    tone: {
      bg: "#eff6ff",
      border: "#bfdbfe",
      text: "#1d4ed8",
      pillBg: "#dbeafe",
      pillText: "#1e40af",
      soft: "#f8fbff",
    },
    filters: {
      roleMode: "leadership",
      showAtRiskFirst: true,
      showOnlyMyClass: false,
      showFamilyView: false,
      showReportingSignals: true,
      showStrategicSignals: true,
      maxStudents: 120,
      sortMode: "risk",
    },
  },
  {
    key: "teacher",
    label: "Teacher",
    shortLabel: "Teacher",
    description:
      "Daily class operations with quick actions, live priorities, evidence freshness, and next teaching moves.",
    chips: ["Classroom", "Action queue", "Daily use"],
    tone: {
      bg: "#ecfeff",
      border: "#a5f3fc",
      text: "#0f766e",
      pillBg: "#cffafe",
      pillText: "#115e59",
      soft: "#f6feff",
    },
    filters: {
      roleMode: "teacher",
      showAtRiskFirst: true,
      showOnlyMyClass: true,
      showFamilyView: false,
      showReportingSignals: false,
      showStrategicSignals: false,
      maxStudents: 35,
      sortMode: "next_action",
    },
  },
  {
    key: "parent",
    label: "Parent / Family",
    shortLabel: "Parent",
    description:
      "A calmer family-facing view focused on progress, encouragement, support needs, and what to do next at home.",
    chips: ["Family-safe", "Progress", "Support"],
    tone: {
      bg: "#fdf4ff",
      border: "#f5d0fe",
      text: "#a21caf",
      pillBg: "#fae8ff",
      pillText: "#86198f",
      soft: "#fff9ff",
    },
    filters: {
      roleMode: "parent",
      showAtRiskFirst: false,
      showOnlyMyClass: false,
      showFamilyView: true,
      showReportingSignals: false,
      showStrategicSignals: false,
      maxStudents: 12,
      sortMode: "progress",
    },
  },
  {
    key: "homeschool",
    label: "Homeschool",
    shortLabel: "Homeschool",
    description:
      "Whole-child, multi-subject oversight with coverage, portfolio evidence, and reporting authority readiness.",
    chips: ["Portfolio", "Coverage", "Whole-child"],
    tone: {
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#15803d",
      pillBg: "#dcfce7",
      pillText: "#166534",
      soft: "#f8fff9",
    },
    filters: {
      roleMode: "homeschool",
      showAtRiskFirst: false,
      showOnlyMyClass: false,
      showFamilyView: true,
      showReportingSignals: true,
      showStrategicSignals: false,
      maxStudents: 20,
      sortMode: "coverage",
    },
  },
  {
    key: "reporting",
    label: "Reporting Season",
    shortLabel: "Reporting",
    description:
      "Focused mode for report writing, evidence gaps, moderation readiness, and conference preparation.",
    chips: ["Reports", "Evidence gaps", "Conferences"],
    tone: {
      bg: "#fff7ed",
      border: "#fed7aa",
      text: "#c2410c",
      pillBg: "#ffedd5",
      pillText: "#9a3412",
      soft: "#fffaf5",
    },
    filters: {
      roleMode: "reporting",
      showAtRiskFirst: true,
      showOnlyMyClass: true,
      showFamilyView: false,
      showReportingSignals: true,
      showStrategicSignals: false,
      maxStudents: 45,
      sortMode: "reporting_risk",
    },
  },
];

function safeParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getPresetByKey(key: string | null | undefined) {
  return PRESETS.find((p) => p.key === key) ?? PRESETS[1];
}

const S: Record<string, React.CSSProperties> = {
  shell: {
    marginTop: 16,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 22,
    padding: 16,
    boxShadow: "0 8px 28px rgba(15, 23, 42, 0.05)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  titleWrap: {
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 1000,
    color: "#0f172a",
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 700,
    lineHeight: 1.45,
  },
  topActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  tinyBtn: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 10,
    padding: "8px 10px",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
  },
  grid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 10,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    cursor: "pointer",
    minWidth: 0,
    transition: "transform 120ms ease",
  },
  cardActive: {
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 1000,
    lineHeight: 1.2,
  },
  activePill: {
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 1000,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  },
  desc: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 1.45,
    fontWeight: 700,
    color: "#475569",
  },
  chips: {
    marginTop: 10,
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    padding: "5px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    border: "1px solid #e2e8f0",
  },
  activeSummary: {
    marginTop: 16,
    borderRadius: 18,
    padding: 14,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 1000,
    color: "#0f172a",
  },
  summaryBody: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.5,
    color: "#475569",
  },
  filtersRow: {
    marginTop: 10,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterPill: {
    padding: "6px 9px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    color: "#334155",
  },
};

export default function RolePresetBar({
  storageKey = "edudecks.rolePreset.v1",
  title = "Saved Views / Role Presets",
  subtitle = "Jump between operating modes instantly. This sets the working lens for the page without forcing a new route.",
  onPresetChange,
  onReset,
  compact = false,
}: Props) {
  const [activeKey, setActiveKey] = useState<RolePresetKey>("teacher");

  useEffect(() => {
    const stored = safeParse(
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
    );

    if (stored?.key && PRESETS.some((p) => p.key === stored.key)) {
      setActiveKey(stored.key);
      const preset = getPresetByKey(stored.key);
      onPresetChange?.(preset);
    } else {
      const fallback = getPresetByKey("teacher");
      setActiveKey(fallback.key);
      onPresetChange?.(fallback);
    }
  }, [storageKey, onPresetChange]);

  const activePreset = useMemo(() => getPresetByKey(activeKey), [activeKey]);

  function applyPreset(preset: RolePreset) {
    setActiveKey(preset.key);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          key: preset.key,
          filters: preset.filters,
          savedAt: new Date().toISOString(),
        })
      );
    }
    onPresetChange?.(preset);
  }

  function resetPreset() {
    const fallback = getPresetByKey("teacher");
    setActiveKey(fallback.key);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    onPresetChange?.(fallback);
    onReset?.();
  }

  return (
    <section style={S.shell}>
      <div style={S.topRow}>
        <div style={S.titleWrap}>
          <div style={S.title}>{title}</div>
          {!compact ? <div style={S.subtitle}>{subtitle}</div> : null}
        </div>

        <div style={S.topActions}>
          <button
            type="button"
            style={S.tinyBtn}
            onClick={() => applyPreset(activePreset)}
          >
            Save current preset
          </button>
          <button type="button" style={S.tinyBtn} onClick={resetPreset}>
            Reset to Teacher
          </button>
        </div>
      </div>

      <div style={S.grid}>
        {PRESETS.map((preset) => {
          const isActive = preset.key === activeKey;

          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset)}
              style={{
                ...S.card,
                ...(isActive ? S.cardActive : null),
                background: isActive ? preset.tone.soft : "#ffffff",
                border: `1px solid ${
                  isActive ? preset.tone.border : "#e2e8f0"
                }`,
              }}
              title={preset.description}
            >
              <div style={S.cardTop}>
                <div style={{ ...S.label, color: preset.tone.text }}>
                  {preset.shortLabel}
                </div>
                <span
                  style={{
                    ...S.activePill,
                    background: isActive ? preset.tone.pillBg : "#f8fafc",
                    color: isActive ? preset.tone.pillText : "#64748b",
                    borderColor: isActive ? preset.tone.border : "#e2e8f0",
                  }}
                >
                  {isActive ? "ACTIVE" : "Preset"}
                </span>
              </div>

              <div style={S.desc}>{preset.description}</div>

              <div style={S.chips}>
                {preset.chips.map((chip) => (
                  <span
                    key={chip}
                    style={{
                      ...S.chip,
                      background: isActive ? preset.tone.pillBg : "#ffffff",
                      color: isActive ? preset.tone.pillText : "#334155",
                      borderColor: isActive ? preset.tone.border : "#e2e8f0",
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          ...S.activeSummary,
          background: activePreset.tone.bg,
          borderColor: activePreset.tone.border,
        }}
      >
        <div style={{ ...S.summaryTitle, color: activePreset.tone.text }}>
          Active mode: {activePreset.label}
        </div>

        <div style={S.summaryBody}>{activePreset.description}</div>

        <div style={S.filtersRow}>
          {Object.entries(activePreset.filters).map(([key, value]) => (
            <span key={key} style={S.filterPill}>
              {key}: {String(value)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}