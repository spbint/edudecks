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
