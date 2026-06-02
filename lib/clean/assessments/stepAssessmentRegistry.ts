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
import {
  getMeasurementStepAssessmentForPathwayStep,
  getMeasurementStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/measurementStepAssessmentRegistry";
import {
  getGeometrySpatialReasoningStepAssessmentForPathwayStep,
  getGeometrySpatialReasoningStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/geometrySpatialReasoningStepAssessmentRegistry";
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

function preferMeasurement(context: StepAssessmentContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepAssessmentKey = safe(context.stepAssessmentKey);

  return (
    strandKey === "measurement" ||
    pathwayStepId.includes("::measurement::") ||
    stepAssessmentKey.startsWith("measurement-step-")
  );
}

function preferGeometrySpatialReasoning(context: StepAssessmentContext) {
  const strandKey = safe(context.strandKey);
  const pathwayStepId = safe(context.pathwayStepId);
  const stepAssessmentKey = safe(context.stepAssessmentKey);

  return (
    strandKey === "geometry-and-spatial-reasoning" ||
    pathwayStepId.includes("::geometry-and-spatial-reasoning::") ||
    stepAssessmentKey.startsWith("geometry-spatial-reasoning-step-")
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
        getMeasurementStepAssessmentForPathwayStep,
        getGeometrySpatialReasoningStepAssessmentForPathwayStep,
      ]
    : preferFractionsDecimalsPercentages(context)
      ? [
          getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
          getNumberStepAssessmentForPathwayStep,
          getOperationsStepAssessmentForPathwayStep,
          getRatioProportionalReasoningStepAssessmentForPathwayStep,
          getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
          getMeasurementStepAssessmentForPathwayStep,
          getGeometrySpatialReasoningStepAssessmentForPathwayStep,
        ]
      : preferRatioProportionalReasoning(context)
        ? [
            getRatioProportionalReasoningStepAssessmentForPathwayStep,
            getNumberStepAssessmentForPathwayStep,
            getOperationsStepAssessmentForPathwayStep,
            getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
            getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
            getMeasurementStepAssessmentForPathwayStep,
            getGeometrySpatialReasoningStepAssessmentForPathwayStep,
          ]
        : preferAlgebraPatternsFunctions(context)
          ? [
              getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
              getNumberStepAssessmentForPathwayStep,
              getOperationsStepAssessmentForPathwayStep,
              getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
              getRatioProportionalReasoningStepAssessmentForPathwayStep,
              getMeasurementStepAssessmentForPathwayStep,
              getGeometrySpatialReasoningStepAssessmentForPathwayStep,
            ]
          : preferMeasurement(context)
            ? [
                getMeasurementStepAssessmentForPathwayStep,
                getNumberStepAssessmentForPathwayStep,
                getOperationsStepAssessmentForPathwayStep,
                getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
                getRatioProportionalReasoningStepAssessmentForPathwayStep,
                getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
                getGeometrySpatialReasoningStepAssessmentForPathwayStep,
              ]
            : preferGeometrySpatialReasoning(context)
              ? [
                  getGeometrySpatialReasoningStepAssessmentForPathwayStep,
                  getNumberStepAssessmentForPathwayStep,
                  getOperationsStepAssessmentForPathwayStep,
                  getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
                  getRatioProportionalReasoningStepAssessmentForPathwayStep,
                  getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
                  getMeasurementStepAssessmentForPathwayStep,
                ]
              : [
                  getNumberStepAssessmentForPathwayStep,
                  getOperationsStepAssessmentForPathwayStep,
                  getFractionsDecimalsPercentagesStepAssessmentForPathwayStep,
                  getRatioProportionalReasoningStepAssessmentForPathwayStep,
                  getAlgebraPatternsFunctionsStepAssessmentForPathwayStep,
                  getMeasurementStepAssessmentForPathwayStep,
                  getGeometrySpatialReasoningStepAssessmentForPathwayStep,
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

  if (assessment.strandKey === "measurement") {
    return getMeasurementStepAssessmentItemsForDepth(assessment.key, depth);
  }

  if (assessment.strandKey === "geometry-and-spatial-reasoning") {
    return getGeometrySpatialReasoningStepAssessmentItemsForDepth(
      assessment.key,
      depth,
    );
  }

  return getNumberStepAssessmentItemsForDepth(assessment.key, depth);
}
