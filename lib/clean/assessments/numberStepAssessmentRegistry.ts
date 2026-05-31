import {
  NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPlaceValueOperationsAssessmentItems";
import {
  NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_ITEMS,
  NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_KEY,
  NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PATHWAY_STEP_ID,
  NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_STEP_KEY,
} from "@/lib/clean/assessments/numberStep1RecogniseSmallQuantitiesAssessmentItems";
import {
  NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
  getNumberStepAssessmentDepthItemCount,
  type NumberStepAssessment,
  type NumberStepAssessmentDepth,
} from "@/lib/clean/assessments/numberStepAssessmentTypes";

type StepAssessmentContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepAssessmentKey?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_STEP_ASSESSMENTS: NumberStepAssessment[] = [
  {
    key: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_KEY,
    stepNumber: 1,
    stepKey: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_STEP_KEY,
    pathwayStepId: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PATHWAY_STEP_ID,
    title: "Recognise small quantities without counting",
    shortTitle: "Recognise small quantities",
    description:
      "Checks subitising, quick quantity recognition, matching small quantities to numerals, and noticing that spacing or arrangement does not change quantity.",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    parentBankKey: "place-value-and-whole-number-operations",
    parentBankTitle: "Place value and operations",
    parentItemBankKey: NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY,
    progressionBandKey: "place-value-and-whole-number-operations",
    sourceRoute: "/assessments/number",
    depthOptions: NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS,
    items: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_ITEMS,
  },
];

export function getNumberStepAssessmentByStepKey(stepKey: string) {
  return (
    NUMBER_STEP_ASSESSMENTS.find(
      (assessment) => assessment.stepKey === safe(stepKey),
    ) || null
  );
}

export function getNumberStepAssessmentForPathwayStep(
  context: StepAssessmentContext,
) {
  const stepAssessmentKey = safe(context.stepAssessmentKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    NUMBER_STEP_ASSESSMENTS.find(
      (assessment) =>
        (stepAssessmentKey && assessment.key === stepAssessmentKey) ||
        (stepKey && assessment.stepKey === stepKey) ||
        (pathwayStepId && assessment.pathwayStepId === pathwayStepId),
    ) || null
  );
}

export function hasNumberStepAssessment(context: StepAssessmentContext) {
  return Boolean(getNumberStepAssessmentForPathwayStep(context));
}

export function getNumberStepAssessmentItemsForDepth(
  assessmentKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const assessment =
    NUMBER_STEP_ASSESSMENTS.find((candidate) => candidate.key === assessmentKey) ||
    null;

  if (!assessment) return [];

  return assessment.items.slice(0, getNumberStepAssessmentDepthItemCount(depth));
}
