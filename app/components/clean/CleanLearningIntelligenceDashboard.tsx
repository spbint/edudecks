"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import { getCleanAssessmentStageTitle } from "@/lib/clean/assessments/types";
import {
  buildLearningIntelligenceSummary,
  type LearningIntelligenceRow,
  type LearningIntelligenceSubjectFilter,
} from "@/lib/clean/curriculum/learningIntelligenceSummary";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  PATHWAY_SUBJECTS,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";

type CleanLearningIntelligenceDashboardProps = {
  learnerName: string;
  learnerYearLevel?: string | null;
  frameworkLabel?: string | null;
  evidenceEntries: CleanEvidenceEntry[];
  assessmentStatuses: CleanAssessmentSkillStatus[];
  assessmentStatusesError?: string | null;
  onDownloadCoverageRecord?: (() => void) | null;
  coverageSubmitting?: boolean;
  coverageMessage?: string | null;
  coverageError?: string | null;
};

type MetricTone = {
  accent: string;
  soft: string;
  border: string;
  text: string;
};

const dashboardShellStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 22,
  background:
    "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,249,252,0.98) 100%)",
  boxShadow: "0 8px 24px rgba(23,32,75,0.06)",
  padding: "clamp(16px, 2.6vw, 24px)",
  display: "grid",
  gap: 18,
  overflow: "hidden",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 20,
  background: "#ffffff",
  boxShadow: "0 8px 24px rgba(23,32,75,0.045)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: "#6C4DF6",
  textTransform: "uppercase",
};

const secondaryTextStyle: React.CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

const quietButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  padding: "8px 12px",
  fontSize: 13,
};

const disabledButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  opacity: 0.7,
  cursor: "default",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  background: "#ffffff",
  color: "#0f172a",
};

const quickLinks = [
  { label: "Overview", href: "/my-day" },
  { label: "My Data", href: "/my-data", current: true },
  { label: "Curriculum", href: "/my-data#coverage-map" },
  { label: "Pathways", href: "/my-pathways" },
  { label: "Evidence", href: "/my-capture" },
  { label: "Portfolio", href: "/my-portfolio" },
  { label: "Reports", href: "/my-reports" },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function buildInitials(value: string) {
  const tokens = safe(value).split(/\s+/).filter(Boolean);
  if (!tokens.length) return "ML";
  return tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || "")
    .join("");
}

function getSubjectTheme(subjectKey: PathwaySubjectKey): MetricTone & {
  stronger: string;
  glow: string;
} {
  if (subjectKey === "mathematics") {
    return {
      accent: "#2563eb",
      soft: "#eff6ff",
      border: "#dbeafe",
      stronger: "#bfdbfe",
      text: "#1d4ed8",
      glow: "rgba(37,99,235,0.14)",
    };
  }

  if (subjectKey === "english") {
    return {
      accent: "#db2777",
      soft: "#fdf2f8",
      border: "#fce7f3",
      stronger: "#f9a8d4",
      text: "#be185d",
      glow: "rgba(219,39,119,0.12)",
    };
  }

  if (subjectKey === "science") {
    return {
      accent: "#0f766e",
      soft: "#ecfeff",
      border: "#ccfbf1",
      stronger: "#99f6e4",
      text: "#0f766e",
      glow: "rgba(15,118,110,0.12)",
    };
  }

  if (subjectKey === "humanities") {
    return {
      accent: "#b45309",
      soft: "#fffbeb",
      border: "#fef3c7",
      stronger: "#fcd34d",
      text: "#b45309",
      glow: "rgba(180,83,9,0.12)",
    };
  }

  if (subjectKey === "technologies") {
    return {
      accent: "#4f46e5",
      soft: "#eef2ff",
      border: "#e0e7ff",
      stronger: "#c7d2fe",
      text: "#4338ca",
      glow: "rgba(79,70,229,0.12)",
    };
  }

  if (subjectKey === "arts") {
    return {
      accent: "#7c3aed",
      soft: "#f5f3ff",
      border: "#ede9fe",
      stronger: "#ddd6fe",
      text: "#6d28d9",
      glow: "rgba(124,58,237,0.12)",
    };
  }

  return {
    accent: "#059669",
    soft: "#ecfdf5",
    border: "#d1fae5",
    stronger: "#a7f3d0",
    text: "#047857",
    glow: "rgba(5,150,105,0.12)",
  };
}

function getMetricTone(kind: string): MetricTone {
  if (kind === "secure") {
    return {
      accent: "#10b981",
      soft: "#ecfdf5",
      border: "#a7f3d0",
      text: "#047857",
    };
  }

  if (kind === "developing") {
    return {
      accent: "#f59e0b",
      soft: "#fffbeb",
      border: "#fde68a",
      text: "#b45309",
    };
  }

  if (kind === "evidence") {
    return {
      accent: "#8b5cf6",
      soft: "#f5f3ff",
      border: "#ddd6fe",
      text: "#6d28d9",
    };
  }

  return {
    accent: "#94a3b8",
    soft: "#f8fafc",
    border: "#e2e8f0",
    text: "#475569",
  };
}

function buildHeatCellStyle(
  count: number,
  totalSteps: number,
  type: "evidence" | "developing" | "secure" | "not-assessed",
): React.CSSProperties {
  const ratio = totalSteps > 0 ? Math.min(1, count / totalSteps) : 0;

  const palette =
    type === "secure"
      ? { border: "#a7f3d0", fill: `rgba(16,185,129,${0.08 + ratio * 0.24})`, text: "#047857" }
      : type === "developing"
        ? { border: "#fde68a", fill: `rgba(245,158,11,${0.08 + ratio * 0.22})`, text: "#b45309" }
        : type === "evidence"
          ? { border: "#ddd6fe", fill: `rgba(139,92,246,${0.08 + ratio * 0.22})`, text: "#6d28d9" }
          : { border: "#e2e8f0", fill: `rgba(148,163,184,${0.06 + ratio * 0.16})`, text: "#475569" };

  return {
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    background: palette.fill,
    padding: 10,
    display: "grid",
    gap: 2,
    minHeight: 66,
  };
}

function buildReadinessStyle(readiness: LearningIntelligenceRow["readiness"]) {
  if (readiness === "Ready") {
    return {
      border: "1px solid #a7f3d0",
      background: "#ecfdf5",
      color: "#047857",
    };
  }

  if (readiness === "Building") {
    return {
      border: "1px solid #ddd6fe",
      background: "#f5f3ff",
      color: "#6d28d9",
    };
  }

  return {
    border: "1px solid #fde68a",
    background: "#fffbeb",
    color: "#b45309",
  };
}

function statusChipStyle(type: "evidence" | "assessment", confidenceLabel?: string | null) {
  if (type === "assessment") {
    const strong = confidenceLabel === "Confidence: Strong";
    const secure = confidenceLabel === "Confidence: Secure";
    const developing =
      confidenceLabel === "Confidence: Developing" ||
      confidenceLabel === "Confidence: Still developing";

    if (strong || secure) {
      return {
        border: "1px solid #a7f3d0",
        background: "#ecfdf5",
        color: "#047857",
      };
    }

    if (developing) {
      return {
        border: "1px solid #fde68a",
        background: "#fffbeb",
        color: "#b45309",
      };
    }
  }

  return {
    border: "1px solid #ddd6fe",
    background: "#f5f3ff",
    color: "#6d28d9",
  };
}

function MiniMetricCard(props: {
  label: string;
  value: string | number;
  tone: MetricTone;
  helper?: string | null;
}) {
  return (
    <article
      style={{
        ...cardStyle,
        padding: 14,
        border: `1px solid ${props.tone.border}`,
        background: "#ffffff",
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#64748b",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: props.tone.accent,
            boxShadow: `0 0 0 4px ${props.tone.soft}`,
          }}
        />
        <span>{props.label}</span>
      </div>
      <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
        {props.value}
      </div>
      {props.helper ? (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.4 }}>{props.helper}</div>
      ) : null}
    </article>
  );
}

function SnapshotChip(props: { label: string; value: string | number; tone: MetricTone }) {
  return (
    <div
      style={{
        border: `1px solid ${props.tone.border}`,
        background: props.tone.soft,
        color: props.tone.text,
        borderRadius: 999,
        padding: "8px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: props.tone.accent,
        }}
      />
      <span>{props.value}</span>
      <span style={{ color: "#475569", fontWeight: 600 }}>{props.label}</span>
    </div>
  );
}

function ProgressRow(props: { row: LearningIntelligenceRow }) {
  const { row } = props;
  const theme = getSubjectTheme(row.subjectKey);
  const readinessStyle = buildReadinessStyle(row.readiness);

  return (
    <article
      style={{
        border: `1px solid ${theme.border}`,
        borderRadius: 20,
        padding: 14,
        background: `radial-gradient(circle at top right, ${theme.glow}, transparent 30%), #ffffff`,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: theme.accent,
                boxShadow: `0 0 0 5px ${theme.soft}`,
              }}
            />
            <strong style={{ color: "#0f172a", fontSize: 17 }}>{row.title}</strong>
            <span
              style={{
                ...readinessStyle,
                borderRadius: 999,
                padding: "5px 9px",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {row.readiness}
            </span>
          </div>
          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>
            {row.kind === "subject" ? "Learning area" : row.subjectTitle}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              borderRadius: 999,
              padding: "6px 10px",
              color: "#475569",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {row.evidenceLinkedCount} evidence
          </span>
          <Link href="/my-pathways" style={quietButtonStyle}>
            Open Pathways
          </Link>
          <Link href="/my-pathways" style={quietButtonStyle}>
            Check understanding
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
        }}
      >
        <div style={buildHeatCellStyle(row.startingEvidenceCount, row.totalSteps, "evidence")}>
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>Evidence</div>
          <div style={{ color: "#6d28d9", fontSize: 24, fontWeight: 800 }}>
            {row.startingEvidenceCount}
          </div>
          <div style={{ color: "#6d28d9", fontSize: 11 }}>Started</div>
        </div>

        <div style={buildHeatCellStyle(row.developingCount, row.totalSteps, "developing")}>
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>Developing</div>
          <div style={{ color: "#b45309", fontSize: 24, fontWeight: 800 }}>
            {row.developingCount}
          </div>
          <div style={{ color: "#b45309", fontSize: 11 }}>Confidence</div>
        </div>

        <div style={buildHeatCellStyle(row.secureStrongCount, row.totalSteps, "secure")}>
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>Secure / Strong</div>
          <div style={{ color: "#047857", fontSize: 24, fontWeight: 800 }}>
            {row.secureStrongCount}
          </div>
          <div style={{ color: "#047857", fontSize: 11 }}>Confidence</div>
        </div>

        <div style={buildHeatCellStyle(row.notAssessedCount, row.totalSteps, "not-assessed")}>
          <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>Not assessed</div>
          <div style={{ color: "#475569", fontSize: 24, fontWeight: 800 }}>
            {row.notAssessedCount}
          </div>
          <div style={{ color: "#475569", fontSize: 11 }}>Ready to start</div>
        </div>

        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            background: "#f8fafc",
            padding: 10,
            display: "grid",
            gap: 8,
            minHeight: 66,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>Progress</div>
            <div style={{ color: "#0f172a", fontSize: 13, fontWeight: 800 }}>
              {row.progressPercent}%
            </div>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "#e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${row.progressPercent}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${theme.accent} 0%, #14b8a6 100%)`,
              }}
            />
          </div>
          <div style={{ color: "#64748b", fontSize: 11 }}>{row.latestActivityLabel}</div>
        </div>
      </div>
    </article>
  );
}

export default function CleanLearningIntelligenceDashboard(
  props: CleanLearningIntelligenceDashboardProps,
) {
  const [selectedSubjectKey, setSelectedSubjectKey] =
    useState<LearningIntelligenceSubjectFilter>("all");

  const summary = useMemo(
    () =>
      buildLearningIntelligenceSummary({
        selectedSubjectKey,
        learnerYearLevel: props.learnerYearLevel,
        evidenceEntries: props.evidenceEntries,
        assessmentStatuses: props.assessmentStatuses,
      }),
    [
      props.assessmentStatuses,
      props.evidenceEntries,
      props.learnerYearLevel,
      selectedSubjectKey,
    ],
  );

  const latestActivity = summary.recentActivity[0] ?? null;
  const leadNextStep = summary.nextLearningSteps[0] ?? null;
  const maxTrendCount = Math.max(
    1,
    ...summary.progressOverTime.map((point) => point.totalCount),
  );
  const currentStageTitle = getCleanAssessmentStageTitle(summary.learnerStageKey);
  const activeRows = summary.scopeRows.filter(
    (row) => row.evidenceLinkedCount > 0 || row.assessedCount > 0,
  ).length;

  const metricCards = [
    {
      label: selectedSubjectKey === "all" ? "Total subjects" : "Tracked strands",
      value:
        selectedSubjectKey === "all"
          ? summary.totalSubjects
          : summary.visibleRowCount,
      tone: getMetricTone("neutral"),
      helper: selectedSubjectKey === "all" ? null : summary.selectedSubjectTitle,
    },
    {
      label: "Secure / Strong",
      value: summary.secureStrongCount,
      tone: getMetricTone("secure"),
      helper: null,
    },
    {
      label: "Developing",
      value: summary.developingCount,
      tone: getMetricTone("developing"),
      helper: null,
    },
    {
      label: "Evidence started",
      value: summary.startingEvidenceCount,
      tone: getMetricTone("evidence"),
      helper: null,
    },
    {
      label: "Not assessed",
      value: summary.notAssessedCount,
      tone: getMetricTone("neutral"),
      helper: null,
    },
    {
      label: "Readiness",
      value: `${summary.reportingReadiness.readinessPercent}%`,
      tone: getMetricTone("secure"),
      helper: null,
    },
  ];

  return (
    <section style={dashboardShellStyle}>
      <section
        style={{
          ...cardStyle,
          padding: 12,
          display: "grid",
          gap: 10,
          background:
            "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 800,
                boxShadow: "0 8px 18px rgba(37,99,235,0.14)",
                flexShrink: 0,
              }}
            >
              {buildInitials(props.learnerName)}
            </div>

            <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <strong style={{ color: "#0f172a", fontSize: 17 }}>{props.learnerName}</strong>
              <div style={{ ...secondaryTextStyle, fontSize: 12 }}>
                {safe(props.learnerYearLevel) || "Year level not recorded"} | {currentStageTitle}
              </div>
            </div>

            {safe(props.frameworkLabel) ? (
              <span
                style={{
                  border: "1px solid #dbeafe",
                  background: "#f8fbff",
                  color: "#1e3a8a",
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {props.frameworkLabel}
              </span>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                borderRadius: 999,
                padding: "6px 10px",
                color: "#475569",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Need help?
            </span>
            <span style={{ ...disabledButtonStyle, padding: "7px 10px", fontSize: 12 }}>
              Help Centre
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                border: item.current ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                background: item.current ? "#eff6ff" : "#ffffff",
                color: item.current ? "#1d4ed8" : "#0f172a",
                borderRadius: 12,
                padding: "8px 10px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                alignItems: "center",
                minWidth: 0,
                flex: "0 1 auto",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
              <span
                style={{
                  color: item.current ? "#1d4ed8" : "#94a3b8",
                  fontSize: 11,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {item.current ? "Now" : ">"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gap: 18 }}>
          <section
            style={{
              ...cardStyle,
              padding: 20,
              display: "grid",
              gap: 18,
              background:
                "radial-gradient(circle at top right, rgba(37,99,235,0.10), transparent 32%), #ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 18,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div style={{ display: "grid", gap: 8, maxWidth: 640 }}>
                <div style={eyebrowStyle}>Learning Intelligence</div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: "clamp(28px, 4vw, 40px)" }}>
                  A clear overview of {props.learnerName}&rsquo;s learning.
                </h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6, fontSize: 15 }}>
                  Canonical pathway steps, evidence, confidence, coverage, and next steps in one
                  calm dashboard.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  minWidth: "min(100%, 250px)",
                  width: "min(100%, 290px)",
                }}
              >
                <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 700 }}>
                  <span>Subject view</span>
                  <select
                    value={selectedSubjectKey}
                    onChange={(event) =>
                      setSelectedSubjectKey(
                        event.target.value as LearningIntelligenceSubjectFilter,
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="all">All subjects</option>
                    {PATHWAY_SUBJECTS.filter((subject) => subject.status === "detailed").map(
                      (subject) => (
                        <option key={subject.key} value={subject.key}>
                          {subject.title}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      borderRadius: 999,
                      padding: "8px 12px",
                      color: "#475569",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    Current learning year
                  </span>
                  <button
                    type="button"
                    onClick={props.onDownloadCoverageRecord || undefined}
                    disabled={!props.onDownloadCoverageRecord || props.coverageSubmitting}
                    style={
                      props.onDownloadCoverageRecord && !props.coverageSubmitting
                        ? primaryButtonStyle
                        : disabledButtonStyle
                    }
                  >
                    {props.coverageSubmitting
                      ? "Preparing record..."
                      : "Download coverage record"}
                  </button>
                </div>
              </div>
            </div>

            {props.assessmentStatusesError ? (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fff7f7",
                  color: "#b91c1c",
                  borderRadius: 16,
                  padding: 12,
                  lineHeight: 1.6,
                }}
              >
                {props.assessmentStatusesError}
              </div>
            ) : null}

            {props.coverageError ? (
              <div
                style={{
                  border: "1px solid #fecaca",
                  background: "#fff7f7",
                  color: "#b91c1c",
                  borderRadius: 16,
                  padding: 12,
                  lineHeight: 1.6,
                }}
              >
                {props.coverageError}
              </div>
            ) : null}

            {props.coverageMessage ? (
              <div
                style={{
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: 16,
                  padding: 12,
                  lineHeight: 1.6,
                }}
              >
                {props.coverageMessage}
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 10 }}>
              <div style={eyebrowStyle}>Learning Snapshot</div>
              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <article
                  style={{
                    ...cardStyle,
                    padding: 16,
                    display: "grid",
                    gap: 12,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                    Snapshot
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <SnapshotChip
                      label={selectedSubjectKey === "all" ? "active areas" : "active strands"}
                      value={activeRows}
                      tone={getMetricTone("neutral")}
                    />
                    <SnapshotChip
                      label="secure / strong"
                      value={summary.secureStrongCount}
                      tone={getMetricTone("secure")}
                    />
                    <SnapshotChip
                      label="evidence linked"
                      value={summary.evidenceLinkedCount}
                      tone={getMetricTone("evidence")}
                    />
                    <SnapshotChip
                      label="focus areas"
                      value={summary.focusAreas.length}
                      tone={getMetricTone("developing")}
                    />
                  </div>
                  <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                    {summary.selectedSubjectTitle} | {summary.totalSteps} tracked steps
                  </div>
                </article>

                <article
                  style={{
                    ...cardStyle,
                    padding: 16,
                    display: "grid",
                    gap: 12,
                    background:
                      "linear-gradient(135deg, rgba(239,246,255,1) 0%, rgba(255,255,255,1) 100%)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                      Momentum
                    </div>
                    <div style={{ color: "#0f172a", fontSize: 32, fontWeight: 800 }}>
                      {summary.overallProgressPercent}%
                    </div>
                  </div>
                  <div
                    style={{
                      height: 12,
                      borderRadius: 999,
                      background: "#dbeafe",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${summary.overallProgressPercent}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(90deg, #2563eb 0%, #14b8a6 100%)",
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {[
                      {
                        label: "Confidence saved",
                        value: summary.assessedCount,
                        color: "#10b981",
                      },
                      {
                        label: "Evidence linked",
                        value: summary.evidenceLinkedCount,
                        color: "#8b5cf6",
                      },
                      {
                        label: "Ready for reporting",
                        value: summary.reportingReadiness.readyCount,
                        color: "#2563eb",
                      },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "grid", gap: 4 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            color: "#475569",
                            fontSize: 12,
                          }}
                        >
                          <span>{item.label}</span>
                          <strong style={{ color: "#0f172a" }}>{item.value}</strong>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: "#e2e8f0",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${summary.totalSteps ? Math.round((item.value / summary.totalSteps) * 100) : 0}%`,
                              height: "100%",
                              borderRadius: 999,
                              background: item.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article
                  style={{
                    ...cardStyle,
                    padding: 16,
                    display: "grid",
                    gap: 12,
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
                      Next signal
                    </div>
                    <span
                      style={{
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        borderRadius: 999,
                        padding: "6px 10px",
                        color: "#475569",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Reporting {summary.reportingReadiness.readinessPercent}%
                    </span>
                  </div>
                  {leadNextStep ? (
                    <>
                      <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 16 }}>
                        {leadNextStep.stepTitle}
                      </div>
                      <div style={{ color: "#475569", fontSize: 13 }}>
                        {leadNextStep.subjectTitle} | {leadNextStep.strandTitle}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        {leadNextStep.reason}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <Link href={leadNextStep.href} style={quietButtonStyle}>
                          Open Pathways
                        </Link>
                        {latestActivity ? (
                          <span
                            style={{
                              border: "1px solid #e2e8f0",
                              background: "#f8fafc",
                              borderRadius: 999,
                              padding: "8px 10px",
                              color: "#475569",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Recent: {latestActivity.label}
                          </span>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                      Capture or assess to build the next-step view.
                    </div>
                  )}
                </article>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              }}
            >
              {metricCards.map((item) => (
                <MiniMetricCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                  helper={item.helper}
                />
              ))}
            </div>
          </section>

          <section style={{ ...cardStyle, padding: 18, display: "grid", gap: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div style={eyebrowStyle}>{summary.scopeLabel}</div>
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                  Learning area progress
                </h3>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    border: "1px solid #ddd6fe",
                    background: "#f5f3ff",
                    color: "#6d28d9",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Evidence
                </span>
                <span
                  style={{
                    border: "1px solid #fde68a",
                    background: "#fffbeb",
                    color: "#b45309",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Developing
                </span>
                <span
                  style={{
                    border: "1px solid #a7f3d0",
                    background: "#ecfdf5",
                    color: "#047857",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Secure / Strong
                </span>
                <span
                  style={{
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#475569",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Not assessed
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {summary.scopeRows.map((row) => (
                <ProgressRow key={row.key} row={row} />
              ))}
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            <section style={{ ...cardStyle, padding: 18, display: "grid", gap: 14 }}>
              <div style={eyebrowStyle}>Recent Learning Activity</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                Recent learning activity
              </h3>

              {summary.recentActivity.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {summary.recentActivity.map((activity) => {
                    const theme = getSubjectTheme(activity.subjectKey);
                    const chipStyle = statusChipStyle(activity.activityType, activity.label);

                    return (
                      <Link
                        key={activity.id}
                        href={activity.href}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: 14,
                          background: "#ffffff",
                          textDecoration: "none",
                          display: "grid",
                          gap: 8,
                          color: "#0f172a",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <span
                              aria-hidden="true"
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: theme.accent,
                                boxShadow: `0 0 0 4px ${theme.soft}`,
                              }}
                            />
                            <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                              {activity.subjectTitle}
                            </span>
                            <span
                              style={{
                                ...chipStyle,
                                borderRadius: 999,
                                padding: "5px 9px",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {activity.activityType === "evidence"
                                ? "Evidence captured"
                                : activity.label}
                            </span>
                          </div>
                          <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                            {activity.dateLabel}
                          </span>
                        </div>
                        <strong style={{ color: "#0f172a", fontSize: 15 }}>
                          {activity.stepTitle}
                        </strong>
                        <div style={{ color: "#475569", fontSize: 13 }}>
                          {activity.strandTitle}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                          {activity.summary}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 18,
                    padding: 18,
                    background: "#f8fafc",
                    color: "#64748b",
                    lineHeight: 1.6,
                  }}
                >
                  No recent pathway-linked activity yet.
                </div>
              )}
            </section>

            <section style={{ ...cardStyle, padding: 18, display: "grid", gap: 14 }}>
              <div style={eyebrowStyle}>Progress Over Time</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>Progress over time</h3>

              {summary.progressOverTime.some((point) => point.totalCount > 0) ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                      alignItems: "end",
                      minHeight: 150,
                    }}
                  >
                    {summary.progressOverTime.map((point) => {
                      const evidenceHeight = Math.max(
                        point.evidenceCount > 0 ? 12 : 0,
                        Math.round((point.evidenceCount / maxTrendCount) * 84),
                      );
                      const assessmentHeight = Math.max(
                        point.assessmentCount > 0 ? 12 : 0,
                        Math.round((point.assessmentCount / maxTrendCount) * 52),
                      );

                      return (
                        <div
                          key={point.key}
                          style={{
                            display: "grid",
                            gap: 8,
                            justifyItems: "center",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              maxWidth: 52,
                              minHeight: 118,
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                borderRadius: 18,
                                background: "#f1f5f9",
                                padding: 6,
                                display: "grid",
                                gap: 6,
                                alignContent: "end",
                              }}
                            >
                              {point.assessmentCount > 0 ? (
                                <div
                                  style={{
                                    height: assessmentHeight,
                                    borderRadius: 10,
                                    background: "#14b8a6",
                                  }}
                                />
                              ) : null}
                              {point.evidenceCount > 0 ? (
                                <div
                                  style={{
                                    height: evidenceHeight,
                                    borderRadius: 10,
                                    background: "#2563eb",
                                  }}
                                />
                              ) : null}
                            </div>
                          </div>
                          <div style={{ color: "#334155", fontWeight: 700, fontSize: 12 }}>
                            {point.label}
                          </div>
                          <div style={{ color: "#64748b", fontSize: 11, textAlign: "center" }}>
                            {point.totalCount}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#64748b", fontSize: 12 }}>
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: "#2563eb",
                        }}
                      />
                      Evidence
                    </span>
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: "#14b8a6",
                        }}
                      />
                      Confidence
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px dashed #cbd5e1",
                    borderRadius: 18,
                    padding: 18,
                    background: "#f8fafc",
                    color: "#64748b",
                    lineHeight: 1.6,
                  }}
                >
                  Progress trend will build as more evidence and confidence are added.
                </div>
              )}
            </section>
          </div>

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            }}
          >
            <section style={{ ...cardStyle, padding: 18, display: "grid", gap: 12 }}>
              <div style={eyebrowStyle}>Strengths</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>Strengths</h3>
              {summary.strengths.length ? (
                summary.strengths.map((item) => {
                  const theme = getSubjectTheme(item.subjectKey);
                  return (
                    <div
                      key={item.key}
                      style={{
                        border: `1px solid ${theme.border}`,
                        borderRadius: 16,
                        padding: 14,
                        background: theme.soft,
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                        <span style={{ color: theme.text, fontWeight: 800 }}>
                          {item.progressPercent}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: "#e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${item.progressPercent}%`,
                            height: "100%",
                            borderRadius: 999,
                            background: theme.accent,
                          }}
                        />
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        {item.helper}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ ...secondaryTextStyle, fontSize: 14 }}>
                  Waiting for first strength signals.
                </div>
              )}
            </section>

            <section style={{ ...cardStyle, padding: 18, display: "grid", gap: 12 }}>
              <div style={eyebrowStyle}>Focus Areas</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>Focus areas</h3>
              {summary.focusAreas.length ? (
                summary.focusAreas.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      border: "1px solid #fde68a",
                      borderRadius: 16,
                      padding: 14,
                      background: "#fffdf6",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                      <span
                        style={{
                          border: "1px solid #fde68a",
                          background: "#fffbeb",
                          color: "#b45309",
                          borderRadius: 999,
                          padding: "5px 9px",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {item.notAssessedCount > 0
                          ? "May benefit from more evidence"
                          : "Good next step"}
                      </span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                      {item.helper}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ ...secondaryTextStyle, fontSize: 14 }}>
                  No focus areas yet.
                </div>
              )}
            </section>

            <section style={{ ...cardStyle, padding: 18, display: "grid", gap: 12 }}>
              <div style={eyebrowStyle}>Reporting Readiness</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                Reporting readiness
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  border: "1px solid #e2e8f0",
                  borderRadius: 18,
                  padding: 14,
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Readiness</strong>
                  <span style={{ color: "#0f172a", fontSize: 28, fontWeight: 800 }}>
                    {summary.reportingReadiness.readinessPercent}%
                  </span>
                </div>

                {[
                  {
                    label: "Ready",
                    value: summary.reportingReadiness.readyCount,
                    color: "#10b981",
                  },
                  {
                    label: "Building",
                    value: summary.reportingReadiness.buildingCount,
                    color: "#8b5cf6",
                  },
                  {
                    label: "Needs more evidence",
                    value: summary.reportingReadiness.needsMoreEvidenceCount,
                    color: "#f59e0b",
                  },
                ].map((item) => {
                  const total =
                    summary.reportingReadiness.readyCount +
                      summary.reportingReadiness.buildingCount +
                      summary.reportingReadiness.needsMoreEvidenceCount || 1;
                  const width = Math.round((item.value / total) * 100);

                  return (
                    <div key={item.label} style={{ display: "grid", gap: 5 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          color: "#475569",
                          fontSize: 13,
                        }}
                      >
                        <span>{item.label}</span>
                        <strong style={{ color: "#0f172a" }}>{item.value}</strong>
                      </div>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: "#e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${width}%`,
                            height: "100%",
                            borderRadius: 999,
                            background: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                Ready means evidence and confidence are both present.
              </div>
            </section>
          </div>

          <section style={{ ...cardStyle, padding: 18, display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={eyebrowStyle}>Next Learning Steps</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                Next learning steps
              </h3>
            </div>

            {summary.nextLearningSteps.length ? (
              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                {summary.nextLearningSteps.slice(0, 4).map((step) => {
                  const theme = getSubjectTheme(step.subjectKey);
                  return (
                    <article
                      key={step.key}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        padding: 15,
                        background: "#ffffff",
                        display: "grid",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            border: `1px solid ${theme.border}`,
                            background: theme.soft,
                            color: theme.text,
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {step.subjectTitle}
                        </span>
                        <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                          {step.stageTitle}
                        </span>
                      </div>
                      <strong style={{ color: "#0f172a", fontSize: 16 }}>
                        {step.stepTitle}
                      </strong>
                      <div style={{ color: "#475569", fontSize: 13 }}>{step.strandTitle}</div>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        {step.reason}
                      </div>
                      <div>
                        <Link href={step.href} style={quietButtonStyle}>
                          Open Pathways
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  border: "1px dashed #cbd5e1",
                  borderRadius: 18,
                  padding: 18,
                  background: "#f8fafc",
                  color: "#64748b",
                  lineHeight: 1.6,
                }}
              >
                Capture or assess to build this view.
              </div>
            )}
          </section>

          {summary.isEmpty ? (
            <section
              style={{
                ...cardStyle,
                padding: 18,
                display: "grid",
                gap: 8,
                background: "#fcfdff",
              }}
            >
              <strong style={{ color: "#0f172a" }}>Ready to start</strong>
              <div style={{ ...secondaryTextStyle, fontSize: 14 }}>
                No confidence saved yet. Capture or assess to build this view.
              </div>
            </section>
          ) : null}
      </div>
    </section>
  );
}
