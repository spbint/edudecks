import { describe, expect, it } from "vitest";
import { buildLearningPlanRecommendationInput } from "@/lib/intelligence/recommendations/handoff";
import { createDeterministicRecommendationEngine } from "@/lib/intelligence/recommendations/engine";
import { normaliseResourceKey } from "@/lib/intelligence/recommendations/normalization";
import type { ApprovedPlanRevision, FamilyOwnedResource, RecommendationInteractionState } from "@/lib/intelligence/recommendations/types";

function snapshot(): ApprovedPlanRevision {
  return {
    userId: "user-1", ideaId: "idea-1", sourceId: "source-1", planId: "plan-1", planType: "lesson", revisionId: "version-row-4", revisionNumber: 4, status: "saved", approvedAt: "2026-07-23T01:00:00.000Z",
    content: { planType: "lesson", title: "Plan", overview: "Overview", subjects: ["Science"], ageStage: "Ages 8-10", duration: 30, durationUnit: "minutes", learningIntentions: ["Learn"], successCriteria: ["Explain"], sequence: [{ title: "Do", objective: "Try", activity: "Make a model", durationMinutes: 20, notes: "" }], resourceRequirements: [{ name: "Pencils", category: "Materials", quantity: null, required: true, url: null, notes: "" }, { name: "Paper", category: "Materials", quantity: null, required: true, url: null, notes: "" }, { name: "Microscope", category: "Essential", quantity: null, required: true, url: null, notes: "" }, { name: "Free weather site", category: "free digital", quantity: null, required: false, url: "https://example.com", notes: "" }], preparation: ["Clear a table."], discussionQuestions: [], differentiation: [], assessmentApproach: "Observe", evidencePrompts: ["Capture evidence."], portfolioPrompts: ["Reflect."], safetySupervisionNotes: ["Supervise outdoors."], limitationsAssumptions: [], sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com", finalUrl: null, canonicalUrl: null, title: "Source", provider: "Example", extractedAt: null }, parentInstructions: null, generation: { provider: "test", model: "test", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision: 4 }, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" }, review: { workflowStatus: "approved", originalGeneratedRevision: 1, revisionKind: "parent_edit", changedFields: [], lastEditedAt: null, lastEditedByUserId: null, safetyAcknowledged: true, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" } } } as unknown as Record<string, unknown>,
    provenance: { sources: [{ sourceId: "source-1", sourceUrl: "https://example.com", sourceTitle: "Source", sourceProvider: "Example", extractedAt: null }], generation: { model: "test:test", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z" }, parentEdits: [], finalApprovedVersion: 4, finalApprovedAt: "2026-07-23T01:00:00.000Z", finalApprovedByUserId: "user-1" },
  };
}

const owned: FamilyOwnedResource[] = [{ id: "owned-1", userId: "user-1", name: "Pencils", normalizedResourceKey: normaliseResourceKey("pencils"), category: "Materials", quantity: "2", condition: null, active: true, source: "parent", provenance: {}, createdAt: "", updatedAt: "" }];

describe("deterministic Recommendation Engine", () => {
  it("classifies owned synonyms, household/free alternatives, and missing essentials", () => {
    const engine = createDeterministicRecommendationEngine();
    const input = buildLearningPlanRecommendationInput(snapshot());
    const result = engine.generateRecommendations(input, { ownedResources: owned, now: () => new Date("2026-07-23T02:00:00.000Z") });
    const pencils = result.recommendations.find((item) => item.title === "Pencils");
    const microscope = result.recommendations.find((item) => item.title === "Microscope");
    const paper = result.recommendations.find((item) => item.title === "Paper");
    const free = result.recommendations.find((item) => item.title === "Free weather site");
    expect(pencils?.resourceClassification).toBe("already_owned");
    expect(microscope?.resourceClassification).toBe("missing_essential");
    expect(paper?.resourceClassification).toBe("household_common");
    expect(free?.resourceClassification).toBe("free_digital");
    expect((pencils?.priorityRank ?? 999) < (microscope?.priorityRank ?? 0)).toBe(true);
    expect((paper?.priorityRank ?? 999) < (microscope?.priorityRank ?? 0)).toBe(true);
  });

  it("honours a parent rejection of an incorrect owned match", () => {
    const input = buildLearningPlanRecommendationInput(snapshot());
    const engine = createDeterministicRecommendationEngine();
    const itemId = "plan-1:4:required-resource:0:pencil";
    const interaction: RecommendationInteractionState = { recommendationId: itemId, ownedDecision: "not_owned", saved: false, dismissed: false, prepared: false, completed: false };
    const result = engine.generateRecommendations(input, { ownedResources: owned, interactionStates: { [itemId]: interaction } });
    expect(result.recommendations.find((item) => item.recommendationId === itemId)?.resourceClassification).toBe("missing_essential");
  });

  it("ranks safety first and hides dismissed items until restored", () => {
    const input = buildLearningPlanRecommendationInput(snapshot());
    const engine = createDeterministicRecommendationEngine();
    const first = engine.generateRecommendations(input, { ownedResources: [] });
    expect(first.recommendations[0].objectType).toBe("safety_supervision_action");
    const safetyId = first.recommendations.find((item) => item.objectType === "safety_supervision_action")!.recommendationId;
    const dismissed = engine.generateRecommendations(input, { ownedResources: [], interactionStates: { [safetyId]: { recommendationId: safetyId, ownedDecision: null, saved: false, dismissed: true, prepared: false, completed: false } } });
    expect(dismissed.recommendations.some((item) => item.recommendationId === safetyId)).toBe(false);
    expect(dismissed.dismissedRecommendations.some((item) => item.recommendationId === safetyId)).toBe(true);
    const restored = engine.generateRecommendations(input, { ownedResources: [], interactionStates: { [safetyId]: { recommendationId: safetyId, ownedDecision: null, saved: false, dismissed: false, prepared: false, completed: false } } });
    expect(restored.recommendations.some((item) => item.recommendationId === safetyId)).toBe(true);
  });
});
