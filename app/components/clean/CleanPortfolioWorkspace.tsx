"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import CleanWorkflowRibbon from "@/app/components/clean/CleanWorkflowRibbon";
import CoreJourneyCue, {
  CoreJourneyHelp,
} from "@/app/components/clean/design-v2/CoreJourneyCue";
import EvidenceThumbnail from "@/app/components/clean/evidence/EvidenceThumbnail";
import CleanLearningMomentShareCard from "@/app/components/clean/CleanLearningMomentShareCard";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
import {
  GuidancePageAction,
  GuidanceSetupProgress,
} from "@/app/components/clean/guidance/GuidanceToggle";
import { listCleanCalendarItems } from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  deleteCleanEvidenceEntry,
  updateCleanEvidenceEntry,
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
import { buildPortfolioLearningStory } from "@/lib/clean/portfolio/learningStory";
import { parseAssessmentEvidenceLinkFromNodeIds } from "@/lib/clean/assessments/client";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import {
  buildPathwayCaptureContext,
  parsePathwayContextFromNodeIds,
  removePortfolioPathwayLinkNodeIds,
  replacePortfolioPathwayLinkNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import {
  getAllPathwaySteps,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type { CleanProgram, CleanProgramSegment } from "@/lib/clean/programs/types";
import {
  buildCleanLearningRecordPdfFilename,
  generateCleanReportPdfBytes,
  type CleanReportPdfGenerationMetrics,
} from "@/lib/clean/outputs/pdf";
import type { CleanReport } from "@/lib/clean/reports/types";
import { trackCoreJourneyEvent, trackProductEvent } from "@/lib/clean/analytics/productAnalytics";

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
  const { user } = useAuthUser();
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
  const [linkingItem, setLinkingItem] = useState<CleanPortfolioItem | null>(null);
  const [selectedPathwayStepId, setSelectedPathwayStepId] = useState("");
  const [selectedPathwaySubjectKey, setSelectedPathwaySubjectKey] = useState("");
  const [selectedPathwayStrandKey, setSelectedPathwayStrandKey] = useState("");
  const [selectedPathwayStageKey, setSelectedPathwayStageKey] = useState("");
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const openedEvidenceIdsRef = useRef(new Set<string>());
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pathwaySteps = useMemo(() => getAllPathwaySteps(), []);
  const pathwaySubjects = useMemo(
    () => Array.from(new Map(pathwaySteps.map((step) => [step.subjectKey, step])).values()),
    [pathwaySteps],
  );
  const pathwayStrands = useMemo(
    () => Array.from(new Map(
      pathwaySteps
        .filter((step) => step.subjectKey === selectedPathwaySubjectKey)
        .map((step) => [step.strandKey, step]),
    ).values()),
    [pathwaySteps, selectedPathwaySubjectKey],
  );
  const pathwayStages = useMemo(
    () => Array.from(new Map(
      pathwaySteps
        .filter(
          (step) =>
            step.subjectKey === selectedPathwaySubjectKey &&
            step.strandKey === selectedPathwayStrandKey,
        )
        .map((step) => [step.stageKey, step]),
    ).values()),
    [pathwaySteps, selectedPathwayStrandKey, selectedPathwaySubjectKey],
  );
  const pathwayStepOptions = useMemo(
    () =>
      pathwaySteps.filter(
        (step) =>
          step.subjectKey === selectedPathwaySubjectKey &&
          step.strandKey === selectedPathwayStrandKey &&
          step.stageKey === selectedPathwayStageKey,
      ),
    [pathwaySteps, selectedPathwayStageKey, selectedPathwayStrandKey, selectedPathwaySubjectKey],
  );

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
  const captureSourceSurface = ["pathways", "my_day", "calendar", "quick_capture", "general", "other_internal"].includes(searchParams.get("captureSource") || "")
    ? searchParams.get("captureSource") || "other_internal"
    : "other_internal";
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
  const createReportHref = selectedLearnerId
    ? `${reportsPathBase}?learner_id=${encodeURIComponent(selectedLearnerId)}&source=portfolio`
    : `${reportsPathBase}?source=portfolio`;

  function trackCreateReportSelected(source: "learning_record" | "next_step") {
    trackCoreJourneyEvent(
      "create_report_selected",
      {
        area: "my_portfolio",
        route: pathname,
        source,
        hasLearner: Boolean(selectedLearnerId),
        destination: "reports",
        sourceSurface: sourceFromQuery === "my-capture" ? captureSourceSurface : "other_internal",
      },
      user?.id,
    );
  }

  function openEvidence(item: CleanPortfolioItem) {
    if (expandedEvidenceId !== item.evidence.id && !openedEvidenceIdsRef.current.has(item.evidence.id)) {
      trackCoreJourneyEvent(
        "portfolio_evidence_opened",
        {
          area: "my_portfolio",
          route: pathname,
          sourceSurface: sourceFromQuery === "my-capture" ? captureSourceSurface : "other_internal",
          hasAttachment: getEvidencePresentationMeta(item).hasAttachment,
          isJustCaptured: item.evidence.id === latestEvidenceIdFromQuery,
        },
        user?.id,
      );
      openedEvidenceIdsRef.current.add(item.evidence.id);
    }
    setExpandedEvidenceId((current) => current === item.evidence.id ? null : item.evidence.id);
  }

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
  const portfolioLearningStory = useMemo(
    () => buildPortfolioLearningStory(items, selectedLearnerId || null),
    [items, selectedLearnerId],
  );
  const captureLearningHref = selectedLearnerId
    ? `${capturePathBase}?learner_id=${encodeURIComponent(selectedLearnerId)}`
    : capturePathBase;
  const learningStoryHighlights = portfolioLearningStory.highlights.slice(0, 3);
  const learningStoryRecentItems = portfolioLearningStory.recentItems
    .filter((item) => !item.isHighlighted)
    .slice(0, 3);
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
    if (learnerIdFromQuery || !latestEvidenceIdFromQuery || selectedLearnerId) return;
    const latestItem = items.find((item) => item.evidence.id === latestEvidenceIdFromQuery);
    if (!latestItem?.evidence.learnerId) return;
    if (!learnerOptions.some((option) => option.value === latestItem.evidence.learnerId)) return;
    setSelectedLearnerId(latestItem.evidence.learnerId);
  }, [items, latestEvidenceIdFromQuery, learnerIdFromQuery, learnerOptions, selectedLearnerId]);

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
        pendingDeleteItem.evidence.learnerId,
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

  function openPathwayLink(item: CleanPortfolioItem) {
    const existingContext = parsePathwayContextFromNodeIds(item.evidence.curriculumNodeIds);
    const existingStep = pathwaySteps.find(
      (step) => step.id === existingContext?.pathwayStepId,
    );
    const exactSubjectMatch = pathwaySubjects.find((subject) => {
      const learningArea = String(item.evidence.learningArea ?? "").trim().toLowerCase();
      return learningArea === subject.subjectKey || learningArea === subject.subjectTitle.toLowerCase();
    });
    const subjectKey = existingStep?.subjectKey ?? exactSubjectMatch?.subjectKey ?? "";

    setLinkingItem(item);
    setSelectedPathwaySubjectKey(subjectKey);
    setSelectedPathwayStrandKey(existingStep?.strandKey ?? "");
    setSelectedPathwayStageKey(existingStep?.stageKey ?? "");
    setSelectedPathwayStepId(existingStep?.id ?? "");
    setActionError(null);
  }

  function closePathwayLink() {
    setLinkingItem(null);
    setSelectedPathwayStepId("");
  }

  function changePathwaySubject(subjectKey: string) {
    setSelectedPathwaySubjectKey(subjectKey);
    setSelectedPathwayStrandKey("");
    setSelectedPathwayStageKey("");
    setSelectedPathwayStepId("");
  }

  function changePathwayStrand(strandKey: string) {
    setSelectedPathwayStrandKey(strandKey);
    setSelectedPathwayStageKey("");
    setSelectedPathwayStepId("");
  }

  function changePathwayStage(stageKey: string) {
    setSelectedPathwayStageKey(stageKey);
    setSelectedPathwayStepId("");
  }

  async function savePathwayLink() {
    if (!workspace.profile || !linkingItem) return;
    const selectedStep = pathwaySteps.find((step) => step.id === selectedPathwayStepId);
    if (!selectedStep) {
      setActionError("Choose a Pathway step before saving.");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setActionError(null);
    try {
      const existingContext = parsePathwayContextFromNodeIds(linkingItem.evidence.curriculumNodeIds);
      const nextContext = buildPathwayCaptureContext({
        source: "my-pathways",
        subjectKey: selectedStep.subjectKey,
        subjectLabel: selectedStep.subjectTitle,
        pathwayKey: selectedStep.strandKey,
        pathwayLabel: selectedStep.pathwayLabel,
        stageKey: selectedStep.stageKey,
        stageLabel: selectedStep.stageTitle,
        pathwayStepId: selectedStep.id,
        stepKey: selectedStep.stepKey,
        stepNumber: selectedStep.legacyStepNumber,
        stepTitle: selectedStep.stepTitle,
        stepMeaning: selectedStep.stepDescription,
        skillFocus: selectedStep.skillFocus,
      });
      if (!nextContext) throw new Error("Could not prepare this Pathway link.");

      await updateCleanEvidenceEntry(workspace.profile.id, linkingItem.evidence.id, {
        curriculumNodeIds: replacePortfolioPathwayLinkNodeIds(
          linkingItem.evidence.curriculumNodeIds,
          nextContext,
        ),
      });
      const action = existingContext?.pathwayStepId
        ? existingContext.pathwayStepId === selectedStep.id
          ? "added"
          : "changed"
        : "added";
      trackProductEvent(`portfolio_pathway_link_${action}`, {
        surface: "portfolio",
        subject: selectedStep.subjectKey,
        strand: selectedStep.strandKey,
      }, user?.id);
      setMessage(action === "changed" ? "Pathway link changed." : "Linked to Pathway.");
      closePathwayLink();
      await reloadItems();
    } catch (error) {
      setActionError(normalizeCleanErrorMessage(error, "We could not link this evidence to a Pathway step."));
    } finally {
      setSubmitting(false);
    }
  }

  async function removePathwayLink(item: CleanPortfolioItem) {
    if (!workspace.profile) return;
    setSubmitting(true);
    setMessage(null);
    setActionError(null);
    try {
      await updateCleanEvidenceEntry(workspace.profile.id, item.evidence.id, {
        curriculumNodeIds: removePortfolioPathwayLinkNodeIds(item.evidence.curriculumNodeIds),
      });
      trackProductEvent("portfolio_pathway_link_removed", { surface: "portfolio" }, user?.id);
      setMessage("Pathway link removed.");
      await reloadItems();
    } catch (error) {
      setActionError(normalizeCleanErrorMessage(error, "We could not remove this Pathway link."));
    } finally {
      setSubmitting(false);
    }
  }

  const readyForPortfolio =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const hasPortfolioEvidence = Boolean(workspace.setupStatus.hasPortfolioItem || items.length);
  const showPortfolioGuidance = !workspace.setupLoading && !hasPortfolioEvidence;
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
      }, {
        onTiming: (metrics: CleanReportPdfGenerationMetrics) => {
          trackProductEvent("learning_record_pdf_generated", {
            area: "my_portfolio",
            route: "/my-portfolio",
            surface: "portfolio",
            ...metrics,
          }, user?.id);
        },
      });

      downloadPdf(
        pdfBytes,
        buildCleanLearningRecordPdfFilename(selectedLearnerLabel, today),
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
          .mylearna-portfolio-learning-story,
          .mylearna-portfolio-learning-record-hub {
            padding: 14px !important;
          }

          .mylearna-portfolio-story-evidence {
            padding: 14px !important;
          }

          .mylearna-portfolio-learning-areas {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr);
          }

          .mylearna-portfolio-learning-areas > span,
          .mylearna-portfolio-story-evidence-button {
            min-height: 44px !important;
          }

          .mylearna-portfolio-story-evidence-button {
            width: 100%;
            text-align: left;
          }

          .mylearna-portfolio-learner-select.is-selected {
            min-height: 38px !important;
            font-size: 13px !important;
          }

          .mylearna-portfolio-download-record {
            width: 100% !important;
            min-height: 48px !important;
            font-size: 15px !important;
            border-color: #cbd5e1 !important;
            background: #ffffff !important;
            color: #17204b !important;
          }

          .mylearna-portfolio-secondary-action {
            min-height: 44px !important;
            border: 1px solid #cbd5e1 !important;
            background: #ffffff !important;
            color: #17204b !important;
          }

          .mylearna-portfolio-just-captured {
            padding: 14px !important;
          }

          .mylearna-portfolio-next-report a {
            width: 100% !important;
            min-height: 44px !important;
            justify-self: stretch !important;
          }

          .mylearna-portfolio-filter-details summary {
            min-height: 44px;
            display: flex;
            align-items: center;
            color: #4338ca;
            cursor: pointer;
            font-weight: 800;
          }

          .mylearna-portfolio-filter-details summary:focus-visible {
            border-radius: 8px;
            outline: 3px solid rgba(108, 77, 246, 0.35);
            outline-offset: 2px;
          }

          .mylearna-portfolio-filter-details:not([open]) > .mylearna-portfolio-filter-body {
            display: none;
          }
        }

        @media (min-width: 721px) {
          .mylearna-portfolio-filter-details summary {
            display: none;
          }

          .mylearna-portfolio-filter-details > .mylearna-portfolio-filter-body {
            display: block !important;
          }
        }
      `}</style>
      <div style={wrapStyle}>
        {showPortfolioGuidance ? (
          <>
            <CoreJourneyCue stage="portfolio" />
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
          </>
        ) : null}

        <section className="mylearna-portfolio-intro" style={cardStyle}>
          <div style={{ display: "grid", gap: hasPortfolioEvidence ? 4 : 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#64748b",
              }}
            >
              {showPortfolioGuidance ? "Best evidence" : "My Portfolio"}
            </div>
            <h1 style={{ margin: 0, fontSize: hasPortfolioEvidence ? 24 : 26, color: "#17204B", fontWeight: 650 }}>{portfolioHeading}</h1>
            {showPortfolioGuidance ? (
              <>
                <p style={{ margin: 0, color: "#334155", lineHeight: 1.6, fontWeight: 700 }}>
                  Choose your strongest learning moments.
                </p>
                <CoreJourneyHelp>
                  <p>Choose the moments that best show learning progress over time.</p>
                </CoreJourneyHelp>
                <div>
                  <GuidancePageAction tourId="my-portfolio" />
                </div>
              </>
            ) : null}
            <Link
              className="mylearna-portfolio-secondary-action"
              href={`${capturePathBase}?mode=quick&returnTo=${encodeURIComponent(pathname)}${selectedLearnerId ? `&learner_id=${encodeURIComponent(selectedLearnerId)}` : ""}`}
              style={{ ...buttonStyle, width: "fit-content", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              Add a learning moment
            </Link>
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
              className="mylearna-portfolio-learning-story"
              style={{
                ...cardStyle,
                borderColor: "#dbeafe",
                background: "#f8fbff",
                padding: hasPortfolioEvidence ? 12 : 18,
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
                    Learning story
                  </div>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                    {selectedLearnerLabel
                      ? `${selectedLearnerLabel}'s recent learning`
                      : "Your family's recent learning"}
                  </h2>
                  {!portfolioLearningStory.evidenceCount ? (
                    <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                      {selectedLearnerLabel
                        ? `Start ${selectedLearnerLabel}'s learning story with a short observation, work sample, or photo.`
                        : "Choose a learner, then capture a short observation, work sample, or photo to begin their learning story."}
                    </p>
                  ) : null}
                  {portfolioLearningStory.evidenceCount ? (
                    <div
                      className="mylearna-portfolio-story-metrics"
                      aria-label="Learning story summary"
                      style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                      }}
                    >
                      <div><strong style={{ color: "#0f172a", fontSize: 20 }}>{portfolioLearningStory.evidenceCount}</strong><div style={{ color: "#64748b", fontSize: 13 }}>Portfolio learning {portfolioLearningStory.evidenceCount === 1 ? "record" : "records"}</div></div>
                      <div><strong style={{ color: "#0f172a", fontSize: 20 }}>{portfolioLearningStory.learningAreaCount}</strong><div style={{ color: "#64748b", fontSize: 13 }}>Learning {portfolioLearningStory.learningAreaCount === 1 ? "area" : "areas"} represented</div></div>
                      <div><strong style={{ color: "#0f172a", fontSize: 15 }}>{portfolioLearningStory.latestObservedOn ? formatDateLabel(portfolioLearningStory.latestObservedOn) : "Not recorded"}</strong><div style={{ color: "#64748b", fontSize: 13 }}>Latest learning</div></div>
                    </div>
                  ) : null}
                  {portfolioLearningStory.learningAreas.length ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a", fontSize: 13 }}>Learning areas represented</strong>
                      <div className="mylearna-portfolio-learning-areas" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {portfolioLearningStory.learningAreas.map((area) => (
                          <span key={area.learningArea} style={{ borderRadius: 999, padding: "5px 10px", background: "#ffffff", border: "1px solid #dbeafe", color: "#1d4ed8", fontSize: 13, fontWeight: 700 }}>
                            {area.learningArea} — {area.recordCount} {area.recordCount === 1 ? "record" : "records"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
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
                    aria-label="Choose learner for learning story"
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
                    href={createReportHref}
                    onClick={() => trackCreateReportSelected("learning_record")}
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
                  <Link
                    href={captureLearningHref}
                    style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}
                  >
                    Capture learning
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
                {justCapturedImage ? (
                  <CleanLearningMomentShareCard
                    entry={justCapturedItem.evidence}
                    learnerLabel={selectedLearnerLabel}
                    imageUrl={justCapturedImage.url}
                    imageStoragePath={justCapturedImage.storagePath}
                    showTrigger
                  />
                ) : null}
              </section>
            ) : null}

            {portfolioLearningStory.evidenceCount ? (
              <section
                className="mylearna-portfolio-story-evidence"
                style={{
                  ...cardStyle,
                  display: "grid",
                  gap: 16,
                  borderColor: "#e2e8f0",
                }}
              >
                <div style={{ display: "grid", gap: 4 }}>
                  <div
                    style={{
                      color: "#64748b",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Learning story
                  </div>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
                    Highlights and recent learning
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
                    Open a learning record to see its full evidence, context, and actions.
                  </p>
                </div>

                {learningStoryHighlights.length ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <strong style={{ color: "#0f172a" }}>Featured evidence</strong>
                    <div style={{ display: "grid", gap: 8 }}>
                      {learningStoryHighlights.map((item) => (
                        <button
                          key={item.evidence.id}
                          className="mylearna-portfolio-story-evidence-button"
                          type="button"
                          onClick={() => openEvidence(item)}
                          style={{
                            ...secondaryButtonStyle,
                            display: "grid",
                            gap: 3,
                            justifyItems: "start",
                            padding: "10px 12px",
                          }}
                        >
                          <strong>{portfolioCardTitle(item)}</strong>
                          <span style={{ color: "#64748b", fontSize: 13 }}>
                            {formatDateLabel(item.evidence.observedOn)}
                            {item.evidence.learningArea ? ` - ${item.evidence.learningArea}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {learningStoryRecentItems.length ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <strong style={{ color: "#0f172a" }}>Recent learning</strong>
                    <div style={{ display: "grid", gap: 8 }}>
                      {learningStoryRecentItems.map((item) => (
                        <button
                          key={item.evidence.id}
                          className="mylearna-portfolio-story-evidence-button"
                          type="button"
                          onClick={() => openEvidence(item)}
                          style={{
                            ...secondaryButtonStyle,
                            display: "grid",
                            gap: 3,
                            justifyItems: "start",
                            padding: "10px 12px",
                          }}
                        >
                          <strong>{portfolioCardTitle(item)}</strong>
                          <span style={{ color: "#64748b", fontSize: 13 }}>
                            {formatDateLabel(item.evidence.observedOn)}
                            {item.evidence.learningArea ? ` - ${item.evidence.learningArea}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {showPortfolioGuidance ? <section
              className="mylearna-portfolio-review-progress"
              data-guidance-id="portfolio-review-progress"
              style={cardStyle}
            >
              <CoreJourneyHelp>
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
              </CoreJourneyHelp>
            </section> : null}

            <section className="mylearna-portfolio-filter-panel" data-guidance-id="portfolio-filter-learner" style={cardStyle}>
              <details className="mylearna-portfolio-filter-details">
                <summary>Filter portfolio</summary>
                <div className="mylearna-portfolio-filter-body">
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
                    <option value="selected">Featured</option>
                    <option value="not-selected">Not featured</option>
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
                </div>
              </details>
            </section>

            <section data-guidance-id="portfolio-evidence-list" style={cardStyle}>
              {assessmentEvidenceEvents.length || !hasPortfolioEvidence ? (
                <>
                  <h2 style={{ marginTop: 0, color: "#0f172a" }}>Pathway checks</h2>
                  <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.6 }}>
                    Recent pathway check-ins are shown here for reference alongside other
                    evidence notes.
                  </p>
                </>
              ) : null}
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
                          padding: 12,
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
              ) : !hasPortfolioEvidence ? (
                <div style={{ ...helperCardStyle, marginBottom: 24 }}>
                  <strong style={{ color: "#0f172a" }}>No pathway checks yet</strong>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Completed pathway checks can appear here as evidence for your portfolio.
                  </p>
                </div>
              ) : null}

              <h2 style={{ marginTop: 0, color: "#0f172a" }}>Captured evidence</h2>
              <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.6 }}>
                Everything shown here has been added to Portfolio. Feature the examples you
                want to stand out.
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
                  No learning moments match these filters.
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
                    const isExpanded = expandedEvidenceId === item.evidence.id;
                    const evidenceSummary = getParentFacingEvidenceSummary(item);

                    return (
                      <article
                        data-guidance-id="portfolio-evidence-card"
                        data-testid="portfolio-evidence-card"
                        key={item.evidence.id}
                        style={{
                          border: item.isHighlighted
                            ? "2px solid #1d4ed8"
                            : "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 12,
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
                            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 16, lineHeight: 1.25 }}>
                              {portfolioCardTitle(item)}
                            </h3>
                            <div style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
                              {learnerLabel} · {formatDateLabel(item.evidence.observedOn)}
                              {item.evidence.learningArea
                                ? ` · ${item.evidence.learningArea}`
                                : ""}
                            </div>
                          </div>
                        </div>
                        {isExpanded ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                        </div> : null}
                        {previewImage ? (
                          <EvidenceThumbnail
                            image={previewImage}
                            width={84}
                            height={64}
                            title="Evidence photo"
                          />
                        ) : null}
                        <p
                          style={{
                            margin: 0,
                            color: "#334155",
                            lineHeight: 1.45,
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: isExpanded ? 6 : 2,
                            overflow: "hidden",
                          }}
                        >
                          {evidenceSummary}
                        </p>
                        {isExpanded && pathwayMeta ? (
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
                        {isExpanded && (linkedProgram || linkedSegment || linkedCalendarItem) ? (
                          <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                            {linkedProgram ? `Program: ${linkedProgram}` : ""}
                            {linkedProgram && linkedSegment ? " | " : ""}
                            {linkedSegment ? `Week / segment: ${linkedSegment}` : ""}
                            {(linkedProgram || linkedSegment) && linkedCalendarItem ? " | " : ""}
                            {linkedCalendarItem ? `Block: ${linkedCalendarItem.title}` : ""}
                          </div>
                        ) : null}
                        <div data-guidance-id="portfolio-reflection-note" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {item.isHighlighted ? (
                            <span aria-label="In portfolio" style={{ borderRadius: 999, padding: "4px 9px", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 800 }}>
                              ✓ In portfolio
                            </span>
                          ) : (
                            <button type="button" style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }} onClick={() => void handleToggleHighlight(item)} disabled={submitting}>
                              Feature in Portfolio
                            </button>
                          )}
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            aria-controls={`portfolio-detail-${item.evidence.id}`}
                            onClick={() => openEvidence(item)}
                            style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}
                          >
                            {isExpanded ? "Hide details" : "View"}
                          </button>
                          {!isExpanded ? (
                            <button type="button" aria-label="More actions" onClick={() => openEvidence(item)} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>
                              More
                            </button>
                          ) : null}
                          {isExpanded ? (
                            <div id={`portfolio-detail-${item.evidence.id}`} style={{ display: "grid", gap: 8, flexBasis: "100%", borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
                              {item.evidence.reflection ? (
                                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                  <strong style={{ color: "#0f172a" }}>Reflection</strong>
                                  <div>{item.evidence.reflection}</div>
                                </div>
                              ) : null}
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", color: "#475569", fontSize: 13 }}>
                                {pathwayMeta ? <span>Pathway: {pathwayMeta.label}</span> : null}
                                {repeatedPathwayStep ? <span>Multiple notes for this step</span> : null}
                                {linkedProgram ? <span>Program: {linkedProgram}</span> : null}
                                {linkedSegment ? <span>Segment: {linkedSegment}</span> : null}
                                {linkedCalendarItem ? <span>Block: {linkedCalendarItem.title}</span> : null}
                              </div>
                              <section
                                aria-label="Pathway link"
                                style={{
                                  border: "1px solid #dbeafe",
                                  borderRadius: 12,
                                  background: "#f8fbff",
                                  padding: 10,
                                  display: "grid",
                                  gap: 7,
                                }}
                              >
                                {pathwayMeta ? (
                                  <>
                                    <div style={{ display: "grid", gap: 2 }}>
                                      <strong style={{ color: "#0f172a", fontSize: 13 }}>Linked to Pathway</strong>
                                      <span style={{ color: "#475569", fontSize: 13 }}>
                                        {parsePathwayContextFromNodeIds(item.evidence.curriculumNodeIds)?.subjectLabel || "Pathway"} · {pathwayMeta.label}
                                      </span>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                      <button type="button" onClick={() => openPathwayLink(item)} disabled={submitting} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>
                                        Change link
                                      </button>
                                      <button type="button" onClick={() => void removePathwayLink(item)} disabled={submitting} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>
                                        Remove link
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <button type="button" onClick={() => openPathwayLink(item)} disabled={submitting} style={{ ...secondaryButtonStyle, width: "fit-content", padding: "7px 10px", fontSize: 12 }}>
                                    Link to a Pathway step
                                  </button>
                                )}
                              </section>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                                {item.isHighlighted ? (
                                  <button type="button" style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }} onClick={() => void handleToggleHighlight(item)} disabled={submitting}>
                                     Remove feature
                                  </button>
                                ) : null}
                                <Link
                                  href={`${capturePathBase}?evidence_entry_id=${item.evidence.id}`}
                                  style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}
                                >
                                  Open capture
                                </Link>
                                {previewImage ? (
                                  <CleanLearningMomentShareCard
                                    entry={item.evidence}
                                    learnerLabel={learnerLabel}
                                    imageUrl={previewImage.url}
                                    imageStoragePath={previewImage.storagePath}
                                    showTrigger
                                  />
                                ) : null}
                                {item.evidence.includeInReport ? (
                                  <Link href={`${reportsPathBase}?learner_id=${item.evidence.learnerId}&evidence_entry_id=${item.evidence.id}`} style={{ color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>
                                    Use in report
                                  </Link>
                                ) : null}
                                <button type="button" style={{ ...secondaryButtonStyle, borderColor: "#fecaca", color: "#b91c1c", padding: "7px 10px", fontSize: 12 }} onClick={() => setPendingDeleteItem(item)} disabled={submitting}>
                                  Delete evidence
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
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

        {linkingItem ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-pathway-link-title"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !submitting) closePathwayLink();
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              overflowY: "auto",
              background: "rgba(15,23,42,0.35)",
              padding: "max(16px, env(safe-area-inset-top)) 12px",
              display: "grid",
              placeItems: "center",
            }}
          >
            <section
              style={{
                ...cardStyle,
                width: "min(100%, 600px)",
                margin: "auto",
                display: "grid",
                gap: 14,
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <h2 id="portfolio-pathway-link-title" style={{ margin: 0, color: "#0f172a", fontSize: 21 }}>
                  Link to a Pathway step
                </h2>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
                  This keeps the learning record as supporting evidence. It does not confirm progress or completion.
                </p>
              </div>
              <label style={{ display: "grid", gap: 6, color: "#334155", fontSize: 13, fontWeight: 700 }}>
                Subject
                <select value={selectedPathwaySubjectKey} onChange={(event) => changePathwaySubject(event.target.value)} style={{ ...inputStyle, minHeight: 44 }}>
                  <option value="">Choose a subject</option>
                  {pathwaySubjects.map((subject) => <option key={subject.subjectKey} value={subject.subjectKey}>{subject.subjectTitle}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, color: "#334155", fontSize: 13, fontWeight: 700 }}>
                Strand / area
                <select value={selectedPathwayStrandKey} onChange={(event) => changePathwayStrand(event.target.value)} disabled={!selectedPathwaySubjectKey} style={{ ...inputStyle, minHeight: 44 }}>
                  <option value="">Choose a strand / area</option>
                  {pathwayStrands.map((strand) => <option key={strand.strandKey} value={strand.strandKey}>{strand.strandTitle}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, color: "#334155", fontSize: 13, fontWeight: 700 }}>
                Stage
                <select value={selectedPathwayStageKey} onChange={(event) => changePathwayStage(event.target.value)} disabled={!selectedPathwayStrandKey} style={{ ...inputStyle, minHeight: 44 }}>
                  <option value="">Choose a stage</option>
                  {pathwayStages.map((stage) => <option key={stage.stageKey} value={stage.stageKey}>{stage.stageTitle}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 6, color: "#334155", fontSize: 13, fontWeight: 700 }}>
                Pathway step
                <select value={selectedPathwayStepId} onChange={(event) => setSelectedPathwayStepId(event.target.value)} disabled={!selectedPathwayStageKey} style={{ ...inputStyle, minHeight: 44 }}>
                  <option value="">Choose a Pathway step</option>
                  {pathwayStepOptions.map((step) => <option key={step.id} value={step.id}>Step {step.legacyStepNumber} — {step.stepTitle}</option>)}
                </select>
              </label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button type="button" onClick={closePathwayLink} disabled={submitting} style={{ ...secondaryButtonStyle, minHeight: 44 }}>
                  Cancel
                </button>
                <button type="button" onClick={() => void savePathwayLink()} disabled={submitting || !selectedPathwayStepId} style={{ ...buttonStyle, minHeight: 44 }}>
                  {submitting ? "Saving…" : "Save link"}
                </button>
              </div>
            </section>
          </div>
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
                  This removes it from Quick Capture, Portfolio, Reports, and Outputs. This
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
  return <CleanPortfolioWorkspaceBody />;
}
