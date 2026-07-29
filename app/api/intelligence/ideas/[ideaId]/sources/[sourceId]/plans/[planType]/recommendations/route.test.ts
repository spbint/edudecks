import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  createApproved: vi.fn(),
  createOwned: vi.fn(),
  createInteractions: vi.fn(),
  createService: vi.fn(),
}));

vi.mock("@/lib/intelligence/serverAuth", () => ({ getIntelligenceServerContext: mocks.getContext }));
vi.mock("@/lib/intelligence/featureFlags", () => ({
  isRecommendationEngineEnabled: () => process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS === "true",
  isRecommendationDebugEnabled: () => false,
}));
vi.mock("@/lib/intelligence/plans/generator", () => ({ isLearningPlanType: (value: unknown) => value === "lesson" || value === "unit" }));
vi.mock("@/lib/intelligence/recommendations/repository", () => ({
  createSupabaseApprovedPlanRevisionRepository: mocks.createApproved,
  createSupabaseFamilyOwnedResourceRepository: mocks.createOwned,
  createSupabaseRecommendationInteractionRepository: mocks.createInteractions,
}));
vi.mock("@/lib/intelligence/recommendations/service", () => ({
  createRecommendationService: mocks.createService,
  RecommendationServiceError: class RecommendationServiceError extends Error {},
}));

import { GET, POST } from "@/app/api/intelligence/ideas/[ideaId]/sources/[sourceId]/plans/[planType]/recommendations/route";

function context(planType = "lesson") { return { params: Promise.resolve({ ideaId: "idea-1", sourceId: "source-1", planType }) }; }
function request(url = "http://localhost/api?revision=4", body?: unknown) { return new Request(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : undefined); }

describe("Recommendation route", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS;
    vi.clearAllMocks();
  });

  it("is feature flagged and requires authentication", async () => {
    expect((await GET(request("http://localhost/api?planId=plan-1&revision=4"), context())).status).toBe(404);
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS = "true";
    mocks.getContext.mockResolvedValue(null);
    expect((await GET(request(), context())).status).toBe(401);
  });

  it("requires the exact revision and rejects cross-user/unavailable access", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS = "true";
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    const repository = { getApprovedRevisionForUser: vi.fn(async () => null) };
    mocks.createApproved.mockReturnValue(repository);
    expect((await GET(request("http://localhost/api?revision=4"), context())).status).toBe(400);
    expect((await GET(request("http://localhost/api?planId=plan-1&revision=4"), context())).status).toBe(404);
    expect(repository.getApprovedRevisionForUser).toHaveBeenCalledWith("user-1", "idea-1", "source-1", "lesson", "plan-1", 4);
  });

  it("records an event only through the approved revision service", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS = "true";
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    const snapshot = { userId: "user-1", planId: "plan-1", revisionId: "version-row-4", revisionNumber: 4 };
    const repository = { getApprovedRevisionForUser: vi.fn(async () => snapshot) };
    const service = { recordEventForUser: vi.fn(async () => ({ id: "event-1" })) };
    mocks.createApproved.mockReturnValue(repository);
    mocks.createService.mockReturnValue(service);
    const response = await POST(request("http://localhost/api?planId=plan-1&revision=4", { recommendationId: "plan-1:4:safety:0:supervise", eventType: "completed" }), context());
    expect(response.status).toBe(200);
    expect(service.recordEventForUser).toHaveBeenCalledWith("user-1", snapshot, { recommendationId: "plan-1:4:safety:0:supervise", eventType: "completed", metadata: { resourceKey: null } });
  });

  it("keeps unexpected failures sanitised and passes route diagnostics to repositories", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS = "true";
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    const snapshot = { userId: "user-1", planId: "plan-1", revisionId: "version-row-4", revisionNumber: 4 };
    const repository = { getApprovedRevisionForUser: vi.fn(async () => snapshot) };
    const service = { getForUser: vi.fn(async () => { throw new Error("raw database connection details"); }) };
    mocks.createApproved.mockReturnValue(repository);
    mocks.createService.mockReturnValue(service);
    const response = await GET(request("http://localhost/api?planId=plan-1&revision=4"), context());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ code: "persistence", error: "Recommendations are temporarily unavailable." });
    expect(mocks.createApproved).toHaveBeenCalledWith({}, expect.anything());
    expect(mocks.createService).toHaveBeenCalledWith(expect.objectContaining({ approvedPlanRepository: repository, diagnostics: expect.anything() }));
  });
});
