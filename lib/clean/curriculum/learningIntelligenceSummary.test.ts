import { describe, expect, it } from "vitest";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import {
  buildPathwayCaptureContext,
  encodePathwayContextNodeIds,
} from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import {
  buildLearningIntelligenceSummary,
  formatLearningAreaCount,
} from "@/lib/clean/curriculum/learningIntelligenceSummary";
import { buildPathwayStepId } from "@/lib/clean/pathways/pathwayStepRegistry";

function makePathwayEvidence(
  overrides: Partial<CleanEvidenceEntry> & {
    id: string;
    subjectKey?: "mathematics" | "arts";
    subjectLabel?: string;
    strandKey?: string;
    strandLabel?: string;
    stageKey?: string;
    stageLabel?: string;
    stepKey?: string;
    stepTitle?: string;
    observedOn?: string;
  },
): CleanEvidenceEntry {
  const subjectKey = overrides.subjectKey ?? "mathematics";
  const subjectLabel = overrides.subjectLabel ?? "Mathematics";
  const strandKey = overrides.strandKey ?? "number-and-place-value";
  const strandLabel = overrides.strandLabel ?? "Number and place value";
  const stageKey = overrides.stageKey ?? "foundation-kindergarten";
  const stageLabel = overrides.stageLabel ?? "Foundation / Kindergarten";
  const stepKey =
    overrides.stepKey ?? "partition-and-combine-small-collections-up-to-10";
  const stepTitle =
    overrides.stepTitle ?? "Partition and combine small collections up to 10";
  const pathwayStepId = buildPathwayStepId(subjectKey, strandKey, stageKey, stepKey);
  const pathwayContext = buildPathwayCaptureContext({
    source: "my-pathways",
    subjectKey,
    subjectLabel,
    pathwayKey: strandKey,
    pathwayLabel: strandLabel,
    stageKey,
    stageLabel,
    pathwayStepId,
    stepKey,
    stepNumber: "1",
    stepTitle,
    stepMeaning: "Use concrete materials to show the learning step.",
    skillFocus: "current pathway work",
    observedSkillStatus: "Evidence started",
  });

  return {
    id: overrides.id,
    familyId: "family-1",
    learnerId: "learner-1",
    programId: null,
    calendarItemId: null,
    observedOn: overrides.observedOn ?? "2026-05-24",
    title: overrides.title ?? `${subjectLabel} learning record`,
    whatHappened: overrides.whatHappened ?? "The learner completed useful pathway work.",
    reflection: overrides.reflection ?? null,
    learningArea: overrides.learningArea ?? subjectLabel,
    curriculumNodeIds: encodePathwayContextNodeIds([], pathwayContext),
    attachmentUrls: overrides.attachmentUrls ?? [],
    imageUrl: overrides.imageUrl ?? null,
    includeInPortfolio: overrides.includeInPortfolio ?? false,
    includeInReport: overrides.includeInReport ?? false,
    createdByUserId: "user-1",
    createdAt: overrides.createdAt ?? `${overrides.observedOn ?? "2026-05-24"}T09:00:00.000Z`,
    updatedAt: overrides.updatedAt ?? `${overrides.observedOn ?? "2026-05-24"}T09:00:00.000Z`,
  };
}

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
    expect(summary.reportingReadiness.notExploredCount).toBe(0);
    expect(summary.reportingReadiness.representedAreaCount).toBe(0);
    expect(summary.reportingReadiness).not.toHaveProperty("needsMoreEvidenceCount");
    expect(summary.activeLearningAreaCount).toBe(0);
    expect(summary.nextLearningSteps).toHaveLength(0);
    expect(summary.hasMeaningfulProgressTrend).toBe(false);
    expect(summary.hasMeaningfulStrengths).toBe(false);
  });

  it("does not mark an evidenced learning area as inactive", () => {
    const summary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      evidenceEntries: [makePathwayEvidence({ id: "evidence-math-1" })],
      assessmentStatuses: [],
      referenceDate: "2026-05-24",
    });

    const mathematics = summary.allSubjectRows.find((row) => row.subjectKey === "mathematics");
    const inactiveMathematics = summary.inactiveLearningAreaRows.find(
      (row) => row.subjectKey === "mathematics",
    );

    expect(mathematics?.learningAreaStatus).toBe("Evidence recorded");
    expect(mathematics?.isActiveLearningArea).toBe(true);
    expect(inactiveMathematics).toBeUndefined();
  });

  it("excludes inactive learning areas from focus areas and next recommendations", () => {
    const summary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      evidenceEntries: [makePathwayEvidence({ id: "evidence-math-1" })],
      assessmentStatuses: [],
      referenceDate: "2026-05-24",
    });

    expect(summary.focusAreas.every((item) => item.subjectKey === "mathematics")).toBe(true);
    expect(summary.nextLearningSteps.every((item) => item.subjectKey === "mathematics")).toBe(true);
    expect(summary.inactiveLearningAreaRows.some((row) => row.subjectKey === "english")).toBe(
      true,
    );
  });

  it("uses step-scoped evidence and progress wording for next recommendations", () => {
    const summary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      evidenceEntries: [makePathwayEvidence({ id: "evidence-math-1" })],
      assessmentStatuses: [],
      referenceDate: "2026-05-24",
    });

    const recommendationReasons = summary.nextLearningSteps.map((item) => item.reason);

    expect(recommendationReasons.join(" ")).toContain("specific step");
    expect(recommendationReasons.join(" ")).toContain("progress judgement");
    expect(recommendationReasons.join(" ")).not.toContain("saved confidence");
    expect(recommendationReasons.join(" ")).not.toContain("No linked evidence");
  });

  it("hides trend and strength signals until there is enough evidence history", () => {
    const earlySummary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      evidenceEntries: [makePathwayEvidence({ id: "evidence-math-1" })],
      assessmentStatuses: [],
      referenceDate: "2026-05-24",
    });
    const establishedSummary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      evidenceEntries: [
        makePathwayEvidence({
          id: "evidence-math-1",
          observedOn: "2026-03-10",
          stepKey: "recognise-small-quantities-without-counting",
          stepTitle: "Recognise small quantities without counting",
        }),
        makePathwayEvidence({
          id: "evidence-math-2",
          observedOn: "2026-04-12",
          stepKey: "match-spoken-number-names-to-quantities",
          stepTitle: "Match spoken number names to quantities",
        }),
        makePathwayEvidence({
          id: "evidence-math-3",
          observedOn: "2026-05-24",
          stepKey: "identify-numerals-0-10",
          stepTitle: "Identify numerals 0-10",
        }),
      ],
      assessmentStatuses: [],
      referenceDate: "2026-05-24",
    });

    expect(earlySummary.hasMeaningfulProgressTrend).toBe(false);
    expect(earlySummary.hasMeaningfulStrengths).toBe(false);
    expect(establishedSummary.hasMeaningfulProgressTrend).toBe(true);
    expect(establishedSummary.hasMeaningfulStrengths).toBe(true);
  });

  it("builds reporting readiness from report ingredients, not untouched curriculum", () => {
    const summary = buildLearningIntelligenceSummary({
      learnerYearLevel: "Foundation",
      evidenceEntries: [
        makePathwayEvidence({
          id: "evidence-math-1",
          includeInPortfolio: true,
          includeInReport: true,
        }),
      ],
      assessmentStatuses: [],
      referenceDate: "2026-05-24",
    });

    expect(summary.reportingReadiness.representedAreaCount).toBe(1);
    expect(summary.reportingReadiness.checklist.find((item) => item.key === "portfolio-evidence")?.complete).toBe(true);
    expect(summary.reportingReadiness.checklist.find((item) => item.key === "report-evidence")?.complete).toBe(true);
    expect(summary.areaCountLabel).toBe("1 area");
    expect(formatLearningAreaCount(2)).toBe("2 areas");
  });
});
