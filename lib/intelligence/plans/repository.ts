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

export type PlanRepositoryOperation =
  | "draft_lookup"
  | "lesson_insert"
  | "unit_insert"
  | "lesson_update"
  | "unit_update"
  | "version_insert"
  | "compensating_delete"
  | "review_lookup"
  | "review_update"
  | "approved_plan_lookup"
  | "approved_version_lookup"
  | "generation";

export type PlanRepositoryDiagnostic = {
  operation: PlanRepositoryOperation;
  planType: LearningPlanType | null;
  errorClass: string;
  code: string | null;
  message: string;
  details: string | null;
  hint: string | null;
  status: number | null;
};

function diagnosticText(value: unknown, maxLength = 1_000) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\b(?:authorization|bearer)\s*[:=]?\s*(?:bearer\s+)?[^\s,;]+/gi, "[REDACTED]")
    .replace(/\b(?:access[_-]?token|api[_-]?key|password|secret|credential)\s*[:=]\s*[^\s,;]+/gi, "[REDACTED]")
    .replace(/\b(?:https?|postgres(?:ql)?):\/\/[^\s]+/gi, "[REDACTED_URL]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[REDACTED_ID]")
    .slice(0, maxLength);
}

function errorRecord(error: unknown): Record<string, unknown> {
  return error && typeof error === "object" ? error as Record<string, unknown> : {};
}

function diagnosticStatus(error: Record<string, unknown>) {
  const value = error.status ?? error.statusCode;
  const status = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(status) ? status : null;
}

function diagnosticErrorClass(error: unknown) {
  const name = errorRecord(error).name;
  return diagnosticText(typeof name === "string" && name ? name : error instanceof Error ? error.name : "UnknownError", 120) || "UnknownError";
}

function isPlanRepositoryOperation(value: unknown): value is PlanRepositoryOperation {
  return typeof value === "string" && [
    "draft_lookup",
    "lesson_insert",
    "unit_insert",
    "lesson_update",
    "unit_update",
    "version_insert",
    "compensating_delete",
    "review_lookup",
    "review_update",
    "approved_plan_lookup",
    "approved_version_lookup",
    "generation",
  ].includes(value);
}

function isPlanType(value: unknown): value is LearningPlanType {
  return value === "lesson" || value === "unit";
}

export function getPlanRepositoryDiagnostic(
  error: unknown,
  defaults: { operation?: PlanRepositoryOperation; planType?: LearningPlanType | null } = {},
): PlanRepositoryDiagnostic {
  const record = errorRecord(error);
  const operation = isPlanRepositoryOperation(record.operation)
    ? record.operation
    : defaults.operation ?? "generation";
  const planType = isPlanType(record.planType)
    ? record.planType
    : defaults.planType ?? null;
  return {
    operation,
    planType,
    errorClass: diagnosticErrorClass(error),
    code: diagnosticText(record.code, 120) || null,
    message: diagnosticText(record.message) || "Unexpected plan repository failure.",
    details: diagnosticText(record.details) || null,
    hint: diagnosticText(record.hint) || null,
    status: diagnosticStatus(record),
  };
}

export class LearningPlanRepositoryError extends Error {
  readonly operation: PlanRepositoryOperation;
  readonly planType: LearningPlanType;
  readonly code: string | null;
  readonly details: string | null;
  readonly hint: string | null;
  readonly status: number | null;

  constructor(
    operation: PlanRepositoryOperation,
    planType: LearningPlanType,
    error: unknown,
    fallbackMessage: string,
  ) {
    const diagnostic = getPlanRepositoryDiagnostic(error, { operation, planType });
    super(diagnostic.message === "Unexpected plan repository failure."
      ? diagnosticText(fallbackMessage) || diagnostic.message
      : diagnostic.message);
    this.name = "LearningPlanRepositoryError";
    this.operation = operation;
    this.planType = planType;
    this.code = diagnostic.code;
    this.details = diagnostic.details;
    this.hint = diagnostic.hint;
    this.status = diagnostic.status;
    Object.defineProperty(this, "cause", { value: error, enumerable: false, configurable: true });
  }
}

type PlanRowBase = {
  id?: unknown;
  user_id?: unknown;
  idea_id?: unknown;
  title?: unknown;
  summary?: unknown;
  learning_area?: unknown;
  year_level?: unknown;
  objectives?: unknown;
  source_ids?: unknown;
  status?: unknown;
  current_version?: unknown;
  provenance?: unknown;
  content?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

export type LessonPlanRow = PlanRowBase & {
  duration_minutes?: unknown;
  duration_count?: never;
  duration_unit?: never;
};

export type UnitPlanRow = PlanRowBase & {
  duration_minutes?: never;
  duration_count?: unknown;
  duration_unit?: unknown;
};

export type PlanRow = LessonPlanRow | UnitPlanRow;

const planSelectCommon = "id,user_id,idea_id,title,summary,learning_area,year_level,objectives";
const planSelectTail = "source_ids,status,current_version,provenance,content,created_at,updated_at";

export function planSelect(planType: LearningPlanType) {
  return `${planSelectCommon},${planType === "lesson" ? "duration_minutes" : "duration_count,duration_unit"},${planSelectTail}`;
}

export function sourceIdsContainsValue(sourceId: string) {
  return JSON.stringify([sourceId]);
}

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

export function contentOf(row: PlanRow) {
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

export function toDraft(row: PlanRow, planType: LearningPlanType): LearningPlanDraft {
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

function assertUser(userId: string, planType: LearningPlanType) {
  if (!userId.trim()) throw new LearningPlanRepositoryError("draft_lookup", planType, null, "A signed-in user is required.");
}

export function tableFor(planType: LearningPlanType) {
  return planType === "lesson" ? "intelligence_lesson_plans" : "intelligence_unit_plans";
}

export function basePlanValues(userId: string, input: PersistedPlanInput) {
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

export function versionValues(userId: string, planId: string, input: PersistedPlanInput) {
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
    parent_edits: input.provenance.parentEdits,
    is_final_approved: false,
  };
}

function operationForInsert(planType: LearningPlanType): PlanRepositoryOperation {
  return planType === "lesson" ? "lesson_insert" : "unit_insert";
}

function operationForUpdate(planType: LearningPlanType): PlanRepositoryOperation {
  return planType === "lesson" ? "lesson_update" : "unit_update";
}

function repositoryError(
  operation: PlanRepositoryOperation,
  planType: LearningPlanType,
  error: unknown,
  fallback: string,
) {
  return new LearningPlanRepositoryError(operation, planType, error, fallback);
}

export function createSupabaseLearningPlanRepository(
  client: Pick<SupabaseClient, "from"> = supabase,
): LearningPlanRepository {
  return {
    async getDraftForUser(userId, ideaId, sourceId, planType) {
      assertUser(userId, planType);
      const response = await client
        .from(tableFor(planType))
        .select(planSelect(planType))
        .eq("user_id", userId)
        .eq("idea_id", ideaId)
        .eq("status", "draft")
        .contains("source_ids", sourceIdsContainsValue(sourceId))
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (response.error) throw repositoryError("draft_lookup", planType, response.error, "We could not load the current plan draft.");
      return response.data ? toDraft(response.data as PlanRow, planType) : null;
    },

    async createDraftForUser(userId, input) {
      assertUser(userId, input.planType);
      const table = tableFor(input.planType);
      const inserted = await client
        .from(table)
        .insert(basePlanValues(userId, input))
        .select(planSelect(input.planType))
        .single();
      if (inserted.error || !inserted.data) {
        throw repositoryError(operationForInsert(input.planType), input.planType, inserted.error, "We could not save the generated plan draft.");
      }

      const row = inserted.data as PlanRow;
      const planId = stringValue(row.id);
      const version = await client.from("intelligence_plan_versions").insert(versionValues(userId, planId, input));
      if (version.error) {
        const deleted = await client.from(table).delete().eq("id", planId).eq("user_id", userId);
        if (deleted.error) {
          const cleanupError = repositoryError("compensating_delete", input.planType, deleted.error, "The generated plan cleanup failed.");
          console.error("intelligence_plan_repository_cleanup_failed", getPlanRepositoryDiagnostic(cleanupError));
        }
        throw repositoryError("version_insert", input.planType, version.error, "We could not save the generated plan revision.");
      }
      return toDraft(row, input.planType);
    },

    async createRevisionForUser(userId, currentDraft, input) {
      assertUser(userId, input.planType);
      const table = tableFor(input.planType);
      const planId = currentDraft.id;
      const updated = await client
        .from(table)
        .update(basePlanValues(userId, input))
        .eq("id", planId)
        .eq("user_id", userId)
        .eq("current_version", input.revision - 1)
        .select(planSelect(input.planType))
        .single();
      if (updated.error || !updated.data) {
        throw repositoryError(operationForUpdate(input.planType), input.planType, updated.error, "The current draft changed before regeneration completed. Please try again.");
      }
      const version = await client.from("intelligence_plan_versions").insert(versionValues(userId, planId, input));
      if (version.error) throw repositoryError("version_insert", input.planType, version.error, "We could not save the generated plan revision.");
      return toDraft(updated.data as PlanRow, input.planType);
    },
  };
}
