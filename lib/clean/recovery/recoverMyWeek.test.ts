import { describe, expect, it } from "vitest";
import type { CleanCalendarItem } from "@/lib/clean/calendar/types";
import type { CleanLearningPeriod } from "@/lib/clean/terms/types";
import {
  getRecoverableLearningItems,
  resolveRecoverableLearningItem,
} from "./recoverMyWeek";

const period = (overrides: Partial<CleanLearningPeriod> = {}): CleanLearningPeriod => ({
  id: "period-1",
  familyId: "family-1",
  academicYearId: "year-1",
  title: "Term 1",
  periodType: "term",
  startsOn: "2026-09-07",
  endsOn: "2026-09-13",
  isBreak: false,
  notes: null,
  createdByUserId: "user-1",
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

const item = (overrides: Partial<CleanCalendarItem> = {}): CleanCalendarItem => ({
  id: "item-1",
  familyId: "family-1",
  learnerId: "learner-1",
  programId: null,
  programSegmentId: null,
  title: "Prefix re-",
  description: null,
  startsAt: null,
  endsAt: null,
  plannedDate: "2026-09-08",
  learningArea: "English",
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
});

describe("recover my week", () => {
  it("includes only unfinished earlier-week items inside active teaching periods", () => {
    const result = getRecoverableLearningItems({
      calendarItems: [
        item(),
        item({ id: "future", plannedDate: "2026-09-13" }),
        item({ id: "done", completedAt: "2026-09-08T10:00:00.000Z" }),
        item({ id: "break", plannedDate: "2026-09-10" }),
        item({ id: "last-week", plannedDate: "2026-09-06" }),
      ],
      today: "2026-09-09",
      weekStart: "2026-09-07",
      weekEnd: "2026-09-13",
      learningPeriods: [period(), period({ id: "break-1", title: "Break", periodType: "break", isBreak: true, startsOn: "2026-09-10", endsOn: "2026-09-10" })],
    });

    expect(result.map((entry) => entry.calendarItem.id)).toEqual(["item-1"]);
  });

  it("maps only an exact learner-specific registered step", () => {
    expect(resolveRecoverableLearningItem(item()).reason).toBe("pathway-linked");
    expect(resolveRecoverableLearningItem(item({ learnerId: null })).reason).toBe("whole-family");
    expect(resolveRecoverableLearningItem(item({ title: "Unlinked activity" })).reason).toBe("unresolved");
  });
});
