import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";
import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "./numberOperationsPlacementResult";

export type NumberOperationsAttemptStageKind =
  | "initial"
  | "reserve"
  | "branch"
  | "search"
  | "boundary";

export type NumberOperationsAttemptStageRecord = {
  stage: NumberOperationsAttemptStageKind;
  pLevel: number;
  direction?: "down" | "up";
  bracket?: {
    lowerP: number;
    upperP: number;
  };
  responses: MyLearnaAssessmentResponse[];
};

export type NumberOperationsSubElementAttemptTrace = {
  schema: "mylearna-number-operations-sub-element-attempt";
  schemaVersion: 1;
  subElementKey: NumberOperationsSubElementKey;
  subElementLabel: string;
  stages: NumberOperationsAttemptStageRecord[];
  routeTrace: string[];
  evidenceLimitations: string[];
  result: NumberOperationsPlacementResult | null;
  itemCount: number;
  correctCount: number;
  incorrectCount: number;
};

export function buildNumberOperationsSubElementAttemptTrace(input: {
  subElementKey: NumberOperationsSubElementKey;
  subElementLabel: string;
  stages: NumberOperationsAttemptStageRecord[];
  routeTrace: string[];
  evidenceLimitations?: string[];
  result: NumberOperationsPlacementResult | null;
}): NumberOperationsSubElementAttemptTrace {
  const stages = input.stages.map((stage) => ({
    ...stage,
    responses: stage.responses.map((response) => ({
      ...response,
      selectedOptionIds: [...response.selectedOptionIds],
      misconceptionTags: [...response.misconceptionTags],
    })),
  }));
  const responses = stages.flatMap((stage) => stage.responses);
  const correctCount = responses.filter((response) => response.correct).length;

  return {
    schema: "mylearna-number-operations-sub-element-attempt",
    schemaVersion: 1,
    subElementKey: input.subElementKey,
    subElementLabel: input.subElementLabel,
    stages,
    routeTrace: [...input.routeTrace],
    evidenceLimitations: [...(input.evidenceLimitations || [])],
    result: input.result,
    itemCount: responses.length,
    correctCount,
    incorrectCount: responses.length - correctCount,
  };
}
