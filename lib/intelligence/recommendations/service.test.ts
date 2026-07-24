import { describe, expect, it, vi } from "vitest";
import { createRecommendationService } from "@/lib/intelligence/recommendations/service";
import type { ApprovedPlanRevision, FamilyOwnedResourceRepository, RecommendationInteractionEvent, RecommendationInteractionRepository } from "@/lib/intelligence/recommendations/types";

function snapshot(): ApprovedPlanRevision {
  return {
    userId: "user-1", ideaId: "idea-1", sourceId: "source-1", planId: "plan-1", planType: "lesson", revisionId: "version-row-4", revisionNumber: 4, status: "saved", approvedAt: "2026-07-23T01:00:00.000Z", content: { planType: "lesson", title: "Plan", overview: "Overview", subjects: ["Science"], ageStage: "Ages 8-10", duration: 30, durationUnit: "minutes", learningIntentions: ["Learn"], successCriteria: ["Explain"], sequence: [{ title: "Step", objective: "Try", activity: "Make", durationMinutes: 20, notes: "" }], resourceRequirements: [], preparation: [], discussionQuestions: [], differentiation: [], assessmentApproach: "Observe", evidencePrompts: ["Capture"], portfolioPrompts: ["Reflect"], safetySupervisionNotes: ["Supervise"], limitationsAssumptions: [], sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com", finalUrl: null, canonicalUrl: null, title: "Source", provider: "Example", extractedAt: null }, parentInstructions: "Keep practical", generation: { provider: "test", model: "test", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision: 4 }, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" }, review: { workflowStatus: "approved", originalGeneratedRevision: 1, revisionKind: "parent_edit", changedFields: [], lastEditedAt: null, lastEditedByUserId: null, safetyAcknowledged: true, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" } } } as unknown as Record<string, unknown>, provenance: { sources: [{ sourceId: "source-1", sourceUrl: "https://example.com", sourceTitle: "Source", sourceProvider: "Example", extractedAt: null }], generation: { model: "test:test", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z" }, parentEdits: [], finalApprovedVersion: 4, finalApprovedAt: "2026-07-23T01:00:00.000Z", finalApprovedByUserId: "user-1" },
  };
}

function service(events: RecommendationInteractionEvent[] = []) {
  const ownedResourceRepository: FamilyOwnedResourceRepository = { listForUser: vi.fn(async () => []), createForUser: vi.fn() };
  const interactionRepository: RecommendationInteractionRepository = { listForRevision: vi.fn(async () => events), recordForUser: vi.fn(async (userId, event) => ({ ...event, id: "event-1", userId, createdAt: "2026-07-23T02:00:00.000Z" })) };
  const recommendationService = createRecommendationService({ approvedPlanRepository: { getApprovedRevisionForUser: vi.fn() }, ownedResourceRepository, interactionRepository, now: () => new Date("2026-07-23T02:00:00.000Z") });
  return { recommendationService, interactionRepository };
}

describe("Recommendation service", () => {
  it("retains engine/rules versions, provenance, and the exact approved revision", async () => {
    const state = service();
    const result = await state.recommendationService.getForUser("user-1", snapshot());
    expect(result.input.revisionId).toBe("version-row-4");
    expect(result.input.revisionNumber).toBe(4);
    expect(result.input.sourceProvenance.sources[0].sourceUrl).toBe("https://example.com");
    expect(result.recommendations[0].engineVersion).toBe("mylearna-recommendation-engine-v1");
    expect(result.recommendations[0].rulesVersion).toBe("mylearna-recommendation-rules-v1");
  });

  it("rejects unauthenticated and cross-user access", async () => {
    const state = service();
    await expect(state.recommendationService.getForUser("", snapshot())).rejects.toMatchObject({ code: "not_found" });
    await expect(state.recommendationService.getForUser("user-2", snapshot())).rejects.toMatchObject({ code: "not_found" });
  });

  it("records an interaction event without child data and rejects unknown recommendations", async () => {
    const state = service();
    const result = await state.recommendationService.getForUser("user-1", snapshot());
    const saved = await state.recommendationService.recordEventForUser("user-1", snapshot(), { recommendationId: result.recommendations[0].recommendationId, eventType: "completed" });
    expect(saved).toMatchObject({ planId: "plan-1", revisionId: "version-row-4", revisionNumber: 4, eventType: "completed", engineVersion: "mylearna-recommendation-engine-v1" });
    expect(state.interactionRepository.recordForUser).toHaveBeenCalledOnce();
    await expect(state.recommendationService.recordEventForUser("user-1", snapshot(), { recommendationId: "other-plan:item", eventType: "dismiss" })).rejects.toMatchObject({ code: "invalid_input" });
  });
});
