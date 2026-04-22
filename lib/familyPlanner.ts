import { isMissingLearnerRelationOrColumn } from "@/lib/familyLearners";
import { supabase } from "@/lib/supabaseClient";

export type FamilyPlannerActionCategory = "observe" | "do" | "capture" | "reflect";

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

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getWeekKeyFromDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((diffDays + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function parseCalendarPayload(value: string) {
  const raw = safe(value);
  if (!raw) return { note: "", time: "" };

  try {
    const parsed = JSON.parse(raw) as {
      note?: unknown;
      time?: unknown;
      curriculumOutcomeIds?: unknown;
    };
    return {
      note: safe(parsed?.note),
      time: safe(parsed?.time),
      curriculumOutcomeIds: Array.isArray(parsed?.curriculumOutcomeIds)
        ? parsed.curriculumOutcomeIds.map((item) => safe(item)).filter(Boolean)
        : [],
    };
  } catch {
    return { note: raw, time: "", curriculumOutcomeIds: [] };
  }
}

function normalizeCurriculumOutcomeIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safe(item)).filter(Boolean);
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
  let response: any = await supabase
    .from("learning_plan_items")
    .select("id,title,description,planned_date,source,curriculum_outcome_ids")
    .eq("family_profile_id", input.familyProfileId)
    .eq("student_id", input.studentId)
    .gte("planned_date", input.dateFrom)
    .lte("planned_date", input.dateTo)
    .like("source", "planner_calendar_%")
    .order("planned_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (response.error && isMissingLearnerRelationOrColumn(response.error)) {
    response = await supabase
      .from("learning_plan_items")
      .select("id,title,description,planned_date,source")
      .eq("family_profile_id", input.familyProfileId)
      .eq("student_id", input.studentId)
      .gte("planned_date", input.dateFrom)
      .lte("planned_date", input.dateTo)
      .like("source", "planner_calendar_%")
      .order("planned_date", { ascending: true })
      .order("created_at", { ascending: true });
  }

  if (response.error) throw response.error;

  const rows = (response.data ?? []) as Array<{
    id?: string | null;
    title?: string | null;
    description?: string | null;
    planned_date?: string | null;
    source?: string | null;
    curriculum_outcome_ids?: string[] | null;
  }>;

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
}): Promise<FamilyCalendarBlockEntry> {
  const payload = {
    family_profile_id: input.familyProfileId,
    student_id: input.studentId,
    title: safe(input.title) || "Learning block",
    description: JSON.stringify({
      note: safe(input.note),
      time: safe(input.time),
      curriculumOutcomeIds: normalizeCurriculumOutcomeIds(input.curriculumOutcomeIds),
    }),
    planned_date: input.date,
    week_key: getWeekKeyFromDate(input.date),
    status: "planned",
    source: calendarBlockSource(input.subject),
    created_by_user_id: input.createdByUserId,
    curriculum_outcome_ids: normalizeCurriculumOutcomeIds(input.curriculumOutcomeIds),
  };

  let response: any = await supabase
    .from("learning_plan_items")
    .insert(payload)
    .select("id,title,description,planned_date,source,curriculum_outcome_ids")
    .single();

  if (response.error && isMissingLearnerRelationOrColumn(response.error)) {
    response = await supabase
      .from("learning_plan_items")
      .insert({
        ...payload,
        // fallback path for pre-migration schemas
        curriculum_outcome_ids: undefined,
      })
      .select("id,title,description,planned_date,source")
      .single();
  }

  if (response.error) throw response.error;

  const row = response.data as {
    id?: string | null;
    title?: string | null;
    description?: string | null;
    planned_date?: string | null;
    source?: string | null;
    curriculum_outcome_ids?: string[] | null;
  };

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

  const nextDescription = JSON.stringify({
    note: currentPayload.note,
    time: currentPayload.time,
    curriculumOutcomeIds: normalizeCurriculumOutcomeIds(input.curriculumOutcomeIds),
  });

  let updateResponse = await supabase
    .from("learning_plan_items")
    .update({
      description: nextDescription,
      curriculum_outcome_ids: normalizeCurriculumOutcomeIds(input.curriculumOutcomeIds),
    })
    .eq("id", input.blockId);

  if (updateResponse.error && isMissingLearnerRelationOrColumn(updateResponse.error)) {
    updateResponse = await supabase
      .from("learning_plan_items")
      .update({
        description: nextDescription,
      })
      .eq("id", input.blockId);
  }

  if (updateResponse.error) throw updateResponse.error;
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
