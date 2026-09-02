import { describe, expect, it } from "vitest";
import {
  buildCleanGeneratedOccurrenceKey,
  buildCleanLegacyGeneratedFingerprint,
  deriveCleanReconciliationCandidates,
  filterCleanAutomaticWeekSuggestions,
  hasCleanAppliedGenerationRun,
} from "./materialize";

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

  it("keeps Program-aware template blocks dormant rather than materialising generic Calendar items", async () => {
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile(new URL("./materialize.ts", import.meta.url), "utf8"),
    );
    expect(source).toContain("!block.learnerProgramAssignmentId");
    expect(source).not.toContain("allocateCleanProgramOccurrence");
    expect(source).not.toContain("bindCleanProgramOccurrences");
  });
});
