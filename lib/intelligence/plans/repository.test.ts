import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseLearningPlanRepository,
  planSelect,
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

  it("uses plan-specific fields for review lookups", async () => {
    const lessonQuery = queryMock();
    const lessonReview = createSupabaseLearningPlanReviewRepository(clientFor(lessonQuery));
    await lessonReview.getReviewPlanForUser("user-1", "idea-1", "source-1", "lesson");
    expect(lessonQuery.select).toHaveBeenCalledWith(planSelect("lesson"));

    const unitQuery = queryMock();
    const unitReview = createSupabaseLearningPlanReviewRepository(clientFor(unitQuery));
    await unitReview.getReviewPlanForUser("user-1", "idea-1", "source-1", "unit");
    expect(unitQuery.select).toHaveBeenCalledWith(planSelect("unit"));
  });

  it("does not insert when the draft lookup fails", async () => {
    const query = queryMock({ data: null, error: { message: "lookup failed" } });
    const repository = createSupabaseLearningPlanRepository(clientFor(query));

    await expect(repository.getDraftForUser("user-1", "idea-1", "source-1", "lesson"))
      .rejects.toThrow("lookup failed");
    expect(query.insert).not.toHaveBeenCalled();
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
