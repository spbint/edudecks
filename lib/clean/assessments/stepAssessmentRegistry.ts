import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  getNumberStepAssessmentForPathwayStep,
  getNumberStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/numberStepAssessmentRegistry";
import {
  getOperationsStepAssessmentForPathwayStep,
  getOperationsStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/operationsStepAssessmentRegistry";
import {
  getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
  getFractionsDecimalsPercentagesStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/fractionsDecimalsPercentagesStepAssessmentRegistry";
import {
  getRatioProportionalReasoningStepAssessmentForPathwayStep,
  getRatioProportionalReasoningStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/ratioProportionalReasoningStepAssessmentRegistry";
import {
  getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
  getAlgebraPatternsFunctionsStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/algebraPatternsFunctionsStepAssessmentRegistry";
import type {
  NumberStepAssessment,
  NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

type StepAssessmentContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepAssessmentKey?: string | null;
  strandKey?: string | null;
};

export type CleanStepAssessment = Omit<
  NumberStepAssessment,
  "strandKey" | "parentBankKey"
> & {
  strandKey: string;
  parentBankKey: string;
  stageKey: CleanAssessmentStageKey;
  items: NumberAssessmentBankItem[];
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function preferOperations(context: StepAssessmentContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepAssessmentKey = safe(context.stepAssessmentKey);

  return (
    strandKey === "operations-and-calculation" ||
    pathwayStepId.includes("::operations-and-calculation::") ||
    stepAssessmentKey.startsWith("operations-step-")
  );
}

function preferFractionsDecimalsPercentages(context: StepAssessmentContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepAssessmentKey = safe(context.stepAssessmentKey);

  return (
    strandKey === "fractions-decimals-percentages" ||
    pathwayStepId.includes("::fractions-decimals-percentages::") ||
    stepAssessmentKey.startsWith("fractions-decimals-percentages-step-")
  );
}

function preferRatioProportionalReasoning(context: StepAssessmentContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepAssessmentKey = safe(context.stepAssessmentKey);

  return (
    strandKey === "ratio-and-proportional-reasoning" ||
    pathwayStepId.includes("::ratio-and-proportional-reasoning::") ||
    stepAssessmentKey.startsWith("ratio-proportional-reasoning-step-")
  );
}

function preferAlgebraPatternsFunctions(context: StepAssessmentContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepAssessmentKey = safe(context.stepAssessmentKey);

  return (
    strandKey === "algebra-patterns-and-functions" ||
    pathwayStepId.includes("::algebra-patterns-and-functions::") ||
    stepAssessmentKey.startsWith("algebra-patterns-functions-step-")
  );
}

export function getStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
): CleanStepAssessment | null {
  const registries = preferOperations(context)
    ? [
        getOperationsStepAssessmentForPathwayStep,
        getNumberStepAssessmentForPathwayStep,
        getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
        getRatioProportionalReasoningStepAssessmentForPathwayStep,
        getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
      ]
    : preferFractionsDecimalsPercentages(context)
      ? [
          getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
          getNumberStepAssessmentForPathwayStep,
          getOperationsStepAssessmentForPathwayStep,
          getRatioProportionalReasoningStepAssessmentForPathwayStep,
          getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
        ]
      : preferRatioProportionalReasoning(context)
        ? [
            getRatioProportionalReasoningStepAssessmentForPathwayStep,
            getNumberStepAssessmentForPathwayStep,
            getOperationsStepAssessmentForPathwayStep,
            getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
            getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
          ]
        : preferAlgebraPatternsFunctions(context)
          ? [
              getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
              getNumberStepAssessmentForPathwayStep,
              getOperationsStepAssessmentForPathwayStep,
              getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
              getRatioProportionalReasoningStepAssessmentForPathwayStep,
            ]
          : [
              getNumberStepAssessmentForPathwayStep,
              getOperationsStepAssessmentForPathwayStep,
              getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
              getRatioProportionalReasoningStepAssessmentForPathwayStep,
              getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
            ];

  for (const getAssessment of registries) {
    const assessment = getAssessment(context);
    if (assessment) return assessment;
  }

  return null;
}

export function getStepAssessmentItemsForDepth(
  assessment: CleanStepAssessment,
  depth: NumberStepAssessmentDepth,
) {
  if (assessment.strandKey === "operations-and-calculation") {
    return getOperationsStepAssessmentItemsForDepth(assessment.key, depth);
  }

  if (assessment.strandKey === "fractions-decimals-percentages") {
    return getFractionsDecimalsPercentagesStepAssessmentItemsForDepth(
      assessment.key,
      depth,
    );
  }

  if (assessment.strandKey === "ratio-and-proportional-reasoning") {
    return getRatioProportionalReasoningStepAssessmentItemsForDepth(
      assessment.key,
      depth,
    );
  }

  if (assessment.strandKey === "algebra-patterns-and-functions") {
    return getAlgebraPatternsFunctionsStepAssessmentItemsForDepth(
      assessment.key,
      depth,
    );
  }

  return getNumberStepAssessmentItemsForDepth(assessment.key, depth);
}
