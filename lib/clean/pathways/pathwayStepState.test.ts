import { describe, expect, it } from "vitest";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import {
  getNumberPathwayRevealGroups,
  type NumberPathwayEvidenceStatusOverride,
} from "@/lib/clean/assessments/numberPathwayAssessmentAlignment";
import { getStepAssessmentForPathwayStep } from "@/lib/clean/assessments/stepAssessmentRegistry";
import { buildCurriculumCoverageSummary } from "@/lib/clean/curriculum/coverageSummary";
import { resolveCurriculumFrameworkMap } from "@/lib/clean/curriculum/frameworkMaps";
import { buildCurriculumCoveragePdfModel } from "@/lib/clean/outputs/curriculumCoveragePdf";
import {
  buildPathwayCaptureContext,
  encodePathwayContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import type { FamilyProfile } from "@/lib/clean/family/types";
import type { Learner } from "@/lib/clean/learners/types";
import {
  buildPathwayStepId,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  buildSubjectCurriculumDashboardSummaries,
  buildUnifiedPathwayStepStateIndex,
  getUnifiedPathwayStepEvidenceCount,
  getUnifiedPathwayStepState,
  isUnifiedPathwayStepComplete,
} from "@/lib/clean/pathways/pathwayStepState";

const OPERATIONS_STEP_2_ID = buildPathwayStepId(
  "mathematics",
  "operations-and-calculation",
  "foundation-kindergarten",
  "share-compare-and-notice-simple-differences",
);

function buildOperationsStep2Evidence(
  progressLevel: string,
  overrides: Partial<CleanEvidenceEntry> = {},
): CleanEvidenceEntry {
  const pathwayContext = buildPathwayCaptureContext({
    source: "my-pathways",
    subjectKey: "mathematics",
    subjectLabel: "Mathematics",
    pathwayKey: "operations-and-calculation",
    pathwayLabel: "Operations and calculation pathway",
    stageKey: "foundation-kindergarten",
    stageLabel: "Kindergarten / Early Elementary",
    pathwayStepId: OPERATIONS_STEP_2_ID,
    stepKey: "share-compare-and-notice-simple-differences",
    stepNumber: "2",
    stepTitle: "Share, compare, and notice simple differences",
  });

  return {
    id: `evidence-${progressLevel}`,
    familyId: "family-1",
    learnerId: "learner-1",
    programId: null,
    calendarItemId: null,
    observedOn: "2026-06-22",
    title: "Share, compare, and notice simple differences - worksheet evidence",
    whatHappened:
      "Completed worksheet evidence for Operations and calculation pathway / Share, compare, and notice simple differences.",
    reflection: `Progress level: ${progressLevel}\nSource: worksheet_evidence`,
    learningArea: "Mathematics",
    curriculumNodeIds: encodePathwayContextNodeIds([], pathwayContext),
    attachmentUrls: [],
    imageUrl: null,
    includeInPortfolio: true,
    includeInReport: true,
    createdByUserId: "user-1",
    createdAt: "2026-06-22T10:00:00.000Z",
    updatedAt: "2026-06-22T10:00:00.000Z",
    ...overrides,
  };
}

function buildOperationsStep2Status(
  status: CleanAssessmentSkillStatus["status"],
  overrides: Partial<CleanAssessmentSkillStatus> = {},
): CleanAssessmentSkillStatus {
  return {
    id: `status-${status}`,
    familyId: "family-1",
    learnerId: "learner-1",
    subjectKey: "mathematics",
    skillKey: OPERATIONS_STEP_2_ID,
    stageKey: "foundation-kindergarten",
    status,
    note: null,
    createdByUserId: "user-1",
    createdAt: "2026-06-22T09:00:00.000Z",
    updatedAt: "2026-06-22T09:00:00.000Z",
    pathwayStepId: OPERATIONS_STEP_2_ID,
    strandKey: "operations-and-calculation",
    stepKey: "share-compare-and-notice-simple-differences",
    ...overrides,
  };
}

function buildOperationsStep2Attempt(overrides: Partial<CleanAssessmentAttempt> = {}): CleanAssessmentAttempt {
  const exactStepAssessment = getStepAssessmentForPathwayStep({
    pathwayStepId: OPERATIONS_STEP_2_ID,
    stepKey: "share-compare-and-notice-simple-differences",
    strandKey: "operations-and-calculation",
  });

  return {
    id: "attempt-1",
    familyId: "family-1",
    learnerId: "learner-1",
    subjectKey: "mathematics",
    strandKey: "operations-and-calculation",
    stageKey: "foundation-kindergarten",
    pathwayStepId: OPERATIONS_STEP_2_ID,
    stepKey: "share-compare-and-notice-simple-differences",
    progressionBandKey: null,
    itemBankKey: "number-foundations",
    mode: "post_check",
    sourceRoute: "/my-pathways",
    status: "completed",
    itemCount: 3,
    attemptedCount: 3,
    autoCorrectCount: 1,
    autoIncorrectCount: 2,
    reviewNeededCount: 0,
    summarySnapshot: {
      autoCheckStatus: "Developing",
      prototypeMetadata: {
        stepAssessmentKey: exactStepAssessment?.key ?? null,
      },
    },
    startedAt: "2026-06-22T09:00:00.000Z",
    completedAt: "2026-06-22T09:05:00.000Z",
    createdByUserId: "user-1",
    createdAt: "2026-06-22T09:00:00.000Z",
    updatedAt: "2026-06-22T09:05:00.000Z",
    ...overrides,
  };
}

describe("pathway step state", () => {
  it("unifies assessment confidence and evidence on one canonical technologies step", () => {
    const pathwayStepId = buildPathwayStepId(
      "technologies",
      "design-and-production",
      "lower-primary",
      "plan-simple-steps-before-making",
    );

    const assessmentStatus: CleanAssessmentSkillStatus = {
      id: "status-1",
      familyId: "family-1",
      learnerId: "learner-1",
      subjectKey: "technologies",
      skillKey: pathwayStepId,
      stageKey: "lower-primary",
      status: "Secure",
      note: "Planning is becoming more deliberate.",
      createdByUserId: "user-1",
      createdAt: "2026-05-24T09:00:00.000Z",
      updatedAt: "2026-05-24T09:00:00.000Z",
      pathwayStepId,
      strandKey: "design-and-production",
      stepKey: "plan-simple-steps-before-making",
    };

    const pathwayContext = buildPathwayCaptureContext({
      source: "my-pathways",
      subjectKey: "technologies",
      subjectLabel: "Technologies",
      pathwayKey: "design-and-production",
      pathwayLabel: "Design and production pathway",
      stageKey: "lower-primary",
      stageLabel: "Lower Primary",
      pathwayStepId,
      stepKey: "plan-simple-steps-before-making",
      stepNumber: "1",
      stepTitle: "Plan simple steps before making",
      stepMeaning:
        "Use a sketch, picture sequence, or short plan to show what will be made and how it might happen.",
      skillFocus: "early planning and sequencing",
      observedSkillStatus: "Developing",
    });

    const evidenceEntry: CleanEvidenceEntry = {
      id: "evidence-1",
      familyId: "family-1",
      learnerId: "learner-1",
      programId: null,
      calendarItemId: null,
      observedOn: "2026-05-24",
      title: "Design plan",
      whatHappened: "The learner drew a step-by-step plan before making the model.",
      reflection: "Planning helped the making stage go more smoothly.",
      learningArea: "Technologies",
      curriculumNodeIds: encodePathwayContextNodeIds([], pathwayContext),
      includeInPortfolio: true,
      includeInReport: true,
      createdByUserId: "user-1",
      createdAt: "2026-05-24T10:00:00.000Z",
      updatedAt: "2026-05-24T10:00:00.000Z",
    };

    const unifiedStateIndex = buildUnifiedPathwayStepStateIndex({
      assessmentStatuses: [assessmentStatus],
      evidenceEntries: [evidenceEntry],
    });
    const unifiedStepState = getUnifiedPathwayStepState(unifiedStateIndex, pathwayStepId);
    const technologiesSummary = buildSubjectCurriculumDashboardSummaries(
      unifiedStateIndex,
    ).find((item) => item.subjectKey === "technologies");

    expect(unifiedStepState?.assessmentConfidence).toBe("Secure");
    expect(unifiedStepState?.linkedEvidenceCount).toBe(1);
    expect(unifiedStepState?.pathwayProgressFromEvidence).toBe("Evidence started");
    expect(technologiesSummary?.evidenceLinkedCount).toBeGreaterThanOrEqual(1);
    expect(technologiesSummary?.assessedCount).toBeGreaterThanOrEqual(1);
    expect(technologiesSummary?.secureOrStrongCount).toBeGreaterThanOrEqual(1);
  });

  it("treats pathway worksheet Goal achieved evidence as secure for the exact operations step", () => {
    const pathwayStepId = buildPathwayStepId(
      "mathematics",
      "operations-and-calculation",
      "foundation-kindergarten",
      "share-compare-and-notice-simple-differences",
    );

    const pathwayContext = buildPathwayCaptureContext({
      source: "my-pathways",
      subjectKey: "mathematics",
      subjectLabel: "Mathematics",
      pathwayKey: "operations-and-calculation",
      pathwayLabel: "Operations and calculation pathway",
      stageKey: "foundation-kindergarten",
      stageLabel: "Kindergarten / Early Elementary",
      pathwayStepId,
      stepKey: "share-compare-and-notice-simple-differences",
      stepNumber: "2",
      stepTitle: "Share, compare, and notice simple differences",
      stepMeaning:
        "Compare two quantities, talk about fairness, and describe whether one amount is more, less, or the same.",
      skillFocus: "comparison and sharing language",
      observedSkillStatus: "Secure",
    });

    const evidenceEntry: CleanEvidenceEntry = {
      id: "operations-step-2-evidence",
      familyId: "family-1",
      learnerId: "learner-1",
      programId: null,
      calendarItemId: null,
      observedOn: "2026-06-22",
      title: "Share, compare, and notice simple differences - worksheet evidence",
      whatHappened:
        "Completed worksheet evidence for Operations and calculation pathway / Share, compare, and notice simple differences.",
      reflection: "Progress level: Goal achieved\nSource: worksheet_evidence",
      learningArea: "Mathematics",
      curriculumNodeIds: encodePathwayContextNodeIds([], pathwayContext),
      attachmentUrls: ["worksheet-evidence/family-1/learner-1/photo.jpg"],
      imageUrl: "worksheet-evidence/family-1/learner-1/photo.jpg",
      includeInPortfolio: true,
      includeInReport: true,
      createdByUserId: "user-1",
      createdAt: "2026-06-22T10:00:00.000Z",
      updatedAt: "2026-06-22T10:00:00.000Z",
    };

    const unifiedStateIndex = buildUnifiedPathwayStepStateIndex({
      evidenceEntries: [evidenceEntry],
    });
    const unifiedStepState = getUnifiedPathwayStepState(unifiedStateIndex, pathwayStepId);

    expect(unifiedStepState?.latestEvidenceEntry?.id).toBe("operations-step-2-evidence");
    expect(unifiedStepState?.linkedEvidenceCount).toBe(1);
    expect(unifiedStepState?.latestObservedSkillStatus).toBe("Secure");
    expect(unifiedStepState?.pathwayProgressFromEvidence).toBe("Secure");
    expect(isUnifiedPathwayStepComplete(unifiedStepState)).toBe(true);
  });

  it("treats Goal achieved + extension evidence as completed without conflating evidence count", () => {
    const extensionEvidence = buildOperationsStep2Evidence("Goal achieved + extension", {
      id: "extension-evidence",
    });

    const unifiedStateIndex = buildUnifiedPathwayStepStateIndex({
      evidenceEntries: [extensionEvidence],
    });
    const unifiedStepState = getUnifiedPathwayStepState(unifiedStateIndex, OPERATIONS_STEP_2_ID);

    expect(unifiedStepState?.latestObservedSkillStatus).toBe("Strong");
    expect(unifiedStepState?.pathwayProgressFromEvidence).toBe("Secure");
    expect(isUnifiedPathwayStepComplete(unifiedStepState)).toBe(true);
    expect(getUnifiedPathwayStepEvidenceCount(unifiedStateIndex, OPERATIONS_STEP_2_ID)).toBe(1);
  });

  it("keeps completion true once while evidence count reflects every linked work sample", () => {
    const firstEvidence = buildOperationsStep2Evidence("Goal achieved", {
      id: "first-goal-evidence",
      updatedAt: "2026-06-22T10:00:00.000Z",
    });
    const secondEvidence = buildOperationsStep2Evidence("Goal achieved", {
      id: "second-goal-evidence",
      updatedAt: "2026-06-23T10:00:00.000Z",
    });

    const unifiedStateIndex = buildUnifiedPathwayStepStateIndex({
      evidenceEntries: [firstEvidence, secondEvidence],
    });
    const unifiedStepState = getUnifiedPathwayStepState(unifiedStateIndex, OPERATIONS_STEP_2_ID);

    expect(isUnifiedPathwayStepComplete(unifiedStepState)).toBe(true);
    expect(unifiedStepState?.latestEvidenceEntry?.id).toBe("second-goal-evidence");
    expect(getUnifiedPathwayStepEvidenceCount(unifiedStateIndex, OPERATIONS_STEP_2_ID)).toBe(2);
  });

  it("falls back to worksheet progress text when older pathway evidence lacks observed status", () => {
    const pathwayStepId = buildPathwayStepId(
      "mathematics",
      "operations-and-calculation",
      "foundation-kindergarten",
      "share-compare-and-notice-simple-differences",
    );

    const pathwayContext = buildPathwayCaptureContext({
      source: "my-pathways",
      subjectKey: "mathematics",
      subjectLabel: "Mathematics",
      pathwayKey: "operations-and-calculation",
      pathwayLabel: "Operations and calculation pathway",
      stageKey: "foundation-kindergarten",
      stageLabel: "Kindergarten / Early Elementary",
      stepNumber: "2",
      stepTitle: "Share, compare, and notice simple differences",
    });

    const evidenceEntry: CleanEvidenceEntry = {
      id: "legacy-progress-evidence",
      familyId: "family-1",
      learnerId: "learner-1",
      programId: null,
      calendarItemId: null,
      observedOn: "2026-06-22",
      title: "Worksheet evidence",
      whatHappened: "Completed worksheet evidence.",
      reflection: "Progress level: Goal achieved + extension",
      learningArea: "Mathematics",
      curriculumNodeIds: encodePathwayContextNodeIds([], pathwayContext),
      attachmentUrls: [],
      imageUrl: null,
      includeInPortfolio: true,
      includeInReport: true,
      createdByUserId: "user-1",
      createdAt: "2026-06-22T10:00:00.000Z",
      updatedAt: "2026-06-22T10:00:00.000Z",
    };

    const unifiedStateIndex = buildUnifiedPathwayStepStateIndex({
      evidenceEntries: [evidenceEntry],
    });
    const unifiedStepState = getUnifiedPathwayStepState(unifiedStateIndex, pathwayStepId);

    expect(unifiedStepState?.latestObservedSkillStatus).toBe("Strong");
    expect(unifiedStepState?.pathwayProgressFromEvidence).toBe("Secure");
  });

  it("lets newer Goal achieved worksheet evidence override an older developing status", () => {
    const developingStatus = buildOperationsStep2Status("Developing", {
      updatedAt: "2026-06-22T09:00:00.000Z",
    });
    const goalAchievedEvidence = buildOperationsStep2Evidence("Goal achieved", {
      updatedAt: "2026-06-22T10:00:00.000Z",
    });

    const unifiedStateIndex = buildUnifiedPathwayStepStateIndex({
      assessmentStatuses: [developingStatus],
      evidenceEntries: [goalAchievedEvidence],
    });
    const unifiedStepState = getUnifiedPathwayStepState(unifiedStateIndex, OPERATIONS_STEP_2_ID);

    expect(unifiedStepState?.assessmentConfidence).toBe("Developing");
    expect(unifiedStepState?.latestStatusSource).toBe("evidence");
    expect(unifiedStepState?.latestEvidenceProgressLevel).toBe("Goal achieved");
    expect(unifiedStepState?.pathwayProgressFromEvidence).toBe("Secure");
  });

  it("lets newer Working towards worksheet evidence replace older Goal achieved evidence", () => {
    const oldGoalEvidence = buildOperationsStep2Evidence("Goal achieved", {
      id: "old-goal-evidence",
      updatedAt: "2026-06-22T09:00:00.000Z",
    });
    const newerWorkingTowardsEvidence = buildOperationsStep2Evidence("Working towards", {
      id: "newer-working-towards-evidence",
      updatedAt: "2026-06-22T10:00:00.000Z",
    });

    const unifiedStateIndex = buildUnifiedPathwayStepStateIndex({
      evidenceEntries: [oldGoalEvidence, newerWorkingTowardsEvidence],
    });
    const unifiedStepState = getUnifiedPathwayStepState(unifiedStateIndex, OPERATIONS_STEP_2_ID);

    expect(unifiedStepState?.latestEvidenceEntry?.id).toBe("newer-working-towards-evidence");
    expect(unifiedStepState?.latestEvidenceProgressLevel).toBe("Working towards");
    expect(unifiedStepState?.pathwayProgressFromEvidence).toBe("Evidence started");
  });

  it("uses the same latest evidence status for the current focus grouping", () => {
    const evidenceOverrides = new Map<string, NumberPathwayEvidenceStatusOverride>([
      [OPERATIONS_STEP_2_ID, { status: "Secure", updatedAt: Date.parse("2026-06-22T10:00:00.000Z") }],
    ]);
    const olderDevelopingAttempt = buildOperationsStep2Attempt({
      completedAt: "2026-06-22T09:05:00.000Z",
      updatedAt: "2026-06-22T09:05:00.000Z",
    });

    const groups = getNumberPathwayRevealGroups(
      [
        {
          id: 1,
          displayOrder: 1,
          title: "Act out joining and taking away in everyday stories",
          stageKey: "foundation-kindergarten",
          stageTitle: "Kindergarten / Early Elementary",
          stepKey: "act-out-joining-and-taking-away-in-everyday-stories",
          pathwayStepId: buildPathwayStepId(
            "mathematics",
            "operations-and-calculation",
            "foundation-kindergarten",
            "act-out-joining-and-taking-away-in-everyday-stories",
          ),
        },
        {
          id: 2,
          displayOrder: 2,
          title: "Share, compare, and notice simple differences",
          stageKey: "foundation-kindergarten",
          stageTitle: "Kindergarten / Early Elementary",
          stepKey: "share-compare-and-notice-simple-differences",
          pathwayStepId: OPERATIONS_STEP_2_ID,
        },
        {
          id: 3,
          displayOrder: 3,
          title: "Use counting strategies and known facts more efficiently",
          stageKey: "lower-primary",
          stageTitle: "Lower Primary",
          stepKey: "use-counting-strategies-and-known-facts-more-efficiently",
          pathwayStepId: buildPathwayStepId(
            "mathematics",
            "operations-and-calculation",
            "lower-primary",
            "use-counting-strategies-and-known-facts-more-efficiently",
          ),
        },
      ],
      [olderDevelopingAttempt],
      {
        subjectKey: "mathematics",
        strandKey: "operations-and-calculation",
        evidenceStatusByPathwayStepId: evidenceOverrides,
      },
    );

    expect(groups.secureHistory.some((step) => step.pathwayStepId === OPERATIONS_STEP_2_ID)).toBe(
      true,
    );
    expect(groups.currentLearningZone[0]?.pathwayStepId).toBe(
      buildPathwayStepId(
        "mathematics",
        "operations-and-calculation",
        "lower-primary",
        "use-counting-strategies-and-known-facts-more-efficiently",
      ),
    );
  });

  it("keeps a newer digital attempt ahead of older worksheet evidence", () => {
    const evidenceOverrides = new Map<string, NumberPathwayEvidenceStatusOverride>([
      [OPERATIONS_STEP_2_ID, { status: "Secure", updatedAt: Date.parse("2026-06-22T09:00:00.000Z") }],
    ]);
    const newerDevelopingAttempt = buildOperationsStep2Attempt({
      completedAt: "2026-06-22T10:05:00.000Z",
      updatedAt: "2026-06-22T10:05:00.000Z",
    });

    const groups = getNumberPathwayRevealGroups(
      [
        {
          id: 2,
          displayOrder: 2,
          title: "Share, compare, and notice simple differences",
          stageKey: "foundation-kindergarten",
          stageTitle: "Kindergarten / Early Elementary",
          stepKey: "share-compare-and-notice-simple-differences",
          pathwayStepId: OPERATIONS_STEP_2_ID,
        },
      ],
      [newerDevelopingAttempt],
      {
        subjectKey: "mathematics",
        strandKey: "operations-and-calculation",
        evidenceStatusByPathwayStepId: evidenceOverrides,
      },
    );

    expect(groups.currentLearningZone[0]?.autoCheck.status).toBe("Developing");
  });

  it("maps arts music pathway evidence into curriculum area and element coverage", () => {
    const pathwayStepId = buildPathwayStepId(
      "arts",
      "music-and-sound",
      "foundation-kindergarten",
      "listen-and-respond-to-beat-and-sound-changes",
    );

    const assessmentStatus: CleanAssessmentSkillStatus = {
      id: "status-2",
      familyId: "family-1",
      learnerId: "learner-1",
      subjectKey: "arts",
      skillKey: pathwayStepId,
      stageKey: "foundation-kindergarten",
      status: "Secure",
      note: "The learner responds confidently to beat and sound changes.",
      createdByUserId: "user-1",
      createdAt: "2026-05-24T09:00:00.000Z",
      updatedAt: "2026-05-24T09:00:00.000Z",
      pathwayStepId,
      strandKey: "music-and-sound",
      stepKey: "listen-and-respond-to-beat-and-sound-changes",
    };

    const pathwayContext = buildPathwayCaptureContext({
      source: "my-pathways",
      subjectKey: "arts",
      subjectLabel: "Arts",
      pathwayKey: "music-and-sound",
      pathwayLabel: "Music and sound",
      stageKey: "foundation-kindergarten",
      stageLabel: "Foundation / Kindergarten",
      pathwayStepId,
      stepKey: "listen-and-respond-to-beat-and-sound-changes",
      stepNumber: "1",
      stepTitle: "Listen and respond to beat and sound changes",
      stepMeaning:
        "Notice loud and quiet, fast and slow, high and low, and simple beat patterns in music and sound play.",
      skillFocus: "early music listening",
      observedSkillStatus: "Secure",
    });

    const evidenceEntry: CleanEvidenceEntry = {
      id: "evidence-2",
      familyId: "family-1",
      learnerId: "learner-1",
      programId: null,
      calendarItemId: null,
      observedOn: "2026-05-24",
      title: "Music listening response",
      whatHappened:
        "The learner listened to a beat pattern, noticed sound changes, and responded with movement and clapping.",
      reflection: "Confidence was settled and consistent.",
      learningArea: "Arts",
      curriculumNodeIds: encodePathwayContextNodeIds([], pathwayContext),
      includeInPortfolio: true,
      includeInReport: true,
      createdByUserId: "user-1",
      createdAt: "2026-05-24T10:00:00.000Z",
      updatedAt: "2026-05-24T10:00:00.000Z",
    };

    const profile: FamilyProfile = {
      id: "family-1",
      createdByUserId: "user-1",
      displayName: "Family",
      countryCode: "US",
      jurisdictionCode: "FL",
      curriculumFrameworkId: null,
      reportingMode: "standard",
      weekStart: "monday",
      privacyDefault: "family",
      exportStyle: "clean",
      defaultLearnerId: "learner-1",
      createdAt: null,
      updatedAt: null,
    };
    const learner: Learner = {
      id: "learner-1",
      familyId: "family-1",
      firstName: "Casey",
      preferredName: null,
      surname: "Learner",
      yearLevel: "Foundation",
      notes: null,
      createdByUserId: "user-1",
      createdAt: null,
      updatedAt: null,
    };

    const resolvedFramework = resolveCurriculumFrameworkMap(profile);
    const coverageSummary = buildCurriculumCoverageSummary({
      resolvedFramework,
      entries: [evidenceEntry],
      assessmentStatuses: [assessmentStatus],
    });
    const pdfModel = buildCurriculumCoveragePdfModel({
      profile,
      learner,
      entries: [evidenceEntry],
      assessmentStatuses: [assessmentStatus],
      generatedOn: "2026-05-24",
    });
    const artsArea = coverageSummary.areaSummaries.find((item) => item.area.key === "arts");
    const musicElement = artsArea?.elementSummaries.find((item) => item.element.key === "music");
    const pdfArtsArea = pdfModel.coverageSummary.areaSummaries.find(
      (item) => item.area.key === "arts",
    );

    expect(artsArea?.count).toBe(1);
    expect(artsArea?.status).toBe("Evidence started");
    expect(artsArea?.latestEntry?.id).toBe("evidence-2");
    expect(artsArea?.assessmentSummary.secure).toBeGreaterThanOrEqual(1);
    expect(musicElement?.count).toBe(1);
    expect(musicElement?.latestEntry?.id).toBe("evidence-2");
    expect(coverageSummary.linkedEvidenceEntries[0]?.entry.id).toBe("evidence-2");
    expect(pdfArtsArea?.count).toBe(1);
    expect(pdfModel.coverageSummary.linkedEvidenceEntries[0]?.entry.id).toBe("evidence-2");
  });
});
