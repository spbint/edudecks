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

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 6,
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

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#0f172a",
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

const reportSectionTemplates: ReportSectionTemplate[] = [
  {
    key: "learning-overview",
    label: "Learning overview",
    heading: "Learning overview",
    starterText:
      "What did this stage of learning look like overall?\n\nWhich themes, routines, or interests stood out most?\n\nWhat would help someone else understand the shape of this learning record?",
  },
  {
    key: "progress-and-growth",
    label: "Progress and growth",
    heading: "Progress and growth",
    starterText:
      "Where has the learner grown this period?\n\nWhat has become more confident or consistent?\n\nWhat evidence best shows that progress?",
  },
  {
    key: "evidence-summary",
    label: "Evidence summary",
    heading: "Evidence summary",
    starterText:
      "Which moments from My Capture and My Portfolio best support this report?\n\nWhat do those moments show about the learner's progress, interests, or effort?\n\nWhich evidence entries are most worth calling out here?",
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

function normalizeReportPartKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
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
  const [showOtherReports, setShowOtherReports] = useState(false);

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
  const activeReportRef = useRef<HTMLDivElement>(null);
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
  const highlightedPortfolioCount = useMemo(
    () => portfolioItems.filter((item) => item.isHighlighted).length,
    [portfolioItems],
  );
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
  const hasSectionWriting = sections.some((section) => section.content.trim());
  const guidedReportParts = useMemo(
    () =>
      reportSectionTemplates.map((template) => {
        const matchedSection =
          sections.find(
            (section) =>
              normalizeReportPartKey(section.sectionKey) === template.key ||
              normalizeReportPartKey(section.heading) === template.key,
          ) ?? null;

        return {
          template,
          section: matchedSection,
          started: Boolean(matchedSection),
          complete: Boolean(matchedSection?.content.trim()),
        };
      }),
    [sections],
  );
  const hasStartedPreparedParts = guidedReportParts.some((part) => part.started);
  const allPreparedPartsComplete =
    hasStartedPreparedParts && guidedReportParts.every((part) => part.complete);
  const additionalReportParts = useMemo(
    () =>
      sections.filter(
        (section) => !guidedReportParts.some((part) => part.section?.id === section.id),
      ),
    [guidedReportParts, sections],
  );
  const otherReports = useMemo(
    () => reports.filter((report) => report.id !== selectedReport?.id),
    [reports, selectedReport?.id],
  );
  const reportChecklist = useMemo<ReportChecklistItem[]>(() => {
    if (!selectedReport) return [];

    return [
      {
        key: "period",
        label: "Current learning record linked",
        done: Boolean(selectedPeriod),
        detail: selectedPeriod
          ? `${selectedPeriod.title} is linked to this learning record.`
          : "Check the learner and current school year or reporting year.",
      },
      {
        key: "evidence",
        label: "Learning evidence ready",
        done: portfolioItems.length > 0,
        detail:
          portfolioItems.length > 0
            ? `${portfolioItems.length} ${portfolioItems.length === 1 ? "evidence entry is" : "evidence entries are"} included, with ${highlightedPortfolioCount} ${highlightedPortfolioCount === 1 ? "portfolio highlight" : "portfolio highlights"} ready to support the report.`
            : "Review the learning evidence available from My Portfolio for this report.",
      },
      {
        key: "sections",
        label: "Prepared report parts started",
        done: hasStartedPreparedParts,
        detail:
          allPreparedPartsComplete
            ? "All prepared report parts are complete."
            : hasStartedPreparedParts
              ? "The prepared report parts are underway."
              : "Start the prepared report parts.",
      },
      {
        key: "content",
        label: "Report writing added",
        done: hasSectionWriting,
        detail: hasSectionWriting
          ? "At least one part of the report includes written content."
          : "Continue writing in the prepared report parts.",
      },
    ];
  }, [
    allPreparedPartsComplete,
    hasStartedPreparedParts,
    hasSectionWriting,
    highlightedPortfolioCount,
    portfolioItems.length,
    selectedPeriod,
    selectedReport,
  ]);
  const reportIsReadyToMark =
    Boolean(selectedReport) &&
    reportChecklist.length > 0 &&
    reportChecklist.every((item) => item.done);
  const nextReportGuidance = useMemo(() => {
    if (!selectedReport) {
      return "Start a report, then keep building it from the learning evidence already gathered for this family.";
    }

    if (selectedReport.status === "archived") {
      return "This report is archived. Return it to draft if you want to keep refining it.";
    }

    if (selectedReport.status === "ready") {
      return "This report is marked ready. Review the draft below and return it to draft if you need more changes.";
    }

    if (!selectedPeriod) {
      return "Check the current learning record details so the report year and dates are lined up.";
    }

    if (!portfolioItems.length) {
      return "Review the learning evidence already available from My Portfolio, then bring it into the report where it helps.";
    }

    if (!hasStartedPreparedParts) {
      return "Start the guided report. MyLearna will open the first prepared part for you.";
    }

    if (!allPreparedPartsComplete) {
      return "Continue writing through the prepared report parts, then review the preview below.";
    }

    return "Review the preview and mark the report ready when the wording feels complete.";
  }, [
    allPreparedPartsComplete,
    hasStartedPreparedParts,
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

  const openActiveReport = useCallback(() => {
    window.requestAnimationFrame(() => {
      scrollToRef(activeReportRef);
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

    setShowSectionComposer(false);
    setShowSectionAdvanced(false);
  }, [selectedReport]);

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
      setMessage("Report part saved.");
      await reloadSections();
      openPreview();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the report part.",
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
    openSectionComposer();
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
    setMessage("Evidence note added to this part. Save it when you're ready.");
    setActionError(null);
  }

  async function handleCopyEvidenceText(item: CleanPortfolioItem) {
    const learnerLabel =
      learnerOptions.find((option) => option.value === item.evidence.learnerId)?.label ||
      "Learner";
    const note = buildEvidenceNote(item, learnerLabel);

    try {
      await navigator.clipboard.writeText(note);
      setMessage("Evidence note copied. You can paste it into any report part.");
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
    setMessage(`Started "${template.label}".`);
    setActionError(null);
  }

  function handleOpenPreparedPart(
    template: ReportSectionTemplate,
    section: CleanReportSection | null,
    complete: boolean,
  ) {
    if (!selectedReport || !selectedPeriod) {
      openReportBuilder();
      return;
    }

    if (section) {
      handleEditSection(section);
      setMessage(
        complete ? `Reviewing "${template.label}".` : `Continuing "${template.label}".`,
      );
      setActionError(null);
      return;
    }

    handleStartTemplate(template);
  }

  function handleStartGuidedReport() {
    if (!selectedReport) {
      openReportBuilder();
      return;
    }

    if (!selectedPeriod) {
      openReportBuilder();
      return;
    }

    const nextUnwrittenPart = guidedReportParts.find(
      (part) => part.section && !part.complete,
    );

    if (nextUnwrittenPart?.section) {
      handleEditSection(nextUnwrittenPart.section);
      setMessage(`Continuing "${nextUnwrittenPart.template.label}".`);
      setActionError(null);
      return;
    }

    const nextMissingPart = guidedReportParts.find((part) => !part.started);

    if (nextMissingPart) {
      handleStartTemplate(nextMissingPart.template);
      return;
    }

    if (guidedReportParts[0]?.section) {
      handleOpenPreparedPart(
        guidedReportParts[0].template,
        guidedReportParts[0].section,
        guidedReportParts[0].complete,
      );
      return;
    }

    openPreview();
  }

  const introPrimaryAction = !selectedReport ? (
    <button type="button" style={buttonStyle} onClick={openReportBuilder}>
      Start report
    </button>
  ) : selectedReport.status === "ready" || reportIsReadyToMark ? (
    <button type="button" style={buttonStyle} onClick={openPreview}>
      Preview report
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
    <button type="button" style={buttonStyle} onClick={openActiveReport}>
      Continue report
    </button>
  );

  const step1Tone: CompletionTone =
    selectedReport && selectedPeriod ? "complete" : "incomplete";
  const step2Tone: CompletionTone = !selectedPeriod
    ? "locked"
    : portfolioItems.length
      ? "complete"
      : "incomplete";
  const step2Text = !selectedPeriod
    ? "Step 2 locked - finish Step 1 first."
    : portfolioItems.length
      ? `Step 2 complete - ${portfolioItems.length} learning ${portfolioItems.length === 1 ? "evidence entry is" : "evidence entries are"} ready.`
      : "Step 2 incomplete - review the learning evidence for this report.";
  const step3Tone: CompletionTone = !selectedPeriod
    ? "locked"
    : !hasStartedPreparedParts
      ? "incomplete"
      : allPreparedPartsComplete
        ? "complete"
        : "in-progress";
  const step4Tone: CompletionTone = !hasSectionWriting
    ? "locked"
    : selectedReport?.status === "ready"
      ? "complete"
      : "in-progress";
  const step4Text = !hasSectionWriting
    ? "Step 4 locked - finish your report parts first."
    : selectedReport?.status === "ready"
      ? "Step 4 complete - preview reviewed and ready for output."
      : "Step 4 in progress - preview your report before output.";
  const step5Tone: CompletionTone = selectedReport?.status === "ready"
    ? "complete"
    : reportIsReadyToMark
      ? "in-progress"
      : "locked";
  const step5Text = selectedReport?.status === "ready"
    ? "Step 5 complete - this report is ready for My Outputs."
    : reportIsReadyToMark
      ? "Step 5 in progress - preview your report, then mark it ready for output."
      : "Step 5 locked - preview your report before output.";
  const showPreparedPartWriter = showSectionComposer || sectionDraftStarted;
  const currentPreparedPartLabel = sectionHeading.trim() || "This part";
  const readinessSummaryItems = [
    ...reportChecklist.map((item) => ({
      label: item.label,
      detail: item.detail,
      tone: item.done ? ("complete" as const) : ("incomplete" as const),
    })),
    {
      label: "Preview report",
      detail: hasSectionWriting
        ? "Preview is available so you can review the full learning record."
        : "Finish your report parts first.",
      tone: hasSectionWriting
        ? selectedReport?.status === "ready"
          ? ("complete" as const)
          : ("in-progress" as const)
        : ("locked" as const),
    },
    {
      label: "Output PDF",
      detail:
        selectedReport?.status === "ready"
          ? "This report can move into My Outputs."
          : "Mark the report ready after preview when the wording feels complete.",
      tone:
        selectedReport?.status === "ready"
          ? ("complete" as const)
          : reportIsReadyToMark
            ? ("in-progress" as const)
            : ("locked" as const),
    },
  ];

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
              Build a clear learning report from the evidence you have saved in My Portfolio.
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
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Guided report builder</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.6 }}>
                    MyLearna guides you through each step. Complete one part, then move
                    to the next until your report is ready for preview and output.
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
                      : "Start with one learner and one reporting period. MyLearna will keep the next useful action in front of you."}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {introPrimaryAction}
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
                  </div>
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
                          : `This report belongs to ${selectedReportLearnerLabel}. Link the reporting period first so the evidence and writing stay lined up.`}
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
                        Current school year / reporting year
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
                        Sections
                      </div>
                      <div style={{ color: "#0f172a", fontWeight: 700 }}>
                        {sections.length} {sections.length === 1 ? "section" : "sections"}
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
                    ) : reportIsReadyToMark || selectedReport.status === "ready" ? (
                      <button type="button" style={buttonStyle} onClick={openPreview}>
                        Preview report
                      </button>
                    ) : !hasStartedPreparedParts ? (
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={selectedPeriod ? handleStartGuidedReport : openReportBuilder}
                      >
                        Start guided report
                      </button>
                    ) : (
                      <button type="button" style={buttonStyle} onClick={handleStartGuidedReport}>
                        Continue writing
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
                  Start with one learner and one reporting period. Once the first report exists,
                  MyLearna will guide the rest step by step.
                </p>
              </section>
            )}

            <ReportBuildStepCard
              stepNumber={1}
              title="Current learning record"
              helperText={
                selectedReport
                  ? "MyLearna uses the learner's current school year to prepare this report. You only need to change these details if the year or dates are wrong."
                  : "MyLearna uses the learner and current school year to prepare this report. Start here only if the year or dates need attention."
              }
              completionTone={step1Tone}
              completionText={
                selectedReport && selectedPeriod
                  ? "Step 1 complete - current learning record linked."
                  : "Step 1 incomplete - check the learner and current school year or reporting year."
              }
              action={
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => {
                    if (showReportBuilder) {
                      setShowReportBuilder(false);
                    } else {
                      openReportBuilder();
                    }
                  }}
                  disabled={submitting}
                >
                  {showReportBuilder ? "Hide report details" : selectedReport ? "Edit report details" : "Start report"}
                </button>
              }
              secondaryAction={
                <button
                  type="button"
                  style={secondaryButtonStyle}
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
                        <div style={fieldLabelStyle}>Current school year / reporting year</div>
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
                      border: "1px solid #e2e8f0",
                      borderRadius: 16,
                      padding: 16,
                      background: "#f8fafc",
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>
                        {editingReportId ? "Edit this report" : "Start this report"}
                      </strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Use the learner and reporting period the page already knows. Only edit the title if you want a different name.
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
                            <option value="">Choose reporting period</option>
                            {filteredPeriodsForReport.map((period) => (
                              <option key={period.id} value={period.id}>
                                {period.title}
                              </option>
                            ))}
                          </select>
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
                        <div style={helperCardStyle}>
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
                    <strong style={{ color: "#0f172a" }}>Report details are tucked away</strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Open this only when you want to change the learner, reporting period, or title.
                    </p>
                  </div>
                )}

                <div
                  ref={periodManagerRef}
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
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a" }}>Advanced date and reporting-period tools</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Add or adjust reporting periods only when the school year, dates, or report window need attention.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        style={secondaryButtonStyle}
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
                        style={secondaryButtonStyle}
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
                  title="Learning evidence"
                  helperText={
                    selectedPeriod
                      ? "Evidence captured in My Capture and saved in My Portfolio is automatically available for this report."
                      : "Choose the current learning record first so MyLearna can line the learning evidence up for this report."
                  }
                  completionTone={step2Tone}
                  completionText={
                    selectedPeriod && portfolioItems.length
                      ? "Step 2 complete - learning evidence is ready."
                      : step2Text
                  }
                  action={
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() => setShowEvidencePanel((current) => !current)}
                      disabled={submitting}
                      aria-expanded={showEvidencePanel}
                    >
                      {showEvidencePanel ? "Hide evidence review" : "Review evidence"}
                    </button>
                  }
                  secondaryAction={
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
                  }
                >
                  <div style={{ display: "grid", gap: 14 }}>
                    <div
                      style={{
                        ...helperCardStyle,
                        background: "#ffffff",
                        borderColor: "#dbeafe",
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>Learning evidence included in this report</strong>
                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        }}
                      >
                        <div>
                          <div style={fieldLabelStyle}>Evidence entries included</div>
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>
                            {portfolioItems.length} {portfolioItems.length === 1 ? "entry" : "entries"}
                          </div>
                        </div>
                        <div>
                          <div style={fieldLabelStyle}>Portfolio highlights included</div>
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>
                            {highlightedPortfolioCount} {highlightedPortfolioCount === 1 ? "highlight" : "highlights"}
                          </div>
                        </div>
                        <div>
                          <div style={fieldLabelStyle}>Report context</div>
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>
                            {selectedPeriod ? `${selectedReportLearnerLabel} - ${selectedPeriod.title}` : selectedReportLearnerLabel}
                          </div>
                        </div>
                      </div>
                    </div>

                    {showEvidencePanel || !portfolioItems.length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {portfolioLoading ? (
                          <p style={{ margin: 0, color: "#475569" }}>Loading learning evidence...</p>
                        ) : null}
                        {portfolioError ? (
                          <p style={{ margin: 0, color: "#b91c1c" }}>{portfolioError}</p>
                        ) : null}
                        {!portfolioLoading && !portfolioError && !portfolioItems.length ? (
                          <p style={{ margin: 0, color: "#475569" }}>
                            No learning evidence from My Portfolio matches this report yet.
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
                                    {item.evidence.learningArea ? ` - ${item.evidence.learningArea}` : ""}
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
                                    Add note to report part
                                  </button>
                                  <button
                                    type="button"
                                    style={{
                                      ...secondaryButtonStyle,
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
                      </div>
                    ) : (
                      <div style={helperCardStyle}>
                        <strong style={{ color: "#0f172a" }}>Learning evidence is ready when you need it</strong>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                          Open this step when you want to review the included evidence, pull a note into the report, or copy it into your own wording.
                        </p>
                      </div>
                    )}
                  </div>
                </ReportBuildStepCard>

                <ReportBuildStepCard
                  stepNumber={3}
                  title="Complete your report"
                  helperText="MyLearna has prepared the main parts of your learning record. Work through each part, then preview the report below."
                  completionTone={step3Tone}
                  completionText={
                    !selectedPeriod
                      ? "Step 3 locked - finish Step 1 first."
                      : !hasStartedPreparedParts
                        ? "Step 3 incomplete - start the prepared report parts."
                        : allPreparedPartsComplete
                          ? "Step 3 complete - report parts are ready."
                          : "Step 3 in progress - continue the prepared report parts."
                  }
                  action={
                    !selectedPeriod ? (
                      <button type="button" style={buttonStyle} onClick={openReportBuilder}>
                        Check current learning record
                      </button>
                    ) : !hasStartedPreparedParts ? (
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={handleStartGuidedReport}
                        disabled={submitting}
                      >
                        Start guided report
                      </button>
                    ) : !allPreparedPartsComplete ? (
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={handleStartGuidedReport}
                        disabled={submitting}
                      >
                        Continue writing
                      </button>
                    ) : undefined
                  }
                >
                  <div style={{ display: "grid", gap: 16 }}>
                    <div
                      style={{
                        ...helperCardStyle,
                        background: "#ffffff",
                        borderColor: "#dbeafe",
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>Prepared report parts</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        MyLearna has already prepared these parts for you. Open each one when you are ready to add or review your wording.
                      </p>
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      {guidedReportParts.map((part, index) => {
                        const partTone: CompletionTone = part.complete
                          ? "complete"
                          : part.started
                            ? "in-progress"
                            : "incomplete";
                        const partStatusLabel = part.complete
                          ? "Complete"
                          : part.started
                            ? "In progress"
                            : "Not started";
                        const partActionLabel = part.complete
                          ? "Review"
                          : part.started
                            ? "Continue"
                            : "Start";

                        return (
                          <section
                            key={part.template.key}
                            style={{
                              border: "1px solid #dbeafe",
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
                                alignItems: "flex-start",
                                gap: 12,
                                flexWrap: "wrap",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  alignItems: "flex-start",
                                  flex: "1 1 320px",
                                }}
                              >
                                <div
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 999,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    fontWeight: 800,
                                    flexShrink: 0,
                                  }}
                                >
                                  {index + 1}
                                </div>
                                <div style={{ display: "grid", gap: 6 }}>
                                  <strong style={{ color: "#0f172a" }}>{part.template.label}</strong>
                                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                    {part.complete
                                      ? `${part.template.label} is complete and ready to review.`
                                      : part.started
                                        ? `${part.template.label} is in progress.`
                                        : `${part.template.label} is prepared for you.`}
                                  </p>
                                </div>
                              </div>

                              <span
                                style={{
                                  ...completionToneStyles(partTone),
                                  borderRadius: 999,
                                  padding: "8px 12px",
                                  fontSize: 13,
                                  fontWeight: 800,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {partStatusLabel}
                              </span>
                            </div>

                            <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                              {part.section?.content.trim()
                                ? summarizeSectionContent(part.section.content)
                                : "Starter prompts are ready when you open this part."}
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                              <button
                                type="button"
                                style={secondaryButtonStyle}
                                onClick={() =>
                                  handleOpenPreparedPart(
                                    part.template,
                                    part.section,
                                    part.complete,
                                  )
                                }
                                disabled={submitting || !selectedPeriod}
                              >
                                {partActionLabel}
                              </button>
                            </div>
                          </section>
                        );
                      })}
                    </div>

                    {showPreparedPartWriter ? (
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
                            <strong style={{ color: "#0f172a" }}>Write this part</strong>
                            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                              Add your wording for this part of the learning record. MyLearna keeps the report structure in order.
                            </p>
                          </div>

                          <button
                            type="button"
                            style={secondaryButtonStyle}
                            onClick={() => {
                              resetSectionForm();
                              setShowSectionComposer(false);
                            }}
                            disabled={submitting}
                          >
                            Hide writer
                          </button>
                        </div>

                        <form onSubmit={handleSectionSubmit} style={{ display: "grid", gap: 12 }}>
                          <div>
                            <label style={fieldLabelStyle}>Report part</label>
                            <input
                              value={currentPreparedPartLabel}
                              readOnly
                              style={{
                                ...inputStyle,
                                background: "#f8fafc",
                                color: "#334155",
                              }}
                            />
                          </div>

                          <div>
                            <label style={fieldLabelStyle}>Your wording</label>
                            <textarea
                              value={sectionContent}
                              onChange={(event) => setSectionContent(event.target.value)}
                              placeholder="Write this part in your own words. Bring in learning evidence when it helps the learning record read clearly."
                              style={textAreaStyle}
                            />
                          </div>

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <button type="submit" style={buttonStyle} disabled={submitting}>
                              {submitting ? "Saving..." : "Save part"}
                            </button>
                            <button
                              type="button"
                              style={secondaryButtonStyle}
                              onClick={() => setShowSectionAdvanced((current) => !current)}
                              disabled={submitting}
                            >
                              {showSectionAdvanced ? "Hide advanced part options" : "Show advanced part options"}
                            </button>
                            <button
                              type="button"
                              style={secondaryButtonStyle}
                              onClick={() => {
                                resetSectionForm();
                                setShowSectionComposer(false);
                              }}
                              disabled={submitting}
                            >
                              Close writer
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
                              <strong style={{ color: "#0f172a" }}>Advanced part options</strong>
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                MyLearna keeps the report structure in order. Only change these details if you need this part to read differently.
                              </p>
                              <div style={{ display: "grid", gap: 12 }}>
                                <div>
                                  <label style={fieldLabelStyle}>Part title</label>
                                  <input
                                    value={sectionHeading}
                                    onChange={(event) => setSectionHeading(event.target.value)}
                                    placeholder="Learning overview"
                                    style={inputStyle}
                                  />
                                </div>
                                <div>
                                  <label style={fieldLabelStyle}>Part order</label>
                                  <input
                                    type="number"
                                    value={sectionSortOrder}
                                    onChange={(event) => setSectionSortOrder(event.target.value)}
                                    placeholder="Part order"
                                    style={inputStyle}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </form>
                      </section>
                    ) : null}

                    {additionalReportParts.length ? (
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
                        <div style={{ display: "grid", gap: 4 }}>
                          <strong style={{ color: "#0f172a" }}>Additional saved report parts</strong>
                          <div style={{ color: "#475569", lineHeight: 1.6 }}>
                            These saved parts still appear in the preview and can be reviewed here if you need them.
                          </div>
                        </div>

                        <div style={{ display: "grid", gap: 12 }}>
                          {additionalReportParts.map((section) => (
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
                                  <strong>{section.heading}</strong>
                                  <div style={{ color: "#64748b", fontSize: 13 }}>
                                    {section.content.trim() ? "Saved writing is in place." : "Saved as a title only."}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  style={secondaryButtonStyle}
                                  onClick={() => handleEditSection(section)}
                                  disabled={submitting}
                                >
                                  Review
                                </button>
                              </div>
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                {summarizeSectionContent(section.content)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null}

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
                      <strong style={{ color: "#0f172a" }}>Learning evidence is ready</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        Use learning evidence when it helps your wording. Evidence is managed in My Capture and My Portfolio.
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => setShowEvidencePanel(true)}
                          disabled={submitting}
                        >
                          Review learning evidence
                        </button>
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
                      </div>
                    </aside>

                    <section
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 16,
                        padding: 16,
                        background: "#f8fafc",
                        display: "grid",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "grid", gap: 6 }}>
                        <strong style={{ color: "#0f172a" }}>Advanced report customisation</strong>
                        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                          Custom sections and alternative report structures are planned for a later release. This phase keeps reports simple and guided.
                        </p>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        }}
                      >
                        {[
                          {
                            title: "Add custom section",
                            detail: "Create extra report parts beyond the guided learning record.",
                          },
                          {
                            title: "Change report structure",
                            detail: "Adjust the order or shape of the full report.",
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
                    </section>
                  </div>
                </ReportBuildStepCard>

                <ReportBuildStepCard
                  stepNumber={4}
                  title="Review and preview"
                  helperText="This preview shows how the learning record will read before you move to output."
                  completionTone={step4Tone}
                  completionText={step4Text}
                  action={
                    hasSectionWriting ? (
                      <button type="button" style={buttonStyle} onClick={openPreview}>
                        Preview report
                      </button>
                    ) : undefined
                  }
                >
                  <div
                    ref={reportPreviewRef}
                    style={{
                      display: "grid",
                      gap: 16,
                    }}
                  >
                    <div style={helperCardStyle}>
                      <strong style={{ color: "#0f172a" }}>Draft report preview</strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                        This preview shows the learner, current reporting year, learning evidence, and the report parts you have written so far.
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
                              Current school year / reporting year
                            </div>
                            <div style={{ color: "#0f172a", fontSize: 16, fontWeight: 700 }}>
                              {selectedPeriod ? selectedPeriod.title : "Not set"}
                            </div>
                            <div style={{ color: "#475569", marginTop: 4, lineHeight: 1.6 }}>
                              {selectedPeriod
                                ? formatDateRange(selectedPeriod.startsOn, selectedPeriod.endsOn)
                                : "Choose the current reporting year for this learning record."}
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
                            Start the guided report to begin shaping this learning record. The preview will show each section here as the draft grows.
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                </ReportBuildStepCard>

                <ReportBuildStepCard
                  stepNumber={5}
                  title={reportIsReadyToMark || selectedReport.status === "ready" ? "Your report is ready for output" : "Output"}
                  helperText={
                    reportIsReadyToMark || selectedReport.status === "ready"
                      ? "Preview the learning record, then send it to My Outputs when you are ready."
                      : "Finish the steps above, then preview the report before moving it into output."
                  }
                  completionTone={step5Tone}
                  completionText={step5Text}
                  emphasis={reportIsReadyToMark || selectedReport.status === "ready"}
                  action={
                    hasSectionWriting ? (
                      <button type="button" style={buttonStyle} onClick={openPreview}>
                        Preview report
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
                    ) : reportIsReadyToMark ? (
                      <button
                        type="button"
                        style={successButtonStyle}
                        onClick={() => void handleUpdateReportStatus(selectedReport, "ready")}
                        disabled={submitting}
                      >
                        Mark ready
                      </button>
                    ) : undefined
                  }
                >
                  <div style={helperCardStyle}>
                    <strong style={{ color: "#0f172a" }}>
                      {selectedReport.status === "ready"
                        ? "This report is already in a ready state."
                        : reportIsReadyToMark
                          ? "The key pieces are in place."
                          : "The output step unlocks after preview."}
                    </strong>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      {selectedReport.status === "ready"
                        ? "Go to My Outputs when you want to work with the finished learning record, or return the report to draft if you need more edits."
                        : reportIsReadyToMark
                          ? "Preview the report once more, then mark it ready when the wording feels complete."
                          : "Keep moving through the reporting period, evidence, and report part steps above. MyLearna will point you here when the report is ready."}
                    </p>
                  </div>
                </ReportBuildStepCard>

                <section style={cardStyle}>
                  <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                    <h2 style={{ margin: 0, color: "#0f172a" }}>Report readiness</h2>
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      Use this quick summary when you want a calm check before preview or output.
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {readinessSummaryItems.map((item) => (
                      <CompletionRow
                        key={item.label}
                        tone={item.tone}
                        text={`${item.label} - ${item.detail}`}
                      />
                    ))}
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
                                  ? "Preview report"
                                  : report.status === "archived"
                                    ? "Review archived report"
                                    : "Continue writing"}
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
