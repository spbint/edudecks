"use client";

import React from "react";
import type {
  CleanReport,
  CleanReportSection,
  CleanReportingPeriod,
} from "@/lib/clean/reports/types";
import type { CleanReportPdfEvidenceItem } from "@/lib/clean/outputs/pdf";
import type { LearningEvidenceEvent } from "@/lib/clean/evidence/learningEvidenceEvents";

const previewWrapStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  overflow: "hidden",
};

const previewHeaderStyle: React.CSSProperties = {
  padding: 20,
  borderBottom: "1px solid #e2e8f0",
  display: "grid",
  gap: 8,
};

const previewBodyStyle: React.CSSProperties = {
  padding: 20,
  display: "grid",
  gap: 16,
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 8,
};

type CleanReportPreviewProps = {
  report: CleanReport;
  learnerLabel: string;
  reportingPeriod: CleanReportingPeriod | null;
  sections: CleanReportSection[];
  evidenceItems?: CleanReportPdfEvidenceItem[];
  assessmentEvidenceItems?: LearningEvidenceEvent[];
};

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEvidenceEventDateLabel(value: string | null) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) return "Date not recorded";

  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return normalizedValue.slice(0, 10) || normalizedValue;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getEvidenceGroupTitle(item: CleanReportPdfEvidenceItem) {
  const title = item.title.trim() || "Learning evidence";
  const stepMatch = title.match(/Step\s+(\d+)\s*[-:]\s*(.+)$/i);
  if (stepMatch) {
    return `Step ${stepMatch[1]} - ${stepMatch[2].trim()}`;
  }

  return title;
}

function buildEvidenceSummaryGroups(items: CleanReportPdfEvidenceItem[]) {
  const groups = new Map<
    string,
    {
      area: string;
      title: string;
      count: number;
      latestDate: string | null;
    }
  >();

  items.forEach((item) => {
    const area = item.learningArea?.trim() || "Learning evidence";
    const title = getEvidenceGroupTitle(item);
    const key = `${area.toLowerCase()}::${title.toLowerCase()}`;
    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        area,
        title,
        count: 1,
        latestDate: item.observedOn,
      });
      return;
    }

    current.count += 1;
    if (item.observedOn && (!current.latestDate || item.observedOn > current.latestDate)) {
      current.latestDate = item.observedOn;
    }
  });

  return Array.from(groups.values()).sort((left, right) => {
    const areaCompare = left.area.localeCompare(right.area);
    if (areaCompare !== 0) return areaCompare;
    return (right.latestDate || "").localeCompare(left.latestDate || "");
  });
}

function getReportStatusLabel(status: CleanReport["status"]) {
  if (status === "ready") return "Ready";
  if (status === "archived") return "Archived";
  return "Draft";
}

function getReportStatusStyles(status: CleanReport["status"]): React.CSSProperties {
  if (status === "ready") {
    return {
      border: "1px solid #bbf7d0",
      background: "#f0fdf4",
      color: "#166534",
    };
  }

  if (status === "archived") {
    return {
      border: "1px solid #cbd5e1",
      background: "#f8fafc",
      color: "#475569",
    };
  }

  return {
    border: "1px solid #fcd34d",
    background: "#fffbeb",
    color: "#92400e",
  };
}

export default function CleanReportPreview({
  report,
  learnerLabel,
  reportingPeriod,
  sections,
  evidenceItems = [],
  assessmentEvidenceItems = [],
}: CleanReportPreviewProps) {
  const evidenceSummaryGroups = buildEvidenceSummaryGroups(evidenceItems);

  return (
    <article style={previewWrapStyle}>
      <header style={previewHeaderStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            Report preview
          </div>
          <span
            style={{
              ...getReportStatusStyles(report.status),
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {getReportStatusLabel(report.status)}
          </span>
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.08,
            fontWeight: 900,
            color: "#0f172a",
          }}
        >
          MyLearna Learning Record
        </div>
        <div
          style={{
            color: "#475569",
            lineHeight: 1.7,
            maxWidth: 760,
          }}
        >
          Prepared as a family learning record to support home education reporting.
        </div>
        <h2 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>{report.title}</h2>
        <div style={{ display: "grid", gap: 4, color: "#475569" }}>
          <div>
            <strong>Learner:</strong> {learnerLabel}
          </div>
          <div>
            <strong>Reporting period:</strong>{" "}
            {reportingPeriod ? reportingPeriod.title : "Unassigned"}
          </div>
          {reportingPeriod ? (
            <div>
              <strong>Dates:</strong> {formatDateLabel(reportingPeriod.startsOn)} to{" "}
              {formatDateLabel(reportingPeriod.endsOn)}
            </div>
          ) : null}
          <div>
            <strong>Portfolio evidence:</strong> {evidenceItems.length}
          </div>
          <div>
            <strong>Pathway checks:</strong> {assessmentEvidenceItems.length}
          </div>
          <div>
            <strong>Section count:</strong> {sections.length}
          </div>
        </div>
      </header>

      <div style={previewBodyStyle}>
        <section style={sectionStyle}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Evidence summary</div>
          {evidenceItems.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {evidenceSummaryGroups.map((item) => (
                <div key={`${item.area}-${item.title}`} style={{ display: "grid", gap: 4 }}>
                  <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {item.area}
                    {item.latestDate ? ` - Latest: ${formatDateLabel(item.latestDate)}` : ""}
                    {` - ${item.count} evidence ${item.count === 1 ? "entry" : "entries"}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              No selected portfolio evidence matches this report period yet. Try widening the date range or adding evidence from My Capture.
            </p>
          )}
        </section>

        <section style={sectionStyle}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Pathway assessment evidence</div>
          {assessmentEvidenceItems.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {assessmentEvidenceItems.map((item) => (
                <div key={item.id} style={{ display: "grid", gap: 5 }}>
                  <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {formatEvidenceEventDateLabel(item.evidenceDate)}
                    {item.strand ? ` - ${item.strand}` : ""}
                    {item.stepTitle ? ` - ${item.stepTitle}` : ""}
                  </div>
                  <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                    Result: {item.correctCount} / {item.questionCount} correct | Support recommended: {item.supportRecommendedCount}
                    {item.notSureCount ? ` | Not sure: ${item.notSureCount}` : ""}
                    {item.parentJudgement ? ` | Parent judgement: ${item.parentJudgement}` : ""}
                  </div>
                  <p style={{ margin: 0, color: "#334155", lineHeight: 1.7 }}>
                    Included as report-ready pathway evidence.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Completed pathway checks will appear here when they fall inside the selected report period.
            </p>
          )}
        </section>

        {sections.length ? (
          sections.map((section) => (
            <section key={section.id} style={sectionStyle}>
              <div style={{ color: "#64748b", fontSize: 12 }}>
                Section {section.sortOrder}
              </div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
                {section.heading}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#334155",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {section.content}
              </p>
            </section>
          ))
        ) : null}

        <section style={sectionStyle}>
          <div style={{ color: "#64748b", fontSize: 12 }}>Selected evidence details</div>
          {evidenceItems.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {evidenceItems.map((item) => (
                <div
                  key={`detail-${item.id}`}
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 14,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {formatDateLabel(item.observedOn || "")}
                    {item.learningArea ? ` - ${item.learningArea}` : ""}
                    {item.programTitle ? ` - Program: ${item.programTitle}` : ""}
                    {item.segmentTitle ? ` - Week / segment: ${item.segmentTitle}` : ""}
                    {item.blockTitle ? ` - Block: ${item.blockTitle}` : ""}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {item.sourceLabel ? (
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Source: {item.sourceLabel}
                      </span>
                    ) : null}
                    {item.stepLabel ? (
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: "#f8fafc",
                          color: "#475569",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {item.stepLabel}
                      </span>
                    ) : null}
                    {item.progressLevel ? (
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: "#f0fdf4",
                          color: "#166534",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {item.progressLevel}
                      </span>
                    ) : null}
                    {item.hasAttachment ? (
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: "#f0fdfa",
                          color: "#0f766e",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Photo/evidence attached
                      </span>
                    ) : null}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      color: "#334155",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.whatHappened}
                  </p>
                  {item.reflection ? (
                    <p
                      style={{
                        margin: 0,
                        color: "#475569",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <strong>Reflection / next step:</strong> {item.reflection}
                    </p>
                  ) : null}
                  {item.portfolioNote ? (
                    <p
                      style={{
                        margin: 0,
                        color: "#475569",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <strong>Portfolio note:</strong> {item.portfolioNote}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Selected evidence details will appear here once portfolio notes are linked to the report period.
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
