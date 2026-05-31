import { NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE } from "@/lib/clean/practice/numberPlaceValueOperationsPracticeModules";
import {
  NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PRACTICE_KEY,
  NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PRACTICE_METADATA,
  NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PRACTICE_TASKS,
} from "@/lib/clean/practice/numberStep1RecogniseSmallQuantitiesPracticeTasks";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
  type NumberStepPractice,
  type NumberStepPracticeDepth,
} from "@/lib/clean/practice/numberStepPracticeTypes";

type StepPracticeContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepPracticeKey?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_STEP_PRACTICES: NumberStepPractice[] = [
  {
    key: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PRACTICE_KEY,
    stepNumber: 1,
    stepKey: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PRACTICE_METADATA.stepKey,
    pathwayStepId:
      NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PRACTICE_METADATA.pathwayStepId,
    title: "Recognise small quantities without counting",
    shortTitle: "Recognise small quantities",
    description:
      "Practise subitising, matching small groups to numerals, and noticing that arrangement or spacing does not change quantity.",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    parentModuleId: NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE.id,
    parentModuleTitle: NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE.title,
    relatedStepAssessmentKey:
      NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PRACTICE_METADATA.relatedStepAssessmentKey,
    depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
    tasks: NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_PRACTICE_TASKS,
  },
];

export function getNumberStepPracticeByStepKey(stepKey: string) {
  return (
    NUMBER_STEP_PRACTICES.find((practice) => practice.stepKey === safe(stepKey)) ||
    null
  );
}

export function getNumberStepPracticeForPathwayStep(context: StepPracticeContext) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    NUMBER_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (stepKey && practice.stepKey === stepKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId),
    ) || null
  );
}

export function hasNumberStepPractice(context: StepPracticeContext) {
  return Boolean(getNumberStepPracticeForPathwayStep(context));
}

export function getNumberStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepPracticeDepth,
) {
  const practice =
    NUMBER_STEP_PRACTICES.find((candidate) => candidate.key === practiceKey) ||
    null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}
