import { describe, expect, it } from "vitest";
import {
  buildOnDeckStepHref,
  getLearningQueueMoveUpdates,
  getLearningQueueSourceKey,
  getOnDeckRegistryItem,
  isPathwayStepEligibleForOnDeck,
  resolveOnDeckItem,
  sortLearningQueueItems,
  toLearningQueueItem,
  type LearningQueueItem,
} from "@/lib/clean/onDeck/learningQueue";
import { getAllPathwaySteps } from "@/lib/clean/pathways/pathwayStepRegistry";
import { getPathwayStepsBySubject } from "@/lib/clean/pathways/pathwayStepRegistry";

function item(
  overrides: Partial<LearningQueueItem> = {},
): LearningQueueItem {
  const registryItem =
    getOnDeckRegistryItem(
      "mathematics::number-and-place-value::upper-primary::extend-place-value-to-larger-numbers",
    ) || getAllPathwaySteps()[0]!;

  return {
    id: "queue-a",
    familyId: "family-a",
    learnerId: "learner-a",
    sourceType: "pathway_step",
    subjectKey: registryItem.subjectKey,
    strandKey: registryItem.strandKey,
    stageKey: registryItem.stageKey,
    stepKey: registryItem.stepKey,
    pathwayStepId: registryItem.id,
    displayTitle: registryItem.stepTitle,
    position: 0,
    createdByUserId: "user-a",
    createdAt: "2026-09-08T00:00:00.000Z",
    updatedAt: "2026-09-08T00:00:00.000Z",
    ...overrides,
  };
}

describe("On Deck learning queue", () => {
  it("normalizes a persisted pathway_step queue row", () => {
    const normalized = toLearningQueueItem({
      id: "queue-a",
      family_id: "family-a",
      learner_id: "learner-a",
      source_type: "pathway_step",
      subject_key: "mathematics",
      strand_key: "number-and-place-value",
      stage_key: "upper-primary",
      step_key: "extend-place-value-to-larger-numbers",
      pathway_step_id:
        "mathematics::number-and-place-value::upper-primary::extend-place-value-to-larger-numbers",
      display_title: "Extend place value",
      position: 2,
      created_by_user_id: "user-a",
      created_at: "2026-09-08T00:00:00.000Z",
      updated_at: "2026-09-08T01:00:00.000Z",
    });

    expect(normalized.sourceType).toBe("pathway_step");
    expect(normalized.familyId).toBe("family-a");
    expect(normalized.learnerId).toBe("learner-a");
    expect(normalized.position).toBe(2);
  });

  it("uses learner and canonical step identity for duplicate prevention", () => {
    const sourceKey = getLearningQueueSourceKey(
      "learner-a",
      "english::morphology-and-spelling::upper-elementary::prefix-re",
    );

    expect(sourceKey).toBe(
      "learner-a::pathway_step::english::morphology-and-spelling::upper-elementary::prefix-re",
    );
  });

  it("allows current Mathematics and English pathway steps", () => {
    const mathematicsStep = getPathwayStepsBySubject("mathematics")[0];
    const englishStep = getPathwayStepsBySubject("english")[0];

    expect(isPathwayStepEligibleForOnDeck(mathematicsStep)).toBe(true);
    expect(isPathwayStepEligibleForOnDeck(englishStep)).toBe(true);
  });

  it("does not allow in-development pathway subjects onto On Deck", () => {
    const scienceStep = getPathwayStepsBySubject("science")[0];
    const humanitiesStep = getPathwayStepsBySubject("humanities")[0];

    expect(isPathwayStepEligibleForOnDeck(scienceStep)).toBe(false);
    expect(isPathwayStepEligibleForOnDeck(humanitiesStep)).toBe(false);
  });

  it("resolves available cards from the canonical registry", () => {
    const resolved = resolveOnDeckItem(item());

    expect(resolved.available).toBe(true);
    expect(resolved.title).toContain("Extend place value");
    expect(resolved.subjectLabel).toBe("Mathematics");
    expect(resolved.href).toContain("/my-pathways?");
    expect(resolved.worksheetAvailable).toBe(true);
  });

  it("renders stale or changed source identity as unavailable without substitution", () => {
    const resolved = resolveOnDeckItem(
      item({
        stepKey: "a-different-step",
        displayTitle: "Old saved step",
      }),
    );

    expect(resolved.available).toBe(false);
    expect(resolved.title).toBe("This learning step is no longer available.");
    expect(resolved.href).toBeNull();
  });

  it("builds a pathway href without touching Calendar", () => {
    const href = buildOnDeckStepHref(item());

    expect(href).toContain("/my-pathways?");
    expect(href).toContain("pathwayStepId=");
    expect(href).toContain("learnerId=learner-a");
    expect(href).not.toContain("calendar");
  });

  it("sorts items by explicit position", () => {
    const sorted = sortLearningQueueItems([
      item({ id: "third", position: 2 }),
      item({ id: "first", position: 0 }),
      item({ id: "second", position: 1 }),
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(["first", "second", "third"]);
  });

  it("calculates move up and move down position updates only for the queue", () => {
    const queue = [
      item({ id: "first", position: 0 }),
      item({ id: "second", position: 1 }),
      item({ id: "third", position: 2 }),
    ];

    expect(getLearningQueueMoveUpdates(queue, "second", "up")).toEqual([
      { id: "second", position: 0 },
      { id: "first", position: 1 },
    ]);
    expect(getLearningQueueMoveUpdates(queue, "second", "down")).toEqual([
      { id: "third", position: 1 },
      { id: "second", position: 2 },
    ]);
  });
});
