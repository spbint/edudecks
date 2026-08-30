import { describe, expect, it } from "vitest";
import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import { buildPathwayCaptureContext, encodePathwayContextNodeIds } from "@/lib/clean/evidence/curriculumContext";
import type { CleanEvidenceEntry } from "@/lib/clean/evidence/types";
import { buildUnifiedPathwayStepStateIndex } from "@/lib/clean/pathways/pathwayStepState";
import { getAllPathwaySteps } from "@/lib/clean/pathways/pathwayStepRegistry";
import { selectCurrentLearningCandidates } from "@/lib/clean/pathways/currentLearningCandidates";

const [stepOneItem, stepTwoItem] = getAllPathwaySteps().filter((step) => step.subjectKey === "mathematics");
const stepOne = stepOneItem!.id;
const stepTwo = stepTwoItem!.id;
const extraSteps = getAllPathwaySteps().filter((step) => step.subjectKey === "mathematics").slice(2, 5).map((step) => step.id);

function status(id: string, pathwayStepId = stepOne, updatedAt = "2026-08-30T10:00:00.000Z"): CleanAssessmentSkillStatus {
  return { id, familyId: "family-a", learnerId: "learner-a", subjectKey: stepOneItem!.subjectKey, skillKey: pathwayStepId, stageKey: stepOneItem!.stageKey as CleanAssessmentSkillStatus["stageKey"], status: "Developing", note: null, createdByUserId: "user-a", createdAt: updatedAt, updatedAt, pathwayStepId, strandKey: stepOneItem!.strandKey, stepKey: pathwayStepId.split("::").at(-1) || "" };
}
function evidence(id: string, pathwayStepId: string | null, updatedAt = "2026-08-29T10:00:00.000Z"): CleanEvidenceEntry {
  const context = pathwayStepId ? buildPathwayCaptureContext({ source: "my-pathways", subjectKey: stepOneItem!.subjectKey, pathwayKey: stepOneItem!.strandKey, stageKey: stepOneItem!.stageKey, pathwayStepId, stepKey: pathwayStepId.split("::").at(-1), stepTitle: "Canonical work" }) : null;
  return { id, familyId: "family-a", learnerId: "learner-a", programId: null, calendarItemId: null, observedOn: "2026-08-29", title: "Learning", whatHappened: "Learning", reflection: null, learningArea: "Mathematics", curriculumNodeIds: context ? encodePathwayContextNodeIds([], context) : [], attachmentUrls: [], imageUrl: null, includeInPortfolio: true, includeInReport: true, createdByUserId: "user-a", createdAt: updatedAt, updatedAt };
}
function attempt(pathwayStepId = stepTwo): CleanAssessmentAttempt {
  return { id: "attempt-a", familyId: "family-a", learnerId: "learner-a", subjectKey: stepTwoItem!.subjectKey, strandKey: stepTwoItem!.strandKey, stageKey: stepTwoItem!.stageKey as CleanAssessmentAttempt["stageKey"], pathwayStepId, stepKey: pathwayStepId.split("::").at(-1) || "", progressionBandKey: null, itemBankKey: "bank", mode: "mini_check", sourceRoute: null, status: "completed", itemCount: 2, attemptedCount: 2, autoCorrectCount: 1, autoIncorrectCount: 1, reviewNeededCount: 0, summarySnapshot: {}, startedAt: null, completedAt: "2026-08-28T10:00:00.000Z", createdByUserId: "user-a", createdAt: "2026-08-28T10:00:00.000Z", updatedAt: "2026-08-28T10:00:00.000Z" };
}

describe("current learning candidates", () => {
  it("surfaces canonical parent confirmations even when a legacy focus list is empty", () => {
    const index = buildUnifiedPathwayStepStateIndex({ assessmentStatuses: [status("confirmed-a")], evidenceEntries: Array.from({ length: 31 }, (_, index) => evidence(`generic-${index}`, null)) });
    expect(selectCurrentLearningCandidates({ stepIndex: index, fallbackPathwayStepIds: [] })).toMatchObject([{ pathwayStepId: stepOne, source: "parent-confirmation" }]);
  });
  it("prioritises confirmation, then canonical evidence, then checks; dedupes and limits to three", () => {
    const index = buildUnifiedPathwayStepStateIndex({ assessmentStatuses: [status("confirmed-a", stepOne)], evidenceEntries: [evidence("linked-a", stepOne), evidence("linked-b", stepTwo)] });
    const candidates = selectCurrentLearningCandidates({ stepIndex: index, attempts: [attempt(stepTwo)], fallbackPathwayStepIds: [stepOne, stepTwo], limit: 3 });
    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toMatchObject({ pathwayStepId: stepOne, source: "parent-confirmation" });
    expect(candidates[1]).toMatchObject({ pathwayStepId: stepTwo, source: "linked-evidence" });
  });
  it("allows check-only canonical steps and excludes generic evidence", () => {
    const empty = buildUnifiedPathwayStepStateIndex({ evidenceEntries: [evidence("generic", null)] });
    expect(selectCurrentLearningCandidates({ stepIndex: empty })).toEqual([]);
    expect(selectCurrentLearningCandidates({ stepIndex: empty, attempts: [attempt()] })).toMatchObject([{ pathwayStepId: stepTwo, source: "completed-check" }]);
  });
  it("keeps at most three recent canonical confirmations and recalculates per learner input", () => {
    const learnerA = buildUnifiedPathwayStepStateIndex({ assessmentStatuses: [status("a-one", stepOne, "2026-08-30T10:00:00.000Z"), status("a-two", stepTwo, "2026-08-29T10:00:00.000Z"), ...extraSteps.map((step, index) => status(`a-extra-${index}`, step, `2026-08-2${index}T10:00:00.000Z`))] });
    const learnerB = buildUnifiedPathwayStepStateIndex({ evidenceEntries: [evidence("b-generic", null)] });
    expect(selectCurrentLearningCandidates({ stepIndex: learnerA })).toHaveLength(3);
    expect(selectCurrentLearningCandidates({ stepIndex: learnerB })).toEqual([]);
  });
});
