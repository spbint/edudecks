import { describe, expect, it } from "vitest";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { buildPathwayCaptureContext, encodePathwayContextNodeIds } from "@/lib/clean/evidence/curriculumContext";
import type { LearningQueueItem } from "@/lib/clean/onDeck/learningQueue";
import { buildWhereWeAreSubjectSummaries, getCanonicalNextPathwayStep } from "@/lib/clean/learna/whereWeAre";
import type { CurrentLearningCandidate } from "@/lib/clean/pathways/currentLearningCandidates";
import { getPathwayStepById, getPathwayStepsBySubject } from "@/lib/clean/pathways/pathwayStepRegistry";

const mathematicsStep = getPathwayStepById(
  "mathematics",
  "number-and-place-value",
  "middle-primary",
  "read-write-order-and-compare-numbers-to-1000-and-beyond",
)!;
const englishPrefixReStep = getPathwayStepById(
  "english",
  "morphology-and-spelling",
  "upper-elementary",
  "u001-prefix-re",
)!;

function candidate(
  registryItem = mathematicsStep,
  source: CurrentLearningCandidate["source"] = "parent-confirmation",
): CurrentLearningCandidate {
  return {
    pathwayStepId: registryItem.id,
    registryItem,
    source,
    recency: Date.parse("2026-09-08T10:00:00.000Z"),
  };
}

function evidence(
  id: string,
  learnerId: string,
  registryItem = mathematicsStep,
): CleanEvidenceEntry {
  const context = buildPathwayCaptureContext({
    source: "my-pathways",
    subjectKey: registryItem.subjectKey,
    subjectLabel: registryItem.subjectTitle,
    pathwayKey: registryItem.strandKey,
    pathwayLabel: registryItem.strandTitle,
    stageKey: registryItem.stageKey,
    stageLabel: registryItem.stageTitle,
    pathwayStepId: registryItem.id,
    stepKey: registryItem.stepKey,
    stepTitle: registryItem.stepTitle,
  });

  return {
    id,
    familyId: "family-a",
    learnerId,
    participantLearnerIds: [learnerId],
    participantLearnerCount: 1,
    programId: null,
    calendarItemId: null,
    observedOn: "2026-09-08",
    title: "Learning Moment",
    whatHappened: "Useful learning happened.",
    reflection: "No mastery claim.",
    learningArea: registryItem.subjectTitle,
    curriculumNodeIds: encodePathwayContextNodeIds([], context),
    attachmentUrls: [],
    imageUrl: null,
    captureSource: "learning_chronicle",
    includeInPortfolio: true,
    includeInReport: true,
    createdByUserId: "user-a",
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  };
}

function onDeck(
  id: string,
  learnerId: string,
  registryItem = mathematicsStep,
): LearningQueueItem {
  return {
    id,
    familyId: "family-a",
    learnerId,
    sourceType: "pathway_step",
    subjectKey: registryItem.subjectKey,
    strandKey: registryItem.strandKey,
    stageKey: registryItem.stageKey,
    stepKey: registryItem.stepKey,
    pathwayStepId: registryItem.id,
    displayTitle: registryItem.stepTitle,
    position: 0,
    createdByUserId: "user-a",
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  };
}

describe("Where We Are subject summaries", () => {
  it("shows canonical Mathematics and English current steps with legitimate next steps only", () => {
    const summaries = buildWhereWeAreSubjectSummaries({
      learnerId: "learner-a",
      currentCandidates: [candidate(mathematicsStep), candidate(englishPrefixReStep)],
      evidenceEntries: [evidence("math-a", "learner-a"), evidence("english-a", "learner-a", englishPrefixReStep)],
      onDeckItems: [onDeck("queue-a", "learner-a")],
    });

    const mathematics = summaries.find((summary) => summary.subjectKey === "mathematics");
    const english = summaries.find((summary) => summary.subjectKey === "english");

    expect(summaries.map((summary) => summary.subjectKey)).toEqual(["mathematics", "english"]);
    expect(mathematics?.workingOn?.stepTitle).toBe("Read, write, order and compare numbers to 1000 and beyond");
    expect(mathematics?.upNext?.stepTitle).toBe("Understand hundreds, tens and ones");
    expect(english?.workingOn?.stepTitle).toBe("Prefix re-");
    expect(english?.workingOn?.stageKey).toBe("upper-elementary");
    expect(english?.upNext).toBeNull();
  });

  it("keeps the historical Morphology identity aligned with the canonical Where We Are step", () => {
    const canonicalStep = getPathwayStepById(
      "english",
      "morphology-and-spelling",
      "upper-elementary",
      "u001-prefix-re",
    );

    expect(canonicalStep).not.toBeNull();
    expect(canonicalStep?.stageKey).toBe("upper-elementary");
    expect(canonicalStep?.stepTitle).toBe("Prefix re-");
    expect(getPathwayStepById(
      "english",
      "morphology-and-spelling",
      "middle-primary",
      "u001-prefix-re",
    )).toBeNull();
  });

  it("keeps On Deck and evidence learner-specific without turning evidence into mastery", () => {
    const summaries = buildWhereWeAreSubjectSummaries({
      learnerId: "learner-a",
      currentCandidates: [candidate(mathematicsStep, "linked-evidence")],
      evidenceEntries: [
        evidence("included-a", "learner-a"),
        evidence("excluded-b", "learner-b"),
      ],
      onDeckItems: [
        onDeck("queue-a", "learner-a"),
        onDeck("queue-b", "learner-b"),
      ],
    });

    const mathematics = summaries.find((summary) => summary.subjectKey === "mathematics");

    expect(mathematics?.recentLearningCount).toBe(1);
    expect(mathematics?.onDeckCount).toBe(1);
    expect(JSON.stringify(summaries)).not.toMatch(/mastery|percent|percentage|complete/i);
  });

  it("shows worksheet availability only for real mapped current-step assets", () => {
    const mathematics = buildWhereWeAreSubjectSummaries({
      learnerId: "learner-a",
      currentCandidates: [candidate(mathematicsStep)],
      evidenceEntries: [],
      onDeckItems: [],
    }).find((summary) => summary.subjectKey === "mathematics");
    const english = buildWhereWeAreSubjectSummaries({
      learnerId: "learner-a",
      currentCandidates: [candidate(englishPrefixReStep)],
      evidenceEntries: [],
      onDeckItems: [],
    }).find((summary) => summary.subjectKey === "english");

    expect(mathematics?.worksheetAvailable).toBe(true);
    expect(english?.worksheetAvailable).toBe(false);
  });

  it("does not invent current or next state for in-development subjects or empty learners", () => {
    const summaries = buildWhereWeAreSubjectSummaries({
      learnerId: "learner-a",
      currentCandidates: [],
      evidenceEntries: [],
      onDeckItems: [],
    });

    expect(summaries.map((summary) => summary.subjectKey)).toEqual(["mathematics", "english"]);
    expect(summaries.every((summary) => !summary.workingOn && !summary.upNext)).toBe(true);
    expect(getPathwayStepsBySubject("science").length).toBeGreaterThan(0);
    expect(summaries.some((summary) => summary.subjectKey === "science")).toBe(false);
  });

  it("derives next only from the same canonical strand and stage", () => {
    const next = getCanonicalNextPathwayStep(mathematicsStep);

    expect(next?.subjectKey).toBe(mathematicsStep.subjectKey);
    expect(next?.strandKey).toBe(mathematicsStep.strandKey);
    expect(next?.stageKey).toBe(mathematicsStep.stageKey);
    expect(next?.stepOrder).toBe(mathematicsStep.stepOrder + 1);
  });
});
