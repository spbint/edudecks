import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanProvenance } from "@/lib/intelligence/types";
import { supabase } from "@/lib/supabaseClient";
import {
  basePlanValues,
  contentOf,
  planSelect,
  tableFor,
  toDraft,
  versionValues,
  type PlanRow,
} from "@/lib/intelligence/plans/repository";
import type { GeneratedPlanContent, LearningPlanType, PlanReviewMetadata } from "@/lib/intelligence/plans/types";
import type { LearningPlanReviewRepository, PlanReviewEnvelope } from "@/lib/intelligence/plans/reviewTypes";

export type PlanReviewRepositoryErrorCode = "stale_revision" | "persistence";

export class PlanReviewRepositoryError extends Error {
  readonly code: PlanReviewRepositoryErrorCode;

  constructor(code: PlanReviewRepositoryErrorCode, message: string) {
    super(message);
    this.name = "PlanReviewRepositoryError";
    this.code = code;
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function reviewOf(content: GeneratedPlanContent): PlanReviewMetadata {
  const review = content.review;
  return review ?? {
    workflowStatus: "generated_draft",
    originalGeneratedRevision: content.generation.revision,
    revisionKind: "generated",
    changedFields: [],
    lastEditedAt: null,
    lastEditedByUserId: null,
    safetyAcknowledged: false,
    validation: content.validation,
  };
}

function envelope(row: PlanRow, planType: LearningPlanType): PlanReviewEnvelope {
  const plan = toDraft(row, planType);
  const content = contentOf(row);
  const review = reviewOf(content);
  return {
    plan,
    workflowStatus: review.workflowStatus,
    currentRevision: plan.version,
    originalGeneratedRevision: review.originalGeneratedRevision,
    review,
    provenance: objectValue(row.provenance) as unknown as PlanProvenance,
  };
}

function assertUser(userId: string) {
  if (!userId.trim()) throw new PlanReviewRepositoryError("persistence", "A signed-in user is required.");
}

function errorMessage(error: unknown, fallback: string) {
  const message = error && typeof error === "object" && "message" in error
    ? stringValue((error as { message?: unknown }).message)
    : "";
  return new PlanReviewRepositoryError("persistence", message || fallback);
}

function reviewInput(
  userId: string,
  current: PlanReviewEnvelope,
  sourceId: string,
  content: GeneratedPlanContent,
  provenance: PlanProvenance,
  revision: number,
) {
  return {
    planType: content.planType,
    ideaId: current.plan.ideaId ?? "",
    sourceId,
    revision,
    content,
    provenance,
    userId,
  };
}

export function createSupabaseLearningPlanReviewRepository(
  client: Pick<SupabaseClient, "from"> = supabase,
): LearningPlanReviewRepository {
  return {
    async getReviewPlanForUser(userId, ideaId, sourceId, planType) {
      assertUser(userId);
      const response = await client
        .from(tableFor(planType))
        .select(planSelect)
        .eq("user_id", userId)
        .eq("idea_id", ideaId)
        .contains("source_ids", [sourceId])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (response.error) throw errorMessage(response.error, "We could not load this plan review.");
      return response.data ? envelope(response.data as PlanRow, planType) : null;
    },

    async saveParentEditForUser(userId, current, content, provenance, expectedRevision) {
      assertUser(userId);
      if (current.currentRevision !== expectedRevision) {
        throw new PlanReviewRepositoryError("stale_revision", "This plan changed elsewhere. Reload before saving your edits.");
      }
      const input = reviewInput(userId, current, current.plan.sourceIds[0] ?? "", content, provenance, expectedRevision + 1);
      const table = tableFor(content.planType);
      const updated = await client
        .from(table)
        .update(basePlanValues(userId, input))
        .eq("id", current.plan.id)
        .eq("user_id", userId)
        .eq("current_version", expectedRevision)
        .select(planSelect)
        .single();
      if (updated.error || !updated.data) {
        throw new PlanReviewRepositoryError("stale_revision", "This plan changed elsewhere. Reload before saving your edits.");
      }
      const version = await client.from("intelligence_plan_versions").insert(versionValues(userId, current.plan.id, input));
      if (version.error) throw errorMessage(version.error, "We could not save this plan revision.");
      return envelope(updated.data as PlanRow, content.planType);
    },

    async updateReviewStateForUser(userId, current, workflowStatus, content, provenance, expectedRevision) {
      assertUser(userId);
      if (current.currentRevision !== expectedRevision) {
        throw new PlanReviewRepositoryError("stale_revision", "This plan changed elsewhere. Reload before updating its status.");
      }
      const input = reviewInput(userId, current, current.plan.sourceIds[0] ?? "", content, provenance, expectedRevision);
      const table = tableFor(content.planType);
      const values = basePlanValues(userId, input);
      values.status = workflowStatus === "approved" ? "saved" : workflowStatus === "archived" ? "archived" : "draft";
      const updated = await client
        .from(table)
        .update(values)
        .eq("id", current.plan.id)
        .eq("user_id", userId)
        .eq("current_version", expectedRevision)
        .select(planSelect)
        .single();
      if (updated.error || !updated.data) {
        throw new PlanReviewRepositoryError("stale_revision", "This plan changed elsewhere. Reload before updating its status.");
      }

      const versionQuery = client
        .from("intelligence_plan_versions")
        .update({
          is_final_approved: workflowStatus === "approved",
          approved_at: workflowStatus === "approved" ? new Date().toISOString() : null,
          approved_by_user_id: workflowStatus === "approved" ? userId : null,
        })
        .eq("user_id", userId)
        .eq("version", expectedRevision);
      const versionResponse = content.planType === "lesson"
        ? await versionQuery.eq("lesson_plan_id", current.plan.id)
        : await versionQuery.eq("unit_plan_id", current.plan.id);
      if (versionResponse.error) throw errorMessage(versionResponse.error, "We could not update the plan approval state.");
      return envelope(updated.data as PlanRow, content.planType);
    },
  };
}
