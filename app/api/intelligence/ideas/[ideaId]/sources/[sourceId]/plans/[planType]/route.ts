import { NextResponse } from "next/server";
import { isIntelligenceEngineEnabled } from "@/lib/intelligence/featureFlags";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { createSupabaseIdeasRepository } from "@/lib/intelligence/ideas/repository";
import { createSupabaseLearningPlanRepository } from "@/lib/intelligence/plans/repository";
import { createDefaultLearningPlanGenerator, isLearningPlanType } from "@/lib/intelligence/plans/generator";
import { createLearningPlanGenerationService, defaultGenerationCoordinator, PlanGenerationError } from "@/lib/intelligence/plans/service";
import type { LearningPlanGenerationInput, LearningPlanType } from "@/lib/intelligence/plans/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ ideaId: string; sourceId: string; planType: string }> };

function responseForError(error: unknown) {
  if (!(error instanceof PlanGenerationError)) {
    return NextResponse.json({ state: "failed", error: "Plan generation failed.", code: "failed" }, { status: 500 });
  }
  const status = error.code === "throttled"
    ? 429
    : error.code === "provider_unavailable"
      ? 503
      : error.code === "provider_timeout"
        ? 504
        : error.code === "schema_invalid" || error.code === "output_too_large"
          ? 422
          : error.code === "draft_exists" || error.code === "generation_in_progress" || error.code === "source_not_ready"
            ? 409
            : error.code === "invalid_input"
              ? 400
              : 500;
  return NextResponse.json({
    state: error.state,
    error: error.message,
    code: error.code,
    issues: error.issues,
  }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value.trim() || null : null;
}

function parseBody(body: unknown) {
  if (!isRecord(body)) throw new PlanGenerationError("awaiting_input", "invalid_input", "Generation input is required.");
  const subjects = body.subjects === undefined
    ? []
    : Array.isArray(body.subjects) && body.subjects.every((subject) => typeof subject === "string")
      ? body.subjects.map((subject) => subject.trim()).filter(Boolean)
      : null;
  if (!subjects) throw new PlanGenerationError("awaiting_input", "invalid_input", "Subjects must be a list of text values.");
  const durationUnit: LearningPlanGenerationInput["durationUnit"] = body.durationUnit === "minutes" || body.durationUnit === "lessons" || body.durationUnit === "weeks" || body.durationUnit === "sessions"
    ? body.durationUnit
    : null;
  const duration = body.duration === undefined || body.duration === null || body.duration === ""
    ? null
    : Number(body.duration);
  return {
    learnerAgeOrStage: optionalString(body.learnerAgeOrStage) ?? "",
    subjects,
    duration,
    durationUnit,
    parentInstructions: optionalString(body.parentInstructions),
    regenerate: body.regenerate === true,
  };
}

async function getContext(planTypeValue: string) {
  if (!isIntelligenceEngineEnabled()) return { response: NextResponse.json({ error: "Not found." }, { status: 404 }) };
  if (!isLearningPlanType(planTypeValue)) {
    return { response: NextResponse.json({ state: "awaiting_input", error: "Choose either a lesson or unit plan.", code: "invalid_input" }, { status: 400 }) };
  }
  const auth = await getIntelligenceServerContext();
  if (!auth) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  return { auth, planType: planTypeValue as LearningPlanType };
}

export async function GET(_request: Request, context: RouteContext) {
  const { ideaId, sourceId, planType: planTypeValue } = await context.params;
  const scoped = await getContext(planTypeValue);
  if ("response" in scoped) return scoped.response;
  const repository = createSupabaseIdeasRepository(scoped.auth.client);
  const source = await repository.getSourceForUser(scoped.auth.user.id, ideaId, sourceId);
  if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  const planRepository = createSupabaseLearningPlanRepository(scoped.auth.client);
  const plan = await planRepository.getDraftForUser(scoped.auth.user.id, ideaId, sourceId, scoped.planType);
  return NextResponse.json({ state: plan ? "ready" : "awaiting_input", plan });
}

export async function POST(request: Request, context: RouteContext) {
  const { ideaId, sourceId, planType: planTypeValue } = await context.params;
  const scoped = await getContext(planTypeValue);
  if ("response" in scoped) return scoped.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ state: "awaiting_input", error: "Generation input is required.", code: "invalid_input" }, { status: 400 });
  }

  try {
    const input = parseBody(body);
    const ideasRepository = createSupabaseIdeasRepository(scoped.auth.client);
    const source = await ideasRepository.getSourceForUser(scoped.auth.user.id, ideaId, sourceId);
    if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
    const service = createLearningPlanGenerationService({
      repository: createSupabaseLearningPlanRepository(scoped.auth.client),
      generator: createDefaultLearningPlanGenerator(),
      coordinator: defaultGenerationCoordinator,
    });
    const result = await service.generateForUser(scoped.auth.user.id, ideaId, source, {
      ...input,
      planType: scoped.planType,
    });
    return NextResponse.json(result);
  } catch (error) {
    return responseForError(error);
  }
}
