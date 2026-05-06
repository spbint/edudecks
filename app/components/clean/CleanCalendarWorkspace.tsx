"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CleanCalendarPopover from "@/app/components/clean/CleanCalendarPopover";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import {
  createCleanCalendarItem,
  deleteCleanCalendarItem,
  listCleanCalendarItems,
  updateCleanCalendarItem,
} from "@/lib/clean/calendar/client";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import {
  buildCleanGeneratedWeekPreview,
  createCleanGenerationRun,
  listCleanGenerationRuns,
} from "@/lib/clean/generation/client";
import type { CleanGeneratedWeekSuggestion, CleanGenerationRun } from "@/lib/clean/generation/types";
import {
  CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  listCleanProgramSegments,
  listCleanPrograms,
} from "@/lib/clean/programs/client";
import type {
  CleanProgram,
  CleanProgramSegment,
} from "@/lib/clean/programs/types";
import {
  createCleanMasterTemplate,
  createCleanTemplateBlock,
  listCleanMasterTemplates,
  listCleanTemplateBlocks,
  updateCleanTemplateBlock,
} from "@/lib/clean/templates/client";
import type {
  CleanMasterTemplate,
  CleanTemplateBlock,
} from "@/lib/clean/templates/types";
import {
  createCleanAcademicYear,
  createCleanLearningPeriod,
  listCleanAcademicYears,
  listCleanBlackoutDays,
  listCleanLearningPeriods,
} from "@/lib/clean/terms/client";
import type {
  CleanAcademicYear,
  CleanBlackoutDay,
  CleanLearningPeriod,
  CleanLearningPeriodType,
} from "@/lib/clean/terms/types";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
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
  minHeight: 100,
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

const mutedButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#0f172a",
};

const AUSTRALIAN_LEARNING_AREAS = [
  "English",
  "Mathematics",
  "Science",
  "Humanities and Social Sciences",
  "The Arts",
  "Languages",
  "Health and Physical Education",
  "Technologies",
];

const PERIOD_TYPES: CleanLearningPeriodType[] = [
  "term",
  "semester",
  "unit",
  "break",
  "custom",
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
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

function getWeekDates(weekStartsOn: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStartsOn, index));
}

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
  });
}

function formatWeekRangeLabel(startsOn: string, endsOn: string) {
  return `${formatDateLabel(startsOn)} to ${formatDateLabel(endsOn)}`;
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

function toTimeFieldValue(timestamp: string | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function CleanCalendarWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();

  const [academicYears, setAcademicYears] = useState<CleanAcademicYear[]>([]);
  const [learningPeriods, setLearningPeriods] = useState<CleanLearningPeriod[]>([]);
  const [blackoutDays, setBlackoutDays] = useState<CleanBlackoutDay[]>([]);
  const [masterTemplates, setMasterTemplates] = useState<CleanMasterTemplate[]>([]);
  const [templateBlocks, setTemplateBlocks] = useState<CleanTemplateBlock[]>([]);
  const [programs, setPrograms] = useState<CleanProgram[]>([]);
  const [programSegments, setProgramSegments] = useState<CleanProgramSegment[]>([]);
  const [generationRuns, setGenerationRuns] = useState<CleanGenerationRun[]>([]);
  const [items, setItems] = useState<CleanCalendarItem[]>([]);

  const [setupLoading, setSetupLoading] = useState(false);
  const [templateBlocksLoading, setTemplateBlocksLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState("");
  const [selectedLearningPeriodId, setSelectedLearningPeriodId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedWeekStart, setSelectedWeekStart] = useState(getWeekStart());

  const [yearTitle, setYearTitle] = useState("");
  const [yearStartsOn, setYearStartsOn] = useState(getWeekStart());
  const [yearEndsOn, setYearEndsOn] = useState(addDays(getWeekStart(), 83));
  const [yearCountryCode, setYearCountryCode] = useState("AU");
  const [yearJurisdictionCode, setYearJurisdictionCode] = useState("");

  const [periodTitle, setPeriodTitle] = useState("");
  const [periodStartsOn, setPeriodStartsOn] = useState(getWeekStart());
  const [periodEndsOn, setPeriodEndsOn] = useState(addDays(getWeekStart(), 13));
  const [periodType, setPeriodType] = useState<CleanLearningPeriodType>("term");
  const [periodIsBreak, setPeriodIsBreak] = useState(false);

  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateScopeType, setTemplateScopeType] = useState<"family" | "learner">("family");
  const [templateLearnerId, setTemplateLearnerId] = useState("");

  const [editingTemplateBlockId, setEditingTemplateBlockId] = useState<string | null>(null);
  const [blockWeekday, setBlockWeekday] = useState("1");
  const [blockTitle, setBlockTitle] = useState("");
  const [blockLearningArea, setBlockLearningArea] = useState("");
  const [blockLearnerId, setBlockLearnerId] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockProgramId, setBlockProgramId] = useState("");
  const [blockProgramSegmentId, setBlockProgramSegmentId] = useState("");
  const [blockSessionLabel, setBlockSessionLabel] = useState("");
  const [blockNotes, setBlockNotes] = useState("");

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [popoverDate, setPopoverDate] = useState(getTodayDate());
  const [popoverTitle, setPopoverTitle] = useState("");
  const [popoverLearnerId, setPopoverLearnerId] = useState("");
  const [popoverLearningArea, setPopoverLearningArea] = useState("");
  const [popoverStartTime, setPopoverStartTime] = useState("");
  const [popoverEndTime, setPopoverEndTime] = useState("");
  const [popoverDescription, setPopoverDescription] = useState("");
  const [popoverProgramId, setPopoverProgramId] = useState("");
  const [popoverProgramSegmentId, setPopoverProgramSegmentId] = useState("");

  const [generationWeekStart, setGenerationWeekStart] = useState(getWeekStart());
  const [previewSuggestions, setPreviewSuggestions] = useState<CleanGeneratedWeekSuggestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
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

  const programOptions = useMemo(
    () =>
      programs.map((program) => ({
        value: program.id,
        label: program.title,
      })),
    [programs],
  );

  const selectedTemplate =
    masterTemplates.find((template) => template.id === selectedTemplateId) ?? null;

  const selectedWeekEnd = useMemo(() => addDays(selectedWeekStart, 6), [selectedWeekStart]);
  const generationWeekEnd = useMemo(
    () => addDays(generationWeekStart, 6),
    [generationWeekStart],
  );
  const weekDates = useMemo(() => getWeekDates(selectedWeekStart), [selectedWeekStart]);

  const itemsByDate = useMemo(() => {
    const grouped = new Map<string, CleanCalendarItem[]>();
    for (const item of items) {
      const existing = grouped.get(item.plannedDate) ?? [];
      existing.push(item);
      grouped.set(item.plannedDate, existing);
    }
    return grouped;
  }, [items]);

  const visibleLearningPeriods = useMemo(() => {
    if (!selectedAcademicYearId) return learningPeriods;
    return learningPeriods.filter((period) => period.academicYearId === selectedAcademicYearId);
  }, [learningPeriods, selectedAcademicYearId]);

  const visibleBlockSegments = useMemo(() => {
    if (!blockProgramId) return [];
    return programSegments
      .filter((segment) => segment.programId === blockProgramId)
      .map((segment) => ({
        value: segment.id,
        label: segment.title,
      }));
  }, [blockProgramId, programSegments]);

  const visiblePopoverSegments = useMemo(() => {
    if (!popoverProgramId) return [];
    return programSegments
      .filter((segment) => segment.programId === popoverProgramId)
      .map((segment) => ({
        value: segment.id,
        label: segment.title,
      }));
  }, [popoverProgramId, programSegments]);

  const generationSummary = useMemo(() => {
    const created = previewSuggestions.filter((item) => !item.skippedReason).length;
    const skipped = previewSuggestions.filter((item) => Boolean(item.skippedReason)).length;
    return { created, skipped };
  }, [previewSuggestions]);

  const readyForCalendar =
    !workspace.loading && !workspace.schemaMissing && !workspace.requiresFamilyCreation;

  const reloadSetupData = useCallback(async () => {
    if (!workspace.profile) return;

    setSetupLoading(true);
    setSetupError(null);

    try {
      const [
        nextAcademicYears,
        nextLearningPeriods,
        nextBlackoutDays,
        nextMasterTemplates,
        nextPrograms,
        nextGenerationRuns,
      ] = await Promise.all([
        listCleanAcademicYears(workspace.profile.id, { limit: 20 }),
        listCleanLearningPeriods(workspace.profile.id, { limit: 50 }),
        listCleanBlackoutDays(workspace.profile.id, { limit: 50 }),
        listCleanMasterTemplates(workspace.profile.id, { limit: 20 }),
        listCleanPrograms(workspace.profile.id, { limit: 50 }),
        listCleanGenerationRuns(workspace.profile.id, { limit: 20 }),
      ]);

      const segmentGroups = await Promise.all(
        nextPrograms.map((program) =>
          listCleanProgramSegments(workspace.profile!.id, program.id),
        ),
      );

      setAcademicYears(nextAcademicYears);
      setLearningPeriods(nextLearningPeriods);
      setBlackoutDays(nextBlackoutDays);
      setMasterTemplates(nextMasterTemplates);
      setPrograms(nextPrograms);
      setProgramSegments(segmentGroups.flat());
      setGenerationRuns(nextGenerationRuns);

      setSelectedAcademicYearId((current) =>
        current && nextAcademicYears.some((year) => year.id === current)
          ? current
          : nextAcademicYears[0]?.id ?? "",
      );

      setSelectedTemplateId((current) =>
        current && nextMasterTemplates.some((template) => template.id === current)
          ? current
          : nextMasterTemplates[0]?.id ?? "",
      );
    } catch (error) {
      setSetupError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean homeschool intelligence scaffolds just now.",
        ),
      );
    } finally {
      setSetupLoading(false);
    }
  }, [workspace.profile]);

  const reloadTemplateBlocks = useCallback(async () => {
    if (!workspace.profile || !selectedTemplateId) {
      setTemplateBlocks([]);
      return;
    }

    setTemplateBlocksLoading(true);
    setSetupError(null);

    try {
      const nextTemplateBlocks = await listCleanTemplateBlocks(
        workspace.profile.id,
        selectedTemplateId,
      );
      setTemplateBlocks(nextTemplateBlocks);
    } catch (error) {
      setSetupError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean master template blocks just now.",
        ),
      );
    } finally {
      setTemplateBlocksLoading(false);
    }
  }, [selectedTemplateId, workspace.profile]);

  const reloadWeekItems = useCallback(async () => {
    if (!workspace.profile) return;

    setItemsLoading(true);
    setItemsError(null);
    try {
      const nextItems = await listCleanCalendarItems(workspace.profile.id, {
        fromDate: selectedWeekStart,
        toDate: selectedWeekEnd,
        limit: 100,
      });
      setItems(nextItems);
    } catch (error) {
      setItemsError(
        normalizeCleanErrorMessage(
          error,
          "We could not load clean calendar items just now.",
        ),
      );
    } finally {
      setItemsLoading(false);
    }
  }, [selectedWeekEnd, selectedWeekStart, workspace.profile]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setAcademicYears([]);
      setLearningPeriods([]);
      setBlackoutDays([]);
      setMasterTemplates([]);
      setTemplateBlocks([]);
      setPrograms([]);
      setProgramSegments([]);
      setGenerationRuns([]);
      setItems([]);
      return;
    }

    void reloadSetupData();
  }, [
    reloadSetupData,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    void reloadTemplateBlocks();
  }, [reloadTemplateBlocks]);

  useEffect(() => {
    if (!workspace.profile || workspace.schemaMissing || workspace.requiresFamilyCreation) {
      setItems([]);
      return;
    }

    void reloadWeekItems();
  }, [
    reloadWeekItems,
    workspace.profile,
    workspace.requiresFamilyCreation,
    workspace.schemaMissing,
  ]);

  useEffect(() => {
    if (
      selectedLearningPeriodId &&
      !visibleLearningPeriods.some((period) => period.id === selectedLearningPeriodId)
    ) {
      setSelectedLearningPeriodId("");
    }
  }, [selectedLearningPeriodId, visibleLearningPeriods]);

  function resetTemplateBlockForm() {
    setEditingTemplateBlockId(null);
    setBlockWeekday("1");
    setBlockTitle("");
    setBlockLearningArea("");
    setBlockLearnerId("");
    setBlockStartTime("");
    setBlockEndTime("");
    setBlockProgramId("");
    setBlockProgramSegmentId("");
    setBlockSessionLabel("");
    setBlockNotes("");
  }

  function resetPopoverForm() {
    setEditingItemId(null);
    setPopoverDate(getTodayDate());
    setPopoverTitle("");
    setPopoverLearnerId("");
    setPopoverLearningArea("");
    setPopoverStartTime("");
    setPopoverEndTime("");
    setPopoverDescription("");
    setPopoverProgramId("");
    setPopoverProgramSegmentId("");
  }

  function openCreatePopover(dateValue: string) {
    resetPopoverForm();
    setPopoverDate(dateValue);
    setPopoverOpen(true);
    setMessage(null);
    setActionError(null);
  }

  function openEditPopover(item: CleanCalendarItem) {
    setEditingItemId(item.id);
    setPopoverDate(item.plannedDate);
    setPopoverTitle(item.title);
    setPopoverLearnerId(item.learnerId ?? "");
    setPopoverLearningArea(item.learningArea ?? "");
    setPopoverStartTime(toTimeFieldValue(item.startsAt));
    setPopoverEndTime(toTimeFieldValue(item.endsAt));
    setPopoverDescription(item.description ?? "");
    setPopoverProgramId(item.programId ?? "");
    setPopoverProgramSegmentId(item.programSegmentId ?? "");
    setPopoverOpen(true);
    setMessage(null);
    setActionError(null);
  }

  function closePopover() {
    setPopoverOpen(false);
    resetPopoverForm();
  }

  async function handleAcademicYearSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const created = await createCleanAcademicYear(workspace.profile.id, {
        title: yearTitle,
        startsOn: yearStartsOn,
        endsOn: yearEndsOn,
        countryCode: yearCountryCode || null,
        jurisdictionCode: yearJurisdictionCode || null,
      });
      setSelectedAcademicYearId(created.id);
      setMessage("Academic year created.");
      setYearTitle("");
      await reloadSetupData();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the clean academic year.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLearningPeriodSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await createCleanLearningPeriod(workspace.profile.id, {
        academicYearId: selectedAcademicYearId,
        title: periodTitle,
        periodType,
        startsOn: periodStartsOn,
        endsOn: periodEndsOn,
        isBreak: periodIsBreak,
      });
      setMessage("Learning period created.");
      setPeriodTitle("");
      await reloadSetupData();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the clean learning period.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTemplateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const created = await createCleanMasterTemplate(workspace.profile.id, {
        title: templateTitle,
        description: templateDescription || null,
        scopeType: templateScopeType,
        learnerId: templateLearnerId || null,
        isActive: true,
      });
      setSelectedTemplateId(created.id);
      setMessage("Master template created.");
      setTemplateTitle("");
      setTemplateDescription("");
      setTemplateLearnerId("");
      setTemplateScopeType("family");
      await reloadSetupData();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the clean master template.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTemplateBlockSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace.profile || !selectedTemplateId) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        learnerId: blockLearnerId || null,
        weekday: Number.parseInt(blockWeekday, 10) || 1,
        title: blockTitle,
        learningArea: blockLearningArea || null,
        startsAt: blockStartTime || null,
        endsAt: blockEndTime || null,
        programId: blockProgramId || null,
        programSegmentId: blockProgramSegmentId || null,
        notes: blockNotes || null,
        sessionLabel: blockSessionLabel || null,
      };

      if (editingTemplateBlockId) {
        await updateCleanTemplateBlock(
          workspace.profile.id,
          editingTemplateBlockId,
          payload,
        );
        setMessage("Template block updated.");
      } else {
        await createCleanTemplateBlock(
          workspace.profile.id,
          selectedTemplateId,
          payload,
        );
        setMessage("Template block created.");
      }

      resetTemplateBlockForm();
      await reloadTemplateBlocks();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the clean template block.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditTemplateBlock(block: CleanTemplateBlock) {
    setEditingTemplateBlockId(block.id);
    setBlockWeekday(String(block.weekday));
    setBlockTitle(block.title);
    setBlockLearningArea(block.learningArea ?? "");
    setBlockLearnerId(block.learnerId ?? "");
    setBlockStartTime(block.startsAt ? safeTimeString(block.startsAt) : "");
    setBlockEndTime(block.endsAt ? safeTimeString(block.endsAt) : "");
    setBlockProgramId(block.programId ?? "");
    setBlockProgramSegmentId(block.programSegmentId ?? "");
    setBlockSessionLabel(block.sessionLabel ?? "");
    setBlockNotes(block.notes ?? "");
  }

  async function handlePreviewGeneration() {
    const nextPreview = buildCleanGeneratedWeekPreview({
      weekStartsOn: generationWeekStart,
      weekEndsOn: generationWeekEnd,
      templateBlocks,
      blackoutDays,
      programSegments: programSegments.map((segment) => ({
        id: segment.id,
        programId: segment.programId,
        title: segment.title,
      })),
    });
    setPreviewSuggestions(nextPreview);
    setMessage("Week preview generated. Review before recording the run.");
    setActionError(null);
  }

  async function handleRecordGenerationRun() {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = previewSuggestions.length
        ? previewSuggestions
        : buildCleanGeneratedWeekPreview({
            weekStartsOn: generationWeekStart,
            weekEndsOn: generationWeekEnd,
            templateBlocks,
            blackoutDays,
            programSegments: programSegments.map((segment) => ({
              id: segment.id,
              programId: segment.programId,
              title: segment.title,
            })),
          });

      await createCleanGenerationRun(workspace.profile.id, {
        academicYearId: selectedAcademicYearId || null,
        learningPeriodId: selectedLearningPeriodId || null,
        masterTemplateId: selectedTemplateId || null,
        weekStartsOn: generationWeekStart,
        weekEndsOn: generationWeekEnd,
        mergeStrategy: "fill-empty",
        status: "recorded",
        previewPayload: payload,
        createdItemsCount: payload.filter((item) => !item.skippedReason).length,
        skippedItemsCount: payload.filter((item) => Boolean(item.skippedReason)).length,
        notes: "Scaffold only. Calendar item application remains a later controlled step.",
      });

      setPreviewSuggestions(payload);
      setMessage("Generation run recorded. Calendar application is intentionally deferred.");
      await reloadSetupData();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not record the clean generation run.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePopoverSave() {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      const payload = {
        title: popoverTitle,
        plannedDate: popoverDate,
        learnerId: popoverLearnerId || null,
        programId: popoverProgramId || null,
        programSegmentId: popoverProgramSegmentId || null,
        learningArea: popoverLearningArea || null,
        startsAt: toTimestampFromDateAndTime(popoverDate, popoverStartTime),
        endsAt: toTimestampFromDateAndTime(popoverDate, popoverEndTime),
        description: popoverDescription || null,
        sourceType: "manual" as const,
      };

      if (editingItemId) {
        await updateCleanCalendarItem(workspace.profile.id, editingItemId, payload);
        setMessage("Calendar block updated.");
      } else {
        await createCleanCalendarItem(workspace.profile.id, payload);
        setMessage("Calendar block created.");
      }

      closePopover();
      await reloadWeekItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not save the clean calendar block.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteItem(item: CleanCalendarItem) {
    if (!workspace.profile) return;

    setSubmitting(true);
    setMessage(null);
    setActionError(null);

    try {
      await deleteCleanCalendarItem(workspace.profile.id, item.id);
      setMessage("Calendar block deleted.");
      if (editingItemId === item.id) {
        closePopover();
      }
      await reloadWeekItems();
    } catch (error) {
      setActionError(
        normalizeCleanErrorMessage(
          error,
          "We could not delete the clean calendar block.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
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
              Clean rebuild scaffold
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Calendar</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              The calendar is the central planning surface. This controlled build adds term setup, weekly rhythm scaffolding, a generate-week preview, and direct popover add/edit.
            </p>
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading clean family workspace...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>{CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              The clean calendar and intelligence scaffolds will not fall back to legacy planning tables.
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
              Calendar intelligence is family-scoped in the clean rebuild. Create the family profile first on{" "}
              <Link href="/my-profile">My Profile</Link>.
            </p>
          </section>
        ) : null}

        {readyForCalendar && !workspace.learners.length ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Add a learner first</h2>
            <p style={{ margin: 0, color: "#475569" }}>
              Add at least one learner on <Link href="/my-profile">My Profile</Link> before building terms, weekly rhythm, or generated weeks.
            </p>
          </section>
        ) : null}

        {readyForCalendar && workspace.profile && workspace.learners.length ? (
          <>
            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Learning year and periods</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Set the year first, then add terms, units, or break windows. Generation uses these dates to stay inside the parent-defined learning rhythm.
                  </p>
                </div>

                <form onSubmit={handleAcademicYearSubmit} style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <input
                      value={yearTitle}
                      onChange={(event) => setYearTitle(event.target.value)}
                      placeholder="Academic year title"
                      style={inputStyle}
                    />
                    <input
                      value={yearCountryCode}
                      onChange={(event) => setYearCountryCode(event.target.value.toUpperCase())}
                      placeholder="Country code"
                      style={inputStyle}
                    />
                    <input
                      value={yearJurisdictionCode}
                      onChange={(event) => setYearJurisdictionCode(event.target.value)}
                      placeholder="State / jurisdiction"
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
                    <input type="date" value={yearStartsOn} onChange={(event) => setYearStartsOn(event.target.value)} style={inputStyle} />
                    <input type="date" value={yearEndsOn} onChange={(event) => setYearEndsOn(event.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="submit" style={buttonStyle} disabled={submitting}>
                      {submitting ? "Saving..." : "Add academic year"}
                    </button>
                    <button
                      type="button"
                      style={mutedButtonStyle}
                      onClick={() => void reloadSetupData()}
                      disabled={setupLoading || submitting}
                    >
                      {setupLoading ? "Refreshing..." : "Refresh setup"}
                    </button>
                  </div>
                </form>

                {academicYears.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {academicYears.map((year) => {
                      const yearPeriods = learningPeriods.filter(
                        (period) => period.academicYearId === year.id,
                      );
                      const isSelected = selectedAcademicYearId === year.id;

                      return (
                        <div
                          key={year.id}
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
                              <strong>{year.title}</strong>
                              <div style={{ color: "#64748b", marginTop: 4 }}>
                                {formatWeekRangeLabel(year.startsOn, year.endsOn)}
                              </div>
                            </div>
                            <button
                              type="button"
                              style={{
                                ...buttonStyle,
                                background: isSelected ? "#1d4ed8" : "#ffffff",
                                borderColor: isSelected ? "#1d4ed8" : "#0f172a",
                                color: isSelected ? "#ffffff" : "#0f172a",
                              }}
                              onClick={() => setSelectedAcademicYearId(year.id)}
                            >
                              {isSelected ? "Selected" : "Use year"}
                            </button>
                          </div>
                          {yearPeriods.length ? (
                            <div style={{ color: "#475569", lineHeight: 1.6 }}>
                              {yearPeriods
                                .map((period) => `${period.title} (${period.periodType})`)
                                .join(" - ")}
                            </div>
                          ) : (
                            <div style={{ color: "#475569" }}>
                              No learning periods added to this year yet.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "#475569" }}>
                    No academic year yet. Add one before setting terms or breaks.
                  </p>
                )}

                <form onSubmit={handleLearningPeriodSubmit} style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <select
                      value={selectedAcademicYearId}
                      onChange={(event) => setSelectedAcademicYearId(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select academic year</option>
                      {academicYears.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.title}
                        </option>
                      ))}
                    </select>
                    <input
                      value={periodTitle}
                      onChange={(event) => setPeriodTitle(event.target.value)}
                      placeholder="Learning period title"
                      style={inputStyle}
                    />
                    <select
                      value={periodType}
                      onChange={(event) => setPeriodType(event.target.value as CleanLearningPeriodType)}
                      style={inputStyle}
                    >
                      {PERIOD_TYPES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <input type="date" value={periodStartsOn} onChange={(event) => setPeriodStartsOn(event.target.value)} style={inputStyle} />
                    <input type="date" value={periodEndsOn} onChange={(event) => setPeriodEndsOn(event.target.value)} style={inputStyle} />
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: "#475569",
                        padding: "10px 12px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 10,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={periodIsBreak}
                        onChange={(event) => setPeriodIsBreak(event.target.checked)}
                      />
                      Mark as break / non-learning period
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="submit" style={buttonStyle} disabled={submitting || !selectedAcademicYearId}>
                      {submitting ? "Saving..." : "Add learning period"}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Weekly rhythm / master template</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Parents can stay manual forever, or use a weekly rhythm to make generation easier. Family-wide templates are the default.
                  </p>
                </div>

                <form onSubmit={handleTemplateSubmit} style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <input
                      value={templateTitle}
                      onChange={(event) => setTemplateTitle(event.target.value)}
                      placeholder="Template title"
                      style={inputStyle}
                    />
                    <select
                      value={templateScopeType}
                      onChange={(event) => setTemplateScopeType(event.target.value as "family" | "learner")}
                      style={inputStyle}
                    >
                      <option value="family">Family-wide rhythm</option>
                      <option value="learner">Learner-specific rhythm</option>
                    </select>
                    <select
                      value={templateLearnerId}
                      onChange={(event) => setTemplateLearnerId(event.target.value)}
                      style={inputStyle}
                    >
                      <option value="">No learner override</option>
                      {learnerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={templateDescription}
                    onChange={(event) => setTemplateDescription(event.target.value)}
                    placeholder="Optional description"
                    style={textAreaStyle}
                  />
                  <button type="submit" style={buttonStyle} disabled={submitting}>
                    {submitting ? "Saving..." : "Add weekly rhythm"}
                  </button>
                </form>

                {masterTemplates.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {masterTemplates.map((template) => {
                      const learnerLabel =
                        learnerOptions.find((option) => option.value === template.learnerId)?.label ||
                        "Family-wide";
                      const isSelected = selectedTemplateId === template.id;

                      return (
                        <div
                          key={template.id}
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
                              <strong>{template.title}</strong>
                              <div style={{ color: "#64748b", marginTop: 4 }}>
                                {template.scopeType === "learner" ? learnerLabel : "Family-wide"}
                              </div>
                            </div>
                            <button
                              type="button"
                              style={{
                                ...buttonStyle,
                                background: isSelected ? "#1d4ed8" : "#ffffff",
                                borderColor: isSelected ? "#1d4ed8" : "#0f172a",
                                color: isSelected ? "#ffffff" : "#0f172a",
                              }}
                              onClick={() => setSelectedTemplateId(template.id)}
                            >
                              {isSelected ? "Selected" : "Use template"}
                            </button>
                          </div>
                          {template.description ? (
                            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                              {template.description}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "#475569" }}>
                    No weekly rhythm yet. Parents can still use the calendar manually.
                  </p>
                )}

                {selectedTemplate ? (
                  <>
                    <form onSubmit={handleTemplateBlockSubmit} style={{ display: "grid", gap: 12 }}>
                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        }}
                      >
                        <select
                          value={blockWeekday}
                          onChange={(event) => setBlockWeekday(event.target.value)}
                          style={inputStyle}
                        >
                          {WEEKDAY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={blockTitle}
                          onChange={(event) => setBlockTitle(event.target.value)}
                          placeholder="Block title"
                          style={inputStyle}
                        />
                        <input
                          value={blockLearningArea}
                          onChange={(event) => setBlockLearningArea(event.target.value)}
                          placeholder="Learning area"
                          list="clean-learning-areas"
                          style={inputStyle}
                        />
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        }}
                      >
                        <input type="time" value={blockStartTime} onChange={(event) => setBlockStartTime(event.target.value)} style={inputStyle} />
                        <input type="time" value={blockEndTime} onChange={(event) => setBlockEndTime(event.target.value)} style={inputStyle} />
                        <select value={blockLearnerId} onChange={(event) => setBlockLearnerId(event.target.value)} style={inputStyle}>
                          <option value="">Family / all learners</option>
                          {learnerOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gap: 12,
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        }}
                      >
                        <select value={blockProgramId} onChange={(event) => setBlockProgramId(event.target.value)} style={inputStyle}>
                          <option value="">No linked program</option>
                          {programOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select value={blockProgramSegmentId} onChange={(event) => setBlockProgramSegmentId(event.target.value)} style={inputStyle}>
                          <option value="">No linked segment</option>
                          {visibleBlockSegments.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={blockSessionLabel}
                          onChange={(event) => setBlockSessionLabel(event.target.value)}
                          placeholder="Optional session label"
                          style={inputStyle}
                        />
                      </div>
                      <textarea
                        value={blockNotes}
                        onChange={(event) => setBlockNotes(event.target.value)}
                        placeholder="Optional weekly rhythm notes"
                        style={textAreaStyle}
                      />
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button type="submit" style={buttonStyle} disabled={submitting}>
                          {submitting ? "Saving..." : editingTemplateBlockId ? "Save block" : "Add block"}
                        </button>
                        {editingTemplateBlockId ? (
                          <button
                            type="button"
                            style={mutedButtonStyle}
                            onClick={resetTemplateBlockForm}
                            disabled={submitting}
                          >
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                    </form>

                    {templateBlocksLoading ? (
                      <p style={{ margin: 0, color: "#475569" }}>Loading weekly rhythm blocks...</p>
                    ) : templateBlocks.length ? (
                      <div style={{ display: "grid", gap: 12 }}>
                        {templateBlocks.map((block) => (
                          <div
                            key={block.id}
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
                                  {WEEKDAY_OPTIONS.find((option) => option.value === block.weekday)?.label} - {block.title}
                                </strong>
                                <div style={{ color: "#64748b", marginTop: 4 }}>
                                  {block.startsAt || block.endsAt
                                    ? `${block.startsAt ?? ""}${block.endsAt ? ` to ${block.endsAt}` : ""}`
                                    : "No set time"}
                                  {block.learningArea ? ` - ${block.learningArea}` : ""}
                                </div>
                              </div>
                              <button
                                type="button"
                                style={mutedButtonStyle}
                                onClick={() => handleEditTemplateBlock(block)}
                              >
                                Edit
                              </button>
                            </div>
                            {block.notes ? (
                              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                                {block.notes}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, color: "#475569" }}>
                        No rhythm blocks yet. Add the first one above.
                      </p>
                    )}
                  </>
                ) : null}
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Generate this week</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    This scaffold previews the week from the selected template and records the generation run only. It does not overwrite or auto-apply calendar items yet.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <input type="date" value={generationWeekStart} onChange={(event) => setGenerationWeekStart(event.target.value)} style={inputStyle} />
                  <select value={selectedLearningPeriodId} onChange={(event) => setSelectedLearningPeriodId(event.target.value)} style={inputStyle}>
                    <option value="">No learning period selected</option>
                    {visibleLearningPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.title}
                      </option>
                    ))}
                  </select>
                  <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)} style={inputStyle}>
                    <option value="">No master template selected</option>
                    {masterTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => void handlePreviewGeneration()}
                    disabled={!selectedTemplateId}
                  >
                    Preview generated week
                  </button>
                  <button
                    type="button"
                    style={mutedButtonStyle}
                    onClick={() => void handleRecordGenerationRun()}
                    disabled={!selectedTemplateId || submitting}
                  >
                    {submitting ? "Recording..." : "Record generation run"}
                  </button>
                </div>

                {previewSuggestions.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ color: "#475569" }}>
                      Preview for {formatWeekRangeLabel(generationWeekStart, generationWeekEnd)}.{" "}
                      {generationSummary.created} suggested block(s), {generationSummary.skipped} skipped day marker(s).
                    </div>
                    {previewSuggestions.slice(0, 12).map((item, index) => (
                      <div
                        key={`${item.plannedDate}-${item.title}-${index}`}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <strong>{item.title}</strong>
                        <div style={{ color: "#64748b" }}>
                          {formatDateLabel(item.plannedDate)}
                          {item.startsAt ? ` - ${formatTimeLabel(item.startsAt)}` : ""}
                          {item.learningArea ? ` - ${item.learningArea}` : ""}
                        </div>
                        {item.skippedReason ? (
                          <div style={{ color: "#b45309" }}>{item.skippedReason}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "#475569" }}>
                    No generation preview yet. Use the selected weekly rhythm to preview the week first.
                  </p>
                )}

                {generationRuns.length ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <strong style={{ color: "#0f172a" }}>Recent generation runs</strong>
                    {generationRuns.slice(0, 4).map((run) => (
                      <div
                        key={run.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 4,
                        }}
                      >
                        <strong>{formatWeekRangeLabel(run.weekStartsOn, run.weekEndsOn)}</strong>
                        <span style={{ color: "#475569" }}>
                          {run.status} - {run.createdItemsCount} suggested, {run.skippedItemsCount} skipped
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

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
                  <h2 style={{ margin: 0, color: "#0f172a" }}>Week view</h2>
                  <p style={{ margin: "8px 0 0", color: "#475569" }}>
                    Click a day or block to open the small direct popover. This is the controlled Google-style interaction scaffold for the clean calendar.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" style={mutedButtonStyle} onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}>
                    Previous week
                  </button>
                  <button type="button" style={mutedButtonStyle} onClick={() => setSelectedWeekStart(getWeekStart())}>
                    This week
                  </button>
                  <button type="button" style={mutedButtonStyle} onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}>
                    Next week
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 12, color: "#475569" }}>
                {formatWeekRangeLabel(selectedWeekStart, selectedWeekEnd)}
              </div>

              {itemsLoading ? <p style={{ marginTop: 16, marginBottom: 0, color: "#475569" }}>Loading week items...</p> : null}
              {itemsError ? <p style={{ marginTop: 16, marginBottom: 0, color: "#b91c1c" }}>{itemsError}</p> : null}
              {setupError ? <p style={{ marginTop: 16, marginBottom: 0, color: "#b91c1c" }}>{setupError}</p> : null}

              <div
                style={{
                  marginTop: 16,
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                {weekDates.map((dateValue) => {
                  const dayItems = itemsByDate.get(dateValue) ?? [];

                  return (
                    <div
                      key={dateValue}
                      style={{
                        border: "1px solid #dbeafe",
                        borderRadius: 16,
                        padding: 14,
                        background: "#f8fbff",
                        display: "grid",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <strong style={{ color: "#0f172a" }}>{formatDateLabel(dateValue)}</strong>
                        <button
                          type="button"
                          style={{ ...buttonStyle, padding: "8px 10px" }}
                          onClick={() => openCreatePopover(dateValue)}
                        >
                          Add
                        </button>
                      </div>

                      {dayItems.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {dayItems.map((item) => {
                            const learnerLabel =
                              learnerOptions.find((option) => option.value === item.learnerId)?.label ||
                              "Family / all learners";

                            return (
                              <div
                                key={item.id}
                                style={{
                                  border: "1px solid #bfdbfe",
                                  borderRadius: 14,
                                  background: "#ffffff",
                                  padding: 12,
                                  display: "grid",
                                  gap: 6,
                                  cursor: "pointer",
                                }}
                                onClick={() => openEditPopover(item)}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                  <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                                  <span
                                    style={{
                                      fontSize: 12,
                                      color: item.sourceType === "manual" ? "#64748b" : "#1d4ed8",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {item.sourceType}
                                  </span>
                                </div>
                                <div style={{ color: "#475569" }}>
                                  {item.startsAt || item.endsAt
                                    ? `${formatTimeLabel(item.startsAt)}${item.endsAt ? ` to ${formatTimeLabel(item.endsAt)}` : ""}`
                                    : "Any time"}
                                </div>
                                <div style={{ color: "#64748b" }}>
                                  {learnerLabel}
                                  {item.learningArea ? ` - ${item.learningArea}` : ""}
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    style={mutedButtonStyle}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openEditPopover(item);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    style={{ ...buttonStyle, background: "#b91c1c", borderColor: "#b91c1c" }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleDeleteItem(item);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
                          No blocks yet. Click Add to use the small in-place popover.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
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
      </div>

      <datalist id="clean-learning-areas">
        {AUSTRALIAN_LEARNING_AREAS.map((area) => (
          <option key={area} value={area} />
        ))}
      </datalist>

      <CleanCalendarPopover
        open={popoverOpen}
        mode={editingItemId ? "edit" : "create"}
        plannedDate={popoverDate}
        title={popoverTitle}
        learnerId={popoverLearnerId}
        learningArea={popoverLearningArea}
        startTime={popoverStartTime}
        endTime={popoverEndTime}
        description={popoverDescription}
        programId={popoverProgramId}
        programSegmentId={popoverProgramSegmentId}
        learnerOptions={learnerOptions}
        programOptions={programOptions}
        segmentOptions={visiblePopoverSegments}
        onChangeTitle={setPopoverTitle}
        onChangeLearnerId={setPopoverLearnerId}
        onChangeLearningArea={setPopoverLearningArea}
        onChangeStartTime={setPopoverStartTime}
        onChangeEndTime={setPopoverEndTime}
        onChangeDescription={setPopoverDescription}
        onChangeProgramId={(value) => {
          setPopoverProgramId(value);
          if (!value) {
            setPopoverProgramSegmentId("");
          }
        }}
        onChangeProgramSegmentId={setPopoverProgramSegmentId}
        onClose={closePopover}
        onSave={() => void handlePopoverSave()}
        saving={submitting}
      />
    </div>
  );
}

function safeTimeString(value: string) {
  const time = String(value ?? "").trim();
  return time.length >= 5 ? time.slice(0, 5) : time;
}

export default function CleanCalendarWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanCalendarWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
