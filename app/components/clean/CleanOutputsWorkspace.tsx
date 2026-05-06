"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanReportPreview from "@/app/components/clean/CleanReportPreview";
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

  const selectedReport =
    filteredReports.find((report) => report.id === selectedReportId) ?? null;
  const selectedPeriod =
    periods.find((period) => period.id === selectedReport?.reportingPeriodId) ?? null;

  const selectedLearnerLabel = selectedReport
    ? learnerOptions.find((option) => option.value === selectedReport.learnerId)?.label ??
      "Unknown learner"
    : null;

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
    if (!filteredReports.length) {
      setSelectedReportId("");
      return;
    }

    setSelectedReportId((current) =>
      current && filteredReports.some((report) => report.id === current)
        ? current
        : filteredReports[0]?.id ?? "",
    );
  }, [filteredReports]);

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
              Clean rebuild scaffold
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Outputs</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              This preview route shows a clean HTML report preview and records export history without generating a file yet.
            </p>
          </div>
        </section>

        {workspace.loading ? (
          <section style={cardStyle}>Loading clean family workspace...</section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              The clean outputs scaffold will not fall back to legacy export systems.
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
              Outputs are family-scoped in the clean rebuild. Create the family profile first on My Profile.
            </p>
          </section>
        ) : null}

        {readyForOutputs && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              A clean learner is required before the outputs foundation can preview or record report exports.
            </p>
          </section>
        ) : null}

        {readyForOutputs && workspace.profile && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
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
                  <option value="">Select report</option>
                  {filteredReports.map((report) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === report.learnerId)?.label ??
                      "Unknown learner";

                    return (
                      <option key={report.id} value={report.id}>
                        {report.title} - {learnerLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

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
                  {submitting ? "Recording export..." : "Export Report"}
                </button>
              </div>

              <p style={{ margin: "12px 0 0", color: "#475569" }}>
                Preview is HTML only in this phase. Export records a clean `report_exports` row but does not generate a file yet.
              </p>
            </section>

            {!selectedReport || !selectedLearnerLabel ? (
              <section style={cardStyle}>
                <p style={{ margin: 0, color: "#475569" }}>
                  Select a clean report to preview it and record an export.
                </p>
              </section>
            ) : (
              <>
                <CleanReportPreview
                  report={selectedReport}
                  learnerLabel={selectedLearnerLabel}
                  reportingPeriod={selectedPeriod}
                  sections={sections}
                />

                <section style={cardStyle}>
                  <h2 style={{ marginTop: 0, color: "#0f172a" }}>Export history</h2>
                  <p style={{ marginTop: 0, color: "#475569" }}>
                    Recorded exports for the selected report. File generation is intentionally deferred.
                  </p>

                  {exportsLoading ? (
                    <p style={{ margin: 0, color: "#475569" }}>Loading export history...</p>
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
                            {entry.exportFormat.toUpperCase()} export
                          </strong>
                          <span style={{ color: "#475569" }}>
                            Recorded {formatTimestamp(entry.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#475569" }}>
                      No clean exports recorded for this report yet.
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
