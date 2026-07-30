import { NextResponse } from "next/server";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";
import { PlanSchedulingError, schedulePlanForUser, type SchedulePlanInput } from "@/lib/intelligence/plans/scheduling";

type Context = { params: Promise<{ planType: string; planId: string }> };

export async function POST(request: Request, context: Context) {
  if (!isIntelligenceEngineEnabled()) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const { planType: type, planId } = await context.params;
  if (!isLearningPlanType(type)) return NextResponse.json({ code: "invalid_input", error: "Choose a lesson or unit plan." }, { status: 400 });
  const auth = await getIntelligenceServerContext();
  if (!auth) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let input: SchedulePlanInput;
  try {
    input = await request.json() as SchedulePlanInput;
  } catch {
    return NextResponse.json({ code: "invalid_input", error: "Schedule details are required." }, { status: 400 });
  }
  try {
    return NextResponse.json(await schedulePlanForUser(auth.client, auth.user.id, type, planId, input));
  } catch (error) {
    if (error instanceof PlanSchedulingError) {
      const status = error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : error.code === "invalid_input" ? 400 : 500;
      return NextResponse.json({ code: error.code, error: error.message }, { status });
    }
    return NextResponse.json({ code: "persistence_failure", error: "We could not schedule this plan." }, { status: 500 });
  }
}
