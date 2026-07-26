import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { contentOf, planSelect, tableFor, toDraft, type PlanRow } from "@/lib/intelligence/plans/repository";
import type {
  ApprovedPlanRevisionRepository,
  FamilyOwnedResource,
  FamilyOwnedResourceRepository,
  RecommendationInteractionEvent,
  RecommendationInteractionRepository,
  RecommendationInteractionEventType,
} from "@/lib/intelligence/recommendations/types";
import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";

export class RecommendationRepositoryError extends Error {
  readonly code: "persistence" | "not_found" | "stale";

  constructor(code: RecommendationRepositoryError["code"], message: string) {
    super(message);
    this.name = "RecommendationRepositoryError";
    this.code = code;
  }
}

type QueryClient = Pick<SupabaseClient, "from">;

function text(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function errorMessage(error: unknown, fallback: string) {
  const message = error && typeof error === "object" && "message" in error ? text((error as { message?: unknown }).message) : "";
  return new RecommendationRepositoryError("persistence", message || fallback);
}

function assertUser(userId: string) {
  if (!userId.trim()) throw new RecommendationRepositoryError("persistence", "A signed-in user is required.");
}

export function createSupabaseApprovedPlanRevisionRepository(client: QueryClient = supabase): ApprovedPlanRevisionRepository {
  return {
    async getApprovedRevisionForUser(userId, ideaId, sourceId, planType, planId, revisionNumber) {
      assertUser(userId);
      if (!Number.isInteger(revisionNumber) || revisionNumber < 1) throw new RecommendationRepositoryError("not_found", "An exact approved revision is required.");
      const planResponse = await client
        .from(tableFor(planType))
        .select(planSelect(planType))
        .eq("user_id", userId)
        .eq("id", planId)
        .eq("idea_id", ideaId)
        .eq("status", "saved")
        .contains("source_ids", [sourceId])
        .limit(20);
      if (planResponse.error) throw errorMessage(planResponse.error, "We could not load the approved plan.");
      const rows = (planResponse.data ?? []) as PlanRow[];
      const row = rows.find((candidate) => text(candidate.status) === "saved") ?? null;
      if (!row || !row.id) return null;
      const foundPlanId = text(row.id);
      const versionResponse = await client
        .from("intelligence_plan_versions")
        .select("id,version,snapshot,approved_at,approved_by_user_id,is_final_approved")
        .eq("user_id", userId)
        .eq(planType === "lesson" ? "lesson_plan_id" : "unit_plan_id", foundPlanId)
        .eq("version", revisionNumber)
        .eq("is_final_approved", true)
        .maybeSingle();
      if (versionResponse.error) throw errorMessage(versionResponse.error, "We could not load the approved plan revision.");
      if (!versionResponse.data || !versionResponse.data.approved_at) return null;
      const snapshot = record(versionResponse.data.snapshot);
      const content = contentOf({ content: snapshot } as PlanRow);
      if (content.review?.workflowStatus !== "approved") return null;
      const plan = toDraft(row, planType);
      return {
        userId,
        ideaId,
        sourceId,
        planId: foundPlanId,
        planType,
        revisionId: text(versionResponse.data.id),
        revisionNumber,
        status: "saved",
        content: snapshot,
        provenance: plan.provenance,
        approvedAt: text(versionResponse.data.approved_at),
      };
    },
  };
}

function toOwned(row: Record<string, unknown>): FamilyOwnedResource {
  return {
    id: text(row.id),
    userId: text(row.user_id),
    name: text(row.name),
    normalizedResourceKey: text(row.normalized_resource_key),
    category: text(row.category) || null,
    quantity: text(row.quantity) || null,
    condition: text(row.condition) || null,
    active: row.active !== false,
    source: text(row.source) || "parent",
    provenance: record(row.provenance),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

export function createSupabaseFamilyOwnedResourceRepository(client: QueryClient = supabase): FamilyOwnedResourceRepository {
  return {
    async listForUser(userId) {
      assertUser(userId);
      const response = await client.from("intelligence_family_owned_resources").select("id,user_id,name,normalized_resource_key,category,quantity,condition,active,source,provenance,created_at,updated_at").eq("user_id", userId).order("updated_at", { ascending: false });
      if (response.error) throw errorMessage(response.error, "We could not load your owned resources.");
      return ((response.data ?? []) as Record<string, unknown>[]).map(toOwned);
    },
    async createForUser(userId, input) {
      assertUser(userId);
      const response = await client.from("intelligence_family_owned_resources").insert({
        user_id: userId,
        name: input.name,
        normalized_resource_key: input.normalizedResourceKey || normaliseResourceKey(input.name),
        category: input.category,
        quantity: input.quantity,
        condition: input.condition,
        active: input.active,
        source: input.source,
        provenance: input.provenance,
      }).select("id,user_id,name,normalized_resource_key,category,quantity,condition,active,source,provenance,created_at,updated_at").single();
      if (response.error || !response.data) throw errorMessage(response.error, "We could not save this owned resource.");
      return toOwned(response.data as Record<string, unknown>);
    },
  };
}

function toEvent(row: Record<string, unknown>): RecommendationInteractionEvent {
  return {
    id: text(row.id),
    userId: text(row.user_id),
    planId: text(row.plan_id),
    revisionId: text(row.revision_id),
    revisionNumber: Number(row.revision_number) || 0,
    recommendationId: text(row.recommendation_id),
    eventType: text(row.event_type) as RecommendationInteractionEventType,
    metadata: record(row.metadata),
    engineVersion: text(row.engine_version),
    rulesVersion: text(row.rules_version),
    createdAt: text(row.created_at),
  };
}

export function createSupabaseRecommendationInteractionRepository(client: QueryClient = supabase): RecommendationInteractionRepository {
  return {
    async listForRevision(userId, planId, revisionId) {
      assertUser(userId);
      const response = await client.from("intelligence_recommendation_interaction_events").select("id,user_id,plan_id,revision_id,revision_number,recommendation_id,event_type,metadata,engine_version,rules_version,created_at").eq("user_id", userId).eq("plan_id", planId).eq("revision_id", revisionId).order("created_at", { ascending: true });
      if (response.error) throw errorMessage(response.error, "We could not load recommendation activity.");
      return ((response.data ?? []) as Record<string, unknown>[]).map(toEvent);
    },
    async recordForUser(userId, event) {
      assertUser(userId);
      const response = await client.from("intelligence_recommendation_interaction_events").insert({
        user_id: userId,
        plan_id: event.planId,
        revision_id: event.revisionId,
        revision_number: event.revisionNumber,
        recommendation_id: event.recommendationId,
        event_type: event.eventType,
        metadata: event.metadata,
        engine_version: event.engineVersion,
        rules_version: event.rulesVersion,
      }).select("id,user_id,plan_id,revision_id,revision_number,recommendation_id,event_type,metadata,engine_version,rules_version,created_at").single();
      if (response.error || !response.data) throw errorMessage(response.error, "We could not save that recommendation action.");
      return toEvent(response.data as Record<string, unknown>);
    },
  };
}
