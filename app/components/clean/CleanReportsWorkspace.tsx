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
import { isBrentAuthorityTemplateActive } from "@/lib/clean/authority/brent";
import { listCleanLearningPeriods } from "@/lib/clean/terms/client";
import type { CleanLearningPeriod } from "@/lib/clean/terms/types";

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
  const text = item.evidence.whatHappened.trim();
  if (text.length <= 180) return text;
  return `${text.slice(0, 177).trimEnd()}...`;
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
  const [learningPeriods, setLearningPeriods] = useState<CleanLearningPeriod[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [showPeriodManager, setShowPeriodManager] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showCustomReportTitle, setShowCustomReportTitle] = useState(false);
  const [showAdvancedCustomisation, setShowAdvancedCustomisation] = useState(false);
  const [showOtherReports, setShowOtherReports] = useState(false);

  const [periodLearnerId, setPeriodLearnerId] = useState("");
  const [periodTitle, setPeriodTitle] = useState("");
  const [periodStartsOn, setPeriodStartsOn] = useState("");
  const [periodEndsOn, setPeriodEndsOn] = useState("");

  const [reportLearnerId, setReportLearnerId] = useState("");
  const [reportingPeriodId, setReportingPeriodId] = useState("");
  const [reportTitle, setReportTitle] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const activeReportRef = useRef<HTMLDivElement>(null);
  const reportSetupRef = useRef<HTMLDivElement>(null);
  const periodManagerRef = useRef<HTMLDivElement>(null);
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
  const suggestedReportTitle = useMemo(
    () =>
      buildDefaultReportTitle(
        draftReportLearnerLabel,
        activePeriod?.title || suggestedReportingPeriodDraft.title,
      ),
    [activePeriod?.title, draftReportLearnerLabel, suggestedReportingPeriodDraft.title],
  );
  const otherReports = useMemo(
    () => reports.filter((report) => report.id !== selectedReport?.id),
    [reports, selectedReport?.id],
  );
  const reportCanPreview = Boolean(selectedReport && selectedPeriod);
  const reportCanMoveToOutput = Boolean(selectedReport && selectedPeriod);
  const nextReportGuidance = useMemo(() => {
    if (!selectedReport) {
      return "Reports use your current learning period by default. Review the selected portfolio evidence and written reflections, then move the learning record to My Outputs when you are ready.";
    }

    if (selectedReport.status === "archived") {
      return "This report is archived. Return it to draft when you want to review it again or send it to output.";
    }

    if (selectedReport.status === "ready") {
      return "This learning record is ready. Review the preview below or head straight to My Outputs.";
    }

    if (!selectedPeriod) {
      return "Check the learner and reporting period so the learning record lines up correctly.";
    }

    if (!portfolioItems.length) {
      return "Preview the prepared learning record. If you need more evidence later, return to My Portfolio and choose stronger highlights first.";
    }

    return "Preview the prepared learning record, then send it to My Outputs when you are ready.";
  }, [
    portfolioItems.length,
    selectedPeriod,
    selectedReport,
  ]);

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
      !editingReportId
    ) {
      setReportingPeriodId(defaultReportingPeriodForReport.id);
    }
  }, [
    defaultReportingPeriodForReport,
    editingReportId,
    reportLearnerId,
    reportingPeriodId,
  ]);

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
      let effectiveReportingPeriodId = reportingPeriodId;

      if (
        !effectiveReportingPeriodId &&
        reportLearnerId &&
        filteredPeriodsForReport.length === 0
      ) {
        const createdPeriod = await createCleanReportingPeriod(workspace.profile.id, {
          learnerId: reportLearnerId,
          title: suggestedReportingPeriodDraft.title,
          startsOn: suggestedReportingPeriodDraft.startsOn,
          endsOn: suggestedReportingPeriodDraft.endsOn,
        });

        effectiveReportingPeriodId = createdPeriod.id;
      }

      const effectivePeriodTitle =
        activePeriod?.title ||
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

  async function handleSendToOutputs() {
    if (!selectedReport) return;

    await handleUpdateReportStatus(selectedReport, "ready");
    window.location.assign(outputsPathBase);
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
      Check current learning record
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
    ? "Step 3 complete - this learning record is ready in My Outputs."
    : reportCanMoveToOutput
      ? "Step 3 in progress - send this learning record to My Outputs when you are ready."
      : "Step 3 locked - finish Step 1 first.";

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
              Reports bring together your selected portfolio evidence and written reflections into a learning record.
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

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Output preparation</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                    Reports use your current learning period by default. You can adjust this if needed.
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
                      : "Start with one learner and one current learning period. MyLearna will keep the next useful action in front of you."}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{introPrimaryAction}</div>
                </div>
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a" }}>How reports are built</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Reports bring together your selected portfolio evidence, written summary sections, and learner context into one learning record.
                  </p>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Not every capture needs to be in a report. Choose the strongest evidence in My Portfolio first.
                  </p>
                </div>
              </div>
            </section>

            {selectedReport ? (
              <section
                ref={activeReportRef}
                style={{
                  ...cardStyle,
                  borderColor: "#dbeafe",
                  background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
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
                      <h2 style={{ margin: 0, color: "#0f172a", fontSize: 28 }}>
                        Working on: {selectedReportLearnerLabel} - {selectedPeriod ? selectedPeriod.title : selectedReport.title}
                      </h2>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                        {selectedPeriod
                          ? `${selectedReport.title} is the report for ${selectedReportLearnerLabel} during ${selectedPeriod.title}.`
                          : `This report belongs to ${selectedReportLearnerLabel}. Link the current reporting period first so the preview and output stay lined up.`}
                      </p>
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
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>{selectedReportLearnerLabel}</div>
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
                        {selectedPeriod ? selectedPeriod.title : "Choose one"}
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
                        Learning evidence
                      </div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        {portfolioItems.length} {portfolioItems.length === 1 ? "entry" : "entries"}
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
                        Saved report content
                      </div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        {sections.length} {sections.length === 1 ? "part" : "parts"}
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
                        {formatUpdatedLabel(selectedReport.updatedAt || selectedReport.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>What happens next</strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      {nextReportGuidance}
                    </p>
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
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={openReportBuilder}
                      >
                        Check current learning record
                      </button>
                    )}

                    {!selectedPeriod ? (
                      <button
                        type="button"
                        style={secondaryButtonStyle}
                        onClick={periods.length ? openReportBuilder : openPeriodManager}
                      >
                        {periods.length ? "Choose reporting period" : "Add reporting period"}
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
                        href={outputsPathBase}
                        style={{
                          ...secondaryButtonStyle,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        Go to My Outputs
                      </Link>
                    ) : null}

                    {selectedReport.status !== "archived" ? (
                      <button
                        type="button"
                        style={secondaryButtonStyle}
                        onClick={() => void handleUpdateReportStatus(selectedReport, "archived")}
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
                      onClick={() => void handleDeleteReport(selectedReport)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section
                ref={activeReportRef}
                style={{
                  ...cardStyle,
                  background: "#fcfdff",
                  borderStyle: "dashed",
                }}
              >
                <h2 style={{ marginTop: 0, color: "#0f172a" }}>No report started yet</h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  Start with one learner and one current learning period. Once the first report exists,
                  MyLearna will guide the rest step by step.
                </p>
              </section>
            )}

            <ReportBuildStepCard
              stepNumber={1}
              title="Current learning record"
              helperText={
                selectedReport
                  ? "This learning record is already linked to the current reporting period. You only need to change these details if the dates or learner need attention."
                  : "MyLearna uses the learner and current learning period to prepare this report. Start here only if the dates or learner need attention."
              }
              completionTone={step1Tone}
              completionText={
                selectedReport && selectedPeriod
                  ? "Step 1 complete - current learning record linked."
                  : "Step 1 incomplete - check the learner and current reporting period."
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
              secondaryAction={
                <button
                  type="button"
                  style={quietButtonStyle}
                  onClick={() => {
                    if (showPeriodManager) {
                      setShowPeriodManager(false);
                    } else {
                      openPeriodManager();
                    }
                  }}
                  disabled={submitting}
                  aria-expanded={showPeriodManager}
                >
                  {showPeriodManager
                    ? "Hide advanced date and reporting-period tools"
                    : "Advanced date and reporting-period tools"}
                </button>
              }
            >
              <div ref={reportSetupRef} style={{ display: "grid", gap: 16 }}>
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
                      This learning record is already linked to the current reporting period.
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
                        <div style={fieldLabelStyle}>Reporting period</div>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {selectedPeriod ? selectedPeriod.title : "Not linked yet"}
                        </div>
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
                          ? "These details are already in place. Only change them if the learner, year, dates, or title need correcting."
                          : "Choose the learner and let MyLearna use the current learning period by default. Only edit the title if you want a different name."}
                      </p>
                    </div>

                    <form onSubmit={handleReportSubmit} style={{ display: "grid", gap: 12 }}>
                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        }}
                      >
                        <div>
                          <label style={fieldLabelStyle}>Choose learner</label>
                          <select
                            value={reportLearnerId}
                            onChange={(event) => setReportLearnerId(event.target.value)}
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

                        <div>
                          <label style={fieldLabelStyle}>Choose reporting period</label>
                          <select
                            value={reportingPeriodId}
                            onChange={(event) => setReportingPeriodId(event.target.value)}
                            style={inputStyle}
                          >
                            <option value="">
                              {filteredPeriodsForReport.length
                                ? "Choose reporting period"
                                : reportLearnerId
                                ? `Use ${suggestedReportingPeriodDraft.title}`
                                : "Choose learner first"}
                            </option>
                            {filteredPeriodsForReport.map((period) => (
                              <option key={period.id} value={period.id}>
                                {period.title}
                              </option>
                            ))}
                          </select>
                          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>
                            Reports use your current learning period by default. You can adjust this if needed.
                            {!filteredPeriodsForReport.length && reportLearnerId
                              ? ` Default: ${suggestedReportingPeriodDraft.title} (${formatDateRange(
                                  suggestedReportingPeriodDraft.startsOn,
                                  suggestedReportingPeriodDraft.endsOn,
                                )}).`
                              : ""}
                          </div>
                        </div>
                      </div>

                      {showCustomReportTitle || editingReportId ? (
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
                          <strong style={{ color: "#0f172a" }}>Suggested title</strong>
                          <div style={{ color: "#475569", lineHeight: 1.6 }}>
                            {suggestedReportTitle || "Choose the learner and reporting period to build the title automatically."}
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
                      Open report details only when the learner, reporting period, or title need attention.
                    </p>
                  </div>
                )}

                <div
                  ref={periodManagerRef}
                  style={{
                    border: "1px dashed #dbe4f0",
                    borderRadius: 16,
                    padding: 16,
                    background: "#fcfdff",
                    display: "grid",
                    gap: 14,
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
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>Advanced date and reporting-period tools</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Only open this if the learning period dates or report window need adjusting.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        style={quietButtonStyle}
                        onClick={() => setShowPeriodManager((current) => !current)}
                        disabled={submitting}
                        aria-expanded={showPeriodManager}
                      >
                        {showPeriodManager
                          ? "Hide advanced date and reporting-period tools"
                          : "Advanced date and reporting-period tools"}
                      </button>
                      <button
                        type="button"
                        style={quietButtonStyle}
                        onClick={() => {
                          void reloadLearningPeriods();
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
                      <form onSubmit={handlePeriodSubmit} style={{ display: "grid", gap: 12 }}>
                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          }}
                        >
                          <div>
                            <label style={fieldLabelStyle}>Choose learner</label>
                            <select
                              value={periodLearnerId}
                              onChange={(event) => setPeriodLearnerId(event.target.value)}
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

                          <div>
                            <label style={fieldLabelStyle}>Reporting period title</label>
                            <input
                              value={periodTitle}
                              onChange={(event) => setPeriodTitle(event.target.value)}
                              placeholder="Term 2, Semester 1, Spring report"
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: 12,
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                          }}
                        >
                          <div>
                            <label style={fieldLabelStyle}>Starts on</label>
                            <input
                              type="date"
                              value={periodStartsOn}
                              onChange={(event) => setPeriodStartsOn(event.target.value)}
                              style={inputStyle}
                            />
                          </div>

                          <div>
                            <label style={fieldLabelStyle}>Ends on</label>
                            <input
                              type="date"
                              value={periodEndsOn}
                              onChange={(event) => setPeriodEndsOn(event.target.value)}
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button type="submit" style={buttonStyle} disabled={submitting}>
                            {submitting ? "Saving..." : editingPeriodId ? "Save period" : "Add reporting period"}
                          </button>
                          {editingPeriodId ? (
                            <button
                              type="button"
                              style={secondaryButtonStyle}
                              onClick={resetPeriodForm}
                              disabled={submitting}
                            >
                              Cancel edit
                            </button>
                          ) : null}
                        </div>
                      </form>

                      <div style={{ display: "grid", gap: 12 }}>
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
                                    style={secondaryButtonStyle}
                                    onClick={() => handleEditPeriod(period)}
                                    disabled={submitting}
                                  >
                                    Edit reporting period
                                  </button>
                                  <button
                                    type="button"
                                    style={destructiveButtonStyle}
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
                    <div style={helperCardStyle}>
                      <strong style={{ color: "#0f172a" }}>
                        {periods.length} reporting {periods.length === 1 ? "period is" : "periods are"} ready
                      </strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Keep this closed unless you need to add a new period or edit the dates for an existing one.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ReportBuildStepCard>

            {selectedReport ? (
              <>
                <ReportBuildStepCard
                  stepNumber={2}
                  title="Preview prepared learning record"
                  helperText="Check the prepared learning record before you send it to My Outputs or export PDF."
                  completionTone={step2Tone}
                  completionText={step2Text}
                  emphasis
                >
                  <div
                    ref={reportPreviewRef}
                    style={{
                      display: "grid",
                      gap: 20,
                    }}
                  >
                    <div style={helperCardStyle}>
                      <strong style={{ color: "#0f172a" }}>Prepared learning record preview</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        This preview shows the learner, reporting period, selected portfolio evidence, and any saved report content linked to this learning record.
                      </p>
                    </div>

                    <div
                      style={{
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
                              Learning record preview
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
                              Reporting period
                            </div>
                            <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
                              {selectedPeriod ? selectedPeriod.title : "Not set"}
                            </div>
                            <div style={{ color: "#475569", marginTop: 4, lineHeight: 1.6 }}>
                              {selectedPeriod
                                ? formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)
                                : "Choose the current reporting period for this learning record."}
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
                              Included highlights ready to support this report.
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
                        {portfolioLoading ? (
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                            Loading learning evidence...
                          </p>
                        ) : portfolioError ? (
                          <p style={{ margin: 0, color: "#b91c1c", lineHeight: 1.7 }}>
                            {portfolioError}
                          </p>
                        ) : portfolioItems.length ? (
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
                                  {item.evidence.learningArea ? ` | ${item.evidence.learningArea}` : ""}
                                </div>
                                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                  {summarizeEvidence(item)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                            No learning evidence matches this report yet. Add highlights in My Portfolio, then return here.
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
                            No saved report content is linked to this learning record yet. You can still review the learner, reporting period, and evidence before sending it to My Outputs.
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                </ReportBuildStepCard>

                <ReportBuildStepCard
                  stepNumber={3}
                  title={selectedReport.status === "ready" ? "Send to My Outputs" : "Prepare for My Outputs"}
                  helperText={
                    selectedReport.status === "ready"
                      ? "Open My Outputs when you want to export PDF or work with the finished learning record."
                      : "Preview the learning record, then send it to My Outputs when you are ready."
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
                        Go to My Outputs
                      </Link>
                    ) : reportCanMoveToOutput ? (
                      <button
                        type="button"
                        style={successButtonStyle}
                        onClick={() => void handleSendToOutputs()}
                        disabled={submitting}
                      >
                        Send to My Outputs
                      </button>
                    ) : undefined
                  }
                >
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>
                      {selectedReport.status === "ready"
                        ? "This learning record is already available in My Outputs."
                        : reportCanMoveToOutput
                          ? "The learning record is ready for the output step."
                          : "Finish the current learning record details first."}
                    </strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      {selectedReport.status === "ready"
                        ? "Go to My Outputs when you want to work with the finished learning record, or return the report to draft if you need more edits."
                        : reportCanMoveToOutput
                          ? "Use the preview one last time if you want, then send this learning record to My Outputs."
                          : "Choose the learner and current reporting period first, then return here to move into output."}
                    </p>
                  </div>
                </ReportBuildStepCard>

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
                    <div style={{ display: "grid", gap: 8 }}>
                      <h2 style={{ margin: 0, color: "#0f172a" }}>Advanced report customisation</h2>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Keep this closed for the simple output-preparation flow. More report editing options are planned for a later release.
                      </p>
                    </div>
                    <button
                      type="button"
                      style={quietButtonStyle}
                      onClick={() => setShowAdvancedCustomisation((current) => !current)}
                      aria-expanded={showAdvancedCustomisation}
                    >
                      {showAdvancedCustomisation
                        ? "Hide advanced report customisation"
                        : "Advanced report customisation - Coming later"}
                    </button>
                  </div>

                  {showAdvancedCustomisation ? (
                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        marginTop: 16,
                      }}
                    >
                      {[
                        {
                          title: "Add custom section",
                          detail: "Create extra report parts beyond the default learning record.",
                        },
                        {
                          title: "Change report structure",
                          detail: "Adjust the order or layout of the full report.",
                        },
                        {
                          title: "Alternative templates",
                          detail: "Switch to different report styles or proformas later on.",
                        },
                      ].map((item) => (
                        <div
                          key={item.title}
                          style={{
                            border: "1px dashed #cbd5e1",
                            borderRadius: 14,
                            padding: 14,
                            background: "#ffffff",
                            display: "grid",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                            <span
                              style={{
                                borderRadius: 999,
                                padding: "6px 10px",
                                background: "#eef2ff",
                                color: "#4338ca",
                                fontSize: 12,
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Coming later
                            </span>
                          </div>
                          <div style={{ color: "#64748b", lineHeight: 1.6 }}>{item.detail}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ ...helperCardStyle, marginTop: 16 }}>
                      <strong style={{ color: "#0f172a" }}>Coming later</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Custom sections, alternative structures, and deeper report editing are planned for a later release.
                      </p>
                    </div>
                  )}
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
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Other reports</h2>
                    <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                      Keep the active report above. Open this list only when you want to switch to another report.
                    </p>
                  </div>
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={() => setShowOtherReports((current) => !current)}
                    aria-expanded={showOtherReports}
                  >
                    {showOtherReports ? "Hide other reports" : `Show other reports (${otherReports.length})`}
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
                ) : (
                  <div style={{ ...helperCardStyle, marginTop: 16 }}>
                    <strong style={{ color: "#0f172a" }}>
                      {otherReports.length} other {otherReports.length === 1 ? "report is" : "reports are"} waiting
                    </strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Keep the focus on the active report above, then open this list only when you want to switch.
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
