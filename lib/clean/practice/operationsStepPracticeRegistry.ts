import {
  OPERATIONS_PARENT_FAMILY_KEY,
  OPERATIONS_PARENT_FAMILY_TITLE,
  OPERATIONS_STEP_ASSESSMENTS,
  OPERATIONS_STEP_SPECS,
  OPERATIONS_STRAND_KEY,
} from "@/lib/clean/assessments/operationsStepAssessmentRegistry";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const OPERATIONS_PRACTICE_MODULE_KEY = "operations-step-practice-module-v1";

export type OperationsStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof OPERATIONS_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof OPERATIONS_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof OPERATIONS_PARENT_FAMILY_TITLE;
  relatedStepAssessmentKey: string;
  depthOptions: typeof NUMBER_STEP_PRACTICE_DEPTH_OPTIONS;
  tasks: NumberPracticeTask[];
};

type StepPracticeContext = {
  stepKey?: string | null;
  pathwayStepId?: string | null;
  stepPracticeKey?: string | null;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function visual(description: string) {
  return {
    type: "context_card" as const,
    description,
  };
}

function makePracticeTask(
  spec: (typeof OPERATIONS_STEP_SPECS)[number],
  relatedAssessmentItemId: string,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];
  const fallbackTitle = `Practice ${index + 1}`;

  return {
    id: `operations-step-${spec.order}-practice-${String(index + 1).padStart(3, "0")}`,
    title: item?.title ?? fallbackTitle,
    prompt: item?.practicePrompt ?? spec.description,
    taskType: "multiple_choice",
    options: item?.options ?? [],
    expectedAnswer: item?.answer ?? "",
    acceptableAnswers: item?.answer ? [item.answer] : [],
    supportPrompt:
      "Use the visual model first. Say what each group or jump means, then choose the answer.",
    workedSolution: item?.feedback ?? (item?.answer ? `The matching answer is ${item.answer}.` : ""),
    misconceptionTargets: item?.misconceptionTargets ?? [],
    relatedAssessmentItemIds: [relatedAssessmentItemId],
    visualSupport: visual(item?.visual ?? spec.description),
  };
}

export const OPERATIONS_STEP_PRACTICES: OperationsStepPractice[] =
  OPERATIONS_STEP_SPECS.flatMap((spec) => {
    const assessment = OPERATIONS_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      return [];
    }

    return [{
      key: `operations-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description: `Practise ${spec.shortTitle.toLowerCase()} with scaffolded visual tasks before checking independently.`,
      subjectKey: "mathematics",
      strandKey: OPERATIONS_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: OPERATIONS_PRACTICE_MODULE_KEY,
      parentModuleTitle: OPERATIONS_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem.id, index),
      ),
    }];
  });

export function getOperationsStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    OPERATIONS_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getOperationsStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    OPERATIONS_STEP_PRACTICES.find((candidate) => candidate.key === practiceKey) ||
    null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const OPERATIONS_STEP_PRACTICE_METADATA = {
  parentFamilyKey: OPERATIONS_PARENT_FAMILY_KEY,
  parentFamilyTitle: OPERATIONS_PARENT_FAMILY_TITLE,
  moduleKey: OPERATIONS_PRACTICE_MODULE_KEY,
};
