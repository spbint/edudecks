"use client";

import React from "react";
import type {
  CleanReport,
  CleanReportSection,
  CleanReportingPeriod,
} from "@/lib/clean/reports/types";

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
}: CleanReportPreviewProps) {
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
        </div>
      </header>

      <div style={previewBodyStyle}>
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
        ) : (
          <section style={sectionStyle}>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
              No sections yet
            </h3>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Add report sections in My Reports before recording an output.
            </p>
          </section>
        )}
      </div>
    </article>
  );
}
