import {
  getNumberStepPracticeForPathwayStep,
  getNumberStepPracticeTasksForDepth,
} from "@/lib/clean/practice/numberStepPracticeRegistry";
import {
  getOperationsStepPracticeForPathwayStep,
  getOperationsStepPracticeTasksForDepth,
} from "@/lib/clean/practice/operationsStepPracticeRegistry";
import {
  getFractionsDecimalsPercentagesStepPracticeForPathwayStep,
  getFractionsDecimalsPercentagesStepPracticeTasksForDepth,
} from "@/lib/clean/practice/fractionsDecimalsPercentagesStepPracticeRegistry";
import {
  getRatioProportionalReasoningStepPracticeForPathwayStep,
  getRatioProportionalReasoningStepPracticeTasksForDepth,
} from "@/lib/clean/practice/ratioProportionalReasoningStepPracticeRegistry";
import {
  getAlgebraPatternsFunctionsStepPracticeForPathwayStep,
  getAlgebraPatternsFunctionsStepPracticeTasksForDepth,
} from "@/lib/clean/practice/algebraPatternsFunctionsStepPracticeRegistry";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import type {
  NumberStepPractice,
  NumberStepPracticeDepth,
} from "@/lib/clean/practice/numberStepPracticeTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

type StepPracticeContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepPracticeKey?: string | null;
  strandKey?: string | null;
};

export type CleanStepPractice = Omit<NumberStepPractice, "strandKey"> & {
  strandKey: string;
  stageKey: CleanAssessmentStageKey;
  tasks: NumberPracticeTask[];
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function preferOperations(context: StepPracticeContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepPracticeKey = safe(context.stepPracticeKey);

  return (
    strandKey === "operations-and-calculation" ||
    pathwayStepId.includes("::operations-and-calculation::") ||
    stepPracticeKey.startsWith("operations-step-")
  );
}

function preferFractionsDecimalsPercentages(context: StepPracticeContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepPracticeKey = safe(context.stepPracticeKey);

  return (
    strandKey === "fractions-decimals-percentages" ||
    pathwayStepId.includes("::fractions-decimals-percentages::") ||
    stepPracticeKey.startsWith("fractions-decimals-percentages-step-")
  );
}

function preferRatioProportionalReasoning(context: StepPracticeContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepPracticeKey = safe(context.stepPracticeKey);

  return (
    strandKey === "ratio-and-proportional-reasoning" ||
    pathwayStepId.includes("::ratio-and-proportional-reasoning::") ||
    stepPracticeKey.startsWith("ratio-proportional-reasoning-step-")
  );
}

function preferAlgebraPatternsFunctions(context: StepPracticeContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepPracticeKey = safe(context.stepPracticeKey);

  return (
    strandKey === "algebra-patterns-and-functions" ||
    pathwayStepId.includes("::algebra-patterns-and-functions::") ||
    stepPracticeKey.startsWith("algebra-patterns-functions-step-")
  );
}

export function getStepPracticeForPathwayStep(
  context: StepPracticeContext,
): CleanStepPractice | null {
  const registries = preferOperations(context)
    ? [
        getOperationsStepPracticeForPathwayStep,
        getNumberStepPracticeForPathwayStep,
        getFractionsDecimalsPercentagesStepPracticeForPathwayStep,
        getRatioProportionalReasoningStepPracticeForPathwayStep,
        getAlgebraPatternsFunctionsStepPracticeForPathwayStep,
      ]
    : preferFractionsDecimalsPercentages(context)
      ? [
          getFractionsDecimalsPercentagesStepPracticeForPathwayStep,
          getNumberStepPracticeForPathwayStep,
          getOperationsStepPracticeForPathwayStep,
          getRatioProportionalReasoningStepPracticeForPathwayStep,
          getAlgebraPatternsFunctionsStepPracticeForPathwayStep,
        ]
      : preferRatioProportionalReasoning(context)
        ? [
            getRatioProportionalReasoningStepPracticeForPathwayStep,
            getNumberStepPracticeForPathwayStep,
            getOperationsStepPracticeForPathwayStep,
            getFractionsDecimalsPercentagesStepPracticeForPathwayStep,
            getAlgebraPatternsFunctionsStepPracticeForPathwayStep,
          ]
        : preferAlgebraPatternsFunctions(context)
          ? [
              getAlgebraPatternsFunctionsStepPracticeForPathwayStep,
              getNumberStepPracticeForPathwayStep,
              getOperationsStepPracticeForPathwayStep,
              getFractionsDecimalsPercentagesStepPracticeForPathwayStep,
              getRatioProportionalReasoningStepPracticeForPathwayStep,
            ]
          : [
              getNumberStepPracticeForPathwayStep,
              getOperationsStepPracticeForPathwayStep,
              getFractionsDecimalsPercentagesStepPracticeForPathwayStep,
              getRatioProportionalReasoningStepPracticeForPathwayStep,
              getAlgebraPatternsFunctionsStepPracticeForPathwayStep,
            ];

  for (const getPractice of registries) {
    const practice = getPractice(context);
    if (practice) return practice;
  }

  return null;
}

export function getStepPracticeTasksForDepth(
  practice: CleanStepPractice,
  depth: NumberStepPracticeDepth,
) {
  if (practice.strandKey === "operations-and-calculation") {
    return getOperationsStepPracticeTasksForDepth(practice.key, depth);
  }

  if (practice.strandKey === "fractions-decimals-percentages") {
    return getFractionsDecimalsPercentagesStepPracticeTasksForDepth(
      practice.key,
      depth,
    );
  }

  if (practice.strandKey === "ratio-and-proportional-reasoning") {
    return getRatioProportionalReasoningStepPracticeTasksForDepth(
      practice.key,
      depth,
    );
  }

  if (practice.strandKey === "algebra-patterns-and-functions") {
    return getAlgebraPatternsFunctionsStepPracticeTasksForDepth(
      practice.key,
      depth,
    );
  }

  return getNumberStepPracticeTasksForDepth(practice.key, depth);
}
