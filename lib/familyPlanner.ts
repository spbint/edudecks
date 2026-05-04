import { isMissingLearnerRelationOrColumn } from "@/lib/familyLearners";
import { supabase } from "@/lib/supabaseClient";

export type FamilyPlannerActionCategory = "observe" | "do" | "capture" | "reflect";
export type CalendarItemType =
  | "learning_block"
  | "task"
  | "appointment"
  | "playdate"
  | "reminder"
  | "custom";
export type CalendarTimeBlock = "morning" | "midday" | "afternoon";

export type FamilyPlannerAction = {
  id: string;
  title: string;
  description: string;
  category: FamilyPlannerActionCategory;
  completed: boolean;
};

export type FamilyWeeklyPlan = {
  focusTitle: string;
  focusSummary: string;
  selectedGoal: string;
  notes: string;
  encouragement: string;
  actions: FamilyPlannerAction[];
  updatedAt: string;
};

export type FamilyCalendarBlockEntry = {
  id: string;
  date: string;
  title: string;
  subject: string;
  note: string;
  time: string;
  curriculumOutcomeIds: string[];
  sourceType?: "manual" | "generated";
  programId?: string | null;
  programSegmentId?: string | null;
  calendarTemplateSlotId?: string | null;
  itemType?: CalendarItemType;
  learnerIds?: string[];
  primaryLearnerId?: string | null;
  timeBlock?: CalendarTimeBlock | null;
  startTime?: string | null;
  endTime?: string | null;
  isPortfolioHighlight?: boolean;
};

export type FamilyCalendarWindow = {
  dayNotes: Record<string, string>;
  blocks: Record<string, FamilyCalendarBlockEntry[]>;
};

type PlannerRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  source?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

type PlannerRowWithCreatedAt = PlannerRow & {
  created_at?: string | null;
};

type CalendarWindowRow = {
  id?: string | null;
  student_id?: string | null;
  title?: string | null;
  description?: string | null;
  planned_date?: string | null;
  source?: string | null;
  curriculum_outcome_ids?: string[] | null;
};

type CalendarWindowQueryResult = {
  data: CalendarWindowRow[] | null;
  error: unknown;
};

type CalendarBlockMutationRow = {
  id?: string | null;
  student_id?: string | null;
  title?: string | null;
  description?: string | null;
  planned_date?: string | null;
  source?: string | null;
  curriculum_outcome_ids?: string[] | null;
};

type CalendarBlockMutationResult = {
  data: CalendarBlockMutationRow | null;
  error: unknown;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown) {
  return value === true;
}

function getWeekKeyFromDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((diffDays + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function parseCalendarPayload(value: string): {
  note: string;
  time: string;
  curriculumOutcomeIds: string[];
  sourceType: "manual" | "generated";
  programId: string | null;
  programSegmentId: string | null;
  calendarTemplateSlotId: string | null;
  itemType: CalendarItemType;
  learnerIds: string[];
  timeBlock: CalendarTimeBlock | null;
  startTime: string | null;
  endTime: string | null;
  isPortfolioHighlight: boolean;
} {
  const raw = safe(value);
  if (!raw) {
    return {
      note: "",
      time: "",
      curriculumOutcomeIds: [],
      sourceType: "manual",
      programId: null,
      programSegmentId: null,
      calendarTemplateSlotId: null,
      itemType: "learning_block",
      learnerIds: [],
      timeBlock: null,
      startTime: null,
      endTime: null,
      isPortfolioHighlight: false,
    };
  }

  try {
    const parsed = JSON.parse(raw) as {
      note?: unknown;
      time?: unknown;
      curriculumOutcomeIds?: unknown;
      sourceType?: unknown;
      programId?: unknown;
      programSegmentId?: unknown;
      calendarTemplateSlotId?: unknown;
      itemType?: unknown;
      learnerIds?: unknown;
      timeBlock?: unknown;
      startTime?: unknown;
      endTime?: unknown;
      isPortfolioHighlight?: unknown;
    };
    const startTime = safe(parsed?.startTime) || inferStartTimeFromTime(safe(parsed?.time));
    const endTime = safe(parsed?.endTime) || inferEndTimeFromTime(safe(parsed?.time));
    return {
      note: safe(parsed?.note),
      time: buildCalendarBlockTimeLabel({
        time: safe(parsed?.time),
        startTime,
        endTime,
        timeBlock: normalizeCalendarTimeBlock(parsed?.timeBlock, startTime, endTime),
      }),
      curriculumOutcomeIds: Array.isArray(parsed?.curriculumOutcomeIds)
        ? parsed.curriculumOutcomeIds.map((item) => safe(item)).filter(Boolean)
        : [],
      sourceType: safe(parsed?.sourceType) === "generated" ? "generated" : "manual",
      programId: safe(parsed?.programId) || null,
      programSegmentId: safe(parsed?.programSegmentId) || null,
      calendarTemplateSlotId: safe(parsed?.calendarTemplateSlotId) || null,
      itemType: normalizeCalendarItemType(parsed?.itemType),
      learnerIds: normalizeLearnerIds(parsed?.learnerIds),
      timeBlock: normalizeCalendarTimeBlock(parsed?.timeBlock, startTime, endTime),
      startTime: startTime || null,
      endTime: endTime || null,
      isPortfolioHighlight: asBoolean(parsed?.isPortfolioHighlight),
    };
  } catch {
    return {
      note: raw,
      time: "",
      curriculumOutcomeIds: [],
      sourceType: "manual" as const,
      programId: null,
      programSegmentId: null,
      calendarTemplateSlotId: null,
      itemType: "learning_block" as const,
      learnerIds: [],
      timeBlock: null,
      startTime: null,
      endTime: null,
      isPortfolioHighlight: false,
    };
  }
}

function normalizeCurriculumOutcomeIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safe(item)).filter(Boolean);
}

function normalizeLearnerIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => safe(item)).filter(Boolean)));
}

function normalizeCalendarItemType(value: unknown): CalendarItemType {
  const itemType = safe(value);
  if (
    itemType === "task" ||
    itemType === "appointment" ||
    itemType === "playdate" ||
    itemType === "reminder" ||
    itemType === "custom"
  ) {
    return itemType;
  }
  return "learning_block";
}

function normalizeCalendarTimeBlock(
  value: unknown,
  startTime?: string | null,
  endTime?: string | null,
): CalendarTimeBlock | null {
  const timeBlock = safe(value);
  if (timeBlock === "morning" || timeBlock === "midday" || timeBlock === "afternoon") {
    return timeBlock;
  }

  const hourSource = safe(startTime) || safe(endTime);
  const match = hourSource.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return null;
  if (hour < 12) return "morning";
  if (hour < 14) return "midday";
  return "afternoon";
}

function inferStartTimeFromTime(time: string) {
  const parts = safe(time).split(" - ").map((part) => part.trim()).filter(Boolean);
  const first = parts[0] || "";
  return /^\d{1,2}:\d{2}$/.test(first) ? first : "";
}

function inferEndTimeFromTime(time: string) {
  const parts = safe(time).split(" - ").map((part) => part.trim()).filter(Boolean);
  const second = parts[1] || "";
  return /^\d{1,2}:\d{2}$/.test(second) ? second : "";
}

function buildCalendarBlockTimeLabel(input: {
  time?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  timeBlock?: CalendarTimeBlock | null;
}) {
  const startTime = safe(input.startTime);
  const endTime = safe(input.endTime);
  const explicitTime = safe(input.time);

  if (startTime && endTime) return `${startTime} - ${endTime}`;
  if (startTime) return startTime;
  if (explicitTime) return explicitTime;
  if (input.timeBlock === "morning") return "Morning session";
  if (input.timeBlock === "midday") return "Midday session";
  if (input.timeBlock === "afternoon") return "Afternoon session";
  return "";
}

function buildCalendarPayload(input: {
  note?: string | null;
  time?: string | null;
  curriculumOutcomeIds?: string[];
  sourceType?: "manual" | "generated";
  programId?: string | null;
  programSegmentId?: string | null;
  calendarTemplateSlotId?: string | null;
  itemType?: CalendarItemType;
  learnerIds?: string[];
  timeBlock?: CalendarTimeBlock | null;
  startTime?: string | null;
  endTime?: string | null;
  isPortfolioHighlight?: boolean;
}) {
  return JSON.stringify({
    note: safe(input.note),
    time: buildCalendarBlockTimeLabel({
      time: input.time,
      startTime: input.startTime,
      endTime: input.endTime,
      timeBlock: input.timeBlock ?? null,
    }),
    curriculumOutcomeIds: normalizeCurriculumOutcomeIds(input.curriculumOutcomeIds),
    sourceType: input.sourceType === "generated" ? "generated" : "manual",
    programId: safe(input.programId) || null,
    programSegmentId: safe(input.programSegmentId) || null,
    calendarTemplateSlotId: safe(input.calendarTemplateSlotId) || null,
    itemType: normalizeCalendarItemType(input.itemType),
    learnerIds: normalizeLearnerIds(input.learnerIds),
    timeBlock: input.timeBlock ?? null,
    startTime: safe(input.startTime) || null,
    endTime: safe(input.endTime) || null,
    isPortfolioHighlight: input.isPortfolioHighlight === true,
  });
}

function calendarBlockSource(subject: string) {
  return `planner_calendar_block:${safe(subject) || "General"}`;
}

function parseCalendarBlockSubject(source: string) {
  const parsed = safe(source).replace("planner_calendar_block:", "");
  return parsed || "General";
}

function actionCategoryFromSource(source: string): FamilyPlannerActionCategory {
  const category = source.replace("planner_action:", "");
  if (category === "observe" || category === "do" || category === "capture" || category === "reflect") {
    return category;
  }
  return "do";
}

export async function loadFamilyWeeklyPlan(input: {
  familyProfileId: string;
  studentId: string;
  weekKey: string;
}): Promise<FamilyWeeklyPlan | null> {
  const response = await supabase
    .from("learning_plan_items")
    .select("id,title,description,source,status,updated_at")
    .eq("family_profile_id", input.familyProfileId)
    .eq("student_id", input.studentId)
    .eq("week_key", input.weekKey)
    .order("created_at", { ascending: true });

  if (response.error) throw response.error;

  const rows = (response.data ?? []) as PlannerRow[];
  if (!rows.length) return null;

  const focusRow = rows.find((row) => safe(row.source) === "planner_focus");
  const goalRow = rows.find((row) => safe(row.source) === "planner_goal");
  const noteRow = rows.find((row) => safe(row.source) === "planner_note");
  const actionRows = rows.filter((row) => safe(row.source).startsWith("planner_action:"));

  return {
    focusTitle: safe(focusRow?.title) || "Weekly focus",
    focusSummary: safe(focusRow?.description),
    selectedGoal: safe(goalRow?.title) || "Weekly family focus",
    notes: safe(noteRow?.description),
    encouragement: safe(goalRow?.description),
    actions: actionRows.map((row) => ({
      id: safe(row.id),
      title: safe(row.title) || "Planner action",
      description: safe(row.description),
      category: actionCategoryFromSource(safe(row.source)),
      completed: safe(row.status).toLowerCase() === "completed",
    })),
    updatedAt: safe(rows[0]?.updated_at) || new Date().toISOString(),
  };
}

export async function saveFamilyWeeklyPlan(input: {
  familyProfileId: string;
  studentId: string;
  createdByUserId: string;
  weekKey: string;
  plan: FamilyWeeklyPlan;
}): Promise<FamilyWeeklyPlan> {
  const existing = await supabase
    .from("learning_plan_items")
    .select("id,title,description,source,status,updated_at,created_at")
    .eq("family_profile_id", input.familyProfileId)
    .eq("student_id", input.studentId)
    .eq("week_key", input.weekKey)
    .order("created_at", { ascending: true });

  if (existing.error) throw existing.error;

  const rows = (existing.data ?? []) as PlannerRowWithCreatedAt[];
  const upsertedActionIds = new Set<string>();

  async function upsertSingletonRow(config: {
    source: string;
    title: string;
    description: string;
    status?: string;
    present: boolean;
  }) {
    const existingRow = rows.find((row) => safe(row.source) === config.source) ?? null;

    if (!config.present) {
      if (!existingRow?.id) return;
      const deletion = await supabase.from("learning_plan_items").delete().eq("id", existingRow.id);
      if (deletion.error) throw deletion.error;
      return;
    }

    const payload = {
      family_profile_id: input.familyProfileId,
      student_id: input.studentId,
      title: config.title,
      description: config.description,
      week_key: input.weekKey,
      status: config.status ?? "planned",
      source: config.source,
      created_by_user_id: input.createdByUserId,
    };

    if (existingRow?.id) {
      const updateResponse = await supabase.from("learning_plan_items").update(payload).eq("id", existingRow.id);
      if (updateResponse.error) throw updateResponse.error;
      return;
    }

    const insertResponse = await supabase.from("learning_plan_items").insert(payload);
    if (insertResponse.error) throw insertResponse.error;
  }

  await upsertSingletonRow({
    source: "planner_focus",
    title: input.plan.focusTitle || "Weekly focus",
    description: input.plan.focusSummary || "",
    present: true,
  });

  await upsertSingletonRow({
    source: "planner_goal",
    title: input.plan.selectedGoal || "Weekly family focus",
    description: input.plan.encouragement || "",
    present: true,
  });

  await upsertSingletonRow({
    source: "planner_note",
    title: "Weekly note",
    description: input.plan.notes,
    present: Boolean(safe(input.plan.notes)),
  });

  const existingActionRows = rows.filter((row) => safe(row.source).startsWith("planner_action:"));

  for (const action of input.plan.actions) {
    const existingActionRow = existingActionRows.find((row) => row.id === action.id) ?? null;
    const payload = {
      family_profile_id: input.familyProfileId,
      student_id: input.studentId,
      title: action.title || "Planner action",
      description: action.description || "",
      week_key: input.weekKey,
      status: action.completed ? "completed" : "planned",
      source: `planner_action:${action.category}`,
      created_by_user_id: input.createdByUserId,
    };

    if (existingActionRow?.id) {
      const updateResponse = await supabase
        .from("learning_plan_items")
        .update(payload)
        .eq("id", existingActionRow.id)
        .select("id")
        .single();

      if (updateResponse.error) throw updateResponse.error;
      upsertedActionIds.add(safe(updateResponse.data?.id) || existingActionRow.id);
      continue;
    }

    const insertResponse = await supabase.from("learning_plan_items").insert(payload).select("id").single();
    if (insertResponse.error) throw insertResponse.error;
    upsertedActionIds.add(safe(insertResponse.data?.id));
  }

  const actionIdsToDelete = existingActionRows
    .map((row) => safe(row.id))
    .filter((id) => id && !upsertedActionIds.has(id));

  if (actionIdsToDelete.length) {
    const deletion = await supabase.from("learning_plan_items").delete().in("id", actionIdsToDelete);
    if (deletion.error) throw deletion.error;
  }

  return (
    (await loadFamilyWeeklyPlan({
      familyProfileId: input.familyProfileId,
      studentId: input.studentId,
      weekKey: input.weekKey,
    })) ?? {
      focusTitle: input.plan.focusTitle,
      focusSummary: input.plan.focusSummary,
      selectedGoal: input.plan.selectedGoal,
      notes: input.plan.notes,
      encouragement: input.plan.encouragement,
      actions: input.plan.actions,
      updatedAt: input.plan.updatedAt,
    }
  );
}

export async function loadFamilyCalendarWindow(input: {
  familyProfileId: string;
  studentId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<FamilyCalendarWindow> {
  let response = (await supabase
    .from("learning_plan_items")
    .select("id,student_id,title,description,planned_date,source,curriculum_outcome_ids")
    .eq("family_profile_id", input.familyProfileId)
    .eq("student_id", input.studentId)
    .gte("planned_date", input.dateFrom)
    .lte("planned_date", input.dateTo)
    .like("source", "planner_calendar_%")
    .order("planned_date", { ascending: true })
    .order("created_at", { ascending: true })) as CalendarWindowQueryResult;

  if (response.error && isMissingLearnerRelationOrColumn(response.error)) {
    response = (await supabase
      .from("learning_plan_items")
      .select("id,student_id,title,description,planned_date,source")
      .eq("family_profile_id", input.familyProfileId)
      .eq("student_id", input.studentId)
      .gte("planned_date", input.dateFrom)
      .lte("planned_date", input.dateTo)
      .like("source", "planner_calendar_%")
      .order("planned_date", { ascending: true })
      .order("created_at", { ascending: true })) as CalendarWindowQueryResult;
  }

  if (response.error) throw response.error;

  const rows = response.data ?? [];

  const result: FamilyCalendarWindow = {
    dayNotes: {},
    blocks: {},
  };

  for (const row of rows) {
    const plannedDate = safe(row.planned_date);
    const source = safe(row.source);
    if (!plannedDate || !source) continue;

    if (source === "planner_calendar_note") {
      result.dayNotes[plannedDate] = safe(row.description);
      continue;
    }

    if (source.startsWith("planner_calendar_block:")) {
      const payload = parseCalendarPayload(safe(row.description));
      const entry: FamilyCalendarBlockEntry = {
        id: safe(row.id),
        date: plannedDate,
        title: safe(row.title) || "Learning block",
        subject: parseCalendarBlockSubject(source),
        note: payload.note,
        time: payload.time,
        curriculumOutcomeIds:
          normalizeCurriculumOutcomeIds(row.curriculum_outcome_ids) ||
          payload.curriculumOutcomeIds,
        sourceType: payload.sourceType,
        programId: payload.programId,
        programSegmentId: payload.programSegmentId,
        calendarTemplateSlotId: payload.calendarTemplateSlotId,
        itemType: payload.itemType,
        learnerIds: payload.learnerIds.length
          ? payload.learnerIds
          : [safe(row.student_id)].filter(Boolean),
        primaryLearnerId: safe(row.student_id) || null,
        timeBlock: payload.timeBlock,
        startTime: payload.startTime,
        endTime: payload.endTime,
        isPortfolioHighlight: payload.isPortfolioHighlight,
      };

      result.blocks[plannedDate] = [...(result.blocks[plannedDate] ?? []), entry];
    }
  }

  return result;
}

export async function addFamilyCalendarBlock(input: {
  familyProfileId: string;
  studentId: string;
  createdByUserId: string;
  date: string;
  title: string;
  subject: string;
  note?: string;
  time?: string;
  curriculumOutcomeIds?: string[];
  sourceType?: "manual" | "generated";
  programId?: string | null;
  programSegmentId?: string | null;
  calendarTemplateSlotId?: string | null;
  itemType?: CalendarItemType;
  learnerIds?: string[];
  timeBlock?: CalendarTimeBlock | null;
  startTime?: string | null;
  endTime?: string | null;
  isPortfolioHighlight?: boolean;
}): Promise<FamilyCalendarBlockEntry> {
  const payload = {
    family_profile_id: input.familyProfileId,
    student_id: input.studentId,
    title: safe(input.title) || "Learning block",
    description: buildCalendarPayload({
      note: input.note,
      time: input.time,
      curriculumOutcomeIds: input.curriculumOutcomeIds,
      sourceType: input.sourceType,
      programId: input.programId,
      programSegmentId: input.programSegmentId,
      calendarTemplateSlotId: input.calendarTemplateSlotId,
      itemType: input.itemType,
      learnerIds: input.learnerIds?.length ? input.learnerIds : [input.studentId],
      timeBlock: input.timeBlock ?? null,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      isPortfolioHighlight: input.isPortfolioHighlight === true,
    }),
    planned_date: input.date,
    week_key: getWeekKeyFromDate(input.date),
    status: "planned",
    source: calendarBlockSource(input.subject),
    created_by_user_id: input.createdByUserId,
    curriculum_outcome_ids: normalizeCurriculumOutcomeIds(input.curriculumOutcomeIds),
  };

  let response = (await supabase
    .from("learning_plan_items")
    .insert(payload)
    .select("id,student_id,title,description,planned_date,source,curriculum_outcome_ids")
    .single()) as CalendarBlockMutationResult;

  if (response.error && isMissingLearnerRelationOrColumn(response.error)) {
    response = (await supabase
      .from("learning_plan_items")
      .insert({
        ...payload,
        // fallback path for pre-migration schemas
        curriculum_outcome_ids: undefined,
      })
      .select("id,student_id,title,description,planned_date,source")
      .single()) as CalendarBlockMutationResult;
  }

  if (response.error) throw response.error;

  const row = response.data ?? {};

  const parsedPayload = parseCalendarPayload(safe(row.description));
  return {
    id: safe(row.id),
    date: safe(row.planned_date),
    title: safe(row.title) || "Learning block",
    subject: parseCalendarBlockSubject(safe(row.source)),
    note: parsedPayload.note,
    time: parsedPayload.time,
    curriculumOutcomeIds:
      normalizeCurriculumOutcomeIds(row.curriculum_outcome_ids) || parsedPayload.curriculumOutcomeIds,
    sourceType: parsedPayload.sourceType,
    programId: parsedPayload.programId,
    programSegmentId: parsedPayload.programSegmentId,
    calendarTemplateSlotId: parsedPayload.calendarTemplateSlotId,
    itemType: parsedPayload.itemType,
    learnerIds: parsedPayload.learnerIds.length
      ? parsedPayload.learnerIds
      : [safe(row.student_id)].filter(Boolean),
    primaryLearnerId: safe(row.student_id) || null,
    timeBlock: parsedPayload.timeBlock,
    startTime: parsedPayload.startTime,
    endTime: parsedPayload.endTime,
    isPortfolioHighlight: parsedPayload.isPortfolioHighlight,
  };
}

export async function updateFamilyCalendarBlockCurriculum(input: {
  blockId: string;
  curriculumOutcomeIds: string[];
}): Promise<void> {
  const existingResponse = await supabase
    .from("learning_plan_items")
    .select("description")
    .eq("id", input.blockId)
    .single();

  if (existingResponse.error) throw existingResponse.error;

  const currentPayload = parseCalendarPayload(
    safe((existingResponse.data as { description?: unknown } | null)?.description),
  );

  const preservedDescription = buildCalendarPayload({
    note: currentPayload.note,
    time: currentPayload.time,
    curriculumOutcomeIds: normalizeCurriculumOutcomeIds(input.curriculumOutcomeIds),
    sourceType: currentPayload.sourceType,
    programId: currentPayload.programId,
    programSegmentId: currentPayload.programSegmentId,
    calendarTemplateSlotId: currentPayload.calendarTemplateSlotId,
    itemType: currentPayload.itemType,
    learnerIds: currentPayload.learnerIds,
    timeBlock: currentPayload.timeBlock,
    startTime: currentPayload.startTime,
    endTime: currentPayload.endTime,
    isPortfolioHighlight: currentPayload.isPortfolioHighlight,
  });

  let updateResponse = await supabase
    .from("learning_plan_items")
    .update({
      description: preservedDescription,
      curriculum_outcome_ids: normalizeCurriculumOutcomeIds(input.curriculumOutcomeIds),
    })
    .eq("id", input.blockId);

  if (updateResponse.error && isMissingLearnerRelationOrColumn(updateResponse.error)) {
    updateResponse = await supabase
      .from("learning_plan_items")
      .update({
        description: preservedDescription,
      })
      .eq("id", input.blockId);
  }

  if (updateResponse.error) throw updateResponse.error;
}

export async function updateFamilyCalendarBlock(input: {
  blockId: string;
  title: string;
  subject: string;
  note?: string;
  time?: string;
  curriculumOutcomeIds?: string[];
  date?: string;
  studentId?: string;
  itemType?: CalendarItemType;
  learnerIds?: string[];
  timeBlock?: CalendarTimeBlock | null;
  startTime?: string | null;
  endTime?: string | null;
  isPortfolioHighlight?: boolean;
}): Promise<void> {
  const existingResponse = await supabase
    .from("learning_plan_items")
    .select("description,planned_date,student_id")
    .eq("id", input.blockId)
    .single();

  if (existingResponse.error) throw existingResponse.error;

  const existingRow = existingResponse.data as {
    description?: unknown;
    planned_date?: unknown;
    student_id?: unknown;
  } | null;
  const currentPayload = parseCalendarPayload(
    safe(existingRow?.description),
  );
  const nextDate = safe(input.date) || safe(existingRow?.planned_date);
  const nextStudentId = safe(input.studentId) || safe(existingRow?.student_id);
  const nextDescription = buildCalendarPayload({
    note: input.note ?? currentPayload.note,
    time: input.time ?? currentPayload.time,
    curriculumOutcomeIds:
      input.curriculumOutcomeIds ?? currentPayload.curriculumOutcomeIds,
    sourceType: currentPayload.sourceType,
    programId: currentPayload.programId,
    programSegmentId: currentPayload.programSegmentId,
    calendarTemplateSlotId: currentPayload.calendarTemplateSlotId,
    itemType: input.itemType ?? currentPayload.itemType,
    learnerIds: input.learnerIds ?? currentPayload.learnerIds,
    timeBlock:
      input.timeBlock === undefined ? currentPayload.timeBlock : input.timeBlock,
    startTime:
      input.startTime === undefined ? currentPayload.startTime : input.startTime,
    endTime: input.endTime === undefined ? currentPayload.endTime : input.endTime,
    isPortfolioHighlight:
      input.isPortfolioHighlight === undefined
        ? currentPayload.isPortfolioHighlight
        : input.isPortfolioHighlight,
  });

  let updateResponse = await supabase
    .from("learning_plan_items")
    .update({
      title: safe(input.title) || "Learning block",
      student_id: nextStudentId || null,
      planned_date: nextDate || null,
      week_key: nextDate ? getWeekKeyFromDate(nextDate) : null,
      source: calendarBlockSource(input.subject),
      description: nextDescription,
      curriculum_outcome_ids: normalizeCurriculumOutcomeIds(
        input.curriculumOutcomeIds ?? currentPayload.curriculumOutcomeIds,
      ),
    })
    .eq("id", input.blockId);

  if (updateResponse.error && isMissingLearnerRelationOrColumn(updateResponse.error)) {
    updateResponse = await supabase
      .from("learning_plan_items")
      .update({
        title: safe(input.title) || "Learning block",
        student_id: nextStudentId || null,
        planned_date: nextDate || null,
        week_key: nextDate ? getWeekKeyFromDate(nextDate) : null,
        source: calendarBlockSource(input.subject),
        description: nextDescription,
      })
      .eq("id", input.blockId);
  }

  if (updateResponse.error) throw updateResponse.error;
}

export async function removeFamilyCalendarBlock(input: { blockId: string }): Promise<void> {
  const response = await supabase
    .from("learning_plan_items")
    .delete()
    .eq("id", input.blockId);

  if (response.error) throw response.error;
}

export async function saveFamilyCalendarDayNote(input: {
  familyProfileId: string;
  studentId: string;
  createdByUserId: string;
  date: string;
  note: string;
}): Promise<void> {
  const existing = await supabase
    .from("learning_plan_items")
    .select("id")
    .eq("family_profile_id", input.familyProfileId)
    .eq("student_id", input.studentId)
    .eq("planned_date", input.date)
    .eq("source", "planner_calendar_note");

  if (existing.error) throw existing.error;

  const existingIds = (existing.data ?? [])
    .map((row) => safe((row as { id?: unknown }).id))
    .filter(Boolean);

  if (existingIds.length) {
    const deletion = await supabase.from("learning_plan_items").delete().in("id", existingIds);
    if (deletion.error) throw deletion.error;
  }

  const note = safe(input.note);
  if (!note) return;

  const insertResponse = await supabase.from("learning_plan_items").insert({
    family_profile_id: input.familyProfileId,
    student_id: input.studentId,
    title: "Calendar day note",
    description: note,
    planned_date: input.date,
    week_key: getWeekKeyFromDate(input.date),
    status: "planned",
    source: "planner_calendar_note",
    created_by_user_id: input.createdByUserId,
  });

  if (insertResponse.error) throw insertResponse.error;
}

export async function countFamilyGeneratedCalendarBlocks(input: {
  familyProfileId: string;
  studentId?: string | null;
}): Promise<number> {
  let query = supabase
    .from("learning_plan_items")
    .select("id,description,source")
    .eq("family_profile_id", input.familyProfileId)
    .like("source", "planner_calendar_block:%")
    .order("created_at", { ascending: false })
    .limit(250);

  if (safe(input.studentId)) {
    query = query.eq("student_id", safe(input.studentId));
  }

  const response = await query;
  if (response.error) throw response.error;

  const rows = (response.data ?? []) as Array<{
    id?: string | null;
    description?: string | null;
    source?: string | null;
  }>;

  return rows.filter((row) => parseCalendarPayload(safe(row.description)).sourceType === "generated").length;
}
