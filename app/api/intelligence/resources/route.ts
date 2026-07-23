import { NextResponse } from "next/server";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { isRecommendationEngineEnabled } from "@/lib/intelligence/featureFlags";
import { createSupabaseFamilyOwnedResourceRepository } from "@/lib/intelligence/recommendations/repository";
import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";

export const runtime = "nodejs";

function context() {
  return getIntelligenceServerContext();
}

export async function GET() {
  if (!isRecommendationEngineEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const resources = await createSupabaseFamilyOwnedResourceRepository(auth.client).listForUser(auth.user.id);
    return NextResponse.json({ resources });
  } catch {
    return NextResponse.json({ error: "Owned resources are temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isRecommendationEngineEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await context();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "A resource name is required." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "A resource name is required." }, { status: 400 });
  const value = body as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || name.length > 200) return NextResponse.json({ error: "A concise resource name is required." }, { status: 400 });
  try {
    const resource = await createSupabaseFamilyOwnedResourceRepository(auth.client).createForUser(auth.user.id, {
      name,
      normalizedResourceKey: normaliseResourceKey(name),
      category: typeof value.category === "string" ? value.category.trim() || null : null,
      quantity: typeof value.quantity === "string" ? value.quantity.trim() || null : null,
      condition: typeof value.condition === "string" ? value.condition.trim() || null : null,
      active: true,
      source: "parent",
      provenance: { recordedBy: "parent" },
    });
    return NextResponse.json({ resource }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not save this owned resource." }, { status: 500 });
  }
}
