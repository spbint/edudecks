"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import EvidenceThumbnail from "@/app/components/clean/evidence/EvidenceThumbnail";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import {
  GuidancePageAction,
  GuidanceSetupProgress,
  GuidanceSetupNextAction,
} from "@/app/components/clean/guidance/GuidanceToggle";
import { listCleanPortfolioItems } from "@/lib/clean/portfolio/client";
import {
  buildReportPdfEvidenceItems,
  getParentFacingEvidenceSummary,
  getEvidencePresentationMeta,
  getEvidencePreviewImage,
} from "@/lib/clean/portfolio/evidencePresentation";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
import {
  listAssessmentLearningEvidenceEventsForLearner,
  type LearningEvidenceEvent,
} from "@/lib/clean/evidence/learningEvidenceEvents";
import {
  createCleanReport,
  createCleanReportingPeriod,
  deleteCleanReport,
  listCleanReports,
  listCleanReportSections,
  listCleanReportingPeriods,
  updateCleanReport,
  updateCleanReportingPeriod,
} from "@/lib/clean/reports/client";
import type {
  CleanReport,
  CleanReportSection,
  CleanReportStatus,
  CleanReportingPeriod,
} from "@/lib/clean/reports/types";
import { parseAssessmentEvidenceLinkFromNodeIds } from "@/lib/clean/assessments/client";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import { isBrentAuthorityTemplateActive } from "@/lib/clean/authority/brent";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import { listCleanLearningPeriods } from "@/lib/clean/terms/client";
import type { CleanLearningPeriod } from "@/lib/clean/terms/types";
import {
  buildCleanReportPdfFilename,
  generateCleanReportPdfBytes,
} from "@/lib/clean/outputs/pdf";
import { createCleanReportExport } from "@/lib/clean/outputs/client";

type PendingReportAction =
  | { type: "archive"; report: CleanReport }
  | { type: "delete"; report: CleanReport };

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(18px, 4vw, 32px) clamp(12px, 4vw, 20px) 48px",
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

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 6,
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

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#0f172a",
};

const quietButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  background: "#f8fafc",
  borderColor: "#cbd5e1",
  color: "#475569",
  fontWeight: 600,
};

const successButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#166534",
  borderColor: "#166534",
};

const destructiveButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#b91c1c",
  borderColor: "#b91c1c",
};

type CompletionTone = "complete" | "in-progress" | "incomplete" | "locked";

type CompletionRowProps = {
  tone: CompletionTone;
  text: string;
};

type ReportBuildStepCardProps = {
  stepNumber: number;
  title: string;
  helperText: string;
  completionTone: CompletionTone;
  completionText: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  children?: React.ReactNode;
  emphasis?: boolean;
};

type ReportPeriodMode = "current" | "custom";

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

function formatDateRange(startsOn: string, endsOn: string) {
  return `${formatDateLabel(startsOn)} to ${formatDateLabel(endsOn)}`;
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

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function isDateWithinRange(dateValue: string, startsOn: string, endsOn: string) {
  return dateValue >= startsOn && dateValue <= endsOn;
}

function rangesOverlap(
  leftStartsOn: string,
  leftEndsOn: string,
  rightStartsOn: string,
  rightEndsOn: string,
) {
  return leftStartsOn <= rightEndsOn && leftEndsOn >= rightStartsOn;
}

function findSuggestedLearningPeriod(
  learningPeriods: CleanLearningPeriod[],
  todayDate: string,
) {
  const activePeriod =
    learningPeriods.find(
      (period) =>
        !period.isBreak && isDateWithinRange(todayDate, period.startsOn, period.endsOn),
    ) ?? null;

  if (activePeriod) return activePeriod;

  const nextPeriod =
    learningPeriods.find((period) => !period.isBreak && period.startsOn >= todayDate) ?? null;

  if (nextPeriod) return nextPeriod;

  return (
    [...learningPeriods]
      .filter((period) => !period.isBreak)
      .sort((left, right) => right.endsOn.localeCompare(left.endsOn))[0] ?? null
  );
}

function findDefaultReportingPeriod(
  periods: CleanReportingPeriod[],
  learningPeriod: CleanLearningPeriod | null,
  todayDate: string,
) {
  if (!periods.length) return null;

  if (learningPeriod) {
    const overlappingPeriods = periods.filter((period) =>
      rangesOverlap(
        period.startsOn,
        period.endsOn,
        learningPeriod.startsOn,
        learningPeriod.endsOn,
      ),
    );

    const activeOverlap =
      overlappingPeriods.find((period) =>
        isDateWithinRange(todayDate, period.startsOn, period.endsOn),
      ) ?? null;

    if (activeOverlap) return activeOverlap;

    const titleMatch =
      overlappingPeriods.find(
        (period) =>
          period.title.trim().toLowerCase() === learningPeriod.title.trim().toLowerCase(),
      ) ?? null;

    if (titleMatch) return titleMatch;

    if (overlappingPeriods.length) {
      return [...overlappingPeriods].sort((left, right) =>
        right.endsOn.localeCompare(left.endsOn),
      )[0];
    }
  }

  const currentPeriod =
    periods.find((period) => isDateWithinRange(todayDate, period.startsOn, period.endsOn)) ?? null;

  if (currentPeriod) return currentPeriod;

  return [...periods].sort((left, right) => right.endsOn.localeCompare(left.endsOn))[0] ?? null;
}

function buildSuggestedReportingPeriodDraft(
  learningPeriod: CleanLearningPeriod | null,
  todayDate: string,
) {
  if (learningPeriod) {
    return {
      title: learningPeriod.title || "Current learning period",
      startsOn: learningPeriod.startsOn,
      endsOn: learningPeriod.endsOn,
    };
  }

  const currentYear = todayDate.slice(0, 4);

  return {
    title: "Current learning year",
    startsOn: `${currentYear}-01-01`,
    endsOn: `${currentYear}-12-31`,
  };
}

function portfolioEvidenceTitle(item: CleanPortfolioItem) {
  return item.evidence.title || item.evidence.whatHappened;
}

function summarizeEvidence(item: CleanPortfolioItem) {
  const text = getParentFacingEvidenceSummary(item).trim();
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).trimEnd()}...`;
}

type PathwayStepEvidenceMeta = {
  key: string;
  label: string;
  assessmentConfidence: string | null;
  observedSkillStatus: string | null;
};

function getPathwayStepEvidenceMeta(item: CleanPortfolioItem): PathwayStepEvidenceMeta | null {
  const context = parsePathwayContextFromNodeIds(item.evidence.curriculumNodeIds);
  if (!context?.stepNumber || !context.stepTitle) return null;
  const assessmentLink = parseAssessmentEvidenceLinkFromNodeIds(item.evidence.curriculumNodeIds);

  return {
    key:
      [
        item.evidence.learnerId,
        context.pathwayStepId,
      ]
        .filter(Boolean)
        .join("::") ||
      [
        item.evidence.learnerId,
        context.pathwayKey || context.pathwayLabel || "pathway",
        context.stageKey || context.stageLabel || "stage",
        context.stepNumber,
      ].join("::"),
    label: `Step ${context.stepNumber} - ${context.stepTitle}`,
    assessmentConfidence: assessmentLink?.assessmentStatus || null,
    observedSkillStatus: context.observedSkillStatus || null,
  };
}

function buildDefaultReportTitle(learnerLabel: string, periodTitle: string) {
  if (learnerLabel && periodTitle) return `${learnerLabel} - ${periodTitle} report`;
  if (periodTitle) return `${periodTitle} report`;
  if (learnerLabel) return `${learnerLabel} report`;
  return "Learning report";
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

function completionToneStyles(tone: CompletionTone): React.CSSProperties {
  if (tone === "complete") {
    return {
      border: "1px solid #bbf7d0",
      background: "#f0fdf4",
      color: "#166534",
    };
  }

  if (tone === "in-progress") {
    return {
      border: "1px solid #bfdbfe",
      background: "#eff6ff",
      color: "#1d4ed8",
    };
  }

  if (tone === "locked") {
    return {
      border: "1px solid #cbd5e1",
      background: "#f8fafc",
      color: "#64748b",
    };
  }

  return {
    border: "1px solid #fcd34d",
    background: "#fffbeb",
    color: "#92400e",
  };
}

function completionToneIcon(tone: CompletionTone) {
  if (tone === "complete") return "✔";
  if (tone === "in-progress") return "●";
  return "○";
}

function CompletionRow({ tone, text }: CompletionRowProps) {
  return (
    <div
      style={{
        ...completionToneStyles(tone),
        borderRadius: 14,
        padding: "12px 14px",
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
          border: "1px solid currentColor",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 900,
          flexShrink: 0,
        }}
      >
        {completionToneIcon(tone)}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

function ReportBuildStepCard({
  stepNumber,
  title,
  helperText,
  completionTone,
  completionText,
  action,
  secondaryAction,
  children,
  emphasis = false,
}: ReportBuildStepCardProps) {
  return (
    <section
      style={{
        ...cardStyle,
        borderColor: emphasis ? "#bfdbfe" : "#e2e8f0",
        background: emphasis
          ? "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)"
          : "#ffffff",
        display: "grid",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                minWidth: 28,
                height: 28,
                borderRadius: 999,
                background: "#eff6ff",
                color: "#1d4ed8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
              }}
            >
              {stepNumber}
            </span>
            Step {stepNumber}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>{title}</h2>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{helperText}</p>
          </div>
        </div>

        {(action || secondaryAction) ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {action}
            {secondaryAction}
          </div>
        ) : null}
      </div>

      {children}

      <CompletionRow tone={completionTone} text={completionText} />
    </section>
  );
}

function CleanReportsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [periods, setPeriods] = useState<CleanReportingPeriod[]>([]);
  const [reports, setReports] = useState<CleanReport[]>([]);
  const [sections, setSections] = useState<CleanReportSection[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<CleanPortfolioItem[]>([]);
  const [assessmentEvidenceEvents, setAssessmentEvidenceEvents] = useState<
    LearningEvidenceEvent[]
  >([]);
  const [learningPeriods, setLearningPeriods] = useState<CleanLearningPeriod[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showCustomReportTitle, setShowCustomReportTitle] = useState(false);
  const [showOtherReports, setShowOtherReports] = useState(false);

  const [reportLearnerId, setReportLearnerId] = useState("");
  const [reportingPeriodId, setReportingPeriodId] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportPeriodMode, setReportPeriodMode] = useState<ReportPeriodMode>("current");
  const [customPeriodStartsOn, setCustomPeriodStartsOn] = useState("");
  const [customPeriodEndsOn, setCustomPeriodEndsOn] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [pendingReportAction, setPendingReportAction] = useState<PendingReportAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const activeReportRef = useRef<HTMLDivElement>(null);
  const reportSetupRef = useRef<HTMLDivElement>(null);
  const reportPreviewRef = useRef<HTMLDivElement>(null);
  const evidenceEntryIdFromQuery = searchParams.get("evidence_entry_id") ?? "";
  const learnerIdFromQuery = searchParams.get("learner_id") ?? "";
  const portfolioPathBase = pathname.startsWith("/clean-my-reports")
    ? "/clean-my-portfolio"
    : "/my-portfolio";
  const outputsPathBase = pathname.startsWith("/clean-my-reports")
    ? "/clean-my-outputs"
    : "/my-outputs";
  const buildOutputsHref = useCallback(
    (report: CleanReport | null | undefined) => {
      if (!report) return outputsPathBase;
      const params = new URLSearchParams();
      params.set("learner_id", report.learnerId);
      params.set("report_id", report.id);
      params.set("report_period_id", report.reportingPeriodId);
      params.set("report_title", report.title);
      return `${outputsPathBase}?${params.toString()}`;
    },
    [outputsPathBase],
  );
  const readyForReports =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const brentModeActive = useMemo(
    () => isBrentAuthorityTemplateActive(workspace.profile),
    [workspace.profile],
  );

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
  const todayDate = useMemo(() => getTodayDate(), []);

  const filteredPeriodsForReport = useMemo(() => {
    if (!reportLearnerId) return periods;
    return periods.filter((period) => period.learnerId === reportLearnerId);
  }, [periods, reportLearnerId]);

  const suggestedLearningPeriod = useMemo(
    () => findSuggestedLearningPeriod(learningPeriods, todayDate),
    [learningPeriods, todayDate],
  );
  const defaultReportingPeriodForReport = useMemo(
    () =>
      findDefaultReportingPeriod(
        filteredPeriodsForReport,
        suggestedLearningPeriod,
        todayDate,
      ),
    [filteredPeriodsForReport, suggestedLearningPeriod, todayDate],
  );
  const suggestedReportingPeriodDraft = useMemo(
    () => buildSuggestedReportingPeriodDraft(suggestedLearningPeriod, todayDate),
    [suggestedLearningPeriod, todayDate],
  );

  const activeLearnerId = selectedReport?.learnerId || reportLearnerId || "";
  const activePeriod =
    selectedPeriod ||
    (!selectedReport
      ? filteredPeriodsForReport.find((period) => period.id === reportingPeriodId) ||
        defaultReportingPeriodForReport
      : null) ||
    null;
  const selectedReportLearnerLabel =
    learnerOptions.find((option) => option.value === selectedReport?.learnerId)?.label ||
    "Unknown learner";
  const draftReportLearnerLabel =
    learnerOptions.find((option) => option.value === reportLearnerId)?.label || "";
  const focusedPortfolioItems = useMemo(() => {
    if (!portfolioItems.length) return portfolioItems;
    if (!evidenceEntryIdFromQuery) return portfolioItems;

    return [...portfolioItems].sort((left, right) => {
      const leftFocused = left.evidence.id === evidenceEntryIdFromQuery ? 1 : 0;
      const rightFocused = right.evidence.id === evidenceEntryIdFromQuery ? 1 : 0;
      return rightFocused - leftFocused;
    });
  }, [evidenceEntryIdFromQuery, portfolioItems]);
  const selectedPathwayEvidenceSummary = useMemo(() => {
    const stepByEvidenceId = new Map<string, PathwayStepEvidenceMeta>();
    const repeatedStepsByKey = new Map<string, { label: string; count: number }>();

    for (const item of portfolioItems) {
      const meta = getPathwayStepEvidenceMeta(item);
      if (!meta) continue;

      stepByEvidenceId.set(item.evidence.id, meta);
      const current = repeatedStepsByKey.get(meta.key);
      repeatedStepsByKey.set(meta.key, {
        label: meta.label,
        count: current ? current.count + 1 : 1,
      });
    }

    const repeatedSteps = [...repeatedStepsByKey.values()].filter((step) => step.count > 1);

    return {
      stepByEvidenceId,
      repeatedStepsByKey,
      repeatedSteps,
    };
  }, [portfolioItems]);
  const reportPdfEvidenceItems = useMemo(
    () =>
      buildReportPdfEvidenceItems(portfolioItems, {
        calendarItemById: new Map(),
        learnerLabelById: new Map(
          learnerOptions.map((option) => [option.value, option.label]),
        ),
        programLabelById: new Map(),
        segmentLabelById: new Map(),
        selectedLearnerLabel: selectedReportLearnerLabel,
      }),
    [learnerOptions, portfolioItems, selectedReportLearnerLabel],
  );
  const suggestedReportTitle = useMemo(
    () =>
      buildDefaultReportTitle(
        draftReportLearnerLabel,
        activePeriod?.title || suggestedReportingPeriodDraft.title,
      ),
    [activePeriod?.title, draftReportLearnerLabel, suggestedReportingPeriodDraft.title],
  );
  const currentLearningYearSummary = useMemo(() => {
    if (!reportLearnerId && selectedPeriod) {
      return {
        title: selectedPeriod.title,
        startsOn: selectedPeriod.startsOn,
        endsOn: selectedPeriod.endsOn,
        isExisting: true,
      };
    }

    const selectedDraftPeriod =
      filteredPeriodsForReport.find((period) => period.id === reportingPeriodId) ||
      (!editingReportId ? defaultReportingPeriodForReport : null);

    if (selectedDraftPeriod) {
      return {
        title: selectedDraftPeriod.title,
        startsOn: selectedDraftPeriod.startsOn,
        endsOn: selectedDraftPeriod.endsOn,
        isExisting: true,
      };
    }

    if (reportLearnerId) {
      return {
        title: suggestedReportingPeriodDraft.title,
        startsOn: suggestedReportingPeriodDraft.startsOn,
        endsOn: suggestedReportingPeriodDraft.endsOn,
        isExisting: false,
      };
    }

    return null;
  }, [
    defaultReportingPeriodForReport,
    editingReportId,
    filteredPeriodsForReport,
    reportLearnerId,
    reportingPeriodId,
    selectedPeriod,
    suggestedReportingPeriodDraft.endsOn,
    suggestedReportingPeriodDraft.startsOn,
    suggestedReportingPeriodDraft.title,
  ]);
  const otherReports = useMemo(
    () => reports.filter((report) => report.id !== selectedReport?.id),
    [reports, selectedReport?.id],
  );
  const currentLearningYearReport = useMemo(() => {
    if (!reportLearnerId || !defaultReportingPeriodForReport) return null;

    return (
      reports.find(
        (report) =>
          report.learnerId === reportLearnerId &&
          report.reportingPeriodId === defaultReportingPeriodForReport.id,
      ) ?? null
    );
  }, [defaultReportingPeriodForReport, reportLearnerId, reports]);
  const reportCanPreview = Boolean(selectedReport && selectedPeriod);
  const reportCanMoveToOutput = Boolean(selectedReport && selectedPeriod);
  const nextReportGuidance = useMemo(() => {
    if (!selectedReport) {
      return "Choose the learner and report period, then review the evidence for this report.";
    }

    if (selectedReport.status === "archived") {
      return "This report is archived. Return it to draft when you want to review it again.";
    }

    if (selectedReport.status === "ready") {
      return "This learning record is ready to download.";
    }

    if (!selectedPeriod) {
      return "Check the learner and report period so the learning record lines up correctly.";
    }

    if (!portfolioItems.length) {
      return "Preview the prepared learning record. If you need more evidence later, return to My Portfolio and choose stronger highlights first.";
    }

    return "Preview the prepared learning record, then download the PDF when you are ready.";
  }, [
    portfolioItems.length,
    selectedPeriod,
    selectedReport,
  ]);

  const scrollToRef = useCallback((target: React.RefObject<HTMLDivElement | null>) => {
    target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openReportBuilder = useCallback(() => {
    if (selectedReport && !editingReportId) {
      setReportLearnerId(selectedReport.learnerId);
      setReportingPeriodId(selectedReport.reportingPeriodId);
      setReportTitle(selectedReport.title);
      setShowCustomReportTitle(false);
    }
    setShowReportBuilder(true);
    window.requestAnimationFrame(() => {
      scrollToRef(reportSetupRef);
    });
  }, [editingReportId, scrollToRef, selectedReport]);

  const openPreview = useCallback(() => {
    window.requestAnimationFrame(() => {
      scrollToRef(reportPreviewRef);
    });
  }, [scrollToRef]);

  const reloadPeriods = useCallback(async () => {
    if (!workspace.profile) return;

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
          "We could not load the learning year details just now.",
        ),
      );
    }
  }, [workspace.profile]);

  const reloadLearningPeriods = useCallback(async () => {
    if (!workspace.profile) return;

    try {
      const nextLearningPeriods = await listCleanLearningPeriods(workspace.profile.id, {
        limit: 100,
      });
      setLearningPeriods(nextLearningPeriods);
    } catch {
      setLearningPeriods([]);
    }
  }, [workspace.profile]);

  const reloadReports = useCallback(async () => {
    if (!workspace.profile) return;

    setDataError(null);
    try {
      const nextReports = await listCleanReports(workspace.profile.id, {
        limit: 50,
      });
      setReports(nextReports);
      setSelectedReportId((current) =>
        current && nextReports.some((report) => report.id === current)
          ? current
          : null,
      );
    } catch (error) {
      setDataError(
        normalizeCleanErrorMessage(
          error,
          "We could not load the reports just now.",
        ),
      );
    }
  }, [workspace.profile]);

  const reloadSections = useCallback(async () => {
    if (!workspace.profile || !selectedReportId) {
      setSections([]);
      return;
    }

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
    }
  }, [selectedReportId, workspace.profile]);

  const reloadPortfolioItems = useCallback(async () => {
    if (!workspace.profile || !activeLearnerId) {
      setPortfolioItems([]);
      setAssessmentEvidenceEvents([]);
      setPortfolioError(null);
      return;
    }

    setPortfolioLoading(true);
    setPortfolioError(null);

    try {
      const [nextItems, nextAssessmentEvidenceEvents] = await Promise.all([
        listCleanPortfolioItems(workspace.profile.id, {
          learnerId: activeLearnerId,
          fromDate: activePeriod?.startsOn ?? null,
          toDate: activePeriod?.endsOn ?? null,
          reportIncludedOnly: true,
          limit: 100,
        }),
        listAssessmentLearningEvidenceEventsForLearner(
          workspace.profile.id,
          activeLearnerId,
          {
            fromDate: activePeriod?.startsOn ?? null,
            toDate: activePeriod?.endsOn ?? null,
            limit: 100,
          },
        ),
      ]);
      setPortfolioItems(nextItems);
      setAssessmentEvidenceEvents(nextAssessmentEvidenceEvents);
    } catch (error) {
      setPortfolioError(
        normalizeCleanErrorMessage(
          error,
          "We could not load the report-ready learning records for this report.",
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
      setAssessmentEvidenceEvents([]);
      setLearningPeriods([]);
      setPortfolioError(null);
      setSelectedReportId(null);
      return;
    }

    void reloadPeriods();
    void reloadLearningPeriods();
    void reloadReports();
  }, [
    reloadLearningPeriods,
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
    if (typeof window === "undefined") return;

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void reloadPortfolioItems();
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
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
      return;
    }

    if (editingReportId) {
      setShowReportBuilder(true);
    }
  }, [editingReportId, readyForReports, reports.length]);

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
      defaultReportingPeriodForReport &&
      !editingReportId &&
      reportPeriodMode === "current"
    ) {
      setReportingPeriodId(defaultReportingPeriodForReport.id);
    }
  }, [
    defaultReportingPeriodForReport,
    editingReportId,
    reportLearnerId,
    reportPeriodMode,
    reportingPeriodId,
  ]);

  useEffect(() => {
    if (!readyForReports || editingReportId || !reportLearnerId) return;
    if (selectedReportId) return;

    if (currentLearningYearReport) {
      setSelectedReportId(currentLearningYearReport.id);
    }
  }, [
    currentLearningYearReport,
    editingReportId,
    readyForReports,
    reportLearnerId,
    selectedReportId,
  ]);

  function resetReportForm() {
    setEditingReportId(null);
    setReportLearnerId("");
    setReportingPeriodId("");
    setReportTitle("");
    setReportPeriodMode("current");
    setCustomPeriodStartsOn("");
    setCustomPeriodEndsOn("");
    setShowCustomReportTitle(false);
  }

  async function handleReportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      let effectiveReportingPeriodId = "";

      if (reportPeriodMode === "custom") {
        if (!customPeriodStartsOn || !customPeriodEndsOn) {
          throw new Error("Choose a start date and end date for this report period.");
        }

        if (customPeriodStartsOn > customPeriodEndsOn) {
          throw new Error("The report start date must be before the end date.");
        }

        const customPeriodTitle =
          reportTitle.trim() ||
          (draftReportLearnerLabel
            ? `${draftReportLearnerLabel} custom report period`
            : "Custom report period");

        if (editingReportId && reportingPeriodId) {
          const updatedPeriod = await updateCleanReportingPeriod(
            workspace.profile.id,
            reportingPeriodId,
            {
              learnerId: reportLearnerId,
              title: customPeriodTitle,
              startsOn: customPeriodStartsOn,
              endsOn: customPeriodEndsOn,
            },
          );
          effectiveReportingPeriodId = updatedPeriod.id;
        } else {
          const createdPeriod = await createCleanReportingPeriod(workspace.profile.id, {
            learnerId: reportLearnerId,
            title: customPeriodTitle,
            startsOn: customPeriodStartsOn,
            endsOn: customPeriodEndsOn,
          });
          effectiveReportingPeriodId = createdPeriod.id;
        }
      } else {
        effectiveReportingPeriodId =
          reportingPeriodId || defaultReportingPeriodForReport?.id || "";

        if (
          !effectiveReportingPeriodId &&
          reportLearnerId &&
          !defaultReportingPeriodForReport
        ) {
          const createdPeriod = await createCleanReportingPeriod(workspace.profile.id, {
            learnerId: reportLearnerId,
            title: suggestedReportingPeriodDraft.title,
            startsOn: suggestedReportingPeriodDraft.startsOn,
            endsOn: suggestedReportingPeriodDraft.endsOn,
          });

          effectiveReportingPeriodId = createdPeriod.id;
        }
      }

      const effectivePeriodTitle =
        reportPeriodMode === "custom"
          ? reportTitle.trim() || "Custom report period"
          : activePeriod?.title ||
            defaultReportingPeriodForReport?.title ||
            suggestedReportingPeriodDraft.title;
      const nextTitle =
        reportTitle.trim() ||
        buildDefaultReportTitle(draftReportLearnerLabel, effectivePeriodTitle);
      const payload = {
        learnerId: reportLearnerId,
        reportingPeriodId: effectiveReportingPeriodId,
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
      await reloadPeriods();
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
    const linkedPeriod = periods.find((period) => period.id === report.reportingPeriodId) ?? null;
    const learnerPeriods = periods.filter((period) => period.learnerId === report.learnerId);
    const defaultPeriodForReport =
      findDefaultReportingPeriod(learnerPeriods, suggestedLearningPeriod, todayDate) ?? null;

    setEditingReportId(report.id);
    setReportLearnerId(report.learnerId);
    setReportingPeriodId(report.reportingPeriodId);
    setReportTitle(report.title);
    setReportPeriodMode(
      defaultPeriodForReport?.id === report.reportingPeriodId ? "current" : "custom",
    );
    setCustomPeriodStartsOn(linkedPeriod?.startsOn ?? "");
    setCustomPeriodEndsOn(linkedPeriod?.endsOn ?? "");
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

  function handlePreviewReport(report: CleanReport) {
    handleContinueReport(report);
    openPreview();
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
          ? "First report preview ready. Your records are beginning to come together."
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

  async function handleConfirmReportAction() {
    if (!pendingReportAction) return;
    const action = pendingReportAction;

    if (action.type === "delete") {
      await handleDeleteReport(action.report);
    } else {
      await handleUpdateReportStatus(action.report, "archived");
    }

    setPendingReportAction(null);
  }

  async function handleDownloadReportPdf() {
    if (!workspace.profile || !selectedReport || !selectedPeriod) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      if (selectedReport.status !== "ready") {
        await updateCleanReport(workspace.profile.id, selectedReport.id, {
          status: "ready",
        });
      }

      const pdfBytes = await generateCleanReportPdfBytes({
        report: selectedReport.status === "ready"
          ? selectedReport
          : { ...selectedReport, status: "ready" },
        learnerLabel: selectedReportLearnerLabel,
        reportingPeriod: selectedPeriod,
        sections,
        evidenceItems: reportPdfEvidenceItems,
        assessmentEvidenceItems: assessmentEvidenceEvents,
        preparedOnLabel: formatDateLabel(new Date().toISOString().slice(0, 10)),
        statusLabel: getReportStatusLabel("ready"),
      });
      const filename = buildCleanReportPdfFilename(
        selectedReportLearnerLabel,
        selectedPeriod.title || selectedReport.title,
      );

      downloadPdf(pdfBytes, filename);

      try {
        await createCleanReportExport(workspace.profile.id, {
          reportId: selectedReport.id,
          learnerId: selectedReport.learnerId,
          exportFormat: "pdf",
        });
      } catch {
        // The PDF is already downloaded; output history can still be recovered from My Outputs later.
      }

      setSelectedReportId(selectedReport.id);
      setMessage("Report PDF downloaded.");
      await reloadReports();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not create this PDF right now. Please try again or check the report evidence.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const introPrimaryAction = !selectedReport ? (
    <button type="button" style={buttonStyle} onClick={openReportBuilder}>
      Start report
    </button>
  ) : selectedReport.status === "ready" || reportCanPreview ? (
    <button type="button" style={buttonStyle} onClick={openPreview}>
      Preview learning record
    </button>
  ) : selectedReport.status === "archived" ? (
    <button
      type="button"
      style={buttonStyle}
      onClick={() => void handleUpdateReportStatus(selectedReport, "draft")}
      disabled={submitting}
    >
      Continue report
    </button>
  ) : (
    <button type="button" style={buttonStyle} onClick={openReportBuilder}>
      Check report details
    </button>
  );

  const step1Tone: CompletionTone =
    selectedReport && selectedPeriod ? "complete" : "incomplete";
  const step2Tone: CompletionTone = reportCanPreview ? "complete" : "locked";
  const step2Text = reportCanPreview
    ? "Step 2 complete - preview the prepared learning record."
    : "Step 2 locked - finish Step 1 first.";
  const step3Tone: CompletionTone = selectedReport?.status === "ready"
    ? "complete"
    : reportCanMoveToOutput
      ? "in-progress"
      : "locked";
  const step3Text = selectedReport?.status === "ready"
    ? "Step 3 complete - this learning record is ready to download."
    : reportCanMoveToOutput
      ? "Step 3 in progress - download the learning record when you are ready."
      : "Step 3 locked - finish Step 1 first.";

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <style jsx global>{`
          @media (max-width: 640px) {
            .mylearna-reports-intro,
            .mylearna-reports-setup {
              padding: 18px !important;
            }

            .mylearna-reports-intro p,
            .mylearna-reports-helper-detail {
              display: none !important;
            }

            .mylearna-reports-setup h2 {
              font-size: 20px !important;
            }

            .mylearna-reports-setup p {
              margin-top: 4px !important;
            }

            .mylearna-reports-setup button,
            .mylearna-reports-setup a {
              min-height: 44px !important;
            }
          }
        `}</style>
        <CleanWorkflowRibbon />
        <CleanFirstRunSetupGate currentStep="reports" />
        {!workspace.setupLoading && !workspace.setupStatus.hasReport ? (
          <GuidanceSetupProgress
            stepId="reports"
            title="Preview records and reporting."
            body="See how planning, evidence and portfolio items can become clearer records."
          />
        ) : null}

        <CleanPageIntroVideo
          config={PAGE_INTRO_VIDEOS.myReports}
          promptTitle="New to My Reports?"
          promptDescription="See how to turn report-ready learning records into a parent-ready report."
        />

        <section className="mylearna-reports-intro" data-guidance-id="reports-preview-output" style={cardStyle}>
            <div style={{ display: "grid", gap: 8 }}>
              <div
                style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#64748b",
              }}
            >
              Prepare a report
              </div>
              <h1 style={{ margin: 0, fontSize: 26, color: "#17204B", fontWeight: 650 }}>My Reports</h1>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Turn report-ready learning records into a clear report.
              </p>
              <div>
                <GuidancePageAction tourId="my-reports" />
              </div>
            </div>
          </section>

      {workspace.loading ? (
        <V2LoadingState
          title="Preparing reports"
          body="We are loading the learners, evidence, and reporting context for this workspace."
        />
      ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              Reports are temporarily unavailable. Try again shortly.
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
              Create your family profile first, then prepare reports here.
            </p>
          </section>
        ) : null}

        {readyForReports && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner before starting a report.
            </p>
          </section>
        ) : null}

        {readyForReports && workspace.profile && workspace.learners.length ? (
          <>
            {brentModeActive ? (
              <section style={cardStyle}>
                <div style={{ display: "grid", gap: 8 }}>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>
                    Brent evidence pathway active
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    This learner is set to Brent Council. MyLearna will prepare a Brent-aligned evidence pack using learning evidence, portfolio highlights, and report notes collected through the year.
                  </p>
                </div>
              </section>
            ) : null}

            <section className="mylearna-reports-setup" style={cardStyle}>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Report setup</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                    Choose the learner and dates.
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
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {selectedReport
                      ? nextReportGuidance
                      : "Start with one learner and one report period. MyLearna will keep the next useful action in front of you."}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{introPrimaryAction}</div>
                </div>
                <div className="mylearna-reports-helper-detail" style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>How reports are built</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Your report brings together report-ready learning records, written reflections, and learner context into one learning report.
                  </p>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Not every capture needs to be in a report. Choose Include in Reports for records that belong in the formal report.
                  </p>
                </div>
              </div>
            </section>

            <ReportBuildStepCard
              stepNumber={1}
              title="Choose learner"
              helperText={
                selectedReport
                  ? "This learning record is already linked to a saved report period. You can change the learner, title, or date range here."
                  : "Choose the learner and report period first. MyLearna uses those dates to gather evidence."
              }
              completionTone={step1Tone}
              completionText={
                selectedReport && selectedPeriod
                  ? "Step 1 complete - learner and report period linked."
                  : "Step 1 incomplete - choose the learner and report period."
              }
              action={
                <button
                  type="button"
                  style={selectedReport ? quietButtonStyle : secondaryButtonStyle}
                  onClick={() => {
                    if (showReportBuilder) {
                      setShowReportBuilder(false);
                    } else {
                      openReportBuilder();
                    }
                  }}
                  disabled={submitting}
                >
                  {showReportBuilder ? "Hide report details" : selectedReport ? "Check report details" : "Start report"}
                </button>
              }
            >
              <div data-guidance-id="reports-date-range" ref={reportSetupRef} style={{ display: "grid", gap: 16 }}>
                {selectedReport ? (
                  <div
                    style={{
                      ...helperCardStyle,
                      background: "#ffffff",
                      borderColor: "#dbeafe",
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>Current learning record</strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      This learning record is already linked to a saved report period.
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      }}
                    >
                      <div>
                        <div style={fieldLabelStyle}>Learner</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>{selectedReportLearnerLabel}</div>
                      </div>
                      <div>
                        <div style={fieldLabelStyle}>Report period</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {selectedPeriod ? selectedPeriod.title : "Not linked yet"}
                        </div>
                        {selectedPeriod ? (
                          <div style={{ color: "#475569", lineHeight: 1.6 }}>
                            {formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)}
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <div style={fieldLabelStyle}>Report title</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>{selectedReport.title}</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {showReportBuilder || !selectedReport ? (
                  <div
                    style={{
                      border: "1px solid #dbe4f0",
                      borderStyle: selectedReport ? "dashed" : "solid",
                      borderRadius: 16,
                      padding: 16,
                      background: selectedReport ? "#fcfdff" : "#f8fafc",
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>
                        {selectedReport ? "Report details" : editingReportId ? "Edit this report" : "Start this report"}
                      </strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        {selectedReport
                          ? "These details are already in place. Change the learner, title, or report period when the evidence range needs attention."
                          : "Choose the learner and date range. MyLearna will use that range for captured evidence, pathway checks, report previews, and PDF outputs."}
                      </p>
                    </div>

                    <form onSubmit={handleReportSubmit} style={{ display: "grid", gap: 12 }}>
                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        }}
                      >
                        <div>
                          <label style={fieldLabelStyle}>Choose learner</label>
                          <select
                            value={reportLearnerId}
                            onChange={(event) => {
                              setReportLearnerId(event.target.value);
                              setSelectedReportId(null);
                              setReportingPeriodId("");
                              setReportTitle("");
                              setReportPeriodMode("current");
                              setCustomPeriodStartsOn("");
                              setCustomPeriodEndsOn("");
                              setShowCustomReportTitle(false);
                            }}
                            style={inputStyle}
                          >
                            <option value="">Choose learner</option>
                            {learnerOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div
                        style={{
                          ...helperCardStyle,
                          background: "#ffffff",
                          borderColor: "#dbeafe",
                        }}
                      >
                        <div style={{ display: "grid", gap: 12 }}>
                          <div style={{ display: "grid", gap: 6 }}>
                            <strong style={{ color: "#0f172a" }}>Report period</strong>
                            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                              Choose the dates MyLearna should use when gathering evidence for this report.
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button
                              type="button"
                              style={reportPeriodMode === "current" ? buttonStyle : secondaryButtonStyle}
                              onClick={() => {
                                setReportPeriodMode("current");
                                setReportingPeriodId(defaultReportingPeriodForReport?.id || "");
                              }}
                              disabled={submitting || !reportLearnerId}
                            >
                              Use current learning year
                            </button>
                            <button
                              type="button"
                              style={reportPeriodMode === "custom" ? buttonStyle : secondaryButtonStyle}
                              onClick={() => {
                                const linkedPeriodIsCurrent =
                                  Boolean(reportingPeriodId) &&
                                  defaultReportingPeriodForReport?.id === reportingPeriodId;
                                setReportPeriodMode("custom");
                                if (!editingReportId || linkedPeriodIsCurrent) {
                                  setReportingPeriodId("");
                                }
                                setCustomPeriodStartsOn(
                                  customPeriodStartsOn ||
                                    selectedPeriod?.startsOn ||
                                    currentLearningYearSummary?.startsOn ||
                                    suggestedReportingPeriodDraft.startsOn,
                                );
                                setCustomPeriodEndsOn(
                                  customPeriodEndsOn ||
                                    selectedPeriod?.endsOn ||
                                    currentLearningYearSummary?.endsOn ||
                                    suggestedReportingPeriodDraft.endsOn,
                                );
                              }}
                              disabled={submitting || !reportLearnerId}
                            >
                              Use custom date range
                            </button>
                          </div>

                          {reportPeriodMode === "current" ? (
                            <div style={{ display: "grid", gap: 6 }}>
                              <div style={{ color: "#0f172a", fontWeight: 700 }}>
                                {currentLearningYearSummary?.title || "Choose learner first"}
                              </div>
                              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                {currentLearningYearSummary
                                  ? `${formatDateRange(
                                      currentLearningYearSummary.startsOn,
                                      currentLearningYearSummary.endsOn,
                                    )}. Evidence inside this date range will be included.`
                                  : "Based on your family settings."}
                              </div>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "grid",
                                gap: 12,
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                              }}
                            >
                              <div>
                                <label style={fieldLabelStyle}>Start date</label>
                                <input
                                  type="date"
                                  value={customPeriodStartsOn}
                                  onChange={(event) => setCustomPeriodStartsOn(event.target.value)}
                                  style={inputStyle}
                                  disabled={submitting}
                                />
                              </div>
                              <div>
                                <label style={fieldLabelStyle}>End date</label>
                                <input
                                  type="date"
                                  value={customPeriodEndsOn}
                                  onChange={(event) => setCustomPeriodEndsOn(event.target.value)}
                                  style={inputStyle}
                                  disabled={submitting}
                                />
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "end",
                                  color: "#475569",
                                  lineHeight: 1.6,
                                }}
                              >
                                Evidence on the start and end dates is included.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {showCustomReportTitle || editingReportId || !selectedReport ? (
                        <div>
                          <label style={fieldLabelStyle}>Report title</label>
                          <input
                            value={reportTitle}
                            onChange={(event) => setReportTitle(event.target.value)}
                            placeholder={suggestedReportTitle || "Report title"}
                            style={inputStyle}
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            ...helperCardStyle,
                            background: "#ffffff",
                            borderColor: "#e2e8f0",
                          }}
                        >
                          <strong style={{ color: "#0f172a" }}>
                            {reportTitle.trim() ? "Current title" : "Suggested title"}
                          </strong>
                          <div style={{ color: "#475569", lineHeight: 1.6 }}>
                            {reportTitle.trim() ||
                              suggestedReportTitle ||
                              "Choose the learner and report period to build the title automatically."}
                          </div>
                          <div>
                            <button
                              type="button"
                              style={secondaryButtonStyle}
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
                          {submitting ? "Saving..." : editingReportId ? "Save report" : "Start report"}
                        </button>
                        {editingReportId ? (
                          <button
                            type="button"
                            style={secondaryButtonStyle}
                            onClick={resetReportForm}
                            disabled={submitting}
                          >
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                    </form>
                  </div>
                ) : (
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>This learning record is already linked</strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Open report details when the learner, report period, or title need attention.
                    </p>
                  </div>
                )}
              </div>
            </ReportBuildStepCard>

            {selectedReport ? (
              <>
                <ReportBuildStepCard
                  stepNumber={2}
                  title="Preview prepared learning record"
                  helperText="Check the prepared learning record before you download the PDF."
                  completionTone={step2Tone}
                  completionText={step2Text}
                  emphasis
                >
                  <div
                    data-guidance-id="reports-preview"
                    ref={reportPreviewRef}
                    style={{
                      display: "grid",
                      gap: 20,
                    }}
                  >
                    <div style={helperCardStyle}>
                      <strong style={{ color: "#0f172a" }}>Prepared learning report preview</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        This preview shows the learner, report period, included learning records, pathway progress, and any saved report content linked to this learning report.
                      </p>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        maxWidth: 900,
                        margin: "0 auto",
                        border: "1px solid #cfdceb",
                        borderRadius: 24,
                        background: "#ffffff",
                        boxShadow: "0 24px 56px rgba(15,23,42,0.08)",
                        padding: "34px clamp(22px, 4vw, 46px)",
                        display: "grid",
                        gap: 30,
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
                              Learning report preview
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
                              {sections.length} {sections.length === 1 ? "saved part" : "saved parts"}
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
                              Report period
                            </div>
                            <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
                              {selectedPeriod ? selectedPeriod.title : "Not set"}
                            </div>
                            <div style={{ color: "#475569", marginTop: 4, lineHeight: 1.6 }}>
                              {selectedPeriod
                                ? formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)
                                : "Choose the report period for this learning record."}
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
                              {portfolioItems.length} {portfolioItems.length === 1 ? "learning evidence entry" : "learning evidence entries"}
                            </div>
                            <div style={{ color: "#475569", marginTop: 4, lineHeight: 1.6 }}>
                              {selectedPathwayEvidenceSummary.repeatedSteps.length
                                ? "Several notes for the same pathway step are included. You may want to keep the clearest example in My Portfolio."
                                : assessmentEvidenceEvents.length
                                  ? `${assessmentEvidenceEvents.length} pathway ${assessmentEvidenceEvents.length === 1 ? "check is" : "checks are"} also ready for this report.`
                                  : "Included highlights ready to support this report."}
                            </div>
                          </div>
                        </div>
                      </header>

                          <section
                            data-guidance-id="reports-evidence-summary"
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
                        {selectedPathwayEvidenceSummary.repeatedSteps.length ? (
                          <div
                            style={{
                              border: "1px solid #dbeafe",
                              borderRadius: 14,
                              background: "#f8fbff",
                              padding: 14,
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            <strong style={{ color: "#0f172a" }}>
                              Several notes for the same pathway step are included
                            </strong>
                            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                              You may want to keep the strongest example in My Portfolio before sending this learning record to output.
                            </p>
                            <div style={{ display: "grid", gap: 6 }}>
                              {selectedPathwayEvidenceSummary.repeatedSteps.map((step) => (
                                <div key={step.label} style={{ color: "#475569", lineHeight: 1.6 }}>
                                  {step.label} - {step.count} selected learning {step.count === 1 ? "record" : "records"}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {portfolioLoading ? (
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                            Loading learning records...
                          </p>
                        ) : portfolioError ? (
                          <p style={{ margin: 0, color: "#b91c1c", lineHeight: 1.7 }}>
                            {portfolioError}
                          </p>
                        ) : portfolioItems.length ? (
                          <div style={{ display: "grid", gap: 10 }}>
                            {focusedPortfolioItems.slice(0, 5).map((item) => {
                              const pathwayMeta =
                                selectedPathwayEvidenceSummary.stepByEvidenceId.get(item.evidence.id) ?? null;
                              const repeatedPathwayStep = pathwayMeta
                                ? (selectedPathwayEvidenceSummary.repeatedStepsByKey.get(pathwayMeta.key)?.count ?? 0) > 1
                                : false;
                              const evidenceMeta = getEvidencePresentationMeta(item);
                              const previewImage = getEvidencePreviewImage(item.evidence);

                              return (
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
                                    {item.evidence.learningArea ? ` | ${item.evidence.learningArea}` : ""}
                                  </div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                                      Learning record
                                    </span>
                                    {evidenceMeta.progressLevel ? (
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
                                        {evidenceMeta.progressLevel}
                                      </span>
                                    ) : null}
                                    {evidenceMeta.hasAttachment ? (
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
                                        Photo attached
                                      </span>
                                    ) : null}
                                  </div>
                                  {previewImage ? (
                                    <EvidenceThumbnail
                                      image={previewImage}
                                      title="Evidence photo"
                                    />
                                  ) : null}
                                  {pathwayMeta ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 8,
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        color: "#475569",
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                      }}
                                    >
                                      <span>Pathway: {pathwayMeta.label}</span>
                                      {pathwayMeta.assessmentConfidence ? (
                                        <span>Assessment: {pathwayMeta.assessmentConfidence}</span>
                                      ) : null}
                                      {pathwayMeta.observedSkillStatus ? (
                                        <span>Observed: {pathwayMeta.observedSkillStatus}</span>
                                      ) : null}
                                      {repeatedPathwayStep ? (
                                        <span
                                          style={{
                                            borderRadius: 999,
                                            padding: "4px 10px",
                                            background: "#eef2ff",
                                            color: "#4338ca",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          Several notes for this step
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                    {summarizeEvidence(item)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                            No report-ready learning records were found for this report period. Try widening the date range or recording learning from My Capture.
                          </p>
                        )}
                        <div
                          style={{
                            borderTop: "1px solid #e2e8f0",
                            paddingTop: 12,
                            display: "grid",
                            gap: 10,
                          }}
                        >
                          <strong style={{ color: "#0f172a" }}>
                            Pathway progress
                          </strong>
                          {portfolioLoading ? null : assessmentEvidenceEvents.length ? (
                            <div style={{ display: "grid", gap: 10 }}>
                              {assessmentEvidenceEvents.slice(0, 5).map((event) => (
                                <div
                                  key={event.id}
                                  style={{
                                    display: "grid",
                                    gap: 4,
                                    paddingLeft: 14,
                                    borderLeft: "3px solid #22c55e",
                                  }}
                                >
                                  <div style={{ color: "#0f172a", fontWeight: 700 }}>
                                    {event.title}
                                  </div>
                                  <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                                    {formatEvidenceEventDateLabel(event.evidenceDate)}
                                    {event.strand ? ` | ${event.strand}` : ""}
                                    {event.parentJudgement ? ` | Parent judgement: ${event.parentJudgement}` : ""}
                                  </div>
                                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                    {event.summary}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                              Completed pathway checks will appear here when they fall inside the selected report period.
                            </p>
                          )}
                        </div>
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
                                  Saved part {section.sortOrder}
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
                            No saved report content is linked to this learning record yet. You can still review the learner, report period, and evidence before downloading the PDF.
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                </ReportBuildStepCard>

                <div data-guidance-id="reports-generate-output">
                  <ReportBuildStepCard
                    stepNumber={3}
                    title={selectedReport.status === "ready" ? "Download report PDF" : "Prepare report PDF"}
                    helperText={
                      selectedReport.status === "ready"
                        ? "Download the finished learning record here. Output history stays available if you need it."
                        : "Preview the learning record, then download the PDF when you are ready."
                    }
                    completionTone={step3Tone}
                    completionText={step3Text}
                    emphasis={selectedReport.status === "ready" || reportCanMoveToOutput}
                    action={
                      selectedReport.status !== "ready" && reportCanPreview ? (
                        <button type="button" style={buttonStyle} onClick={openPreview}>
                          Preview learning record
                        </button>
                      ) : undefined
                    }
                    secondaryAction={
                      selectedReport.status === "ready" ? (
                        <button
                          type="button"
                          style={{
                            ...buttonStyle,
                          }}
                          onClick={() => void handleDownloadReportPdf()}
                          disabled={submitting || !reportCanMoveToOutput}
                        >
                          {submitting ? "Preparing PDF..." : "Download report PDF"}
                        </button>
                      ) : reportCanMoveToOutput ? (
                        <button
                          type="button"
                          style={successButtonStyle}
                          onClick={() => void handleDownloadReportPdf()}
                          disabled={submitting}
                        >
                          {submitting ? "Preparing PDF..." : "Download report PDF"}
                        </button>
                      ) : undefined
                    }
                  >
                    <div style={helperCardStyle}>
                      <strong style={{ color: "#0f172a" }}>
                        {selectedReport.status === "ready"
                          ? "This learning record is ready to download."
                          : reportCanMoveToOutput
                            ? "The learning record is ready for PDF download."
                            : "Finish the current learning record details first."}
                      </strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        {selectedReport.status === "ready"
                          ? "Download it here, or return the report to draft if you need more edits."
                          : reportCanMoveToOutput
                            ? "Use the preview one last time if you want, then download the report PDF."
                            : "Choose the learner and report period first, then return here to move into output."}
                      </p>
                    </div>
                    {!workspace.setupLoading && !workspace.setupStatus.hasReport ? (
                      <GuidanceSetupNextAction
                        stepId="reports"
                        nextHref={buildOutputsHref(selectedReport)}
                        label="Open output history"
                        helperText="You can download the PDF here. Output history remains available if you need it."
                      />
                    ) : null}
                  </ReportBuildStepCard>
                </div>

                <section
                  ref={activeReportRef}
                  style={{
                    ...cardStyle,
                    background: "#fcfdff",
                  }}
                >
                  <div style={{ display: "grid", gap: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 14,
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
                          Active report
                        </div>
                        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                          {selectedReport.title}
                        </h2>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                          {selectedPeriod
                            ? `${selectedReportLearnerLabel} - ${selectedPeriod.title}`
                            : `${selectedReportLearnerLabel} - report period still needs attention.`}
                        </p>
                        {selectedPeriod ? (
                          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                            {formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)}
                          </p>
                        ) : null}
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
                        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                      }}
                    >
                      <div>
                        <div style={fieldLabelStyle}>Learner</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>{selectedReportLearnerLabel}</div>
                      </div>
                      <div>
                        <div style={fieldLabelStyle}>Report period</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {selectedPeriod ? selectedPeriod.title : "Choose one"}
                        </div>
                        {selectedPeriod ? (
                          <div style={{ color: "#475569", lineHeight: 1.6 }}>
                            {formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)}
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <div style={fieldLabelStyle}>Report-ready records</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {portfolioItems.length} {portfolioItems.length === 1 ? "entry" : "entries"}
                        </div>
                      </div>
                      <div>
                        <div style={fieldLabelStyle}>Saved report content</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {sections.length} {sections.length === 1 ? "part" : "parts"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {selectedReport.status === "archived" ? (
                        <button
                          type="button"
                          style={buttonStyle}
                          onClick={() => void handleUpdateReportStatus(selectedReport, "draft")}
                          disabled={submitting}
                        >
                          Continue report
                        </button>
                      ) : reportCanPreview || selectedReport.status === "ready" ? (
                        <button type="button" style={buttonStyle} onClick={openPreview}>
                          Preview learning record
                        </button>
                      ) : (
                        <button type="button" style={buttonStyle} onClick={openReportBuilder}>
                          Check report details
                        </button>
                      )}

                      {!selectedPeriod ? (
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={openReportBuilder}
                        >
                          Edit report period
                        </button>
                      ) : !portfolioItems.length ? (
                        <Link
                          href={portfolioPathBase}
                          style={{
                            ...secondaryButtonStyle,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Open My Portfolio
                        </Link>
                      ) : null}

                      {selectedPeriod ? (
                        <button
                          type="button"
                          style={successButtonStyle}
                          onClick={() => void handleDownloadReportPdf()}
                          disabled={submitting}
                        >
                          {submitting ? "Preparing PDF..." : "Download report PDF"}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        style={secondaryButtonStyle}
                        onClick={() => handleEditReport(selectedReport)}
                        disabled={submitting}
                      >
                        Edit report details
                      </button>

                      {selectedReport.status === "ready" ? (
                        <Link
                          href={buildOutputsHref(selectedReport)}
                          style={{
                            ...secondaryButtonStyle,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Output history
                        </Link>
                      ) : null}

                      {selectedReport.status !== "archived" ? (
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => setPendingReportAction({ type: "archive", report: selectedReport })}
                          disabled={submitting}
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => void handleUpdateReportStatus(selectedReport, "draft")}
                          disabled={submitting}
                        >
                          Reopen as draft
                        </button>
                      )}

                      <button
                        type="button"
                        style={destructiveButtonStyle}
                        onClick={() => setPendingReportAction({ type: "delete", report: selectedReport })}
                        disabled={submitting}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </section>

              </>
            ) : null}

            {otherReports.length ? (
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
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Historical reports</h2>
                    <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                      Previous learning records stay here if you need them. Keep the current learning year flow above as the main parent view.
                    </p>
                  </div>
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={() => setShowOtherReports((current) => !current)}
                    aria-expanded={showOtherReports}
                  >
                    {showOtherReports
                      ? "Hide historical reports"
                      : `Show historical reports (${otherReports.length})`}
                  </button>
                </div>

                {showOtherReports ? (
                  <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                    {otherReports.map((report) => {
                      const learnerLabel =
                        learnerOptions.find((option) => option.value === report.learnerId)?.label ||
                        "Unknown learner";
                      const period = periods.find((item) => item.id === report.reportingPeriodId) ?? null;

                      return (
                        <div
                          key={report.id}
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
                                style={buttonStyle}
                                onClick={() =>
                                  report.status === "ready"
                                    ? handlePreviewReport(report)
                                    : handleContinueReport(report)
                                }
                                disabled={submitting}
                              >
                                {report.status === "ready"
                                  ? "Preview learning record"
                                  : report.status === "archived"
                                    ? "Review archived report"
                                    : "Continue report"}
                              </button>
                              <button
                                type="button"
                                style={secondaryButtonStyle}
                                onClick={() => handleEditReport(report)}
                                disabled={submitting}
                              >
                                Edit report details
                              </button>
                              <button
                                type="button"
                                style={destructiveButtonStyle}
                                onClick={() => setPendingReportAction({ type: "delete", report })}
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
                ) : (
                  <div style={{ ...helperCardStyle, marginTop: 16 }}>
                    <strong style={{ color: "#0f172a" }}>
                      {otherReports.length} earlier {otherReports.length === 1 ? "report is" : "reports are"} still available
                    </strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Keep the focus on the current learning year flow above, then open this list only when you need an older record.
                    </p>
                  </div>
                )}
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

      {pendingReportAction ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-action-confirmation-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(15,23,42,0.38)",
          }}
        >
          <div
            style={{
              width: "min(100%, 520px)",
              border: "1px solid #fecaca",
              borderRadius: 18,
              background: "#ffffff",
              padding: 20,
              boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
              display: "grid",
              gap: 14,
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <h2
                id="report-action-confirmation-title"
                style={{ margin: 0, color: "#0f172a", fontSize: 24 }}
              >
                {pendingReportAction.type === "delete"
                  ? "Delete this report?"
                  : "Archive this report?"}
              </h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                {pendingReportAction.type === "delete"
                  ? "This removes the report from My Reports. This cannot be undone."
                  : "This moves the report out of the active report list. You can reopen it later if needed."}
              </p>
              <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                {pendingReportAction.report.title}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                autoFocus
                style={secondaryButtonStyle}
                onClick={() => setPendingReportAction(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                style={
                  pendingReportAction.type === "delete"
                    ? destructiveButtonStyle
                    : secondaryButtonStyle
                }
                onClick={() => void handleConfirmReportAction()}
                disabled={submitting}
              >
                {submitting
                  ? pendingReportAction.type === "delete"
                    ? "Deleting..."
                    : "Archiving..."
                  : pendingReportAction.type === "delete"
                    ? "Delete report"
                    : "Archive report"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CleanReportsWorkspace() {
  return <CleanReportsWorkspaceBody />;
}
