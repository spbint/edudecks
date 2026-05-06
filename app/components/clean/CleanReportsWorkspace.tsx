"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import {
  createCleanReport,
  createCleanReportingPeriod,
  deleteCleanReport,
  deleteCleanReportingPeriod,
  listCleanReports,
  listCleanReportSections,
  listCleanReportingPeriods,
  updateCleanReport,
  updateCleanReportingPeriod,
  upsertCleanReportSection,
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

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "vertical",
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

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function countEvidenceWithinPeriod(startsOn: string, endsOn: string, evidenceDates: string[]) {
  return evidenceDates.filter((date) => date >= startsOn && date <= endsOn).length;
}

function CleanReportsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const [periods, setPeriods] = useState<CleanReportingPeriod[]>([]);
  const [reports, setReports] = useState<CleanReport[]>([]);
  const [sections, setSections] = useState<CleanReportSection[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [evidenceCount, setEvidenceCount] = useState<number | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [selectedSectionKey, setSelectedSectionKey] = useState("");

  const [periodLearnerId, setPeriodLearnerId] = useState("");
  const [periodTitle, setPeriodTitle] = useState("");
  const [periodStartsOn, setPeriodStartsOn] = useState("");
  const [periodEndsOn, setPeriodEndsOn] = useState("");

  const [reportLearnerId, setReportLearnerId] = useState("");
  const [reportingPeriodId, setReportingPeriodId] = useState("");
  const [reportTitle, setReportTitle] = useState("");

  const [sectionHeading, setSectionHeading] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [sectionSortOrder, setSectionSortOrder] = useState("0");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const selectedReport =
    reports.find((report) => report.id === selectedReportId) ?? null;
  const selectedPeriod =
    periods.find((period) => period.id === selectedReport?.reportingPeriodId) ?? null;

  const filteredPeriodsForReport = useMemo(() => {
    if (!reportLearnerId) return periods;
    return periods.filter((period) => period.learnerId === reportLearnerId);
  }, [periods, reportLearnerId]);

  const reloadPeriods = useCallback(async () => {
    if (!workspace.profile) return;

    setPeriodsLoading(true);
    setDataError(null);
    try {
      const nextPeriods = await listCleanReportingPeriods(workspace.profile.id, {
        limit: 50,
      });
      setPeriods(nextPeriods);
    } catch (error) {
      setDataError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean reporting periods just now.",
        ),
      );
    } finally {
      setPeriodsLoading(false);
    }
  }, [workspace.profile]);

  const reloadReports = useCallback(async () => {
    if (!workspace.profile) return;

    setReportsLoading(true);
    setDataError(null);
    try {
      const nextReports = await listCleanReports(workspace.profile.id, {
        limit: 50,
      });
      setReports(nextReports);
      setSelectedReportId((current) =>
        current && nextReports.some((report) => report.id === current)
          ? current
          : nextReports[0]?.id ?? null,
      );
    } catch (error) {
      setDataError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean reports just now.",
        ),
      );
    } finally {
      setReportsLoading(false);
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

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setPeriods([]);
      setReports([]);
      setSections([]);
      setSelectedReportId(null);
      setEvidenceCount(null);
      return;
    }

    void reloadPeriods();
    void reloadReports();
  }, [
    reloadPeriods,
    reloadReports,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    void reloadSections();
  }, [reloadSections]);

  useEffect(() => {
    async function loadEvidenceCount() {
      if (!workspace.profile || !selectedReport || !selectedPeriod) {
        setEvidenceCount(null);
        return;
      }

      try {
        const evidence = await listCleanEvidenceEntries(workspace.profile.id, {
          learnerId: selectedReport.learnerId,
          fromDate: selectedPeriod.startsOn,
          toDate: selectedPeriod.endsOn,
          limit: 200,
        });
        const dates = evidence.map((entry) => entry.observedOn);
        setEvidenceCount(
          countEvidenceWithinPeriod(selectedPeriod.startsOn, selectedPeriod.endsOn, dates),
        );
      } catch {
        setEvidenceCount(null);
      }
    }

    void loadEvidenceCount();
  }, [selectedPeriod, selectedReport, workspace.profile]);

  useEffect(() => {
    if (
      reportingPeriodId &&
      !filteredPeriodsForReport.some((period) => period.id === reportingPeriodId)
    ) {
      setReportingPeriodId("");
    }
  }, [filteredPeriodsForReport, reportingPeriodId]);

  useEffect(() => {
    const selectedSection =
      sections.find((section) => section.sectionKey === selectedSectionKey) ?? null;

    if (!selectedSection) {
      setSectionHeading("");
      setSectionContent("");
      setSectionSortOrder("0");
      return;
    }

    setSectionHeading(selectedSection.heading);
    setSectionContent(selectedSection.content);
    setSectionSortOrder(String(selectedSection.sortOrder));
  }, [sections, selectedSectionKey]);

  function resetPeriodForm() {
    setEditingPeriodId(null);
    setPeriodLearnerId("");
    setPeriodTitle("");
    setPeriodStartsOn("");
    setPeriodEndsOn("");
  }

  function resetReportForm() {
    setEditingReportId(null);
    setReportLearnerId("");
    setReportingPeriodId("");
    setReportTitle("");
  }

  function resetSectionForm() {
    setSelectedSectionKey("");
    setSectionHeading("");
    setSectionContent("");
    setSectionSortOrder("0");
  }

  async function handlePeriodSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        learnerId: periodLearnerId,
        title: periodTitle,
        startsOn: periodStartsOn,
        endsOn: periodEndsOn,
      };

      if (editingPeriodId) {
        await updateCleanReportingPeriod(
          workspace.profile.id,
          editingPeriodId,
          payload,
        );
        setMessage("Reporting period updated.");
      } else {
        await createCleanReportingPeriod(workspace.profile.id, payload);
        setMessage("Reporting period created.");
      }

      resetPeriodForm();
      await reloadPeriods();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the reporting period.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePeriod(period: CleanReportingPeriod) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanReportingPeriod(workspace.profile.id, period.id);
      if (editingPeriodId === period.id) {
        resetPeriodForm();
      }
      setMessage("Reporting period deleted.");
      await reloadPeriods();
      await reloadReports();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete the reporting period.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditPeriod(period: CleanReportingPeriod) {
    setEditingPeriodId(period.id);
    setPeriodLearnerId(period.learnerId);
    setPeriodTitle(period.title);
    setPeriodStartsOn(period.startsOn);
    setPeriodEndsOn(period.endsOn);
    setMessage(null);
    setActionError(null);
  }

  async function handleReportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        learnerId: reportLearnerId,
        reportingPeriodId,
        title: reportTitle,
      };

      if (editingReportId) {
        await updateCleanReport(workspace.profile.id, editingReportId, payload);
        setMessage("Report updated.");
      } else {
        const created = await createCleanReport(workspace.profile.id, payload);
        setSelectedReportId(created.id);
        setMessage("Report created.");
      }

      resetReportForm();
      await reloadReports();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(error, "We could not save the report."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteReport(report: CleanReport) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanReport(workspace.profile.id, report.id);
      if (editingReportId === report.id) {
        resetReportForm();
      }
      if (selectedReportId === report.id) {
        resetSectionForm();
      }
      setMessage("Report deleted.");
      await reloadReports();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(error, "We could not delete the report."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditReport(report: CleanReport) {
    setEditingReportId(report.id);
    setReportLearnerId(report.learnerId);
    setReportingPeriodId(report.reportingPeriodId);
    setReportTitle(report.title);
    setSelectedReportId(report.id);
    setMessage(null);
    setActionError(null);
  }

  async function handleSectionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile || !selectedReport) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await upsertCleanReportSection(workspace.profile.id, {
        reportId: selectedReport.id,
        learnerId: selectedReport.learnerId,
        sectionKey: selectedSectionKey || sectionHeading.toLowerCase().replace(/\s+/g, "-"),
        heading: sectionHeading,
        content: sectionContent,
        sortOrder: Number.parseInt(sectionSortOrder || "0", 10) || 0,
      });
      setMessage("Report section saved.");
      await reloadSections();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the report section.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditSection(section: CleanReportSection) {
    setSelectedSectionKey(section.sectionKey);
    setSectionHeading(section.heading);
    setSectionContent(section.content);
    setSectionSortOrder(String(section.sortOrder));
    setMessage(null);
    setActionError(null);
  }

  const readyForReports =
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
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Reports</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              This preview route uses only clean reporting periods, reports, and report sections. PDF and export come later.
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
              The clean reports scaffold will not fall back to legacy report draft systems.
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
              Reports are family-scoped in the clean rebuild. Create the family profile first on My Profile.
            </p>
          </section>
        ) : null}

        {readyForReports && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              A clean learner is required before the reports foundation can create reporting periods or reports.
            </p>
          </section>
        ) : null}

        {readyForReports && workspace.profile && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Reporting periods</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Build the clean reporting window first, then attach a report to it.
                  </p>
                </div>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => {
                    void reloadPeriods();
                    void reloadReports();
                    void reloadSections();
                  }}
                  disabled={periodsLoading || reportsLoading || sectionsLoading || submitting}
                >
                  {periodsLoading || reportsLoading || sectionsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <form onSubmit={handlePeriodSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <select
                    value={periodLearnerId}
                    onChange={(event) => setPeriodLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select learner</option>
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={periodTitle}
                    onChange={(event) => setPeriodTitle(event.target.value)}
                    placeholder="Reporting period title"
                    style={inputStyle}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <input
                    type="date"
                    value={periodStartsOn}
                    onChange={(event) => setPeriodStartsOn(event.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={periodEndsOn}
                    onChange={(event) => setPeriodEndsOn(event.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving..." : editingPeriodId ? "Save period" : "Add period"}
                  </button>
                  {editingPeriodId ? (
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                      onClick={resetPeriodForm}
                      disabled={submitting}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>

              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {periods.map((period) => {
                  const learnerLabel =
                    learnerOptions.find((option) => option.value === period.learnerId)?.label ||
                    "Unknown learner";

                  return (
                    <div
                      key={period.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: 14,
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <strong>{period.title}</strong>
                          <div style={{ color: "#64748b", marginTop: 4 }}>
                            {learnerLabel} - {formatDateLabel(period.startsOn)} to {formatDateLabel(period.endsOn)}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                            onClick={() => handleEditPeriod(period)}
                            disabled={submitting}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }}
                            onClick={() => void handleDeletePeriod(period)}
                            disabled={submitting}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Reports</h2>
              <form onSubmit={handleReportSubmit} style={{ display: "grid", gap: 12 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <select
                    value={reportLearnerId}
                    onChange={(event) => setReportLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select learner</option>
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={reportingPeriodId}
                    onChange={(event) => setReportingPeriodId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select reporting period</option>
                    {filteredPeriodsForReport.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.title}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  value={reportTitle}
                  onChange={(event) => setReportTitle(event.target.value)}
                  placeholder="Report title"
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving..." : editingReportId ? "Save report" : "Add report"}
                  </button>
                  {editingReportId ? (
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                      onClick={resetReportForm}
                      disabled={submitting}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>

              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {reports.map((report) => {
                  const learnerLabel =
                    learnerOptions.find((option) => option.value === report.learnerId)?.label ||
                    "Unknown learner";
                  const period = periods.find((item) => item.id === report.reportingPeriodId) ?? null;
                  const isSelected = selectedReportId === report.id;

                  return (
                    <div
                      key={report.id}
                      style={{
                        border: isSelected ? "2px solid #1d4ed8" : "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: 14,
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <strong>{report.title}</strong>
                          <div style={{ color: "#64748b", marginTop: 4 }}>
                            {learnerLabel}
                            {period ? ` - ${period.title}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={{
                              ...buttonStyle,
                              background: isSelected ? "#1d4ed8" : "#ffffff",
                              borderColor: isSelected ? "#1d4ed8" : "#0f172a",
                              color: isSelected ? "#ffffff" : "#0f172a",
                            }}
                            onClick={() => setSelectedReportId(report.id)}
                            disabled={submitting}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </button>
                          <button
                            type="button"
                            style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                            onClick={() => handleEditReport(report)}
                            disabled={submitting}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }}
                            onClick={() => void handleDeleteReport(report)}
                            disabled={submitting}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Report sections</h2>
              {!selectedReport ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  Select a report to edit its sections.
                </p>
              ) : (
                <>
                  <p style={{ marginTop: 0, color: "#475569" }}>
                    Working in: <strong>{selectedReport.title}</strong>
                    {selectedPeriod ? (
                      <span>
                        {" "}
                        - Evidence in period: <strong>{evidenceCount ?? 0}</strong>
                      </span>
                    ) : null}
                  </p>

                  <form onSubmit={handleSectionSubmit} style={{ display: "grid", gap: 12 }}>
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      }}
                    >
                      <select
                        value={selectedSectionKey}
                        onChange={(event) => setSelectedSectionKey(event.target.value)}
                        style={inputStyle}
                      >
                        <option value="">New section</option>
                        {sections.map((section) => (
                          <option key={section.id} value={section.sectionKey}>
                            {section.heading}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={sectionSortOrder}
                        onChange={(event) => setSectionSortOrder(event.target.value)}
                        placeholder="Sort order"
                        style={inputStyle}
                      />
                    </div>

                    <input
                      value={sectionHeading}
                      onChange={(event) => setSectionHeading(event.target.value)}
                      placeholder="Section heading"
                      style={inputStyle}
                    />

                    <textarea
                      value={sectionContent}
                      onChange={(event) => setSectionContent(event.target.value)}
                      placeholder="Section content"
                      style={textAreaStyle}
                    />

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="submit" style={buttonStyle} disabled={submitting}>
                        {submitting ? "Saving..." : "Save section"}
                      </button>
                      {selectedSectionKey ? (
                        <button
                          type="button"
                          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                          onClick={resetSectionForm}
                          disabled={submitting}
                        >
                          Clear selection
                        </button>
                      ) : null}
                    </div>
                  </form>

                  {sectionsLoading ? (
                    <p style={{ marginTop: 16, marginBottom: 0, color: "#475569" }}>
                      Loading report sections...
                    </p>
                  ) : null}

                  {!sectionsLoading && sections.length ? (
                    <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                      {sections.map((section) => (
                        <div
                          key={section.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 14,
                            padding: 14,
                            display: "grid",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <div>
                              <strong>
                                {section.sortOrder}. {section.heading}
                              </strong>
                              <div style={{ color: "#64748b", marginTop: 4 }}>
                                {section.sectionKey}
                              </div>
                            </div>
                            <button
                              type="button"
                              style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                              onClick={() => handleEditSection(section)}
                              disabled={submitting}
                            >
                              Edit
                            </button>
                          </div>
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                            {section.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </section>
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

export default function CleanReportsWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanReportsWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
