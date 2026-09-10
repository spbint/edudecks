import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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
  pathwayStepId: null,
  createdByUserId: "user-1",
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

describe("recover my week", () => {
  it("documents explicit, nullable calendar Pathways provenance", () => {
    const migration = readFileSync(
      join(process.cwd(), "supabase/migrations/20260910100000_add_calendar_pathway_context.sql"),
      "utf8",
    );
    expect(migration).toContain("add column if not exists pathway_step_id text null");
    expect(migration).not.toMatch(/update public\.calendar_items/i);
  });

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

  it("maps only explicit canonical learner Pathways context", () => {
    expect(resolveRecoverableLearningItem(item()).reason).toBe("unresolved");
    expect(resolveRecoverableLearningItem(item({ pathwayStepId: "english::morphology-and-spelling::upper-elementary::u001-prefix-re" })).reason).toBe("pathway-linked");
    expect(resolveRecoverableLearningItem(item({ pathwayStepId: "english::morphology-and-spelling::middle-primary::u001-prefix-re" })).registryItem?.stageKey).toBe("upper-elementary");
    expect(resolveRecoverableLearningItem(item({ learnerId: null })).reason).toBe("whole-family");
    expect(resolveRecoverableLearningItem(item({ title: "Unlinked activity" })).reason).toBe("unresolved");
  });
});
