export type MyLearnaAssessmentItemStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "retired";

export type MyLearnaAssessmentTemplate =
  | "counter-card-choice"
  | "ten-frame-choice"
  | "number-line-choice"
  | "multiple-choice"
  | "short-answer";

export type MyLearnaAssessmentItem = {
  id: string;
  version: number;
  status: MyLearnaAssessmentItemStatus;
  curriculum?: {
    country?: string;
    jurisdiction?: string;
    code?: string;
    yearLevel?: string;
    strand?: string;
    substrand?: string;
  };
  skill: {
    id: string;
    name: string;
    description?: string;
  };
  misconceptionTags?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  template: MyLearnaAssessmentTemplate;
  prompt: string;
  stimulus: {
    type: string;
    data: Record<string, unknown>;
    altText?: string;
  };
  response: {
    type: "single-choice" | "multiple-choice" | "short-answer";
    options?: Array<{
      id: string;
      label?: string;
      value: unknown;
      feedback?: string;
    }>;
    correctOptionIds?: string[];
    correctValue?: unknown;
  };
  feedback: {
    correct: string;
    incorrect: string;
    hint?: string;
  };
  analytics?: {
    estimatedTimeSeconds?: number;
    tags?: string[];
  };
};

export type MyLearnaAssessmentResponse = {
  itemId: string;
  selectedOptionIds: string[];
  correct: boolean;
  skillId: string;
  misconceptionTags: string[];
  timeSpentSeconds?: number;
};

export type MyLearnaAssessmentSummary = {
  totalItems: number;
  correctItems: number;
  percentage: number;
  skillSummaries: Array<{
    skillId: string;
    skillName: string;
    correct: number;
    total: number;
  }>;
  suggestedNextStep: string;
};
