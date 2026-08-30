"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import CleanBrentEvidencePackPreview from "@/app/components/clean/CleanBrentEvidencePackPreview";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import CleanReportPreview from "@/app/components/clean/CleanReportPreview";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import {
  GuidancePageAction,
  GuidanceSetupProgress,
  GuidanceSetupNextAction,
} from "@/app/components/clean/guidance/GuidanceToggle";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
import {
  listAssessmentLearningEvidenceEventsForLearner,
  type LearningEvidenceEvent,
} from "@/lib/clean/evidence/learningEvidenceEvents";
import {
  buildCleanReportPdfFilename,
  generateCleanReportPdfBytes,
  type CleanReportPdfEvidenceItem,
  type CleanReportPdfGenerationMetrics,
} from "@/lib/clean/outputs/pdf";
import {
  createCleanReportExport,
  listCleanReportExports,
} from "@/lib/clean/outputs/client";
import type { CleanReportExport } from "@/lib/clean/outputs/types";
import { listCleanPortfolioItems } from "@/lib/clean/portfolio/client";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
import { buildReportPdfEvidenceItems } from "@/lib/clean/portfolio/evidencePresentation";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type { CleanProgram, CleanProgramSegment } from "@/lib/clean/programs/types";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
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
import {
  BRENT_EMPTY_EVIDENCE_COPY,
  BRENT_OUTPUT_COPY,
  BRENT_OUTPUT_SECONDARY_COPY,
  BRENT_OUTPUT_TITLE,
  isBrentAuthorityTemplateActive,
} from "@/lib/clean/authority/brent";
import {
  listCleanMasterTemplates,
  listCleanTemplateBlocks,
} from "@/lib/clean/templates/client";
import {
  buildBrentEvidencePackModel,
  buildBrentEvidencePackPdfFilename,
  generateBrentEvidencePackPdfBytes,
  type BrentEvidencePackModel,
} from "@/lib/clean/outputs/brentEvidencePackPdf";
import {
  buildCleanWeeklyPlannerEntriesFromCalendarItems,
  buildCleanWeeklyPlannerEntriesFromTemplateBlocks,
  buildCleanWeeklyPlannerPdfFilename,
  generateCleanWeeklyPlannerPdfBytes,
} from "@/lib/clean/outputs/weeklyPlanner";
import {
  buildCleanCoverageRecordPdfFilename,
  buildCurriculumCoveragePdfModel,
  CURRICULUM_COVERAGE_EMPTY_COPY,
  generateCurriculumCoveragePdfBytes,
} from "@/lib/clean/outputs/curriculumCoveragePdf";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(14px, 3vw, 24px) clamp(10px, 3vw, 18px) 40px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#ffffff",
  padding: 18,
  boxShadow: "0 6px 18px rgba(15,23,42,0.04)",
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

function addDays(dateValue: string, dayOffset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setDate(date.getDate() + dayOffset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getWeekStart(dateValue = getTodayDate()) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return getTodayDate();
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
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
  const { user } = useAuthUser();
  const searchParams = useSearchParams();
  const [periods, setPeriods] = useState<CleanReportingPeriod[]>([]);
  const [reports, setReports] = useState<CleanReport[]>([]);
  const [sections, setSections] = useState<CleanReportSection[]>([]);
  const [exportsHistory, setExportsHistory] = useState<CleanReportExport[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<CleanPortfolioItem[]>([]);
  const [assessmentEvidenceEvents, setAssessmentEvidenceEvents] = useState<
    LearningEvidenceEvent[]
  >([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [calendarItems, setCalendarItems] = useState<CleanCalendarItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [exportsLoading, setExportsLoading] = useState(false);
  const [reportContextLoading, setReportContextLoading] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");
  const [dataError, setDataError] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [plannerSubmitting, setPlannerSubmitting] = useState(false);
  const [coverageSubmitting, setCoverageSubmitting] = useState(false);
  const [brentPackSubmittingAction, setBrentPackSubmittingAction] = useState<
    "preview" | "download" | null
  >(null);
  const [brentPackModel, setBrentPackModel] = useState<BrentEvidencePackModel | null>(null);
  const [brentPackLearnerId, setBrentPackLearnerId] = useState<string | null>(null);

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );
  const learnerLabelById = useMemo(
    () => new Map(learnerOptions.map((option) => [option.value, option.label])),
    [learnerOptions],
  );
  const programLabelById = useMemo(
    () => new Map(programs.map((program) => [program.id, program.title])),
    [programs],
  );
  const segmentLabelById = useMemo(
    () => new Map(programSegments.map((segment) => [segment.id, segment.title])),
    [programSegments],
  );
  const calendarItemById = useMemo(
    () => new Map(calendarItems.map((item) => [item.id, item])),
    [calendarItems],
  );
  const requestedLearnerId = searchParams.get("learner_id") || "";
  const requestedReportId =
    searchParams.get("report_id") || searchParams.get("reportId") || "";
  const requestedReportPeriodId =
    searchParams.get("report_period_id") ||
    searchParams.get("reporting_period_id") ||
    searchParams.get("reportPeriodId") ||
    "";
  const requestedReportTitle = searchParams.get("report_title") || "";
  const hasRequestedReportContext = Boolean(
    requestedLearnerId || requestedReportId || requestedReportPeriodId,
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
  const selectedLearner =
    workspace.learners.find((learner) => learner.id === selectedLearnerId) ?? null;
  const coverageLearner = useMemo(() => {
    if (selectedLearner) {
      return selectedLearner;
    }

    const defaultLearnerId = workspace.profile?.defaultLearnerId;
    if (defaultLearnerId) {
      const defaultLearner = workspace.learners.find(
        (learner) => learner.id === defaultLearnerId,
      );
      if (defaultLearner) {
        return defaultLearner;
      }
    }

    return workspace.learners[0] ?? null;
  }, [selectedLearner, workspace.learners, workspace.profile?.defaultLearnerId]);
  const currentWeekStart = useMemo(() => getWeekStart(), []);
  const currentWeekEnd = useMemo(() => addDays(currentWeekStart, 6), [currentWeekStart]);
  const currentWeekLabel = useMemo(
    () => formatDateRange(currentWeekStart, currentWeekEnd),
    [currentWeekEnd, currentWeekStart],
  );
  const brentModeActive = useMemo(
    () => isBrentAuthorityTemplateActive(workspace.profile),
    [workspace.profile],
  );
  const previewEvidenceItems = useMemo<CleanReportPdfEvidenceItem[]>(
    () =>
      buildReportPdfEvidenceItems(portfolioItems, {
        calendarItemById,
        learnerLabelById,
        programLabelById,
        segmentLabelById,
        selectedLearnerLabel,
      }),
    [
      calendarItemById,
      learnerLabelById,
      portfolioItems,
      programLabelById,
      segmentLabelById,
      selectedLearnerLabel,
    ],
  );
  const latestExport = exportsHistory[0] ?? null;
  const outputsNextGuidance = !readyReports.length
    ? draftReports.length
      ? "Finish a draft in My Reports, then mark it ready so it appears here."
      : "Create a report in My Reports and move it through to Ready."
    : selectedReport
      ? latestExport
        ? "Download the PDF when you want a fresh family learning record. Each download adds a new output entry."
        : "Review the report preview, then download the PDF when you are ready to keep this version."
      : "Choose one of the ready reports to review and download.";

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

  const reloadReportContext = useCallback(async () => {
    if (!workspace.profile || !selectedReport) {
      setPortfolioItems([]);
      setAssessmentEvidenceEvents([]);
      setPrograms([]);
      setProgramSegments([]);
      setCalendarItems([]);
      return;
    }

    setReportContextLoading(true);
    setDataError(null);
    try {
      const [
        nextPortfolioItems,
        nextPrograms,
        nextCalendarItems,
        nextAssessmentEvidenceEvents,
      ] = await Promise.all([
        listCleanPortfolioItems(workspace.profile.id, {
          learnerId: selectedReport.learnerId,
          fromDate: selectedPeriod?.startsOn ?? null,
          toDate: selectedPeriod?.endsOn ?? null,
          reportIncludedOnly: true,
          limit: 100,
        }),
        listCleanPrograms(workspace.profile.id, { limit: 60 }),
        listCleanCalendarItems(workspace.profile.id, {
          learnerId: selectedReport.learnerId,
          fromDate: selectedPeriod?.startsOn ?? null,
          toDate: selectedPeriod?.endsOn ?? null,
          limit: 200,
        }),
        listAssessmentLearningEvidenceEventsForLearner(
          workspace.profile.id,
          selectedReport.learnerId,
          {
            fromDate: selectedPeriod?.startsOn ?? null,
            toDate: selectedPeriod?.endsOn ?? null,
            limit: 100,
          },
        ),
      ]);

      const nextProgramSegments = (
        await Promise.all(
          nextPrograms.map((program) =>
            listCleanProgramSegments(workspace.profile!.id, program.id),
          ),
        )
      ).flat();

      setPortfolioItems(nextPortfolioItems);
      setAssessmentEvidenceEvents(nextAssessmentEvidenceEvents);
      setPrograms(nextPrograms);
      setProgramSegments(nextProgramSegments);
      setCalendarItems(nextCalendarItems);
    } catch (error) {
      setDataError(
        normalizeCleanErrorMessage(
          error,
          "We could not load the report evidence and planning details just now.",
        ),
      );
    } finally {
      setReportContextLoading(false);
    }
  }, [selectedPeriod, selectedReport, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setPeriods([]);
      setReports([]);
      setSections([]);
      setExportsHistory([]);
      setPortfolioItems([]);
      setAssessmentEvidenceEvents([]);
      setPrograms([]);
      setProgramSegments([]);
      setCalendarItems([]);
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

    if (
      requestedLearnerId &&
      workspace.learners.some((learner) => learner.id === requestedLearnerId)
    ) {
      setSelectedLearnerId(requestedLearnerId);
      return;
    }

    setSelectedLearnerId((current) => {
      if (current && workspace.learners.some((learner) => learner.id === current)) {
        return current;
      }

      return workspace.profile?.defaultLearnerId || workspace.learners[0]?.id || "";
    });
  }, [requestedLearnerId, workspace.learners, workspace.profile]);

  useEffect(() => {
    setContextError(null);

    if (requestedReportId) {
      const requestedReport = reports.find((report) => report.id === requestedReportId) ?? null;
      if (requestedReport) {
        const learnerMismatch =
          requestedLearnerId && requestedReport.learnerId !== requestedLearnerId;
        const periodMismatch =
          requestedReportPeriodId &&
          requestedReport.reportingPeriodId !== requestedReportPeriodId;

        if (learnerMismatch || periodMismatch) {
          setSelectedReportId("");
          setContextError("We could not open this report. Return to My Reports.");
          return;
        }

        setSelectedLearnerId(requestedReport.learnerId);
        setSelectedReportId(requestedReport.id);
        return;
      }

      if (!catalogLoading && reports.length) {
        setSelectedReportId("");
        setContextError("We could not open this report. Return to My Reports.");
      }
      return;
    }

    if (!readyReports.length) {
      setSelectedReportId("");
      return;
    }

    setSelectedReportId((current) =>
      current && readyReports.some((report) => report.id === current)
        ? current
        : readyReports[0]?.id ?? "",
    );
  }, [
    catalogLoading,
    readyReports,
    reports,
    requestedLearnerId,
    requestedReportId,
    requestedReportPeriodId,
  ]);

  useEffect(() => {
    void reloadSections();
    void reloadExports();
    void reloadReportContext();
  }, [reloadExports, reloadReportContext, reloadSections]);

  useEffect(() => {
    setBrentPackModel(null);
    setBrentPackLearnerId(null);
  }, [selectedLearnerId]);

  useEffect(() => {
    if (brentModeActive) return;
    setBrentPackModel(null);
    setBrentPackLearnerId(null);
  }, [brentModeActive]);

  async function handleDownloadPdf() {
    if (!workspace.profile || !selectedReport || !selectedLearnerLabel) return;

    setSubmitting(true);
    setActionError(null);
    setMessage(null);
    let generationMetrics: CleanReportPdfGenerationMetrics | null = null;

    try {
      const pdfBytes = await generateCleanReportPdfBytes({
        report: selectedReport,
        learnerLabel: selectedLearnerLabel,
        reportingPeriod: selectedPeriod,
        sections,
        evidenceItems: previewEvidenceItems,
        assessmentEvidenceItems: assessmentEvidenceEvents,
        preparedOnLabel: formatDateLabel(new Date().toISOString().slice(0, 10)),
        statusLabel: getReportStatusLabel(selectedReport.status),
      }, {
        onTiming: (metrics: CleanReportPdfGenerationMetrics) => {
          generationMetrics = metrics;
        },
      });
      const filename = buildCleanReportPdfFilename(
        selectedLearnerLabel,
        selectedPeriod?.title || selectedReport.title,
      );

      downloadPdf(pdfBytes, filename);
      trackProductEvent(
        "output_pdf_downloaded",
        {
          area: "my_outputs",
          route: "/my-outputs",
          hasEvidence: previewEvidenceItems.length > 0 || assessmentEvidenceEvents.length > 0,
          learnerCount: selectedReport.learnerId ? 1 : 0,
          surface: "outputs",
          ...(generationMetrics ?? {}),
        },
        user?.id,
      );

      try {
        await createCleanReportExport(workspace.profile.id, {
          reportId: selectedReport.id,
          learnerId: selectedReport.learnerId,
          exportFormat: "pdf",
        });
        setMessage("PDF downloaded. Output history has been updated for this report.");
        await reloadExports();
      } catch (historyError) {
        setMessage("PDF downloaded. We could not update output history this time.");
        setActionError(
          normalizeCleanErrorMessage(
            historyError,
            "We could not update output history for this PDF download.",
          ),
        );
      }
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not create the PDF for this report just now.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadWeeklyPlanner() {
    if (!workspace.profile) return;

    setPlannerSubmitting(true);
    setActionError(null);
    setMessage(null);

    try {
      const [weekItems, nextPrograms, nextTemplates] = await Promise.all([
        listCleanCalendarItems(workspace.profile.id, {
          fromDate: currentWeekStart,
          toDate: currentWeekEnd,
          limit: 100,
        }),
        listCleanPrograms(workspace.profile.id, { limit: 60 }),
        listCleanMasterTemplates(workspace.profile.id, { limit: 20 }),
      ]);

      const nextProgramSegments = (
        await Promise.all(
          nextPrograms.map((program) =>
            listCleanProgramSegments(workspace.profile!.id, program.id),
          ),
        )
      ).flat();

      const learnerLabelById = new Map(
        learnerOptions.map((option) => [option.value, option.label]),
      );
      const programLabelById = new Map(
        nextPrograms.map((program) => [program.id, program.title]),
      );
      const segmentLabelById = new Map(
        nextProgramSegments.map((segment) => [segment.id, segment.title]),
      );

      let entries = buildCleanWeeklyPlannerEntriesFromCalendarItems(weekItems, {
        learnerLabelById,
        programLabelById,
        segmentLabelById,
      });
      let sourceLabel = "Built from this week's live calendar";
      let learnerLabel: string | null = null;

      if (!entries.length) {
        const preferredTemplate =
          nextTemplates.find(
            (template) =>
              template.scopeType === "learner" &&
              template.learnerId &&
              template.learnerId === selectedLearnerId,
          ) ??
          nextTemplates.find((template) => template.scopeType === "family") ??
          nextTemplates[0] ??
          null;

        if (preferredTemplate) {
          const fallbackBlocks = await listCleanTemplateBlocks(
            workspace.profile.id,
            preferredTemplate.id,
          );

          entries = buildCleanWeeklyPlannerEntriesFromTemplateBlocks(
            currentWeekStart,
            fallbackBlocks,
            {
              learnerLabelById,
              programLabelById,
              segmentLabelById,
            },
          );
          sourceLabel = fallbackBlocks.length
            ? "Built from your master week"
            : "Built as an open weekly layout";
          learnerLabel =
            preferredTemplate.scopeType === "learner" && preferredTemplate.learnerId
              ? learnerLabelById.get(preferredTemplate.learnerId) ?? learnerLabel
              : learnerLabel;
        } else {
          sourceLabel = "Built as an open weekly layout";
        }
      }

      const pdfBytes = await generateCleanWeeklyPlannerPdfBytes({
        familyName: workspace.profile.displayName || null,
        learnerLabel,
        weekStartsOn: currentWeekStart,
        weekEndsOn: currentWeekEnd,
        sourceLabel,
        entries,
      });

      downloadPdf(
        pdfBytes,
        buildCleanWeeklyPlannerPdfFilename(currentWeekStart),
      );
      setMessage("Weekly planner downloaded.");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "Could not create the weekly planner. Please try again.",
        ),
      );
    } finally {
      setPlannerSubmitting(false);
    }
  }

  async function handleDownloadCoverageRecord() {
    if (!workspace.profile || !coverageLearner) {
      setActionError("Add a learner before creating this coverage record.");
      setMessage(null);
      return;
    }

    setCoverageSubmitting(true);
    setActionError(null);
    setMessage(null);

    try {
      const evidenceEntries = await listCleanEvidenceEntries(workspace.profile.id, {
        learnerId: coverageLearner.id,
        limit: 300,
      });
      const model = buildCurriculumCoveragePdfModel({
        profile: workspace.profile,
        learner: coverageLearner,
        entries: evidenceEntries,
        generatedOn: new Date().toISOString().slice(0, 10),
      });
      const pdfBytes = await generateCurriculumCoveragePdfBytes(model);

      downloadPdf(
        pdfBytes,
        buildCleanCoverageRecordPdfFilename(model.learnerName, new Date().getFullYear()),
      );
      setMessage(
        model.coverageSummary.hasLinkedEvidence
          ? "Curriculum coverage record downloaded."
          : CURRICULUM_COVERAGE_EMPTY_COPY,
      );
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "Could not create the curriculum coverage record. Please try again.",
        ),
      );
    } finally {
      setCoverageSubmitting(false);
    }
  }

  async function loadBrentEvidencePackModel() {
    if (!workspace.profile || !selectedLearner) {
      throw new Error("Add learner details before creating this pack.");
    }

    if (brentPackModel && brentPackLearnerId === selectedLearner.id) {
      return brentPackModel;
    }

    const learnerReports = reports.filter((report) => report.learnerId === selectedLearner.id);
    const sourceReport =
      selectedReport && selectedReport.learnerId === selectedLearner.id
        ? selectedReport
        : learnerReports[0] ?? null;
    const learnerPeriods = periods.filter((period) => period.learnerId === selectedLearner.id);
    const sourcePeriod = sourceReport
      ? learnerPeriods.find((period) => period.id === sourceReport.reportingPeriodId) ?? null
      : learnerPeriods[0] ?? null;
    const sourceSections =
      sourceReport && selectedReport && sourceReport.id === selectedReport.id
        ? sections
        : sourceReport
          ? await listCleanReportSections(workspace.profile.id, sourceReport.id)
          : [];

    const [nextPortfolioItems, nextPrograms, nextCalendarItems] = await Promise.all([
      listCleanPortfolioItems(workspace.profile.id, {
        learnerId: selectedLearner.id,
        fromDate: sourcePeriod?.startsOn ?? null,
        toDate: sourcePeriod?.endsOn ?? null,
        limit: 160,
      }),
      listCleanPrograms(workspace.profile.id, { limit: 60 }),
      listCleanCalendarItems(workspace.profile.id, {
        learnerId: selectedLearner.id,
        fromDate: sourcePeriod?.startsOn ?? null,
        toDate: sourcePeriod?.endsOn ?? null,
        limit: 240,
      }),
    ]);

    const nextProgramSegments = (
      await Promise.all(
        nextPrograms.map((program) =>
          listCleanProgramSegments(workspace.profile!.id, program.id),
        ),
      )
    ).flat();

    const model = buildBrentEvidencePackModel({
      profile: workspace.profile,
      learner: selectedLearner,
      reportingPeriods: learnerPeriods,
      sourceReport,
      sourceReportSections: sourceSections,
      portfolioItems: nextPortfolioItems,
      calendarItems: nextCalendarItems,
      learnerLabelById,
      programLabelById: new Map(nextPrograms.map((program) => [program.id, program.title])),
      segmentLabelById: new Map(
        nextProgramSegments.map((segment) => [segment.id, segment.title]),
      ),
      generatedOn: new Date().toISOString().slice(0, 10),
    });

    setBrentPackModel(model);
    setBrentPackLearnerId(selectedLearner.id);
    return model;
  }

  async function handlePreviewBrentPack() {
    setBrentPackSubmittingAction("preview");
    setActionError(null);
    setMessage(null);

    try {
      const model = await loadBrentEvidencePackModel();
      if (!selectedLearner) return;
      setMessage(
        model.hasEvidence ? "Brent pack preview ready." : BRENT_EMPTY_EVIDENCE_COPY,
      );
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "Could not create the Brent evidence pack. Please try again.",
        ),
      );
    } finally {
      setBrentPackSubmittingAction(null);
    }
  }

  async function handleDownloadBrentPack() {
    setBrentPackSubmittingAction("download");
    setActionError(null);
    setMessage(null);

    try {
      const model = await loadBrentEvidencePackModel();
      const pdfBytes = await generateBrentEvidencePackPdfBytes(model);
      downloadPdf(
        pdfBytes,
        buildBrentEvidencePackPdfFilename(model.learnerName, model.generatedOnLabel),
      );
      setMessage("Brent evidence pack downloaded.");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "Could not create the Brent evidence pack. Please try again.",
        ),
      );
    } finally {
      setBrentPackSubmittingAction(null);
    }
  }

  const readyForOutputs =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <style jsx global>{`
          @media (max-width: 640px) {
            .mylearna-outputs-intro {
              padding: 18px !important;
            }

            .mylearna-outputs-intro p {
              display: none !important;
            }

            .mylearna-outputs-advanced-export,
            .mylearna-outputs-report-picker-copy,
            .mylearna-outputs-summary-metrics,
            .mylearna-outputs-next-guidance {
              display: none !important;
            }

            .mylearna-outputs-actions {
              display: grid !important;
              grid-template-columns: 1fr !important;
            }

            .mylearna-outputs-actions button {
              min-height: 44px !important;
            }
          }
        `}</style>
        <CleanWorkflowRibbon />
        <CleanFirstRunSetupGate currentStep="outputs" />
        <GuidanceSetupProgress
          stepId="outputs"
          title="Prepare and download outputs."
          body="This is where ready records can become downloadable outputs and PDFs."
        />

        <CleanPageIntroVideo
          config={PAGE_INTRO_VIDEOS.myOutputs}
          promptTitle="New to My Outputs?"
          promptDescription="Watch a quick guide to see how to preview and download records, reports and portfolio summaries."
        />

        <section className="mylearna-outputs-intro" data-guidance-id="outputs-download-share" style={cardStyle}>
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
              Download history and advanced exports live here. Most learning records can now be downloaded from Portfolio or Reports.
            </p>
            <div>
              <GuidancePageAction tourId="my-outputs" />
            </div>
            <GuidanceSetupNextAction
              stepId="outputs"
              label="Finish setup"
              helperText="You have reached the output stage. Finish setup when you are ready to use MyLearna normally."
              finish
            />
          </div>
        </section>

        {workspace.loading ? (
          <V2LoadingState
            title="Preparing outputs"
            body="We are loading ready reports, exports, and learning records."
          />
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              Exports are temporarily unavailable. Try again shortly.
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

        {readyForOutputs && workspace.profile && brentModeActive ? (
          <>
            <section className="mylearna-outputs-advanced-export" style={cardStyle}>
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: "#0f172a" }}>{BRENT_OUTPUT_TITLE}</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  {BRENT_OUTPUT_COPY}
                </p>
                <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                  {BRENT_OUTPUT_SECONDARY_COPY}
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 16,
                  padding: 16,
                  background: "#f8fbff",
                  display: "grid",
                  gap: 10,
                }}
              >
                {selectedLearner ? (
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Preparing this pack for <strong style={{ color: "#0f172a" }}>{getLearnerLabel(selectedLearner.firstName, selectedLearner.preferredName)}</strong>.
                  </div>
                ) : (
                  <div style={{ color: "#92400e", lineHeight: 1.6 }}>
                    Add learner details before creating this pack.
                  </div>
                )}

                {brentPackModel && !brentPackModel.hasEvidence ? (
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {BRENT_EMPTY_EVIDENCE_COPY}
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => void handlePreviewBrentPack()}
                    disabled={!selectedLearner || brentPackSubmittingAction !== null}
                  >
                    {brentPackSubmittingAction === "preview"
                      ? "Preparing preview..."
                      : "Preview Brent pack"}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...buttonStyle,
                      background: "#ffffff",
                      color: "#0f172a",
                    }}
                    onClick={() => void handleDownloadBrentPack()}
                    disabled={!selectedLearner || brentPackSubmittingAction !== null}
                  >
                    {brentPackSubmittingAction === "download"
                      ? "Preparing pack..."
                      : "Download Brent evidence pack"}
                  </button>
                </div>
              </div>
            </section>

            {brentPackModel ? (
              <CleanBrentEvidencePackPreview model={brentPackModel} />
            ) : null}
          </>
        ) : null}

        {readyForOutputs && !workspace.learners.length ? (
            <section className="mylearna-outputs-advanced-export" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
              <p style={{ margin: 0, color: "#475569" }}>
              Add a learner before previewing or downloading report PDFs.
              </p>
            </section>
          ) : null}

        {readyForOutputs && workspace.profile && workspace.learners.length ? (
          <>
            {contextError ? (
              <section
                style={{
                  ...cardStyle,
                  borderColor: "#fecdd3",
                  background: "#fff1f2",
                }}
              >
                <h2 style={{ marginTop: 0, color: "#9f1239" }}>Report not found</h2>
                <p style={{ margin: 0, color: "#9f1239", lineHeight: 1.6 }}>
                  {contextError}
                </p>
              </section>
            ) : null}

            {hasRequestedReportContext ? (
              <section
                style={{
                  ...cardStyle,
                  borderColor: "#dbeafe",
                  background: "#f8fbff",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "#1d4ed8",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Report context
                </div>
                <h2 style={{ margin: 0, color: "#0f172a" }}>
                  {selectedReport?.title || requestedReportTitle || "Selected report"}
                </h2>
                <div style={{ color: "#475569", lineHeight: 1.6, marginTop: 8 }}>
                  Learner:{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {selectedLearnerLabel ||
                      learnerLabelById.get(requestedLearnerId) ||
                      "Loading learner"}
                  </strong>
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Report period:{" "}
                  <strong style={{ color: "#0f172a" }}>
                    {selectedPeriod?.title || "Loading report period"}
                  </strong>
                  {selectedPeriod
                    ? ` - ${formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)}`
                    : ""}
                </div>
              </section>
            ) : null}

            {!hasRequestedReportContext ? (
              <>
            <section className="mylearna-outputs-advanced-export" style={cardStyle}>
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: "#0f172a" }}>Curriculum Coverage Record</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  Export a curriculum coverage record showing learning areas, evidence links, and areas to revisit.
                </p>
                <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                  This uses evidence links from My Learna and your selected framework from My Settings.
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 16,
                  padding: 16,
                  background: "#f8fbff",
                  display: "grid",
                  gap: 10,
                }}
              >
                {coverageLearner ? (
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Preparing this record for{" "}
                    <strong style={{ color: "#0f172a" }}>
                      {getLearnerLabel(
                        coverageLearner.firstName,
                        coverageLearner.preferredName,
                      )}
                    </strong>
                    .
                  </div>
                ) : (
                  <div style={{ color: "#92400e", lineHeight: 1.6 }}>
                    Add a learner before creating this coverage record.
                  </div>
                )}

                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  Still available even if evidence is just beginning.
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => void handleDownloadCoverageRecord()}
                    disabled={!coverageLearner || coverageSubmitting}
                  >
                    {coverageSubmitting
                      ? "Preparing record..."
                      : "Download coverage record"}
                  </button>
                </div>
              </div>
            </section>

            <section className="mylearna-outputs-advanced-export" style={cardStyle}>
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: "#0f172a" }}>Calendar outputs</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  Print a simple weekly homeschool plan for your fridge, wall, or family noticeboard.
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: 16,
                  padding: 16,
                  background: "#f8fbff",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <strong style={{ color: "#0f172a", fontSize: 20 }}>
                    Weekly Fridge Planner
                  </strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    Print this week&apos;s homeschool rhythm for your fridge, wall, or family noticeboard.
                  </div>
                </div>

                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  Current week: {currentWeekLabel}
                </div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  Uses your live week first, then your master week if the live week is still empty.
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => void handleDownloadWeeklyPlanner()}
                    disabled={plannerSubmitting}
                  >
                    {plannerSubmitting ? "Preparing planner..." : "Download weekly planner"}
                  </button>
                </div>
              </div>
            </section>
              </>
            ) : null}

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                <h2 style={{ margin: 0, color: "#0f172a" }}>Choose a ready report</h2>
                <p className="mylearna-outputs-report-picker-copy" style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  Only reports marked ready appear as output candidates. Draft and archived reports stay visible below so you know what still needs attention.
                </p>
              </div>

              <div
                className="mylearna-outputs-summary-metrics"
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <select
                  value={selectedLearnerId}
                  onChange={(event) => {
                    setContextError(null);
                    setSelectedLearnerId(event.target.value);
                    setSelectedReportId("");
                  }}
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
                  onChange={(event) => {
                    setContextError(null);
                    const nextReportId = event.target.value;
                    const nextReport = reports.find((report) => report.id === nextReportId);
                    if (nextReport) {
                      setSelectedLearnerId(nextReport.learnerId);
                    }
                    setSelectedReportId(nextReportId);
                  }}
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
                    Reports ready for PDF download
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
                className="mylearna-outputs-next-guidance"
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
                className="mylearna-outputs-actions"
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
                    void reloadReportContext();
                  }}
                  disabled={
                    catalogLoading ||
                    sectionsLoading ||
                    exportsLoading ||
                    reportContextLoading ||
                    submitting
                  }
                >
                  {catalogLoading || sectionsLoading || exportsLoading || reportContextLoading
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
                  onClick={() => void handleDownloadPdf()}
                  disabled={!selectedReport || submitting}
                >
                  {submitting ? "Preparing PDF..." : "Download PDF"}
                </button>
              </div>

              <p style={{ margin: "12px 0 0", color: "#475569" }}>
                Downloading the PDF also records an output entry for this ready report.
                The file stays in your browser download flow.
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
                  Select a ready report to review it and download the PDF.
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
                          Ready to download as a PDF
                        </span>
                      </div>
                      <div style={{ color: "#166534", lineHeight: 1.6 }}>
                        Review the report below, then download the PDF when you are satisfied with this version.
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
                          : "No PDF download records yet for this report."}
                      </div>
                    </div>
                  </div>
                </section>

                {reportContextLoading ? (
                  <section style={cardStyle}>
                    <p style={{ margin: 0, color: "#475569" }}>
                      Loading the selected evidence and planning details for this PDF...
                    </p>
                  </section>
                ) : null}

                <CleanReportPreview
                  report={selectedReport}
                  learnerLabel={selectedLearnerLabel}
                  reportingPeriod={selectedPeriod}
                  sections={sections}
                  evidenceItems={previewEvidenceItems}
                  assessmentEvidenceItems={assessmentEvidenceEvents}
                />

                <section style={cardStyle}>
                  <h2 style={{ marginTop: 0, color: "#0f172a" }}>Output history</h2>
                  <p style={{ marginTop: 0, color: "#475569" }}>
                    Each entry shows when a PDF was downloaded for this ready report.
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
                            {entry.exportFormat.toUpperCase()} download record
                          </strong>
                          <span style={{ color: "#475569" }}>
                            Recorded {formatTimestamp(entry.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#475569" }}>
                      No PDF download records for this report yet.
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
  return <CleanOutputsWorkspaceBody />;
}
