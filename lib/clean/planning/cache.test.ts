import { describe, expect, it } from "vitest";
import {
  buildCleanPlanningCacheKey,
  clearCleanPlanningCache,
  getOrCreateCleanPlanningCalendarItemsRequest,
  getCleanPlanningCacheAge,
  readCleanPlanningCalendarItems,
  writeCleanPlanningCalendarItems,
} from "@/lib/clean/planning/cache";

describe("clean planning cache scope", () => {
  it("separates account, family, route, and visible date scopes", () => {
    const dayKey = buildCleanPlanningCacheKey({
      userId: "user-a",
      familyId: "family-a",
      route: "day",
      fromDate: "2026-07-23",
      toDate: "2026-07-23",
    });
    const calendarKey = buildCleanPlanningCacheKey({
      userId: "user-a",
      familyId: "family-a",
      route: "calendar",
      fromDate: "2026-07-20",
      toDate: "2026-07-26",
      view: "week",
    });

    expect(dayKey).not.toBe(calendarKey);
    expect(
      buildCleanPlanningCacheKey({
        userId: "user-b",
        familyId: "family-a",
        route: "day",
        fromDate: "2026-07-23",
        toDate: "2026-07-23",
      }),
    ).not.toBe(dayKey);
    expect(
      buildCleanPlanningCacheKey({
        userId: "user-a",
        familyId: "family-a",
        route: "day",
        fromDate: "2026-07-24",
        toDate: "2026-07-24",
      }),
    ).not.toBe(dayKey);
  });

  it("returns warm records immediately and clears them on account changes", () => {
    clearCleanPlanningCache();
    const key = buildCleanPlanningCacheKey({
      userId: "user-a",
      familyId: "family-a",
      route: "day",
      fromDate: "2026-07-23",
      toDate: "2026-07-23",
    });
    const item = {
      id: "item-a",
      familyId: "family-a",
      learnerId: null,
      programId: null,
      programSegmentId: null,
      title: "A planned block",
      description: null,
      startsAt: null,
      endsAt: null,
      plannedDate: "2026-07-23",
      learningArea: null,
      sessionLabel: null,
      sourceType: "manual" as const,
      sourceTemplateBlockId: null,
      sourceProgramSegmentId: null,
      generationRunId: null,
      isHighlighted: false,
      createdByUserId: "user-a",
      createdAt: null,
      updatedAt: null,
    };

    writeCleanPlanningCalendarItems(key, [item]);
    expect(readCleanPlanningCalendarItems(key)).toEqual([item]);
    expect(getCleanPlanningCacheAge(key)).toEqual(expect.any(Number));

    clearCleanPlanningCache();
    expect(readCleanPlanningCalendarItems(key)).toBeNull();
  });

  it("deduplicates the same in-flight visible-range request", async () => {
    clearCleanPlanningCache();
    let resolveRequest!: (value: []) => void;
    const request = new Promise<[]>(resolve => {
      resolveRequest = resolve;
    });
    let factoryCalls = 0;
    const first = getOrCreateCleanPlanningCalendarItemsRequest("same-range", () => {
      factoryCalls += 1;
      return request;
    });
    const second = getOrCreateCleanPlanningCalendarItemsRequest("same-range", () => {
      factoryCalls += 1;
      return request;
    });

    expect(first).toBe(second);
    expect(factoryCalls).toBe(1);
    resolveRequest([]);
    await expect(first).resolves.toEqual([]);
  });
});
