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
  | "array-choice"
  | "place-value-blocks-choice"
  | "fraction-bar-choice"
  | "shape-set-choice"
  | "multiple-choice"
  | "short-answer";

export type CounterSetStimulus = {
  quantity: number;
  arrangement?: "line" | "array" | "scattered" | "dice" | "ten-frame-like" | "five-frame";
  seed?: number;
  maxQuantity?: number;
};

export type TenFrameStimulus = {
  filled: number;
  total?: 10;
  orientation?: "horizontal" | "vertical";
  fillOrder?: "left-to-right" | "top-row-first" | "custom";
  customFilledCells?: number[];
};

export type NumberLineStimulus = {
  min: number;
  max: number;
  step?: number;
  marker?: number;
  hiddenLabels?: number[];
  highlightedSegment?: {
    from: number;
    to: number;
  };
  jumps?: Array<{
    from: number;
    to: number;
    label?: string;
  }>;
};

export type ArrayStimulus = {
  rows: number;
  columns: number;
  itemShape?: "dot" | "square" | "circle";
  highlightRows?: number[];
  highlightColumns?: number[];
  showGrouping?: boolean;
};

export type PlaceValueBlocksStimulus = {
  thousands?: number;
  hundreds?: number;
  tens?: number;
  ones?: number;
  layout?: "grouped" | "expanded" | "compact";
};

export type FractionBarStimulus = {
  numerator: number;
  denominator: number;
  comparison?: Array<{
    numerator: number;
    denominator: number;
    label?: string;
  }>;
  showLabels?: boolean;
};

export type ShapeSetStimulus = {
  shapes: Array<{
    type: "circle" | "triangle" | "square" | "rectangle" | "hexagon";
    count?: number;
    size?: "sm" | "md" | "lg";
    rotation?: number;
    label?: string;
  }>;
  arrangement?: "row" | "grid" | "scattered";
  seed?: number;
};

export type MyLearnaAssessmentStimulus =
  | { type: "counter-set"; data: CounterSetStimulus; altText?: string }
  | { type: "ten-frame"; data: TenFrameStimulus; altText?: string }
  | { type: "number-line"; data: NumberLineStimulus; altText?: string }
  | { type: "array"; data: ArrayStimulus; altText?: string }
  | { type: "place-value-blocks"; data: PlaceValueBlocksStimulus; altText?: string }
  | { type: "fraction-bar"; data: FractionBarStimulus; altText?: string }
  | { type: "shape-set"; data: ShapeSetStimulus; altText?: string }
  | { type: string; data: Record<string, unknown>; altText?: string };

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
  stimulus: MyLearnaAssessmentStimulus;
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
