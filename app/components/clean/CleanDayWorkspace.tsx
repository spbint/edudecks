"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import CoreJourneyCue, {
  CoreJourneyHelp,
} from "@/app/components/clean/design-v2/CoreJourneyCue";
import MyPlanHeader from "@/app/components/clean/design-v2/MyPlanHeader";
import CleanMiniCalendarNavigator from "@/app/components/clean/CleanMiniCalendarNavigator";
import {
  CleanFeedbackPrompt,
  CleanContinueWhereYouLeftOffCard,
} from "@/app/components/clean/CleanPersonalisationCards";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanGuidanceRibbon from "@/app/components/clean/CleanGuidanceRibbon";
import {
  GuidanceGettingStartedCard,
  GuidancePageAction,
  GuidanceSetupProgress,
  GuidanceSetupNextAction,
} from "@/app/components/clean/guidance/GuidanceToggle";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";
import {
  createCleanCalendarItem,
  listCleanCalendarItems,
  updateCleanCalendarItem,
} from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  listCleanEvidenceEntries,
  subscribeToCleanEvidenceChanges,
} from "@/lib/clean/evidence/client";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import { buildCleanGuidanceCards } from "@/lib/clean/guidance/client";
import type { CleanGuidanceCard } from "@/lib/clean/guidance/types";
import { PAGE_INTRO_VIDEOS } from "@/lib/clean/pageIntroVideos";
import { listCleanPortfolioHighlights } from "@/lib/clean/portfolio/client";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type {
  CleanProgram,
  CleanProgramSegment,
} from "@/lib/clean/programs/types";
import { listCleanReports } from "@/lib/clean/reports/client";
import { listCleanMasterTemplates } from "@/lib/clean/templates/client";
import { ensureCleanOperationalWeekFromUsualWeek } from "@/lib/clean/generation/materialize";
import {
  buildCleanPlanningCacheKey,
  getOrCreateCleanPlanningCalendarItemsRequest,
  readCleanPlanningCalendarItems,
  writeCleanPlanningCalendarItems,
} from "@/lib/clean/planning/cache";
import {
  listCleanAcademicYears,
  listCleanLearningPeriods,
} from "@/lib/clean/terms/client";
import {
  deriveCleanMyDayPresentationState,
  type CleanMyDayPresentationState,
} from "@/lib/clean/setup/setupStatus";
import { hasAnyPathwayPlacementForLearner } from "@/lib/clean/pathways/pathwayPlacement";
import {
  buildCleanDailyPlannerPdfFilename,
  buildCleanWeeklyPlannerEntriesFromCalendarItems,
  generateCleanDailyPlannerPdfBytes,
} from "@/lib/clean/outputs/weeklyPlanner";
import { trackProductEvent } from "@/lib/clean/analytics/productAnalytics";
import { PUBLIC_PATHWAYS_ENABLED } from "@/lib/clean/publicVisibility";
import {
  beginCleanPlanningTiming,
  recordCleanPlanningMilestone,
} from "@/lib/clean/performance/planningTiming";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #fdfefe 45%, #f8fafc 100%)",
  padding: "clamp(14px, 3vw, 22px) clamp(10px, 3vw, 16px) 36px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 14,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 18,
  boxShadow: "0 8px 22px rgba(15,23,42,0.04)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
};

const compactInputStyle: React.CSSProperties = {
  ...inputStyle,
  width: "min(260px, 100%)",
  minHeight: 40,
  padding: "9px 12px",
  fontSize: 13,
  background: "#ffffff",
  color: "#0f172a",
  lineHeight: 1.3,
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const overviewPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid #dbeafe",
  background: "#ffffff",
  color: "#334155",
  fontSize: 13,
  fontWeight: 600,
};

const blockMetaPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 9px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: 12,
  fontWeight: 600,
};

const primaryButtonStyle: React.CSSProperties = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const quickAddCardStyle: React.CSSProperties = {
  border: "1px solid #dbeafe",
  borderRadius: 18,
  background: "#f8fbff",
  padding: 18,
  display: "grid",
  gap: 14,
};

const COMMON_LEARNING_AREAS = [
  "English",
  "Mathematics",
  "Science",
  "Humanities and Social Sciences",
  "The Arts",
  "Languages",
  "Health and Physical Education",
  "Technologies",
];

function getTodayDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(dateValue: string, dayOffset: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  date.setDate(date.getDate() + dayOffset);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
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

function formatTodayHeading(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeLabel(value: string | null) {
  if (!value) return "Any time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toTimestampFromDateAndTime(dateValue: string, timeValue: string) {
  const time = String(timeValue ?? "").trim();
  if (!time) return null;
  const localDate = new Date(`${dateValue}T${time}:00`);
  if (Number.isNaN(localDate.getTime())) return null;
  return localDate.toISOString();
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

function getLearnerLabel(firstName: string, preferredName: string | null) {
  return preferredName || firstName;
}

function getPreviewText(value: string | null, maxLength = 110) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function isValidDateValue(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function hasGuidanceContext(profile: {
  countryCode: string | null;
  jurisdictionCode: string | null;
  curriculumFrameworkId: string | null;
} | null) {
  if (!profile) return false;

  const countryCode = String(profile.countryCode ?? "").trim();
  const jurisdictionCode = String(profile.jurisdictionCode ?? "").trim();
  const curriculumFrameworkId = String(profile.curriculumFrameworkId ?? "").trim();

  if (!countryCode || !curriculumFrameworkId) {
    return false;
  }

  if (countryCode === "INTL") {
    return true;
  }

  return Boolean(jurisdictionCode);
}

function CleanDayWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();
  const { user } = useAuthUser();
  const {
    enabled: guidanceEnabled,
    setupStatus: guidanceSetupStatus,
    completeSetupStep,
  } = useGuidance();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [items, setItems] = useState<CleanCalendarItem[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<CleanEvidenceEntry[]>([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsResolvedKey, setItemsResolvedKey] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [guidanceCards, setGuidanceCards] = useState<CleanGuidanceCard[]>([]);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddLearnerId, setQuickAddLearnerId] = useState("");
  const [quickAddTime, setQuickAddTime] = useState("");
  const [quickAddLearningArea, setQuickAddLearningArea] = useState("");
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [quickAddMessage, setQuickAddMessage] = useState<string | null>(null);
  const [completionUpdatingId, setCompletionUpdatingId] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<{
    itemId: string;
    message: string;
  } | null>(null);
  const [dailyPlannerDownloading, setDailyPlannerDownloading] = useState(false);
  const [hasPlacementForPromptLearner, setHasPlacementForPromptLearner] = useState(false);
  const [dayReloadNonce, setDayReloadNonce] = useState(0);
  const dayRequestGenerationRef = useRef(0);
  const dayPrimaryMilestoneRef = useRef<string | null>(null);
  const daySettledMilestoneRef = useRef<string | null>(null);
  const firstValueChoiceTrackedRef = useRef(false);

  const today = getTodayDate();
  const dayPathBase = pathname.startsWith("/clean-my-day") ? "/clean-my-day" : "/my-day";
  const calendarPathBase = pathname.startsWith("/clean-my-day")
    ? "/clean-my-calendar"
    : "/my-calendar";
  const capturePathBase = pathname.startsWith("/clean-my-day")
    ? "/clean-my-capture"
    : "/my-capture";
  const pathwaysPathBase = pathname.startsWith("/clean-my-day")
    ? "/clean-my-pathways"
    : "/my-pathways";
  const placementPathBase = `${pathwaysPathBase}/placement`;
  const portfolioPathBase = pathname.startsWith("/clean-my-day")
    ? "/clean-my-portfolio"
    : "/my-portfolio";
  const selectedDate = useMemo(() => {
    const candidate = searchParams.get("date");
    return isValidDateValue(candidate) ? candidate : today;
  }, [searchParams, today]);
  const isViewingToday = selectedDate === today;
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = addDays(weekStart, 6);

  const buildDayPath = useMemo(
    () => (dateValue: string) => (dateValue === today ? dayPathBase : `${dayPathBase}?date=${dateValue}`),
    [dayPathBase, today],
  );

  const buildCaptureHref = useMemo(
    () => (item: CleanCalendarItem, evidenceEntryId?: string | null) => {
      const params = new URLSearchParams();

      if (evidenceEntryId) {
        params.set("evidence_entry_id", evidenceEntryId);
      }

      params.set("calendar_item_id", item.id);
      params.set("observed_on", item.plannedDate);

      if (item.learnerId) {
        params.set("learner_id", item.learnerId);
      }

      if (item.programId) {
        params.set("program_id", item.programId);
      }

      if (item.programSegmentId) {
        params.set("program_segment_id", item.programSegmentId);
      }

      return `${capturePathBase}?${params.toString()}`;
    },
    [capturePathBase],
  );

  const learnerOptions = useMemo(
    () =>
      workspace.learners.map((learner) => ({
        value: learner.id,
        label: getLearnerLabel(learner.firstName, learner.preferredName),
      })),
    [workspace.learners],
  );

  const visibleItems = useMemo(() => {
    if (!selectedLearnerId) return items;
    return items.filter(
      (item) => item.learnerId === selectedLearnerId || item.learnerId === null,
    );
  }, [items, selectedLearnerId]);

  const sortedVisibleItems = useMemo(
    () =>
      [...visibleItems].sort((left, right) => {
        const leftTime = left.startsAt ?? "";
        const rightTime = right.startsAt ?? "";

        if (leftTime && rightTime) {
          return leftTime.localeCompare(rightTime);
        }

        if (leftTime) return -1;
        if (rightTime) return 1;

        return left.title.localeCompare(right.title);
      }),
    [visibleItems],
  );

  const openGuidanceCards = useMemo(() => guidanceCards.slice(0, 3), [guidanceCards]);
  const hasLateStageGuidance = useMemo(
    () => openGuidanceCards.some((card) => card.key === "portfolio" || card.key === "reports"),
    [openGuidanceCards],
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

  const evidenceByCalendarItemId = useMemo(() => {
    const grouped = new Map<string, CleanEvidenceEntry>();

    for (const entry of evidenceEntries) {
      if (!entry.calendarItemId || grouped.has(entry.calendarItemId)) continue;
      grouped.set(entry.calendarItemId, entry);
    }

    return grouped;
  }, [evidenceEntries]);

  const reloadEvidence = useCallback(async () => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      return;
    }

    try {
      const nextEvidenceEntries = await listCleanEvidenceEntries(workspace.profile.id, {
        fromDate: selectedDate,
        toDate: selectedDate,
        limit: 60,
      });
      setEvidenceEntries(nextEvidenceEntries);
    } catch {
      // Evidence is secondary to the day plan; retain the current state on refresh failure.
    }
  }, [selectedDate, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  const learnersInViewCount = useMemo(
    () => new Set(sortedVisibleItems.map((item) => item.learnerId).filter(Boolean)).size,
    [sortedVisibleItems],
  );

  const wholeFamilyBlocksCount = useMemo(
    () => sortedVisibleItems.filter((item) => item.learnerId === null).length,
    [sortedVisibleItems],
  );

  const nextUpcomingItem = useMemo(
    () => {
      if (!sortedVisibleItems.length) return null;

      if (!isViewingToday) {
        return sortedVisibleItems.find((item) => item.startsAt) ?? sortedVisibleItems[0] ?? null;
      }

      const now = new Date();

      return (
        sortedVisibleItems.find((item) => {
          if (!item.startsAt) return false;
          const startsAt = new Date(item.startsAt);
          return !Number.isNaN(startsAt.getTime()) && startsAt >= now;
        }) ?? null
      );
    },
    [isViewingToday, sortedVisibleItems],
  );

  const selectedLearnerLabel = useMemo(
    () => learnerOptions.find((option) => option.value === selectedLearnerId)?.label ?? null,
    [learnerOptions, selectedLearnerId],
  );

  const overviewSummary = useMemo(() => {
    if (!sortedVisibleItems.length) {
      return isViewingToday ? "Nothing planned for today yet." : "Nothing planned for this day yet.";
    }

    if (selectedLearnerId && selectedLearnerLabel) {
      return `${isViewingToday ? "Today" : "This day"} has ${sortedVisibleItems.length} planned block${
        sortedVisibleItems.length === 1 ? "" : "s"
      } for ${selectedLearnerLabel}.`;
    }

    if (learnersInViewCount > 0) {
      return `${isViewingToday ? "Today" : "This day"} has ${sortedVisibleItems.length} planned block${
        sortedVisibleItems.length === 1 ? "" : "s"
      } across ${learnersInViewCount} learner${learnersInViewCount === 1 ? "" : "s"}${
        wholeFamilyBlocksCount ? ", plus whole-family time." : "."
      }`;
    }

    return `${isViewingToday ? "Today" : "This day"} has ${sortedVisibleItems.length} planned block${
      sortedVisibleItems.length === 1 ? "" : "s"
    } for the whole family.`;
  }, [
    isViewingToday,
    learnersInViewCount,
    selectedLearnerId,
    selectedLearnerLabel,
    sortedVisibleItems,
    wholeFamilyBlocksCount,
  ]);

  const overviewFocusLabel = useMemo(() => {
    if (selectedLearnerId && selectedLearnerLabel) {
      return selectedLearnerLabel;
    }

    if (learnersInViewCount > 0 && wholeFamilyBlocksCount > 0) {
      return `${learnersInViewCount} learners + family time`;
    }

    if (learnersInViewCount > 0) {
      return `${learnersInViewCount} learner${learnersInViewCount === 1 ? "" : "s"}`;
    }

    return "Whole family";
  }, [
    learnersInViewCount,
    selectedLearnerId,
    selectedLearnerLabel,
    wholeFamilyBlocksCount,
  ]);

  const nextUpSummary = useMemo(() => {
    if (nextUpcomingItem) {
      return nextUpcomingItem.startsAt
        ? `${nextUpcomingItem.title} at ${formatTimeLabel(nextUpcomingItem.startsAt)}`
        : nextUpcomingItem.title;
    }

    if (sortedVisibleItems.length) {
      return isViewingToday ? "The rest of today is open." : "This day is open.";
    }

    return isViewingToday ? "Nothing planned yet." : "Nothing planned for this day yet.";
  }, [isViewingToday, nextUpcomingItem, sortedVisibleItems]);

  const nextUpLabel = isViewingToday ? "Next up" : "Looking ahead";
  const quickAddHeading = isViewingToday
    ? "Add one quick block for today"
    : "Add one quick block for this day";
  const quickAddLead = isViewingToday
    ? "Add a simple block now. Capture evidence later if something useful happens."
    : "Add a simple block for this day. Capture evidence later if needed.";
  const familyDisplayName = String(workspace.profile?.displayName ?? "").trim();
  const familyGreeting = familyDisplayName
    ? `Welcome back, ${familyDisplayName}.`
    : "Welcome back.";
  const accountSetup = workspace.setupStatus;
  const canShowMyDayGuidance =
    !workspace.loading &&
    !workspace.setupLoading &&
    Boolean(workspace.profile) &&
    workspace.learners.length > 0;
  const firstSetupMode =
    canShowMyDayGuidance &&
    guidanceEnabled &&
    (guidanceSetupStatus === "not_started" || guidanceSetupStatus === "active") &&
    !accountSetup.hasEvidence;
  const placementPromptLearnerId = useMemo(() => {
    if (selectedLearnerId) return selectedLearnerId;
    if (workspace.learners.length === 1) return workspace.learners[0]?.id || "";
    return "";
  }, [selectedLearnerId, workspace.learners]);
  const placementPromptHref = useMemo(() => {
    const params = new URLSearchParams();
    if (placementPromptLearnerId) {
      params.set("learnerId", placementPromptLearnerId);
    }
    const query = params.toString();
    return query ? `${placementPathBase}?${query}` : placementPathBase;
  }, [placementPathBase, placementPromptLearnerId]);
  const manualPlacementPromptHref = useMemo(() => {
    const params = new URLSearchParams();
    if (placementPromptLearnerId) {
      params.set("learnerId", placementPromptLearnerId);
    }
    params.set("mode", "manual");
    return `${placementPathBase}?${params.toString()}`;
  }, [placementPathBase, placementPromptLearnerId]);
  const currentPathwayHref = useMemo(
    () =>
      selectedLearnerId
        ? `${pathwaysPathBase}?learnerId=${encodeURIComponent(selectedLearnerId)}`
        : pathwaysPathBase,
    [pathwaysPathBase, selectedLearnerId],
  );
  const shouldShowPlacementPrompt =
    PUBLIC_PATHWAYS_ENABLED &&
    !workspace.setupLoading &&
    workspace.learners.length > 0 &&
    !accountSetup.hasPathway &&
    !hasPlacementForPromptLearner;
  const continueActions = useMemo(() => {
    const pathwayLabel = selectedLearnerLabel
      ? `Open ${selectedLearnerLabel}'s current pathway`
      : "Open current pathway";

    return [
      sortedVisibleItems.length || firstSetupMode
        ? {
            href: buildDayPath(selectedDate),
            label: isViewingToday ? "Review today's learning" : "Review this day",
            tone: "blue" as const,
          }
        : {
            href: calendarPathBase,
            label: "Plan this week",
            tone: "blue" as const,
      },
      ...(PUBLIC_PATHWAYS_ENABLED
        ? [{
            href: currentPathwayHref,
            label: pathwayLabel,
            tone: "green" as const,
          }]
        : []),
      evidenceEntries.length
        ? {
            href: portfolioPathBase,
            label: "Choose evidence for portfolio",
            tone: "orange" as const,
          }
        : {
            href: capturePathBase,
            label: selectedLearnerLabel ? `Capture evidence for ${selectedLearnerLabel}` : "Capture evidence",
            tone: "orange" as const,
          },
    ];
  }, [
    buildDayPath,
    calendarPathBase,
    capturePathBase,
    currentPathwayHref,
    evidenceEntries.length,
    firstSetupMode,
    isViewingToday,
    portfolioPathBase,
    selectedDate,
    selectedLearnerLabel,
    sortedVisibleItems.length,
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

      return "";
    });
  }, [workspace.learners]);

  useEffect(() => {
    if (!placementPromptLearnerId) {
      setHasPlacementForPromptLearner(false);
      return;
    }

    setHasPlacementForPromptLearner(
      hasAnyPathwayPlacementForLearner(placementPromptLearnerId),
    );
  }, [placementPromptLearnerId]);

  useEffect(() => {
    setExpandedItemIds([]);
  }, [selectedDate]);

  useEffect(() => {
    if (!quickAddOpen) return;

    setQuickAddLearnerId((current) => {
      if (current && learnerOptions.some((option) => option.value === current)) {
        return current;
      }

      return selectedLearnerId;
    });
  }, [learnerOptions, quickAddOpen, selectedLearnerId]);

  useEffect(() => {
    async function loadItems() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
        dayRequestGenerationRef.current += 1;
        setItems([]);
        setItemsResolvedKey(null);
        setEvidenceEntries([]);
        setPrograms([]);
        setProgramSegments([]);
        return;
      }

      const requestGeneration = ++dayRequestGenerationRef.current;
      const selectedDayDataKey = `${workspace.currentUserId}:${workspace.profile.id}:${selectedDate}`;
      const cacheKey = buildCleanPlanningCacheKey({
        userId: workspace.currentUserId,
        familyId: workspace.profile.id,
        route: "day",
        fromDate: selectedDate,
        toDate: selectedDate,
      });
      const cachedItems = readCleanPlanningCalendarItems(cacheKey);
      setItems(cachedItems ?? []);
      setItemsResolvedKey(cachedItems ? selectedDayDataKey : null);
      setEvidenceEntries([]);
      // An empty cache is not evidence that this day is empty: the usual-week
      // materialisation check must settle before My Day derives its state.
      setItemsLoading(!cachedItems || cachedItems.length === 0);
      setItemsError(null);

      try {
        await ensureCleanOperationalWeekFromUsualWeek({
          familyId: workspace.profile.id,
          weekStartsOn: weekStart,
          weekEndsOn: weekEnd,
          today,
        });
      } catch (error) {
        if (requestGeneration === dayRequestGenerationRef.current) {
          setItemsError(
            normalizeCleanErrorMessage(
              error,
              "We couldn't bring your usual week into this week yet.",
            ),
          );
          setItemsResolvedKey(null);
          setItemsLoading(false);
        }
        return;
      }

      const itemsPromise = getOrCreateCleanPlanningCalendarItemsRequest(
        cacheKey,
        () =>
          listCleanCalendarItems(workspace.profile!.id, {
            fromDate: selectedDate,
            toDate: selectedDate,
            limit: 40,
          }),
      );
      const itemsTiming = beginCleanPlanningTiming({
        operation: "my-day-visible-activities",
        criticality: "page-primary",
        gatesPage: false,
        requestKey: `my-day-visible-activities:${workspace.currentUserId}:${workspace.profile.id}:${selectedDate}`,
      });
      const evidencePromise = listCleanEvidenceEntries(workspace.profile.id, {
        fromDate: selectedDate,
        toDate: selectedDate,
        limit: 60,
      });
      const evidenceTiming = beginCleanPlanningTiming({
        operation: "my-day-recent-learning",
        criticality: "section-secondary",
        gatesPage: false,
        requestKey: `my-day-recent-learning:${workspace.currentUserId}:${workspace.profile.id}:${selectedDate}`,
      });
      const programsPromise = listCleanPrograms(workspace.profile.id, { limit: 50 });
      const programsTiming = beginCleanPlanningTiming({
        operation: "my-day-pathway-enrichment",
        criticality: "section-secondary",
        gatesPage: false,
        requestKey: `my-day-pathway-enrichment:${workspace.currentUserId}:${workspace.profile.id}`,
      });

      try {
        const nextItems = await itemsPromise;
        itemsTiming(
          requestGeneration === dayRequestGenerationRef.current ? "success" : "cancelled",
        );
        if (requestGeneration !== dayRequestGenerationRef.current) return;
        writeCleanPlanningCalendarItems(cacheKey, nextItems);
        setItems(nextItems);
        setItemsResolvedKey(selectedDayDataKey);
        setItemsLoading(false);
      } catch (error) {
        itemsTiming("error");
        if (requestGeneration === dayRequestGenerationRef.current) {
          setItemsError(
            normalizeCleanErrorMessage(
              error,
              "We could not load this day's learning blocks.",
            ),
          );
          setItemsResolvedKey(null);
          setItemsLoading(false);
        }
      }

      void (async () => {
        try {
          const [evidenceResult, programsResult] = await Promise.allSettled([
            evidencePromise,
            programsPromise,
          ]);

          if (requestGeneration !== dayRequestGenerationRef.current) {
            evidenceTiming("cancelled");
            programsTiming("cancelled");
            return;
          }

          if (evidenceResult.status === "fulfilled") {
            evidenceTiming("success");
            setEvidenceEntries(evidenceResult.value);
          } else evidenceTiming("error");

          if (programsResult.status !== "fulfilled") {
            programsTiming("error");
            return;
          }
          programsTiming("success");
          const nextPrograms = programsResult.value;
          setPrograms(nextPrograms);

          const segmentResults = await Promise.allSettled(
            nextPrograms.map((program) =>
              listCleanProgramSegments(workspace.profile!.id, program.id),
            ),
          );

          if (requestGeneration !== dayRequestGenerationRef.current) {
            programsTiming("cancelled");
            return;
          }

          setProgramSegments(
            segmentResults
              .filter(
                (result): result is PromiseFulfilledResult<CleanProgramSegment[]> =>
                  result.status === "fulfilled",
              )
              .flatMap((result) => result.value),
          );
        } catch {
          evidenceTiming("error");
          programsTiming("error");
          if (requestGeneration === dayRequestGenerationRef.current) {
            setPrograms([]);
            setProgramSegments([]);
          }
        }
      })();
    }

    void loadItems();
  }, [
    dayReloadNonce,
    selectedDate,
    today,
    weekEnd,
    weekStart,
    workspace.currentUserId,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      return;
    }

    return subscribeToCleanEvidenceChanges((detail) => {
      if (detail.familyId !== workspace.profile?.id) return;
      void reloadEvidence();
    });
  }, [reloadEvidence, workspace.profile, workspace.requiresFamilyCreation, workspace.schemaMissing]);

  useEffect(() => {
    async function loadGuidance() {
      if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
        setGuidanceCards([]);
        return;
      }

      setGuidanceLoading(true);
      setGuidanceError(null);

      try {
        const [
          academicYears,
          learningPeriods,
          masterTemplates,
          programs,
          currentWeekItems,
          todayItems,
          evidenceEntries,
          portfolioHighlights,
          reports,
        ] = await Promise.all([
          listCleanAcademicYears(workspace.profile.id, { limit: 1 }),
          listCleanLearningPeriods(workspace.profile.id, { limit: 1 }),
          listCleanMasterTemplates(workspace.profile.id, { limit: 1 }),
          listCleanPrograms(workspace.profile.id, { limit: 1 }),
          listCleanCalendarItems(workspace.profile.id, {
            fromDate: weekStart,
            toDate: weekEnd,
            limit: 1,
          }),
          listCleanCalendarItems(workspace.profile.id, {
            fromDate: selectedDate,
            toDate: selectedDate,
            limit: 1,
          }),
          listCleanEvidenceEntries(workspace.profile.id, { limit: 1 }),
          listCleanPortfolioHighlights(workspace.profile.id, { limit: 1 }),
          listCleanReports(workspace.profile.id, { limit: 1 }),
        ]);

        const nextCards = buildCleanGuidanceCards({
          hasFamilyProfile: Boolean(workspace.profile),
          learnerCount: workspace.learners.length,
          hasJurisdictionProfile: hasGuidanceContext(workspace.profile),
          hasAcademicYear: academicYears.length > 0,
          hasLearningPeriods: learningPeriods.length > 0,
          hasMasterTemplate: masterTemplates.length > 0,
          hasPrograms: programs.length > 0,
          hasCurrentWeekItems: currentWeekItems.length > 0,
          hasTodayItems: todayItems.length > 0,
          hasEvidence: evidenceEntries.length > 0,
          hasPortfolioHighlights: portfolioHighlights.length > 0,
          hasReports: reports.length > 0,
        });

        setGuidanceCards(nextCards);
      } catch (error) {
        setGuidanceError(
          normalizeCleanErrorMessage(
            error,
            "We could not load your next steps just now.",
          ),
        );
      } finally {
        setGuidanceLoading(false);
      }
    }

    void loadGuidance();
  }, [
    selectedDate,
    weekEnd,
    weekStart,
    workspace.learners.length,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  function toggleExpanded(itemId: string) {
    setExpandedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId],
    );
  }

  async function handleCompletionToggle(item: CleanCalendarItem) {
    if (!workspace.profile || completionUpdatingId) return;

    const nextCompletedAt = item.completedAt ? null : new Date().toISOString();
    const cacheKey = buildCleanPlanningCacheKey({
      userId: workspace.currentUserId,
      familyId: workspace.profile.id,
      route: "day",
      fromDate: selectedDate,
      toDate: selectedDate,
    });

    setCompletionUpdatingId(item.id);
    setCompletionError(null);

    try {
      const updatedItem = await updateCleanCalendarItem(workspace.profile.id, item.id, {
        completedAt: nextCompletedAt,
      });

      setItems((current) => {
        const nextItems = current.map((currentItem) =>
          currentItem.id === updatedItem.id ? updatedItem : currentItem,
        );
        writeCleanPlanningCalendarItems(cacheKey, nextItems);
        return nextItems;
      });
    } catch (error) {
      setCompletionError({
        itemId: item.id,
        message: normalizeCleanErrorMessage(
          error,
          "We could not update this activity's completion status.",
        ),
      });
    } finally {
      setCompletionUpdatingId(null);
    }
  }

  function openQuickAdd() {
    setQuickAddOpen(true);
    setQuickAddLearnerId(selectedLearnerId);
    setQuickAddError(null);
    setQuickAddMessage(null);
  }

  function closeQuickAdd() {
    setQuickAddOpen(false);
    setQuickAddTitle("");
    setQuickAddLearnerId(selectedLearnerId);
    setQuickAddTime("");
    setQuickAddLearningArea("");
    setQuickAddError(null);
  }

  function skipPlacementCheckForNow() {
    if (guidanceSetupStatus === "active") {
      completeSetupStep("day");
    }
    router.push(pathwaysPathBase);
  }

  async function handleQuickAddSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspace.profile) {
      setQuickAddError("My Day is not ready for quick add yet.");
      return;
    }

    const title = String(quickAddTitle ?? "").trim();
    if (!title) {
      setQuickAddError("Add a title before saving this quick block.");
      return;
    }

    setQuickAddSubmitting(true);
    setQuickAddError(null);
    setQuickAddMessage(null);

    try {
      const createdItem = await createCleanCalendarItem(workspace.profile.id, {
        title,
        plannedDate: selectedDate,
        learnerId: quickAddLearnerId || null,
        startsAt: toTimestampFromDateAndTime(selectedDate, quickAddTime),
        learningArea: String(quickAddLearningArea ?? "").trim() || null,
        programId: null,
        sourceType: "manual",
      });

      trackProductEvent(
        "calendar_block_created",
        {
          area: "my_day",
          route: pathname,
          hasLearner: Boolean(quickAddLearnerId),
          hasLearningArea: Boolean(quickAddLearningArea),
          hasStartTime: Boolean(quickAddTime),
          blockType: "manual",
        },
        user?.id,
      );
      setItems((current) => [...current, createdItem]);
      setExpandedItemIds([createdItem.id]);
      setQuickAddMessage("Quick block added to My Day.");
      setQuickAddTitle("");
      setQuickAddTime("");
      setQuickAddLearningArea("");
      setQuickAddOpen(false);
    } catch (error) {
      setQuickAddError(
        normalizeCleanErrorMessage(error, "We could not add this quick block."),
      );
    } finally {
      setQuickAddSubmitting(false);
    }
  }

  async function handleDailyPlannerDownload() {
    if (!workspace.profile) return;

    setDailyPlannerDownloading(true);
    setItemsError(null);

    try {
      const entries = buildCleanWeeklyPlannerEntriesFromCalendarItems(sortedVisibleItems, {
        learnerLabelById,
        programLabelById,
        segmentLabelById,
      });
      const pdfBytes = await generateCleanDailyPlannerPdfBytes({
        familyName: workspace.profile.displayName || null,
        learnerLabel: selectedLearnerLabel,
        plannedDate: selectedDate,
        entries,
      });

      downloadPdf(
        pdfBytes,
        buildCleanDailyPlannerPdfFilename(workspace.profile.displayName || null, selectedDate),
      );
      trackProductEvent(
        "daily_plan_pdf_downloaded",
        {
          area: "my_day",
          route: pathname,
          viewType: "day",
        },
        user?.id,
      );
      setQuickAddMessage("Daily planner downloaded.");
    } catch (error) {
      setItemsError(
        normalizeCleanErrorMessage(
          error,
          "Could not create today's planner. Please try again.",
        ),
      );
    } finally {
      setDailyPlannerDownloading(false);
    }
  }

  const readyForDay = !workspace.loading && !workspace.setupLoading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const hasPlannedItemsForSelectedDate = items.length > 0;
  const dayPrimaryKey = workspace.profile
    ? `${workspace.currentUserId}:${workspace.profile.id}:${selectedDate}`
    : null;
  const dayDataResolved = Boolean(readyForDay && !itemsLoading && !itemsError && dayPrimaryKey && itemsResolvedKey === dayPrimaryKey);
  const myDayPresentationState: CleanMyDayPresentationState | null = dayDataResolved
    ? deriveCleanMyDayPresentationState({
        setupStatus: accountSetup,
        hasPlannedItemsForSelectedDate,
      })
    : null;

  useEffect(() => {
    if (myDayPresentationState !== "READY_FOR_FIRST_VALUE" || firstValueChoiceTrackedRef.current) return;
    firstValueChoiceTrackedRef.current = true;
    trackProductEvent(
      "first_value_choice_viewed",
      { area: "my_day", route: pathname, presentation: "plan_or_capture" },
      user?.id,
    );
  }, [myDayPresentationState, pathname, user?.id]);

  function trackFirstValueChoice(destination: "plan" | "capture") {
    trackProductEvent(
      "first_value_choice_selected",
      { area: "my_day", route: pathname, presentation: "plan_or_capture", destination },
      user?.id,
    );
  }

  useEffect(() => {
    if (!readyForDay || !workspace.profile || !dayPrimaryKey) return;
    if (dayPrimaryMilestoneRef.current === dayPrimaryKey) return;
    dayPrimaryMilestoneRef.current = dayPrimaryKey;
    recordCleanPlanningMilestone({
      operation: "my-day-primary-content",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [dayPrimaryKey, readyForDay, workspace.profile]);

  useEffect(() => {
    if (!user?.id) return;
    recordCleanPlanningMilestone({
      operation: "my-day-route-mounted",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !dayPrimaryKey || itemsLoading || guidanceLoading) return;
    if (daySettledMilestoneRef.current === dayPrimaryKey) return;
    daySettledMilestoneRef.current = dayPrimaryKey;
    recordCleanPlanningMilestone({
      operation: "my-day-fully-settled",
      criticality: "page-primary",
      gatesPage: false,
    });
  }, [dayPrimaryKey, guidanceLoading, itemsLoading, user?.id]);

  return (
    <div style={shellStyle}>
      <MyPlanHeader />
      <div className={`mylearna-day-shell mylearna-day-shell-${myDayPresentationState?.toLowerCase() ?? "loading"}`} style={wrapStyle}>
        <style jsx global>{`
          @media (max-width: 640px) {
            .mylearna-day-header {
              padding: 18px !important;
            }

            .mylearna-day-getting-started,
            .mylearna-day-continue-card {
              display: none !important;
            }

            .mylearna-day-intro-full,
            .mylearna-day-overview-summary,
            .mylearna-day-timeline-helper {
              display: none !important;
            }

            .mylearna-day-intro-short {
              display: inline !important;
            }

            .mylearna-day-plan-card {
              padding: 12px !important;
            }

            .mylearna-day-overview-card {
              border-radius: 16px !important;
              padding: 16px !important;
              gap: 12px !important;
            }

            .mylearna-day-overview-card h2 {
              font-size: 22px !important;
              letter-spacing: 0 !important;
            }

            .mylearna-day-header-capture {
              min-height: 44px !important;
              border: 1px solid #cbd5e1 !important;
              background: #ffffff !important;
              color: #17204b !important;
            }

            .mylearna-day-progress-panel {
              padding: 12px !important;
              border-radius: 14px !important;
            }

            .mylearna-day-progress-panel button,
            .mylearna-day-actions button,
            .mylearna-day-actions a {
              min-height: 44px !important;
            }

            .mylearna-day-next-step-card {
              padding: 12px !important;
            }

            .mylearna-day-actions {
              width: 100% !important;
              display: grid !important;
              grid-template-columns: 1fr !important;
            }
          }

          .mylearna-day-intro-short {
            display: none;
          }

          .mylearna-day-shell-loading .mylearna-day-mature-top {
            display: none !important;
          }

          .mylearna-day-essential-navigator {
            display: none;
          }

          @media (min-width: 768px) {
            .mylearna-day-essential-navigator {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              flex-wrap: wrap;
              padding: 10px 12px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              background: #ffffff;
            }

            .mylearna-day-internal-navigator {
              display: none !important;
            }
          }

          @media (min-width: 901px) {
            /* Established desktop users should reach today's learning before tutorial chrome. */
            .mylearna-day-shell-populated_day .mylearna-day-mature-top {
              display: none !important;
            }
          }

          .mylearna-day-desktop-activation {
            display: none;
          }

          @media (min-width: 768px) {
            .mylearna-day-desktop-activation-setup_incomplete,
            .mylearna-day-desktop-activation-ready_for_first_value,
            .mylearna-day-desktop-activation-returning_empty {
              display: grid;
              gap: 12px;
              padding: 28px;
              border: 1px solid #dbeafe;
              border-radius: 18px;
              background: #f8fbff;
              box-shadow: 0 8px 22px rgba(15,23,42,0.04);
            }

            .mylearna-day-mature-content-setup_incomplete,
            .mylearna-day-mature-content-ready_for_first_value,
            .mylearna-day-mature-content-returning_empty {
              display: none !important;
            }

            .mylearna-day-shell-setup_incomplete .mylearna-day-mature-top,
            .mylearna-day-shell-ready_for_first_value .mylearna-day-mature-top,
            .mylearna-day-shell-returning_empty .mylearna-day-mature-top {
              display: none !important;
            }

            /* Keep the existing Quick Add form usable from the minimalist
               returning-empty state without exposing the mature workspace. */
            .mylearna-day-shell-returning_empty .mylearna-day-mature-content-returning_empty.mylearna-day-quick-add-open {
              display: block !important;
              padding: 0 !important;
            }

            .mylearna-day-shell-returning_empty .mylearna-day-mature-content-returning_empty.mylearna-day-quick-add-open > * {
              display: none !important;
            }

            .mylearna-day-shell-returning_empty .mylearna-day-mature-content-returning_empty.mylearna-day-quick-add-open > .mylearna-day-plan-card {
              display: block !important;
            }

            .mylearna-day-shell-returning_empty .mylearna-day-mature-content-returning_empty.mylearna-day-quick-add-open > .mylearna-day-plan-card > div {
              display: block !important;
            }

            .mylearna-day-shell-returning_empty .mylearna-day-mature-content-returning_empty.mylearna-day-quick-add-open > .mylearna-day-plan-card > div > * {
              display: none !important;
            }

            .mylearna-day-shell-returning_empty .mylearna-day-mature-content-returning_empty.mylearna-day-quick-add-open form.mylearna-day-quick-add-form {
              display: grid !important;
            }
          }

          @media (max-width: 767px) {
            .mylearna-day-mature-content {
              display: contents;
            }
          }
        `}</style>
        {readyForDay && !myDayPresentationState ? (
          <section
            data-testid="my-day-primary-loading-state"
            style={{ ...cardStyle, color: "#475569" }}
            aria-live="polite"
          >
            Loading this day&apos;s plan...
          </section>
        ) : null}
        {readyForDay && (myDayPresentationState === "RETURNING_EMPTY" || myDayPresentationState === "POPULATED_DAY") ? (
          <nav className="mylearna-day-essential-navigator" aria-label="My Day date navigation">
            <button type="button" onClick={() => router.push(buildDayPath(addDays(selectedDate, -1)))} style={secondaryButtonStyle} aria-label="Go to previous day">
              ‹ Previous day
            </button>
            <div style={{ display: "grid", gap: 2, justifyItems: "center", color: "#17204b", fontWeight: 800 }}>
              <CleanMiniCalendarNavigator
                selectedDate={selectedDate}
                today={today}
                onSelectDate={(dateValue) => router.push(buildDayPath(dateValue))}
                onToday={() => router.push(buildDayPath(today))}
                ariaLabel={`Choose date, ${formatTodayHeading(selectedDate)}`}
              />
              {!isViewingToday ? <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>Today is available in the date picker</span> : null}
            </div>
            <button type="button" onClick={() => router.push(buildDayPath(addDays(selectedDate, 1)))} style={secondaryButtonStyle} aria-label="Go to next day">
              Next day ›
            </button>
          </nav>
        ) : null}
        <div className="mylearna-day-mature-top">
        <CoreJourneyCue stage="plan" />
        {canShowMyDayGuidance ? <CleanFirstRunSetupGate currentStep="day" /> : null}
        {canShowMyDayGuidance ? (
          <GuidanceSetupProgress
            stepId="day"
            title="Review today."
            body="Use My Day to see what is planned now and what may need attention."
          />
        ) : null}

        {canShowMyDayGuidance ? (
          <CleanPageIntroVideo
            config={PAGE_INTRO_VIDEOS.myDay}
            promptTitle="New to My Day?"
            promptDescription="See how to choose today's next useful step."
          />
        ) : null}

        {shouldShowPlacementPrompt ? (
          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                  Start a learning pathway
                </h2>
                <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.7 }}>
                  Choose a learner and let MyLearna suggest a calm starting step.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={placementPromptHref} style={primaryButtonStyle}>
                  Start a pathway
                </Link>
                <Link href={manualPlacementPromptHref} style={secondaryButtonStyle}>
                  Choose manually
                </Link>
                {firstSetupMode ? (
                  <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={skipPlacementCheckForNow}
                  >
                    Skip for now
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mylearna-day-header" data-guidance-id="my-day-header" style={cardStyle}>
          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "#64748b",
              }}
            >
              Home base
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                lineHeight: 1.12,
                color: "#17204B",
                fontWeight: 650,
              }}
            >
              My Day
            </h1>
            <p
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.35,
              }}
            >
              {formatTodayHeading(selectedDate)}
            </p>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
              <span className="mylearna-day-intro-short">Plan one useful next step.</span>
              <span className="mylearna-day-intro-full">
                {familyGreeting} Start with one simple next step.
              </span>
            </p>
            {canShowMyDayGuidance ? (
              <div>
                <GuidancePageAction tourId="my-day" />
              </div>
            ) : null}
            <Link
              className="mylearna-day-header-capture"
              href={`${capturePathBase}?mode=quick&returnTo=${encodeURIComponent(dayPathBase)}${selectedLearnerId ? `&learner_id=${encodeURIComponent(selectedLearnerId)}` : ""}`}
              style={{
                width: "fit-content",
                minHeight: 46,
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 12,
                padding: "10px 15px",
                background: "#6c4df6",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 850,
              }}
            >
              Quick Capture
            </Link>
          </div>
        </section>

        {canShowMyDayGuidance ? (
          <div className="mylearna-day-getting-started">
            <GuidanceGettingStartedCard />
          </div>
        ) : null}

        <div className="mylearna-day-continue-card" data-guidance-id="my-day-next-steps">
          <CleanContinueWhereYouLeftOffCard actions={continueActions} />
        </div>
        </div>

        {workspace.loading && !workspace.profile && user?.id ? (
          <section
            style={cardStyle}
            role="region"
            aria-label="My Day primary content"
            data-testid="my-day-primary-loading-shell"
          >
            <div style={{ display: "grid", gap: 10 }}>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Today
              </span>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Today&apos;s plan</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                Your family workspace is connecting. This page is ready for today&apos;s plan
                and will fill in the learner details as they arrive.
              </p>
              <div
                style={{
                  minHeight: 84,
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  background: "#f8fbff",
                  padding: 14,
                  display: "grid",
                  gap: 6,
                }}
                aria-live="polite"
              >
                <strong style={{ color: "#0f172a" }}>{formatTodayHeading(selectedDate)}</strong>
                <span style={{ color: "#64748b" }}>Today&apos;s learning blocks will appear here.</span>
              </div>
              <button type="button" style={primaryButtonStyle} disabled>
                Add learning
              </button>
            </div>
          </section>
        ) : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>My Day is not ready yet.</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              Finish the family setup first, then come back here for today&apos;s flow.
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
            <p style={{ margin: 0, color: "#475569" }}>
              Create your family profile first on <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForDay && !workspace.learners.length ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#475569" }}>
              Add a learner first on <Link href="/my-profile">My Profile</Link> before using My Day.
            </p>
          </section>
        ) : null}

        {readyForDay && myDayPresentationState ? (
          <>
            <section
              className={`mylearna-day-desktop-activation mylearna-day-desktop-activation-${myDayPresentationState.toLowerCase()}`}
              aria-labelledby="my-day-activation-title"
            >
              <p style={{ margin: 0, color: "#2563eb", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                My Day
              </p>
              {myDayPresentationState === "SETUP_INCOMPLETE" ? (
                <>
                  <h1 id="my-day-activation-title" style={{ margin: 0, color: "#17204b", fontSize: 28 }}>Let&apos;s get MyLearna ready for your family.</h1>
                  <Link href={accountSetup.nextAction.href} style={primaryButtonStyle}>{accountSetup.nextAction.label}</Link>
                  {accountSetup.hasLearner ? (
                    <Link href={`${capturePathBase}?mode=quick${accountSetup.activeLearnerId ? `&learner_id=${encodeURIComponent(accountSetup.activeLearnerId)}` : ""}`} style={{ ...secondaryButtonStyle, textDecoration: "none", width: "fit-content" }}>
                      Capture something you already did
                    </Link>
                  ) : null}
                </>
              ) : null}
              {myDayPresentationState === "READY_FOR_FIRST_VALUE" ? (
                <>
                  <h1 id="my-day-activation-title" style={{ margin: 0, color: "#17204b", fontSize: 28 }}>How would you like to begin?</h1>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>Start by planning what&apos;s ahead, or capture learning that has already happened.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    <Link href="/my-calendar" onClick={() => trackFirstValueChoice("plan")} style={{ ...primaryButtonStyle, textDecoration: "none" }}>
                      <span style={{ display: "grid", gap: 4 }}>
                        <strong>Plan our learning</strong>
                        <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>Set up your usual rhythm and see what&apos;s coming up.</span>
                      </span>
                    </Link>
                    <Link href={`${capturePathBase}?mode=quick${accountSetup.activeLearnerId ? `&learner_id=${encodeURIComponent(accountSetup.activeLearnerId)}` : ""}`} onClick={() => trackFirstValueChoice("capture")} style={{ ...secondaryButtonStyle, textDecoration: "none", display: "grid", gap: 4 }}>
                      <strong>Capture learning</strong>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Record something you&apos;ve already done and start your learning record.</span>
                    </Link>
                  </div>
                </>
              ) : null}
              {myDayPresentationState === "RETURNING_EMPTY" ? (
                <>
                  <h1 id="my-day-activation-title" style={{ margin: 0, color: "#17204b", fontSize: 28 }}>Nothing planned for today.</h1>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>Add something for today, capture learning that already happened, or adjust your usual week.</p>
                  <button type="button" onClick={openQuickAdd} style={{ ...primaryButtonStyle, width: "fit-content" }}>Add a learning block</button>
                  <Link href={`${capturePathBase}?mode=quick${accountSetup.activeLearnerId ? `&learner_id=${encodeURIComponent(accountSetup.activeLearnerId)}` : ""}`} style={{ ...secondaryButtonStyle, textDecoration: "none", width: "fit-content" }}>
                    Capture something you already did
                  </Link>
                  <Link href={calendarPathBase} style={{ ...secondaryButtonStyle, textDecoration: "none", width: "fit-content" }}>Open My Calendar →</Link>
                </>
              ) : null}
            </section>
            {workspace.learners.length ? <div className={`mylearna-day-mature-content mylearna-day-mature-content-${myDayPresentationState.toLowerCase()}${quickAddOpen ? " mylearna-day-quick-add-open" : ""}`}>
            {guidanceLoading ? (
              <section style={cardStyle}>
                <p style={{ margin: 0, color: "#475569" }}>Loading your next steps...</p>
              </section>
            ) : null}

            {!guidanceLoading && guidanceError ? (
              <section style={cardStyle}>
                <p style={{ margin: 0, color: "#b91c1c" }}>{guidanceError}</p>
              </section>
            ) : null}

            {!guidanceLoading &&
            !guidanceError &&
            !hasPlannedItemsForSelectedDate &&
            !hasLateStageGuidance &&
            openGuidanceCards.length ? (
              <CleanGuidanceRibbon cards={openGuidanceCards} />
            ) : null}

            <section
              className="mylearna-day-plan-card"
              data-guidance-id="my-day-today-plan"
              style={{
                ...cardStyle,
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 16,
                }}
              >
                <div
                  className="mylearna-day-overview-card"
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: 20,
                    background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
                    padding: 22,
                    display: "grid",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "grid", gap: 8, flex: "1 1 280px", minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          color: "#64748b",
                          textTransform: "uppercase",
                        }}
                      >
                        {isViewingToday ? "Today’s flow" : "Family day"}
                      </div>
                      <h2
                        style={{
                          margin: 0,
                          color: "#0f172a",
                          fontSize: 30,
                          lineHeight: 1.08,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {isViewingToday ? "Learning blocks for today" : "Learning blocks for this day"}
                      </h2>
                      <p className="mylearna-day-overview-summary" style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.75 }}>
                        {overviewSummary}
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: 700, fontSize: 15 }}>
                        {nextUpLabel}: {nextUpSummary}
                      </p>
                    </div>
                    <div
                      className="mylearna-day-progress-panel"
                      data-guidance-id="my-day-progress-summary"
                      style={{
                        display: "grid",
                        gap: 8,
                        flex: "1 1 240px",
                        minWidth: 0,
                        padding: 14,
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.9)",
                        border: "1px solid #dbeafe",
                      }}
                    >
                      <label
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Day
                      </label>
                      <div className="mylearna-day-internal-navigator" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => router.push(buildDayPath(addDays(selectedDate, -1)))}
                        >
                          Previous day
                        </button>
                        <button
                          type="button"
                          style={{
                            ...secondaryButtonStyle,
                            background: isViewingToday ? "#eff6ff" : "#ffffff",
                            borderColor: isViewingToday ? "#93c5fd" : "#cbd5e1",
                            color: isViewingToday ? "#1d4ed8" : "#0f172a",
                            cursor: isViewingToday ? "default" : "pointer",
                          }}
                          onClick={() => router.push(buildDayPath(today))}
                          disabled={isViewingToday}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          style={secondaryButtonStyle}
                          onClick={() => router.push(buildDayPath(addDays(selectedDate, 1)))}
                        >
                          Next day
                        </button>
                      </div>
                      <label
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        View
                      </label>
                      <select
                        value={selectedLearnerId}
                        onChange={(event) => setSelectedLearnerId(event.target.value)}
                        style={compactInputStyle}
                      >
                        <option value="" style={{ background: "#ffffff", color: "#0f172a" }}>
                          All family
                        </option>
                        {learnerOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            style={{ background: "#ffffff", color: "#0f172a" }}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        ...overviewPillStyle,
                        padding: "9px 12px",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "#0f172a",
                        background: "#eff6ff",
                        borderColor: "#bfdbfe",
                      }}
                    >
                      {formatTodayHeading(selectedDate)}
                    </span>
                    <span style={overviewPillStyle}>{overviewFocusLabel}</span>
                    <span style={overviewPillStyle}>
                      {sortedVisibleItems.length} block{sortedVisibleItems.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div
                    className="mylearna-day-next-step-card"
                    style={{
                      border: "1px solid #dbeafe",
                      borderRadius: 18,
                      background: "rgba(248,251,255,0.92)",
                      padding: 16,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Today&apos;s next step
                    </div>
                    <div style={{ color: "#334155", fontWeight: 700, lineHeight: 1.55 }}>
                      Add a learning block, then capture what happens.
                    </div>
                    <CoreJourneyHelp>
                      <p>
                        Use My Day for today&apos;s learning. Add a quick block, open My
                        Calendar for fuller planning, then capture evidence when something
                        useful happens. Learning blocks stay compact until you open their
                        details.
                      </p>
                    </CoreJourneyHelp>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 14,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <strong style={{ color: "#0f172a", fontSize: 20, letterSpacing: "-0.02em" }}>
                      Family timeline
                    </strong>
                    <p className="mylearna-day-timeline-helper" style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                      Learning blocks stay small until you open the details.
                    </p>
                  </div>
                  <div className="mylearna-day-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={openQuickAdd} style={primaryButtonStyle}>
                      Add a quick block
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDailyPlannerDownload()}
                      style={secondaryButtonStyle}
                      disabled={dailyPlannerDownloading}
                    >
                      {dailyPlannerDownloading ? "Preparing..." : "Print today's plan"}
                    </button>
                    <Link
                      href={calendarPathBase}
                      style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}
                    >
                      Open My Calendar
                    </Link>
                  </div>
                </div>

                {quickAddOpen ? (
                  <form
                    className="mylearna-day-quick-add-form"
                    onSubmit={(event) => void handleQuickAddSubmit(event)}
                    style={quickAddCardStyle}
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
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a", fontSize: 18, letterSpacing: "-0.02em" }}>
                        {quickAddHeading}
                      </strong>
                      <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                        {quickAddLead}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeQuickAdd}
                      style={secondaryButtonStyle}
                      disabled={quickAddSubmitting}
                    >
                      Cancel
                    </button>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    }}
                  >
                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                        Activity
                      </span>
                      <input
                        value={quickAddTitle}
                        onChange={(event) => setQuickAddTitle(event.target.value)}
                        style={inputStyle}
                        placeholder="Read-aloud, maths, nature walk"
                        autoFocus
                      />
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                        Who is this for?
                      </span>
                      <select
                        value={quickAddLearnerId}
                        onChange={(event) => setQuickAddLearnerId(event.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Whole family</option>
                        {learnerOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                        Optional time
                      </span>
                      <input
                        type="time"
                        value={quickAddTime}
                        onChange={(event) => setQuickAddTime(event.target.value)}
                        style={inputStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: 6 }}>
                      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                        Learning area
                      </span>
                      <input
                        value={quickAddLearningArea}
                        onChange={(event) => setQuickAddLearningArea(event.target.value)}
                        list="clean-my-day-learning-areas"
                        style={inputStyle}
                        placeholder="Optional"
                      />
                    </label>

                  </div>

                  {quickAddError ? (
                    <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                      {quickAddError}
                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="submit" disabled={quickAddSubmitting} style={primaryButtonStyle}>
                      {quickAddSubmitting ? "Creating..." : "Create quick block"}
                    </button>
                    <Link
                      href={calendarPathBase}
                      style={{ color: "#1d4ed8", fontWeight: 700, fontSize: 14 }}
                    >
                      Open My Calendar instead
                    </Link>
                  </div>
                  </form>
                ) : null}

                {quickAddMessage ? (
                  <div role="status" style={{ color: "#166534", fontSize: 13, fontWeight: 700 }}>
                    {quickAddMessage}
                  </div>
                ) : null}

                {itemsLoading ? (
                  <p style={{ marginTop: 0, marginBottom: 0, color: "#475569" }}>
                    Loading this day&apos;s flow...
                  </p>
                ) : null}
                {itemsError ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <p style={{ marginTop: 0, marginBottom: 0, color: "#b91c1c" }}>
                      {itemsError}
                    </p>
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() => setDayReloadNonce((current) => current + 1)}
                    >
                      Try again
                    </button>
                  </div>
                ) : null}

                {!itemsLoading && !itemsError && !visibleItems.length ? (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 18,
                      background: "#fbfdff",
                      padding: 20,
                      display: "grid",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong style={{ color: "#0f172a", fontSize: 17, letterSpacing: "-0.01em" }}>
                        {hasPlannedItemsForSelectedDate && selectedLearnerLabel
                          ? `Nothing planned for ${selectedLearnerLabel} on this day yet.`
                          : isViewingToday
                            ? "Nothing planned for today yet."
                            : "Nothing planned for this day yet."}
                      </strong>
                      <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                        {hasPlannedItemsForSelectedDate && selectedLearnerLabel
                          ? `Try the full family view, add one quick block here, or open My Calendar to adjust ${
                              isViewingToday ? "today" : "this day"
                            }.`
                          : `Add one quick block here when you want to plan immediately, or open My Calendar for the fuller planning view.`}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={openQuickAdd} style={primaryButtonStyle}>
                        {quickAddOpen ? "Quick add is open above" : "Add a quick block"}
                      </button>
                      <Link
                        href={calendarPathBase}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0f172a",
                          borderRadius: 10,
                          padding: "10px 14px",
                          fontSize: 14,
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        Open My Calendar
                      </Link>
                    </div>
                  </div>
                ) : null}

                {!itemsLoading && visibleItems.length ? (
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    position: "relative",
                  }}
                >
                  {sortedVisibleItems.map((item) => {
                    const learnerLabel =
                      learnerLabelById.get(item.learnerId ?? "") || "Whole family";
                    const expanded = expandedItemIds.includes(item.id);
                    const capturedEvidence =
                      evidenceByCalendarItemId.get(item.id) ?? null;
                    const programLabel = item.programId
                      ? programLabelById.get(item.programId) ?? null
                      : null;
                    const segmentLabel = item.programSegmentId
                      ? segmentLabelById.get(item.programSegmentId) ?? null
                      : null;
                    const notesPreview = getPreviewText(item.description);

                    return (
                      <div
                        key={item.id}
                        style={{
                          border: expanded ? "1px solid #cfe3ff" : "1px solid #e2e8f0",
                          borderRadius: 18,
                          background: expanded ? "#ffffff" : "#fcfdff",
                          padding: 0,
                          display: "grid",
                          overflow: "hidden",
                          boxShadow: expanded
                            ? "0 10px 24px rgba(15,23,42,0.05)"
                            : "0 4px 14px rgba(15,23,42,0.03)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 14,
                            alignItems: "flex-start",
                            padding: 14,
                            background: expanded ? "#f8fbff" : "#fcfdff",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div
                            style={{
                              minWidth: 88,
                              display: "grid",
                              gap: 4,
                              color: "#1d4ed8",
                              fontWeight: 800,
                              flexShrink: 0,
                              alignSelf: "stretch",
                              padding: "10px 12px",
                              borderRadius: 14,
                              background: expanded ? "#dbeafe" : "#eff6ff",
                            }}
                          >
                            <span>{formatTimeLabel(item.startsAt)}</span>
                            {item.endsAt ? (
                              <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                                to {formatTimeLabel(item.endsAt)}
                              </span>
                            ) : null}
                          </div>
                          <div style={{ display: "grid", gap: 8, flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                              }}
                            >
                              <strong style={{ color: "#0f172a", fontSize: 16 }}>{item.title}</strong>
                              <span style={{ color: "#64748b", fontSize: 13, fontWeight: 700 }}>
                                {expanded ? "Hide details" : "Show details"}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <span style={blockMetaPillStyle}>{learnerLabel}</span>
                              {item.learningArea ? (
                                <span style={blockMetaPillStyle}>{item.learningArea}</span>
                              ) : null}
                              {programLabel ? (
                                <span style={blockMetaPillStyle}>{`Program: ${programLabel}`}</span>
                              ) : null}
                              {segmentLabel ? (
                                <span style={blockMetaPillStyle}>{`Week / segment: ${segmentLabel}`}</span>
                              ) : null}
                              {capturedEvidence ? (
                                <span style={blockMetaPillStyle}>✓ Learning captured</span>
                              ) : null}
                            </div>
                            <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                              {notesPreview ?? "Open for notes and capture."}
                            </div>
                          </div>
                        </button>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                            padding: "0 14px 12px",
                          }}
                        >
                          {item.completedAt ? (
                            <>
                              <span
                                role="status"
                                style={{ color: "#166534", fontSize: 13, fontWeight: 800 }}
                              >
                                ✓ Completed
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleCompletionToggle(item)}
                                disabled={completionUpdatingId === item.id}
                                aria-label={`Mark ${item.title} not complete`}
                                style={{
                                  ...secondaryButtonStyle,
                                  padding: "7px 10px",
                                  color: "#475569",
                                  fontSize: 12,
                                  opacity: completionUpdatingId === item.id ? 0.6 : 1,
                                }}
                              >
                                {completionUpdatingId === item.id
                                  ? "Updating..."
                                  : "Mark not complete"}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleCompletionToggle(item)}
                              disabled={completionUpdatingId === item.id}
                              aria-label={`Mark ${item.title} complete`}
                              style={{
                                ...secondaryButtonStyle,
                                padding: "7px 10px",
                                color: "#166534",
                                borderColor: "#bbf7d0",
                                background: "#f0fdf4",
                                fontSize: 12,
                                opacity: completionUpdatingId === item.id ? 0.6 : 1,
                              }}
                            >
                              {completionUpdatingId === item.id
                                ? "Updating..."
                                : "○ Mark complete"}
                            </button>
                          )}
                          {completionError?.itemId === item.id ? (
                            <span role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
                              {completionError.message}
                            </span>
                          ) : null}
                        </div>

                        {expanded ? (
                          <div
                            style={{
                              borderTop: "1px solid #e2e8f0",
                              background: "#fbfdff",
                              padding: 14,
                              display: "grid",
                              gap: 10,
                            }}
                          >
                            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                              Details
                            </div>
                            {item.description ? (
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                {item.description}
                              </p>
                            ) : (
                              <p style={{ margin: 0, color: "#64748b" }}>
                                No extra notes yet for this learning block.
                              </p>
                            )}
                            {programLabel || segmentLabel ? (
                              <div style={{ color: "#475569", lineHeight: 1.6 }}>
                                {programLabel ? `Program: ${programLabel}` : ""}
                                {programLabel && segmentLabel ? " - " : ""}
                                {segmentLabel ? `Week / segment: ${segmentLabel}` : ""}
                              </div>
                            ) : null}
                            {capturedEvidence ? (
                              <div style={{ color: "#0f766e", fontWeight: 700 }}>
                                ✓ Learning captured
                              </div>
                            ) : null}
                            <div
                              data-guidance-id="my-day-capture-evidence"
                              style={{ display: "flex", gap: 14, flexWrap: "wrap" }}
                            >
                              {capturedEvidence ? (
                                <Link
                                  href={buildCaptureHref(item, capturedEvidence.id)}
                                  style={{ color: "#1d4ed8", fontWeight: 700 }}
                                >
                                  View capture
                                </Link>
                              ) : (
                                <Link
                                  href={buildCaptureHref(item)}
                                  style={{ color: "#1d4ed8", fontWeight: 700 }}
                                >
                                  Quick Capture
                                </Link>
                              )}
                              <Link
                                href={calendarPathBase}
                                style={{ color: "#1d4ed8", fontWeight: 700 }}
                              >
                                Open in My Calendar
                              </Link>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
                <datalist id="clean-my-day-learning-areas">
                  {COMMON_LEARNING_AREAS.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
              </div>
            </section>

            {!guidanceLoading &&
            !guidanceError &&
            (hasPlannedItemsForSelectedDate || hasLateStageGuidance) &&
            openGuidanceCards.length ? (
              <CleanGuidanceRibbon cards={openGuidanceCards} compact />
            ) : null}

            {PUBLIC_PATHWAYS_ENABLED ? <section data-guidance-id="my-day-next-pathways" style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "grid", gap: 6, maxWidth: 620 }}>
                  <p style={{ margin: 0, color: "#2563eb", fontWeight: 800, fontSize: 13 }}>
                    Next step
                  </p>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
                    Explore My Pathways
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    Find the next step, worksheet, practise or assess option.
                  </p>
                  <GuidanceSetupNextAction
                    stepId="day"
                    nextHref="/my-pathways"
                    label="Continue to My Pathways"
                    helperText="My Day has been reviewed. Continue to explore learning pathways."
                  />
                </div>
                <Link href={currentPathwayHref} style={{ ...secondaryButtonStyle, textDecoration: "none" }}>
                  Open My Pathways
                </Link>
              </div>
            </section> : null}

            <CleanFeedbackPrompt pageName="My Day" />
            </div> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanDayWorkspace() {
  return <CleanDayWorkspaceBody />;
}
