import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import type { LessonPlan, LessonSequence, ResourceRequirement, UnitPlan } from "@/lib/intelligence/types";
import type {
  GeneratedPlanContent,
  LearningPlanDraft,
  LearningPlanRepository,
  LearningPlanType,
  PersistedPlanInput,
} from "@/lib/intelligence/plans/types";

export class LearningPlanRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LearningPlanRepositoryError";
  }
}

type PlanRow = {
  id?: unknown;
  user_id?: unknown;
  idea_id?: unknown;
  title?: unknown;
  summary?: unknown;
  learning_area?: unknown;
  year_level?: unknown;
  objectives?: unknown;
  duration_minutes?: unknown;
  duration_count?: unknown;
  duration_unit?: unknown;
  source_ids?: unknown;
  status?: unknown;
  current_version?: unknown;
  provenance?: unknown;
  content?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

const planSelect = "id,user_id,idea_id,title,summary,learning_area,year_level,objectives,duration_minutes,duration_count,duration_unit,source_ids,status,current_version,provenance,content,created_at,updated_at";

function stringValue(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function nullableString(value: unknown) {
  const result = stringValue(value).trim();
  return result || null;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean) : [];
}

function contentOf(row: PlanRow) {
  return objectValue(row.content) as unknown as GeneratedPlanContent;
}

function sequenceOf(row: PlanRow, planType: LearningPlanType): LessonSequence[] {
  const content = contentOf(row);
  const sequence = Array.isArray(content.sequence) ? content.sequence : [];
  return sequence.map((item, index) => ({
    id: `${stringValue(row.id)}-sequence-${index + 1}`,
    lessonPlanId: planType === "lesson" ? stringValue(row.id) : null,
    unitPlanId: planType === "unit" ? stringValue(row.id) : null,
    sequenceOrder: index + 1,
    title: stringValue(item?.title),
    objective: stringValue(item?.objective),
    activity: stringValue(item?.activity),
    durationMinutes: typeof item?.durationMinutes === "number" ? item.durationMinutes : null,
    notes: stringValue(item?.notes),
    content: item && typeof item === "object" ? item as unknown as Record<string, unknown> : {},
  }));
}

function resourcesOf(row: PlanRow, planType: LearningPlanType): ResourceRequirement[] {
  const content = contentOf(row);
  const resources = Array.isArray(content.resourceRequirements) ? content.resourceRequirements : [];
  return resources.map((item, index) => ({
    id: `${stringValue(row.id)}-resource-${index + 1}`,
    lessonPlanId: planType === "lesson" ? stringValue(row.id) : null,
    unitPlanId: planType === "unit" ? stringValue(row.id) : null,
    sequenceId: null,
    name: stringValue(item?.name),
    category: nullableString(item?.category),
    quantity: nullableString(item?.quantity),
    required: item?.required !== false,
    url: nullableString(item?.url),
    notes: stringValue(item?.notes),
  }));
}

function sourceIds(row: PlanRow) {
  return stringList(row.source_ids);
}

function toDraft(row: PlanRow, planType: LearningPlanType): LearningPlanDraft {
  const id = stringValue(row.id);
  const content = contentOf(row);
  const common = {
    id,
    userId: stringValue(row.user_id),
    ideaId: nullableString(row.idea_id),
    title: stringValue(row.title),
    summary: stringValue(row.summary),
    learningArea: nullableString(row.learning_area),
    yearLevel: nullableString(row.year_level),
    objectives: stringList(row.objectives),
    sourceIds: sourceIds(row),
    sequence: sequenceOf(row, planType),
    resources: resourcesOf(row, planType),
    status: row.status === "saved" || row.status === "archived" ? row.status : "draft",
    version: Number(row.current_version) || 1,
    provenance: objectValue(row.provenance) as never,
    content: content as unknown as Record<string, unknown>,
    createdAt: stringValue(row.created_at),
    updatedAt: stringValue(row.updated_at),
  };
  if (planType === "lesson") {
    return {
      ...common,
      durationMinutes: typeof row.duration_minutes === "number" ? row.duration_minutes : content.duration,
    } as LessonPlan;
  }
  return {
    ...common,
    durationCount: typeof row.duration_count === "number" ? row.duration_count : content.duration,
    durationUnit: row.duration_unit === "lessons" || row.duration_unit === "weeks" || row.duration_unit === "sessions"
      ? row.duration_unit
      : content.durationUnit === "lessons" || content.durationUnit === "weeks" || content.durationUnit === "sessions"
        ? content.durationUnit
        : null,
  } as UnitPlan;
}

function assertUser(userId: string) {
  if (!userId.trim()) throw new LearningPlanRepositoryError("A signed-in user is required.");
}

function tableFor(planType: LearningPlanType) {
  return planType === "lesson" ? "intelligence_lesson_plans" : "intelligence_unit_plans";
}

function basePlanValues(userId: string, input: PersistedPlanInput) {
  const content = input.content;
  return {
    user_id: userId,
    idea_id: input.ideaId,
    title: content.title,
    summary: content.overview,
    learning_area: content.subjects[0] ?? null,
    year_level: content.ageStage,
    objectives: content.learningIntentions,
    source_ids: [input.sourceId],
    status: "draft",
    current_version: input.revision,
    provenance: input.provenance,
    content,
    ...(input.planType === "lesson"
      ? { duration_minutes: content.duration }
      : { duration_count: content.duration, duration_unit: content.durationUnit === "minutes" ? null : content.durationUnit }),
  };
}

function versionValues(userId: string, planId: string, input: PersistedPlanInput) {
  const generation = input.content.generation;
  return {
    user_id: userId,
    lesson_plan_id: input.planType === "lesson" ? planId : null,
    unit_plan_id: input.planType === "unit" ? planId : null,
    version: input.revision,
    snapshot: input.content,
    source_provenance: input.provenance.sources,
    generation_model: `${generation.provider}:${generation.model}`,
    generation_model_version: generation.modelVersion,
    prompt_version: generation.promptVersion,
    schema_version: generation.schemaVersion,
    parent_edits: [],
    is_final_approved: false,
  };
}

function repositoryError(error: unknown, fallback: string) {
  const message = error && typeof error === "object" && "message" in error
    ? stringValue((error as { message?: unknown }).message)
    : "";
  return new LearningPlanRepositoryError(message || fallback);
}

export function createSupabaseLearningPlanRepository(
  client: Pick<SupabaseClient, "from"> = supabase,
): LearningPlanRepository {
  return {
    async getDraftForUser(userId, ideaId, sourceId, planType) {
      assertUser(userId);
      const response = await client
        .from(tableFor(planType))
        .select(planSelect)
        .eq("user_id", userId)
        .eq("idea_id", ideaId)
        .eq("status", "draft")
        .contains("source_ids", [sourceId])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (response.error) throw repositoryError(response.error, "We could not load the current plan draft.");
      return response.data ? toDraft(response.data as PlanRow, planType) : null;
    },

    async createDraftForUser(userId, input) {
      assertUser(userId);
      const table = tableFor(input.planType);
      const inserted = await client
        .from(table)
        .insert(basePlanValues(userId, input))
        .select(planSelect)
        .single();
      if (inserted.error || !inserted.data) throw repositoryError(inserted.error, "We could not save the generated plan draft.");

      const row = inserted.data as PlanRow;
      const planId = stringValue(row.id);
      const version = await client.from("intelligence_plan_versions").insert(versionValues(userId, planId, input));
      if (version.error) {
        await client.from(table).delete().eq("id", planId).eq("user_id", userId);
        throw repositoryError(version.error, "We could not save the generated plan revision.");
      }
      return toDraft(row, input.planType);
    },

    async createRevisionForUser(userId, currentDraft, input) {
      assertUser(userId);
      const table = tableFor(input.planType);
      const planId = currentDraft.id;
      const updated = await client
        .from(table)
        .update(basePlanValues(userId, input))
        .eq("id", planId)
        .eq("user_id", userId)
        .eq("current_version", input.revision - 1)
        .select(planSelect)
        .single();
      if (updated.error || !updated.data) {
        throw new LearningPlanRepositoryError("The current draft changed before regeneration completed. Please try again.");
      }
      const version = await client.from("intelligence_plan_versions").insert(versionValues(userId, planId, input));
      if (version.error) throw repositoryError(version.error, "We could not save the generated plan revision.");
      return toDraft(updated.data as PlanRow, input.planType);
    },
  };
}
