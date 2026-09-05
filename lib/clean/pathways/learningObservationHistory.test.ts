import { describe, expect, it } from "vitest";
import type { CleanAssessmentAttempt } from "@/lib/clean/assessments/attemptTypes";
import { getStepAssessmentForPathwayStep } from "@/lib/clean/assessments/stepAssessmentRegistry";
import { buildExplainableProgressStory } from "@/lib/clean/pathways/explainableProgressStory";
import { listComparableLearningObservations } from "@/lib/clean/pathways/learningObservationHistory";

const focus = {
  learnerId: "learner-a",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  pathwayStepId: "mathematics::number-and-place-value::middle-primary::estimate-and-check-reasonableness",
  stepKey: "estimate-and-check-reasonableness",
};
const stepAssessmentKey = getStepAssessmentForPathwayStep({
  pathwayStepId: focus.pathwayStepId,
  stepKey: focus.stepKey,
  strandKey: focus.strandKey,
})?.key || null;

function attempt(
  id: string,
  completedAt: string,
  status: "Secure" | "Consolidating" | "Developing" | "Needs support" = "Developing",
  overrides: Partial<CleanAssessmentAttempt> = {},
): CleanAssessmentAttempt {
  return {
    id,
    familyId: "family-a",
    ...focus,
    progressionBandKey: null,
    itemBankKey: "number-place-value-operations",
    mode: "mini_check",
    sourceRoute: "/my-pathways",
    status: "completed",
    itemCount: 5,
    attemptedCount: 5,
    autoCorrectCount: 3,
    autoIncorrectCount: 2,
    reviewNeededCount: 0,
    summarySnapshot: { prototypeMetadata: { autoCheckStatus: status, assessmentDepth: "standard", stepAssessmentKey } },
    startedAt: completedAt,
    completedAt,
    createdByUserId: "parent-a",
    createdAt: completedAt,
    updatedAt: completedAt,
    ...overrides,
  };
}

describe("comparable learning observation history", () => {
  it("returns completed exact-focus observations newest first using canonical result labels", () => {
    const result = listComparableLearningObservations({
      ...focus,
      attempts: [
        attempt("older", "2026-08-15T09:00:00.000Z", "Needs support"),
        attempt("latest", "2026-09-04T09:00:00.000Z", "Consolidating"),
        attempt("middle", "2026-08-28T09:00:00.000Z", "Developing"),
      ],
    });

    expect(result).toEqual([
      { attemptId: "latest", observedAt: "2026-09-04T09:00:00.000Z", status: "Consolidating" },
      { attemptId: "middle", observedAt: "2026-08-28T09:00:00.000Z", status: "Developing" },
      { attemptId: "older", observedAt: "2026-08-15T09:00:00.000Z", status: "Needs support" },
    ]);
  });

  it("excludes incomplete and non-matching learner or exact-step attempts", () => {
    const result = listComparableLearningObservations({
      ...focus,
      attempts: [
        attempt("included", "2026-09-04T09:00:00.000Z"),
        attempt("incomplete", "2026-09-03T09:00:00.000Z", "Developing", { status: "in_progress" }),
        attempt("other-learner", "2026-09-03T09:00:00.000Z", "Developing", { learnerId: "learner-b" }),
        attempt("other-step", "2026-09-03T09:00:00.000Z", "Developing", { pathwayStepId: "mathematics::number-and-place-value::middle-primary::another-step", stepKey: "another-step" }),
        attempt("other-strand", "2026-09-03T09:00:00.000Z", "Developing", { strandKey: "operations-and-calculation" }),
      ],
    });

    expect(result.map((item) => item.attemptId)).toEqual(["included"]);
  });

  it("keeps Basic and Comprehensive checks on the existing exact-step canonical status scale", () => {
    const result = listComparableLearningObservations({
      ...focus,
      attempts: [
        attempt("basic", "2026-09-02T09:00:00.000Z", "Developing", { summarySnapshot: { prototypeMetadata: { autoCheckStatus: "Developing", assessmentDepth: "basic", stepAssessmentKey } } }),
        attempt("comprehensive", "2026-09-03T09:00:00.000Z", "Consolidating", { summarySnapshot: { prototypeMetadata: { autoCheckStatus: "Consolidating", assessmentDepth: "comprehensive", stepAssessmentKey } } }),
      ],
    });

    expect(result.map((item) => item.status)).toEqual(["Consolidating", "Developing"]);
    expect(JSON.stringify(result)).not.toContain("growth");
  });

  it("agrees with the current Latest check derivation", () => {
    const attempts = [
      attempt("older", "2026-08-15T09:00:00.000Z", "Needs support"),
      attempt("latest", "2026-09-04T09:00:00.000Z", "Consolidating"),
    ];
    const history = listComparableLearningObservations({ ...focus, attempts });
    const story = buildExplainableProgressStory({
      pathwayStepId: focus.pathwayStepId,
      stepState: null,
      attempts,
    });

    expect(history[0]?.status).toBe(story.latestCheck?.factualStatus);
    expect(history[0]?.observedAt).toBe(story.latestCheck?.completedAt);
  });
});
