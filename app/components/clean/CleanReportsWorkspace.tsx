"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import { listCleanPortfolioItems } from "@/lib/clean/portfolio/client";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
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

type ReportSectionTemplate = {
  key: string;
  label: string;
  heading: string;
  starterText: string;
};

type ReportChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  detail: string;
};

const reportSectionTemplates: ReportSectionTemplate[] = [
  {
    key: "learning-highlights",
    label: "Learning highlights",
    heading: "Learning highlights",
    starterText:
      "What stood out most this period?\n\nHow did the learner respond to the work?\n\nWhich moments are worth remembering?",
  },
  {
    key: "progress-and-growth",
    label: "Progress and growth",
    heading: "Progress and growth",
    starterText:
      "Where has the learner grown this period?\n\nWhat has become more confident or consistent?\n\nWhat evidence best shows that progress?",
  },
  {
    key: "family-reflection",
    label: "Family reflection",
    heading: "Family reflection",
    starterText:
      "What worked well for the family this period?\n\nWhich routines, supports, or changes helped?\n\nWhat would you keep or adjust next time?",
  },
  {
    key: "next-steps",
    label: "Next steps",
    heading: "Next steps",
    starterText:
      "What is the next helpful focus?\n\nWhich strengths would you build on next?\n\nWhat support or opportunities would help most?",
  },
];

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

function formatDateRange(startsOn: string, endsOn: string) {
  return `${formatDateLabel(startsOn)} to ${formatDateLabel(endsOn)}`;
}

function portfolioEvidenceTitle(item: CleanPortfolioItem) {
  return item.evidence.title || item.evidence.whatHappened;
}

function summarizeEvidence(item: CleanPortfolioItem) {
  const text = item.evidence.whatHappened.trim();
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).trimEnd()}...`;
}

function buildEvidenceNote(item: CleanPortfolioItem, learnerLabel: string) {
  const lines = [
    `${portfolioEvidenceTitle(item)} (${formatDateLabel(item.evidence.observedOn)})`,
    `Learner: ${learnerLabel}`,
  ];

  if (item.evidence.learningArea) {
    lines.push(`Learning area: ${item.evidence.learningArea}`);
  }

  lines.push(item.evidence.whatHappened.trim());

  if (item.evidence.reflection?.trim()) {
    lines.push(`Reflection: ${item.evidence.reflection.trim()}`);
  }

  return lines.join("\n");
}

function formatUpdatedLabel(value: string | null) {
  if (!value) return "Not saved yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved recently";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1d4ed8",
  };
}

function CleanReportsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [periods, setPeriods] = useState<CleanReportingPeriod[]>([]);
  const [reports, setReports] = useState<CleanReport[]>([]);
  const [sections, setSections] = useState<CleanReportSection[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<CleanPortfolioItem[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
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
  const evidenceEntryIdFromQuery = searchParams.get("evidence_entry_id") ?? "";
  const learnerIdFromQuery = searchParams.get("learner_id") ?? "";
  const portfolioPathBase = pathname.startsWith("/clean-my-reports")
    ? "/clean-my-portfolio"
    : "/my-portfolio";

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

  const activeLearnerId = selectedReport?.learnerId || reportLearnerId || "";
  const activePeriod =
    selectedPeriod ||
    filteredPeriodsForReport.find((period) => period.id === reportingPeriodId) ||
    null;
  const activeLearnerLabel =
    learnerOptions.find((option) => option.value === activeLearnerId)?.label || "";
  const selectedReportLearnerLabel =
    learnerOptions.find((option) => option.value === selectedReport?.learnerId)?.label ||
    "Unknown learner";
  const continueReport = selectedReport ?? reports[0] ?? null;
  const continueReportPeriod =
    periods.find((period) => period.id === continueReport?.reportingPeriodId) ?? null;
  const continueReportLearnerLabel =
    learnerOptions.find((option) => option.value === continueReport?.learnerId)?.label ||
    "Unknown learner";
  const focusedPortfolioItems = useMemo(() => {
    if (!portfolioItems.length) return portfolioItems;
    if (!evidenceEntryIdFromQuery) return portfolioItems;

    return [...portfolioItems].sort((left, right) => {
      const leftFocused = left.evidence.id === evidenceEntryIdFromQuery ? 1 : 0;
      const rightFocused = right.evidence.id === evidenceEntryIdFromQuery ? 1 : 0;
      return rightFocused - leftFocused;
    });
  }, [evidenceEntryIdFromQuery, portfolioItems]);
  const nextSectionSortOrder = useMemo(() => {
    if (!sections.length) return 1;
    return Math.max(...sections.map((section) => section.sortOrder)) + 1;
  }, [sections]);
  const missingReportItems = useMemo(() => {
    if (!selectedReport) return [];

    const items: string[] = [];

    if (!selectedPeriod) {
      items.push("Choose a reporting period for this report.");
    }

    if (!portfolioItems.length) {
      items.push("Add at least one portfolio highlight that supports this report.");
    }

    if (!sections.length) {
      items.push("Add the first report section.");
    }

    if (!sectionHeading.trim() && !sections.length) {
      items.push("Start with a section template or create a blank section.");
    }

    return items;
  }, [portfolioItems.length, sectionHeading, sections.length, selectedPeriod, selectedReport]);
  const reportChecklist = useMemo<ReportChecklistItem[]>(() => {
    if (!selectedReport) return [];

    return [
      {
        key: "period",
        label: "Reporting period chosen",
        done: Boolean(selectedPeriod),
        detail: selectedPeriod
          ? `${selectedPeriod.title} is linked to this report.`
          : "Choose the reporting period for this report.",
      },
      {
        key: "evidence",
        label: "Portfolio evidence linked",
        done: portfolioItems.length > 0,
        detail:
          portfolioItems.length > 0
            ? `${portfolioItems.length} portfolio ${portfolioItems.length === 1 ? "note is" : "notes are"} ready to support this report.`
            : "Add at least one portfolio highlight that supports this report.",
      },
      {
        key: "sections",
        label: "Section structure started",
        done: sections.length > 0,
        detail:
          sections.length > 0
            ? `${sections.length} ${sections.length === 1 ? "section is" : "sections are"} in place.`
            : "Start the first report section.",
      },
      {
        key: "content",
        label: "Section writing added",
        done: sections.some((section) => section.content.trim()),
        detail: sections.some((section) => section.content.trim())
          ? "At least one section includes written content."
          : "Add the main notes to one or more sections.",
      },
    ];
  }, [portfolioItems.length, sections, selectedPeriod, selectedReport]);
  const checklistDoneCount = reportChecklist.filter((item) => item.done).length;
  const reportIsReadyToMark =
    Boolean(selectedReport) &&
    reportChecklist.length > 0 &&
    reportChecklist.every((item) => item.done);
  const nextReportGuidance = useMemo(() => {
    if (!selectedReport) {
      return "Create or open a report, then keep building it from your portfolio notes.";
    }

    if (selectedReport.status === "archived") {
      return "This report is archived. Return it to draft if you want to keep refining it.";
    }

    if (selectedReport.status === "ready") {
      return "This report is marked ready. Review the draft below and return it to draft if you need more changes.";
    }

    if (!selectedPeriod) {
      return "Choose the reporting period so the report and portfolio evidence line up.";
    }

    if (!portfolioItems.length) {
      return "Add or choose portfolio highlights that support this report, then bring them into the sections.";
    }

    if (!sections.length) {
      return "Start the first section. A section starter is the quickest way to begin.";
    }

    if (!sections.some((section) => section.content.trim())) {
      return "Add the main written notes to your sections, then review the draft preview.";
    }

    return "Review the preview and mark the report ready when the wording feels complete.";
  }, [portfolioItems.length, sections, selectedPeriod, selectedReport]);

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
          "We could not load the reporting periods just now.",
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
          "We could not load the reports just now.",
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
          "We could not load the report sections just now.",
        ),
      );
    } finally {
      setSectionsLoading(false);
    }
  }, [selectedReportId, workspace.profile]);

  const reloadPortfolioItems = useCallback(async () => {
    if (!workspace.profile || !activeLearnerId) {
      setPortfolioItems([]);
      setPortfolioError(null);
      return;
    }

    setPortfolioLoading(true);
    setPortfolioError(null);

    try {
      const nextItems = await listCleanPortfolioItems(workspace.profile.id, {
        learnerId: activeLearnerId,
        fromDate: activePeriod?.startsOn ?? null,
        toDate: activePeriod?.endsOn ?? null,
        highlightedOnly: true,
        limit: 100,
      });
      setPortfolioItems(nextItems);
    } catch (error) {
      setPortfolioError(
        normalizeCleanErrorMessage(
          error,
          "We could not load the portfolio evidence for this report.",
        ),
      );
    } finally {
      setPortfolioLoading(false);
    }
  }, [activeLearnerId, activePeriod?.endsOn, activePeriod?.startsOn, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setPeriods([]);
      setReports([]);
      setSections([]);
      setPortfolioItems([]);
      setPortfolioError(null);
      setSelectedReportId(null);
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
    void reloadPortfolioItems();
  }, [reloadPortfolioItems]);

  useEffect(() => {
    if (!learnerIdFromQuery || reportLearnerId || selectedReport) return;
    if (!learnerOptions.some((option) => option.value === learnerIdFromQuery)) return;

    setReportLearnerId(learnerIdFromQuery);
  }, [learnerIdFromQuery, learnerOptions, reportLearnerId, selectedReport]);

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
      setSectionSortOrder(String(nextSectionSortOrder));
      return;
    }

    setSectionHeading(selectedSection.heading);
    setSectionContent(selectedSection.content);
    setSectionSortOrder(String(selectedSection.sortOrder));
  }, [nextSectionSortOrder, sections, selectedSectionKey]);

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
    setSectionSortOrder(String(nextSectionSortOrder));
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

  function handleContinueReport(report: CleanReport) {
    setSelectedReportId(report.id);
    setEditingReportId(null);
    setMessage(null);
    setActionError(null);
  }

  async function handleUpdateReportStatus(
    report: CleanReport,
    status: CleanReportStatus,
  ) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await updateCleanReport(workspace.profile.id, report.id, { status });
      setSelectedReportId(report.id);
      setMessage(
        status === "ready"
          ? "Report marked ready."
          : status === "archived"
            ? "Report archived."
            : "Report returned to draft.",
      );
      await reloadReports();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(error, "We could not update the report status."),
      );
    } finally {
      setSubmitting(false);
    }
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
      const savedSectionKey =
        selectedSectionKey || sectionHeading.toLowerCase().replace(/\s+/g, "-");
      setSelectedSectionKey(savedSectionKey);
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

  function handleAddEvidenceToSection(item: CleanPortfolioItem) {
    const learnerLabel =
      learnerOptions.find((option) => option.value === item.evidence.learnerId)?.label ||
      "Learner";
    const note = buildEvidenceNote(item, learnerLabel);

    setSectionHeading((current) => current || "Learning highlights");
    setSectionContent((current) =>
      current.trim() ? `${current.trim()}\n\n${note}` : note,
    );
    setMessage("Evidence note added to the section editor. Save the section when you're ready.");
    setActionError(null);
  }

  async function handleCopyEvidenceText(item: CleanPortfolioItem) {
    const learnerLabel =
      learnerOptions.find((option) => option.value === item.evidence.learnerId)?.label ||
      "Learner";
    const note = buildEvidenceNote(item, learnerLabel);

    try {
      await navigator.clipboard.writeText(note);
      setMessage("Evidence note copied. You can paste it into any section.");
      setActionError(null);
    } catch {
      setActionError("We could not copy that evidence note just now.");
    }
  }

  function handleStartTemplate(template: ReportSectionTemplate) {
    setSelectedSectionKey("");
    setSectionHeading(template.heading);
    setSectionContent(template.starterText);
    setSectionSortOrder(String(nextSectionSortOrder));
    setMessage(`Started a new "${template.label}" section.`);
    setActionError(null);
  }

  function handleStartBlankSection() {
    setSelectedSectionKey("");
    setSectionHeading("");
    setSectionContent("");
    setSectionSortOrder(String(nextSectionSortOrder));
    setMessage("Started a blank report section.");
    setActionError(null);
  }

  const readyForReports =
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
              Prepare a report
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Reports</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Choose a learner, set the reporting period, and shape a report from
              the evidence you selected in My Portfolio.
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
              My Reports will not fall back to older draft or export tools.
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
              Reports are stored at the family level. Create the family profile first on My Profile.
            </p>
          </section>
        ) : null}

        {readyForReports && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner before creating reporting periods or reports.
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
                    Set the date window you want this report to cover.
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
                    {submitting ? "Saving..." : editingPeriodId ? "Save period" : "Add reporting period"}
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
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                Choose a learner, pick the reporting period, and start the report you want to shape.
              </p>

              {continueReport ? (
                <div
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 16,
                    padding: 16,
                    background: "#f8fbff",
                    display: "grid",
                    gap: 14,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>Continue where you left off</strong>
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        {continueReport.title} for {continueReportLearnerLabel}
                        {continueReportPeriod
                          ? ` - ${continueReportPeriod.title}`
                          : ""}
                      </div>
                    </div>

                    <span
                      style={{
                        ...getReportStatusStyles(continueReport.status),
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {getReportStatusLabel(continueReport.status)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          color: "#64748b",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Progress
                      </div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        {checklistDoneCount}/{reportChecklist.length || 4} readiness checks complete
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          color: "#64748b",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Last updated
                      </div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        {formatUpdatedLabel(continueReport.updatedAt || continueReport.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ color: "#475569", lineHeight: 1.6 }}>{nextReportGuidance}</div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => handleContinueReport(continueReport)}
                      disabled={submitting}
                    >
                      Continue working
                    </button>
                    {continueReport.status !== "ready" && reportIsReadyToMark ? (
                      <button
                        type="button"
                        style={{ ...buttonStyle, background: "#166534", borderColor: "#166534" }}
                        onClick={() => void handleUpdateReportStatus(continueReport, "ready")}
                        disabled={submitting}
                      >
                        Mark ready
                      </button>
                    ) : null}
                    {continueReport.status === "ready" ? (
                      <button
                        type="button"
                        style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                        onClick={() => void handleUpdateReportStatus(continueReport, "draft")}
                        disabled={submitting}
                      >
                        Return to draft
                      </button>
                    ) : null}
                    {continueReport.status !== "archived" ? (
                      <button
                        type="button"
                        style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                        onClick={() => void handleUpdateReportStatus(continueReport, "archived")}
                        disabled={submitting}
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        type="button"
                        style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                        onClick={() => void handleUpdateReportStatus(continueReport, "draft")}
                        disabled={submitting}
                      >
                        Reopen as draft
                      </button>
                    )}
                  </div>
                </div>
              ) : null}

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
                    {submitting ? "Saving..." : editingReportId ? "Save report" : "Create report"}
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
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <strong>{report.title}</strong>
                            <span
                              style={{
                                ...getReportStatusStyles(report.status),
                                borderRadius: 999,
                                padding: "4px 10px",
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              {getReportStatusLabel(report.status)}
                            </span>
                          </div>
                          <div style={{ color: "#64748b", marginTop: 4 }}>
                            {learnerLabel}
                            {period ? ` - ${period.title} (${formatDateRange(period.startsOn, period.endsOn)})` : ""}
                          </div>
                          <div style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
                            Updated {formatUpdatedLabel(report.updatedAt || report.createdAt)}
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
                            onClick={() => handleContinueReport(report)}
                            disabled={submitting}
                          >
                            {isSelected
                              ? "Open now"
                              : report.status === "draft"
                                ? "Continue"
                                : "Open"}
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
                <div style={{ display: "grid", gap: 16 }}>
                  <p style={{ margin: 0, color: "#475569" }}>
                    Create or select a report first. Once you do, you can build
                    sections and pull in notes from the portfolio.
                  </p>

                  {activeLearnerId ? (
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: 16,
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong style={{ color: "#0f172a" }}>Selected portfolio evidence</strong>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                          {activePeriod
                            ? `Showing portfolio evidence for ${activeLearnerLabel || "this learner"} during ${activePeriod.title}.`
                            : `Choose a reporting period to narrow this down. For now, you are seeing selected evidence for ${activeLearnerLabel || "this learner"}.`}
                        </p>
                      </div>

                      {portfolioLoading ? (
                        <p style={{ margin: 0, color: "#475569" }}>Loading portfolio evidence...</p>
                      ) : null}
                      {portfolioError ? (
                        <p style={{ margin: 0, color: "#b91c1c" }}>{portfolioError}</p>
                      ) : null}
                      {!portfolioLoading && !portfolioError && !portfolioItems.length ? (
                        <p style={{ margin: 0, color: "#475569" }}>
                          Nothing from the portfolio matches this learner yet.
                        </p>
                      ) : null}
                      {!portfolioLoading && !portfolioError && portfolioItems.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {portfolioItems.slice(0, 4).map((item) => (
                            <div
                              key={item.evidence.id}
                              style={{
                                border:
                                  evidenceEntryIdFromQuery === item.evidence.id
                                    ? "2px solid #1d4ed8"
                                    : "1px solid #dbeafe",
                                borderRadius: 12,
                                padding: 12,
                                display: "grid",
                                gap: 6,
                              }}
                            >
                              <strong>{portfolioEvidenceTitle(item)}</strong>
                              <div style={{ color: "#64748b", fontSize: 13 }}>
                                {formatDateLabel(item.evidence.observedOn)}
                                {item.evidence.learningArea
                                  ? ` - ${item.evidence.learningArea}`
                                  : ""}
                              </div>
                              <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                                {summarizeEvidence(item)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <Link
                        href={portfolioPathBase}
                        style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                      >
                        Open My Portfolio
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <section
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 16,
                      background: "#ffffff",
                      display: "grid",
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong style={{ color: "#0f172a" }}>
                          Working in: {selectedReport.title}
                        </strong>
                        <div style={{ color: "#475569", lineHeight: 1.6 }}>
                          {selectedPeriod
                            ? `Portfolio evidence in this period: ${portfolioItems.length}`
                            : "Choose the reporting period to line up the draft with the right evidence."}
                        </div>
                      </div>

                      <span
                        style={{
                          ...getReportStatusStyles(selectedReport.status),
                          borderRadius: 999,
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {getReportStatusLabel(selectedReport.status)}
                      </span>
                    </div>

                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      Next: {nextReportGuidance}
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {selectedReport.status !== "ready" && reportIsReadyToMark ? (
                        <button
                          type="button"
                          style={{ ...buttonStyle, background: "#166534", borderColor: "#166534" }}
                          onClick={() => void handleUpdateReportStatus(selectedReport, "ready")}
                          disabled={submitting}
                        >
                          Mark ready
                        </button>
                      ) : null}
                      {selectedReport.status === "ready" ? (
                        <button
                          type="button"
                          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                          onClick={() => void handleUpdateReportStatus(selectedReport, "draft")}
                          disabled={submitting}
                        >
                          Return to draft
                        </button>
                      ) : null}
                      {selectedReport.status !== "archived" ? (
                        <button
                          type="button"
                          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                          onClick={() => void handleUpdateReportStatus(selectedReport, "archived")}
                          disabled={submitting}
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          type="button"
                          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                          onClick={() => void handleUpdateReportStatus(selectedReport, "draft")}
                          disabled={submitting}
                        >
                          Reopen as draft
                        </button>
                      )}
                    </div>
                  </section>

                  <section
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: 16,
                      padding: 16,
                      background: "#f8fbff",
                      display: "grid",
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>Start a section more quickly</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Pick a section starter or begin with a blank section. You can edit everything before saving.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {reportSectionTemplates.map((template) => (
                        <button
                          key={template.key}
                          type="button"
                          style={{
                            ...buttonStyle,
                            background: "#ffffff",
                            color: "#0f172a",
                            borderColor: "#cbd5e1",
                          }}
                          onClick={() => handleStartTemplate(template)}
                          disabled={submitting}
                        >
                          {template.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        style={{
                          ...buttonStyle,
                          background: "#ffffff",
                          color: "#0f172a",
                          borderColor: "#cbd5e1",
                        }}
                        onClick={handleStartBlankSection}
                        disabled={submitting}
                      >
                        Blank section
                      </button>
                    </div>
                  </section>

                  <section
                    style={{
                      border: missingReportItems.length ? "1px solid #fcd34d" : "1px solid #bbf7d0",
                      borderRadius: 16,
                      padding: 16,
                      background: missingReportItems.length ? "#fffbeb" : "#f0fdf4",
                      display: "grid",
                      gap: 12,
                      marginBottom: 18,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>
                        {missingReportItems.length ? "What is still missing?" : "This report has the key pieces in place"}
                      </strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        {missingReportItems.length
                          ? "Use this checklist to see what will make the report feel more complete."
                          : "You have a reporting period, portfolio support, and at least one section started."}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 8,
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            color: "#64748b",
                            textTransform: "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          Readiness
                        </div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {checklistDoneCount}/{reportChecklist.length} checks complete
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            color: "#64748b",
                            textTransform: "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          Lifecycle
                        </div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {getReportStatusLabel(selectedReport.status)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      {reportChecklist.map((item) => (
                        <div
                          key={item.key}
                          style={{
                            display: "grid",
                            gap: 2,
                            padding: "10px 12px",
                            borderRadius: 12,
                            background: item.done ? "#ffffff" : "rgba(255,255,255,0.45)",
                            border: item.done ? "1px solid #bbf7d0" : "1px solid rgba(245,158,11,0.35)",
                          }}
                        >
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
                                width: 20,
                                height: 20,
                                borderRadius: 999,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 900,
                                background: item.done ? "#dcfce7" : "#fef3c7",
                                color: item.done ? "#166534" : "#92400e",
                                flexShrink: 0,
                              }}
                            >
                              {item.done ? "OK" : "!"}
                            </span>
                            <strong style={{ color: "#0f172a" }}>{item.label}</strong>
                          </div>
                          <div style={{ color: item.done ? "#166534" : "#92400e", lineHeight: 1.6 }}>
                            {item.detail}
                          </div>
                        </div>
                      ))}
                    </div>

                    {missingReportItems.length ? (
                      <div style={{ display: "grid", gap: 8 }}>
                        {missingReportItems.map((item) => (
                          <div
                            key={item}
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "flex-start",
                              color: "#92400e",
                              lineHeight: 1.6,
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: "#f59e0b",
                                marginTop: 8,
                                flexShrink: 0,
                              }}
                            />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>

                  <div
                    style={{
                      display: "grid",
                      gap: 20,
                      gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 1fr)",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ display: "grid", gap: 16 }}>
                      <div
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          background: selectedSectionKey ? "#eff6ff" : "#f8fafc",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <strong style={{ color: "#0f172a" }}>
                          {selectedSectionKey ? "Editing section" : "Drafting a new section"}
                        </strong>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                          {selectedSectionKey
                            ? `You are editing "${sectionHeading || selectedSectionKey}". Changes are only saved when you click Save section.`
                            : "Use a section starter, add evidence notes, then save when the wording feels right."}
                        </p>
                      </div>

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
                          placeholder="Write the section in your own words. Use the evidence notes on the right when they help."
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
                        <p style={{ margin: 0, color: "#475569" }}>Loading report sections...</p>
                      ) : null}

                      {!sectionsLoading && sections.length ? (
                        <div style={{ display: "grid", gap: 12 }}>
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
                    </div>

                    <aside
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: 16,
                        display: "grid",
                        gap: 12,
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong style={{ color: "#0f172a" }}>Selected portfolio evidence</strong>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                          {activePeriod
                            ? `Showing portfolio evidence for ${activePeriod.title}. Add notes to the section editor only when they help.`
                            : "Showing selected evidence for this learner. Choose a reporting period to narrow it down further."}
                        </p>
                      </div>

                      {portfolioLoading ? (
                        <p style={{ margin: 0, color: "#475569" }}>Loading portfolio evidence...</p>
                      ) : null}
                      {portfolioError ? (
                        <p style={{ margin: 0, color: "#b91c1c" }}>{portfolioError}</p>
                      ) : null}
                      {!portfolioLoading && !portfolioError && !portfolioItems.length ? (
                        <p style={{ margin: 0, color: "#475569" }}>
                          Nothing from the portfolio matches this report yet.
                        </p>
                      ) : null}

                      {!portfolioLoading && !portfolioError && portfolioItems.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {focusedPortfolioItems.map((item) => (
                            <div
                              key={item.evidence.id}
                              style={{
                                border:
                                  evidenceEntryIdFromQuery === item.evidence.id
                                    ? "2px solid #1d4ed8"
                                    : "1px solid #dbeafe",
                                borderRadius: 12,
                                background: "#ffffff",
                                padding: 12,
                                display: "grid",
                                gap: 8,
                              }}
                            >
                              <div style={{ display: "grid", gap: 4 }}>
                                <strong>{portfolioEvidenceTitle(item)}</strong>
                                <div style={{ color: "#64748b", fontSize: 13 }}>
                                  {formatDateLabel(item.evidence.observedOn)}
                                  {item.evidence.learningArea
                                    ? ` - ${item.evidence.learningArea}`
                                    : ""}
                                </div>
                              </div>
                              <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                                {summarizeEvidence(item)}
                              </p>
                              {item.evidence.reflection ? (
                                <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                                  Reflection saved for this evidence.
                                </div>
                              ) : null}
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button
                                  type="button"
                                  style={{
                                    ...buttonStyle,
                                    padding: "8px 12px",
                                    fontSize: 13,
                                  }}
                                  onClick={() => handleAddEvidenceToSection(item)}
                                >
                                  Add note to section
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    ...buttonStyle,
                                    background: "#ffffff",
                                    color: "#0f172a",
                                    borderColor: "#cbd5e1",
                                    padding: "8px 12px",
                                    fontSize: 13,
                                  }}
                                  onClick={() => void handleCopyEvidenceText(item)}
                                >
                                  Copy evidence text
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <Link
                        href={portfolioPathBase}
                        style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                      >
                        Open My Portfolio
                      </Link>
                    </aside>
                  </div>
                </>
              )}
            </section>

            {selectedReport ? (
              <section
                style={{
                  ...cardStyle,
                  background: "linear-gradient(180deg, #eef4ff 0%, #f8fafc 100%)",
                  borderColor: "#dbeafe",
                  padding: 24,
                }}
              >
                <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: "#1d4ed8",
                      textTransform: "uppercase",
                    }}
                  >
                    Draft report preview
                  </div>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 30 }}>
                    See how this report is taking shape
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                    This preview shows the learner, reporting period, selected
                    portfolio evidence, and the sections you have written so far.
                  </p>
                </div>

                <div
                  style={{
                    maxWidth: 860,
                    margin: "0 auto",
                    border: "1px solid #dbe4f0",
                    borderRadius: 22,
                    background: "#ffffff",
                    boxShadow: "0 20px 48px rgba(15,23,42,0.08)",
                    padding: "28px clamp(20px, 4vw, 40px)",
                    display: "grid",
                    gap: 26,
                  }}
                >
                  <header
                    style={{
                      display: "grid",
                      gap: 16,
                      paddingBottom: 20,
                      borderBottom: "1px solid #dbe4f0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
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
                          Homeschool report draft
                        </div>
                        <h3
                          style={{
                            margin: 0,
                            color: "#0f172a",
                            fontSize: "clamp(28px, 4vw, 36px)",
                            lineHeight: 1.15,
                          }}
                        >
                          {selectedReport.title}
                        </h3>
                        <div style={{ color: "#475569", lineHeight: 1.6 }}>
                          {nextReportGuidance}
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                        <div
                          style={{
                            ...getReportStatusStyles(selectedReport.status),
                            borderRadius: 999,
                            padding: "8px 12px",
                            fontSize: 13,
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getReportStatusLabel(selectedReport.status)}
                        </div>
                        <div
                          style={{
                            border: "1px solid #dbeafe",
                            borderRadius: 999,
                            background: "#eff6ff",
                            padding: "8px 12px",
                            color: "#1d4ed8",
                            fontSize: 13,
                            fontWeight: 800,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {sections.length} {sections.length === 1 ? "section" : "sections"}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: 14,
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            color: "#64748b",
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}
                        >
                          Learner
                        </div>
                        <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 700 }}>
                          {selectedReportLearnerLabel}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            color: "#64748b",
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}
                        >
                          Reporting period
                        </div>
                        <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
                          {selectedPeriod ? selectedPeriod.title : "Not set"}
                        </div>
                        <div style={{ color: "#475569", marginTop: 4, lineHeight: 1.6 }}>
                          {selectedPeriod
                            ? formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)
                            : "Choose a reporting period for this report."}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            color: "#64748b",
                            textTransform: "uppercase",
                            marginBottom: 6,
                          }}
                        >
                          Evidence summary
                        </div>
                        <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
                          {portfolioItems.length} {portfolioItems.length === 1 ? "portfolio note" : "portfolio notes"}
                        </div>
                        <div style={{ color: "#475569", marginTop: 4, lineHeight: 1.6 }}>
                          Selected highlights ready to support this report.
                        </div>
                      </div>
                    </div>
                  </header>

                  <section
                    style={{
                      display: "grid",
                      gap: 12,
                      padding: 18,
                      borderRadius: 18,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
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
                      Evidence summary
                    </div>
                    {portfolioItems.length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {focusedPortfolioItems.slice(0, 5).map((item) => (
                          <div
                            key={item.evidence.id}
                            style={{
                              display: "grid",
                              gap: 4,
                              paddingLeft: 14,
                              borderLeft:
                                evidenceEntryIdFromQuery === item.evidence.id
                                  ? "3px solid #1d4ed8"
                                  : "3px solid #cbd5e1",
                            }}
                          >
                            <div style={{ color: "#0f172a", fontWeight: 700 }}>
                              {portfolioEvidenceTitle(item)}
                            </div>
                            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                              {formatDateLabel(item.evidence.observedOn)}
                              {item.evidence.learningArea
                                ? ` | ${item.evidence.learningArea}`
                                : ""}
                            </div>
                            <div style={{ color: "#475569", lineHeight: 1.6 }}>
                              {summarizeEvidence(item)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                        No portfolio evidence matches this report yet. Add highlights
                        in My Portfolio, then return here.
                      </p>
                    )}
                  </section>

                  <section style={{ display: "grid", gap: 22 }}>
                    {sections.length ? (
                      sections.map((section) => (
                        <article
                          key={section.id}
                          style={{
                            display: "grid",
                            gap: 12,
                            paddingTop: 4,
                          }}
                        >
                          <div
                            style={{
                              display: "grid",
                              gap: 6,
                              paddingBottom: 12,
                              borderBottom: "1px solid #eef2f7",
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
                              Section {section.sortOrder}
                            </div>
                            <h4
                              style={{
                                margin: 0,
                                color: "#0f172a",
                                fontSize: 22,
                                lineHeight: 1.3,
                              }}
                            >
                              {section.heading}
                            </h4>
                          </div>
                          <div
                            style={{
                              color: "#334155",
                              lineHeight: 1.85,
                              fontSize: 16,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {section.content || "No content yet."}
                          </div>
                        </article>
                      ))
                    ) : (
                      <div
                        style={{
                          border: "1px dashed #cbd5e1",
                          borderRadius: 18,
                          padding: 22,
                          color: "#475569",
                          lineHeight: 1.7,
                          background: "#fcfdff",
                        }}
                      >
                        Add a section to start shaping this report. The preview will
                        show each section here as the draft grows.
                      </div>
                    )}
                  </section>

                  {missingReportItems.length ? (
                    <section
                      style={{
                        display: "grid",
                        gap: 10,
                        paddingTop: 16,
                        borderTop: "1px solid #eef2f7",
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
                        Still to add
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {missingReportItems.map((item) => (
                          <div key={item} style={{ color: "#475569", lineHeight: 1.7 }}>
                            {item}
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </section>
            ) : null}
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
