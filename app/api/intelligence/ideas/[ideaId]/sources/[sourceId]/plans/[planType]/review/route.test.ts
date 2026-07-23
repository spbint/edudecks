import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  createIdeasRepository: vi.fn(),
  createReviewRepository: vi.fn(),
  createReviewService: vi.fn(),
  createPlanRepository: vi.fn(),
  createGenerator: vi.fn(),
  createGenerationService: vi.fn(),
}));

vi.mock("@/lib/intelligence/serverAuth", () => ({ getIntelligenceServerContext: mocks.getContext }));
vi.mock("@/lib/intelligence/ideas/repository", () => ({ createSupabaseIdeasRepository: mocks.createIdeasRepository }));
vi.mock("@/lib/intelligence/plans/reviewRepository", () => ({ createSupabaseLearningPlanReviewRepository: mocks.createReviewRepository }));
vi.mock("@/lib/intelligence/plans/reviewService", () => ({ createPlanReviewService: mocks.createReviewService, PlanReviewError: class PlanReviewError extends Error {} }));
vi.mock("@/lib/intelligence/plans/repository", () => ({ createSupabaseLearningPlanRepository: mocks.createPlanRepository }));
vi.mock("@/lib/intelligence/plans/generator", () => ({
  createDefaultLearningPlanGenerator: mocks.createGenerator,
  isLearningPlanType: (value: unknown) => value === "lesson" || value === "unit",
}));
vi.mock("@/lib/intelligence/plans/service", () => ({
  createLearningPlanGenerationService: mocks.createGenerationService,
  defaultGenerationCoordinator: { inFlight: new Set(), requestTimes: new Map() },
  PlanGenerationError: class PlanGenerationError extends Error {},
}));

import { GET, POST } from "@/app/api/intelligence/ideas/[ideaId]/sources/[sourceId]/plans/[planType]/review/route";

function context(planType = "lesson") {
  return { params: Promise.resolve({ ideaId: "idea-1", sourceId: "source-1", planType }) };
}

function request(body: unknown = { action: "validate", expectedRevision: 1 }) {
  return new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("plan review route", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE;
    vi.clearAllMocks();
  });

  it("hides the route when disabled and rejects unauthenticated access", async () => {
    expect((await GET(new Request("http://localhost"), context())).status).toBe(404);
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    mocks.getContext.mockResolvedValue(null);
    expect((await GET(new Request("http://localhost"), context())).status).toBe(401);
  });

  it("enforces source ownership before loading or saving", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    const sourceRepository = { getSourceForUser: vi.fn(async () => null) };
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    mocks.createIdeasRepository.mockReturnValue(sourceRepository);
    expect((await POST(request(), context())).status).toBe(404);
    expect(sourceRepository.getSourceForUser).toHaveBeenCalledWith("user-1", "idea-1", "source-1");
    expect(mocks.createReviewService).not.toHaveBeenCalled();
  });

  it("passes expected revision and action to the review service", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE = "true";
    const source = { id: "source-1", ideaId: "idea-1", userId: "user-1" };
    const sourceRepository = { getSourceForUser: vi.fn(async () => source) };
    const reviewService = { performAction: vi.fn(async () => ({ state: "saved", currentRevision: 2 })) };
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    mocks.createIdeasRepository.mockReturnValue(sourceRepository);
    mocks.createReviewRepository.mockReturnValue({});
    mocks.createReviewService.mockReturnValue(reviewService);
    const response = await POST(request({ action: "save", expectedRevision: 1, content: { title: "Updated" }, safetyAcknowledged: true }), context());
    expect(response.status).toBe(200);
    expect(reviewService.performAction).toHaveBeenCalledWith("user-1", "idea-1", "source-1", "lesson", expect.objectContaining({ action: "save", expectedRevision: 1, safetyAcknowledged: true }));
  });
});
