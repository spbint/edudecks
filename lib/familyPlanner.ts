import { supabase } from "@/lib/supabaseClient";

export type FamilyPlannerActionCategory =
  | "observe"
  | "do"
  | "capture"
  | "reflect";

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
    const parsed = JSON.parse(raw) as { note?: unknown; time?: unknown };
    return {
      note: safe(parsed?.note),
      time: safe(parsed?.time),
    };
  } catch {
    return { note: raw, time: "" };
  }
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
  if (
    category === "observe" ||
    category === "do" ||
    category === "capture" ||
    category === "reflect"
  ) {
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

  if (response.error) {
    throw response.error;
  }

  const rows = (response.data ?? []) as PlannerRow[];
  if (!rows.length) return null;

  const focusRow = rows.find((row) => safe(row.source) === "planner_focus");
  const goalRow = rows.find((row) => safe(row.source) === "planner_goal");
  const noteRow = rows.find((row) => safe(row.source) === "planner_note");
  const actionRows = rows.filter((row) =>
    safe(row.source).startsWith("planner_action:"),
  );

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
    updatedAt:
      safe(rows[0]?.updated_at) || new Date().toISOString(),
  };
}

export async function saveFamilyWeeklyPlan(input: {
  familyProfileId: string;
  studentId: string;
  createdByUserId: string;
  weekKey: string;
  plan: FamilyWeeklyPlan;
}): Promise<void> {
  const existing = await supabase
    .from("learning_plan_items")
    .select("id")
    .eq("family_profile_id", input.familyProfileId)
    .eq("student_id", input.studentId)
    .eq("week_key", input.weekKey);

  if (existing.error) {
    throw existing.error;
  }

  const existingIds = (existing.data ?? [])
    .map((row) => safe((row as { id?: unknown }).id))
    .filter(Boolean);

  if (existingIds.length) {
    const deletion = await supabase
      .from("learning_plan_items")
      .delete()
      .in("id", existingIds);

    if (deletion.error) {
      throw deletion.error;
    }
  }

  const rows: Array<Record<string, unknown>> = [
    {
      family_profile_id: input.familyProfileId,
      student_id: input.studentId,
      title: input.plan.focusTitle || "Weekly focus",
      description: input.plan.focusSummary || "",
      week_key: input.weekKey,
      status: "planned",
      source: "planner_focus",
      created_by_user_id: input.createdByUserId,
    },
    {
      family_profile_id: input.familyProfileId,
      student_id: input.studentId,
      title: input.plan.selectedGoal || "Weekly family focus",
      description: input.plan.encouragement || "",
      week_key: input.weekKey,
      status: "planned",
      source: "planner_goal",
      created_by_user_id: input.createdByUserId,
    },
    ...(input.plan.notes
      ? [
          {
            family_profile_id: input.familyProfileId,
            student_id: input.studentId,
            title: "Weekly note",
            description: input.plan.notes,
            week_key: input.weekKey,
            status: "planned",
            source: "planner_note",
            created_by_user_id: input.createdByUserId,
          },
        ]
      : []),
    ...input.plan.actions.map((action) => ({
      family_profile_id: input.familyProfileId,
      student_id: input.studentId,
      title: action.title || "Planner action",
      description: action.description || "",
      week_key: input.weekKey,
      status: action.completed ? "completed" : "planned",
      source: `planner_action:${action.category}`,
      created_by_user_id: input.createdByUserId,
    })),
  ];

  const insertResponse = await supabase.from("learning_plan_items").insert(rows);
  if (insertResponse.error) {
    throw insertResponse.error;
  }
}

export async function loadFamilyCalendarWindow(input: {
  familyProfileId: string;
  studentId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<FamilyCalendarWindow> {
  const response = await supabase
    .from("learning_plan_items")
    .select("id,title,description,planned_date,source")
    .eq("family_profile_id", input.familyProfileId)
    .eq("student_id", input.studentId)
    .gte("planned_date", input.dateFrom)
    .lte("planned_date", input.dateTo)
    .like("source", "planner_calendar_%")
    .order("planned_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (response.error) {
    throw response.error;
  }

  const rows = (response.data ?? []) as Array<{
    id?: string | null;
    title?: string | null;
    description?: string | null;
    planned_date?: string | null;
    source?: string | null;
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
}): Promise<FamilyCalendarBlockEntry> {
  const response = await supabase
    .from("learning_plan_items")
    .insert({
      family_profile_id: input.familyProfileId,
      student_id: input.studentId,
      title: safe(input.title) || "Learning block",
      description: JSON.stringify({
        note: safe(input.note),
        time: safe(input.time),
      }),
      planned_date: input.date,
      week_key: getWeekKeyFromDate(input.date),
      status: "planned",
      source: calendarBlockSource(input.subject),
      created_by_user_id: input.createdByUserId,
    })
    .select("id,title,description,planned_date,source")
    .single();

  if (response.error) {
    throw response.error;
  }

  const row = response.data as {
    id?: string | null;
    title?: string | null;
    description?: string | null;
    planned_date?: string | null;
    source?: string | null;
  };

  const payload = parseCalendarPayload(safe(row.description));
  return {
    id: safe(row.id),
    date: safe(row.planned_date),
    title: safe(row.title) || "Learning block",
    subject: parseCalendarBlockSubject(safe(row.source)),
    note: payload.note,
    time: payload.time,
  };
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

  if (existing.error) {
    throw existing.error;
  }

  const existingIds = (existing.data ?? [])
    .map((row) => safe((row as { id?: unknown }).id))
    .filter(Boolean);

  if (existingIds.length) {
    const deletion = await supabase
      .from("learning_plan_items")
      .delete()
      .in("id", existingIds);

    if (deletion.error) {
      throw deletion.error;
    }
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

  if (insertResponse.error) {
    throw insertResponse.error;
  }
}
