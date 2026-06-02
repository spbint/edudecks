import {
  PROBABILITY_CHANCE_PARENT_FAMILY_KEY,
  PROBABILITY_CHANCE_PARENT_FAMILY_TITLE,
  PROBABILITY_CHANCE_STEP_ASSESSMENTS,
  PROBABILITY_CHANCE_STEP_SPECS,
  PROBABILITY_CHANCE_STRAND_KEY,
} from "@/lib/clean/assessments/probabilityChanceStepAssessmentRegistry";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const PROBABILITY_CHANCE_PRACTICE_MODULE_KEY =
  "probability-and-chance-step-practice-module-v1";

export type ProbabilityChanceStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof PROBABILITY_CHANCE_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof PROBABILITY_CHANCE_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof PROBABILITY_CHANCE_PARENT_FAMILY_TITLE;
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
  spec: (typeof PROBABILITY_CHANCE_STEP_SPECS)[number],
  relatedAssessmentItemId: string,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];

  return {
    id: `probability-chance-step-${spec.order}-practice-${String(index + 1).padStart(
      3,
      "0",
    )}`,
    title: item.title,
    prompt: item.practicePrompt,
    taskType: "multiple_choice",
    options: item.options,
    expectedAnswer: item.answer,
    acceptableAnswers: [item.answer],
    supportPrompt:
      "Use the visual first. Check the outcomes, chance language, fairness, evidence, or risk before choosing the answer.",
    workedSolution: `The matching answer is ${item.answer}.`,
    misconceptionTargets: item.misconceptionTargets,
    relatedAssessmentItemIds: [relatedAssessmentItemId],
    visualSupport: visual(item.visual),
  };
}

export const PROBABILITY_CHANCE_STEP_PRACTICES: ProbabilityChanceStepPractice[] =
  PROBABILITY_CHANCE_STEP_SPECS.map((spec) => {
    const assessment = PROBABILITY_CHANCE_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      throw new Error(`Missing Probability assessment for ${spec.pathwayStepId}.`);
    }

    return {
      key: `probability-chance-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description: `Practise ${spec.shortTitle.toLowerCase()} with scaffolded chance language cards, spinners, dice, coin, counter bags, outcome tables, and risk contexts before checking independently.`,
      subjectKey: "mathematics",
      strandKey: PROBABILITY_CHANCE_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: PROBABILITY_CHANCE_PRACTICE_MODULE_KEY,
      parentModuleTitle: PROBABILITY_CHANCE_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem.id, index),
      ),
    };
  });

export function getProbabilityChanceStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    PROBABILITY_CHANCE_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getProbabilityChanceStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    PROBABILITY_CHANCE_STEP_PRACTICES.find(
      (candidate) => candidate.key === practiceKey,
    ) || null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const PROBABILITY_CHANCE_STEP_PRACTICE_METADATA = {
  parentFamilyKey: PROBABILITY_CHANCE_PARENT_FAMILY_KEY,
  parentFamilyTitle: PROBABILITY_CHANCE_PARENT_FAMILY_TITLE,
  moduleKey: PROBABILITY_CHANCE_PRACTICE_MODULE_KEY,
};
