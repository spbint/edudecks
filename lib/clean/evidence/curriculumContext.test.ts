import { describe, expect, it } from "vitest";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildPathwayCaptureContext,
  encodePathwayContextNodeIds,
  parsePathwayContextFromNodeIds,
  removePortfolioPathwayLinkNodeIds,
  replacePortfolioPathwayLinkNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import { getAllPathwaySteps } from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  buildRecognizedProgressJudgementObservations,
  buildUnifiedPathwayStepStateIndex,
  getUnifiedPathwayStepState,
  isUnifiedPathwayStepComplete,
  resolveEffectiveAssessmentConfidence,
} from "@/lib/clean/pathways/pathwayStepState";

const [FIRST_STEP, SECOND_STEP] = getAllPathwaySteps();

function contextForStep(step = FIRST_STEP, observedSkillStatus: string | null = null) {
  return buildPathwayCaptureContext({
    source: "my-pathways",
    subjectKey: step.subjectKey,
    subjectLabel: step.subjectTitle,
    pathwayKey: step.strandKey,
    pathwayLabel: step.pathwayLabel,
    stageKey: step.stageKey,
    stageLabel: step.stageTitle,
    pathwayStepId: step.id,
    stepKey: step.stepKey,
    stepNumber: step.legacyStepNumber,
    stepTitle: step.stepTitle,
    stepMeaning: step.stepDescription,
    skillFocus: step.skillFocus,
    observedSkillStatus,
  });
}

function genericEvidence(curriculumNodeIds: string[]): CleanEvidenceEntry {
  return {
    id: "evidence-1",
    familyId: "family-1",
    learnerId: "learner-1",
    programId: null,
    calendarItemId: null,
    observedOn: "2026-08-30",
    title: "Nature walk photo",
    whatHappened: "Observed insects in the garden.",
    reflection: null,
    learningArea: "Science",
    curriculumNodeIds,
    attachmentUrls: ["evidence/family-1/learner-1/photo.jpg"],
    imageUrl: "evidence/family-1/learner-1/photo.jpg",
    includeInPortfolio: true,
    includeInReport: true,
    createdByUserId: "user-1",
    createdAt: "2026-08-30T10:00:00.000Z",
    updatedAt: "2026-08-30T10:00:00.000Z",
  };
}

describe("Portfolio Pathway links", () => {
  it("adds one canonical step link while preserving unrelated curriculum nodes without duplicates", () => {
    const nodeIds = replacePortfolioPathwayLinkNodeIds(
      ["custom:keep", "learning-area:science", "learning-area:science"],
      contextForStep(),
    );

    expect(nodeIds).toContain("custom:keep");
    expect(nodeIds).toContain("learning-area:science");
    expect(new Set(nodeIds).size).toBe(nodeIds.length);
    expect(parsePathwayContextFromNodeIds(nodeIds)?.pathwayStepId).toBe(FIRST_STEP.id);
  });

  it("keeps an explicit judgement for the same step but clears it when the link changes", () => {
    const originallyLinked = encodePathwayContextNodeIds(
      ["curriculum-note:keep"],
      contextForStep(FIRST_STEP, "Secure"),
    );
    const sameStep = replacePortfolioPathwayLinkNodeIds(
      originallyLinked,
      contextForStep(FIRST_STEP),
    );
    const changedStep = replacePortfolioPathwayLinkNodeIds(
      originallyLinked,
      contextForStep(SECOND_STEP),
    );

    expect(parsePathwayContextFromNodeIds(originallyLinked)?.observedSkillStatus).toBe("Secure");
    expect(parsePathwayContextFromNodeIds(sameStep)?.observedSkillStatus).toBe("Secure");
    expect(parsePathwayContextFromNodeIds(changedStep)?.pathwayStepId).toBe(SECOND_STEP.id);
    expect(parsePathwayContextFromNodeIds(changedStep)?.observedSkillStatus).toBeNull();
    expect(changedStep).toContain("curriculum-note:keep");
  });

  it("removes only the pathway association and keeps the evidence context intact", () => {
    const linked = replacePortfolioPathwayLinkNodeIds(
      ["custom:keep", "learning-area:science"],
      contextForStep(FIRST_STEP, "Developing"),
    );
    const removed = removePortfolioPathwayLinkNodeIds(linked);

    expect(parsePathwayContextFromNodeIds(removed)).toBeNull();
    expect(removed).toContain("custom:keep");
    expect(removed).toContain("learning-area:science");
  });

  it("treats a manually linked generic record as supporting evidence, not mastery", () => {
    const evidence = genericEvidence(
      replacePortfolioPathwayLinkNodeIds(["custom:keep"], contextForStep()),
    );
    const state = getUnifiedPathwayStepState(
      buildUnifiedPathwayStepStateIndex({ evidenceEntries: [evidence] }),
      FIRST_STEP.id,
    );

    expect(state?.linkedEvidenceCount).toBe(1);
    expect(state?.latestObservedSkillStatus).toBeNull();
    expect(state?.pathwayProgressFromEvidence).toBe("Evidence started");
    expect(resolveEffectiveAssessmentConfidence(state)).toBe("Not assessed yet");
    expect(isUnifiedPathwayStepComplete(state)).toBe(false);
    expect(buildRecognizedProgressJudgementObservations({ evidenceEntries: [evidence] })).toEqual([]);
  });
});
