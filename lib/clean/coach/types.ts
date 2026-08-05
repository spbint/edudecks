export type CoachSupportMode = "automatic" | "help";

export type CoachRecommendationCategory =
  | "setup"
  | "activation"
  | "returning"
  | "learner";

export type CoachState = {
  authenticated: boolean;
  workspaceResolved: boolean;
  setupResolved: boolean;
  workspaceError: boolean;
  schemaMissing: boolean;
  route: string;
  hasFamilyProfile: boolean;
  hasLearner: boolean;
  hasLearningSettings: boolean;
  hasLearningYear: boolean;
  hasTeachingPeriod: boolean;
  hasWeeklyBlock: boolean;
  hasPathway: boolean;
  hasEvidence: boolean;
  hasPortfolioItem: boolean;
  hasReport: boolean;
  learners: Array<{ id: string; displayName: string }>;
  activeLearnerId: string | null;
  activeLearnerName: string | null;
  hasMultipleLearners: boolean;
  todayHasPlannedLearning?: boolean;
  pathwayInteractionKnown?: boolean;
  pathwayInteracted?: boolean;
  reportReadiness?: "ready" | "blocked" | "unknown";
};

export type CoachRecommendation = {
  id: string;
  category: CoachRecommendationCategory;
  priority: number;
  audience: "new-family" | "configured-family" | "learner-specific";
  learnerId: string | null;
  title: string;
  body: string;
  reason: string;
  primaryActionLabel: string;
  primaryRoute: string;
  secondaryAction?: {
    label: string;
    kind: "snooze" | "choose-learner";
  };
  canSpotlight: boolean;
  mandatorySetup: boolean;
  canSnooze: boolean;
};

export type CoachEngineResult = CoachRecommendation | null;
