import {
  RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_KEY,
  RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_TITLE,
  RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS,
  RATIO_PROPORTIONAL_REASONING_STEP_SPECS,
  RATIO_PROPORTIONAL_REASONING_STRAND_KEY,
} from "@/lib/clean/assessments/ratioProportionalReasoningStepAssessmentRegistry";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const RATIO_PROPORTIONAL_REASONING_PRACTICE_MODULE_KEY =
  "ratio-proportional-reasoning-step-practice-module-v1";

export type RatioProportionalReasoningStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof RATIO_PROPORTIONAL_REASONING_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof RATIO_PROPORTIONAL_REASONING_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_TITLE;
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
  return { type: "context_card" as const, description };
}

function makePracticeTask(
  spec: (typeof RATIO_PROPORTIONAL_REASONING_STEP_SPECS)[number],
  relatedAssessmentItemId: string,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];
  const fallbackTitle = `Practice ${index + 1}`;

  return {
    id: `ratio-proportional-reasoning-step-${spec.order}-practice-${String(
      index + 1,
    ).padStart(3, "0")}`,
    title: item?.title ?? fallbackTitle,
    prompt: item?.practicePrompt ?? spec.description,
    taskType: "multiple_choice",
    options: item?.options ?? [],
    expectedAnswer: item?.answer ?? "",
    acceptableAnswers: item?.answer ? [item.answer] : [],
    supportPrompt:
      "Use the visual first. Compare the two linked quantities, then check whether the same relationship is kept.",
    workedSolution: item?.answer ? `The matching answer is ${item.answer}.` : "",
    misconceptionTargets: item?.misconceptionTargets ?? [],
    relatedAssessmentItemIds: [relatedAssessmentItemId],
    visualSupport: visual(item?.visual ?? spec.description),
  };
}

export const RATIO_PROPORTIONAL_REASONING_STEP_PRACTICES:
  RatioProportionalReasoningStepPractice[] =
  RATIO_PROPORTIONAL_REASONING_STEP_SPECS.flatMap((spec) => {
    const assessment = RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      return [];
    }

    return [{
      key: `ratio-proportional-reasoning-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description: `Practise ${spec.shortTitle.toLowerCase()} with scaffolded ratio tables, double number lines, bar models, and context cards before checking independently.`,
      subjectKey: "mathematics",
      strandKey: RATIO_PROPORTIONAL_REASONING_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: RATIO_PROPORTIONAL_REASONING_PRACTICE_MODULE_KEY,
      parentModuleTitle: RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem.id, index),
      ),
    }];
  });

export function getRatioProportionalReasoningStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    RATIO_PROPORTIONAL_REASONING_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getRatioProportionalReasoningStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    RATIO_PROPORTIONAL_REASONING_STEP_PRACTICES.find(
      (candidate) => candidate.key === practiceKey,
    ) || null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const RATIO_PROPORTIONAL_REASONING_STEP_PRACTICE_METADATA = {
  parentFamilyKey: RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_KEY,
  parentFamilyTitle: RATIO_PROPORTIONAL_REASONING_PARENT_FAMILY_TITLE,
  moduleKey: RATIO_PROPORTIONAL_REASONING_PRACTICE_MODULE_KEY,
};
