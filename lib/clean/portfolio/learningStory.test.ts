import { describe, expect, it } from "vitest";
import { buildPortfolioLearningStory } from "@/lib/clean/portfolio/learningStory";
import type { CleanPortfolioItem } from "@/lib/clean/portfolio/types";

function item(overrides: Partial<CleanPortfolioItem["evidence"]> & { highlighted?: boolean } = {}): CleanPortfolioItem {
  return {
    evidence: {
      id: overrides.id ?? "evidence-1",
      familyId: "family-1",
      learnerId: overrides.learnerId ?? "learner-1",
      programId: null,
      calendarItemId: null,
      observedOn: overrides.observedOn ?? "2026-09-01",
      title: "Learning record",
      whatHappened: "Learning happened",
      reflection: null,
      learningArea: overrides.learningArea ?? "Mathematics",
      curriculumNodeIds: [],
      attachmentUrls: [],
      imageUrl: null,
      includeInPortfolio: overrides.includeInPortfolio ?? true,
      includeInReport: true,
      createdByUserId: "user-1",
      createdAt: overrides.createdAt ?? "2026-09-01T10:00:00.000Z",
      updatedAt: null,
    },
    highlight: overrides.highlighted ? {
      id: `highlight-${overrides.id ?? "1"}`,
      familyId: "family-1",
      learnerId: overrides.learnerId ?? "learner-1",
      evidenceEntryId: overrides.id ?? "evidence-1",
      calendarItemId: null,
      note: null,
      createdByUserId: "user-1",
      createdAt: "2026-09-01T10:00:00.000Z",
      updatedAt: null,
    } : null,
    isHighlighted: overrides.highlighted === true,
  };
}

describe("Portfolio Learning Story", () => {
  it("keeps a calm zero-data story", () => {
    expect(buildPortfolioLearningStory([], "learner-1")).toMatchObject({
      evidenceCount: 0,
      learningAreaCount: 0,
      learningAreas: [],
      latestObservedOn: null,
      highlights: [],
    });
  });

  it("uses only supplied Portfolio records, represented areas, and the canonical observed date", () => {
    const story = buildPortfolioLearningStory([
      item({ id: "one", observedOn: "2026-08-30", learningArea: "Mathematics" }),
      item({ id: "two", observedOn: "2026-09-02", learningArea: "English", highlighted: true }),
      item({ id: "three", observedOn: "2026-09-01", learningArea: "Mathematics" }),
      item({ id: "not-in-portfolio", observedOn: "2026-09-03", learningArea: "Science", includeInPortfolio: false }),
    ], "learner-1");

    expect(story.evidenceCount).toBe(3);
    expect(story.learningAreaCount).toBe(2);
    expect(story.learningAreas).toEqual([
      { learningArea: "Mathematics", recordCount: 2 },
      { learningArea: "English", recordCount: 1 },
    ]);
    expect(story.latestObservedOn).toBe("2026-09-02");
    expect(story.highlights.map((entry) => entry.evidence.id)).toEqual(["two"]);
  });

  it("keeps learner records isolated and does not make missing learning areas into a deficit", () => {
    const story = buildPortfolioLearningStory([
      item({ id: "one", learnerId: "learner-1", learningArea: "" }),
      item({ id: "two", learnerId: "learner-2", learningArea: "Science" }),
    ], "learner-1");

    expect(story.evidenceCount).toBe(1);
    expect(story.learningAreaCount).toBe(0);
    expect(story.learningAreas).toEqual([]);
    expect(JSON.stringify(story)).not.toMatch(/mastery|progress|percent|missing|deficit/i);
  });
});
