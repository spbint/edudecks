"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import { getCleanAssessmentStageTitle } from "@/lib/clean/assessments/types";
import {
  buildLearningIntelligenceSummary,
  type LearningIntelligenceActivity,
  type LearningIntelligenceRow,
  type LearningIntelligenceSubjectFilter,
} from "@/lib/clean/curriculum/learningIntelligenceSummary";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { PATHWAY_SUBJECTS } from "@/lib/clean/pathways/pathwaySubjects";

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

type Tone = {
  border: string;
  background: string;
  text: string;
  accent: string;
};

const shellStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 22,
  background: "#ffffff",
  boxShadow: "0 8px 24px rgba(23,32,75,0.06)",
  padding: "clamp(16px, 2.6vw, 24px)",
  display: "grid",
  gap: 18,
  overflow: "hidden",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #E7EAF2",
  borderRadius: 18,
  background: "#ffffff",
  boxShadow: "0 8px 20px rgba(23,32,75,0.04)",
};

const sectionStyle: React.CSSProperties = {
  ...cardStyle,
  padding: "clamp(16px, 2.4vw, 22px)",
  display: "grid",
  gap: 16,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#6C4DF6",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const mutedTextStyle: React.CSSProperties = {
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
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 42,
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
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

const sectionLinks = ["Overview", "Progress", "Evidence", "Coverage", "Reporting"] as const;

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

function subjectTone(value: string): Tone {
  const key = value.toLowerCase();

  if (key.includes("math")) {
    return { border: "#bfdbfe", background: "#eff6ff", text: "#1d4ed8", accent: "#2563eb" };
  }

  if (key.includes("english")) {
    return { border: "#fbcfe8", background: "#fdf2f8", text: "#be185d", accent: "#db2777" };
  }

  if (key.includes("science")) {
    return { border: "#99f6e4", background: "#ecfeff", text: "#0f766e", accent: "#0f766e" };
  }

  if (key.includes("humanities")) {
    return { border: "#fde68a", background: "#fffbeb", text: "#b45309", accent: "#b45309" };
  }

  if (key.includes("technologies")) {
    return { border: "#c7d2fe", background: "#eef2ff", text: "#4338ca", accent: "#4f46e5" };
  }

  if (key.includes("arts")) {
    return { border: "#ddd6fe", background: "#f5f3ff", text: "#6d28d9", accent: "#7c3aed" };
  }

  return { border: "#bbf7d0", background: "#ecfdf5", text: "#047857", accent: "#059669" };
}

function statusTone(status: LearningIntelligenceRow["learningAreaStatus"]): Tone {
  if (status === "Active") {
    return { border: "#bbf7d0", background: "#ecfdf5", text: "#047857", accent: "#10b981" };
  }

  if (status === "Evidence recorded") {
    return { border: "#bfdbfe", background: "#eff6ff", text: "#1d4ed8", accent: "#2563eb" };
  }

  if (status === "Planned") {
    return { border: "#ddd6fe", background: "#f5f3ff", text: "#6d28d9", accent: "#8b5cf6" };
  }

  return { border: "#e2e8f0", background: "#f8fafc", text: "#64748b", accent: "#94a3b8" };
}

function Chip(props: { children: React.ReactNode; tone?: Tone }) {
  const tone = props.tone ?? { border: "#e2e8f0", background: "#f8fafc", text: "#475569", accent: "#94a3b8" };
  return (
    <span
      style={{
        border: `1px solid ${tone.border}`,
        background: tone.background,
        color: tone.text,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        width: "fit-content",
      }}
    >
      {props.children}
    </span>
  );
}

function Metric(props: { label: string; value: string | number; helper?: string | null }) {
  return (
    <article
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        background: "#f8fafc",
        padding: 14,
        display: "grid",
        gap: 7,
      }}
    >
      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800 }}>{props.label}</div>
      <div style={{ color: "#0f172a", fontSize: 26, fontWeight: 850, lineHeight: 1 }}>
        {props.value}
      </div>
      {props.helper ? (
        <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>{props.helper}</div>
      ) : null}
    </article>
  );
}

function ActivityCard(props: { activity: LearningIntelligenceActivity }) {
  const tone = subjectTone(props.activity.subjectTitle);

  return (
    <Link
      href={props.activity.href}
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
        <Chip tone={tone}>{props.activity.subjectTitle}</Chip>
        <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
          {props.activity.dateLabel}
        </span>
      </div>
      <strong style={{ color: "#0f172a", fontSize: 15 }}>{props.activity.stepTitle}</strong>
      <div style={{ color: "#475569", fontSize: 13 }}>{props.activity.strandTitle}</div>
      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
        {props.activity.summary}
      </div>
    </Link>
  );
}

function LearningAreaRow(props: { row: LearningIntelligenceRow; quiet?: boolean }) {
  const tone = subjectTone(props.row.subjectTitle);
  const stateTone = statusTone(props.row.learningAreaStatus);

  return (
    <article
      style={{
        border: `1px solid ${props.quiet ? "#e2e8f0" : tone.border}`,
        borderRadius: 16,
        padding: 14,
        background: props.quiet ? "#f8fafc" : "#ffffff",
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "minmax(180px, 1.4fr) repeat(3, minmax(90px, 0.7fr))",
          alignItems: "center",
        }}
        className="mylearna-data-area-row"
      >
        <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
          <strong style={{ color: "#0f172a" }}>{props.row.title}</strong>
          <span style={{ color: "#64748b", fontSize: 12 }}>
            {props.row.kind === "subject" ? "Learning area" : props.row.subjectTitle}
          </span>
        </div>
        <Chip tone={stateTone}>{props.row.learningAreaStatus}</Chip>
        <span style={{ color: "#334155", fontWeight: 750 }}>
          {props.row.evidenceLinkedCount} {props.row.evidenceLinkedCount === 1 ? "record" : "records"}
        </span>
        <span style={{ color: "#64748b", fontSize: 13 }}>{props.row.latestActivityLabel}</span>
      </div>
    </article>
  );
}

function ProgressTrend(props: {
  points: ReturnType<typeof buildLearningIntelligenceSummary>["progressOverTime"];
}) {
  const maxCount = Math.max(1, ...props.points.map((point) => point.totalCount));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          alignItems: "end",
          minHeight: 130,
        }}
      >
        {props.points.map((point) => {
          const height = Math.max(
            point.totalCount > 0 ? 14 : 0,
            Math.round((point.totalCount / maxCount) * 90),
          );

          return (
            <div key={point.key} style={{ display: "grid", gap: 8, justifyItems: "center" }}>
              <div
                style={{
                  width: "100%",
                  maxWidth: 44,
                  height,
                  borderRadius: 14,
                  background: point.totalCount > 0 ? "#2563eb" : "#e2e8f0",
                }}
                aria-label={`${point.label}: ${point.totalCount} learning records`}
              />
              <div style={{ color: "#334155", fontSize: 12, fontWeight: 700 }}>{point.label}</div>
            </div>
          );
        })}
      </div>
    </div>
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
  const currentStageTitle = getCleanAssessmentStageTitle(summary.learnerStageKey);
  const currentLearningArea =
    summary.activeLearningAreaRows[0]?.title || summary.selectedSubjectTitle;
  const primaryAction = leadNextStep
    ? { label: "Continue learning", href: leadNextStep.href }
    : summary.isEmpty
      ? { label: "Choose a learning pathway", href: "/my-pathways" }
      : { label: "Add evidence", href: "/my-capture" };
  const reportSummary =
    summary.reportEvidenceCount > 0
      ? `${summary.reportEvidenceCount} ${summary.reportEvidenceCount === 1 ? "record" : "records"} marked for reports`
      : summary.portfolioEvidenceCount > 0
        ? `${summary.portfolioEvidenceCount} ${summary.portfolioEvidenceCount === 1 ? "portfolio item" : "portfolio items"} ready to review`
        : "Report ingredients will build as evidence is saved";

  return (
    <section style={shellStyle} aria-label={`${props.learnerName}'s My Data dashboard`}>
      <style jsx global>{`
        @media (max-width: 760px) {
          .mylearna-data-section-nav {
            overflow-x: auto;
            padding-bottom: 2px;
          }

          .mylearna-data-area-row {
            grid-template-columns: 1fr !important;
            align-items: start !important;
          }
        }
      `}</style>

      <nav
        aria-label="My Data sections"
        className="mylearna-data-section-nav"
        style={{ display: "flex", gap: 8, flexWrap: "nowrap" }}
      >
        {sectionLinks.map((label) => (
          <a
            key={label}
            href={`#my-data-${label.toLowerCase()}`}
            style={{
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#0f172a",
              borderRadius: 999,
              padding: "8px 12px",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="my-data-overview" style={sectionStyle}>
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(260px, 0.75fr)",
          }}
          className="mylearna-data-area-row"
        >
          <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
            <div style={eyebrowStyle}>Overview</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div
                aria-hidden="true"
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #2563eb 0%, #14b8a6 100%)",
                  color: "#ffffff",
                  fontSize: 17,
                  fontWeight: 850,
                  flexShrink: 0,
                }}
              >
                {buildInitials(props.learnerName)}
              </div>
              <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: "clamp(26px, 4vw, 38px)" }}>
                  {props.learnerName}&rsquo;s learning picture
                </h2>
                <div style={{ ...mutedTextStyle, fontSize: 14 }}>
                  {safe(props.learnerYearLevel) || "Year level not recorded"} | {currentStageTitle}
                </div>
              </div>
            </div>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.65, fontSize: 15 }}>
              My Data brings together current learning, saved work, pathway progress, and report
              ingredients for this learner.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Link href={primaryAction.href} style={primaryButtonStyle}>
                {primaryAction.label}
              </Link>
              <Link href="/my-portfolio" style={secondaryButtonStyle}>
                View portfolio
              </Link>
            </div>
          </div>

          <aside
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 18,
              background: "#f8fbff",
              padding: 16,
              display: "grid",
              gap: 12,
              alignSelf: "start",
            }}
          >
            <div style={eyebrowStyle}>Recommended next step</div>
            {leadNextStep ? (
              <>
                <strong style={{ color: "#0f172a", fontSize: 17 }}>{leadNextStep.stepTitle}</strong>
                <div style={{ color: "#475569", lineHeight: 1.5 }}>
                  {leadNextStep.subjectTitle} | {leadNextStep.strandTitle}
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.5 }}>{leadNextStep.reason}</div>
              </>
            ) : summary.isEmpty ? (
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                Start building {props.learnerName}&rsquo;s learning picture by choosing a pathway
                or adding a first observation.
              </div>
            ) : (
              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                Add evidence for recent work or review the current pathway when you are ready.
              </div>
            )}
          </aside>
        </div>

        {props.assessmentStatusesError || props.coverageError || props.coverageMessage ? (
          <div style={{ display: "grid", gap: 10 }}>
            {props.assessmentStatusesError ? (
              <div style={{ border: "1px solid #fecaca", background: "#fff7f7", color: "#b91c1c", borderRadius: 14, padding: 12 }}>
                {props.assessmentStatusesError}
              </div>
            ) : null}
            {props.coverageError ? (
              <div style={{ border: "1px solid #fecaca", background: "#fff7f7", color: "#b91c1c", borderRadius: 14, padding: 12 }}>
                {props.coverageError}
              </div>
            ) : null}
            {props.coverageMessage ? (
              <div style={{ border: "1px solid #bfdbfe", background: "#eff6ff", color: "#1d4ed8", borderRadius: 14, padding: 12 }}>
                {props.coverageMessage}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          }}
        >
          <Metric
            label="Current learning area"
            value={currentLearningArea}
            helper={summary.activeLearningAreaCount ? `${summary.areaCountLabel} represented` : "Choose a pathway to start"}
          />
          <Metric
            label="Learning records"
            value={summary.evidenceLinkedCount}
            helper="Pathway-linked records for this learner"
          />
          <Metric
            label="Portfolio"
            value={summary.portfolioEvidenceCount}
            helper="Records selected for portfolio"
          />
          <Metric label="Report status" value={reportSummary} />
        </div>

        <section
          aria-label="Recent learning activity"
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            background: "#f8fafc",
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={eyebrowStyle}>Recent learning activity</div>
          {latestActivity ? (
            <ActivityCard activity={latestActivity} />
          ) : (
            <div style={{ color: "#475569", lineHeight: 1.6 }}>
              No recent learning records yet. Add an observation, photo, or completed work when
              something useful happens.
            </div>
          )}
        </section>
      </section>

      <section id="my-data-progress" style={sectionStyle}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={eyebrowStyle}>Progress</div>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>Current pathway progress</h3>
          <p style={{ margin: 0, ...mutedTextStyle }}>
            Progress focuses on learning areas where there is a pathway, saved work, or a progress
            judgement. Untouched curriculum is not treated as a gap.
          </p>
        </div>

        {summary.activeLearningAreaRows.length ? (
          <div style={{ display: "grid", gap: 12 }}>
            {summary.activeLearningAreaRows.map((row) => (
              <LearningAreaRow key={row.key} row={row} />
            ))}
          </div>
        ) : (
          <div
            style={{
              border: "1px dashed #cbd5e1",
              borderRadius: 18,
              padding: 18,
              background: "#f8fafc",
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            Choose a pathway or add an observation to start building visible progress.
          </div>
        )}

        {summary.hasMeaningfulProgressTrend ? (
          <section style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, display: "grid", gap: 12 }}>
            <h4 style={{ margin: 0, color: "#0f172a", fontSize: 18 }}>Progress over time</h4>
            <ProgressTrend points={summary.progressOverTime} />
          </section>
        ) : (
          <div style={{ color: "#64748b", lineHeight: 1.6 }}>
            Progress patterns will appear after several learning records have been added across
            more than one date.
          </div>
        )}

        {summary.hasMeaningfulStrengths ? (
          <section style={{ display: "grid", gap: 10 }}>
            <h4 style={{ margin: 0, color: "#0f172a", fontSize: 18 }}>Learning currently recorded</h4>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              {summary.strengths.map((item) => (
                <article
                  key={item.key}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: 14,
                    background: "#ffffff",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                  <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{item.helper}</div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <section id="my-data-evidence" style={sectionStyle}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={eyebrowStyle}>Evidence</div>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>Saved learning records</h3>
          <p style={{ margin: 0, ...mutedTextStyle }}>
            Evidence totals use the same pathway-linked records that support Pathways and Portfolio.
          </p>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <Metric label="All learner evidence" value={props.evidenceEntries.length} />
          <Metric label="Current pathway evidence" value={summary.evidenceLinkedCount} />
          <Metric label="Portfolio items" value={summary.portfolioEvidenceCount} />
          <Metric label="Report-ready records" value={summary.reportEvidenceCount} />
        </div>

        {summary.recentActivity.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {summary.recentActivity.slice(0, 4).map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div style={{ color: "#475569", lineHeight: 1.6 }}>
            Start building {props.learnerName}&rsquo;s learning picture by adding an observation,
            work sample, or photo.
          </div>
        )}
      </section>

      <section id="my-data-coverage" style={sectionStyle}>
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
            <div style={eyebrowStyle}>Coverage</div>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>Learning areas</h3>
            <p style={{ margin: 0, ...mutedTextStyle }}>
              Active and evidence-backed areas are shown first. Inactive areas are kept quiet until
              they become part of the plan.
            </p>
          </div>
          <label style={{ display: "grid", gap: 6, color: "#334155", fontWeight: 750, minWidth: 220 }}>
            <span>View</span>
            <select
              value={selectedSubjectKey}
              onChange={(event) =>
                setSelectedSubjectKey(event.target.value as LearningIntelligenceSubjectFilter)
              }
              style={inputStyle}
            >
              <option value="all">All learning areas</option>
              {PATHWAY_SUBJECTS.filter((subject) => subject.status === "detailed").map(
                (subject) => (
                  <option key={subject.key} value={subject.key}>
                    {subject.title}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        {summary.activeLearningAreaRows.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {summary.activeLearningAreaRows.map((row) => (
              <LearningAreaRow key={row.key} row={row} />
            ))}
          </div>
        ) : (
          <div style={{ color: "#475569", lineHeight: 1.6 }}>
            No active learning areas are recorded yet.
          </div>
        )}

        {summary.inactiveLearningAreaRows.length ? (
          <details>
            <summary style={{ cursor: "pointer", color: "#334155", fontWeight: 800 }}>
              View quiet learning areas
            </summary>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {summary.inactiveLearningAreaRows.map((row) => (
                <LearningAreaRow key={row.key} row={row} quiet />
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <section id="my-data-reporting" style={sectionStyle}>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={eyebrowStyle}>Reporting</div>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
            Your report is taking shape
          </h3>
          <p style={{ margin: 0, ...mutedTextStyle }}>
            This checklist reflects useful report ingredients, not academic readiness.
          </p>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {summary.reportingReadiness.checklist.map((item) => (
            <div
              key={item.key}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: 12,
                background: item.complete ? "#f0fdf4" : "#f8fafc",
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    display: "grid",
                    placeItems: "center",
                    border: item.complete ? "1px solid #10b981" : "1px solid #cbd5e1",
                    color: item.complete ? "#047857" : "#64748b",
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  {item.complete ? "✓" : "○"}
                </span>
                <strong style={{ color: "#0f172a" }}>{item.label}</strong>
              </div>
              <div style={{ color: "#64748b", lineHeight: 1.5, paddingLeft: 28 }}>{item.helper}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/my-reports" style={primaryButtonStyle}>
            View report
          </Link>
          <button
            type="button"
            onClick={props.onDownloadCoverageRecord || undefined}
            disabled={!props.onDownloadCoverageRecord || props.coverageSubmitting}
            style={
              props.onDownloadCoverageRecord && !props.coverageSubmitting
                ? secondaryButtonStyle
                : { ...secondaryButtonStyle, opacity: 0.65, cursor: "default" }
            }
          >
            {props.coverageSubmitting ? "Preparing record..." : "Download coverage record"}
          </button>
        </div>
      </section>
    </section>
  );
}
