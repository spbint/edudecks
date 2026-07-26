import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sourceIdsContainsValue } from "@/lib/intelligence/plans/repository";
import { createSupabaseApprovedPlanRevisionRepository } from "@/lib/intelligence/recommendations/repository";

function queryMock() {
  const response = { data: [], error: null };
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    contains: vi.fn(() => query),
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
    expect(lessonQuery.contains).not.toHaveBeenCalledWith("source_ids", "source-1");

    const unitQuery = queryMock();
    const unitRepository = createSupabaseApprovedPlanRevisionRepository(clientFor(unitQuery));
    await unitRepository.getApprovedRevisionForUser("user-1", "idea-1", "source-1", "unit", "plan-1", 1);
    expect(unitQuery.contains).toHaveBeenCalledWith("source_ids", sourceIdsContainsValue("source-1"));
    expect(unitQuery.contains).not.toHaveBeenCalledWith("source_ids", "source-1");
  });
});
