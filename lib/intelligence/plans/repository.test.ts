import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseLearningPlanRepository,
  planSelect,
  sourceIdsContainsValue,
  toDraft,
  type PlanRow,
} from "@/lib/intelligence/plans/repository";
import { createSupabaseLearningPlanReviewRepository } from "@/lib/intelligence/plans/reviewRepository";
import type { PlanProvenance } from "@/lib/intelligence/types";
import type { GeneratedPlanContent } from "@/lib/intelligence/plans/types";
import type { PlanReviewEnvelope } from "@/lib/intelligence/plans/reviewTypes";

function queryMock(response: { data: unknown; error: unknown } = { data: null, error: null }) {
  const query = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    contains: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => response),
    single: vi.fn(async () => response),
  };
  return query;
}

function clientFor(query: ReturnType<typeof queryMock>) {
  return { from: vi.fn(() => query) } as unknown as Pick<SupabaseClient, "from">;
}

function content(durationUnit: "minutes" | "weeks" = "minutes") {
  return {
    sequence: [],
    resourceRequirements: [],
    duration: durationUnit === "minutes" ? 60 : 3,
    durationUnit,
  };
}

function reviewContent(planType: "lesson" | "unit", revision: number): GeneratedPlanContent {
  return {
    planType,
    title: "Review plan",
    overview: "A reviewable plan.",
    subjects: ["Science"],
    ageStage: "Ages 8-10",
    duration: 60,
    durationUnit: "minutes",
    learningIntentions: [],
    successCriteria: [],
    sequence: [],
    resourceRequirements: [],
    preparation: [],
    discussionQuestions: [],
    differentiation: [],
    assessmentApproach: "Observe.",
    evidencePrompts: [],
    portfolioPrompts: [],
    safetySupervisionNotes: ["Supervise."],
    limitationsAssumptions: [],
    sourceAttribution: { sourceId: "source-1", originalUrl: "https://example.com", finalUrl: null, canonicalUrl: null, title: "Example", provider: "Example", extractedAt: null },
    parentInstructions: "Keep it practical.",
    generation: { provider: "template", model: "template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z", revision },
    validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" },
    review: { workflowStatus: "editing", originalGeneratedRevision: 1, revisionKind: "parent_edit", changedFields: [], lastEditedAt: null, lastEditedByUserId: null, safetyAcknowledged: true, validation: { valid: true, repaired: false, issues: [], validatedAt: "2026-07-23T00:00:00.000Z" } },
  } as GeneratedPlanContent;
}

function currentReview(planType: "lesson" | "unit", revision: number): PlanReviewEnvelope {
  const planContent = reviewContent(planType, revision);
  const provenance: PlanProvenance = { sources: [], generation: { model: "template:template", modelVersion: "v1", promptVersion: "p1", schemaVersion: "s1", generatedAt: "2026-07-23T00:00:00.000Z" }, parentEdits: [], finalApprovedVersion: null, finalApprovedAt: null, finalApprovedByUserId: null };
  return {
    plan: { id: `${planType}-plan-1`, userId: "user-1", ideaId: "idea-1", title: planContent.title, summary: planContent.overview, learningArea: "Science", yearLevel: planContent.ageStage, objectives: [], durationMinutes: planType === "lesson" ? 60 : undefined, durationCount: planType === "unit" ? 1 : undefined, durationUnit: planType === "unit" ? "weeks" : undefined, sourceIds: ["source-1"], sequence: [], resources: [], status: "draft", version: revision, provenance, content: planContent as unknown as Record<string, unknown>, createdAt: "2026-07-23T00:00:00.000Z", updatedAt: "2026-07-23T00:00:00.000Z" } as PlanReviewEnvelope["plan"],
    workflowStatus: "editing",
    currentRevision: revision,
    originalGeneratedRevision: 1,
    review: planContent.review!,
    provenance,
  };
}

function updateQuery(response: { data: unknown; error: unknown }) {
  const query = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => response),
    single: vi.fn(async () => response),
    then: (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) => Promise.resolve(response).then(resolve, reject),
  };
  return query;
}

function approvalClient(planType: "lesson" | "unit", revision: number, previousApprovedVersion: number | null = null, parentUpdateError: unknown = null) {
  const current = currentReview(planType, revision);
  const updatedRow = { id: current.plan.id, user_id: "user-1", idea_id: "idea-1", title: current.plan.title, summary: current.plan.summary, objectives: [], source_ids: ["source-1"], status: "saved", current_version: revision, final_approved_version: revision, provenance: current.provenance, content: current.plan.content, duration_minutes: planType === "lesson" ? 60 : undefined, duration_count: planType === "unit" ? 1 : undefined, duration_unit: planType === "unit" ? "weeks" : undefined };
  const queries = [
    updateQuery({ data: { final_approved_version: previousApprovedVersion }, error: null }),
    updateQuery({ data: previousApprovedVersion ? [{ version: previousApprovedVersion, approved_at: "2026-07-22T00:00:00.000Z", approved_by_user_id: "user-1" }] : [], error: null }),
    updateQuery({ data: null, error: null }),
    updateQuery({ data: { version: revision }, error: null }),
    updateQuery({ data: updatedRow, error: parentUpdateError }),
  ];
  const client = { from: vi.fn(() => queries.shift() ?? updateQuery({ data: null, error: null })) } as unknown as Pick<SupabaseClient, "from">;
  return { client, current, queries };
}

describe("learning plan repository schema contracts", () => {
  it("selects lesson duration_minutes without unit duration columns", async () => {
    const query = queryMock();
    const repository = createSupabaseLearningPlanRepository(clientFor(query));

    await repository.getDraftForUser("user-1", "idea-1", "source-1", "lesson");

    expect(query.select).toHaveBeenCalledWith(planSelect("lesson"));
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("duration_minutes"));
    expect(query.select).not.toHaveBeenCalledWith(expect.stringContaining("duration_count"));
    expect(query.select).not.toHaveBeenCalledWith(expect.stringContaining("duration_unit"));
  });

  it("selects unit duration_count and duration_unit without duration_minutes", async () => {
    const query = queryMock();
    const repository = createSupabaseLearningPlanRepository(clientFor(query));

    await repository.getDraftForUser("user-1", "idea-1", "source-1", "unit");

    expect(query.select).toHaveBeenCalledWith(planSelect("unit"));
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining("duration_count,duration_unit"));
    expect(query.select).not.toHaveBeenCalledWith(expect.stringContaining("duration_minutes"));
  });

  it("uses a JSON array for lesson and unit source_ids containment", async () => {
    const lessonQuery = queryMock();
    const lessonRepository = createSupabaseLearningPlanRepository(clientFor(lessonQuery));
    await lessonRepository.getDraftForUser("user-1", "idea-1", "source-1", "lesson");
    expect(lessonQuery.contains).toHaveBeenCalledWith("source_ids", sourceIdsContainsValue("source-1"));
    expect(lessonQuery.contains).not.toHaveBeenCalledWith("source_ids", "source-1");

    const unitQuery = queryMock();
    const unitRepository = createSupabaseLearningPlanRepository(clientFor(unitQuery));
    await unitRepository.getDraftForUser("user-1", "idea-1", "source-1", "unit");
    expect(unitQuery.contains).toHaveBeenCalledWith("source_ids", sourceIdsContainsValue("source-1"));
    expect(unitQuery.contains).not.toHaveBeenCalledWith("source_ids", "source-1");
  });

  it("uses plan-specific fields for review lookups", async () => {
    const lessonQuery = queryMock();
    const lessonReview = createSupabaseLearningPlanReviewRepository(clientFor(lessonQuery));
    await lessonReview.getReviewPlanForUser("user-1", "idea-1", "source-1", "lesson");
    expect(lessonQuery.select).toHaveBeenCalledWith(planSelect("lesson"));
    expect(lessonQuery.contains).toHaveBeenCalledWith("source_ids", sourceIdsContainsValue("source-1"));

    const unitQuery = queryMock();
    const unitReview = createSupabaseLearningPlanReviewRepository(clientFor(unitQuery));
    await unitReview.getReviewPlanForUser("user-1", "idea-1", "source-1", "unit");
    expect(unitQuery.select).toHaveBeenCalledWith(planSelect("unit"));
    expect(unitQuery.contains).toHaveBeenCalledWith("source_ids", sourceIdsContainsValue("source-1"));
  });

  it("does not insert when the draft lookup fails", async () => {
    const query = queryMock({ data: null, error: { message: "lookup failed" } });
    const repository = createSupabaseLearningPlanRepository(clientFor(query));

    await expect(repository.getDraftForUser("user-1", "idea-1", "source-1", "lesson"))
      .rejects.toThrow("lookup failed");
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("preserves sanitized operation and Supabase metadata on repository errors", async () => {
    const supabaseError = {
      code: "42703",
      message: "column intelligence_lesson_plans.duration_count does not exist for https://internal.example.test",
      details: "schema cache detail for 123e4567-e89b-12d3-a456-426614174000",
      hint: "password=do-not-log",
      status: 400,
    };
    const query = queryMock({ data: null, error: supabaseError });
    const repository = createSupabaseLearningPlanRepository(clientFor(query));

    const caught = await repository
      .getDraftForUser("user-1", "idea-1", "source-1", "lesson")
      .catch((error: unknown) => error);

    expect(caught).toMatchObject({
      name: "LearningPlanRepositoryError",
      operation: "draft_lookup",
      planType: "lesson",
      code: "42703",
      message: "column intelligence_lesson_plans.duration_count does not exist for [REDACTED_URL]",
      details: "schema cache detail for [REDACTED_ID]",
      hint: "[REDACTED]",
      status: 400,
    });
    expect((caught as Error & { cause?: unknown }).cause).toBe(supabaseError);
  });

  it("maps lesson and unit duration columns without cross-reading fields", () => {
    const lesson = toDraft({
      id: "lesson-1",
      user_id: "user-1",
      title: "Lesson",
      summary: "Summary",
      objectives: [],
      source_ids: [],
      status: "draft",
      current_version: 1,
      provenance: {},
      content: content(),
      duration_minutes: 60,
    } as PlanRow, "lesson");
    expect(lesson).toMatchObject({ durationMinutes: 60 });
    expect("durationCount" in lesson).toBe(false);

    const unit = toDraft({
      id: "unit-1",
      user_id: "user-1",
      title: "Unit",
      summary: "Summary",
      objectives: [],
      source_ids: [],
      status: "draft",
      current_version: 1,
      provenance: {},
      content: content("weeks"),
      duration_count: 3,
      duration_unit: "weeks",
    } as PlanRow, "unit");
    expect(unit).toMatchObject({ durationCount: 3, durationUnit: "weeks" });
    expect("durationMinutes" in unit).toBe(false);
  });

  it.each([["lesson"], ["unit"]] as const)("persists the %s parent final approval pointer", async (planType) => {
    const state = approvalClient(planType, 6);
    const repository = createSupabaseLearningPlanReviewRepository(state.client);
    const result = await repository.updateReviewStateForUser("user-1", state.current, "approved", state.current.plan.content as unknown as GeneratedPlanContent, state.current.provenance, 6);
    const parentUpdate = (state.client.from as ReturnType<typeof vi.fn>).mock.results[4].value;
    expect(parentUpdate.update).toHaveBeenCalledWith(expect.objectContaining({ final_approved_version: 6 }));
    expect(result.plan.status).toBe("saved");
  });

  it("repairs a missing parent pointer without inserting a new version", async () => {
    const state = approvalClient("lesson", 6);
    const repository = createSupabaseLearningPlanReviewRepository(state.client);
    await repository.updateReviewStateForUser("user-1", state.current, "approved", state.current.plan.content as unknown as GeneratedPlanContent, state.current.provenance, 6);
    expect((state.client.from as ReturnType<typeof vi.fn>).mock.calls.some(([table]) => table === "intelligence_plan_versions")).toBe(true);
    expect((state.client.from as ReturnType<typeof vi.fn>).mock.calls.filter(([table]) => table === "intelligence_plan_versions").length).toBe(3);
    expect((state.client.from as ReturnType<typeof vi.fn>).mock.results.some((result) => result.value.insert?.mock.calls.length)).toBe(false);
  });

  it("clears a previous approved version before approving a newer revision", async () => {
    const state = approvalClient("unit", 7, 6);
    const repository = createSupabaseLearningPlanReviewRepository(state.client);
    await repository.updateReviewStateForUser("user-1", state.current, "approved", state.current.plan.content as unknown as GeneratedPlanContent, state.current.provenance, 7);
    const versionQueries = (state.client.from as ReturnType<typeof vi.fn>).mock.results.filter((_result, index) => (state.client.from as ReturnType<typeof vi.fn>).mock.calls[index][0] === "intelligence_plan_versions").map((result) => result.value);
    expect(versionQueries[1].update).toHaveBeenCalledWith(expect.objectContaining({ is_final_approved: false }));
    expect(versionQueries[2].update).toHaveBeenCalledWith(expect.objectContaining({ is_final_approved: true }));
  });

  it("does not report approval success when the parent pointer update fails", async () => {
    const state = approvalClient("lesson", 6, null, { code: "42501", message: "permission denied" });
    const repository = createSupabaseLearningPlanReviewRepository(state.client);
    await expect(repository.updateReviewStateForUser("user-1", state.current, "approved", state.current.plan.content as unknown as GeneratedPlanContent, state.current.provenance, 6)).rejects.toThrow("permission denied");
  });
});
