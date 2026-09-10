import { describe, expect, it } from "vitest";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import { getLearnerViewTodayItems, sortLearnerViewTodayItems } from "./learnerView";

function item(overrides: Partial<CleanCalendarItem> = {}): CleanCalendarItem {
  return {
    id: "item-1",
    familyId: "family-1",
    learnerId: "learner-1",
    title: "Learning",
    plannedDate: "2026-09-10",
    startsAt: null,
    endsAt: null,
    learningArea: "Mathematics",
    description: null,
    sessionLabel: null,
    sourceType: "manual",
    sourceTemplateBlockId: null,
    sourceProgramSegmentId: null,
    generationRunId: null,
    isHighlighted: false,
    marketplaceResourceId: null,
    completedAt: null,
    createdByUserId: "user-1",
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe("learner view day helpers", () => {
  it("includes only the selected learner and whole-family items scheduled today", () => {
    const visible = getLearnerViewTodayItems(
      [
        item({ id: "selected" }),
        item({ id: "family", learnerId: null }),
        item({ id: "other", learnerId: "learner-2" }),
        item({ id: "tomorrow", plannedDate: "2026-09-11" }),
      ],
      "learner-1",
      "2026-09-10",
    );

    expect(visible.map((entry) => entry.id)).toEqual(["selected", "family"]);
  });

  it("sorts timed learning before untimed learning without changing completion state", () => {
    const sorted = sortLearnerViewTodayItems([
      item({ id: "untimed", title: "Untimed" }),
      item({ id: "later", title: "Later", startsAt: "2026-09-10T10:00:00.000Z" }),
      item({ id: "early", title: "Early", startsAt: "2026-09-10T09:00:00.000Z", completedAt: "done" }),
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(["early", "later", "untimed"]);
    expect(sorted[0]?.completedAt).toBe("done");
  });
});
