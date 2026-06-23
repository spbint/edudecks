"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
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
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  deleteCleanEvidenceEntry,
} from "@/lib/clean/evidence/client";
import {
  listAssessmentLearningEvidenceEventsForLearners,
  type LearningEvidenceEvent,
} from "@/lib/clean/evidence/learningEvidenceEvents";
import {
  createCleanPortfolioHighlight,
  deleteCleanPortfolioHighlight,
  listCleanPortfolioItems,
} from "@/lib/clean/portfolio/client";
import {
  buildReportPdfEvidenceItems,
  getParentFacingEvidenceSummary,
  getEvidencePresentationMeta,
  getEvidencePreviewImage,
} from "@/lib/clean/portfolio/evidencePresentation";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";
import { parseAssessmentEvidenceLinkFromNodeIds } from "@/lib/clean/assessments/client";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import { parsePathwayContextFromNodeIds } from "@/lib/clean/evidence/curriculumContext";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type { CleanProgram, CleanProgramSegment } from "@/lib/clean/programs/types";
import {
  buildCleanReportPdfFilename,
  generateCleanReportPdfBytes,
} from "@/lib/clean/outputs/pdf";
import type { CleanReport } from "@/lib/clean/reports/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "clamp(14px, 3vw, 24px) clamp(10px, 3vw, 18px) 40px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1080,
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

const helperCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 14,
  background: "#f8fbff",
  padding: 14,
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
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
};

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function formatEvidenceEventDateLabel(value: string | null) {
  const normalizedValue = String(value ?? "").trim();
  if (!normalizedValue) return "Date not recorded";

  const date = new Date(normalizedValue);
  if (Number.isNaN(date.getTime())) return normalizedValue.slice(0, 10) || normalizedValue;

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function portfolioCardTitle(item: CleanPortfolioItem) {
  return item.evidence.title || item.evidence.whatHappened;
}

function sortPortfolioItems(items: CleanPortfolioItem[]) {
  return [...items].sort((left, right) => {
    if (left.isHighlighted !== right.isHighlighted) {
      return left.isHighlighted ? 1 : -1;
    }

    const observedCompare = right.evidence.observedOn.localeCompare(left.evidence.observedOn);
    if (observedCompare !== 0) return observedCompare;

    const leftCreated = Date.parse(left.evidence.createdAt || left.evidence.updatedAt || "");
    const rightCreated = Date.parse(right.evidence.createdAt || right.evidence.updatedAt || "");

    if (!Number.isNaN(leftCreated) || !Number.isNaN(rightCreated)) {
      if (Number.isNaN(leftCreated)) return 1;
      if (Number.isNaN(rightCreated)) return -1;
      if (leftCreated !== rightCreated) return rightCreated - leftCreated;
    }

    return left.evidence.id.localeCompare(right.evidence.id);
  });
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

function CleanPortfolioWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedLearningArea, setSelectedLearningArea] = useState("");
  const [selectionFilter, setSelectionFilter] = useState<
    "all" | "selected" | "not-selected"
  >("all");
  const [pathwayFilter, setPathwayFilter] = useState<
    "all" | "pathway-only" | "repeated-step"
  >("all");
  const [items, setItems] = useState<CleanPortfolioItem[]>([]);
  const [assessmentEvidenceEvents, setAssessmentEvidenceEvents] = useState<
    LearningEvidenceEvent[]
  >([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [calendarItems, setCalendarItems] = useState<CleanCalendarItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<CleanPortfolioItem | null>(null);
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
  const learnerIdFromQuery = searchParams.get("learner_id") || searchParams.get("learnerId") || "";
  const latestEvidenceIdFromQuery =
    searchParams.get("latestEvidenceId") || searchParams.get("evidence_entry_id") || "";
  const sourceFromQuery = searchParams.get("source") || "";
  const learnerLabelById = useMemo(
    () => new Map(learnerOptions.map((option) => [option.value, option.label])),
    [learnerOptions],
  );

  const capturePathBase = pathname.startsWith("/clean-my-portfolio")
    ? "/clean-my-capture"
    : "/my-capture";
  const reportsPathBase = pathname.startsWith("/clean-my-portfolio")
    ? "/clean-my-reports"
    : "/my-reports";

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
  const learningAreaOptions = useMemo(
    () =>
      [...new Set(items.map((item) => (item.evidence.learningArea || "").trim()).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right)),
    [items],
  );
  const pathwayEvidenceSummary = useMemo(() => {
    const stepByEvidenceId = new Map<string, PathwayStepEvidenceMeta>();
    const stepCounts = new Map<string, { label: string; count: number }>();

    for (const item of items) {
      const meta = getPathwayStepEvidenceMeta(item);
      if (!meta) continue;

      stepByEvidenceId.set(item.evidence.id, meta);
      const current = stepCounts.get(meta.key);
      stepCounts.set(meta.key, {
        label: meta.label,
        count: current ? current.count + 1 : 1,
      });
    }

    const repeatedSteps = [...stepCounts.values()].filter((step) => step.count > 1);

    return {
      stepByEvidenceId,
      stepCounts,
      repeatedSteps,
    };
  }, [items]);
  const filteredItems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return items.filter((item) => {
      const pathwayMeta = pathwayEvidenceSummary.stepByEvidenceId.get(item.evidence.id) ?? null;
      const repeatedPathwayStep = pathwayMeta
        ? (pathwayEvidenceSummary.stepCounts.get(pathwayMeta.key)?.count ?? 0) > 1
        : false;

      if (
        selectedLearningArea &&
        (item.evidence.learningArea || "").trim() !== selectedLearningArea
      ) {
        return false;
      }

      if (selectionFilter === "selected" && !item.isHighlighted) return false;
      if (selectionFilter === "not-selected" && item.isHighlighted) return false;

      if (pathwayFilter === "pathway-only" && !pathwayMeta) return false;
      if (pathwayFilter === "repeated-step" && !repeatedPathwayStep) return false;

      if (!normalizedSearch) return true;

      const searchHaystack = [
        item.evidence.title,
        item.evidence.whatHappened,
        item.evidence.reflection,
        item.evidence.learningArea,
        pathwayMeta?.label,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");

      return searchHaystack.includes(normalizedSearch);
    });
  }, [
    items,
    pathwayEvidenceSummary.stepByEvidenceId,
    pathwayEvidenceSummary.stepCounts,
    pathwayFilter,
    searchText,
    selectedLearningArea,
    selectionFilter,
  ]);
  const sortedFilteredItems = useMemo(
    () => sortPortfolioItems(filteredItems),
    [filteredItems],
  );
  const filteredPathwayEvidenceSummary = useMemo(() => {
    const stepByEvidenceId = new Map<string, PathwayStepEvidenceMeta>();
    const stepCounts = new Map<string, { label: string; count: number }>();

    for (const item of filteredItems) {
      const meta = getPathwayStepEvidenceMeta(item);
      if (!meta) continue;

      stepByEvidenceId.set(item.evidence.id, meta);
      const current = stepCounts.get(meta.key);
      stepCounts.set(meta.key, {
        label: meta.label,
        count: current ? current.count + 1 : 1,
      });
    }

    const repeatedSteps = [...stepCounts.values()].filter((step) => step.count > 1);

    return {
      stepByEvidenceId,
      stepCounts,
      repeatedSteps,
    };
  }, [filteredItems]);

  const reloadItems = useCallback(async () => {
    if (!workspace.profile) return;

    setItemsLoading(true);
    setItemsError(null);
    try {
      const learnerIds = selectedLearnerId
        ? [selectedLearnerId]
        : workspace.learners.map((learner) => learner.id);
      const [nextItems, nextPrograms, nextCalendarItems, nextAssessmentEvidenceEvents] = await Promise.all([
        listCleanPortfolioItems(workspace.profile.id, {
          learnerId: selectedLearnerId || null,
          portfolioIncludedOnly: true,
          limit: 50,
        }),
        listCleanPrograms(workspace.profile.id, { limit: 50 }),
        listCleanCalendarItems(workspace.profile.id, { limit: 80 }),
        listAssessmentLearningEvidenceEventsForLearners(workspace.profile.id, learnerIds, {
          limit: 100,
        }),
      ]);

      const nextProgramSegments = (
        await Promise.all(
          nextPrograms.map((program) =>
            listCleanProgramSegments(workspace.profile!.id, program.id),
          ),
        )
      ).flat();

      setItems(nextItems);
      setAssessmentEvidenceEvents(nextAssessmentEvidenceEvents);
      setPrograms(nextPrograms);
      setProgramSegments(nextProgramSegments);
      setCalendarItems(nextCalendarItems);
    } catch (error) {
      setItemsError(
        normalizeCleanErrorMessage(
          error,
          "We could not load your portfolio items just now.",
        ),
      );
    } finally {
      setItemsLoading(false);
    }
  }, [selectedLearnerId, workspace.learners, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setItems([]);
      setAssessmentEvidenceEvents([]);
      setPrograms([]);
      setProgramSegments([]);
      setCalendarItems([]);
      return;
    }

    void reloadItems();
  }, [
    reloadItems,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (!learnerIdFromQuery) return;
    if (!learnerOptions.some((option) => option.value === learnerIdFromQuery)) return;
    setSelectedLearnerId(learnerIdFromQuery);
  }, [learnerIdFromQuery, learnerOptions]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void reloadItems();
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [reloadItems]);

  async function handleToggleHighlight(item: CleanPortfolioItem) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      if (item.highlight) {
        await deleteCleanPortfolioHighlight(workspace.profile.id, item.highlight.id);
        setMessage("Removed from portfolio.");
      } else {
        await createCleanPortfolioHighlight(workspace.profile.id, {
          learnerId: item.evidence.learnerId,
          evidenceEntryId: item.evidence.id,
        });
        setMessage(
          items.some((portfolioItem) => portfolioItem.highlight)
            ? "Added to portfolio."
            : "First portfolio item added. You've chosen a meaningful piece of learning evidence.",
        );
      }

      await reloadItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not update this portfolio selection.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDeleteEvidence() {
    if (!workspace.profile || !pendingDeleteItem) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      if (pendingDeleteItem.highlight) {
        await deleteCleanPortfolioHighlight(
          workspace.profile.id,
          pendingDeleteItem.highlight.id,
        );
      }

      await deleteCleanEvidenceEntry(
        workspace.profile.id,
        pendingDeleteItem.evidence.id,
      );

      setPendingDeleteItem(null);
      setMessage("Evidence deleted.");
      await reloadItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete this evidence note.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const readyForPortfolio =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const selectedLearnerLabel =
    learnerOptions.find((option) => option.value === selectedLearnerId)?.label || "";
  const quickRecordEvidenceItems = useMemo(
    () =>
      selectedLearnerId
        ? sortPortfolioItems(
            items.filter(
              (item) =>
                item.evidence.learnerId === selectedLearnerId &&
                item.evidence.includeInReport,
            ),
          )
        : [],
    [items, selectedLearnerId],
  );
  const quickRecordAssessmentEvidenceItems = useMemo(
    () =>
      selectedLearnerId
        ? assessmentEvidenceEvents.filter((event) => event.learnerId === selectedLearnerId)
        : [],
    [assessmentEvidenceEvents, selectedLearnerId],
  );
  const quickRecordPdfEvidenceItems = useMemo(
    () =>
      buildReportPdfEvidenceItems(quickRecordEvidenceItems, {
        calendarItemById,
        learnerLabelById,
        programLabelById,
        segmentLabelById,
        selectedLearnerLabel,
      }),
    [
      calendarItemById,
      learnerLabelById,
      programLabelById,
      quickRecordEvidenceItems,
      segmentLabelById,
      selectedLearnerLabel,
    ],
  );
  const justCapturedItem = useMemo(() => {
    if (latestEvidenceIdFromQuery) {
      return items.find((item) => item.evidence.id === latestEvidenceIdFromQuery) ?? null;
    }

    if (sourceFromQuery !== "my-capture" || !selectedLearnerId) return null;
    return sortPortfolioItems(
      items.filter((item) => item.evidence.learnerId === selectedLearnerId),
    )[0] ?? null;
  }, [items, latestEvidenceIdFromQuery, selectedLearnerId, sourceFromQuery]);
  const justCapturedMeta = justCapturedItem ? getEvidencePresentationMeta(justCapturedItem) : null;
  const justCapturedImage = justCapturedItem
    ? getEvidencePreviewImage(justCapturedItem.evidence)
    : null;
  const portfolioHeading = selectedLearnerLabel
    ? `${selectedLearnerLabel}'s portfolio`
    : "My Portfolio";

  async function handleDownloadLearningRecord() {
    if (!workspace.profile || !selectedLearnerId || !selectedLearnerLabel) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const observedDates = quickRecordEvidenceItems
        .map((item) => item.evidence.observedOn)
        .filter(Boolean)
        .sort();
      const startsOn = observedDates[0] || today;
      const endsOn = observedDates[observedDates.length - 1] || today;
      const title = `${selectedLearnerLabel} learning record`;
      const report: CleanReport = {
        id: "portfolio-learning-record",
        familyId: workspace.profile.id,
        learnerId: selectedLearnerId,
        reportingPeriodId: "portfolio-learning-record",
        title,
        status: "ready",
        createdByUserId: workspace.profile.createdByUserId,
        createdAt: null,
        updatedAt: null,
      };

      const pdfBytes = await generateCleanReportPdfBytes({
        report,
        learnerLabel: selectedLearnerLabel,
        reportingPeriod: {
          id: "portfolio-learning-record",
          familyId: workspace.profile.id,
          learnerId: selectedLearnerId,
          title: "Portfolio learning record",
          startsOn,
          endsOn,
          createdByUserId: workspace.profile.createdByUserId,
          createdAt: null,
          updatedAt: null,
        },
        sections: [],
        evidenceItems: quickRecordPdfEvidenceItems,
        assessmentEvidenceItems: quickRecordAssessmentEvidenceItems,
        preparedOnLabel: formatDateLabel(today),
        statusLabel: "Ready",
      });

      downloadPdf(
        pdfBytes,
        buildCleanReportPdfFilename(selectedLearnerLabel, "portfolio-learning-record"),
      );
      setMessage("Learning record PDF downloaded.");
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not create this learning record PDF right now.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={shellStyle}>
      <style jsx global>{`
        @media (max-width: 720px) {
          .mylearna-portfolio-learning-record-hub {
            padding: 14px !important;
          }

          .mylearna-portfolio-learning-record-hub p {
            display: none !important;
          }

          .mylearna-portfolio-learner-select.is-selected {
            min-height: 38px !important;
            font-size: 13px !important;
          }

          .mylearna-portfolio-download-record {
            width: 100% !important;
            min-height: 48px !important;
            font-size: 15px !important;
          }

          .mylearna-portfolio-just-captured {
            padding: 14px !important;
          }

          .mylearna-portfolio-review-progress {
            display: none !important;
          }

          .mylearna-portfolio-intro p,
          .mylearna-portfolio-filter-panel {
            display: none !important;
          }
        }
      `}</style>
      <div style={wrapStyle}>
        <CleanWorkflowRibbon />
        <CleanFirstRunSetupGate currentStep="portfolio" />
        <GuidanceSetupProgress
          stepId="portfolio"
          title="Review captured evidence."
          body="See how captured learning can become a clearer portfolio over time."
        />

        <CleanPageIntroVideo
          config={PAGE_INTRO_VIDEOS.myPortfolio}
          promptTitle="New to My Portfolio?"
          promptDescription="See how to choose the strongest learning moments."
        />

        <section className="mylearna-portfolio-intro" style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#64748b",
              }}
            >
              Best evidence
            </div>
            <h1 style={{ margin: 0, fontSize: 26, color: "#17204B", fontWeight: 650 }}>{portfolioHeading}</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Choose the moments that best show learning progress.
            </p>
            <div>
              <GuidancePageAction tourId="my-portfolio" />
            </div>
            {selectedLearnerLabel ? (
              <div
                style={{
                  marginTop: 4,
                  display: "inline-flex",
                  width: "fit-content",
                  border: "1px solid #dbeafe",
                  borderRadius: 999,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "6px 10px",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Active learner: {selectedLearnerLabel}
              </div>
            ) : null}
          </div>
        </section>

        {workspace.loading ? (
          <V2LoadingState
            title="Preparing portfolio"
            body="We are bringing together the learning moments saved for this family."
          />
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>
              {CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}
            </strong>
            <p style={{ margin: 0, color: "#475569" }}>
              Portfolio evidence is temporarily unavailable. Try again shortly.
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
              Create your family profile first, then build the portfolio.
            </p>
          </section>
        ) : null}

        {readyForPortfolio && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner before choosing portfolio evidence.
            </p>
          </section>
        ) : null}

        {readyForPortfolio && workspace.profile && workspace.learners.length ? (
          <>
            <section
              className="mylearna-portfolio-learning-record-hub"
              style={{
                ...cardStyle,
                borderColor: "#dbeafe",
                background: "#f8fbff",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 16,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: "#1d4ed8",
                      textTransform: "uppercase",
                    }}
                  >
                    Learning record
                  </div>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                    {selectedLearnerLabel
                      ? `Learning record for ${selectedLearnerLabel}`
                      : "Download a quick evidence PDF"}
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Use captured evidence directly from Portfolio. My Reports is still available for a fuller edited report.
                  </p>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {selectedLearnerLabel ? (
                      <>
                        <strong style={{ color: "#0f172a" }}>
                          {quickRecordEvidenceItems.length} evidence{" "}
                          {quickRecordEvidenceItems.length === 1 ? "item" : "items"} ready
                        </strong>
                        {" for this learning record"}
                        {" - "}
                        {quickRecordEvidenceItems.length} report-included evidence{" "}
                        {quickRecordEvidenceItems.length === 1 ? "item" : "items"}
                        {quickRecordAssessmentEvidenceItems.length
                          ? ` and ${quickRecordAssessmentEvidenceItems.length} pathway checks`
                          : ""}
                      </>
                    ) : (
                      "Choose one learner to download a learning record."
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                  <select
                    className={selectedLearnerId ? "mylearna-portfolio-learner-select is-selected" : "mylearna-portfolio-learner-select"}
                    value={selectedLearnerId}
                    onChange={(event) => setSelectedLearnerId(event.target.value)}
                    style={{
                      ...inputStyle,
                      minHeight: 44,
                      background: "#ffffff",
                    }}
                    aria-label="Choose learner for learning record"
                  >
                    <option value="">Choose learner</option>
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="mylearna-portfolio-download-record"
                    type="button"
                    style={{
                      ...buttonStyle,
                      minHeight: 46,
                      opacity:
                        selectedLearnerId &&
                        (quickRecordEvidenceItems.length ||
                          quickRecordAssessmentEvidenceItems.length)
                          ? 1
                          : 0.6,
                    }}
                    onClick={() => void handleDownloadLearningRecord()}
                    disabled={
                      submitting ||
                      !selectedLearnerId ||
                      (!quickRecordEvidenceItems.length &&
                        !quickRecordAssessmentEvidenceItems.length)
                    }
                  >
                    {submitting ? "Preparing PDF..." : "Download learning record"}
                  </button>
                  <Link
                    href={
                      selectedLearnerId
                        ? `${reportsPathBase}?learner_id=${selectedLearnerId}`
                        : reportsPathBase
                    }
                    style={{
                      ...secondaryButtonStyle,
                      minHeight: 44,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                    }}
                  >
                    Create full report
                  </Link>
                </div>
              </div>
            </section>

            {justCapturedItem && justCapturedMeta ? (
              <section
                className="mylearna-portfolio-just-captured"
                style={{
                  ...cardStyle,
                  borderColor: "#99f6e4",
                  background: "#f0fdfa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ display: "grid", gap: 8, minWidth: 0, flex: "1 1 260px" }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "#0f766e",
                        textTransform: "uppercase",
                      }}
                    >
                      Just captured
                    </div>
                    <h2 style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
                      {portfolioCardTitle(justCapturedItem)}
                    </h2>
                    <div style={{ color: "#0f766e", lineHeight: 1.6 }}>
                      {formatDateLabel(justCapturedItem.evidence.observedOn)}
                      {justCapturedItem.evidence.learningArea
                        ? ` - ${justCapturedItem.evidence.learningArea}`
                        : ""}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        Source: {justCapturedMeta.sourceLabel}
                      </span>
                      {justCapturedMeta.progressLevel ? (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "4px 10px",
                            background: "#f0fdf4",
                            color: "#166534",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {justCapturedMeta.progressLevel}
                        </span>
                      ) : null}
                      {justCapturedMeta.hasAttachment ? (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "4px 10px",
                            background: "#ccfbf1",
                            color: "#0f766e",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          Photo attached
                        </span>
                      ) : null}
                      {justCapturedItem.evidence.includeInReport ? (
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "4px 10px",
                            background: "#f5f3ff",
                            color: "#6d28d9",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          Reports
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {justCapturedImage ? (
                    <EvidenceThumbnail
                      image={justCapturedImage}
                      width={180}
                      height={120}
                      title="Evidence photo"
                    />
                  ) : null}
                </div>
              </section>
            ) : null}

            <section
              className="mylearna-portfolio-review-progress"
              data-guidance-id="portfolio-review-progress"
              style={cardStyle}
            >
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a", fontWeight: 650 }}>Portfolio</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Choose the strongest examples from captured evidence.
                  </p>
                </div>
                <div style={helperCardStyle}>
                  <strong style={{ color: "#0f172a", fontWeight: 650 }}>What belongs here?</strong>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#475569", lineHeight: 1.7 }}>
                    <li>Shows clear progress</li>
                    <li>Demonstrates independence</li>
                    <li>Links to an important pathway or curriculum area</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mylearna-portfolio-filter-panel" data-guidance-id="portfolio-filter-learner" style={cardStyle}>
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
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20, fontWeight: 650 }}>Portfolio filters</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Find the best pieces quickly.
                  </p>
                </div>
                <button
                  type="button"
                  style={buttonStyle}
                  onClick={() => void reloadItems()}
                  disabled={itemsLoading || submitting}
                >
                  {itemsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  }}
                >
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search title, note, or pathway step"
                    style={inputStyle}
                  />
                  <select
                    value={selectedLearnerId}
                    onChange={(event) => setSelectedLearnerId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All family</option>
                    {learnerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedLearningArea}
                    onChange={(event) => setSelectedLearningArea(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">All learning areas</option>
                    {learningAreaOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectionFilter}
                    onChange={(event) =>
                      setSelectionFilter(
                        event.target.value as "all" | "selected" | "not-selected",
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="all">All evidence</option>
                    <option value="selected">Selected for portfolio</option>
                    <option value="not-selected">Not selected yet</option>
                  </select>
                  <select
                    value={pathwayFilter}
                    onChange={(event) =>
                      setPathwayFilter(
                        event.target.value as "all" | "pathway-only" | "repeated-step",
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="all">All evidence types</option>
                    <option value="pathway-only">Pathway-linked only</option>
                    <option value="repeated-step">Several notes for one pathway step</option>
                  </select>
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={() => {
                      setSearchText("");
                      setSelectedLearningArea("");
                      setSelectionFilter("all");
                      setPathwayFilter("all");
                    }}
                    disabled={!searchText && !selectedLearningArea && selectionFilter === "all" && pathwayFilter === "all"}
                  >
                    Clear filters
                  </button>
                </div>
                <div style={{ marginTop: 12, color: "#64748b", lineHeight: 1.6 }}>
                  Showing <strong style={{ color: "#0f172a" }}>{filteredItems.length}</strong> of{" "}
                  <strong style={{ color: "#0f172a" }}>{items.length}</strong> evidence notes.
                </div>
              </div>
            </section>

            <section data-guidance-id="portfolio-evidence-list" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Pathway checks</h2>
              <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.6 }}>
                Completed checks are shown as report-ready assessment evidence. Portfolio selection for checks will come later.
              </p>
              {itemsLoading ? (
                <p style={{ margin: 0, color: "#475569" }}>Loading pathway checks...</p>
              ) : assessmentEvidenceEvents.length ? (
                <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
                  {assessmentEvidenceEvents.slice(0, 8).map((event) => {
                    const learnerLabel =
                      learnerOptions.find((option) => option.value === event.learnerId)?.label ||
                      "Unknown learner";

                    return (
                      <article
                        key={event.id}
                        style={{
                          border: "1px solid #dbeafe",
                          borderRadius: 14,
                          padding: 14,
                          background: "#f8fbff",
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
                            <strong style={{ color: "#0f172a" }}>{event.title}</strong>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {formatEvidenceEventDateLabel(event.evidenceDate)} - {learnerLabel}
                              {event.strand ? ` - ${event.strand}` : ""}
                            </div>
                          </div>
                          <span
                            style={{
                              border: "1px solid #bbf7d0",
                              borderRadius: 999,
                              padding: "5px 10px",
                              background: "#f0fdf4",
                              color: "#166534",
                              fontSize: 12,
                              fontWeight: 800,
                              alignSelf: "flex-start",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Report-ready
                          </span>
                        </div>
                        <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                          {event.summary}
                        </p>
                        <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6 }}>
                          Questions: {event.questionCount} | Correct: {event.correctCount} | More support: {event.supportRecommendedCount}
                          {event.notSureCount ? ` | Not sure: ${event.notSureCount}` : ""}
                          {event.parentJudgement ? ` | Parent judgement: ${event.parentJudgement}` : ""}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...helperCardStyle, marginBottom: 24 }}>
                  <strong style={{ color: "#0f172a" }}>No pathway checks yet</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Completed pathway checks can appear here as evidence for your portfolio.
                  </p>
                </div>
              )}

              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Captured evidence</h2>
              <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.6 }}>
                Unselected evidence is shown first so you can choose what belongs in the
                portfolio.
              </p>
              {filteredPathwayEvidenceSummary.repeatedSteps.length ? (
                <div style={{ ...helperCardStyle, marginBottom: 16 }}>
                  <strong style={{ color: "#0f172a" }}>
                    Choose the clearest evidence for repeated pathway steps
                  </strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    You have several evidence notes for the same pathway step. Choose the strongest example for your report.
                  </p>
                </div>
              ) : null}
              {itemsLoading ? (
                <p style={{ margin: 0, color: "#475569" }}>Loading portfolio cards...</p>
              ) : null}
              {itemsError ? <p style={{ margin: 0, color: "#b91c1c" }}>{itemsError}</p> : null}

              {!itemsLoading && !itemsError && !items.length ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  {selectedLearnerId
                    ? `No evidence is ready for ${learnerOptions.find((option) => option.value === selectedLearnerId)?.label || "this learner"}'s portfolio yet. Capture a useful note, observation, or work sample first.`
                    : "No evidence is ready for the portfolio yet. Capture a useful note, observation, or work sample first."}
                </p>
              ) : null}

              {!itemsLoading && !itemsError && items.length && !filteredItems.length ? (
                <p style={{ margin: 0, color: "#475569" }}>
                  No evidence matches these filters yet.
                </p>
              ) : null}

              {!itemsLoading && !itemsError && sortedFilteredItems.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {sortedFilteredItems.map((item) => {
                    const learnerLabel =
                      learnerOptions.find(
                        (option) => option.value === item.evidence.learnerId,
                      )?.label || "Unknown learner";
                    const pathwayMeta =
                      filteredPathwayEvidenceSummary.stepByEvidenceId.get(item.evidence.id) ??
                      null;
                    const repeatedPathwayStep = pathwayMeta
                      ? (filteredPathwayEvidenceSummary.stepCounts.get(pathwayMeta.key)?.count ??
                          0) > 1
                      : false;
                    const linkedProgram = item.evidence.programId
                      ? programLabelById.get(item.evidence.programId) ?? null
                      : null;
                    const linkedCalendarItem = item.evidence.calendarItemId
                      ? calendarItemById.get(item.evidence.calendarItemId) ?? null
                      : null;
                    const linkedSegment =
                      linkedCalendarItem?.programSegmentId
                        ? segmentLabelById.get(linkedCalendarItem.programSegmentId) ?? null
                        : null;
                    const evidenceMeta = getEvidencePresentationMeta(item);
                    const previewImage = getEvidencePreviewImage(item.evidence);

                    return (
                      <div
                        data-guidance-id="portfolio-evidence-card"
                        key={item.evidence.id}
                        style={{
                          border: item.isHighlighted
                            ? "2px solid #1d4ed8"
                            : "1px solid #e2e8f0",
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
                            <strong>{portfolioCardTitle(item)}</strong>
                            <div style={{ color: "#64748b", marginTop: 4 }}>
                              {formatDateLabel(item.evidence.observedOn)} - {learnerLabel}
                              {item.evidence.learningArea
                                ? ` - ${item.evidence.learningArea}`
                                : ""}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span
                            style={{
                              border: "1px solid #dbeafe",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              borderRadius: 999,
                              padding: "4px 9px",
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Source: {evidenceMeta.sourceLabel}
                          </span>
                          {evidenceMeta.progressLevel ? (
                            <span
                              style={{
                                border: "1px solid #bbf7d0",
                                background: "#f0fdf4",
                                color: "#166534",
                                borderRadius: 999,
                                padding: "4px 9px",
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              {evidenceMeta.progressLevel}
                            </span>
                          ) : null}
                          {evidenceMeta.hasAttachment ? (
                            <span
                              style={{
                                border: "1px solid #ccfbf1",
                                background: "#f0fdfa",
                                color: "#0f766e",
                                borderRadius: 999,
                                padding: "4px 9px",
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              Photo attached
                            </span>
                          ) : null}
                          {item.evidence.includeInReport ? (
                            <span
                              style={{
                                border: "1px solid #ddd6fe",
                                background: "#f5f3ff",
                                color: "#6d28d9",
                                borderRadius: 999,
                                padding: "4px 9px",
                                fontSize: 12,
                                fontWeight: 800,
                              }}
                            >
                              Reports
                            </span>
                          ) : null}
                        </div>
                        {previewImage ? (
                          <EvidenceThumbnail
                            image={previewImage}
                            title="Evidence photo"
                          />
                        ) : null}
                        <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>
                          {getParentFacingEvidenceSummary(item)}
                        </p>
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
                                Multiple notes for this step
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {linkedProgram || linkedSegment || linkedCalendarItem ? (
                          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                            {linkedProgram ? `Program: ${linkedProgram}` : ""}
                            {linkedProgram && linkedSegment ? " | " : ""}
                            {linkedSegment ? `Week / segment: ${linkedSegment}` : ""}
                            {(linkedProgram || linkedSegment) && linkedCalendarItem ? " | " : ""}
                            {linkedCalendarItem ? `Block: ${linkedCalendarItem.title}` : ""}
                          </div>
                        ) : null}
                        <div data-guidance-id="portfolio-reflection-note" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            style={{
                              ...buttonStyle,
                              background: item.isHighlighted ? "#1d4ed8" : "#0f172a",
                              borderColor: item.isHighlighted ? "#1d4ed8" : "#0f172a",
                            }}
                            onClick={() => void handleToggleHighlight(item)}
                            disabled={submitting}
                          >
                            {item.isHighlighted ? "Remove highlight" : "Highlight evidence"}
                          </button>
                          <Link
                            href={`${capturePathBase}?evidence_entry_id=${item.evidence.id}`}
                            style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                          >
                            Open capture
                          </Link>
                          {item.evidence.includeInReport ? (
                            <Link
                              href={`${reportsPathBase}?learner_id=${item.evidence.learnerId}&evidence_entry_id=${item.evidence.id}`}
                              style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                            >
                              Use in report
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            style={{
                              ...buttonStyle,
                              background: "#b91c1c",
                              borderColor: "#b91c1c",
                            }}
                            onClick={() => setPendingDeleteItem(item)}
                            disabled={submitting}
                          >
                            Delete evidence
                          </button>
                          {item.isHighlighted ? (
                            <span style={{ color: "#0f766e", fontWeight: 700 }}>
                              In portfolio
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <section data-guidance-id="portfolio-next-reports" style={cardStyle}>
              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Next step: My Reports</h2>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
                When portfolio evidence is ready, preview how it can become a clearer
                learning record in My Reports.
              </p>
              <GuidanceSetupNextAction
                stepId="portfolio"
                nextHref={reportsPathBase}
                label="Continue to My Reports"
                helperText="You have reviewed how portfolio evidence is gathered. Continue to report preview."
              />
              <Link href={reportsPathBase} style={buttonStyle}>
                Open My Reports
              </Link>
            </section>
          </>
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

        {pendingDeleteItem ? (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.35)",
              display: "grid",
              placeItems: "center",
              padding: 20,
              zIndex: 50,
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
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                  Delete this evidence note?
                </h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  This removes it from My Capture, Portfolio, Reports, and Outputs. This
                  cannot be undone.
                </p>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {portfolioCardTitle(pendingDeleteItem)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  style={secondaryButtonStyle}
                  onClick={() => setPendingDeleteItem(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: "#b91c1c",
                    borderColor: "#b91c1c",
                  }}
                  onClick={() => void handleConfirmDeleteEvidence()}
                  disabled={submitting}
                >
                  {submitting ? "Deleting..." : "Delete evidence"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanPortfolioWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanPortfolioWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
