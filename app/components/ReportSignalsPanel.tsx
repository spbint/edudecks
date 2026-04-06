"use client";

import { useEffect, useState } from "react";
import { loadAssessmentEngine } from "@/lib/assessmentEngine";
import { buildReadinessReport, ReadinessReport } from "@/lib/reporting/readiness";
import {
  generateReportingIntelligence,
  ReportingIntelligence,
  ReportingMode,
} from "@/lib/reporting/intelligence";

export function useAssessmentInsights(
  studentId?: string,
  studentName?: string,
  mode: ReportingMode = "parent_friendly"
) {
  const [readinessReport, setReadinessReport] = useState<ReadinessReport | null>(null);
  const [narrative, setNarrative] = useState<ReportingIntelligence | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!studentId) {
      setReadinessReport(null);
      setNarrative(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      try {
        const result = await loadAssessmentEngine({ studentId });
        if (!active) return;
        setReadinessReport(buildReadinessReport(result));
        setNarrative(
          generateReportingIntelligence(result, studentName ?? "Learner", mode)
        );
      } catch {
        if (!active) return;
        setReadinessReport(null);
        setNarrative(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [studentId, studentName, mode]);

  return { loading, readinessReport, narrative };
}

const panelStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 24,
  background: "#ffffff",
  padding: 24,
  boxShadow: "0 15px 32px rgba(15,23,42,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const previewSectionStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#f8fafc",
  padding: 16,
  display: "grid",
  gap: 8,
};

const previewGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
};

const previewItemStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e5e7f0",
  padding: 10,
  background: "#ffffff",
  minHeight: 70,
};

const previewLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "#475569",
};

const previewValueStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.5,
  color: "#0f172a",
};

const subjectCardStyle: React.CSSProperties = {
  border: "1px solid #edf2f7",
  borderRadius: 16,
  padding: 14,
  background: "#fdfdff",
};

const listStyle: React.CSSProperties = {
  marginTop: 10,
  paddingLeft: 18,
  lineHeight: 1.6,
  color: "#475569",
  fontSize: 13,
};

const badgeStyle = (status: string): React.CSSProperties => {
  const map: Record<string, React.CSSProperties> = {
    Ready: { background: "#ecfdf5", color: "#166534", border: "1px solid #bbf7d0" },
    "Nearly Ready": { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" },
    Partial: { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" },
    "Needs Evidence": { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
  };
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 14px",
    borderRadius: 999,
    fontWeight: 900,
    letterSpacing: 0.6,
    fontSize: 11,
    textTransform: "uppercase",
    ...(map[status] ?? map["Needs Evidence"]),
  };
};

const toneMap: Record<ReportingMode, { label: string; description: string }> = {
  parent_friendly: {
    label: "Parent friendly",
    description: "Warm and reassuring language for families.",
  },
  teacher_professional: {
    label: "Teacher professional",
    description: "Practical, actionable wording for teaching teams.",
  },
  authority_ready_concise: {
    label: "Authority ready",
    description: "Compact, evidence-first phrasing for formal reviews.",
  },
};

type Props = {
  studentId?: string;
  studentName?: string;
  mode?: ReportingMode;
};

export default function ReportSignalsPanel({
  studentId,
  studentName,
  mode = "parent_friendly",
}: Props) {
  const { loading, readinessReport, narrative } = useAssessmentInsights(
    studentId,
    studentName,
    mode
  );

  if (!studentId) return null;

  const modeMeta = toneMap[mode];
  const subjectsToShow = readinessReport?.subjectReadiness.slice(0, 4) ?? [];
  const gaps = readinessReport?.evidenceGaps ?? [];
  const limitedGaps = gaps.slice(0, 3);
  const moreGaps = gaps.length > limitedGaps.length;
  const captureGuidance = readinessReport?.captureGuidance ?? [];
  const limitedGuidance = captureGuidance.slice(0, 4);
  const previewHighlights = narrative
    ? [
        { label: "Strength", value: narrative.strengths[0] },
        { label: "Growth", value: narrative.areasForGrowth[0] },
        { label: "Next step", value: narrative.nextSteps[0] },
      ].filter((item) => Boolean(item.value))
    : [];

  return (
    <section style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#64748b", textTransform: "uppercase" }}>
            Report readiness
          </div>
          <div style={{ fontSize: 32, fontWeight: 950, color: "#0f172a", marginTop: 6 }}>
            {loading ? "Loading" : readinessReport?.overallStatus || "Preparing signals"}
          </div>
        </div>
        {readinessReport && (
          <div style={{ textAlign: "right" }}>
            <span style={badgeStyle(readinessReport.overallStatus)}>
              {readinessReport.reportReady ? "Report ready" : "Still collecting"}
            </span>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
              {modeMeta.label}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{modeMeta.description}</div>
          </div>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>
        {readinessReport
          ? readinessReport.explanation
          : loading
          ? "Gathering curriculum-linked signals…"
          : "Select a child to surface readiness signals."}
      </p>

      {narrative && (
        <div style={previewSectionStyle}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: "#475569",
            }}
          >
            Report preview
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "#0f172a" }}>{narrative.overallSummary}</p>
          {previewHighlights.length > 0 && (
            <div style={previewGridStyle}>
              {previewHighlights.map((point) => (
                <div key={point.label} style={previewItemStyle}>
                  <div style={previewLabelStyle}>{point.label}</div>
                  <div style={previewValueStyle}>{point.value}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Evidence note: {narrative.evidenceReadinessNote}
          </div>
        </div>
      )}

      {subjectsToShow.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.6, color: "#475569", textTransform: "uppercase" }}>
            Subject signals
          </div>
          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            {subjectsToShow.map((subject) => (
              <div key={subject.subjectName} style={subjectCardStyle}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                  {subject.subjectName}
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, color: "#1f2937", marginTop: 4 }}>
                  {subject.status}
                </div>
                <p style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>{subject.explanation}</p>
                <p style={{ fontSize: 11, fontWeight: 900, marginTop: 8, color: "#0f172a" }}>Next capture</p>
                <p style={{ fontSize: 11, color: "#475569" }}>{subject.nextCapture}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {limitedGaps.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.6, color: "#475569", textTransform: "uppercase" }}>
            Evidence gaps
          </div>
          <ul style={listStyle}>
            {limitedGaps.map((gap) => (
              <li key={gap.standardId}>
                <strong>{gap.officialCode}</strong> · {gap.title} <em>({gap.subjectName})</em>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{gap.reason}</div>
              </li>
            ))}
            {moreGaps ? (
              <li style={{ fontSize: 12, color: "#6b7280" }}>
                And {gaps.length - limitedGaps.length} more evidence gaps remain.
              </li>
            ) : null}
          </ul>
        </div>
      )}

      {limitedGuidance.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.6, color: "#475569", textTransform: "uppercase" }}>
            Next capture guidance
          </div>
          <ul style={listStyle}>
            {limitedGuidance.map((guidance) => (
              <li key={guidance}>{guidance}</li>
            ))}
            {captureGuidance.length > limitedGuidance.length ? (
              <li style={{ fontSize: 12, color: "#6b7280" }}>
                More capture ideas are available in the assessment intelligence view.
              </li>
            ) : null}
          </ul>
        </div>
      )}

      {narrative && narrative.subjectInsights.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {narrative.subjectInsights.slice(0, 2).map((insight) => (
            <div
              key={`${insight.subjectName}-${insight.summary}`}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: 14,
                background: "#fdfdfd",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>
                {insight.subjectName}
              </div>
              <p style={{ fontSize: 13, color: "#475569" }}>{insight.summary}</p>
              <p style={{ fontSize: 11, color: "#6b7280" }}>Strengths: {insight.strengths}</p>
              <p style={{ fontSize: 11, color: "#6b7280" }}>Growth: {insight.growth}</p>
              <p style={{ fontSize: 11, color: "#6b7280" }}>Next steps: {insight.nextSteps}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
