import { NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE } from "@/lib/clean/practice/numberPlaceValueOperationsPracticeModules";
import {
  NUMBER_FOUNDATION_STEP_PRACTICES,
} from "@/lib/clean/practice/numberFoundationStepPracticeTasks";
import {
  NUMBER_LOWER_PRIMARY_STEP_PRACTICES,
} from "@/lib/clean/practice/numberLowerPrimaryStepPracticeTasks";
import {
  NUMBER_MIDDLE_PRIMARY_STEP_PRACTICES,
} from "@/lib/clean/practice/numberMiddlePrimaryStepPracticeTasks";
import {
  NUMBER_UPPER_PRIMARY_STEP_PRACTICES,
} from "@/lib/clean/practice/numberUpperPrimaryStepPracticeTasks";
import {
  NUMBER_LOWER_SECONDARY_STEP_PRACTICES,
} from "@/lib/clean/practice/numberLowerSecondaryStepPracticeTasks";
import {
  NUMBER_YEARS_9_10_STEP_PRACTICES,
} from "@/lib/clean/practice/numberYears910StepPracticeTasks";
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
      "Practise quick-look number recognition, matching small groups to numbers, and noticing that spacing or size does not change how many there are.",
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
  ...NUMBER_FOUNDATION_STEP_PRACTICES.map((practice) => ({
    key: practice.key,
    stepNumber: practice.stepNumber,
    stepKey: practice.stepKey,
    pathwayStepId: practice.pathwayStepId,
    title: practice.title,
    shortTitle: practice.shortTitle,
    description: practice.description,
    subjectKey: "mathematics" as const,
    strandKey: "number-and-place-value" as const,
    stageKey: "foundation-kindergarten" as const,
    parentModuleId: NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE.id,
    parentModuleTitle: NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE.title,
    relatedStepAssessmentKey: practice.relatedStepAssessmentKey,
    depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
    tasks: practice.tasks,
  })),
  ...NUMBER_LOWER_PRIMARY_STEP_PRACTICES.map((practice) => ({
    key: practice.key,
    stepNumber: practice.stepNumber,
    stepKey: practice.stepKey,
    pathwayStepId: practice.pathwayStepId,
    title: practice.title,
    shortTitle: practice.shortTitle,
    description: practice.description,
    subjectKey: "mathematics" as const,
    strandKey: "number-and-place-value" as const,
    stageKey: "lower-primary" as const,
    parentModuleId: practice.parentModuleId,
    parentModuleTitle: practice.parentModuleTitle,
    relatedStepAssessmentKey: practice.relatedStepAssessmentKey,
    depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
    tasks: practice.tasks,
  })),
  ...NUMBER_MIDDLE_PRIMARY_STEP_PRACTICES.map((practice) => ({
    key: practice.key,
    stepNumber: practice.stepNumber,
    stepKey: practice.stepKey,
    pathwayStepId: practice.pathwayStepId,
    title: practice.title,
    shortTitle: practice.shortTitle,
    description: practice.description,
    subjectKey: "mathematics" as const,
    strandKey: "number-and-place-value" as const,
    stageKey: "middle-primary" as const,
    parentModuleId: practice.parentModuleId,
    parentModuleTitle: practice.parentModuleTitle,
    relatedStepAssessmentKey: practice.relatedStepAssessmentKey,
    depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
    tasks: practice.tasks,
  })),
  ...NUMBER_UPPER_PRIMARY_STEP_PRACTICES.map((practice) => ({
    key: practice.key,
    stepNumber: practice.stepNumber,
    stepKey: practice.stepKey,
    pathwayStepId: practice.pathwayStepId,
    title: practice.title,
    shortTitle: practice.shortTitle,
    description: practice.description,
    subjectKey: "mathematics" as const,
    strandKey: "number-and-place-value" as const,
    stageKey: "upper-primary" as const,
    parentModuleId: practice.parentModuleId,
    parentModuleTitle: practice.parentModuleTitle,
    relatedStepAssessmentKey: practice.relatedStepAssessmentKey,
    depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
    tasks: practice.tasks,
  })),
  ...NUMBER_LOWER_SECONDARY_STEP_PRACTICES.map((practice) => ({
    key: practice.key,
    stepNumber: practice.stepNumber,
    stepKey: practice.stepKey,
    pathwayStepId: practice.pathwayStepId,
    title: practice.title,
    shortTitle: practice.shortTitle,
    description: practice.description,
    subjectKey: "mathematics" as const,
    strandKey: "number-and-place-value" as const,
    stageKey: "lower-secondary" as const,
    parentModuleId: practice.parentModuleId,
    parentModuleTitle: practice.parentModuleTitle,
    relatedStepAssessmentKey: practice.relatedStepAssessmentKey,
    depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
    tasks: practice.tasks,
  })),
  ...NUMBER_YEARS_9_10_STEP_PRACTICES.map((practice) => ({
    key: practice.key,
    stepNumber: practice.stepNumber,
    stepKey: practice.stepKey,
    pathwayStepId: practice.pathwayStepId,
    title: practice.title,
    shortTitle: practice.shortTitle,
    description: practice.description,
    subjectKey: "mathematics" as const,
    strandKey: "number-and-place-value" as const,
    stageKey: "years-9-10-consolidation" as const,
    parentModuleId: practice.parentModuleId,
    parentModuleTitle: practice.parentModuleTitle,
    relatedStepAssessmentKey: practice.relatedStepAssessmentKey,
    depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
    tasks: practice.tasks,
  })),
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
