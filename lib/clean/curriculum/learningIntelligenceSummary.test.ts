import { describe, expect, it } from "vitest";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import {
  buildPathwayCaptureContext,
  encodePathwayContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildLearningIntelligenceSummary,
} from "@/lib/clean/curriculum/learningIntelligenceSummary";
import { buildPathwayStepId } from "@/lib/clean/pathways/pathwayStepRegistry";

describe("learning intelligence summary", () => {
  it("builds subject and strand intelligence from shared pathway state", () => {
    const pathwayStepId = buildPathwayStepId(
      "arts",
      "music-and-sound",
      "foundation-kindergarten",
      "listen-and-respond-to-beat-and-sound-changes",
    );

    const assessmentStatus: CleanAssessmentSkillStatus = {
      id: "status-arts-1",
      familyId: "family-1",
      learnerId: "learner-1",
      subjectKey: "arts",
      skillKey: pathwayStepId,
      stageKey: "foundation-kindergarten",
      status: "Secure",
      note: "Beat and sound response is consistent.",
      createdByUserId: "user-1",
      createdAt: "2026-05-24T09:00:00.000Z",
      updatedAt: "2026-05-24T09:30:00.000Z",
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
      id: "evidence-arts-1",
      familyId: "family-1",
      learnerId: "learner-1",
      programId: null,
      calendarItemId: null,
      observedOn: "2026-05-24",
      title: "Music listening response",
      whatHappened:
        "The learner listened to changing beats and responded with clapping and movement.",
      reflection: "Confidence was settled and joyful.",
      learningArea: "Arts",
      curriculumNodeIds: encodePathwayContextNodeIds([], pathwayContext),
      includeInPortfolio: true,
      includeInReport: true,
      createdByUserId: "user-1",
      createdAt: "2026-05-24T10:00:00.000Z",
      updatedAt: "2026-05-24T10:00:00.000Z",
    };

    const allSummary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      evidenceEntries: [evidenceEntry],
      assessmentStatuses: [assessmentStatus],
      referenceDate: "2026-05-24",
    });
    const artsSummary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      selectedSubjectKey: "arts",
      evidenceEntries: [evidenceEntry],
      assessmentStatuses: [assessmentStatus],
      referenceDate: "2026-05-24",
    });

    const artsRow = allSummary.allSubjectRows.find((row) => row.subjectKey === "arts");
    const musicRow = artsSummary.scopeRows.find(
      (row) => row.strandKey === "music-and-sound",
    );

    expect(allSummary.totalSubjects).toBe(7);
    expect(allSummary.scopeRows).toHaveLength(7);
    expect(allSummary.recentActivity.some((item) => item.pathwayStepId === pathwayStepId)).toBe(
      true,
    );
    expect(allSummary.progressOverTime.reduce((sum, point) => sum + point.totalCount, 0)).toBe(2);
    expect(artsRow?.evidenceLinkedCount).toBeGreaterThanOrEqual(1);
    expect(artsRow?.secureStrongCount).toBeGreaterThanOrEqual(1);
    expect(artsRow?.readiness).toBe("Ready");
    expect(artsSummary.selectedSubjectTitle).toBe("Arts");
    expect(artsSummary.scopeLabel).toBe("Strand progress");
    expect(musicRow?.title).toBe("Music and sound");
    expect(musicRow?.evidenceLinkedCount).toBeGreaterThanOrEqual(1);
    expect(musicRow?.secureStrongCount).toBeGreaterThanOrEqual(1);
    expect(artsSummary.reportingReadiness.readyCount).toBeGreaterThanOrEqual(1);
    expect(artsSummary.nextLearningSteps.length).toBeGreaterThan(0);
  });

  it("frames untouched learning areas as not explored rather than deficits", () => {
    const summary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      evidenceEntries: [],
      assessmentStatuses: [],
      referenceDate: "2026-05-24",
    });

    expect(summary.isEmpty).toBe(true);
    expect(summary.scopeRows.every((row) => row.readiness === "Not explored yet")).toBe(true);
    expect(summary.reportingReadiness.notExploredCount).toBe(summary.scopeRows.length);
    expect(summary.reportingReadiness).not.toHaveProperty("needsMoreEvidenceCount");
  });
});
