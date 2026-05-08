"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanReportPreview from "@/app/components/clean/CleanReportPreview";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import {
  createCleanReportExport,
  listCleanReportExports,
} from "@/lib/clean/outputs/client";
import type { CleanReportExport } from "@/lib/clean/outputs/types";
import {
  listCleanReportSections,
  listCleanReports,
  listCleanReportingPeriods,
} from "@/lib/clean/reports/client";
import type {
  CleanReport,
  CleanReportSection,
  CleanReportStatus,
  CleanReportingPeriod,
} from "@/lib/clean/reports/types";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function formatTimestamp(value: string | null) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatUpdatedLabel(value: string | null) {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(startsOn: string, endsOn: string) {
  return `${formatDateLabel(startsOn)} to ${formatDateLabel(endsOn)}`;
}

function getReportStatusLabel(status: CleanReportStatus) {
  if (status === "ready") return "Ready";
  if (status === "archived") return "Archived";
  return "Draft";
}

function getReportStatusStyles(status: CleanReportStatus): React.CSSProperties {
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

function CleanOutputsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [periods, setPeriods] = useState<CleanReportingPeriod[]>([]);
  const [reports, setReports] = useState<CleanReport[]>([]);
  const [sections, setSections] = useState<CleanReportSection[]>([]);
  const [exportsHistory, setExportsHistory] = useState<CleanReportExport[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [exportsLoading, setExportsLoading] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [dataError, setDataError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const filteredReports = useMemo(() => {
    if (!selectedLearnerId) return reports;
    return reports.filter((report) => report.learnerId === selectedLearnerId);
  }, [reports, selectedLearnerId]);
  const readyReports = useMemo(
    () => filteredReports.filter((report) => report.status === "ready"),
    [filteredReports],
  );
  const draftReports = useMemo(
    () => filteredReports.filter((report) => report.status === "draft"),
    [filteredReports],
  );
  const archivedReports = useMemo(
    () => filteredReports.filter((report) => report.status === "archived"),
    [filteredReports],
  );

  const selectedReport =
    readyReports.find((report) => report.id === selectedReportId) ?? null;
  const selectedPeriod =
    periods.find((period) => period.id === selectedReport?.reportingPeriodId) ?? null;

  const selectedLearnerLabel = selectedReport
    ? learnerOptions.find((option) => option.value === selectedReport.learnerId)?.label ??
      "Unknown learner"
    : null;
  const latestExport = exportsHistory[0] ?? null;
  const outputsNextGuidance = !readyReports.length
    ? draftReports.length
      ? "Finish a draft in My Reports, then mark it ready so it appears here."
      : "Create a report in My Reports and move it through to Ready."
    : selectedReport
      ? latestExport
        ? "You can record another output when you want to capture a new version."
        : "Review the report preview, then record the first output for this ready report."
      : "Choose one of the ready reports to review and record.";

  const reloadCatalog = useCallback(async () => {
    if (!workspace.profile) return;

    setCatalogLoading(true);
    setDataError(null);
    try {
      const [nextPeriods, nextReports] = await Promise.all([
        listCleanReportingPeriods(workspace.profile.id, { limit: 50 }),
        listCleanReports(workspace.profile.id, { limit: 50 }),
      ]);

      setPeriods(nextPeriods);
      setReports(nextReports);
    } catch (error) {
      setDataError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean output data just now.",
        ),
      );
    } finally {
      setCatalogLoading(false);
    }
  }, [workspace.profile]);

  const reloadSections = useCallback(async () => {
    if (!workspace.profile || !selectedReportId) {
      setSections([]);
      return;
    }

    setSectionsLoading(true);
    setDataError(null);
    try {
      const nextSections = await listCleanReportSections(
        workspace.profile.id,
        selectedReportId,
      );
      setSections(nextSections);
    } catch (error) {
      setDataError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean report sections just now.",
        ),
      );
    } finally {
      setSectionsLoading(false);
    }
  }, [selectedReportId, workspace.profile]);

  const reloadExports = useCallback(async () => {
    if (!workspace.profile || !selectedReportId) {
      setExportsHistory([]);
      return;
    }

    setExportsLoading(true);
    setDataError(null);
    try {
      const nextExports = await listCleanReportExports(
        workspace.profile.id,
        selectedReportId,
      );
      setExportsHistory(nextExports);
    } catch (error) {
      setDataError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean report exports just now.",
        ),
      );
    } finally {
      setExportsLoading(false);
    }
  }, [selectedReportId, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setPeriods([]);
      setReports([]);
      setSections([]);
      setExportsHistory([]);
      setSelectedLearnerId("");
      setSelectedReportId("");
      return;
    }

    void reloadCatalog();
  }, [
    reloadCatalog,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (!workspace.learners.length) {
      setSelectedLearnerId("");
      return;
    }

    setSelectedLearnerId((current) => {
      if (current && workspace.learners.some((learner) => learner.id === current)) {
        return current;
      }

      return workspace.profile?.defaultLearnerId || workspace.learners[0]?.id || "";
    });
  }, [workspace.learners, workspace.profile]);

  useEffect(() => {
    if (!readyReports.length) {
      setSelectedReportId("");
      return;
    }

    setSelectedReportId((current) =>
      current && readyReports.some((report) => report.id === current)
        ? current
        : readyReports[0]?.id ?? "",
    );
  }, [readyReports]);

  useEffect(() => {
    void reloadSections();
    void reloadExports();
  }, [reloadExports, reloadSections]);

  async function handleExport() {
    if (!workspace.profile || !selectedReport) return;

    setSubmitting(true);
    setActionError(null);
    setMessage(null);

    try {
      await createCleanReportExport(workspace.profile.id, {
        reportId: selectedReport.id,
        learnerId: selectedReport.learnerId,
        exportFormat: "pdf",
      });
      setMessage("Export recorded. PDF generation comes in the next clean phase.");
      await reloadExports();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not record the clean report export.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const readyForOutputs =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />

        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Final stage
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Outputs</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Choose a ready report, review the draft, and record an output when it is ready to leave the writing stage.
            </p>
          </div>
        </section>

        {workspace.loading ? (
          <section style={cardStyle}>Loading your family workspace...</section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              My Outputs will not fall back to older export tools.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.error ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>Workspace error</strong>
            <p style={{ margin: 0, color: "#475569" }}>{workspace.error}</p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Create family profile first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Outputs are stored at the family level. Create the family profile first on My Profile.
            </p>
          </section>
        ) : null}

        {readyForOutputs && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner before previewing or recording report outputs.
            </p>
          </section>
        ) : null}

        {readyForOutputs && workspace.profile && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: "#0f172a" }}>Choose a ready report</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  Only reports marked ready appear as output candidates. Draft and archived reports stay visible below so you know what still needs attention.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <select
                  value={selectedLearnerId}
                  onChange={(event) => setSelectedLearnerId(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">All learners with reports</option>
                  {learnerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedReportId}
                  onChange={(event) => setSelectedReportId(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select ready report</option>
                  {readyReports.map((report) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === report.learnerId)?.label ??
                      "Unknown learner";
                    const period =
                      periods.find((item) => item.id === report.reportingPeriodId) ?? null;

                    return (
                      <option key={report.id} value={report.id}>
                        {report.title} - {learnerLabel}
                        {period ? ` - ${period.title}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    border: "1px solid #bbf7d0",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f0fdf4",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div style={{ color: "#166534", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Ready now
                  </div>
                  <div style={{ color: "#0f172a", fontSize: 24, fontWeight: 800 }}>
                    {readyReports.length}
                  </div>
                  <div style={{ color: "#166534", lineHeight: 1.5 }}>
                    Reports ready for output records
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #fcd34d",
                    borderRadius: 14,
                    padding: 14,
                    background: "#fffbeb",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div style={{ color: "#92400e", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Still drafting
                  </div>
                  <div style={{ color: "#0f172a", fontSize: 24, fontWeight: 800 }}>
                    {draftReports.length}
                  </div>
                  <div style={{ color: "#92400e", lineHeight: 1.5 }}>
                    Reports that still need writing or review
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 14,
                    padding: 14,
                    background: "#f8fafc",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div style={{ color: "#475569", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Archived
                  </div>
                  <div style={{ color: "#0f172a", fontSize: 24, fontWeight: 800 }}>
                    {archivedReports.length}
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.5 }}>
                    Older reports kept for reference
                  </div>
                  </div>
                </div>

              <section
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 14,
                  background: "#ffffff",
                  display: "grid",
                  gap: 8,
                  marginTop: 16,
                }}
              >
                <strong style={{ color: "#0f172a" }}>What next?</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  {outputsNextGuidance}
                </p>
              </section>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => {
                    void reloadCatalog();
                    void reloadSections();
                    void reloadExports();
                  }}
                  disabled={catalogLoading || sectionsLoading || exportsLoading || submitting}
                >
                  {catalogLoading || sectionsLoading || exportsLoading
                    ? "Refreshing..."
                    : "Refresh"}
                </button>
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: selectedReport ? "#0f172a" : "#94a3b8",
                    borderColor: selectedReport ? "#0f172a" : "#94a3b8",
                    cursor: selectedReport ? "pointer" : "not-allowed",
                  }}
                  onClick={() => void handleExport()}
                  disabled={!selectedReport || submitting}
                >
                  {submitting ? "Recording output..." : "Record output"}
                </button>
              </div>

              <p style={{ margin: "12px 0 0", color: "#475569" }}>
                The preview stays on screen only. Recording an output adds an export record and history entry, but does not generate a file yet.
              </p>
            </section>

            {draftReports.length ? (
              <section style={cardStyle}>
                <h2 style={{ marginTop: 0, color: "#0f172a" }}>Still drafting</h2>
                <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                  These reports are not ready for outputs yet. Finish them in My Reports, then mark them ready.
                </p>

                <div style={{ display: "grid", gap: 12 }}>
                  {draftReports.map((report) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === report.learnerId)?.label ??
                      "Unknown learner";
                    const period =
                      periods.find((item) => item.id === report.reportingPeriodId) ?? null;

                    return (
                      <div
                        key={report.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong style={{ color: "#0f172a" }}>{report.title}</strong>
                            <div style={{ color: "#475569", lineHeight: 1.6, marginTop: 4 }}>
                              {learnerLabel}
                              {period ? ` - ${period.title}` : ""}
                            </div>
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
                        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                          Updated {formatUpdatedLabel(report.updatedAt || report.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {archivedReports.length ? (
              <section style={cardStyle}>
                <h2 style={{ marginTop: 0, color: "#0f172a" }}>Archived reports</h2>
                <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                  Archived reports stay here for reference, but they are not active output candidates.
                </p>

                <div style={{ display: "grid", gap: 12 }}>
                  {archivedReports.map((report) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === report.learnerId)?.label ??
                      "Unknown learner";
                    const period =
                      periods.find((item) => item.id === report.reportingPeriodId) ?? null;

                    return (
                      <div
                        key={report.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <strong style={{ color: "#0f172a" }}>{report.title}</strong>
                            <div style={{ color: "#475569", lineHeight: 1.6, marginTop: 4 }}>
                              {learnerLabel}
                              {period ? ` - ${period.title}` : ""}
                            </div>
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
                        <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                          Updated {formatUpdatedLabel(report.updatedAt || report.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {!readyReports.length ? (
              <section style={cardStyle}>
                <h2 style={{ marginTop: 0, color: "#0f172a" }}>No ready reports yet</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  Move back to My Reports, finish a draft, and mark it ready. Once a report is ready, it becomes available here as an output candidate.
                </p>
              </section>
            ) : null}

            {!selectedReport || !selectedLearnerLabel ? (
              <section style={cardStyle}>
                <p style={{ margin: 0, color: "#475569" }}>
                  Select a ready report to review it and record an output.
                </p>
              </section>
            ) : (
              <>
                <section style={cardStyle}>
                  <div
                    style={{
                      display: "grid",
                      gap: 14,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: 14,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Selected report
                      </div>
                      <strong style={{ color: "#0f172a", fontSize: 20 }}>{selectedReport.title}</strong>
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        {selectedLearnerLabel}
                        {selectedPeriod ? ` - ${selectedPeriod.title}` : ""}
                      </div>
                      {selectedPeriod ? (
                        <div style={{ color: "#475569", lineHeight: 1.6 }}>
                          {formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)}
                        </div>
                      ) : null}
                    </div>

                    <div
                      style={{
                        border: "1px solid #bbf7d0",
                        borderRadius: 14,
                        padding: 14,
                        background: "#f0fdf4",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ color: "#166534", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Output readiness
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <span
                          style={{
                            ...getReportStatusStyles(selectedReport.status),
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {getReportStatusLabel(selectedReport.status)}
                        </span>
                        <span style={{ color: "#166534", fontWeight: 700 }}>
                          Ready to record as an output
                        </span>
                      </div>
                      <div style={{ color: "#166534", lineHeight: 1.6 }}>
                        Review the report below, then record the output when you are satisfied with this version.
                      </div>
                    </div>

                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: 14,
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Output history
                      </div>
                      <div style={{ color: "#0f172a", fontSize: 22, fontWeight: 800 }}>
                        {exportsHistory.length}
                      </div>
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        {latestExport
                          ? `Latest record: ${latestExport.exportFormat.toUpperCase()} on ${formatTimestamp(latestExport.createdAt)}`
                          : "No output records yet for this report."}
                      </div>
                    </div>
                  </div>
                </section>

                <CleanReportPreview
                  report={selectedReport}
                  learnerLabel={selectedLearnerLabel}
                  reportingPeriod={selectedPeriod}
                  sections={sections}
                />

                <section style={cardStyle}>
                  <h2 style={{ marginTop: 0, color: "#0f172a" }}>Output history</h2>
                  <p style={{ marginTop: 0, color: "#475569" }}>
                    Each record shows that this ready report was captured as an output. File generation comes later.
                  </p>

                  {exportsLoading ? (
                    <p style={{ margin: 0, color: "#475569" }}>Loading output history...</p>
                  ) : exportsHistory.length ? (
                    <div style={{ display: "grid", gap: 12 }}>
                      {exportsHistory.map((entry) => (
                        <div
                          key={entry.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 14,
                            padding: 14,
                            display: "grid",
                            gap: 4,
                          }}
                        >
                          <strong style={{ color: "#0f172a" }}>
                            {entry.exportFormat.toUpperCase()} output record
                          </strong>
                          <span style={{ color: "#475569" }}>
                            Recorded {formatTimestamp(entry.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#475569" }}>
                      No output records for this report yet.
                    </p>
                  )}
                </section>
              </>
            )}
          </>
        ) : null}

        {dataError ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{dataError}</p>
          </section>
        ) : null}

        {message ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#0f766e" }}>{message}</p>
          </section>
        ) : null}

        {actionError ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#b91c1c" }}>{actionError}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanOutputsWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanOutputsWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
