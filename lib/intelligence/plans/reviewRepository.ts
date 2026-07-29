import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanProvenance } from "@/lib/intelligence/types";
import { supabase } from "@/lib/supabaseClient";
import {
  basePlanValues,
  contentOf,
  planSelect,
  sourceIdsContainsValue,
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

function compensationDiagnostic(error: unknown) {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const message = typeof value.message === "string" ? value.message.replace(/[\r\n\t]+/g, " ").replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, "[REDACTED_ID]").slice(0, 500) : "Compensation failed.";
  return { errorClass: typeof value.name === "string" ? value.name : "DatabaseError", code: typeof value.code === "string" ? value.code : null, message };
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

function versionOwnerColumn(planType: LearningPlanType) {
  return planType === "lesson" ? "lesson_plan_id" : "unit_plan_id";
}

function approvalValues(approved: boolean, userId: string) {
  return {
    is_final_approved: approved,
    approved_at: approved ? new Date().toISOString() : null,
    approved_by_user_id: approved ? userId : null,
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
        .select(planSelect(planType))
        .eq("user_id", userId)
        .eq("idea_id", ideaId)
        .contains("source_ids", sourceIdsContainsValue(sourceId))
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
        .select(planSelect(content.planType))
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
      const values = {
        ...basePlanValues(userId, input),
        status: workflowStatus === "approved" ? "saved" : workflowStatus === "archived" ? "archived" : "draft",
        final_approved_version: workflowStatus === "approved" ? expectedRevision : null,
      };

      const ownerColumn = versionOwnerColumn(content.planType);
      const previousPlan = await client
        .from(table)
        .select("final_approved_version")
        .eq("id", current.plan.id)
        .eq("user_id", userId)
        .eq("current_version", expectedRevision)
        .maybeSingle();
      if (previousPlan.error) throw errorMessage(previousPlan.error, "We could not read the current plan approval state.");
      if (!previousPlan.data) throw new PlanReviewRepositoryError("stale_revision", "This plan changed elsewhere. Reload before updating its status.");

      const previousApprovals = await client
        .from("intelligence_plan_versions")
        .select("version,approved_at,approved_by_user_id")
        .eq("user_id", userId)
        .eq(ownerColumn, current.plan.id)
        .eq("is_final_approved", true);
      if (previousApprovals.error) throw errorMessage(previousApprovals.error, "We could not read the current plan approval state.");

      const previousApprovedVersions = (previousApprovals.data ?? []) as Array<Record<string, unknown>>;
      const restoreApprovalState = async () => {
        const clearCurrent = await client
          .from("intelligence_plan_versions")
          .update(approvalValues(false, userId))
          .eq("user_id", userId)
          .eq(ownerColumn, current.plan.id)
          .eq("version", expectedRevision);
        if (clearCurrent.error) return clearCurrent.error;
        for (const previous of previousApprovedVersions) {
          const restored = await client
            .from("intelligence_plan_versions")
            .update({
              is_final_approved: true,
              approved_at: previous.approved_at ?? null,
              approved_by_user_id: previous.approved_by_user_id ?? null,
            })
            .eq("user_id", userId)
            .eq(ownerColumn, current.plan.id)
            .eq("version", previous.version);
          if (restored.error) return restored.error;
        }
        return null;
      };

      const restoreParentApprovalPointer = async () => {
        const restored = await client
          .from(table)
          .update({ final_approved_version: previousPlan.data?.final_approved_version ?? null })
          .eq("id", current.plan.id)
          .eq("user_id", userId)
          .eq("current_version", expectedRevision);
        return restored.error ?? null;
      };

      const cleared = await client
        .from("intelligence_plan_versions")
        .update(approvalValues(false, userId))
        .eq("user_id", userId)
        .eq(ownerColumn, current.plan.id)
        .eq("is_final_approved", true);
      if (cleared.error) throw errorMessage(cleared.error, "We could not update the plan approval state.");

      if (workflowStatus === "approved") {
        const activated = await client
          .from("intelligence_plan_versions")
          .update(approvalValues(true, userId))
          .eq("user_id", userId)
          .eq(ownerColumn, current.plan.id)
          .eq("version", expectedRevision)
          .select("version")
          .single();
        if (activated.error || !activated.data) {
          const restored = await restoreApprovalState();
          if (restored) console.error("intelligence_plan_review_compensation_failed", { operation: "compensating_update", planType: content.planType, ...compensationDiagnostic(restored) });
          throw errorMessage(activated.error, "We could not update the plan approval state.");
        }
      }

      const updated = await client
        .from(table)
        .update(values)
        .eq("id", current.plan.id)
        .eq("user_id", userId)
        .eq("current_version", expectedRevision)
        .select(planSelect(content.planType))
        .single();
      if (updated.error || !updated.data) {
        const restored = await restoreApprovalState();
        if (restored) console.error("intelligence_plan_review_compensation_failed", { operation: "compensating_update", planType: content.planType, ...compensationDiagnostic(restored) });
        const parentRestored = await restoreParentApprovalPointer();
        if (parentRestored) console.error("intelligence_plan_review_compensation_failed", { operation: "compensating_update", planType: content.planType, ...compensationDiagnostic(parentRestored) });
        if (updated.error) throw errorMessage(updated.error, "This plan changed elsewhere. Reload before updating its status.");
        throw new PlanReviewRepositoryError("stale_revision", "This plan changed elsewhere. Reload before updating its status.");
      }
      return envelope(updated.data as PlanRow, content.planType);
    },
  };
}
