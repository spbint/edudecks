"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import CleanFirstRunSetupGate from "@/app/components/clean/setup/CleanFirstRunSetupGate";
import CleanPageIntroVideo from "@/app/components/clean/CleanPageIntroVideo";
import {
  CleanFeedbackPrompt,
  CleanContinueWhereYouLeftOffCard,
} from "@/app/components/clean/CleanPersonalisationCards";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanGuidanceRibbon from "@/app/components/clean/CleanGuidanceRibbon";
import V2LoadingState from "@/app/components/clean/design-v2/V2LoadingState";
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
} from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import { listCleanEvidenceEntries } from "@/lib/clean/evidence/client";
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
import {
  listCleanAcademicYears,
  listCleanLearningPeriods,
} from "@/lib/clean/terms/client";
import { hasAnyPathwayPlacementForLearner } from "@/lib/clean/pathways/pathwayPlacement";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #fdfefe 45%, #f8fafc 100%)",
  padding: "clamp(18px, 4vw, 28px) clamp(12px, 4vw, 18px) 44px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  display: "grid",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  background: "#ffffff",
  padding: 22,
  boxShadow: "0 14px 32px rgba(15,23,42,0.04)",
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
  const { enabled: guidanceEnabled, setupStatus, completeSetupStep } = useGuidance();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [items, setItems] = useState<CleanCalendarItem[]>([]);
  const [evidenceEntries, setEvidenceEntries] = useState<CleanEvidenceEntry[]>([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
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
  const [hasPlacementForPromptLearner, setHasPlacementForPromptLearner] = useState(false);

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
    ? "Add today's learning block here, then capture evidence later when something useful happens. Use My Calendar when you want the fuller planning view."
    : "Add this day's learning block here, then capture evidence later when something useful happens. Use My Calendar when you want the fuller planning view.";
  const familyDisplayName = String(workspace.profile?.displayName ?? "").trim();
  const familyGreeting = familyDisplayName
    ? `Welcome back, ${familyDisplayName}.`
    : "Welcome back.";
  const firstSetupMode =
    guidanceEnabled && (setupStatus === "not_started" || setupStatus === "active");
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
    firstSetupMode ||
    (workspace.learners.length > 0 && !hasPlacementForPromptLearner);
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
      {
        href: currentPathwayHref,
        label: pathwayLabel,
        tone: "green" as const,
      },
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
        setItems([]);
        setEvidenceEntries([]);
        setPrograms([]);
        setProgramSegments([]);
        return;
      }

      setItemsLoading(true);
      setItemsError(null);
      try {
        const [nextItems, nextEvidenceEntries, nextPrograms] = await Promise.all([
          listCleanCalendarItems(workspace.profile.id, {
            fromDate: selectedDate,
            toDate: selectedDate,
            limit: 40,
          }),
          listCleanEvidenceEntries(workspace.profile.id, {
            fromDate: selectedDate,
            toDate: selectedDate,
            limit: 60,
          }),
          listCleanPrograms(workspace.profile.id, { limit: 50 }),
        ]);

        const nextProgramSegments = (
          await Promise.all(
            nextPrograms.map((program) =>
              listCleanProgramSegments(workspace.profile!.id, program.id),
            ),
          )
        ).flat();

        setItems(nextItems);
        setEvidenceEntries(nextEvidenceEntries);
        setPrograms(nextPrograms);
        setProgramSegments(nextProgramSegments);
      } catch (error) {
        setItemsError(
          normalizeCleanErrorMessage(
            error,
            "We could not load this day's learning blocks.",
          ),
        );
      } finally {
        setItemsLoading(false);
      }
    }

    void loadItems();
  }, [
    selectedDate,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

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
    if (setupStatus === "active") {
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

  const readyForDay = !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;
  const hasPlannedItemsForSelectedDate = items.length > 0;

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <CleanFirstRunSetupGate currentStep="day" />
        <GuidanceSetupProgress
          stepId="day"
          title="Review today."
          body="Use My Day to see what is planned now and what may need attention."
        />

        <CleanPageIntroVideo
          config={PAGE_INTRO_VIDEOS.myDay}
          promptTitle="New to My Day?"
          promptDescription="Watch a quick guide to see today's learning, add quick blocks and connect daily learning to evidence capture."
        />

        {shouldShowPlacementPrompt ? (
          <section style={cardStyle}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, color: "#0f172a", fontSize: 24 }}>
                  Start a learning pathway
                </h2>
                <p style={{ margin: "8px 0 0", color: "#475569", lineHeight: 1.7 }}>
                  Choose one learner and one strand. MyLearna will suggest a starting
                  step, then you can practise, check, move forward, or move back.
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

        <section data-guidance-id="my-day-header" style={cardStyle}>
          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Family day
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#0f172a",
              }}
            >
              My Day
            </h1>
            <p
              style={{
                margin: 0,
                color: "#0f172a",
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.35,
              }}
            >
              {formatTodayHeading(selectedDate)}
            </p>
            <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
              {familyGreeting} See what is planned and what comes next.
            </p>
            <div>
              <GuidancePageAction tourId="my-day" />
            </div>
          </div>
        </section>

        <GuidanceGettingStartedCard />

        <div data-guidance-id="my-day-next-steps">
          <CleanContinueWhereYouLeftOffCard actions={continueActions} />
        </div>

        {workspace.loading ? (
          <V2LoadingState
            title="Preparing My Day"
            body="We are loading today&apos;s rhythm, learner details, and saved blocks."
          />
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

        {readyForDay && workspace.learners.length ? (
          <>
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
                      <p style={{ margin: 0, color: "#475569", fontSize: 15, lineHeight: 1.75 }}>
                        {overviewSummary}
                      </p>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: 700, fontSize: 15 }}>
                        {nextUpLabel}: {nextUpSummary}
                      </p>
                    </div>
                    <div
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
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                    <div style={{ color: "#475569", lineHeight: 1.7 }}>
                      Use My Day for today&apos;s learning. Add a quick block, open My
                      Calendar for fuller planning, then capture evidence when something
                      useful happens.
                    </div>
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
                    <p style={{ margin: 0, color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>
                      Learning blocks stay small until you open the details.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button type="button" onClick={openQuickAdd} style={primaryButtonStyle}>
                      Add a quick block
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
                  <p style={{ marginTop: 0, marginBottom: 0, color: "#b91c1c" }}>
                    {itemsError}
                  </p>
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

              {!itemsLoading && !itemsError && visibleItems.length ? (
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
                                <span style={blockMetaPillStyle}>Evidence captured</span>
                              ) : null}
                            </div>
                            <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                              {notesPreview ?? "Open this block to see notes and capture what happened."}
                            </div>
                          </div>
                        </button>

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
                                Evidence captured
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
                                  Capture what happened
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

            <section data-guidance-id="my-day-next-pathways" style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "grid", gap: 6, maxWidth: 620 }}>
                  <p style={{ margin: 0, color: "#2563eb", fontWeight: 800, fontSize: 13 }}>
                    Next step
                  </p>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>
                    Explore My Pathways
                  </h2>
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    When you are ready, use My Pathways to find the next learning step, worksheet, practise or assess option.
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
            </section>

            <CleanFeedbackPrompt pageName="My Day" />
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanDayWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanDayWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
