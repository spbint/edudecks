import type { MathematicsLearningProfilePresentationV1 } from "../mathematicsLearningProfilePresentation";
import type { NumberOperationsBaselinePersistenceDraft } from "@/lib/clean/assessments/placement/numberOperationsPersistenceDraft";

export const EI_STAGING_PROJECT_REF = "owvxggviughmpursepof" as const;
export const EI_STAGING_BRANCH_NAME = "intelligence-staging" as const;

export type StaffLearningEvidenceSaveRequest = {
  operation: "save-starting-point";
  familyId: string;
  learnerId: string;
  attemptId: string;
  attemptKind: "initial" | "recheck";
  draft: NumberOperationsBaselinePersistenceDraft;
};
export type StaffLearningEvidenceSavedAttempt = {
  attemptId: string;
  attemptKind: "initial" | "recheck";
  assessmentId: string;
  assessmentVersion: number;
  startedAt: string;
  completedAt: string;
  evaluatedAt: string;
  resultCount: number;
  reused: boolean;
  reviewDefaults: {
    reviewState: "not-reviewed";
    confirmationState: "not-confirmed";
    portfolioInclusion: "not-decided";
  };
  provenanceSummary: string;
  presentation: MathematicsLearningProfilePresentationV1;
};

export type StaffLearningEvidenceHistory = {
  target: {
    branchName: typeof EI_STAGING_BRANCH_NAME;
    projectRef: typeof EI_STAGING_PROJECT_REF;
  };
  learner: {
    id: string;
    displayName: string;
  };
  attempts: StaffLearningEvidenceSavedAttempt[];
};
