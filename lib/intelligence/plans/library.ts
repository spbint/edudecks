import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  planSelect,
  tableFor,
  toDraft,
  type PlanRow,
} from "@/lib/intelligence/plans/repository";
import type {
  GeneratedPlanContent,
  LearningPlanDraft,
  LearningPlanType,
  PlanWorkflowStatus,
} from "@/lib/intelligence/plans/types";

export type PlanLibraryEntry = {
  planType: LearningPlanType;
  plan: LearningPlanDraft;
  content: GeneratedPlanContent;
  workflowStatus: PlanWorkflowStatus | null;
  displayStatus: "Draft" | "Ready to use" | "Archived";
  readyToUse: boolean;
  sourceUrl: string | null;
  sourceTitle: string | null;
  sourceProvider: string | null;
  reviewHref: string | null;
  detailHref: string;
  sourceIdeaId: string | null;
  sourceId: string | null;
  duration: number | null;
  durationUnit: string | null;
};

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function planContent(plan: LearningPlanDraft) {
  return plan.content as unknown as GeneratedPlanContent;
}

export function planReviewHref(
  plan: Pick<LearningPlanDraft, "ideaId" | "sourceIds">,
  planType: LearningPlanType,
) {
  const ideaId = safe(plan.ideaId);
  const sourceId = safe(plan.sourceIds[0]);
  if (!ideaId || !sourceId) return null;
  return `/my-ideas/${encodeURIComponent(ideaId)}/sources/${encodeURIComponent(sourceId)}/plans/${planType}/review`;
}

function toLibraryEntry(plan: LearningPlanDraft, planType: LearningPlanType): PlanLibraryEntry {
  const content = planContent(plan);
  const workflowStatus = content.review?.workflowStatus ?? null;
  const archived = plan.status === "archived" || workflowStatus === "archived";
  const readyToUse = !archived && (
    plan.status === "saved" ||
    workflowStatus === "ready_to_use" ||
    workflowStatus === "ready_for_approval" ||
    workflowStatus === "approved"
  );

  return {
    planType,
    plan,
    content,
    workflowStatus,
    displayStatus: archived ? "Archived" : readyToUse ? "Ready to use" : "Draft",
    readyToUse,
    sourceUrl:
      safe(content.sourceAttribution.canonicalUrl) ||
      safe(content.sourceAttribution.finalUrl) ||
      safe(content.sourceAttribution.originalUrl) ||
      null,
    sourceTitle: safe(content.sourceAttribution.title) || null,
    sourceProvider: safe(content.sourceAttribution.provider) || null,
    reviewHref: planReviewHref(plan, planType),
    detailHref: `/my-plans/${planType}/${encodeURIComponent(plan.id)}`,
    sourceIdeaId: safe(plan.ideaId) || null,
    sourceId: safe(plan.sourceIds[0]) || null,
    duration: planType === "lesson"
      ? (typeof (plan as { durationMinutes?: unknown }).durationMinutes === "number" ? (plan as { durationMinutes: number }).durationMinutes : content.duration)
      : (typeof (plan as { durationCount?: unknown }).durationCount === "number" ? (plan as { durationCount: number }).durationCount : content.duration),
    durationUnit: planType === "lesson" ? "minutes" : content.durationUnit,
  };
}

export function toPlanLibraryEntry(plan: LearningPlanDraft, planType: LearningPlanType) {
  return toLibraryEntry(plan, planType);
}

async function listTypeForUser(
  userId: string,
  planType: LearningPlanType,
  client: Pick<SupabaseClient, "from">,
) {
  const response = await client
    .from(tableFor(planType))
    .select(planSelect(planType))
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (response.error) {
    const error = response.error as { message?: string } | null;
    throw new Error(error?.message || `We could not load your ${planType} plans just now.`);
  }

  return (response.data ?? []).map((row) =>
    toLibraryEntry(toDraft(row as PlanRow, planType), planType),
  );
}

export async function getLearningPlanForUser(
  userId: string,
  planType: LearningPlanType,
  planId: string,
  client: Pick<SupabaseClient, "from"> = supabase,
) {
  const cleanUserId = safe(userId);
  const cleanPlanId = safe(planId);
  if (!cleanUserId || !cleanPlanId) return null;
  const response = await client
    .from(tableFor(planType))
    .select(planSelect(planType))
    .eq("user_id", cleanUserId)
    .eq("id", cleanPlanId)
    .maybeSingle();
  if (response.error) throw new Error(response.error.message || "We could not load this plan.");
  return response.data ? toLibraryEntry(toDraft(response.data as PlanRow, planType), planType) : null;
}

export async function listLearningPlansForUser(
  userId: string,
  client: Pick<SupabaseClient, "from"> = supabase,
) {
  const cleanUserId = safe(userId);
  if (!cleanUserId) return [];

  const [lessons, units] = await Promise.all([
    listTypeForUser(cleanUserId, "lesson", client),
    listTypeForUser(cleanUserId, "unit", client),
  ]);

  return [...lessons, ...units].sort((left, right) =>
    safe(right.plan.updatedAt).localeCompare(safe(left.plan.updatedAt)),
  );
}
