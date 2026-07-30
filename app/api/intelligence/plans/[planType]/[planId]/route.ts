import { NextResponse } from "next/server";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { getLearningPlanForUser } from "@/lib/intelligence/plans/library";
import { mutateLearningPlanForUser, PlanMutationError } from "@/lib/intelligence/plans/mutations";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";

type Context = { params: Promise<{ planType: string; planId: string }> };

function responseFor(error: unknown) {
  if (error instanceof PlanMutationError) {
    const status = error.code === "not_found" ? 404 : error.code === "invalid_input" ? 400 : 422;
    return NextResponse.json({ code: error.code, error: error.message }, { status });
  }
  return NextResponse.json({ code: "persistence_failure", error: "We could not update this plan." }, { status: 500 });
}
async function scoped(type: string) {
  if (!isIntelligenceEngineEnabled()) return { response: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  if (!isLearningPlanType(type)) return { response: NextResponse.json({ code: "invalid_input", error: "Choose a lesson or unit plan." }, { status: 400 }) };
  const auth = await getIntelligenceServerContext();
  if (!auth) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  return { auth, planType: type };
}

export async function GET(_request: Request, context: Context) {
  const { planType, planId } = await context.params;
  const selected = await scoped(planType);
  if ("response" in selected) return selected.response;
  try {
    const entry = await getLearningPlanForUser(selected.auth.user.id, selected.planType, planId, selected.auth.client);
    return entry ? NextResponse.json(entry) : NextResponse.json({ code: "not_found", error: "Plan not found." }, { status: 404 });
  } catch (error) {
    return responseFor(error);
  }
}
export async function POST(request: Request, context: Context) {
  const { planType, planId } = await context.params;
  const selected = await scoped(planType);
  if ("response" in selected) return selected.response;
  let body: Record<string, unknown> = {};
  try {
    const value = await request.json();
    if (value && typeof value === "object" && !Array.isArray(value)) body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ code: "invalid_input", error: "A plan action is required." }, { status: 400 });
  }
  const action = body.action;
  if (action !== "ready" && action !== "archive" && action !== "restore" && action !== "duplicate") {
    return NextResponse.json({ code: "invalid_input", error: "Choose a valid plan action." }, { status: 400 });
  }
  try {
    const entry = await mutateLearningPlanForUser(selected.auth.client, selected.auth.user.id, selected.planType, planId, action, { title: typeof body.title === "string" ? body.title : null });
    return NextResponse.json(entry);
  } catch (error) {
    return responseFor(error);
  }
}
