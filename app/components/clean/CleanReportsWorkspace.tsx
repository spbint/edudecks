"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 16,
  background: "#f8fbff",
  padding: 16,
  display: "grid",
  gap: 8,
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

function summarizeSectionContent(value: string) {
  const text = value.trim();
  if (!text) return "No content yet.";
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).trimEnd()}...`;
}

function buildDefaultReportTitle(learnerLabel: string, periodTitle: string) {
  if (learnerLabel && periodTitle) return `${learnerLabel} - ${periodTitle} report`;
  if (periodTitle) return `${periodTitle} report`;
  if (learnerLabel) return `${learnerLabel} report`;
  return "Learning report";
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
  const [showPeriodManager, setShowPeriodManager] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showCustomReportTitle, setShowCustomReportTitle] = useState(false);
  const [showSectionComposer, setShowSectionComposer] = useState(false);
  const [showSectionAdvanced, setShowSectionAdvanced] = useState(false);
  const [showEvidencePanel, setShowEvidencePanel] = useState(false);

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
  const reportSetupRef = useRef<HTMLDivElement>(null);
  const periodManagerRef = useRef<HTMLDivElement>(null);
  const sectionComposerRef = useRef<HTMLDivElement>(null);
  const reportPreviewRef = useRef<HTMLDivElement>(null);
  const evidenceEntryIdFromQuery = searchParams.get("evidence_entry_id") ?? "";
  const learnerIdFromQuery = searchParams.get("learner_id") ?? "";
  const portfolioPathBase = pathname.startsWith("/clean-my-reports")
    ? "/clean-my-portfolio"
    : "/my-portfolio";
  const outputsPathBase = pathname.startsWith("/clean-my-reports")
    ? "/clean-my-outputs"
    : "/my-outputs";
  const readyForReports =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

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
  const draftReportLearnerLabel =
    learnerOptions.find((option) => option.value === reportLearnerId)?.label || "";
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
  const suggestedReportTitle = useMemo(
    () => buildDefaultReportTitle(draftReportLearnerLabel, activePeriod?.title ?? ""),
    [activePeriod?.title, draftReportLearnerLabel],
  );
  const sectionDraftStarted = Boolean(
    selectedSectionKey || sectionHeading.trim() || sectionContent.trim(),
  );
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

    if (sections.length && !sections.some((section) => section.content.trim())) {
      items.push("Add the main notes to one or more sections.");
    }

    return items;
  }, [portfolioItems.length, sections, selectedPeriod, selectedReport]);
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

  const scrollToRef = useCallback((target: React.RefObject<HTMLDivElement | null>) => {
    target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openReportBuilder = useCallback(() => {
    setShowReportBuilder(true);
    window.requestAnimationFrame(() => {
      scrollToRef(reportSetupRef);
    });
  }, [scrollToRef]);

  const openPeriodManager = useCallback(() => {
    setShowPeriodManager(true);
    window.requestAnimationFrame(() => {
      scrollToRef(periodManagerRef);
    });
  }, [scrollToRef]);

  const openSectionComposer = useCallback(
    (advanced = false) => {
      setShowSectionComposer(true);
      if (advanced) {
        setShowSectionAdvanced(true);
      }
      window.requestAnimationFrame(() => {
        scrollToRef(sectionComposerRef);
      });
    },
    [scrollToRef],
  );

  const openPreview = useCallback(() => {
    window.requestAnimationFrame(() => {
      scrollToRef(reportPreviewRef);
    });
  }, [scrollToRef]);

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
    if (!readyForReports) return;
    if (!reports.length) {
      setShowReportBuilder(true);
      setShowPeriodManager(periods.length === 0);
      return;
    }

    if (editingReportId) {
      setShowReportBuilder(true);
    }

    if (editingPeriodId) {
      setShowPeriodManager(true);
    }
  }, [editingPeriodId, editingReportId, periods.length, readyForReports, reports.length]);

  useEffect(() => {
    if (sectionDraftStarted) {
      setShowSectionComposer(true);
    }
  }, [sectionDraftStarted]);

  useEffect(() => {
    if (!selectedReport) {
      setShowSectionComposer(false);
      setShowSectionAdvanced(false);
      setShowEvidencePanel(false);
      return;
    }

    if (!sections.length) {
      setShowSectionComposer(true);
    }
  }, [sections.length, selectedReport]);

  useEffect(() => {
    if (
      !selectedReport &&
      workspace.learners.length === 1 &&
      !reportLearnerId &&
      !editingReportId
    ) {
      setReportLearnerId(workspace.learners[0]?.id ?? "");
    }
  }, [editingReportId, reportLearnerId, selectedReport, workspace.learners]);

  useEffect(() => {
    if (
      reportLearnerId &&
      !reportingPeriodId &&
      filteredPeriodsForReport.length === 1 &&
      !editingReportId
    ) {
      setReportingPeriodId(filteredPeriodsForReport[0]?.id ?? "");
    }
  }, [editingReportId, filteredPeriodsForReport, reportLearnerId, reportingPeriodId]);

  useEffect(() => {
    if (evidenceEntryIdFromQuery) {
      setShowEvidencePanel(true);
    }
  }, [evidenceEntryIdFromQuery]);

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
    setShowCustomReportTitle(false);
  }

  function resetSectionForm() {
    setSelectedSectionKey("");
    setSectionHeading("");
    setSectionContent("");
    setSectionSortOrder(String(nextSectionSortOrder));
    setShowSectionAdvanced(false);
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
      const nextTitle = reportTitle.trim() || suggestedReportTitle;
      const payload = {
        learnerId: reportLearnerId,
        reportingPeriodId,
        title: nextTitle,
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
      setShowReportBuilder(false);
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
    setShowReportBuilder(true);
    setShowCustomReportTitle(true);
    setMessage(null);
    setActionError(null);
  }

  function handleContinueReport(report: CleanReport) {
    setSelectedReportId(report.id);
    setEditingReportId(null);
    setShowReportBuilder(false);
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
      const resolvedSortOrder = selectedSectionKey
        ? Number.parseInt(sectionSortOrder || "0", 10) || 0
        : nextSectionSortOrder;
      await upsertCleanReportSection(workspace.profile.id, {
        reportId: selectedReport.id,
        learnerId: selectedReport.learnerId,
        sectionKey: selectedSectionKey || sectionHeading.toLowerCase().replace(/\s+/g, "-"),
        heading: sectionHeading,
        content: sectionContent,
        sortOrder: resolvedSortOrder,
      });
      const savedSectionKey =
        selectedSectionKey || sectionHeading.toLowerCase().replace(/\s+/g, "-");
      setSelectedSectionKey(savedSectionKey);
      setMessage("Report section saved.");
      await reloadSections();
      openPreview();
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
    openSectionComposer(true);
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
    openSectionComposer();
    setShowEvidencePanel(true);
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
    openSectionComposer();
    setMessage(`Started a new "${template.label}" section.`);
    setActionError(null);
  }

  function handleStartBlankSection() {
    setSelectedSectionKey("");
    setSectionHeading("");
    setSectionContent("");
    setSectionSortOrder(String(nextSectionSortOrder));
    openSectionComposer();
    setMessage("Started a blank report section.");
    setActionError(null);
  }

  function renderChecklistAction(item: ReportChecklistItem) {
    if (item.done) return null;

    if (item.key === "period") {
      return (
        <button
          type="button"
          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
          onClick={periods.length ? openReportBuilder : openPeriodManager}
        >
          {periods.length ? "Choose period" : "Add reporting period"}
        </button>
      );
    }

    if (item.key === "evidence") {
      return (
        <Link
          href={portfolioPathBase}
          style={{
            ...buttonStyle,
            background: "#ffffff",
            color: "#0f172a",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Open selected portfolio evidence
        </Link>
      );
    }

    if (item.key === "sections") {
      return (
        <button
          type="button"
          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
          onClick={() => {
            handleStartTemplate(reportSectionTemplates[0]);
            openSectionComposer();
          }}
        >
          Add first section
        </button>
      );
    }

    if (item.key === "content") {
      return (
        <button
          type="button"
          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
          onClick={() => openSectionComposer()}
        >
          Continue writing
        </button>
      );
    }

    return null;
  }

  const nextActionButton = (() => {
    if (!selectedReport) {
      return (
        <button type="button" style={buttonStyle} onClick={openReportBuilder}>
          Start a report
        </button>
      );
    }

    if (selectedReport.status === "archived") {
      return (
        <button
          type="button"
          style={buttonStyle}
          onClick={() => void handleUpdateReportStatus(selectedReport, "draft")}
          disabled={submitting}
        >
          Reopen as draft
        </button>
      );
    }

    if (selectedReport.status === "ready") {
      return (
        <Link
          href={outputsPathBase}
          style={{
            ...buttonStyle,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Open My Outputs
        </Link>
      );
    }

    if (!selectedPeriod) {
      return (
        <button
          type="button"
          style={buttonStyle}
          onClick={periods.length ? openReportBuilder : openPeriodManager}
        >
          {periods.length ? "Choose the period" : "Add a reporting period"}
        </button>
      );
    }

    if (!portfolioItems.length) {
      return (
        <Link
          href={portfolioPathBase}
          style={{
            ...buttonStyle,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Open My Portfolio
        </Link>
      );
    }

    if (!sections.length) {
      return (
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            handleStartTemplate(reportSectionTemplates[0]);
            openSectionComposer();
          }}
        >
          Add first section
        </button>
      );
    }

    if (!sections.some((section) => section.content.trim())) {
      return (
        <button type="button" style={buttonStyle} onClick={() => openSectionComposer()}>
          Continue writing
        </button>
      );
    }

    return (
      <button type="button" style={buttonStyle} onClick={openPreview}>
        Review preview
      </button>
    );
  })();

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
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Guided report building</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                    My Reports works best when you open one report, follow the readiness steps,
                    and use the preview to see the learning record take shape.
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>{nextReportGuidance}</div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {nextActionButton}
                    <Link
                      href={portfolioPathBase}
                      style={{
                        ...buttonStyle,
                        background: "#ffffff",
                        color: "#0f172a",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      Open My Portfolio
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section ref={periodManagerRef} style={cardStyle}>
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
                    Set the time span a report should cover. You only need this when you are adding or adjusting a period.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                    onClick={() => setShowPeriodManager((current) => !current)}
                    disabled={submitting}
                  >
                    {showPeriodManager ? "Hide period tools" : periods.length ? "Manage periods" : "Add first period"}
                  </button>
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
              </div>

              {showPeriodManager || !periods.length ? (
                <>
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
                </>
              ) : (
                <div style={{ ...helperCardStyle, marginTop: 16 }}>
                  <strong style={{ color: "#0f172a" }}>
                    {periods.length} reporting {periods.length === 1 ? "period is" : "periods are"} ready
                  </strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Open this panel only when you need to add a new period or adjust the dates for an existing one.
                  </p>
                </div>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Reports</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                Open a report, see what is still missing, then keep building from the preview and section tools below.
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
                      <strong style={{ color: "#0f172a" }}>
                        {selectedReportId === continueReport.id ? "Selected report" : "Continue where you left off"}
                      </strong>
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
                      Open this report
                    </button>
                    <button
                      type="button"
                      style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                      onClick={openPreview}
                      disabled={submitting}
                    >
                      Jump to preview
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
                    {continueReport.status === "ready" ? (
                      <Link
                        href={outputsPathBase}
                        style={{
                          ...buttonStyle,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        Open My Outputs
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div
                ref={reportSetupRef}
                style={{
                  display: "grid",
                  gap: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 14,
                  background: "#f8fafc",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong style={{ color: "#0f172a" }}>
                      {editingReportId ? "Edit this report setup" : "Start another report"}
                    </strong>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      Use the learner and reporting period the page already knows, then only edit the title if you want a different name.
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                    onClick={() => setShowReportBuilder((current) => !current)}
                    disabled={submitting}
                  >
                    {showReportBuilder ? "Hide report setup" : editingReportId ? "Edit report setup" : "Create another report"}
                  </button>
                </div>

                {showReportBuilder || !reports.length ? (
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
                {showCustomReportTitle || editingReportId ? (
                  <input
                    value={reportTitle}
                    onChange={(event) => setReportTitle(event.target.value)}
                    placeholder={suggestedReportTitle || "Report title"}
                    style={inputStyle}
                  />
                ) : (
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>Suggested title</strong>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      {suggestedReportTitle || "Choose the learner and reporting period to build the title automatically."}
                    </div>
                    <div>
                      <button
                        type="button"
                        style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                        onClick={() => setShowCustomReportTitle(true)}
                        disabled={submitting}
                      >
                        Edit title
                      </button>
                    </div>
                  </div>
                )}
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
                ) : null}
              </div>

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
                      border: "1px solid #dbeafe",
                      borderRadius: 18,
                      padding: 18,
                      background: "#f8fbff",
                      display: "grid",
                      gap: 16,
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
                            ? `For ${selectedReportLearnerLabel} during ${selectedPeriod.title}.`
                            : `For ${selectedReportLearnerLabel}. Choose the reporting period to line up the draft with the right evidence.`}
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
                          Learner
                        </div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
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
                            marginBottom: 4,
                          }}
                        >
                          Reporting period
                        </div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {selectedPeriod ? selectedPeriod.title : "Not set"}
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
                          Selected portfolio evidence
                        </div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {portfolioItems.length} {portfolioItems.length === 1 ? "note" : "notes"}
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
                          Progress
                        </div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {checklistDoneCount}/{reportChecklist.length} checks complete
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        ...helperCardStyle,
                        background: "#ffffff",
                        borderColor: "#dbeafe",
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>What happens next</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        {nextReportGuidance}
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {nextActionButton}
                        <button
                          type="button"
                          style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                          onClick={openPreview}
                          disabled={submitting}
                        >
                          Jump to preview
                        </button>
                      </div>
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
                      {selectedReport.status === "ready" ? (
                        <Link
                          href={outputsPathBase}
                          style={{
                            ...buttonStyle,
                            background: "#ffffff",
                            color: "#0f172a",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Open My Outputs
                        </Link>
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
                      border: missingReportItems.length ? "1px solid #fcd34d" : "1px solid #bbf7d0",
                      borderRadius: 18,
                      padding: 18,
                      background: missingReportItems.length ? "#fffbeb" : "#f0fdf4",
                      display: "grid",
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>
                        {missingReportItems.length ? "Readiness guide" : "This report is ready for a final review"}
                      </strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        {missingReportItems.length
                          ? "Follow the first unfinished step below. Each one points to the next helpful action."
                          : "The key pieces are in place. Review the preview, then mark the report ready when the wording feels complete."}
                      </p>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      {reportChecklist.map((item) => (
                        <div
                          key={item.key}
                          style={{
                            display: "grid",
                            gap: 10,
                            padding: "12px 14px",
                            borderRadius: 14,
                            background: item.done ? "#ffffff" : "rgba(255,255,255,0.55)",
                            border: item.done ? "1px solid #bbf7d0" : "1px solid rgba(245,158,11,0.35)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
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
                            {renderChecklistAction(item)}
                          </div>
                          <div style={{ color: item.done ? "#166534" : "#92400e", lineHeight: 1.6 }}>
                            {item.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: 18,
                      padding: 18,
                      background: "#f8fbff",
                      display: "grid",
                      gap: 14,
                      marginBottom: 18,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>Choose how to add the next section</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Start with a guided section, write from scratch, or bring in selected portfolio evidence when it helps.
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
                        Write from scratch
                      </button>
                      <button
                        type="button"
                        style={{
                          ...buttonStyle,
                          background: "#ffffff",
                          color: "#0f172a",
                          borderColor: "#cbd5e1",
                        }}
                        onClick={() => setShowEvidencePanel((current) => !current)}
                        disabled={submitting}
                      >
                        {showEvidencePanel ? "Hide selected portfolio evidence" : "Use selected portfolio evidence"}
                      </button>
                    </div>
                  </section>

                  <div
                    style={{
                      display: "grid",
                      gap: 20,
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ display: "grid", gap: 16 }}>
                      <section
                        ref={sectionComposerRef}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: 16,
                          background: "#ffffff",
                          display: "grid",
                          gap: 14,
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
                              {selectedSectionKey ? "Editing this section" : "Section editor"}
                            </strong>
                            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                              {selectedSectionKey
                                ? `You are editing "${sectionHeading || "this section"}". Save when the wording feels right.`
                                : showSectionComposer
                                  ? "Use the heading and writing space below. The report already keeps track of the order for you."
                                  : "The section editor stays tucked away until you choose a section starter, open a section below, or add a portfolio note."}
                            </p>
                          </div>

                          {showSectionComposer ? (
                            <button
                              type="button"
                              style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                              onClick={() => {
                                resetSectionForm();
                                setShowSectionComposer(false);
                              }}
                              disabled={submitting}
                            >
                              Hide editor
                            </button>
                          ) : null}
                        </div>

                        {showSectionComposer ? (
                          <form onSubmit={handleSectionSubmit} style={{ display: "grid", gap: 12 }}>
                            <input
                              value={sectionHeading}
                              onChange={(event) => setSectionHeading(event.target.value)}
                              placeholder="Section heading"
                              style={inputStyle}
                            />

                            <textarea
                              value={sectionContent}
                              onChange={(event) => setSectionContent(event.target.value)}
                              placeholder="Write the section in your own words. Pull in selected portfolio evidence only when it helps the report."
                              style={textAreaStyle}
                            />

                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <button type="submit" style={buttonStyle} disabled={submitting}>
                                {submitting ? "Saving..." : "Save section"}
                              </button>
                              <button
                                type="button"
                                style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                                onClick={() => setShowSectionAdvanced((current) => !current)}
                                disabled={submitting}
                              >
                                {showSectionAdvanced ? "Hide advanced options" : "Show advanced section options"}
                              </button>
                              <button
                                type="button"
                                style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                                onClick={() => {
                                  resetSectionForm();
                                  setShowSectionComposer(false);
                                }}
                                disabled={submitting}
                              >
                                Close editor
                              </button>
                            </div>

                            {showSectionAdvanced ? (
                              <div
                                style={{
                                  ...helperCardStyle,
                                  background: "#ffffff",
                                  borderColor: "#e2e8f0",
                                }}
                              >
                                <strong style={{ color: "#0f172a" }}>Advanced section options</strong>
                                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                  MyLearna fills in the section order automatically. Only change it if you want this section to appear in a different place.
                                </p>
                                <input
                                  type="number"
                                  value={sectionSortOrder}
                                  onChange={(event) => setSectionSortOrder(event.target.value)}
                                  placeholder="Section order"
                                  style={inputStyle}
                                />
                              </div>
                            ) : null}
                          </form>
                        ) : (
                          <div style={helperCardStyle}>
                            <strong style={{ color: "#0f172a" }}>The heavy form is hidden until you need it</strong>
                            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                              Choose a section starter above, open a section from the list below, or add a portfolio note to begin writing.
                            </p>
                          </div>
                        )}
                      </section>

                      <section
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: 16,
                          background: "#ffffff",
                          display: "grid",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "grid", gap: 4 }}>
                            <strong style={{ color: "#0f172a" }}>Sections so far</strong>
                            <div style={{ color: "#475569", lineHeight: 1.6 }}>
                              {sections.length
                                ? `${sections.length} ${sections.length === 1 ? "section is" : "sections are"} already shaping the report.`
                                : "No sections yet. Start with a guided section or write one from scratch."}
                            </div>
                          </div>
                        </div>

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
                                    alignItems: "center",
                                  }}
                                >
                                  <div style={{ display: "grid", gap: 4 }}>
                                    <strong>
                                      Section {section.sortOrder}: {section.heading}
                                    </strong>
                                    <div style={{ color: "#64748b", fontSize: 13 }}>
                                      {section.content.trim() ? "Writing added" : "Heading saved, writing still to add"}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                                    onClick={() => handleEditSection(section)}
                                    disabled={submitting}
                                  >
                                    Edit section
                                  </button>
                                </div>
                                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                  {summarizeSectionContent(section.content)}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </section>
                    </div>

                    <aside
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        padding: 16,
                        display: "grid",
                        gap: 12,
                        background: "#f8fafc",
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
                          <strong style={{ color: "#0f172a" }}>Selected portfolio evidence</strong>
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                            {activePeriod
                              ? `${portfolioItems.length} ${portfolioItems.length === 1 ? "note is" : "notes are"} lined up with ${activePeriod.title}.`
                              : "Choose the reporting period to narrow the selected portfolio evidence for this report."}
                          </p>
                        </div>
                        {portfolioItems.length ? (
                          <button
                            type="button"
                            style={{ ...buttonStyle, background: "#ffffff", color: "#0f172a" }}
                            onClick={() => setShowEvidencePanel((current) => !current)}
                            disabled={submitting}
                          >
                            {showEvidencePanel ? "Hide evidence" : "Show evidence"}
                          </button>
                        ) : null}
                      </div>

                      {showEvidencePanel || !portfolioItems.length ? (
                        <>
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
                        </>
                      ) : (
                        <div style={helperCardStyle}>
                          <strong style={{ color: "#0f172a" }}>Evidence is ready when you need it</strong>
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                            Open this panel when you want to pull a portfolio note into the section editor or copy it into your own wording.
                          </p>
                        </div>
                      )}

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
                ref={reportPreviewRef}
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
