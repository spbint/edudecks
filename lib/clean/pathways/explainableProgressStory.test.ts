import { describe, expect, it } from "vitest";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import {
  buildPathwayCaptureContext,
  encodePathwayContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { buildPathwayStepId } from "@/lib/clean/pathways/pathwayStepRegistry";
import { buildExplainableProgressStory } from "@/lib/clean/pathways/explainableProgressStory";
import { buildUnifiedPathwayStepStateIndex, getUnifiedPathwayStepState } from "@/lib/clean/pathways/pathwayStepState";

const pathwayStepId = buildPathwayStepId(
  "mathematics",
  "operations-and-calculation",
  "foundation-kindergarten",
  "share-compare-and-notice-simple-differences",
);

function evidence(progressLevel = "", overrides: Partial<CleanEvidenceEntry> = {}): CleanEvidenceEntry {
  const context = buildPathwayCaptureContext({
    source: "my-pathways",
    subjectKey: "mathematics",
    subjectLabel: "Mathematics",
    pathwayKey: "operations-and-calculation",
    pathwayLabel: "Operations and calculation",
    stageKey: "foundation-kindergarten",
    stageLabel: "Foundation",
    pathwayStepId,
    stepKey: "share-compare-and-notice-simple-differences",
    stepNumber: "2",
    stepTitle: "Share, compare, and notice simple differences",
  });

  return {
    id: `evidence-${progressLevel || "generic"}`,
    familyId: "family-1",
    learnerId: "learner-1",
    programId: null,
    calendarItemId: null,
    observedOn: "2026-08-28",
    title: "Fractions with cooking",
    whatHappened: "A learning record.",
    reflection: progressLevel ? `Progress level: ${progressLevel}` : "A useful learning record.",
    learningArea: "Mathematics",
    curriculumNodeIds: encodePathwayContextNodeIds([], context),
    attachmentUrls: [],
    imageUrl: null,
    includeInPortfolio: true,
    includeInReport: true,
    createdByUserId: "user-1",
    createdAt: "2026-08-28T09:00:00.000Z",
    updatedAt: "2026-08-28T09:00:00.000Z",
    ...overrides,
  };
}

function confirmation(status: CleanAssessmentSkillStatus["status"], overrides: Partial<CleanAssessmentSkillStatus> = {}): CleanAssessmentSkillStatus {
  return {
    id: `confirmation-${status}`,
    familyId: "family-1",
    learnerId: "learner-1",
    subjectKey: "mathematics",
    skillKey: pathwayStepId,
    stageKey: "foundation-kindergarten",
    status,
    note: null,
    createdByUserId: "user-1",
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: "2026-08-20T09:00:00.000Z",
    pathwayStepId,
    strandKey: "operations-and-calculation",
    stepKey: "share-compare-and-notice-simple-differences",
    ...overrides,
  };
}

function completedAttempt(overrides: Partial<CleanAssessmentAttempt> = {}): CleanAssessmentAttempt {
  return {
    id: "attempt-1",
    familyId: "family-1",
    learnerId: "learner-1",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "foundation-kindergarten",
    pathwayStepId,
    stepKey: "share-compare-and-notice-simple-differences",
    progressionBandKey: null,
    itemBankKey: "number-foundations",
    mode: "post_check",
    sourceRoute: "/my-pathways",
    status: "completed",
    itemCount: 5,
    attemptedCount: 5,
    autoCorrectCount: 1,
    autoIncorrectCount: 4,
    reviewNeededCount: 0,
    summarySnapshot: { autoCheckStatus: "Needs support" },
    startedAt: "2026-08-29T09:00:00.000Z",
    completedAt: "2026-08-29T09:05:00.000Z",
    createdByUserId: "user-1",
    createdAt: "2026-08-29T09:00:00.000Z",
    updatedAt: "2026-08-29T09:05:00.000Z",
    ...overrides,
  };
}

function story(input: { statuses?: CleanAssessmentSkillStatus[]; entries?: CleanEvidenceEntry[]; attempts?: CleanAssessmentAttempt[] }) {
  const index = buildUnifiedPathwayStepStateIndex({
    assessmentStatuses: input.statuses || [],
    evidenceEntries: input.entries || [],
  });
  return buildExplainableProgressStory({
    pathwayStepId,
    stepState: getUnifiedPathwayStepState(index, pathwayStepId),
    attempts: input.attempts || [],
  });
}

describe("explainable pathway progress story", () => {
  it("keeps parent confirmation authoritative over later observed evidence", () => {
    const result = story({
      statuses: [confirmation("Developing")],
      entries: [evidence("Consolidating")],
    });

    expect(result.currentProgress).toBe("Developing");
    expect(result.currentProgressSource).toBe("parent-confirmation");
    expect(result.currentProgressConfirmedAt).toBe("2026-08-20T09:00:00.000Z");
    expect(result.latestObservedProgress).toBe("Consolidating");
  });

  it("keeps a secure confirmation when a later check needs support", () => {
    const result = story({
      statuses: [confirmation("Strong")],
      attempts: [completedAttempt()],
    });

    expect(result.currentProgress).toBe("Secure");
    expect(result.latestCheck?.factualStatus).toBe("Needs support");
    expect(result.hasSignalConflict).toBe(true);
    expect(result.nextAction).toBe("review-this-step");
  });

  it("keeps generic linked evidence as supporting evidence only", () => {
    const result = story({
      entries: [evidence("", { id: "one" }), evidence("", { id: "two" }), evidence("", { id: "three" })],
    });

    expect(result.currentProgress).toBe("Not checked yet");
    expect(result.supportingEvidenceCount).toBe(3);
    expect(result.latestObservedProgress).toBeNull();
    expect(result.nextAction).toBe("confirm-progress");
  });

  it("keeps a completed check factual without auto-promoting progress", () => {
    const result = story({ attempts: [completedAttempt()] });

    expect(result.currentProgress).toBe("Not checked yet");
    expect(result.completedCheckCount).toBe(1);
    expect(result.latestCheck?.correctCount).toBe(1);
    expect(result.nextAction).toBe("confirm-progress");
  });

  it("shows observed progress separately when it is not parent confirmed", () => {
    const result = story({ entries: [evidence("Consolidating")] });

    expect(result.currentProgress).toBe("Not checked yet");
    expect(result.latestObservedProgress).toBe("Consolidating");
    expect(result.latestObservedAt).toBe("2026-08-28T09:00:00.000Z");
  });

  it("keeps the latest generic record separate from the latest explicit observation", () => {
    const result = story({
      entries: [
        evidence("Consolidating", { id: "observed", updatedAt: "2026-08-28T09:00:00.000Z" }),
        evidence("", { id: "generic-later", updatedAt: "2026-08-29T09:00:00.000Z" }),
      ],
    });

    expect(result.latestEvidence?.id).toBe("generic-later");
    expect(result.latestObservedProgress).toBe("Consolidating");
    expect(result.latestObservedAt).toBe("2026-08-28T09:00:00.000Z");
  });

  it("does not create a conflict for consistent signals and chooses the deterministic action", () => {
    const result = story({
      statuses: [confirmation("Secure")],
      entries: [evidence("Goal achieved")],
      attempts: [completedAttempt({ autoCorrectCount: 5, autoIncorrectCount: 0, summarySnapshot: { autoCheckStatus: "Secure" } })],
    });

    expect(result.currentProgress).toBe("Consolidating");
    expect(result.hasSignalConflict).toBe(false);
    expect(result.nextAction).toBe("check-understanding");
  });

  it("reports a later weaker observed judgement as a review signal without downgrading", () => {
    const result = story({
      statuses: [confirmation("Strong")],
      entries: [evidence("Needs support", { updatedAt: "2026-08-29T10:00:00.000Z" })],
    });

    expect(result.currentProgress).toBe("Secure");
    expect(result.latestObservedProgress).toBe("Needs support");
    expect(result.hasSignalConflict).toBe(true);
    expect(result.conflictExplanation).toBe("Recent work suggests this step may be worth reviewing.");
  });

  it.each([
    ["Not checked yet", false, false, "add-completed-work"],
    ["Needs support", true, false, "more-support"],
    ["Developing", true, false, "more-support"],
    ["Consolidating", true, false, "check-understanding"],
    ["Secure", true, false, "next-step"],
  ] as const)("uses the expected next action for %s", (label, confirmed, _signals, expected) => {
    const statuses = confirmed
      ? [confirmation(label === "Secure" ? "Strong" : label === "Consolidating" ? "Secure" : label === "Needs support" ? "Still developing" : "Developing")]
      : [];
    expect(story({ statuses }).nextAction).toBe(expected);
  });

  it("does not treat an unpersisted manual-completion flag as progress provenance", () => {
    const result = buildExplainableProgressStory({
      pathwayStepId,
      stepState: null,
      attempts: [],
      manualComplete: true,
    } as Parameters<typeof buildExplainableProgressStory>[0]);

    expect(result.currentProgress).toBe("Not checked yet");
    expect(result.currentProgressSource).toBe("not-confirmed");
    expect(result.completedCheckCount).toBe(0);
  });
});
