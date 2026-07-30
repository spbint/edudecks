import type { SupabaseClient } from "@supabase/supabase-js";
import { getLearningPlanForUser, toPlanLibraryEntry } from "@/lib/intelligence/plans/library";
import {
  planSelect,
  tableFor,
  toDraft,
  type PlanRow,
} from "@/lib/intelligence/plans/repository";
import type { LearningPlanType, PlanWorkflowStatus } from "@/lib/intelligence/plans/types";
import type { PlanLibraryEntry } from "@/lib/intelligence/plans/library";

export type PlanMutationAction = "ready" | "archive" | "restore" | "duplicate";

export class PlanMutationError extends Error {
  readonly code: "not_found" | "invalid_input" | "persistence_failure";
  constructor(code: PlanMutationError["code"], message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PlanMutationError";
    this.code = code;
  }
}

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function reviewFor(entry: PlanLibraryEntry) {
  const review = entry.content.review ?? {
    workflowStatus: "generated_draft" as const,
    originalGeneratedRevision: entry.plan.version,
    revisionKind: "generated" as const,
    changedFields: [],
    lastEditedAt: null,
    lastEditedByUserId: null,
    safetyAcknowledged: false,
    validation: entry.content.validation,
  };
  return { ...review };
}

function withWorkflow(entry: PlanLibraryEntry, workflowStatus: PlanWorkflowStatus, previous?: "draft" | "saved") {
  const review = reviewFor(entry);
  return {
    ...entry.content,
    review: {
      ...review,
      workflowStatus,
      ...(previous ? { readyToUsePreviousStatus: previous } : {}),
      lastEditedAt: new Date().toISOString(),
    },
  };
}

export function planStatusTransition(entry: PlanLibraryEntry, action: Exclude<PlanMutationAction, "duplicate">) {
  const previousStatus = entry.plan.status === "saved" ? "saved" : "draft";
  const workflowStatus: PlanWorkflowStatus = action === "ready"
    ? "ready_to_use"
    : action === "archive"
      ? "archived"
      : entry.content.review?.readyToUsePreviousStatus === "saved" ? "ready_to_use" : "returned_to_draft";
  const status = action === "ready"
    ? "saved"
    : action === "archive"
      ? "archived"
      : entry.content.review?.readyToUsePreviousStatus === "saved" ? "saved" : "draft";
  return { status, content: withWorkflow(entry, workflowStatus, action === "ready" ? previousStatus : undefined), version: entry.plan.version };
}

export async function mutateLearningPlanForUser(
  client: Pick<SupabaseClient, "from">,
  userId: string,
  planType: LearningPlanType,
  planId: string,
  action: PlanMutationAction,
  options: { title?: string | null } = {},
): Promise<PlanLibraryEntry> {
  const current = await getLearningPlanForUser(userId, planType, planId, client);
  if (!current) throw new PlanMutationError("not_found", "That plan is no longer available.");

  if (action === "duplicate") {
    const title = safe(options.title) || `${current.content.title || current.plan.title} Copy`;
    const content = { ...current.content, title, review: { ...reviewFor(current), workflowStatus: "generated_draft" as const, safetyAcknowledged: false } };
    const provenance = {
      ...current.plan.provenance,
      duplicateOf: { planId: current.plan.id, planType, version: current.plan.version },
    };
    const table = tableFor(planType);
    const inserted = await client.from(table).insert({
      user_id: userId,
      idea_id: current.plan.ideaId,
      title,
      summary: content.overview,
      learning_area: content.subjects[0] ?? null,
      year_level: content.ageStage,
      objectives: content.learningIntentions,
      source_ids: current.plan.sourceIds,
      status: "draft",
      current_version: 1,
      final_approved_version: null,
      provenance,
      content,
      ...(planType === "lesson"
        ? { duration_minutes: content.duration }
        : { duration_count: content.duration, duration_unit: content.durationUnit === "minutes" ? null : content.durationUnit }),
    }).select(planSelect(planType)).single();
    if (inserted.error || !inserted.data) throw new PlanMutationError("persistence_failure", "We could not duplicate this plan.", { cause: inserted.error });
    const newRow = inserted.data as PlanRow;
    const version = await client.from("intelligence_plan_versions").insert({
      user_id: userId,
      lesson_plan_id: planType === "lesson" ? newRow.id : null,
      unit_plan_id: planType === "unit" ? newRow.id : null,
      version: 1,
      snapshot: content,
      source_provenance: provenance.sources,
      generation_model: "duplicate:library",
      generation_model_version: "1",
      prompt_version: "duplicate",
      schema_version: content.generation.schemaVersion,
      parent_edits: provenance.parentEdits,
      is_final_approved: false,
    });
    if (version.error) {
      const cleanup = await client.from(table).delete().eq("id", newRow.id).eq("user_id", userId);
      if (cleanup.error) console.error("idea_to_learning_duplicate_cleanup_failed", { operation: "compensating_delete", planType });
      throw new PlanMutationError("persistence_failure", "We could not finish duplicating this plan.", { cause: version.error });
    }
    return toPlanLibraryEntry(toDraft(newRow, planType), planType);
  }

  const transition = planStatusTransition(current, action);
  const { status, content } = transition;
  const updated = await client.from(tableFor(planType)).update({ status, content }).eq("id", planId).eq("user_id", userId).select(planSelect(planType)).maybeSingle();
  if (updated.error || !updated.data) throw new PlanMutationError("persistence_failure", "We could not update this plan.", { cause: updated.error });
  return toPlanLibraryEntry(toDraft(updated.data as PlanRow, planType), planType);
}
