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
});
