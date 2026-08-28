import { describe, expect, it } from "vitest";
import { getCoachRecommendation } from "./coachEngine";
import type { CoachState } from "./types";

function state(overrides: Partial<CoachState> = {}): CoachState {
  return {
    authenticated: true,
    workspaceResolved: true,
    setupResolved: true,
    workspaceError: false,
    schemaMissing: false,
    route: "/my-day",
    hasFamilyProfile: true,
    hasLearner: true,
    hasLearningSettings: true,
    hasLearningYear: true,
    hasTeachingPeriod: true,
    hasWeeklyBlock: true,
    hasPathway: true,
    hasEvidence: true,
    hasPortfolioItem: true,
    hasReport: true,
    learners: [{ id: "learner-a", displayName: "A" }],
    activeLearnerId: "learner-a",
    activeLearnerName: "A",
    hasMultipleLearners: false,
    ...overrides,
  };
}

describe("MyLearna Coach recommendation engine", () => {
  it.each([
    [{ hasFamilyProfile: false }, "setup-family-profile"],
    [{ hasLearner: false }, "setup-first-learner"],
    [{ hasLearningSettings: false }, "setup-learning-settings"],
    [{ hasLearningYear: false }, "setup-learning-year"],
    [{ hasTeachingPeriod: false }, "setup-learning-period"],
    [{ hasWeeklyBlock: false }, "setup-weekly-block"],
  ])("prioritises mandatory setup: %s", (overrides, expected) => {
    expect(getCoachRecommendation(state(overrides))).toMatchObject({ id: expected, mandatorySetup: true });
  });

  it("keeps first-week planning in Calendar when settings are incomplete", () => {
    expect(
      getCoachRecommendation(
        state({ route: "/my-calendar", hasLearningSettings: false, hasWeeklyBlock: false }),
      ),
    ).toMatchObject({ id: "setup-weekly-block", primaryRoute: "/my-calendar" });
  });

  it("returns no recommendation while the authorised workspace is loading or errored", () => {
    expect(getCoachRecommendation(state({ workspaceResolved: false }))).toBeNull();
    expect(getCoachRecommendation(state({ setupResolved: false }))).toBeNull();
    expect(getCoachRecommendation(state({ workspaceError: true }))).toBeNull();
    expect(getCoachRecommendation(state({ schemaMissing: true }))).toBeNull();
  });

  it("moves through the public core activation journey from real signals", () => {
    for (const route of ["/my-day", "/my-calendar", "/my-portfolio", "/my-settings"]) {
      expect(getCoachRecommendation(state({ route, hasPathway: false }))).toMatchObject({ id: "returning-capture-learning" });
    }
    expect(getCoachRecommendation(state({ route: "/my-day", hasEvidence: false }))).toMatchObject({ id: "activation-capture-learning" });
    expect(getCoachRecommendation(state({ route: "/my-day", hasPortfolioItem: false }))).toMatchObject({ id: "activation-review-portfolio" });
  });

  it("does not use an absent or false today-plan signal to mask stronger actions", () => {
    for (const todayHasPlannedLearning of [undefined, false]) {
      expect(getCoachRecommendation(state({ route: "/my-day", todayHasPlannedLearning, hasPathway: false }))).toMatchObject({
        id: "returning-capture-learning",
      });
      expect(getCoachRecommendation(state({ route: "/my-day", todayHasPlannedLearning, hasEvidence: false }))).toMatchObject({
        id: "activation-capture-learning",
      });
      expect(getCoachRecommendation(state({ route: "/my-day", todayHasPlannedLearning, hasPortfolioItem: false }))).toMatchObject({
        id: "activation-review-portfolio",
      });
    }
  });

  it("keeps report preview behind governed readiness", () => {
    expect(getCoachRecommendation(state({ reportReadiness: "unknown", hasReport: false }))).not.toMatchObject({ id: "returning-preview-report" });
    expect(getCoachRecommendation(state({ reportReadiness: "blocked", hasReport: false }))).not.toMatchObject({ id: "returning-preview-report" });
    expect(getCoachRecommendation(state({ reportReadiness: "ready", hasReport: false }))).toMatchObject({ id: "returning-preview-report" });
  });

  it("uses the active learner and safe query handoffs", () => {
    const recommendation = getCoachRecommendation(state({ route: "/my-day", hasEvidence: false }));
    expect(recommendation?.learnerId).toBe("learner-a");
    expect(recommendation?.primaryRoute).toBe("/my-capture?mode=quick&learnerId=learner-a");
  });

  it("asks for a learner instead of guessing for a multi-learner family", () => {
    expect(
      getCoachRecommendation(
        state({ activeLearnerId: null, activeLearnerName: null, hasMultipleLearners: true }),
      ),
    ).toMatchObject({ id: "choose-active-learner", primaryActionLabel: "Choose learner" });
  });

  it("falls back to one calm Quick Capture recommendation", () => {
    const recommendation = getCoachRecommendation(state());
    expect(recommendation).toMatchObject({ id: "returning-capture-learning", primaryActionLabel: "Quick Capture" });
    expect([recommendation]).toHaveLength(1);
  });

  it("is deterministic for the same state", () => {
    const first = getCoachRecommendation(state({ route: "/my-day", hasReport: false }));
    const second = getCoachRecommendation(state({ route: "/my-day", hasReport: false }));
    expect(first).toEqual(second);
  });
});
