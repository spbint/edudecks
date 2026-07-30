import { describe, expect, it } from "vitest";
import { toPlanLibraryEntry } from "@/lib/intelligence/plans/library";
import type { LessonPlan, UnitPlan } from "@/lib/intelligence/types";

function content(planType: "lesson" | "unit", workflowStatus: "generated_draft" | "ready_to_use" | "approved" | "archived") {
  return {
    planType, title: `${planType} investigation`, overview: "A safe plan.", subjects: ["Science"], ageStage: "Ages 8–10", duration: planType === "lesson" ? 45 : 2, durationUnit: planType === "lesson" ? "minutes" as const : "weeks" as const,
    learningIntentions: ["Explore"], successCriteria: ["Explain"], sequence: [], resourceRequirements: [], preparation: [], discussionQuestions: [], differentiation: [], assessmentApproach: "Observe", evidencePrompts: [], portfolioPrompts: [], safetySupervisionNotes: [], sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com/activity", finalUrl: null, canonicalUrl: null, title: "Activity", provider: "Example", extractedAt: null }, limitationsAssumptions: [], parentInstructions: null, generation: { provider: "fixture", model: "fixture", modelVersion: "1", promptVersion: "1", schemaVersion: "1", generatedAt: "2026-07-30T00:00:00Z", revision: 1 }, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-30T00:00:00Z" }, review: { workflowStatus, originalGeneratedRevision: 1, revisionKind: "generated" as const, changedFields: [], lastEditedAt: null, lastEditedByUserId: null, safetyAcknowledged: true, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-30T00:00:00Z" } },
  };
}

function plan(planType: "lesson" | "unit", status: "draft" | "saved" | "archived", workflowStatus: "generated_draft" | "ready_to_use" | "approved" | "archived") {
  const value = { id: `${planType}-1`, userId: "user-1", ideaId: "idea-1", title: "Plan", summary: "A plan", learningArea: "Science", yearLevel: "Ages 8–10", objectives: [], sourceIds: ["source-1"], sequence: [], resources: [], status, version: 1, provenance: {} as never, content: content(planType, workflowStatus) as never, createdAt: "2026-07-30T00:00:00Z", updatedAt: "2026-07-30T00:00:00Z" };
  return value as unknown as LessonPlan & UnitPlan;
}

describe("Idea-to-Learning plan library", () => {
  it("maps lesson and unit entries to independent detail routes and lifecycle labels", () => {
    const lesson = toPlanLibraryEntry(plan("lesson", "saved", "ready_to_use"), "lesson");
    const unit = toPlanLibraryEntry(plan("unit", "draft", "generated_draft"), "unit");
    expect(lesson.displayStatus).toBe("Ready to use");
    expect(lesson.detailHref).toBe("/my-plans/lesson/lesson-1");
    expect(unit.displayStatus).toBe("Draft");
    expect(unit.detailHref).toBe("/my-plans/unit/unit-1");
  });

  it("keeps legacy approved plans usable and archived plans archived", () => {
    expect(toPlanLibraryEntry(plan("lesson", "saved", "approved"), "lesson").readyToUse).toBe(true);
    expect(toPlanLibraryEntry(plan("unit", "archived", "archived"), "unit").displayStatus).toBe("Archived");
  });
});
