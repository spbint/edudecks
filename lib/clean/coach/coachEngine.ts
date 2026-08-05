import type { CoachEngineResult, CoachState, CoachRecommendation } from "./types";

function learnerRoute(base: string, state: CoachState) {
  if (!state.activeLearnerId) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}learnerId=${encodeURIComponent(state.activeLearnerId)}`;
}

function recommendation(
  state: CoachState,
  input: Omit<CoachRecommendation, "learnerId"> & { learnerId?: string | null },
): CoachRecommendation {
  return {
    ...input,
    learnerId: input.learnerId ?? state.activeLearnerId,
  };
}

export function getCoachRecommendation(state: CoachState): CoachEngineResult {
  if (
    !state.authenticated ||
    !state.workspaceResolved ||
    !state.setupResolved ||
    state.workspaceError ||
    state.schemaMissing
  ) {
    return null;
  }

  if (!state.hasFamilyProfile) {
    return recommendation(state, {
      id: "setup-family-profile",
      category: "setup",
      priority: 1,
      audience: "new-family",
      title: "Start with your family profile",
      body: "MyLearna will use this space to organise planning, evidence, portfolios and reports.",
      reason: "Your family profile is the first part of setup.",
      primaryActionLabel: "Open My Profile",
      primaryRoute: "/my-profile",
      canSpotlight: true,
      mandatorySetup: true,
      canSnooze: false,
    });
  }

  if (!state.hasLearner) {
    return recommendation(state, {
      id: "setup-first-learner",
      category: "setup",
      priority: 2,
      audience: "new-family",
      title: "Add your first learner",
      body: "Each learner gets their own pathways, evidence, Portfolio and reports.",
      reason: "A learner is needed before the family space can be personalised.",
      primaryActionLabel: "Add a learner",
      primaryRoute: "/my-profile",
      canSpotlight: true,
      mandatorySetup: true,
      canSnooze: false,
    });
  }

  if (state.hasMultipleLearners && !state.activeLearnerId) {
    return recommendation(state, {
      id: "choose-active-learner",
      category: "learner",
      priority: 2,
      audience: "configured-family",
      title: "Choose who you are supporting",
      body: "Choose a learner so the next action opens the right pathways, evidence and records.",
      reason: "There is more than one authorised learner and no active learner is selected.",
      primaryActionLabel: "Choose learner",
      primaryRoute: "/my-profile",
      secondaryAction: { label: "Not now", kind: "snooze" },
      canSpotlight: false,
      mandatorySetup: false,
      canSnooze: true,
    });
  }

  if (!state.hasLearningSettings) {
    return recommendation(state, {
      id: "setup-learning-settings",
      category: "setup",
      priority: 3,
      audience: "new-family",
      title: "Choose your learning settings",
      body: "Set the country, learning context and reporting preferences that suit your family.",
      reason: "Required Settings are not complete yet.",
      primaryActionLabel: "Open My Settings",
      primaryRoute: "/my-settings",
      canSpotlight: true,
      mandatorySetup: true,
      canSnooze: false,
    });
  }

  if (!state.hasLearningYear) {
    return recommendation(state, {
      id: "setup-learning-year",
      category: "setup",
      priority: 4,
      audience: "new-family",
      title: "Create your learning year",
      body: "A learning year gives your family calendar and records a clear home.",
      reason: "Your calendar needs a learning year before periods and weekly plans.",
      primaryActionLabel: "Set up My Calendar",
      primaryRoute: "/my-calendar",
      canSpotlight: true,
      mandatorySetup: true,
      canSnooze: false,
    });
  }

  if (!state.hasTeachingPeriod) {
    return recommendation(state, {
      id: "setup-learning-period",
      category: "setup",
      priority: 5,
      audience: "new-family",
      title: "Add your first learning period",
      body: "Add a non-break learning period so weekly planning has a clear place to begin.",
      reason: "A learning period is the next required calendar step.",
      primaryActionLabel: "Add a learning period",
      primaryRoute: "/my-calendar",
      canSpotlight: true,
      mandatorySetup: true,
      canSnooze: false,
    });
  }

  if (!state.hasWeeklyBlock) {
    return recommendation(state, {
      id: "setup-weekly-block",
      category: "setup",
      priority: 6,
      audience: "new-family",
      title: "Add your first weekly learning block",
      body: "One simple weekly block is enough to let My Day show what is planned.",
      reason: "Your first weekly plan is the final required setup step.",
      primaryActionLabel: "Add a weekly block",
      primaryRoute: "/my-calendar",
      canSpotlight: true,
      mandatorySetup: true,
      canSnooze: false,
    });
  }

  if (state.route !== "/my-day" && !state.todayHasPlannedLearning) {
    return recommendation(state, {
      id: "activation-review-my-day",
      category: "activation",
      priority: 7,
      audience: "configured-family",
      title: "Review today’s learning",
      body: "Your first learning plan is ready to review in My Day.",
      reason: "Calendar setup is complete and My Day is the next useful handoff.",
      primaryActionLabel: "Open My Day",
      primaryRoute: "/my-day",
      secondaryAction: { label: "Not now", kind: "snooze" },
      canSpotlight: true,
      mandatorySetup: false,
      canSnooze: true,
    });
  }

  if (!state.hasPathway) {
    return recommendation(state, {
      id: "activation-choose-pathway",
      category: "activation",
      audience: "learner-specific",
      priority: 8,
      title: "Choose a starting pathway",
      body: "Open the active learner’s pathways and choose a useful place to begin.",
      reason: "No pathway placement is recorded for the active learner yet.",
      primaryActionLabel: "Open My Pathways",
      primaryRoute: learnerRoute("/my-pathways", state),
      secondaryAction: { label: "Not now", kind: "snooze" },
      canSpotlight: true,
      mandatorySetup: false,
      canSnooze: true,
    });
  }

  if (!state.hasEvidence) {
    return recommendation(state, {
      id: "activation-capture-learning",
      category: "activation",
      audience: "learner-specific",
      priority: 9,
      title: state.activeLearnerName
        ? `Capture ${state.activeLearnerName}'s learning`
        : "Capture a learning moment",
      body: "Save a quick note, photo or learning moment so it is ready for Portfolio and reporting later.",
      reason: "The active learner has a pathway but no saved evidence yet.",
      primaryActionLabel: "Quick Capture",
      primaryRoute: learnerRoute("/my-capture?mode=quick", state),
      secondaryAction: { label: "Not now", kind: "snooze" },
      canSpotlight: false,
      mandatorySetup: false,
      canSnooze: true,
    });
  }

  if (!state.hasPortfolioItem) {
    return recommendation(state, {
      id: "activation-review-portfolio",
      category: "activation",
      audience: "learner-specific",
      priority: 10,
      title: "Review the saved learning",
      body: "Take a look at the active learner’s evidence in My Portfolio.",
      reason: "Saved evidence is available but no Portfolio item is recorded for this learner.",
      primaryActionLabel: "Open My Portfolio",
      primaryRoute: learnerRoute("/my-portfolio", state),
      secondaryAction: { label: "Not now", kind: "snooze" },
      canSpotlight: true,
      mandatorySetup: false,
      canSnooze: true,
    });
  }

  if (state.reportReadiness === "ready" && !state.hasReport) {
    return recommendation(state, {
      id: "returning-preview-report",
      category: "returning",
      audience: "learner-specific",
      priority: 11,
      title: "Preview your report",
      body: "Your current records support a report preview for the active learner.",
      reason: "The current report-readiness source confirms a preview is available.",
      primaryActionLabel: "Preview report",
      primaryRoute: learnerRoute("/my-reports", state),
      secondaryAction: { label: "Not now", kind: "snooze" },
      canSpotlight: true,
      mandatorySetup: false,
      canSnooze: true,
    });
  }

  return recommendation(state, {
    id: "returning-capture-learning",
    category: "returning",
    audience: "configured-family",
    priority: 12,
    title: "Capture what happened today",
    body: "Save a quick note, photo or learning moment so it is ready for Portfolio and reporting later.",
    reason: "Your core setup is complete and no stronger next action is available from current data.",
    primaryActionLabel: "Quick Capture",
    primaryRoute: learnerRoute("/my-capture?mode=quick", state),
    secondaryAction: { label: "Not now", kind: "snooze" },
    canSpotlight: false,
    mandatorySetup: false,
    canSnooze: true,
  });
}
