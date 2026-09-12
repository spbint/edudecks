import { supabase } from "@/lib/supabaseClient";
import { getCurrentCleanUserId, normalizeCleanErrorMessage } from "@/lib/clean/family/client";
import type { LearnerHelpRequest, LearnerHelpSourceType } from "@/lib/clean/learnerHelp/types";

const SELECT = "id,family_id,learner_id,source_type,source_id,requested_at,cleared_at,created_by_user_id,cleared_by_user_id,created_at,updated_at";

function text(value: unknown) { return String(value ?? "").trim(); }

function toRequest(row: Record<string, unknown>): LearnerHelpRequest {
  return {
    id: text(row.id), familyId: text(row.family_id), learnerId: text(row.learner_id),
    sourceType: text(row.source_type) as LearnerHelpSourceType, sourceId: text(row.source_id),
    requestedAt: text(row.requested_at), clearedAt: row.cleared_at ? text(row.cleared_at) : null,
    createdByUserId: text(row.created_by_user_id), clearedByUserId: row.cleared_by_user_id ? text(row.cleared_by_user_id) : null,
    createdAt: text(row.created_at), updatedAt: text(row.updated_at),
  };
}

export async function listActiveLearnerHelpRequests(familyId: string) {
  const response = await supabase.from("learner_help_requests").select(SELECT)
    .eq("family_id", familyId).is("cleared_at", null).order("requested_at", { ascending: false });
  if (response.error) throw new Error(normalizeCleanErrorMessage(response.error, "We could not load help requests just now."));
  return ((response.data ?? []) as Record<string, unknown>[]).map(toRequest);
}

async function findActiveRequest(familyId: string, learnerId: string, sourceType: LearnerHelpSourceType, sourceId: string) {
  const response = await supabase.from("learner_help_requests").select(SELECT)
    .eq("family_id", familyId).eq("learner_id", learnerId).eq("source_type", sourceType).eq("source_id", sourceId).is("cleared_at", null).maybeSingle();
  if (response.error) throw new Error(normalizeCleanErrorMessage(response.error, "We could not confirm this help request."));
  return response.data ? toRequest(response.data as Record<string, unknown>) : null;
}

export async function requestLearnerHelp(input: { familyId: string; learnerId: string; sourceType: LearnerHelpSourceType; sourceId: string }) {
  const userId = await getCurrentCleanUserId();
  if (!userId) throw new Error("You need to sign in before requesting help.");
  const response = await supabase.from("learner_help_requests").insert({
    family_id: input.familyId, learner_id: input.learnerId, source_type: input.sourceType,
    source_id: input.sourceId, created_by_user_id: userId,
  }).select(SELECT).maybeSingle();
  if (response.error) {
    if (response.error.code === "23505") return (await findActiveRequest(input.familyId, input.learnerId, input.sourceType, input.sourceId))!;
    throw new Error(normalizeCleanErrorMessage(response.error, "We could not request help just now."));
  }
  if (!response.data) throw new Error("We could not confirm the help request.");
  return toRequest(response.data as Record<string, unknown>);
}

export async function clearLearnerHelpRequest(familyId: string, requestId: string) {
  const userId = await getCurrentCleanUserId();
  if (!userId) throw new Error("You need to sign in before clearing help.");
  const response = await supabase.from("learner_help_requests").update({ cleared_at: new Date().toISOString(), cleared_by_user_id: userId })
    .eq("family_id", familyId).eq("id", requestId).is("cleared_at", null).select(SELECT).maybeSingle();
  if (response.error || !response.data) throw new Error(normalizeCleanErrorMessage(response.error, "We could not clear this help request."));
  return toRequest(response.data as Record<string, unknown>);
}
