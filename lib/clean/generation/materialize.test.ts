import { describe, expect, it } from "vitest";
import {
  bindCleanProgramOccurrences,
  buildCleanGeneratedOccurrenceKey,
  buildCleanLegacyGeneratedFingerprint,
  deriveCleanReconciliationCandidates,
  filterCleanAutomaticWeekSuggestions,
  hasCleanAppliedGenerationRun,
} from "./materialize";

const programBlock = {
  id: "english-block",
  learnerProgramAssignmentId: "james-english-assignment",
};

const englishItem = {
  id: "calendar-english",
  plannedDate: "2026-09-01",
  sourceTemplateBlockId: "english-block",
  completedAt: null,
};

describe("automatic usual-week materialisation guards", () => {
  it("does not fabricate past days when first materialising the current week", () => {
    expect(
      filterCleanAutomaticWeekSuggestions(
        [{ plannedDate: "2026-08-24" }, { plannedDate: "2026-08-27" }],
        { weekStartsOn: "2026-08-24", today: "2026-08-27" },
      ),
    ).toEqual([{ plannedDate: "2026-08-27" }]);
  });

  it("keeps all dates for an unmaterialised future week", () => {
    expect(
      filterCleanAutomaticWeekSuggestions(
        [{ plannedDate: "2026-08-31" }, { plannedDate: "2026-09-01" }],
        { weekStartsOn: "2026-08-31", today: "2026-08-27" },
      ),
    ).toHaveLength(2);
  });

  it("treats an applied generation run as an operational snapshot", () => {
    expect(
      hasCleanAppliedGenerationRun(
        [{ masterTemplateId: "template-1", weekStartsOn: "2026-08-24", weekEndsOn: "2026-08-30", status: "applied" }],
        { templateId: "template-1", weekStartsOn: "2026-08-24", weekEndsOn: "2026-08-30" },
      ),
    ).toBe(true);
    expect(
      hasCleanAppliedGenerationRun(
        [{ masterTemplateId: "template-1", weekStartsOn: "2026-08-24", weekEndsOn: "2026-08-30", status: "preview" }],
        { templateId: "template-1", weekStartsOn: "2026-08-24", weekEndsOn: "2026-08-30" },
      ),
    ).toBe(false);
  });

  it("adds a new template block without resurrecting a deleted old block", () => {
    const reading = {
      plannedDate: "2026-08-24",
      title: "Reading",
      learnerId: "james",
      startsAt: "2026-08-24T09:00:00.000Z",
      endsAt: "2026-08-24T10:00:00.000Z",
      learningArea: "English",
      sourceTemplateBlockId: "reading-block",
      skippedReason: null,
    };
    const maths = {
      ...reading,
      plannedDate: "2026-08-25",
      title: "Maths",
      learningArea: "Mathematics",
      sourceTemplateBlockId: "maths-block",
    };

    expect(
      deriveCleanReconciliationCandidates({
        desired: [reading, maths],
        previouslyGenerated: [reading],
        liveItems: [],
      }),
    ).toEqual([maths]);
  });

  it("leaves edited, completed, and captured live occurrences untouched", () => {
    const desired = {
      plannedDate: "2026-08-24",
      title: "Reading",
      learnerId: "james",
      startsAt: "2026-08-24T09:00:00.000Z",
      endsAt: "2026-08-24T10:00:00.000Z",
      learningArea: "English",
      sourceTemplateBlockId: "reading-block",
      skippedReason: null,
    };

    expect(
      deriveCleanReconciliationCandidates({
        desired: [desired],
        previouslyGenerated: [desired],
        liveItems: [{ ...desired, startsAt: "2026-08-24T10:00:00.000Z", sourceType: "generated" }],
      }),
    ).toEqual([]);
  });

  it("uses a conservative fingerprint only for legacy generated rows without a source id", () => {
    const desired = {
      plannedDate: "2026-08-27",
      title: "Play date",
      learnerId: "james",
      startsAt: null,
      endsAt: null,
      learningArea: "Socials",
      sourceTemplateBlockId: "play-date-block",
      skippedReason: null,
    };
    expect(buildCleanGeneratedOccurrenceKey(desired)).toBe("2026-08-27::play-date-block");
    expect(buildCleanLegacyGeneratedFingerprint(desired)).toContain("play date");
    expect(
      deriveCleanReconciliationCandidates({
        desired: [desired],
        previouslyGenerated: [],
        liveItems: [{ ...desired, sourceTemplateBlockId: null, sourceType: "generated" }],
      }),
    ).toEqual([]);
  });

  it("recovers an existing generated Program item by allocating its exact first lesson without duplicating the Calendar row", async () => {
    const allocations: Array<[string, string, string]> = [];
    const removed: string[] = [];
    await bindCleanProgramOccurrences({
      familyId: "family-james",
      items: [englishItem as never],
      templateBlocks: [programBlock as never],
      desiredByKey: new Map([["2026-09-01::english-block", {} as never]]),
      protectedItemIds: new Set(),
      createdItemIds: new Set(),
    }, {
      allocate: async (...args) => {
        allocations.push(args);
        return { id: "occurrence-1", calendarItemId: "calendar-english", lessonTitleSnapshot: "Introduction to phonics" };
      },
      remove: async (_familyId, itemId) => { removed.push(itemId); },
    });

    expect(allocations).toEqual([["family-james", "james-english-assignment", "calendar-english"]]);
    expect(removed).toEqual([]);
  });

  it("removes an unprotected generic Program item and surfaces allocator failure", async () => {
    const removed: string[] = [];
    await expect(bindCleanProgramOccurrences({
      familyId: "family-james",
      items: [englishItem as never],
      templateBlocks: [programBlock as never],
      desiredByKey: new Map([["2026-09-01::english-block", {} as never]]),
      protectedItemIds: new Set(),
      createdItemIds: new Set(),
    }, {
      allocate: async () => { throw new Error("allocation unavailable"); },
      remove: async (_familyId, itemId) => { removed.push(itemId); },
    })).rejects.toThrow("allocation unavailable");

    expect(removed).toEqual(["calendar-english"]);
  });

  it("leaves ordinary generated items outside the Program allocator path", async () => {
    const allocations: string[] = [];
    const retained = await bindCleanProgramOccurrences({
      familyId: "family-james",
      items: [{ ...englishItem, id: "calendar-reading", sourceTemplateBlockId: "reading-block" } as never],
      templateBlocks: [{ id: "reading-block", learnerProgramAssignmentId: null } as never],
      desiredByKey: new Map([["2026-09-01::reading-block", {} as never]]),
      protectedItemIds: new Set(),
      createdItemIds: new Set(["calendar-reading"]),
    }, {
      allocate: async () => { allocations.push("called"); return null; },
    });

    expect(allocations).toEqual([]);
    expect(retained).toHaveLength(1);
  });
});
