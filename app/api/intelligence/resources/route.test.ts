import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getContext: vi.fn(),
  createOwned: vi.fn(),
}));

vi.mock("@/lib/intelligence/serverAuth", () => ({ getIntelligenceServerContext: mocks.getContext }));
vi.mock("@/lib/intelligence/featureFlags", () => ({ isRecommendationEngineEnabled: () => process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS === "true" }));
vi.mock("@/lib/intelligence/recommendations/repository", () => ({ createSupabaseFamilyOwnedResourceRepository: mocks.createOwned }));

import { GET } from "@/app/api/intelligence/resources/route";

describe("owned resources route diagnostics", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS;
    vi.clearAllMocks();
  });

  it("records authenticated context, owned-resource lookup, and response stages", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS = "true";
    mocks.getContext.mockResolvedValue({ user: { id: "user-1" }, client: {} });
    mocks.createOwned.mockImplementation((_client: unknown, diagnostics: { stageStart: (stage: string) => void; stageSuccess: (stage: string) => void }) => ({
      listForUser: vi.fn(async () => {
        diagnostics.stageStart("owned_resources_lookup");
        diagnostics.stageSuccess("owned_resources_lookup");
        return [];
      }),
    }));
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const response = await GET();

    expect(response.status).toBe(200);
    const stages = info.mock.calls.map(([, payload]) => (payload as { stage: string }).stage);
    expect(stages).toEqual(["authenticated_context_start", "authenticated_context_success", "owned_resources_lookup_start", "owned_resources_lookup_success", "response_ready"]);
    const payloads = info.mock.calls.map(([, payload]) => payload as { correlationId: string; route: string });
    expect(new Set(payloads.map((payload) => payload.correlationId)).size).toBe(1);
    expect(payloads.every((payload) => payload.route === "/api/intelligence/resources")).toBe(true);
  });

  it("returns a sanitised response when authentication fails", async () => {
    process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS = "true";
    mocks.getContext.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required." });
  });
});
