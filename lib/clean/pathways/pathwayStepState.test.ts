import { describe, expect, it } from "vitest";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
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
  getUnifiedPathwayStepState,
} from "@/lib/clean/pathways/pathwayStepState";

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
