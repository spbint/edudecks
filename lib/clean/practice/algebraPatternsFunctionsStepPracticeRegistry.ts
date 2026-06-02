import {
  ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_KEY,
  ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_TITLE,
  ALGEBRA_PATTERNS_FUNCTIONS_STEP_ASSESSMENTS,
  ALGEBRA_PATTERNS_FUNCTIONS_STEP_SPECS,
  ALGEBRA_PATTERNS_FUNCTIONS_STRAND_KEY,
} from "@/lib/clean/assessments/algebraPatternsFunctionsStepAssessmentRegistry";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const ALGEBRA_PATTERNS_FUNCTIONS_PRACTICE_MODULE_KEY =
  "algebra-patterns-functions-step-practice-module-v1";

export type AlgebraPatternsFunctionsStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof ALGEBRA_PATTERNS_FUNCTIONS_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof ALGEBRA_PATTERNS_FUNCTIONS_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_TITLE;
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
  spec: (typeof ALGEBRA_PATTERNS_FUNCTIONS_STEP_SPECS)[number],
  relatedAssessmentItemId: string,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];
  const fallbackTitle = `Practice ${index + 1}`;

  return {
    id: `algebra-patterns-functions-step-${spec.order}-practice-${String(
      index + 1,
    ).padStart(3, "0")}`,
    title: item?.title ?? fallbackTitle,
    prompt: item?.practicePrompt ?? spec.description,
    taskType: "multiple_choice",
    options: item?.options ?? [],
    expectedAnswer: item?.answer ?? "",
    acceptableAnswers: item?.answer ? [item.answer] : [],
    supportPrompt:
      "Use the visual first. Look for what stays the same, what changes, and which rule keeps the relationship true.",
    workedSolution: item?.answer ? `The matching answer is ${item.answer}.` : "",
    misconceptionTargets: item?.misconceptionTargets ?? [],
    relatedAssessmentItemIds: [relatedAssessmentItemId],
    visualSupport: visual(item?.visual ?? spec.description),
  };
}

export const ALGEBRA_PATTERNS_FUNCTIONS_STEP_PRACTICES:
  AlgebraPatternsFunctionsStepPractice[] =
  ALGEBRA_PATTERNS_FUNCTIONS_STEP_SPECS.flatMap((spec) => {
    const assessment = ALGEBRA_PATTERNS_FUNCTIONS_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      return [];
    }

    return [{
      key: `algebra-patterns-functions-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description: `Practise ${spec.shortTitle.toLowerCase()} with scaffolded pattern cards, input-output tables, rule cards, equations, and visual models before checking independently.`,
      subjectKey: "mathematics",
      strandKey: ALGEBRA_PATTERNS_FUNCTIONS_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: ALGEBRA_PATTERNS_FUNCTIONS_PRACTICE_MODULE_KEY,
      parentModuleTitle: ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem.id, index),
      ),
    }];
  });

export function getAlgebraPatternsFunctionsStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    ALGEBRA_PATTERNS_FUNCTIONS_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getAlgebraPatternsFunctionsStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    ALGEBRA_PATTERNS_FUNCTIONS_STEP_PRACTICES.find(
      (candidate) => candidate.key === practiceKey,
    ) || null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const ALGEBRA_PATTERNS_FUNCTIONS_STEP_PRACTICE_METADATA = {
  parentFamilyKey: ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_KEY,
  parentFamilyTitle: ALGEBRA_PATTERNS_FUNCTIONS_PARENT_FAMILY_TITLE,
  moduleKey: ALGEBRA_PATTERNS_FUNCTIONS_PRACTICE_MODULE_KEY,
};
