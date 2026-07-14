import { describe, expect, it } from "vitest";

import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import type { CleanTemplateBlock } from "@/lib/clean/templates/types";
import {
  buildCleanWeeklyPlannerEntriesFromCalendarItems,
  buildCleanWeeklyPlannerEntriesFromTemplateBlocks,
} from "@/lib/clean/outputs/weeklyPlanner";

const baseCalendarItem: CleanCalendarItem = {
  id: "item-1",
  familyId: "family-1",
  learnerId: "learner-1",
  programId: null,
  programSegmentId: null,
  title: "Maths block",
  description: null,
  startsAt: "10:00",
  endsAt: "11:00",
  plannedDate: "2026-07-14",
  learningArea: "Numeracy",
  sessionLabel: null,
  sourceType: "manual",
  sourceTemplateBlockId: null,
  sourceProgramSegmentId: null,
  generationRunId: null,
  isHighlighted: false,
  createdByUserId: "user-1",
  createdAt: null,
  updatedAt: null,
};

const baseTemplateBlock: CleanTemplateBlock = {
  id: "block-1",
  familyId: "family-1",
  masterTemplateId: "template-1",
  learnerId: null,
  weekday: 2,
  title: "Reading block",
  learningArea: "Literacy",
  startsAt: null,
  endsAt: null,
  programId: null,
  programSegmentId: null,
  notes: null,
  sessionLabel: null,
  createdByUserId: "user-1",
  createdAt: null,
  updatedAt: null,
};

describe("weekly planner entries", () => {
  it("uses shared calendar time and learning-area labels for live calendar items", () => {
    const [timed, partial] = buildCleanWeeklyPlannerEntriesFromCalendarItems([
      baseCalendarItem,
      {
        ...baseCalendarItem,
        id: "item-2",
        startsAt: null,
        endsAt: "19:00",
      },
    ]);

    expect(timed.timeLabel).toBe("10:00–11:00");
    expect(timed.learningArea).toBe("Mathematics");
    expect(partial.timeLabel).toBe("Any time");
  });

  it("uses shared calendar time and learning-area labels for template blocks", () => {
    const [untimed, timed] = buildCleanWeeklyPlannerEntriesFromTemplateBlocks("2026-07-13", [
      baseTemplateBlock,
      {
        ...baseTemplateBlock,
        id: "block-2",
        startsAt: "09:00",
        endsAt: "09:30",
      },
    ]);

    expect(untimed.timeLabel).toBe("Any time");
    expect(untimed.learningArea).toBe("English");
    expect(timed.timeLabel).toBe("09:00–09:30");
  });
});
