import { describe, expect, it, vi } from "vitest";
import type { LessonPlan, PlanProvenance, UnitPlan } from "@/lib/intelligence/types";
import type { GeneratedPlanContent } from "@/lib/intelligence/plans/types";
import { createPlanReviewService } from "@/lib/intelligence/plans/reviewService";
import type { LearningPlanReviewRepository, PlanReviewEnvelope } from "@/lib/intelligence/plans/reviewTypes";

function content(planType: "lesson" | "unit" = "lesson", revision = 1): GeneratedPlanContent {
  return {
    planType, title: "Weather lab", overview: "Explore observations.", subjects: ["Science"], ageStage: "Ages 8-10", duration: 45, durationUnit: "minutes",
    learningIntentions: ["Observe patterns."], successCriteria: ["Explain one pattern."],
    sequence: [{ title: "Observe", objective: "Notice changes.", activity: "Record the sky.", durationMinutes: 20, notes: "" }],
    resourceRequirements: [{ name: "Paper", category: "Materials", quantity: "1", required: true, url: null, notes: "" }],
    preparation: [], discussionQuestions: [], differentiation: [], assessmentApproach: "Discuss the chart.", evidencePrompts: [], portfolioPrompts: [], safetySupervisionNotes: ["Check conditions."], limitationsAssumptions: [],
    sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com/article", finalUrl: "https://example.com/final", canonicalUrl: "https://example.com/canonical", title: "Weather", provider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" },
    parentInstructions: "Keep it practical.", generation: { provider: "template", model: "template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision },
    validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" },
    review: { workflowStatus: "generated_draft", originalGeneratedRevision: 1, revisionKind: "generated", changedFields: [], lastEditedAt: null, lastEditedByUserId: null, safetyAcknowledged: false, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" } },
  };
}

const provenance: PlanProvenance = { sources: [{ sourceId: "source-1", sourceUrl: "https://example.com/article", sourceTitle: "Weather", sourceProvider: "Example", extractedAt: "2026-07-23T00:00:00.000Z" }], generation: { model: "template:template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z" }, parentEdits: [], finalApprovedVersion: null, finalApprovedAt: null, finalApprovedByUserId: null };

function draft(contentValue: GeneratedPlanContent, version = 1) {
  return { id: "plan-1", userId: "user-1", ideaId: "idea-1", title: contentValue.title, summary: contentValue.overview, learningArea: "Science", yearLevel: contentValue.ageStage, objectives: contentValue.learningIntentions, durationMinutes: contentValue.duration, sourceIds: ["source-1"], sequence: [], resources: [], status: "draft" as const, version, provenance, content: contentValue as unknown as Record<string, unknown>, createdAt: "2026-07-23T00:00:00.000Z", updatedAt: "2026-07-23T00:00:00.000Z" } as unknown as LessonPlan;
}

function envelope(planType: "lesson" | "unit" = "lesson", version = 1): PlanReviewEnvelope {
  const nextContent = content(planType, version);
  return { plan: planType === "lesson" ? draft(nextContent, version) : { ...draft(nextContent, version), durationMinutes: undefined } as unknown as UnitPlan, workflowStatus: nextContent.review!.workflowStatus, currentRevision: version, originalGeneratedRevision: 1, review: nextContent.review!, provenance };
}

function repository(initial = envelope()) {
  let current = initial;
  const snapshots: GeneratedPlanContent[] = [];
  let versionWrites = 0;
  const repository: LearningPlanReviewRepository = {
    getReviewPlanForUser: vi.fn(async (userId) => userId === "user-1" ? current : null),
    saveParentEditForUser: vi.fn(async (_userId, previous, nextContent, nextProvenance, expectedRevision) => {
      versionWrites += 1;
      snapshots.push(previous.plan.content as unknown as GeneratedPlanContent);
      const next = { ...current, plan: { ...current.plan, version: expectedRevision + 1, content: nextContent as unknown as Record<string, unknown>, provenance: nextProvenance }, currentRevision: expectedRevision + 1, workflowStatus: nextContent.review!.workflowStatus, review: nextContent.review!, provenance: nextProvenance };
      current = next;
      return next;
    }),
    updateReviewStateForUser: vi.fn(async (_userId, _previous, workflowStatus, nextContent, nextProvenance) => {
      current = { ...current, plan: { ...current.plan, content: nextContent as unknown as Record<string, unknown>, provenance: nextProvenance, status: workflowStatus === "approved" ? "saved" : workflowStatus === "archived" ? "archived" : "draft" } as typeof current.plan, workflowStatus, review: nextContent.review!, provenance: nextProvenance };
      return current;
    }),
  };
  return { repository, snapshots, get current() { return current; }, get versionWrites() { return versionWrites; } };
}

const now = () => new Date("2026-07-23T01:00:00.000Z");

describe("plan review service", () => {
  it("loads lesson and unit drafts through the ownership-scoped repository", async () => {
    const lesson = repository(envelope("lesson"));
    const unit = repository(envelope("unit"));
    expect((await createPlanReviewService({ repository: lesson.repository }).getForUser("user-1", "idea-1", "source-1", "lesson"))?.plan.content).toBeTruthy();
    expect((await createPlanReviewService({ repository: unit.repository }).getForUser("user-1", "idea-1", "source-1", "unit"))?.plan.content).toBeTruthy();
    await expect(createPlanReviewService({ repository: lesson.repository }).getForUser("user-2", "idea-1", "source-1", "lesson")).resolves.toBeNull();
  });

  it("saves a parent edit as a new revision without changing the original snapshot", async () => {
    const state = repository();
    const service = createPlanReviewService({ repository: state.repository, now });
    const edited = { ...content(), title: "Updated weather lab" };
    const result = await service.performAction("user-1", "idea-1", "source-1", "lesson", { action: "save", expectedRevision: 1, content: edited, safetyAcknowledged: false });
    expect(result.state).toBe("saved");
    expect(result.currentRevision).toBe(2);
    expect(state.snapshots[0].title).toBe("Weather lab");
    expect(result.provenance.parentEdits[0]).toMatchObject({ version: 2, editedByUserId: "user-1", fields: ["title"] });
  });

  it("validates, approves valid plans, and blocks missing safety acknowledgement", async () => {
    const state = repository();
    const service = createPlanReviewService({ repository: state.repository, now });
    const ready = await service.performAction("user-1", "idea-1", "source-1", "lesson", { action: "validate", expectedRevision: 1 });
    expect(ready.workflowStatus).toBe("ready_for_approval");
    await expect(service.performAction("user-1", "idea-1", "source-1", "lesson", { action: "approve", expectedRevision: 1, safetyAcknowledged: false })).rejects.toMatchObject({ code: "approval_blocked" });
    const approved = await service.performAction("user-1", "idea-1", "source-1", "lesson", { action: "approve", expectedRevision: 1, safetyAcknowledged: true });
    expect(approved.state).toBe("approved");
    expect(approved.provenance.finalApprovedVersion).toBe(1);
  });

  it("saves at revision N then approves a status-only request at revision N+1", async () => {
    const state = repository();
    const service = createPlanReviewService({ repository: state.repository, now });
    const saved = await service.performAction("user-1", "idea-1", "source-1", "lesson", {
      action: "save",
      expectedRevision: 1,
      content: { ...content(), title: "Updated weather lab" },
      safetyAcknowledged: true,
    });

    const approved = await service.performAction("user-1", "idea-1", "source-1", "lesson", {
      action: "approve",
      expectedRevision: saved.currentRevision,
      safetyAcknowledged: true,
      contentProvided: false,
    });

    expect(saved.currentRevision).toBe(2);
    expect(approved.state).toBe("approved");
    expect(state.repository.saveParentEditForUser).toHaveBeenCalledTimes(1);
    expect(state.repository.updateReviewStateForUser).toHaveBeenCalledWith(
      "user-1",
      expect.anything(),
      "approved",
      expect.anything(),
      expect.anything(),
      2,
    );
    expect(state.versionWrites).toBe(1);
  });

  it("allows status-only transitions to normalize persisted content without reporting unsaved edits", async () => {
    for (const action of ["validate", "archive", "return_to_draft"] as const) {
      const persisted = { ...content(), title: "  Weather lab  " };
      const state = repository(envelope("lesson", 2));
      state.current.plan.content = persisted as unknown as Record<string, unknown>;
      const service = createPlanReviewService({ repository: state.repository, now });

      const result = await service.performAction("user-1", "idea-1", "source-1", "lesson", {
        action,
        expectedRevision: 2,
        safetyAcknowledged: action === "validate" ? false : false,
        contentProvided: false,
      });

      expect(result.state).toBe(action === "validate" ? "validated" : action === "archive" ? "archived" : "returned_to_draft");
    }
  });

  it("still blocks an explicit changed content candidate", async () => {
    const state = repository();
    const service = createPlanReviewService({ repository: state.repository, now });

    await expect(service.performAction("user-1", "idea-1", "source-1", "lesson", {
      action: "approve",
      expectedRevision: 1,
      content: { ...content(), title: "Changed after load" },
      contentProvided: true,
      safetyAcknowledged: true,
    })).rejects.toMatchObject({ code: "invalid_input", message: "Save your edits before validating or changing the plan status." });
    expect(state.repository.updateReviewStateForUser).not.toHaveBeenCalled();
  });

  it("still blocks invalid persisted content, stale revisions, and missing safety acknowledgement", async () => {
    const invalidState = repository();
    invalidState.current.plan.content = { ...content(), title: "" } as unknown as Record<string, unknown>;
    const invalidService = createPlanReviewService({ repository: invalidState.repository, now });
    await expect(invalidService.performAction("user-1", "idea-1", "source-1", "lesson", {
      action: "validate",
      expectedRevision: 1,
      contentProvided: false,
    })).rejects.toMatchObject({ code: "validation_failed" });

    const staleState = repository();
    const staleService = createPlanReviewService({ repository: staleState.repository, now });
    await expect(staleService.performAction("user-1", "idea-1", "source-1", "lesson", {
      action: "approve",
      expectedRevision: 9,
      contentProvided: false,
      safetyAcknowledged: true,
    })).rejects.toMatchObject({ code: "stale_revision" });

    const safetyState = repository();
    const safetyService = createPlanReviewService({ repository: safetyState.repository, now });
    await expect(safetyService.performAction("user-1", "idea-1", "source-1", "lesson", {
      action: "approve",
      expectedRevision: 1,
      contentProvided: false,
      safetyAcknowledged: false,
    })).rejects.toMatchObject({ code: "approval_blocked" });
  });

  it("does not create duplicate plan versions when approval is retried", async () => {
    const state = repository();
    const service = createPlanReviewService({ repository: state.repository, now });
    const approved = await service.performAction("user-1", "idea-1", "source-1", "lesson", {
      action: "approve",
      expectedRevision: 1,
      contentProvided: false,
      safetyAcknowledged: true,
    });
    await service.performAction("user-1", "idea-1", "source-1", "lesson", {
      action: "approve",
      expectedRevision: approved.currentRevision,
      contentProvided: false,
      safetyAcknowledged: true,
    });

    expect(state.versionWrites).toBe(0);
    expect(state.repository.updateReviewStateForUser).toHaveBeenCalledTimes(2);
  });

  it("rejects stale updates and preserves provenance from client edits", async () => {
    const state = repository();
    const service = createPlanReviewService({ repository: state.repository, now });
    await expect(service.performAction("user-1", "idea-1", "source-1", "lesson", { action: "save", expectedRevision: 4, content: content() })).rejects.toMatchObject({ code: "stale_revision" });
    const edited = { ...content(), sourceAttribution: { ...content().sourceAttribution, originalUrl: "https://bad.example" }, generation: { ...content().generation, model: "bad" } };
    const result = await service.performAction("user-1", "idea-1", "source-1", "lesson", { action: "save", expectedRevision: 1, content: edited });
    expect((result.plan.content as unknown as GeneratedPlanContent).sourceAttribution.originalUrl).toBe("https://example.com/article");
    expect((result.plan.content as unknown as GeneratedPlanContent).generation.model).toBe("template");
  });

  it("returns an approved plan to draft and archives it", async () => {
    const state = repository();
    const service = createPlanReviewService({ repository: state.repository, now });
    const returned = await service.performAction("user-1", "idea-1", "source-1", "lesson", { action: "return_to_draft", expectedRevision: 1 });
    expect(returned.workflowStatus).toBe("returned_to_draft");
    const archived = await service.performAction("user-1", "idea-1", "source-1", "lesson", { action: "archive", expectedRevision: 1 });
    expect(archived.workflowStatus).toBe("archived");
  });
});
