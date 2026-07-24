import { NextResponse } from "next/server";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";
import { isRecommendationDebugEnabled, isRecommendationEngineEnabled, isShopifyCommerceEnabled } from "@/lib/intelligence/featureFlags";
import {
  createSupabaseApprovedPlanRevisionRepository,
  createSupabaseFamilyOwnedResourceRepository,
  createSupabaseRecommendationInteractionRepository,
} from "@/lib/intelligence/recommendations/repository";
import { createRecommendationService, RecommendationServiceError } from "@/lib/intelligence/recommendations/service";
import type { LearningPlanType } from "@/lib/intelligence/plans/types";
import type { RecommendationInteractionEventType } from "@/lib/intelligence/recommendations/types";
import { createShopifyStorefrontProvider } from "@/lib/intelligence/commerce/shopify";
import { createCommerceRecommendationService } from "@/lib/intelligence/commerce/service";
import { createSupabaseCommerceEventRepository, createSupabaseCommerceMappingRepository } from "@/lib/intelligence/commerce/repository";

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

async function commerceFor(result: Awaited<ReturnType<ReturnType<typeof createService>["getForUser"]>>, client: Parameters<typeof createSupabaseApprovedPlanRevisionRepository>[0]) {
  if (!isShopifyCommerceEnabled()) return { provider: "shopify" as const, status: "disabled" as const, products: [], exclusions: [], unmatchedResourceKeys: [], generatedAt: new Date().toISOString() };
  return createCommerceRecommendationService({ provider: createShopifyStorefrontProvider(), mappings: createSupabaseCommerceMappingRepository(client) }).getForRecommendationResult(result, String(process.env.SHOPIFY_REGION || "AU"));
}

async function recordDemandEvents(userId: string, snapshot: Awaited<ReturnType<ReturnType<typeof createSupabaseApprovedPlanRevisionRepository>["getApprovedRevisionForUser"]>>, result: Awaited<ReturnType<ReturnType<typeof createService>["getForUser"]>>, commerce: Awaited<ReturnType<typeof commerceFor>>, client: Parameters<typeof createSupabaseApprovedPlanRevisionRepository>[0]) {
  if (!snapshot || !isShopifyCommerceEnabled()) return;
  const events = createSupabaseCommerceEventRepository(client);
  const demand = result.recommendations.filter((item) => item.resourceClassification === "missing_essential" || item.resourceClassification === "optional_extension").slice(0, 25).map((item) => events.recordForUser(userId, { planId: snapshot.planId, revisionId: snapshot.revisionId, revisionNumber: snapshot.revisionNumber, eventType: "resource_requested", provider: "shopify", productId: null, resourceKey: item.resourceKey, metadata: { source: "approved_learning_plan" } }));
  const products = commerce.products.slice(0, 25).map((item) => events.recordForUser(userId, { planId: snapshot.planId, revisionId: snapshot.revisionId, revisionNumber: snapshot.revisionNumber, eventType: "product_recommended", provider: "shopify", productId: item.product.providerProductId, resourceKey: item.resourceKey, metadata: { required: item.required } }));
  const unmatched = commerce.unmatchedResourceKeys.slice(0, 25).map((resourceKey) => events.recordForUser(userId, { planId: snapshot.planId, revisionId: snapshot.revisionId, revisionNumber: snapshot.revisionNumber, eventType: "no_suitable_product_found", provider: "shopify", productId: null, resourceKey, metadata: {} }));
  await Promise.all([...demand, ...products, ...unmatched].map((event) => event.catch(() => undefined)));
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
    const commerce = await commerceFor(result, scoped.auth.client);
    await recordDemandEvents(scoped.auth.user.id, snapshot, result, commerce, scoped.auth.client);
    return NextResponse.json({ ...result, commerce, debug: includeDebug ? result.debug : undefined, ownedRevision: { planId: snapshot.planId, revisionId: snapshot.revisionId, revisionNumber: snapshot.revisionNumber } });
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
