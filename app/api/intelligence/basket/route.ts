import { NextResponse } from "next/server";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";
import { isLearningBasketEnabled } from "@/lib/intelligence/featureFlags";
import { createSupabaseApprovedPlanRevisionRepository, createSupabaseFamilyOwnedResourceRepository, createSupabaseRecommendationInteractionRepository } from "@/lib/intelligence/recommendations/repository";
import { createRecommendationService } from "@/lib/intelligence/recommendations/service";
import { createShopifyStorefrontProvider } from "@/lib/intelligence/commerce/shopify";
import { createCommerceRecommendationService } from "@/lib/intelligence/commerce/service";
import { createLearningBasketService, LearningBasketServiceError } from "@/lib/intelligence/commerce/basketService";
import { createSupabaseCommerceMappingRepository, createSupabaseCommerceEventRepository, createSupabaseLearningBasketRepository, CommerceRepositoryError } from "@/lib/intelligence/commerce/repository";
import type { LearningPlanType } from "@/lib/intelligence/plans/types";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof LearningBasketServiceError || error instanceof CommerceRepositoryError) {
    const status = error.code === "not_found" ? 404 : error.code === "invalid_input" ? 400 : 500;
    return NextResponse.json({ code: error.code, error: error.message }, { status });
  }
  return NextResponse.json({ code: "persistence", error: "The learning basket is temporarily unavailable." }, { status: 500 });
}

function exact(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function revision(value: unknown) { const number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; }

async function contextFor(body: Record<string, unknown>) {
  if (!isLearningBasketEnabled()) return { response: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  const planType = exact(body.planType);
  const ideaId = exact(body.ideaId);
  const sourceId = exact(body.sourceId);
  const planId = exact(body.planId);
  const revisionNumber = revision(body.revision);
  if (!ideaId || !sourceId || !planId || !revisionNumber || !isLearningPlanType(planType)) return { response: NextResponse.json({ code: "invalid_input", error: "An exact approved plan revision is required." }, { status: 400 }) };
  const auth = await getIntelligenceServerContext();
  if (!auth) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const planRepository = createSupabaseApprovedPlanRevisionRepository(auth.client);
  const snapshot = await planRepository.getApprovedRevisionForUser(auth.user.id, ideaId, sourceId, planType as LearningPlanType, planId, revisionNumber);
  if (!snapshot) return { response: NextResponse.json({ code: "not_approved", error: "That exact approved revision is not available." }, { status: 404 }) };
  const recommendationService = createRecommendationService({ approvedPlanRepository: planRepository, ownedResourceRepository: createSupabaseFamilyOwnedResourceRepository(auth.client), interactionRepository: createSupabaseRecommendationInteractionRepository(auth.client) });
  const recommendationResult = await recommendationService.getForUser(auth.user.id, snapshot);
  const commerce = await createCommerceRecommendationService({ provider: createShopifyStorefrontProvider(), mappings: createSupabaseCommerceMappingRepository(auth.client) }).getForRecommendationResult(recommendationResult, String(process.env.SHOPIFY_REGION || "AU"));
  return { auth, snapshot, commerce, basketRepository: createSupabaseLearningBasketRepository(auth.client), eventRepository: createSupabaseCommerceEventRepository(auth.client) };
}

function queryBody(request: Request, body: Record<string, unknown> = {}) {
  const params = new URL(request.url).searchParams;
  return {
    ...body,
    ideaId: body.ideaId ?? params.get("ideaId"), sourceId: body.sourceId ?? params.get("sourceId"), planType: body.planType ?? params.get("planType"), planId: body.planId ?? params.get("planId"), revision: body.revision ?? params.get("revision"),
  };
}

export async function GET(request: Request) {
  try {
    const scoped = await contextFor(queryBody(request));
    if ("response" in scoped) return scoped.response;
    const basket = await scoped.basketRepository.getForUser(scoped.auth.user.id, scoped.snapshot.planId, scoped.snapshot.revisionId);
    return NextResponse.json({ basket });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const scoped = await contextFor(queryBody(request, body));
    if ("response" in scoped) return scoped.response;
    const service = createLearningBasketService(scoped.basketRepository);
    const basket = await service.addItemForUser(scoped.auth.user.id, scoped.snapshot, scoped.commerce, { commerceRecommendationId: exact(body.commerceRecommendationId), quantity: Number(body.quantity) || 1 });
    const candidate = scoped.commerce.products.find((item) => item.commerceRecommendationId === exact(body.commerceRecommendationId));
    if (candidate) await Promise.all([
      scoped.eventRepository.recordForUser(scoped.auth.user.id, { planId: scoped.snapshot.planId, revisionId: scoped.snapshot.revisionId, revisionNumber: scoped.snapshot.revisionNumber, eventType: "added_to_basket", provider: "shopify", productId: candidate.product.providerProductId, resourceKey: candidate.resourceKey, metadata: { quantity: Number(body.quantity) || 1 } }),
      scoped.eventRepository.recordForUser(scoped.auth.user.id, { planId: scoped.snapshot.planId, revisionId: scoped.snapshot.revisionId, revisionNumber: scoped.snapshot.revisionNumber, eventType: "product_added", provider: "shopify", productId: candidate.product.providerProductId, resourceKey: candidate.resourceKey, metadata: {} }),
    ].map((event) => event.catch(() => undefined)));
    return NextResponse.json({ basket });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const scoped = await contextFor(queryBody(request, body));
    if ("response" in scoped) return scoped.response;
    const basketId = exact(body.basketId);
    const itemId = exact(body.itemId);
    if (!basketId || !itemId) return NextResponse.json({ code: "invalid_input", error: "A basket and item are required." }, { status: 400 });
    const before = await scoped.basketRepository.getForUser(scoped.auth.user.id, scoped.snapshot.planId, scoped.snapshot.revisionId);
    const removedItem = before?.items.find((item) => item.id === itemId);
    const basket = await scoped.basketRepository.removeItemForUser(scoped.auth.user.id, basketId, itemId);
    await scoped.eventRepository.recordForUser(scoped.auth.user.id, { planId: scoped.snapshot.planId, revisionId: scoped.snapshot.revisionId, revisionNumber: scoped.snapshot.revisionNumber, eventType: "removed_from_basket", provider: "shopify", productId: removedItem?.providerProductId ?? null, resourceKey: removedItem?.resourceKey ?? null, metadata: {} }).catch(() => undefined);
    return NextResponse.json({ basket });
  } catch (error) { return errorResponse(error); }
}
