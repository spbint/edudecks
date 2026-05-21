export type CleanGuidanceStepKey =
  | "family-profile"
  | "learners"
  | "jurisdiction"
  | "academic-year"
  | "learning-periods"
  | "master-template"
  | "pathways"
  | "programs"
  | "generate-week"
  | "capture"
  | "portfolio"
  | "reports";

export type CleanGuidanceState = {
  id: string;
  familyId: string;
  currentStepKey: CleanGuidanceStepKey | null;
  completedSteps: string[];
  dismissedSteps: string[];
  isMyDayReady: boolean;
  notes: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanGuidanceStateInput = {
  currentStepKey?: CleanGuidanceStepKey | null;
  completedSteps?: string[];
  dismissedSteps?: string[];
  isMyDayReady?: boolean;
  notes?: string | null;
};

export type CleanGuidanceCard = {
  key: CleanGuidanceStepKey;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  status: "next" | "available" | "done";
};

export type BuildCleanGuidanceCardsInput = {
  hasFamilyProfile: boolean;
  learnerCount: number;
  hasJurisdictionProfile: boolean;
  hasAcademicYear: boolean;
  hasLearningPeriods: boolean;
  hasMasterTemplate: boolean;
  hasPrograms: boolean;
  hasCurrentWeekItems: boolean;
  hasTodayItems: boolean;
  hasEvidence: boolean;
  hasPortfolioHighlights: boolean;
  hasReports: boolean;
};
