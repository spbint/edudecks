"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  CalendarTemplateGrid,
  CalendarTemplateSelector,
  CalendarTemplateSlotEditor,
  BODY,
  H2,
  LABEL,
  META,
} from "@/app/components/calendar/CalendarTemplateOverviewComponents";
import {
  CalendarViewSwitcher,
  CalendarWeekView,
  type CalendarSurfaceView,
  type CalendarWeekDay,
  type CalendarWeekEditorDraft,
  type CalendarWeekEditorMode,
} from "@/app/components/calendar/CalendarWeekOverviewComponents";
import {
  addFamilyCalendarBlock,
  loadFamilyCalendarWindow,
  removeFamilyCalendarBlock,
  updateFamilyCalendarBlock,
  type FamilyCalendarBlockEntry,
} from "@/lib/familyPlanner";
import {
  CALENDAR_ITEM_TYPE_OPTIONS,
  loadFamilyCalendarTemplates,
  loadFamilyPrograms,
  saveFamilyCalendarTemplate,
  type CalendarItemType,
  type CalendarTemplate,
  type CalendarTimeBlock,
  type Program,
  type TemplateSlot,
} from "@/lib/familyPlanningTemplates";

function makeLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildEmptyTemplate(input: {
  familyId: string;
  academicStructureType?: string | null;
}): CalendarTemplate {
  const id = makeLocalId("calendar-template");

  return {
    id,
    familyId: input.familyId,
    title: "My Calendar Template",
    cycleType: "weekly",
    cycleLength: 5,
    academicStructureType: input.academicStructureType || "terms",
    slots: [],
    updatedAt: new Date().toISOString(),
  };
}

function buildBlankSlot(
  templateId: string,
  defaults?: Partial<TemplateSlot>,
): TemplateSlot {
  return {
    id: makeLocalId("slot"),
    templateId,
    dayOfWeek: defaults?.dayOfWeek ?? 1,
    startTime: defaults?.startTime ?? null,
    endTime: defaults?.endTime ?? null,
    subjectId: defaults?.subjectId ?? null,
    label: defaults?.label ?? "Learning block",
    notes: defaults?.notes ?? "",
    itemType: defaults?.itemType ?? "learning_block",
    learnerIds: defaults?.learnerIds ?? [],
    timeBlock: defaults?.timeBlock ?? "morning",
    isPortfolioHighlight: defaults?.isPortfolioHighlight ?? false,
  };
}

const CALENDAR_QUICK_ADD_PREFERENCES_KEY = "mylearna_calendar_quick_add_preferences_v1";
const DEFAULT_CALENDAR_QUICK_ADD_PREFERENCES: {
  itemType: CalendarItemType;
  learningArea: string;
} = {
  itemType: "learning_block",
  learningArea: "",
};
type CalendarQuickAddPreferences = typeof DEFAULT_CALENDAR_QUICK_ADD_PREFERENCES;
const DEFAULT_TIME_RANGE_BY_BLOCK: Record<
  CalendarTimeBlock,
  { startTime: string; endTime: string }
> = {
  morning: { startTime: "09:00", endTime: "10:30" },
  midday: { startTime: "12:00", endTime: "13:00" },
  afternoon: { startTime: "14:00", endTime: "15:30" },
};

function friendlyCalendarMessage(kind: "load" | "save") {
  if (kind === "load") {
    return "My Calendar could not load. You can still shape a local template.";
  }
  return "My Calendar could not save. Check your account connection and try again.";
}

function friendlyWeekMessage(kind: "load" | "save" | "delete") {
  if (kind === "load") {
    return "Some live calendar items could not load. Showing the saved template rhythm where available.";
  }
  if (kind === "delete") {
    return "This calendar item could not be removed just yet. Try again in a moment.";
  }
  return "This calendar item could not be saved just yet. Try again in a moment.";
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isDatabaseProfileId(value: unknown) {
  const id = clean(value);
  return !!id && id !== "local" && !id.startsWith("local-");
}

function describeSaveError(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") return fallback;
  const row = error as { message?: unknown; details?: unknown; hint?: unknown };
  return clean(row.message) || clean(row.details) || clean(row.hint) || fallback;
}

function readQuickAddPreferences(): CalendarQuickAddPreferences {
  if (typeof window === "undefined") return DEFAULT_CALENDAR_QUICK_ADD_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(CALENDAR_QUICK_ADD_PREFERENCES_KEY);
    if (!raw) return DEFAULT_CALENDAR_QUICK_ADD_PREFERENCES;
    const parsed = JSON.parse(raw) as {
      itemType?: unknown;
      learningArea?: unknown;
    };

    return {
      itemType:
        parsed?.itemType === "task" ||
        parsed?.itemType === "appointment" ||
        parsed?.itemType === "playdate" ||
        parsed?.itemType === "reminder" ||
        parsed?.itemType === "custom"
          ? parsed.itemType
          : "learning_block",
      learningArea: clean(parsed?.learningArea),
    };
  } catch {
    return DEFAULT_CALENDAR_QUICK_ADD_PREFERENCES;
  }
}

function writeQuickAddPreferences(value: CalendarQuickAddPreferences) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      CALENDAR_QUICK_ADD_PREFERENCES_KEY,
      JSON.stringify(value),
    );
  } catch {
    // ignore
  }
}

function ymd(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getBusinessWeek(anchor: Date) {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 5 }, (_, index) => addDays(monday, index));
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-AU", { weekday: "long" });
}

function formatDayDateLabel(date: Date) {
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function formatWeekRange(weekDays: CalendarWeekDay[]) {
  if (!weekDays.length) return "Week of this week";

  const firstDay = new Date(`${weekDays[0].key}T00:00:00`);
  const lastDay = new Date(`${weekDays[weekDays.length - 1].key}T00:00:00`);
  const firstMonth = firstDay.toLocaleDateString("en-AU", { month: "short" });
  const lastMonth = lastDay.toLocaleDateString("en-AU", { month: "short" });
  const year = lastDay.getFullYear();

  return `Week of ${firstDay.getDate()} ${firstMonth} - ${lastDay.getDate()} ${lastMonth} ${year}`;
}

function buildWeekDays(anchor: Date): CalendarWeekDay[] {
  const todayKey = ymd(new Date());

  return getBusinessWeek(anchor).map((date, index) => {
    const key = ymd(date);
    return {
      key,
      label: formatDayLabel(date),
      dateLabel: formatDayDateLabel(date),
      weekdayValue: index + 1,
      isToday: key === todayKey,
    };
  });
}

function itemTypeLabel(itemType: CalendarItemType) {
  return (
    CALENDAR_ITEM_TYPE_OPTIONS.find((option) => option.value === itemType)?.label ||
    "Learning block"
  );
}

function defaultTitleForItemType(itemType: CalendarItemType) {
  if (itemType === "custom") return "Custom item";
  return itemTypeLabel(itemType);
}

function draftTimeLabel(draft: Pick<CalendarWeekEditorDraft, "startTime" | "endTime" | "timeBlock">) {
  const startTime = clean(draft.startTime);
  const endTime = clean(draft.endTime);
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  if (draft.timeBlock === "morning") return "Morning session";
  if (draft.timeBlock === "midday") return "Midday session";
  return "Afternoon session";
}

function daypartFromTemplateSlot(slot: TemplateSlot): CalendarTimeBlock {
  if (slot.timeBlock === "morning" || slot.timeBlock === "midday" || slot.timeBlock === "afternoon") {
    return slot.timeBlock;
  }

  const hour = Number(clean(slot.startTime).split(":")[0]);
  if (Number.isFinite(hour)) {
    if (hour < 12) return "morning";
    if (hour < 14) return "midday";
  }
  return "afternoon";
}

function daypartFromLiveBlock(block: FamilyCalendarBlockEntry): CalendarTimeBlock {
  if (block.timeBlock === "morning" || block.timeBlock === "midday" || block.timeBlock === "afternoon") {
    return block.timeBlock;
  }

  const hour = Number((clean(block.startTime) || clean(block.time)).split(":")[0]);
  if (Number.isFinite(hour)) {
    if (hour < 12) return "morning";
    if (hour < 14) return "midday";
  }
  return "afternoon";
}

export default function FamilyCalendarTemplateWorkspace() {
  const searchParams = useSearchParams();
  const { workspace, activeLearner, loading: workspaceLoading } = useFamilyWorkspace();

  const [templates, setTemplates] = useState<CalendarTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarSurfaceView>("template");
  const [resolvedInitialView, setResolvedInitialView] = useState(false);
  const [selectedWeekAnchor, setSelectedWeekAnchor] = useState<Date>(new Date());
  const [weekBlocks, setWeekBlocks] = useState<Record<string, FamilyCalendarBlockEntry[]>>({});
  const [programs, setPrograms] = useState<Program[]>([]);
  const [visibleLearnerIds, setVisibleLearnerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeek, setLoadingWeek] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [weekError, setWeekError] = useState("");
  const [weekFeedbackMessage, setWeekFeedbackMessage] = useState("");
  const [editorMode, setEditorMode] = useState<CalendarWeekEditorMode>(null);
  const [editorDraft, setEditorDraft] = useState<CalendarWeekEditorDraft | null>(null);
  const [editorErrorMessage, setEditorErrorMessage] = useState("");
  const [savingEditor, setSavingEditor] = useState(false);
  const [deletingEditor, setDeletingEditor] = useState(false);
  const [quickAddPreferences, setQuickAddPreferences] = useState(
    DEFAULT_CALENDAR_QUICK_ADD_PREFERENCES,
  );

  const requestedDate = searchParams.get("date");
  const learnerIds = useMemo(
    () => workspace.learners.map((learner) => learner.id).filter(Boolean),
    [workspace.learners],
  );
  const learnerIdsKey = learnerIds.join("|");
  const canPersistLiveItems = Boolean(
    workspace.storageMode === "database" &&
      workspace.userId &&
      isDatabaseProfileId(workspace.profile.id),
  );

  useEffect(() => {
    if (!requestedDate) return;
    const parsed = new Date(`${requestedDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return;
    setSelectedWeekAnchor(parsed);
  }, [requestedDate]);

  useEffect(() => {
    setQuickAddPreferences(readQuickAddPreferences());
  }, []);

  useEffect(() => {
    writeQuickAddPreferences(quickAddPreferences);
  }, [quickAddPreferences]);

  useEffect(() => {
    if (!weekFeedbackMessage) return;
    const timer = window.setTimeout(() => setWeekFeedbackMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [weekFeedbackMessage]);

  useEffect(() => {
    let mounted = true;

    async function hydrateTemplates() {
      if (!workspace.profile.id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const nextTemplates = await loadFamilyCalendarTemplates({
          familyId: workspace.profile.id,
        });

        if (!mounted) return;

        setTemplates(nextTemplates);
        setSelectedTemplateId((current) => {
          if (nextTemplates.some((template) => template.id === current)) return current;
          return (
            nextTemplates.find((template) => template.slots.length > 0)?.id ||
            nextTemplates[0]?.id ||
            ""
          );
        });
      } catch {
        if (!mounted) return;
        setTemplates([]);
        setSelectedTemplateId("");
        setSelectedSlotId(null);
        setError(friendlyCalendarMessage("load"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void hydrateTemplates();

    return () => {
      mounted = false;
    };
  }, [workspace.profile.id]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  );

  const selectedSlot = useMemo(
    () => selectedTemplate?.slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [selectedSlotId, selectedTemplate],
  );

  useEffect(() => {
    if (!selectedTemplate) {
      setSelectedSlotId(null);
      return;
    }

    if (selectedSlotId && selectedTemplate.slots.some((slot) => slot.id === selectedSlotId)) {
      return;
    }

    setSelectedSlotId(selectedTemplate.slots[0]?.id || null);
  }, [selectedSlotId, selectedTemplate]);

  const weekDays = useMemo(() => buildWeekDays(selectedWeekAnchor), [selectedWeekAnchor]);
  const weekLabel = useMemo(() => formatWeekRange(weekDays), [weekDays]);
  const weekStart = weekDays[0]?.key || "";
  const weekEnd = weekDays[weekDays.length - 1]?.key || "";
  const hasAnyTemplateSlots = templates.some((template) => template.slots.length > 0);
  const liveWeekBlockCount = useMemo(
    () => Object.values(weekBlocks).reduce((count, items) => count + items.length, 0),
    [weekBlocks],
  );
  const hasCalendarData = hasAnyTemplateSlots || liveWeekBlockCount > 0;

  useEffect(() => {
    setVisibleLearnerIds((current) => {
      const validCurrent = current.filter((learnerId) => learnerIds.includes(learnerId));

      if (!learnerIds.length) return [];
      if (learnerIds.length === 1) return [learnerIds[0]];
      if (!validCurrent.length) {
        if (activeLearner?.id && learnerIds.includes(activeLearner.id)) {
          return [activeLearner.id];
        }
        return learnerIds;
      }
      if (
        activeLearner?.id &&
        learnerIds.includes(activeLearner.id) &&
        !validCurrent.includes(activeLearner.id)
      ) {
        return [...validCurrent, activeLearner.id];
      }
      return validCurrent;
    });
  }, [activeLearner?.id, learnerIds, learnerIdsKey]);

  useEffect(() => {
    let mounted = true;

    async function hydrateWeek() {
      if (!workspace.profile.id) {
        if (!mounted) return;
        setPrograms([]);
        setWeekBlocks({});
        setWeekError("");
        setLoadingWeek(false);
        return;
      }

      setLoadingWeek(true);
      setWeekError("");

      const programPromise = loadFamilyPrograms({
        familyId: workspace.profile.id,
      });
      const livePromises =
        canPersistLiveItems && learnerIds.length
          ? learnerIds.map((learnerId) =>
              loadFamilyCalendarWindow({
                familyProfileId: workspace.profile.id,
                studentId: learnerId,
                dateFrom: weekStart,
                dateTo: weekEnd,
              }),
            )
          : [];

      const [programResult, liveResults] = await Promise.all([
        programPromise.catch(() => []),
        Promise.allSettled(livePromises),
      ]);

      if (!mounted) return;

      setPrograms(programResult);

      const nextBlocks: Record<string, FamilyCalendarBlockEntry[]> = {};
      const seenBlockIds = new Set<string>();
      let hadLiveLoadFailure = false;

      liveResults.forEach((result) => {
        if (result.status !== "fulfilled") {
          hadLiveLoadFailure = true;
          return;
        }

        Object.entries(result.value.blocks ?? {}).forEach(([date, items]) => {
          items.forEach((item) => {
            if (seenBlockIds.has(item.id)) return;
            seenBlockIds.add(item.id);
            nextBlocks[date] = [...(nextBlocks[date] ?? []), item];
          });
        });
      });

      setWeekBlocks(nextBlocks);
      setWeekError(hadLiveLoadFailure ? friendlyWeekMessage("load") : "");
      setLoadingWeek(false);
    }

    void hydrateWeek();

    return () => {
      mounted = false;
    };
  }, [canPersistLiveItems, learnerIds, workspace.profile.id, weekEnd, weekStart]);

  useEffect(() => {
    if (resolvedInitialView || loading || loadingWeek || workspaceLoading) return;
    setViewMode(hasCalendarData ? "week" : "template");
    setResolvedInitialView(true);
  }, [hasCalendarData, loading, loadingWeek, resolvedInitialView, workspaceLoading]);

  useEffect(() => {
    if (viewMode === "week") return;
    setEditorMode(null);
    setEditorDraft(null);
    setEditorErrorMessage("");
  }, [viewMode]);

  function replaceTemplate(nextTemplate: CalendarTemplate) {
    setTemplates((current) => {
      const exists = current.some((template) => template.id === nextTemplate.id);
      if (!exists) return [nextTemplate, ...current];
      return current.map((template) =>
        template.id === nextTemplate.id ? nextTemplate : template,
      );
    });
  }

  function handleCreateTemplate() {
    const nextTemplate = buildEmptyTemplate({
      familyId: workspace.profile.id || "local",
      academicStructureType: workspace.profile.academic_structure_type,
    });

    setTemplates((current) => [nextTemplate, ...current]);
    setSelectedTemplateId(nextTemplate.id);
    setSelectedSlotId(null);
    setStatus("Draft workspace ready.");
    setError("");
  }

  function ensureTemplateForEdit() {
    if (selectedTemplate) return selectedTemplate;

    const nextTemplate = buildEmptyTemplate({
      familyId: workspace.profile.id || "local",
      academicStructureType: workspace.profile.academic_structure_type,
    });
    setTemplates((current) => [nextTemplate, ...current]);
    setSelectedTemplateId(nextTemplate.id);
    return nextTemplate;
  }

  function handleAddSlot(defaults?: Partial<TemplateSlot>) {
    const template = ensureTemplateForEdit();
    const nextSlot = buildBlankSlot(template.id, defaults);
    replaceTemplate({
      ...template,
      slots: [...template.slots, nextSlot],
      updatedAt: new Date().toISOString(),
    });
    setSelectedTemplateId(template.id);
    setSelectedSlotId(nextSlot.id);
    setStatus("Slot added.");
    setError("");
  }

  function handleChangeSlot(nextSlot: TemplateSlot) {
    if (!selectedTemplate) return;
    replaceTemplate({
      ...selectedTemplate,
      slots: selectedTemplate.slots.map((slot) => (slot.id === nextSlot.id ? nextSlot : slot)),
      updatedAt: new Date().toISOString(),
    });
  }

  function handleDeleteSlot(slotId: string) {
    if (!selectedTemplate) return;
    const nextSlots = selectedTemplate.slots.filter((slot) => slot.id !== slotId);
    replaceTemplate({
      ...selectedTemplate,
      slots: nextSlots,
      updatedAt: new Date().toISOString(),
    });
    setSelectedSlotId(nextSlots[0]?.id || null);
    setStatus("Slot removed.");
    setError("");
  }

  async function handleSaveTemplate() {
    if (!selectedTemplate) return;

    setSaving(true);
    setStatus("");
    setError("");

    try {
      const saved = await saveFamilyCalendarTemplate(selectedTemplate);
      replaceTemplate(saved);
      setSelectedTemplateId(saved.id);
      setStatus("Calendar saved.");
    } catch (saveError) {
      setError(describeSaveError(saveError, friendlyCalendarMessage("save")));
    } finally {
      setSaving(false);
    }
  }

  function handleChangeView(nextView: CalendarSurfaceView) {
    setViewMode(nextView);
    setResolvedInitialView(true);
  }

  function goPreviousWeek() {
    setSelectedWeekAnchor((current) => addDays(current, -7));
  }

  function goNextWeek() {
    setSelectedWeekAnchor((current) => addDays(current, 7));
  }

  function goToday() {
    setSelectedWeekAnchor(new Date());
  }

  function closeWeekEditor() {
    setEditorMode(null);
    setEditorDraft(null);
    setEditorErrorMessage("");
  }

  function resolveDefaultLearnerIds() {
    if (activeLearner?.id) return [activeLearner.id];
    if (visibleLearnerIds.length) return [visibleLearnerIds[0]];
    if (learnerIds.length === 1) return [learnerIds[0]];
    return [];
  }

  function resolvePrimaryLearnerId(nextLearnerIds: string[], currentPrimaryLearnerId?: string | null) {
    if (currentPrimaryLearnerId && nextLearnerIds.includes(currentPrimaryLearnerId)) {
      return currentPrimaryLearnerId;
    }
    if (activeLearner?.id && nextLearnerIds.includes(activeLearner.id)) return activeLearner.id;
    return nextLearnerIds[0] || null;
  }

  function resolveDefaultTimeRange(timeBlock: CalendarTimeBlock) {
    const matchingTemplateSlot = [...(selectedTemplate?.slots ?? [])]
      .filter((slot) => daypartFromTemplateSlot(slot) === timeBlock)
      .sort((a, b) => clean(a.startTime).localeCompare(clean(b.startTime)))[0];

    if (matchingTemplateSlot && (clean(matchingTemplateSlot.startTime) || clean(matchingTemplateSlot.endTime))) {
      return {
        startTime: clean(matchingTemplateSlot.startTime),
        endTime: clean(matchingTemplateSlot.endTime),
      };
    }

    return DEFAULT_TIME_RANGE_BY_BLOCK[timeBlock];
  }

  function rememberQuickAddPreferencesFromDraft(draft: CalendarWeekEditorDraft) {
    setQuickAddPreferences((current) => ({
      itemType: draft.itemType,
      learningArea:
        draft.itemType === "learning_block"
          ? clean(draft.learningArea)
          : current.learningArea,
    }));
  }

  function buildLiveDraftFromCell(day: CalendarWeekDay, timeBlock: CalendarTimeBlock): CalendarWeekEditorDraft {
    const defaultLearnerIds = resolveDefaultLearnerIds();
    const timeRange = resolveDefaultTimeRange(timeBlock);
    return {
      id: null,
      kind: "live",
      title: "",
      itemType: quickAddPreferences.itemType,
      learnerIds: defaultLearnerIds,
      date: day.key,
      dayOfWeek: day.weekdayValue,
      timeBlock,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      notes: "",
      learningArea: quickAddPreferences.learningArea,
      curriculumOutcomeIds: [],
      sourceType: "manual",
      programId: null,
      programSegmentId: null,
      calendarTemplateSlotId: null,
      primaryLearnerId: resolvePrimaryLearnerId(defaultLearnerIds, activeLearner?.id || null),
      isPortfolioHighlight: false,
    };
  }

  function buildLiveDraftFromBlock(block: FamilyCalendarBlockEntry): CalendarWeekEditorDraft {
    const day = weekDays.find((item) => item.key === block.date) || weekDays[0];
    const learnerSelection =
      block.learnerIds?.length
        ? block.learnerIds.filter((learnerId) => learnerIds.includes(learnerId))
        : [clean(block.primaryLearnerId)].filter(Boolean);

    return {
      id: block.id,
      kind: "live",
      title: clean(block.title),
      itemType: block.itemType || "learning_block",
      learnerIds: learnerSelection,
      date: block.date,
      dayOfWeek: day?.weekdayValue || 1,
      timeBlock: daypartFromLiveBlock(block),
      startTime: clean(block.startTime),
      endTime: clean(block.endTime),
      notes: clean(block.note),
      learningArea: block.itemType === "learning_block" ? clean(block.subject) : "",
      curriculumOutcomeIds: block.curriculumOutcomeIds ?? [],
      sourceType: block.sourceType === "generated" ? "generated" : "manual",
      programId: block.programId ?? null,
      programSegmentId: block.programSegmentId ?? null,
      calendarTemplateSlotId: block.calendarTemplateSlotId ?? null,
      primaryLearnerId:
        clean(block.primaryLearnerId) || resolvePrimaryLearnerId(learnerSelection, activeLearner?.id || null),
      isPortfolioHighlight: block.isPortfolioHighlight === true,
    };
  }

  function buildTemplateDraft(slot: TemplateSlot): CalendarWeekEditorDraft {
    const matchingDay = weekDays.find((day) => day.weekdayValue === slot.dayOfWeek) || weekDays[0];
    return {
      id: slot.id,
      kind: "template",
      title: clean(slot.label),
      itemType: slot.itemType || "learning_block",
      learnerIds: slot.learnerIds?.filter((learnerId) => learnerIds.includes(learnerId)) ?? [],
      date: matchingDay?.key || weekStart,
      dayOfWeek: slot.dayOfWeek,
      timeBlock: daypartFromTemplateSlot(slot),
      startTime: clean(slot.startTime),
      endTime: clean(slot.endTime),
      notes: clean(slot.notes),
      learningArea: slot.itemType === "learning_block" ? clean(slot.subjectId) : "",
      curriculumOutcomeIds: [],
      sourceType: "manual",
      programId: null,
      programSegmentId: null,
      calendarTemplateSlotId: slot.id,
      primaryLearnerId: null,
      isPortfolioHighlight: slot.isPortfolioHighlight === true,
    };
  }

  function buildSubjectFromDraft(draft: CalendarWeekEditorDraft) {
    if (draft.itemType === "learning_block") {
      return clean(draft.learningArea) || "Learning";
    }
    return itemTypeLabel(draft.itemType);
  }

  function buildTitleFromDraft(draft: CalendarWeekEditorDraft) {
    return clean(draft.title) || defaultTitleForItemType(draft.itemType);
  }

  function successFeedbackLabel(
    draft: CalendarWeekEditorDraft,
    fallback: "Saved" | "Updated",
  ) {
    if (draft.isPortfolioHighlight) return "Added to portfolio highlights";
    return fallback;
  }

  function buildLiveBlockFromDraft(draft: CalendarWeekEditorDraft): FamilyCalendarBlockEntry {
    const nextLearnerIds = draft.learnerIds.filter((learnerId) => learnerIds.includes(learnerId));
    const primaryLearnerId = resolvePrimaryLearnerId(nextLearnerIds, draft.primaryLearnerId);

    return {
      id: draft.id || makeLocalId("calendar-block"),
      date: draft.date,
      title: buildTitleFromDraft(draft),
      subject: buildSubjectFromDraft(draft),
      note: clean(draft.notes),
      time: draftTimeLabel(draft),
      curriculumOutcomeIds: draft.curriculumOutcomeIds ?? [],
      sourceType: draft.sourceType,
      programId: draft.programId ?? null,
      programSegmentId: draft.programSegmentId ?? null,
      calendarTemplateSlotId: draft.calendarTemplateSlotId ?? null,
      itemType: draft.itemType,
      learnerIds: nextLearnerIds,
      primaryLearnerId,
      timeBlock: draft.timeBlock,
      startTime: clean(draft.startTime) || null,
      endTime: clean(draft.endTime) || null,
      isPortfolioHighlight: draft.isPortfolioHighlight === true,
    };
  }

  function replaceWeekBlock(nextBlock: FamilyCalendarBlockEntry) {
    setWeekBlocks((current) => {
      const nextEntries = Object.fromEntries(
        Object.entries(current).map(([date, items]) => [
          date,
          items.filter((item) => item.id !== nextBlock.id),
        ]),
      ) as Record<string, FamilyCalendarBlockEntry[]>;

      nextEntries[nextBlock.date] = [...(nextEntries[nextBlock.date] ?? []), nextBlock];

      return Object.fromEntries(
        Object.entries(nextEntries).filter(([, items]) => items.length > 0),
      ) as Record<string, FamilyCalendarBlockEntry[]>;
    });
  }

  function removeWeekBlock(blockId: string) {
    setWeekBlocks((current) =>
      Object.fromEntries(
        Object.entries(current)
          .map(([date, items]) => [date, items.filter((item) => item.id !== blockId)])
          .filter(([, items]) => items.length > 0),
      ) as Record<string, FamilyCalendarBlockEntry[]>,
    );
  }

  function handleToggleAllLearners() {
    setVisibleLearnerIds((current) =>
      current.length === learnerIds.length ? [] : learnerIds,
    );
  }

  function handleToggleLearner(learnerId: string) {
    setVisibleLearnerIds((current) =>
      current.includes(learnerId)
        ? current.filter((item) => item !== learnerId)
        : [...current, learnerId],
    );
  }

  function openCreateItem(day: CalendarWeekDay, timeBlock: CalendarTimeBlock) {
    setEditorMode("create-live");
    setEditorDraft(buildLiveDraftFromCell(day, timeBlock));
    setEditorErrorMessage("");
    setWeekFeedbackMessage("");
  }

  function openLiveBlock(block: FamilyCalendarBlockEntry) {
    setEditorMode("edit-live");
    setEditorDraft(buildLiveDraftFromBlock(block));
    setEditorErrorMessage("");
    setWeekFeedbackMessage("");
  }

  function openTemplateSlot(slot: TemplateSlot) {
    setSelectedSlotId(slot.id);
    setEditorMode("edit-template");
    setEditorDraft(buildTemplateDraft(slot));
    setEditorErrorMessage("");
    setWeekFeedbackMessage("");
  }

  function changeEditorDraft(nextDraft: CalendarWeekEditorDraft) {
    setEditorDraft(nextDraft);
    setEditorErrorMessage("");
  }

  function validateEditorDraft(draft: CalendarWeekEditorDraft) {
    const startTime = clean(draft.startTime);
    const endTime = clean(draft.endTime);

    if (startTime && endTime && endTime <= startTime) {
      return "End time needs to fall after the start time.";
    }

    if (draft.kind === "live" && !canPersistLiveItems) {
      return "This live calendar needs a synced workspace before it can save.";
    }

    if (draft.kind === "live" && !draft.learnerIds.length) {
      return "Choose at least one learner for this live calendar item.";
    }

    if (draft.kind === "template" && !selectedTemplate) {
      return "Choose a template before updating this slot.";
    }

    return "";
  }

  async function saveEditor() {
    if (!editorDraft) return;

    const validationMessage = validateEditorDraft(editorDraft);
    if (validationMessage) {
      setEditorErrorMessage(validationMessage);
      return;
    }

    if (editorDraft.kind === "template") {
      const template = ensureTemplateForEdit();
      const nextSlot: TemplateSlot = {
        id: editorDraft.id || makeLocalId("slot"),
        templateId: template.id,
        dayOfWeek: editorDraft.dayOfWeek,
        startTime: clean(editorDraft.startTime) || null,
        endTime: clean(editorDraft.endTime) || null,
        subjectId:
          editorDraft.itemType === "learning_block"
            ? clean(editorDraft.learningArea) || null
            : itemTypeLabel(editorDraft.itemType),
        label: buildTitleFromDraft(editorDraft),
        notes: clean(editorDraft.notes) || null,
        itemType: editorDraft.itemType,
        learnerIds: editorDraft.learnerIds.filter((learnerId) => learnerIds.includes(learnerId)),
        timeBlock: editorDraft.timeBlock,
        isPortfolioHighlight: editorDraft.isPortfolioHighlight === true,
      };

      replaceTemplate({
        ...template,
        slots: template.slots.some((slot) => slot.id === nextSlot.id)
          ? template.slots.map((slot) => (slot.id === nextSlot.id ? nextSlot : slot))
          : [...template.slots, nextSlot],
        updatedAt: new Date().toISOString(),
      });
      setSelectedTemplateId(template.id);
      setSelectedSlotId(nextSlot.id);
      rememberQuickAddPreferencesFromDraft(editorDraft);
      setStatus("");
      setWeekFeedbackMessage(
        editorDraft.isPortfolioHighlight
          ? "Added to portfolio highlights. Save calendar below to sync it."
          : "Template updated. Save calendar below to sync it.",
      );
      closeWeekEditor();
      return;
    }

    const nextLearnerIds = editorDraft.learnerIds.filter((learnerId) => learnerIds.includes(learnerId));
    const primaryLearnerId = resolvePrimaryLearnerId(nextLearnerIds, editorDraft.primaryLearnerId);

    if (!primaryLearnerId || !workspace.userId || !workspace.profile.id) {
      setEditorErrorMessage("Choose a learner and synced workspace before saving this live item.");
      return;
    }

    const nextDraft = {
      ...editorDraft,
      learnerIds: nextLearnerIds,
      primaryLearnerId,
    };

    try {
      setSavingEditor(true);
      setEditorErrorMessage("");

      if (editorMode === "create-live") {
        const saved = await addFamilyCalendarBlock({
          familyProfileId: workspace.profile.id,
          studentId: primaryLearnerId,
          createdByUserId: workspace.userId,
          date: nextDraft.date,
          title: buildTitleFromDraft(nextDraft),
          subject: buildSubjectFromDraft(nextDraft),
          note: clean(nextDraft.notes),
          time: draftTimeLabel(nextDraft),
          curriculumOutcomeIds: nextDraft.curriculumOutcomeIds,
          sourceType: "manual",
          programId: nextDraft.programId,
          programSegmentId: nextDraft.programSegmentId,
          calendarTemplateSlotId: nextDraft.calendarTemplateSlotId,
          itemType: nextDraft.itemType,
          learnerIds: nextLearnerIds,
          timeBlock: nextDraft.timeBlock,
          startTime: clean(nextDraft.startTime) || null,
          endTime: clean(nextDraft.endTime) || null,
          isPortfolioHighlight: nextDraft.isPortfolioHighlight === true,
        });

        replaceWeekBlock(saved);
        rememberQuickAddPreferencesFromDraft(nextDraft);
        setStatus("");
        setWeekFeedbackMessage(successFeedbackLabel(nextDraft, "Saved"));
        closeWeekEditor();
      } else {
        await updateFamilyCalendarBlock({
          blockId: nextDraft.id || "",
          title: buildTitleFromDraft(nextDraft),
          subject: buildSubjectFromDraft(nextDraft),
          note: clean(nextDraft.notes),
          time: draftTimeLabel(nextDraft),
          curriculumOutcomeIds: nextDraft.curriculumOutcomeIds,
          date: nextDraft.date,
          studentId: primaryLearnerId,
          itemType: nextDraft.itemType,
          learnerIds: nextLearnerIds,
          timeBlock: nextDraft.timeBlock,
          startTime: clean(nextDraft.startTime) || null,
          endTime: clean(nextDraft.endTime) || null,
          isPortfolioHighlight: nextDraft.isPortfolioHighlight === true,
        });

        const nextBlock = buildLiveBlockFromDraft(nextDraft);
        replaceWeekBlock(nextBlock);
        rememberQuickAddPreferencesFromDraft(nextDraft);
        setStatus("");
        setWeekFeedbackMessage(successFeedbackLabel(nextDraft, "Updated"));
        closeWeekEditor();
      }
    } catch (saveError) {
      setEditorErrorMessage(describeSaveError(saveError, friendlyWeekMessage("save")));
    } finally {
      setSavingEditor(false);
    }
  }

  async function deleteEditorItem() {
    if (!editorDraft) return;

    if (editorDraft.kind === "template") {
      if (!selectedTemplate || !editorDraft.id) return;
      handleDeleteSlot(editorDraft.id);
      closeWeekEditor();
      setStatus("");
      setWeekFeedbackMessage("Template deleted. Save calendar below to sync it.");
      return;
    }

    if (!editorDraft.id) return;

    try {
      setDeletingEditor(true);
      setEditorErrorMessage("");
      await removeFamilyCalendarBlock({ blockId: editorDraft.id });
      removeWeekBlock(editorDraft.id);
      setStatus("");
      setWeekFeedbackMessage("Deleted");
      closeWeekEditor();
    } catch (deleteError) {
      setEditorErrorMessage(describeSaveError(deleteError, friendlyWeekMessage("delete")));
    } finally {
      setDeletingEditor(false);
    }
  }

  const selectedCalendarItemKey = editorDraft?.id
    ? `${editorDraft.kind}:${editorDraft.id}`
    : "";

  const canSaveToAccount = Boolean(
    workspace.storageMode === "database" &&
      workspace.userId &&
      isDatabaseProfileId(workspace.profile.id),
  );
  const saveDisabledReason = canSaveToAccount
    ? ""
    : "Sign in and connect a family profile before saving My Calendar.";
  const workspaceStateLabel = canSaveToAccount ? "Synced workspace" : "Needs synced workspace";

  return (
    <FamilyTopNavShell subtitle="My Calendar" hideHero>
      <div className="grid gap-5 pb-14">
        <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.04)] md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] md:items-center">
          <div>
            <div className={LABEL}>Draft workspace</div>
            <h1 className="mt-2 text-[28px] font-black leading-tight text-slate-950">
              My Calendar
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-slate-600">
              Shape the weekly rhythm and open the live family calendar like a working week.
            </p>
          </div>

          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
            <div className={LABEL}>Template + week</div>
            <div className={`mt-2 ${H2}`}>Planning defaults</div>
            <p className={`mt-1 ${META}`}>
              Keep reusable slots in Template mode, then quick-add and edit real week items in Week mode.
            </p>
          </div>
        </section>

        {error || status ? (
          <section
            className={`rounded-[18px] border px-4 py-3 text-[14px] font-semibold ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || status}
          </section>
        ) : null}

        <CalendarViewSwitcher value={viewMode} onChange={handleChangeView} />

        {viewMode === "week" ? (
          <CalendarWeekView
            template={selectedTemplate}
            weekLabel={weekLabel}
            weekDays={weekDays}
            weekBlocks={weekBlocks}
            programs={programs}
            learners={workspace.learners}
            visibleLearnerIds={visibleLearnerIds}
            selectedCalendarItemKey={selectedCalendarItemKey}
            activeLearnerName={activeLearner?.label || ""}
            loading={loadingWeek || workspaceLoading}
            errorMessage={
              weekError || (workspace.syncIssue && !workspace.learners.length ? workspace.syncIssue : "")
            }
            feedbackMessage={weekFeedbackMessage}
            editorMode={editorMode}
            editorDraft={editorDraft}
            editorErrorMessage={editorErrorMessage}
            savingEditor={savingEditor}
            deletingEditor={deletingEditor}
            canPersistLiveItems={canPersistLiveItems}
            onPreviousWeek={goPreviousWeek}
            onToday={goToday}
            onNextWeek={goNextWeek}
            onOpenTemplate={() => handleChangeView("template")}
            onToggleAllLearners={handleToggleAllLearners}
            onToggleLearner={handleToggleLearner}
            onOpenCreateItem={openCreateItem}
            onOpenLiveBlock={openLiveBlock}
            onOpenTemplateSlot={openTemplateSlot}
            onCloseEditor={closeWeekEditor}
            onChangeEditorDraft={changeEditorDraft}
            onSaveEditor={saveEditor}
            onDeleteEditor={deleteEditorItem}
          />
        ) : (
          <>
            <CalendarTemplateSelector
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
              onCreate={handleCreateTemplate}
            />

            {loading || workspaceLoading ? (
              <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
                <div className={BODY}>Loading calendar...</div>
              </section>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <CalendarTemplateGrid
                  slots={selectedTemplate?.slots || []}
                  selectedSlotId={selectedSlotId}
                  onSelectSlot={setSelectedSlotId}
                />

                <div className="xl:sticky xl:top-4 xl:self-start">
                  <CalendarTemplateSlotEditor
                    slot={selectedSlot}
                    onChange={handleChangeSlot}
                    onDelete={handleDeleteSlot}
                    onAddNew={() => handleAddSlot()}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <section className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white/95 px-4 py-4 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
              Draft workspace
            </span>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
              {workspaceStateLabel}
            </span>
            {!canSaveToAccount ? (
              <span className="text-[12px] font-semibold text-slate-500">
                {saveDisabledReason}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => void handleSaveTemplate()}
            disabled={saving || !selectedTemplate || !canSaveToAccount}
            title={!canSaveToAccount ? saveDisabledReason : undefined}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save calendar"}
          </button>
        </section>
      </div>
    </FamilyTopNavShell>
  );
}
