import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  createIdeasRepository: vi.fn(),
  createPlanRepository: vi.fn(),
  createGenerator: vi.fn(),
  createService: vi.fn(),
}));

vi.mock("@/lib/intelligence/serverAuth", () => ({ getIntelligenceServerContext: mocks.getContext }));
vi.mock("@/lib/intelligence/ideas/repository", () => ({ createSupabaseIdeasRepository: mocks.createIdeasRepository }));
vi.mock("@/lib/intelligence/plans/repository", () => ({ createSupabaseLearningPlanRepository: mocks.createPlanRepository }));
vi.mock("@/lib/intelligence/plans/generator", () => ({
  createDefaultLearningPlanGenerator: mocks.createGenerator,
  isLearningPlanType: (value: unknown) => value === "lesson" || value === "unit",
}));
vi.mock("@/lib/intelligence/plans/service", () => ({
  createLearningPlanGenerationService: mocks.createService,
  defaultGenerationCoordinator: { inFlight: new Set(), requestTimes: new Map() },
  PlanGenerationError: class PlanGenerationError extends Error {},
}));

import { POST } from "@/app/api/intelligence/ideas/[ideaId]/sources/[sourceId]/plans/[planType]/route";

function context(planType = "lesson") {
  return { params: Promise.resolve({ ideaId: "idea-1", sourceId: "source-1", planType }) };
}

function request(body: unknown = { learnerAgeOrStage: "Ages 8-10" }) {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("learning plan generation route", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE;
    vi.clearAllMocks();
  });

  it("hides the route when the feature is disabled", async () => {
    const response = await POST(request(), context());
    expect(response.status).toBe(404);
    expect(mocks.getContext).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests and invalid plan types", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    mocks.getContext.mockResolvedValue(null);
    expect((await POST(request(), context())).status).toBe(401);
    expect((await POST(request(), context("worksheet"))).status).toBe(400);
  });

  it("enforces source ownership before generation", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    const sourceRepository = { getSourceForUser: vi.fn(async () => null) };
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    mocks.createIdeasRepository.mockReturnValue(sourceRepository);

    const response = await POST(request(), context());
    expect(response.status).toBe(404);
    expect(sourceRepository.getSourceForUser).toHaveBeenCalledWith("user-1", "idea-1", "source-1");
    expect(mocks.createService).not.toHaveBeenCalled();
  });

  it("passes only explicit parent input and extracted source metadata to the service", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    const source = { id: "source-1", ideaId: "idea-1", userId: "user-1", url: "https://example.com" };
    const sourceRepository = { getSourceForUser: vi.fn(async () => source) };
    const result = { state: "ready", revision: 1, regenerated: false, plan: { id: "plan-1" } };
    const service = { generateForUser: vi.fn(async () => result) };
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    mocks.createIdeasRepository.mockReturnValue(sourceRepository);
    mocks.createPlanRepository.mockReturnValue({});
    mocks.createGenerator.mockReturnValue({});
    mocks.createService.mockReturnValue(service);

    const response = await POST(request({
      learnerAgeOrStage: "Ages 8-10",
      subjects: ["Science"],
      duration: 45,
      durationUnit: "minutes",
      parentInstructions: "Keep it practical.",
      regenerate: true,
    }), context("unit"));
    expect(response.status).toBe(200);
    expect(service.generateForUser).toHaveBeenCalledWith("user-1", "idea-1", source, {
      learnerAgeOrStage: "Ages 8-10",
      subjects: ["Science"],
      duration: 45,
      durationUnit: "minutes",
      parentInstructions: "Keep it practical.",
      regenerate: true,
      planType: "unit",
    });
  });
});
