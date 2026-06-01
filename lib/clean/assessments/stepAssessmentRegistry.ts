import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import {
  getNumberStepAssessmentForPathwayStep,
  getNumberStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/numberStepAssessmentRegistry";
import {
  getOperationsStepAssessmentForPathwayStep,
  getOperationsStepAssessmentItemsForDepth,
} from "@/lib/clean/assessments/operationsStepAssessmentRegistry";
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

export function getStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
): CleanStepAssessment | null {
  const registries = preferOperations(context)
    ? [getOperationsStepAssessmentForPathwayStep, getNumberStepAssessmentForPathwayStep]
    : [getNumberStepAssessmentForPathwayStep, getOperationsStepAssessmentForPathwayStep];

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

  return getNumberStepAssessmentItemsForDepth(assessment.key, depth);
}
