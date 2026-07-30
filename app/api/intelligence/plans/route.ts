import { NextResponse } from "next/server";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { listLearningPlansForUser } from "@/lib/intelligence/plans/library";

export async function GET() {
  if (!isIntelligenceEngineEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const auth = await getIntelligenceServerContext();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    return NextResponse.json({ plans: await listLearningPlansForUser(auth.user.id, auth.client) });
  } catch {
    return NextResponse.json({ code: "load_failed", error: "We could not load your plans just now." }, { status: 500 });
  }
}
