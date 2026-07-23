import { NextResponse } from "next/server";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";
import { isRecommendationDebugEnabled, isRecommendationEngineEnabled } from "@/lib/intelligence/featureFlags";
import {
  createSupabaseApprovedPlanRevisionRepository,
  createSupabaseFamilyOwnedResourceRepository,
  createSupabaseRecommendationInteractionRepository,
} from "@/lib/intelligence/recommendations/repository";
import { createRecommendationService, RecommendationServiceError } from "@/lib/intelligence/recommendations/service";
import type { LearningPlanType } from "@/lib/intelligence/plans/types";
import type { RecommendationInteractionEventType } from "@/lib/intelligence/recommendations/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ ideaId: string; sourceId: string; planType: string }> };
const EVENT_TYPES = new Set<RecommendationInteractionEventType>(["impression", "owned_confirmation", "not_owned_confirmation", "save", "dismiss", "restore", "prepared", "completed"]);

function responseForError(error: unknown) {
  if (error instanceof RecommendationServiceError) {
    const status = error.code === "not_found" || error.code === "not_approved" ? 404 : error.code === "invalid_input" || error.code === "malformed_plan" ? 422 : 500;
    return NextResponse.json({ code: error.code, error: error.message, issues: error.issues }, { status });
  }
  return NextResponse.json({ code: "persistence", error: "Recommendations are temporarily unavailable." }, { status: 500 });
}

function debugAllowed(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  if (!isRecommendationDebugEnabled()) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return user.app_metadata?.role === "admin" || user.user_metadata?.role === "admin";
}

async function contextFor(planTypeValue: string) {
  if (!isRecommendationEngineEnabled()) return { response: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  if (!isLearningPlanType(planTypeValue)) return { response: NextResponse.json({ code: "invalid_input", error: "Choose either a lesson or unit plan." }, { status: 400 }) };
  const auth = await getIntelligenceServerContext();
  if (!auth) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  return { auth, planType: planTypeValue as LearningPlanType };
}

function exactPlanFrom(request: Request) {
  const planId = new URL(request.url).searchParams.get("planId")?.trim() ?? "";
  const value = Number(new URL(request.url).searchParams.get("revision"));
  return planId && Number.isInteger(value) && value > 0 ? { planId, revisionNumber: value } : null;
}

function createService(client: Parameters<typeof createSupabaseApprovedPlanRevisionRepository>[0]) {
  return createRecommendationService({
    approvedPlanRepository: createSupabaseApprovedPlanRevisionRepository(client),
    ownedResourceRepository: createSupabaseFamilyOwnedResourceRepository(client),
    interactionRepository: createSupabaseRecommendationInteractionRepository(client),
  });
}

export async function GET(request: Request, context: RouteContext) {
  const { ideaId, sourceId, planType: planTypeValue } = await context.params;
  const scoped = await contextFor(planTypeValue);
  if ("response" in scoped) return scoped.response;
  const exactPlan = exactPlanFrom(request);
  if (!exactPlan) return NextResponse.json({ code: "invalid_input", error: "An exact approved plan revision is required." }, { status: 400 });
  try {
    const repository = createSupabaseApprovedPlanRevisionRepository(scoped.auth.client);
    const snapshot = await repository.getApprovedRevisionForUser(scoped.auth.user.id, ideaId, sourceId, scoped.planType, exactPlan.planId, exactPlan.revisionNumber);
    if (!snapshot) return NextResponse.json({ code: "not_approved", error: "That exact approved revision is not available." }, { status: 404 });
    const service = createService(scoped.auth.client);
    const result = await service.getForUser(scoped.auth.user.id, snapshot, new URL(request.url).searchParams.get("includeDismissed") === "1");
    const includeDebug = new URL(request.url).searchParams.get("debug") === "1" && debugAllowed(scoped.auth.user);
    return NextResponse.json({ ...result, debug: includeDebug ? result.debug : undefined, ownedRevision: { planId: snapshot.planId, revisionId: snapshot.revisionId, revisionNumber: snapshot.revisionNumber } });
  } catch (error) {
    return responseForError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { ideaId, sourceId, planType: planTypeValue } = await context.params;
  const scoped = await contextFor(planTypeValue);
  if ("response" in scoped) return scoped.response;
  const exactPlan = exactPlanFrom(request);
  if (!exactPlan) return NextResponse.json({ code: "invalid_input", error: "An exact approved plan revision is required." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ code: "invalid_input", error: "An interaction event is required." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ code: "invalid_input", error: "An interaction event is required." }, { status: 400 });
  const event = body as Record<string, unknown>;
  const eventType = event.eventType;
  const recommendationId = typeof event.recommendationId === "string" ? event.recommendationId : "";
  if (!recommendationId || typeof eventType !== "string" || !EVENT_TYPES.has(eventType as RecommendationInteractionEventType)) return NextResponse.json({ code: "invalid_input", error: "A valid recommendation event is required." }, { status: 400 });
  try {
    const repository = createSupabaseApprovedPlanRevisionRepository(scoped.auth.client);
    const snapshot = await repository.getApprovedRevisionForUser(scoped.auth.user.id, ideaId, sourceId, scoped.planType, exactPlan.planId, exactPlan.revisionNumber);
    if (!snapshot) return NextResponse.json({ code: "not_approved", error: "That exact approved revision is not available." }, { status: 404 });
    const service = createService(scoped.auth.client);
    const saved = await service.recordEventForUser(scoped.auth.user.id, snapshot, {
      recommendationId,
      eventType: eventType as RecommendationInteractionEventType,
      metadata: { resourceKey: typeof event.resourceKey === "string" ? event.resourceKey : null },
    });
    return NextResponse.json({ state: "recorded", event: saved });
  } catch (error) {
    return responseForError(error);
  }
}
