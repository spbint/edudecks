import { NextResponse } from "next/server";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { isRecommendationEngineEnabled } from "@/lib/intelligence/featureFlags";
import { createSupabaseFamilyOwnedResourceRepository } from "@/lib/intelligence/recommendations/repository";
import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";
import { createIntelligenceRouteDiagnostics, type IntelligenceRouteDiagnostics } from "@/lib/intelligence/serverDiagnostics";

export const runtime = "nodejs";

const OWNED_RESOURCES_ROUTE = "/api/intelligence/resources";

async function contextFor(diagnostics: IntelligenceRouteDiagnostics) {
  diagnostics.stageStart("authenticated_context");
  if (!isRecommendationEngineEnabled()) {
    diagnostics.stageFailure("authenticated_context", { name: "FeatureDisabled", code: "not_found", message: "Recommendation engine is disabled.", status: 404 });
    return { response: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  }
  try {
    const auth = await getIntelligenceServerContext();
    if (!auth) {
      diagnostics.stageFailure("authenticated_context", { name: "AuthenticationError", code: "unauthenticated", message: "Authentication was not available.", status: 401 });
      return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
    }
    diagnostics.stageSuccess("authenticated_context");
    return { auth };
  } catch (error) {
    diagnostics.stageFailure("authenticated_context", error);
    throw error;
  }
}

export async function GET() {
  const diagnostics = createIntelligenceRouteDiagnostics(OWNED_RESOURCES_ROUTE);
  let scoped;
  try { scoped = await contextFor(diagnostics); } catch {
    diagnostics.responseReady();
    return NextResponse.json({ error: "Owned resources are temporarily unavailable." }, { status: 500 });
  }
  if ("response" in scoped) { diagnostics.responseReady(); return scoped.response; }
  try {
    const resources = await createSupabaseFamilyOwnedResourceRepository(scoped.auth.client, diagnostics).listForUser(scoped.auth.user.id);
    diagnostics.responseReady();
    return NextResponse.json({ resources });
  } catch {
    diagnostics.responseReady();
    return NextResponse.json({ error: "Owned resources are temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const diagnostics = createIntelligenceRouteDiagnostics(OWNED_RESOURCES_ROUTE);
  let scoped;
  try { scoped = await contextFor(diagnostics); } catch {
    diagnostics.responseReady();
    return NextResponse.json({ error: "We could not save this owned resource." }, { status: 500 });
  }
  if ("response" in scoped) { diagnostics.responseReady(); return scoped.response; }
  let body: unknown;
  try { body = await request.json(); } catch { diagnostics.responseReady(); return NextResponse.json({ error: "A resource name is required." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) { diagnostics.responseReady(); return NextResponse.json({ error: "A resource name is required." }, { status: 400 }); }
  const value = body as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || name.length > 200) { diagnostics.responseReady(); return NextResponse.json({ error: "A concise resource name is required." }, { status: 400 }); }
  try {
    const resource = await createSupabaseFamilyOwnedResourceRepository(scoped.auth.client).createForUser(scoped.auth.user.id, {
      name,
      normalizedResourceKey: normaliseResourceKey(name),
      category: typeof value.category === "string" ? value.category.trim() || null : null,
      quantity: typeof value.quantity === "string" ? value.quantity.trim() || null : null,
      condition: typeof value.condition === "string" ? value.condition.trim() || null : null,
      active: true,
      source: "parent",
      provenance: { recordedBy: "parent" },
    });
    diagnostics.responseReady();
    return NextResponse.json({ resource }, { status: 201 });
  } catch {
    diagnostics.responseReady();
    return NextResponse.json({ error: "We could not save this owned resource." }, { status: 500 });
  }
}
