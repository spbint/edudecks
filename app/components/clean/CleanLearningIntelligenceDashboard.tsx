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

const dashboardShellStyle: React.CSSProperties = {
  border: "1px solid #dbe4f0",
  borderRadius: 28,
  background:
    "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.98) 100%)",
  boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
  padding: "clamp(18px, 3.2vw, 28px)",
  display: "grid",
  gap: 22,
  overflow: "hidden",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#64748b",
  textTransform: "uppercase",
};

const secondaryTextStyle: React.CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
};

const subtleCardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  background: "#ffffff",
  boxShadow: "0 14px 32px rgba(15,23,42,0.05)",
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
  { label: "Learning Intelligence", href: "/my-curriculum", current: true },
  { label: "Curriculum", href: "/my-curriculum#coverage-map" },
  { label: "Pathways", href: "/my-pathways" },
  { label: "Assessments", href: "/my-assessments" },
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

function getSubjectTheme(subjectKey: PathwaySubjectKey) {
  if (subjectKey === "mathematics") {
    return {
      accent: "#2563eb",
      soft: "#eff6ff",
      stronger: "#dbeafe",
      text: "#1d4ed8",
      glow: "rgba(37,99,235,0.16)",
    };
  }

  if (subjectKey === "english") {
    return {
      accent: "#db2777",
      soft: "#fdf2f8",
      stronger: "#fce7f3",
      text: "#be185d",
      glow: "rgba(219,39,119,0.14)",
    };
  }

  if (subjectKey === "science") {
    return {
      accent: "#0f766e",
      soft: "#ecfeff",
      stronger: "#ccfbf1",
      text: "#0f766e",
      glow: "rgba(15,118,110,0.14)",
    };
  }

  if (subjectKey === "humanities") {
    return {
      accent: "#b45309",
      soft: "#fffbeb",
      stronger: "#fef3c7",
      text: "#b45309",
      glow: "rgba(180,83,9,0.14)",
    };
  }

  if (subjectKey === "technologies") {
    return {
      accent: "#4f46e5",
      soft: "#eef2ff",
      stronger: "#e0e7ff",
      text: "#4338ca",
      glow: "rgba(79,70,229,0.14)",
    };
  }

  if (subjectKey === "arts") {
    return {
      accent: "#7c3aed",
      soft: "#f5f3ff",
      stronger: "#ede9fe",
      text: "#6d28d9",
      glow: "rgba(124,58,237,0.14)",
    };
  }

  return {
    accent: "#059669",
    soft: "#ecfdf5",
    stronger: "#d1fae5",
    text: "#047857",
    glow: "rgba(5,150,105,0.14)",
  };
}

function buildHeatCellStyle(
  count: number,
  totalSteps: number,
  type: "starting" | "developing" | "secure" | "not-assessed",
): React.CSSProperties {
  const ratio = totalSteps > 0 ? Math.min(1, count / totalSteps) : 0;

  const palette =
    type === "secure"
      ? { border: "#a7f3d0", fill: `rgba(16,185,129,${0.10 + ratio * 0.24})`, text: "#047857" }
      : type === "developing"
        ? { border: "#fde68a", fill: `rgba(245,158,11,${0.10 + ratio * 0.22})`, text: "#b45309" }
        : type === "starting"
          ? { border: "#c4b5fd", fill: `rgba(99,102,241,${0.10 + ratio * 0.22})`, text: "#5b21b6" }
          : { border: "#e2e8f0", fill: `rgba(148,163,184,${0.08 + ratio * 0.18})`, text: "#475569" };

  return {
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    padding: 12,
    background: palette.fill,
    display: "grid",
    gap: 4,
    minHeight: 74,
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
      border: "1px solid #c4b5fd",
      background: "#f5f3ff",
      color: "#5b21b6",
    };
  }

  return {
    border: "1px solid #fde68a",
    background: "#fffbeb",
    color: "#b45309",
  };
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

  const maxTrendCount = Math.max(
    1,
    ...summary.progressOverTime.map((point) => point.totalCount),
  );
  const currentStageTitle = getCleanAssessmentStageTitle(summary.learnerStageKey);

  return (
    <section style={dashboardShellStyle}>
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          alignItems: "stretch",
        }}
      >
        <aside
          style={{
            ...subtleCardStyle,
            flex: "0 1 280px",
            width: "min(100%, 300px)",
            padding: 18,
            display: "grid",
            gap: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 20,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                color: "#ffffff",
                fontSize: 24,
                fontWeight: 800,
                boxShadow: "0 12px 28px rgba(37,99,235,0.20)",
              }}
            >
              {buildInitials(props.learnerName)}
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={eyebrowStyle}>Learner snapshot</div>
              <strong style={{ color: "#0f172a", fontSize: 22 }}>
                {props.learnerName}
              </strong>
              <div style={secondaryTextStyle}>
                {safe(props.learnerYearLevel) || "Year level not recorded"} · {currentStageTitle}
              </div>
              {safe(props.frameworkLabel) ? (
                <div
                  style={{
                    border: "1px solid #dbeafe",
                    background: "#f8fbff",
                    color: "#1e3a8a",
                    borderRadius: 999,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    justifySelf: "start",
                  }}
                >
                  {props.frameworkLabel}
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={eyebrowStyle}>Workspace links</div>
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  border: item.current ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                  background: item.current ? "#eff6ff" : "#ffffff",
                  color: item.current ? "#1d4ed8" : "#0f172a",
                  borderRadius: 14,
                  padding: "10px 12px",
                  textDecoration: "none",
                  fontWeight: 700,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <span>{item.label}</span>
                {item.current ? (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Current
                  </span>
                ) : (
                  <span style={{ color: "#94a3b8" }}>›</span>
                )}
              </Link>
            ))}
          </div>

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: 14,
              background: "#ffffff",
              display: "grid",
              gap: 8,
            }}
          >
            <strong style={{ color: "#0f172a" }}>Need help?</strong>
            <div style={{ ...secondaryTextStyle, fontSize: 14 }}>
              Visit our Help Centre for guidance on pathways, evidence capture, and reporting.
            </div>
            <div>
              <span style={disabledButtonStyle}>Help Centre</span>
            </div>
          </div>
        </aside>

        <div style={{ flex: "999 1 720px", minWidth: 0, display: "grid", gap: 18 }}>
          <div
            style={{
              ...subtleCardStyle,
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
              <div style={{ display: "grid", gap: 8, maxWidth: 660 }}>
                <div style={eyebrowStyle}>Learning Intelligence</div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: "clamp(28px, 4vw, 40px)" }}>
                  A clear overview of {props.learnerName}&rsquo;s learning across all areas.
                </h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7, fontSize: 15 }}>
                  See pathway-linked evidence, saved confidence, coverage readiness, and calm next
                  steps from one connected learning spine.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  justifyItems: "stretch",
                  minWidth: "min(100%, 260px)",
                  width: "min(100%, 300px)",
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

                {props.coverageError ? (
                  <div
                    style={{
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      borderRadius: 14,
                      padding: 10,
                      lineHeight: 1.5,
                      fontSize: 13,
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
                      borderRadius: 14,
                      padding: 10,
                      lineHeight: 1.5,
                      fontSize: 13,
                    }}
                  >
                    {props.coverageMessage}
                  </div>
                ) : null}
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

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              }}
            >
              <article style={{ ...subtleCardStyle, padding: 16, display: "grid", gap: 8 }}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  {selectedSubjectKey === "all" ? "Total subjects" : "Tracked strands"}
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {selectedSubjectKey === "all"
                    ? summary.totalSubjects
                    : summary.visibleRowCount}
                </div>
                <div style={{ ...secondaryTextStyle, fontSize: 13 }}>
                  {selectedSubjectKey === "all"
                    ? `${summary.totalSteps} pathway steps tracked across the full core subject set.`
                    : `${summary.totalSteps} pathway steps inside ${summary.selectedSubjectTitle}.`}
                </div>
              </article>

              <article style={{ ...subtleCardStyle, padding: 16, display: "grid", gap: 8 }}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Secure / Strong
                </div>
                <div style={{ color: "#047857", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {summary.secureStrongCount}
                </div>
                <div style={{ ...secondaryTextStyle, fontSize: 13 }}>
                  Saved confidence showing settled strength across visible pathway steps.
                </div>
              </article>

              <article style={{ ...subtleCardStyle, padding: 16, display: "grid", gap: 8 }}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Developing
                </div>
                <div style={{ color: "#b45309", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {summary.developingCount}
                </div>
                <div style={{ ...secondaryTextStyle, fontSize: 13 }}>
                  Confidence saved as still developing or developing.
                </div>
              </article>

              <article style={{ ...subtleCardStyle, padding: 16, display: "grid", gap: 8 }}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Starting / Evidence started
                </div>
                <div style={{ color: "#5b21b6", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {summary.startingEvidenceCount}
                </div>
                <div style={{ ...secondaryTextStyle, fontSize: 13 }}>
                  Pathway steps with linked evidence but no saved confidence yet.
                </div>
              </article>

              <article style={{ ...subtleCardStyle, padding: 16, display: "grid", gap: 8 }}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Not assessed
                </div>
                <div style={{ color: "#475569", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {summary.notAssessedCount}
                </div>
                <div style={{ ...secondaryTextStyle, fontSize: 13 }}>
                  Pathway steps with no linked evidence and no saved confidence yet.
                </div>
              </article>

              <article style={{ ...subtleCardStyle, padding: 16, display: "grid", gap: 8 }}>
                <div style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                  Overall progress
                </div>
                <div style={{ color: "#0f172a", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                  {summary.overallProgressPercent}%
                </div>
                <div style={{ ...secondaryTextStyle, fontSize: 13 }}>
                  Weighted snapshot across saved confidence and pathway-linked evidence.
                </div>
              </article>
            </div>
          </div>

          <section style={{ ...subtleCardStyle, padding: 18, display: "grid", gap: 16 }}>
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
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  Each card shows evidence starting points, developing confidence, secure or strong
                  steps, and steps that have not been assessed yet.
                </p>
              </div>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  borderRadius: 999,
                  padding: "8px 12px",
                  color: "#475569",
                  fontWeight: 700,
                }}
              >
                {summary.selectedSubjectTitle}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {summary.scopeRows.map((row) => {
                const theme = getSubjectTheme(row.subjectKey);
                const readinessStyle = buildReadinessStyle(row.readiness);

                return (
                  <article
                    key={row.key}
                    style={{
                      border: `1px solid ${theme.stronger}`,
                      borderRadius: 22,
                      padding: 16,
                      background:
                        `radial-gradient(circle at top right, ${theme.glow}, transparent 32%), ${theme.soft}`,
                      display: "grid",
                      gap: 14,
                      boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
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
                              width: 14,
                              height: 14,
                              borderRadius: 999,
                              background: theme.accent,
                              boxShadow: `0 0 0 6px ${theme.stronger}`,
                            }}
                          />
                          <strong style={{ color: "#0f172a", fontSize: 18 }}>
                            {row.title}
                          </strong>
                        </div>
                        <div style={{ ...secondaryTextStyle, fontSize: 14 }}>{row.subtitle}</div>
                      </div>

                      <span
                        style={{
                          ...readinessStyle,
                          borderRadius: 999,
                          padding: "6px 10px",
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.readiness}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns: "repeat(auto-fit, minmax(108px, 1fr))",
                      }}
                    >
                      <div style={buildHeatCellStyle(row.startingEvidenceCount, row.totalSteps, "starting")}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>
                          Starting
                        </div>
                        <div style={{ color: "#5b21b6", fontSize: 24, fontWeight: 800 }}>
                          {row.startingEvidenceCount}
                        </div>
                        <div style={{ color: "#5b21b6", fontSize: 12, lineHeight: 1.4 }}>
                          Evidence started
                        </div>
                      </div>

                      <div style={buildHeatCellStyle(row.developingCount, row.totalSteps, "developing")}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>
                          Developing
                        </div>
                        <div style={{ color: "#b45309", fontSize: 24, fontWeight: 800 }}>
                          {row.developingCount}
                        </div>
                        <div style={{ color: "#b45309", fontSize: 12, lineHeight: 1.4 }}>
                          Confidence building
                        </div>
                      </div>

                      <div style={buildHeatCellStyle(row.secureStrongCount, row.totalSteps, "secure")}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>
                          Secure / Strong
                        </div>
                        <div style={{ color: "#047857", fontSize: 24, fontWeight: 800 }}>
                          {row.secureStrongCount}
                        </div>
                        <div style={{ color: "#047857", fontSize: 12, lineHeight: 1.4 }}>
                          Confidence saved
                        </div>
                      </div>

                      <div style={buildHeatCellStyle(row.notAssessedCount, row.totalSteps, "not-assessed")}>
                        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 800 }}>
                          Not assessed
                        </div>
                        <div style={{ color: "#475569", fontSize: 24, fontWeight: 800 }}>
                          {row.notAssessedCount}
                        </div>
                        <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.4 }}>
                          Needs a starting record
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <strong style={{ color: "#0f172a" }}>
                          Progress {row.progressPercent}%
                        </strong>
                        <span style={{ color: "#64748b", fontSize: 13 }}>
                          {row.evidenceLinkedCount} evidence-linked steps
                        </span>
                      </div>
                      <div
                        aria-hidden="true"
                        style={{
                          height: 10,
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          color: "#64748b",
                          fontSize: 13,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{row.latestActivityLabel}</span>
                        <span>{row.includeInReportCount} ready for report notes</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Link href="/my-pathways" style={secondaryButtonStyle}>
                        Open Pathways
                      </Link>
                      <Link href="/my-assessments" style={secondaryButtonStyle}>
                        Open Assessments
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            <section style={{ ...subtleCardStyle, padding: 18, display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={eyebrowStyle}>Recent learning activity</div>
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                  Recent learning activity
                </h3>
              </div>

              {summary.recentActivity.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {summary.recentActivity.map((activity) => {
                    const theme = getSubjectTheme(activity.subjectKey);
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
                          <span
                            style={{
                              border: `1px solid ${theme.stronger}`,
                              background: theme.soft,
                              color: theme.text,
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {activity.subjectTitle}
                          </span>
                          <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                            {activity.dateLabel}
                          </span>
                        </div>
                        <strong style={{ color: "#0f172a", fontSize: 15 }}>
                          {activity.label}
                        </strong>
                        <div style={{ color: "#334155", fontSize: 14, lineHeight: 1.5 }}>
                          {activity.stepTitle}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                          {activity.strandTitle} · {activity.summary}
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
                    lineHeight: 1.7,
                  }}
                >
                  No recent pathway-linked activity yet. Capture evidence or save an assessment to
                  start building the record.
                </div>
              )}
            </section>

            <section style={{ ...subtleCardStyle, padding: 18, display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={eyebrowStyle}>Progress over time</div>
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                  Progress over time
                </h3>
              </div>

              {summary.progressOverTime.some((point) => point.totalCount > 0) ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                      gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                      alignItems: "end",
                      minHeight: 160,
                    }}
                  >
                    {summary.progressOverTime.map((point) => {
                      const evidenceHeight = Math.max(
                        8,
                        Math.round((point.evidenceCount / maxTrendCount) * 86),
                      );
                      const assessmentHeight = Math.max(
                        point.assessmentCount > 0 ? 8 : 0,
                        Math.round((point.assessmentCount / maxTrendCount) * 58),
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
                              maxWidth: 54,
                              minHeight: 120,
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                borderRadius: 20,
                                background: "#eef2ff",
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
                                    borderRadius: 12,
                                    background: "#14b8a6",
                                  }}
                                />
                              ) : null}
                              {point.evidenceCount > 0 ? (
                                <div
                                  style={{
                                    height: evidenceHeight,
                                    borderRadius: 12,
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
                            {point.totalCount} updates
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      flexWrap: "wrap",
                      color: "#64748b",
                      fontSize: 12,
                    }}
                  >
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
                      Evidence activity
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
                      Confidence saves
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
                    lineHeight: 1.7,
                  }}
                >
                  Progress trend will build as more evidence and assessments are added.
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
            <section style={{ ...subtleCardStyle, padding: 18, display: "grid", gap: 12 }}>
              <div style={eyebrowStyle}>Strengths</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>Strengths</h3>
              {summary.strengths.length ? (
                summary.strengths.map((item) => {
                  const theme = getSubjectTheme(item.subjectKey);
                  return (
                    <div
                      key={item.key}
                      style={{
                        border: `1px solid ${theme.stronger}`,
                        borderRadius: 16,
                        padding: 14,
                        background: theme.soft,
                        display: "grid",
                        gap: 6,
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
                      <div style={{ color: "#475569", fontSize: 13 }}>{item.subtitle}</div>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        {item.helper}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ ...secondaryTextStyle, fontSize: 14 }}>
                  Strengths will become clearer as evidence and confidence records build.
                </div>
              )}
            </section>

            <section style={{ ...subtleCardStyle, padding: 18, display: "grid", gap: 12 }}>
              <div style={eyebrowStyle}>Focus areas</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>Focus areas</h3>
              {summary.focusAreas.length ? (
                summary.focusAreas.map((item) => {
                  const theme = getSubjectTheme(item.subjectKey);
                  return (
                    <div
                      key={item.key}
                      style={{
                        border: "1px solid #fde68a",
                        borderRadius: 16,
                        padding: 14,
                        background:
                          theme.soft === "#fffbeb" ? "#fffdf6" : "#fffbeb",
                        display: "grid",
                        gap: 6,
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
                        <span style={{ color: "#b45309", fontWeight: 800 }}>
                          {item.notAssessedCount} to revisit
                        </span>
                      </div>
                      <div style={{ color: "#475569", fontSize: 13 }}>{item.subtitle}</div>
                      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
                        {item.helper}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ ...secondaryTextStyle, fontSize: 14 }}>
                  Focus areas will appear here when some subjects or strands need more evidence or
                  another confidence check.
                </div>
              )}
            </section>

            <section style={{ ...subtleCardStyle, padding: 18, display: "grid", gap: 12 }}>
              <div style={eyebrowStyle}>Reporting readiness</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                Reporting readiness
              </h3>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
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
                  <strong style={{ color: "#0f172a" }}>Readiness snapshot</strong>
                  <span style={{ color: "#0f172a", fontSize: 24, fontWeight: 800 }}>
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
                    color: "#6366f1",
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
                    <div key={item.label} style={{ display: "grid", gap: 6 }}>
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
                          height: 10,
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

              <div style={{ ...secondaryTextStyle, fontSize: 13 }}>
                Ready areas already have report-ready evidence and secure or strong confidence.
                Building areas have some evidence or confidence, while other areas may benefit from
                more captured learning.
              </div>
            </section>
          </div>

          <section style={{ ...subtleCardStyle, padding: 18, display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={eyebrowStyle}>Next learning steps</div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                Next learning steps
              </h3>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Suggested next steps based on current pathway and evidence activity.
              </p>
            </div>

            {summary.nextLearningSteps.length ? (
              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                {summary.nextLearningSteps.map((step) => {
                  const theme = getSubjectTheme(step.subjectKey);
                  return (
                    <article
                      key={step.key}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 18,
                        padding: 16,
                        background: "#ffffff",
                        display: "grid",
                        gap: 10,
                        boxShadow: "0 10px 22px rgba(15,23,42,0.04)",
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
                            border: `1px solid ${theme.stronger}`,
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
                      <div style={{ color: "#64748b", lineHeight: 1.6, fontSize: 13 }}>
                        {step.reason}
                      </div>
                      <div style={{ color: "#334155", lineHeight: 1.6, fontSize: 13 }}>
                        {step.stepDescription}
                      </div>
                      <div>
                        <Link href={step.href} style={secondaryButtonStyle}>
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
                  lineHeight: 1.7,
                }}
              >
                Capture evidence or save assessment confidence to begin surfacing suggested next
                steps.
              </div>
            )}
          </section>

          {summary.isEmpty ? (
            <section
              style={{
                ...subtleCardStyle,
                padding: 18,
                display: "grid",
                gap: 8,
                background: "#fcfdff",
              }}
            >
              <strong style={{ color: "#0f172a" }}>Building this view</strong>
              <div style={{ ...secondaryTextStyle, fontSize: 14 }}>
                No evidence has been linked yet and no assessment confidence has been saved yet.
                Capture evidence or save an assessment to start building Learning Intelligence.
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
