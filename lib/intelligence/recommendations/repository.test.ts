import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sourceIdsContainsValue } from "@/lib/intelligence/plans/repository";
import { createSupabaseApprovedPlanRevisionRepository, createSupabaseFamilyOwnedResourceRepository, createSupabaseRecommendationInteractionRepository } from "@/lib/intelligence/recommendations/repository";

function queryMock(response = { data: [], error: null }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    contains: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(async () => response),
    maybeSingle: vi.fn(async () => response),
  };
  return query;
}

function clientFor(query: ReturnType<typeof queryMock>) {
  return { from: vi.fn(() => query) } as unknown as Pick<SupabaseClient, "from">;
}

describe("approved plan recommendation repository", () => {
  it("uses a JSON array for lesson and unit approved-plan source lookups", async () => {
    const lessonQuery = queryMock();
    const lessonRepository = createSupabaseApprovedPlanRevisionRepository(clientFor(lessonQuery));
    await lessonRepository.getApprovedRevisionForUser("user-1", "idea-1", "source-1", "lesson", "plan-1", 1);
    expect(lessonQuery.contains).toHaveBeenCalledWith("source_ids", sourceIdsContainsValue("source-1"));
    expect(lessonQuery.eq).toHaveBeenCalledWith("final_approved_version", 1);
    expect(lessonQuery.contains).not.toHaveBeenCalledWith("source_ids", "source-1");

    const unitQuery = queryMock();
    const unitRepository = createSupabaseApprovedPlanRevisionRepository(clientFor(unitQuery));
    await unitRepository.getApprovedRevisionForUser("user-1", "idea-1", "source-1", "unit", "plan-1", 1);
    expect(unitQuery.contains).toHaveBeenCalledWith("source_ids", sourceIdsContainsValue("source-1"));
    expect(unitQuery.eq).toHaveBeenCalledWith("final_approved_version", 1);
    expect(unitQuery.contains).not.toHaveBeenCalledWith("source_ids", "source-1");
  });

  it("requires the parent approval pointer and matching approved version", async () => {
    const snapshot = { planType: "lesson", title: "Plan", overview: "Overview", subjects: [], ageStage: "Ages 8-10", duration: 30, durationUnit: "minutes", sequence: [], resourceRequirements: [], generation: { revision: 6 }, review: { workflowStatus: "approved" }, sourceAttribution: {} };
    const planRow = { id: "plan-1", user_id: "user-1", status: "saved", final_approved_version: 6, source_ids: ["source-1"], current_version: 6, provenance: {}, content: snapshot, duration_minutes: 30 };
    const planQuery = queryMock({ data: [planRow], error: null });
    const versionQuery = queryMock({ data: { id: "version-6", version: 6, snapshot, approved_at: "2026-07-23T01:00:00.000Z", approved_by_user_id: "user-1", is_final_approved: true }, error: null });
    const client = { from: vi.fn().mockReturnValueOnce(planQuery).mockReturnValueOnce(versionQuery) } as unknown as Pick<SupabaseClient, "from">;
    const repository = createSupabaseApprovedPlanRevisionRepository(client);
    await expect(repository.getApprovedRevisionForUser("user-1", "idea-1", "source-1", "lesson", "plan-1", 6)).resolves.toMatchObject({ revisionNumber: 6, revisionId: "version-6" });

    const missingPointerQuery = queryMock({ data: [{ ...planRow, final_approved_version: null }], error: null });
    const missingPointerClient = clientFor(missingPointerQuery);
    await expect(createSupabaseApprovedPlanRevisionRepository(missingPointerClient).getApprovedRevisionForUser("user-1", "idea-1", "source-1", "lesson", "plan-1", 6)).resolves.toBeNull();

    const mismatchedVersionQuery = queryMock({ data: [{ ...planRow, final_approved_version: 5 }], error: null });
    await expect(createSupabaseApprovedPlanRevisionRepository(clientFor(mismatchedVersionQuery)).getApprovedRevisionForUser("user-1", "idea-1", "source-1", "lesson", "plan-1", 6)).resolves.toBeNull();
  });

  it("records approved-plan, version, owned-resource, and interaction stages", async () => {
    const diagnostics = { stageStart: vi.fn(), stageSuccess: vi.fn(), stageFailure: vi.fn(), responseReady: vi.fn() };
    const planQuery = queryMock({ data: [{ id: "plan-1", status: "saved", final_approved_version: 1 }], error: null });
    const versionQuery = queryMock({ data: [], error: null });
    const client = { from: vi.fn().mockReturnValueOnce(planQuery).mockReturnValueOnce(versionQuery) } as unknown as Pick<SupabaseClient, "from">;
    await createSupabaseApprovedPlanRevisionRepository(client, diagnostics).getApprovedRevisionForUser("user-1", "idea-1", "source-1", "lesson", "plan-1", 1);
    const approvedStages = diagnostics.stageStart.mock.calls.map(([stage]) => stage);
    expect(approvedStages).toEqual(["approved_plan_lookup", "version_lookup"]);

    const ownedQuery = queryMock({ data: [], error: null });
    await createSupabaseFamilyOwnedResourceRepository(clientFor(ownedQuery), diagnostics).listForUser("user-1");
    const interactionQuery = queryMock({ data: [], error: null });
    await createSupabaseRecommendationInteractionRepository(clientFor(interactionQuery), diagnostics).listForRevision("user-1", "plan-1", "version-1");
    expect(diagnostics.stageStart.mock.calls.map(([stage]) => stage)).toEqual(["approved_plan_lookup", "version_lookup", "owned_resources_lookup", "interaction_lookup"]);
    expect(diagnostics.stageFailure).not.toHaveBeenCalled();
  });
});
