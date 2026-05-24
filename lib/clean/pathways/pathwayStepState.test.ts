import { describe, expect, it } from "vitest";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import {
  buildPathwayCaptureContext,
  encodePathwayContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
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
});
