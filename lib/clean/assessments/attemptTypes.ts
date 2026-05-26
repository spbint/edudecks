import type {
  CleanAssessmentStageKey,
  CleanAssessmentSubjectKey,
} from "@/lib/clean/assessments/types";

export const CLEAN_ASSESSMENT_ATTEMPT_MODES = [
  "diagnostic",
  "mini_check",
  "post_check",
  "practice_check",
] as const;

export const CLEAN_ASSESSMENT_ATTEMPT_STATUSES = [
  "in_progress",
  "completed",
  "abandoned",
] as const;

export const CLEAN_ASSESSMENT_ATTEMPT_LOCAL_RESULTS = [
  "correct",
  "incorrect",
  "review_needed",
  "unanswered",
] as const;

export type AssessmentAttemptMode =
  (typeof CLEAN_ASSESSMENT_ATTEMPT_MODES)[number];

export type AssessmentAttemptStatus =
  (typeof CLEAN_ASSESSMENT_ATTEMPT_STATUSES)[number];

export type AssessmentAttemptLocalResult =
  (typeof CLEAN_ASSESSMENT_ATTEMPT_LOCAL_RESULTS)[number];

export type CleanAssessmentAttemptSnapshot = Record<string, unknown>;

export type CleanAssessmentAttempt = {
  id: string;
  familyId: string;
  learnerId: string;
  subjectKey: CleanAssessmentSubjectKey;
  strandKey: string;
  stageKey: CleanAssessmentStageKey;
  pathwayStepId: string;
  stepKey: string;
  progressionBandKey: string | null;
  itemBankKey: string;
  mode: AssessmentAttemptMode;
  sourceRoute: string | null;
  status: AssessmentAttemptStatus;
  itemCount: number;
  attemptedCount: number;
  autoCorrectCount: number;
  autoIncorrectCount: number;
  reviewNeededCount: number;
  summarySnapshot: CleanAssessmentAttemptSnapshot;
  startedAt: string | null;
  completedAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CleanAssessmentAttemptResponse = {
  id: string;
  familyId: string;
  learnerId: string;
  assessmentAttemptId: string;
  itemId: string;
  itemOrder: number;
  progressionStepKey: string | null;
  answerType: string;
  localResult: AssessmentAttemptLocalResult;
  responseText: string | null;
  selectedOption: string | null;
  itemSnapshot: CleanAssessmentAttemptSnapshot;
  submittedAt: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateCleanAssessmentAttemptInput = {
  learnerId: string;
  subjectKey: CleanAssessmentSubjectKey;
  strandKey: string;
  stageKey: CleanAssessmentStageKey;
  pathwayStepId: string;
  stepKey: string;
  progressionBandKey?: string | null;
  itemBankKey: string;
  mode?: AssessmentAttemptMode;
  sourceRoute?: string | null;
  status?: AssessmentAttemptStatus;
  itemCount?: number;
  attemptedCount?: number;
  autoCorrectCount?: number;
  autoIncorrectCount?: number;
  reviewNeededCount?: number;
  summarySnapshot?: CleanAssessmentAttemptSnapshot;
  startedAt?: string | null;
  completedAt?: string | null;
  createdByUserId?: string | null;
};

export type CreateCleanAssessmentAttemptResponseInput = {
  itemId: string;
  itemOrder: number;
  progressionStepKey?: string | null;
  answerType: string;
  localResult?: AssessmentAttemptLocalResult;
  responseText?: string | null;
  selectedOption?: string | null;
  itemSnapshot?: CleanAssessmentAttemptSnapshot;
  submittedAt?: string | null;
};

export type CreateCleanAssessmentAttemptResponsesInput = {
  learnerId: string;
  assessmentAttemptId: string;
  createdByUserId?: string | null;
  responses: CreateCleanAssessmentAttemptResponseInput[];
};

export type CompleteCleanAssessmentAttemptInput = {
  attemptId: string;
  itemCount?: number;
  attemptedCount: number;
  autoCorrectCount: number;
  autoIncorrectCount: number;
  reviewNeededCount: number;
  summarySnapshot: CleanAssessmentAttemptSnapshot;
  completedAt?: string | null;
};

export type ListCleanAssessmentAttemptsOptions = {
  learnerId: string;
  pathwayStepId?: string | null;
  itemBankKey?: string | null;
  status?: AssessmentAttemptStatus | null;
  limit?: number;
};

export type CleanAssessmentAttemptWithResponses = {
  attempt: CleanAssessmentAttempt | null;
  responses: CleanAssessmentAttemptResponse[];
};
