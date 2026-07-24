import { NextResponse } from "next/server";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { isCommerceMappingAdminEnabled } from "@/lib/intelligence/featureFlags";
import { createSupabaseCommerceMappingRepository } from "@/lib/intelligence/commerce/repository";
import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";

export const runtime = "nodejs";

function isAdmin(user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> }) {
  return process.env.NODE_ENV !== "production" || user.app_metadata?.role === "admin" || user.user_metadata?.role === "admin";
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }

export async function GET(request: Request) {
  if (!isCommerceMappingAdminEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await getIntelligenceServerContext();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isAdmin(auth.user)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    const mappings = await createSupabaseCommerceMappingRepository(auth.client).listAll();
    const requested = new Set((new URL(request.url).searchParams.get("resourceKeys") || "").split(",").map(text).filter(Boolean));
    return NextResponse.json({ mappings, unmatchedResourceKeys: [...requested].filter((key) => !mappings.some((mapping) => mapping.resourceKey === key && mapping.status === "approved" && !mapping.paused)) });
  } catch { return NextResponse.json({ error: "Commerce mappings are temporarily unavailable." }, { status: 500 }); }
}

export async function POST(request: Request) {
  if (!isCommerceMappingAdminEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await getIntelligenceServerContext();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!isAdmin(auth.user)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const resourceKey = normaliseResourceKey(text(body.resourceKey));
    const productId = text(body.providerProductId);
    const status = text(body.status) as "pending" | "approved" | "rejected";
    if (!resourceKey || !productId || !["pending", "approved", "rejected"].includes(status)) return NextResponse.json({ code: "invalid_input", error: "Resource key, product ID, and mapping status are required." }, { status: 400 });
    const mapping = await createSupabaseCommerceMappingRepository(auth.client).upsertForAdmin({ resourceKey, provider: "shopify", providerProductId: productId, providerVariantId: text(body.providerVariantId) || null, status, matchConfidence: Math.min(Math.max(Number(body.matchConfidence) || 0, 0), 1), preferred: body.preferred === true, paused: body.paused === true, notes: text(body.notes), createdByUserId: auth.user.id, approvedByUserId: status === "approved" ? auth.user.id : null });
    return NextResponse.json({ mapping });
  } catch { return NextResponse.json({ error: "We could not save that commerce mapping." }, { status: 500 }); }
}
