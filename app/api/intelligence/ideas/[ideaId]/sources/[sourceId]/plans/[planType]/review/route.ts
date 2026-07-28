import { NextResponse } from "next/server";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { createSupabaseIdeasRepository } from "@/lib/intelligence/ideas/repository";
import { createSupabaseLearningPlanRepository } from "@/lib/intelligence/plans/repository";
import { createSupabaseLearningPlanReviewRepository } from "@/lib/intelligence/plans/reviewRepository";
import { createPlanReviewService, PlanReviewError } from "@/lib/intelligence/plans/reviewService";
import { createDefaultLearningPlanGenerator } from "@/lib/intelligence/plans/generator";
import { createLearningPlanGenerationService, defaultGenerationCoordinator, PlanGenerationError } from "@/lib/intelligence/plans/service";
import { isLearningPlanType } from "@/lib/intelligence/plans/generator";
import type { GeneratedPlanContent, LearningPlanType } from "@/lib/intelligence/plans/types";
import type { ReviewAction, ReviewActionInput } from "@/lib/intelligence/plans/reviewTypes";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ ideaId: string; sourceId: string; planType: string }> };

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function responseForError(error: unknown) {
  if (error instanceof PlanReviewError) {
    const status = error.code === "stale_revision" ? 409 : error.code === "persistence_failure" ? 500 : 422;
    return NextResponse.json({ state: error.code === "stale_revision" ? "stale_revision" : error.code, code: error.code, error: error.message, issues: error.issues }, { status });
  }
  if (error instanceof PlanGenerationError) {
    const status = error.code === "provider_timeout" ? 504 : error.code === "provider_unavailable" ? 503 : error.code === "invalid_input" ? 400 : 500;
    return NextResponse.json({ state: error.state, code: error.code, error: error.message, issues: error.issues }, { status });
  }
  return NextResponse.json({ state: "persistence_failure", code: "persistence_failure", error: "We could not update this plan review." }, { status: 500 });
}

async function getContext(planTypeValue: string) {
  if (!isIntelligenceEngineEnabled()) return { response: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  if (!isLearningPlanType(planTypeValue)) return { response: NextResponse.json({ error: "Choose either a lesson or unit plan.", code: "invalid_input" }, { status: 400 }) };
  const auth = await getIntelligenceServerContext();
  if (!auth) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  return { auth, planType: planTypeValue as LearningPlanType };
}

async function getOwnedSource(auth: NonNullable<Awaited<ReturnType<typeof getIntelligenceServerContext>>>, ideaId: string, sourceId: string) {
  const repository = createSupabaseIdeasRepository(auth.client);
  return repository.getSourceForUser(auth.user.id, ideaId, sourceId);
}

export async function GET(_request: Request, context: RouteContext) {
  const { ideaId, sourceId, planType: planTypeValue } = await context.params;
  const scoped = await getContext(planTypeValue);
  if ("response" in scoped) return scoped.response;
  try {
    const source = await getOwnedSource(scoped.auth, ideaId, sourceId);
    if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
    const service = createPlanReviewService({ repository: createSupabaseLearningPlanReviewRepository(scoped.auth.client) });
    const review = await service.getForUser(scoped.auth.user.id, ideaId, sourceId, scoped.planType);
    if (!review) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    return NextResponse.json(review);
  } catch (error) {
    return responseForError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { ideaId, sourceId, planType: planTypeValue } = await context.params;
  const scoped = await getContext(planTypeValue);
  if ("response" in scoped) return scoped.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_input", error: "Review action input is required." }, { status: 400 });
  }
  if (!record(body)) return NextResponse.json({ code: "invalid_input", error: "Review action input is required." }, { status: 400 });

  const action = body.action as ReviewAction;
  const expectedRevision = Number(body.expectedRevision);
  const contentProvided = Object.prototype.hasOwnProperty.call(body, "content");
  const input: ReviewActionInput = {
    action,
    expectedRevision,
    content: contentProvided ? body.content as GeneratedPlanContent : undefined,
    contentProvided,
    safetyAcknowledged: body.safetyAcknowledged === true,
  };

  try {
    const source = await getOwnedSource(scoped.auth, ideaId, sourceId);
    if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
    const reviewRepository = createSupabaseLearningPlanReviewRepository(scoped.auth.client);
    const reviewService = createPlanReviewService({ repository: reviewRepository });

    if (action === "regenerate") {
      const current = await reviewService.getForUser(scoped.auth.user.id, ideaId, sourceId, scoped.planType);
      if (!current) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
      if (current.currentRevision !== expectedRevision) {
        return NextResponse.json({ state: "stale_revision", code: "stale_revision", error: "This plan changed elsewhere. Reload before regenerating." }, { status: 409 });
      }
      if (current.plan.status !== "draft") {
        return NextResponse.json({ state: "invalid_input", code: "invalid_input", error: "Return the plan to draft before regenerating." }, { status: 422 });
      }
      const content = current.plan.content as Record<string, unknown>;
      const generation = createLearningPlanGenerationService({
        repository: createSupabaseLearningPlanRepository(scoped.auth.client),
        generator: createDefaultLearningPlanGenerator(),
        coordinator: defaultGenerationCoordinator,
      });
      const result = await generation.generateForUser(scoped.auth.user.id, ideaId, source, {
        planType: scoped.planType,
        learnerAgeOrStage: typeof content.ageStage === "string" ? content.ageStage : "",
        subjects: Array.isArray(content.subjects) ? content.subjects.filter((item): item is string => typeof item === "string") : [],
        duration: typeof content.duration === "number" ? content.duration : null,
        durationUnit: content.durationUnit === "minutes" || content.durationUnit === "lessons" || content.durationUnit === "weeks" || content.durationUnit === "sessions" ? content.durationUnit : null,
        parentInstructions: typeof content.parentInstructions === "string" ? content.parentInstructions : null,
        regenerate: true,
      });
      return NextResponse.json({ ...result, state: "regenerated" });
    }

    const result = await reviewService.performAction(scoped.auth.user.id, ideaId, sourceId, scoped.planType, input);
    return NextResponse.json(result);
  } catch (error) {
    return responseForError(error);
  }
}
