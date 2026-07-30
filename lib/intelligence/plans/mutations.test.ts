import { describe, expect, it } from "vitest";
import { planStatusTransition } from "@/lib/intelligence/plans/mutations";
import type { PlanLibraryEntry } from "@/lib/intelligence/plans/library";

function entry(status: "draft" | "saved" | "archived" = "draft"): PlanLibraryEntry {
  const content = {
    planType: "lesson" as const,
    title: "Plan",
    overview: "",
    subjects: [],
    ageStage: "Ages 8-10",
    duration: 45,
    durationUnit: "minutes" as const,
    learningIntentions: [], successCriteria: [], sequence: [], resourceRequirements: [], preparation: [],
    discussionQuestions: [], differentiation: [], assessmentApproach: "", evidencePrompts: [], portfolioPrompts: [],
    safetySupervisionNotes: [],
    sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com", finalUrl: null, canonicalUrl: null, title: null, provider: null, extractedAt: null },
    limitationsAssumptions: [], parentInstructions: null,
    generation: { provider: "fixture", model: "fixture", modelVersion: "1", promptVersion: "1", schemaVersion: "1", generatedAt: "2026-07-30T00:00:00Z", revision: 4 },
    validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-30T00:00:00Z" },
  };
  return {
    planType: "lesson",
    plan: { id: "plan-1", userId: "user-1", ideaId: "idea-1", title: "Plan", summary: "", learningArea: "Science", yearLevel: "Ages 8-10", objectives: [], sourceIds: ["source-1"], sequence: [], resources: [], status, version: 4, provenance: {} as never, content: content as never, createdAt: "", updatedAt: "" },
    content,
    workflowStatus: null,
    displayStatus: status === "archived" ? "Archived" : status === "saved" ? "Ready to use" : "Draft",
    readyToUse: status === "saved",
    sourceUrl: "https://example.com", sourceTitle: null, sourceProvider: null,
    reviewHref: null, detailHref: "/my-plans/lesson/plan-1", sourceIdeaId: "idea-1", sourceId: "source-1", duration: 45, durationUnit: "minutes",
  };
}

describe("plan status mutations", () => {
  it("marks ready, archives, and restores without changing the version", () => {
    const ready = planStatusTransition(entry(), "ready");
    expect(ready.status).toBe("saved");
    expect(ready.content.review?.workflowStatus).toBe("ready_to_use");
    expect(ready.content.review?.readyToUsePreviousStatus).toBe("draft");
    expect(ready.version).toBe(4);

    const archived = planStatusTransition(entry("saved"), "archive");
    expect(archived.status).toBe("archived");
    expect(archived.content.review?.workflowStatus).toBe("archived");

    const saved = entry("saved");
    saved.content.review = { workflowStatus: "ready_to_use", originalGeneratedRevision: 4, revisionKind: "generated", changedFields: [], lastEditedAt: null, lastEditedByUserId: null, safetyAcknowledged: true, validation: saved.content.validation, readyToUsePreviousStatus: "saved" };
    const restored = planStatusTransition(saved, "restore");
    expect(restored.status).toBe("saved");
    expect(restored.content.review?.workflowStatus).toBe("ready_to_use");
  });
});

