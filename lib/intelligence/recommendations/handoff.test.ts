import { describe, expect, it } from "vitest";
import type { GeneratedPlanContent } from "@/lib/intelligence/plans/types";
import type { ApprovedPlanRevision } from "@/lib/intelligence/recommendations/types";
import { buildLearningPlanRecommendationInput, RecommendationHandoffError } from "@/lib/intelligence/recommendations/handoff";

function content(planType: "lesson" | "unit" = "lesson", status: "approved" | "generated_draft" = "approved"): GeneratedPlanContent {
  return {
    planType, title: "Weather lab", overview: "Observe the weather.", subjects: ["Science"], ageStage: "Ages 8-10", duration: 45, durationUnit: "minutes",
    learningIntentions: ["Observe patterns."], successCriteria: ["Explain one pattern."], sequence: [{ title: "Observe", objective: "Notice changes.", activity: "Record the sky.", durationMinutes: 20, notes: "" }],
    resourceRequirements: [{ name: "Pencils", category: "Materials", quantity: "2", required: true, url: null, notes: "" }, { name: "Digital weather map", category: "free digital", quantity: null, required: false, url: "https://example.com", notes: "" }],
    preparation: ["Print a chart."], discussionQuestions: [], differentiation: [], assessmentApproach: "Discuss the chart.", evidencePrompts: ["Capture the chart."], portfolioPrompts: ["Reflect on the observation."], safetySupervisionNotes: ["Check conditions."], limitationsAssumptions: [], sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com/article", finalUrl: "https://example.com/article", canonicalUrl: null, title: "Weather", provider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" }, parentInstructions: "Keep it practical.", generation: { provider: "template", model: "template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision: 4 }, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" }, review: { workflowStatus: status, originalGeneratedRevision: 1, revisionKind: "parent_edit", changedFields: ["title"], lastEditedAt: "2026-07-23T00:00:00.000Z", lastEditedByUserId: "user-1", safetyAcknowledged: true, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" } },
  };
}

function snapshot(planType: "lesson" | "unit" = "lesson", workflow: "approved" | "generated_draft" = "approved", status: "saved" | "draft" | "archived" = "saved"): ApprovedPlanRevision {
  return {
    userId: "user-1", ideaId: "idea-1", sourceId: "source-1", planId: "plan-1", planType, revisionId: "version-row-4", revisionNumber: 4, status, content: content(planType, workflow) as unknown as Record<string, unknown>, provenance: { sources: [{ sourceId: "source-1", sourceUrl: "https://example.com/article", sourceTitle: "Weather", sourceProvider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" }], generation: { model: "template:template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z" }, parentEdits: [], finalApprovedVersion: 4, finalApprovedAt: "2026-07-23T01:00:00.000Z", finalApprovedByUserId: "user-1" }, approvedAt: "2026-07-23T01:00:00.000Z",
  };
}

describe("LearningPlanRecommendationInput handoff", () => {
  it("creates valid lesson and unit inputs with the exact revision and provenance", () => {
    for (const planType of ["lesson", "unit"] as const) {
      const input = buildLearningPlanRecommendationInput(snapshot(planType));
      expect(input).toMatchObject({ planId: "plan-1", planType, revisionId: "version-row-4", revisionNumber: 4, approvedAt: "2026-07-23T01:00:00.000Z", schemaVersion: "mylearna-learning-plan-recommendation-input-v1" });
      expect(input.sourceProvenance.sources[0].sourceUrl).toBe("https://example.com/article");
      expect(input.requiredResources[0].resourceKey).toBe("pencil");
    }
  });

  it("rejects unapproved, draft, archived, and malformed plans", () => {
    expect(() => buildLearningPlanRecommendationInput(snapshot("lesson", "generated_draft"))).toThrowError(RecommendationHandoffError);
    expect(() => buildLearningPlanRecommendationInput(snapshot("lesson", "approved", "draft"))).toThrowError(RecommendationHandoffError);
    expect(() => buildLearningPlanRecommendationInput(snapshot("lesson", "approved", "archived"))).toThrowError(RecommendationHandoffError);
    const malformed = snapshot();
    malformed.content = { ...malformed.content, subjects: [] };
    expect(() => buildLearningPlanRecommendationInput(malformed)).toThrowError(RecommendationHandoffError);
  });
});
