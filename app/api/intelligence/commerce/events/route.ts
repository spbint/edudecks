import { NextResponse } from "next/server";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";
import { isShopifyCommerceEnabled } from "@/lib/intelligence/featureFlags";
import { createSupabaseApprovedPlanRevisionRepository } from "@/lib/intelligence/recommendations/repository";
import { createSupabaseCommerceEventRepository, CommerceRepositoryError } from "@/lib/intelligence/commerce/repository";
import type { CommerceEventType } from "@/lib/intelligence/commerce/types";

export const runtime = "nodejs";
const EVENT_TYPES = new Set<CommerceEventType>([
  "product_impression", "product_opened", "added_to_basket", "removed_from_basket", "outbound_shopify_click",
  "resource_requested", "product_recommended", "product_clicked", "product_added", "resource_fulfilled", "no_suitable_product_found",
]);

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function number(value: unknown) { const result = Number(value); return Number.isInteger(result) && result > 0 ? result : null; }

export async function POST(request: Request) {
  if (!isShopifyCommerceEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await getIntelligenceServerContext();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const planType = text(body.planType);
    const revision = number(body.revision);
    const eventType = text(body.eventType) as CommerceEventType;
    if (!isLearningPlanType(planType) || !text(body.ideaId) || !text(body.sourceId) || !text(body.planId) || !revision || !EVENT_TYPES.has(eventType)) return NextResponse.json({ code: "invalid_input", error: "A valid approved plan and commerce event are required." }, { status: 400 });
    const snapshot = await createSupabaseApprovedPlanRevisionRepository(auth.client).getApprovedRevisionForUser(auth.user.id, text(body.ideaId), text(body.sourceId), planType, text(body.planId), revision);
    if (!snapshot) return NextResponse.json({ code: "not_approved", error: "That exact approved revision is not available." }, { status: 404 });
    const event = await createSupabaseCommerceEventRepository(auth.client).recordForUser(auth.user.id, {
      planId: snapshot.planId, revisionId: snapshot.revisionId, revisionNumber: snapshot.revisionNumber, eventType, provider: "shopify",
      productId: text(body.productId) || null, resourceKey: text(body.resourceKey) || null,
      metadata: { source: "learning_preparation_list" },
    });
    return NextResponse.json({ event: { id: event.id, eventType: event.eventType, createdAt: event.createdAt } });
  } catch (error) {
    if (error instanceof CommerceRepositoryError) return NextResponse.json({ code: error.code, error: error.message }, { status: 500 });
    return NextResponse.json({ code: "persistence", error: "We could not record that commerce event." }, { status: 500 });
  }
}
