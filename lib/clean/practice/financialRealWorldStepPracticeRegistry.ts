import {
  FINANCIAL_REAL_WORLD_PARENT_FAMILY_KEY,
  FINANCIAL_REAL_WORLD_PARENT_FAMILY_TITLE,
  FINANCIAL_REAL_WORLD_STEP_ASSESSMENTS,
  FINANCIAL_REAL_WORLD_STEP_SPECS,
  FINANCIAL_REAL_WORLD_STRAND_KEY,
} from "@/lib/clean/assessments/financialRealWorldStepAssessmentRegistry";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const FINANCIAL_REAL_WORLD_PRACTICE_MODULE_KEY =
  "financial-real-world-step-practice-module-v1";

export type FinancialRealWorldStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof FINANCIAL_REAL_WORLD_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof FINANCIAL_REAL_WORLD_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof FINANCIAL_REAL_WORLD_PARENT_FAMILY_TITLE;
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
  spec: (typeof FINANCIAL_REAL_WORLD_STEP_SPECS)[number],
  relatedAssessmentItemId: string,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];
  const fallbackTitle = `Practice ${index + 1}`;

  return {
    id: `financial-real-world-step-${spec.order}-practice-${String(
      index + 1,
    ).padStart(3, "0")}`,
    title: item?.title ?? fallbackTitle,
    prompt: item?.practicePrompt ?? spec.description,
    taskType: "multiple_choice",
    options: item?.options ?? [],
    expectedAnswer: item?.answer ?? "",
    acceptableAnswers: item?.answer ? [item.answer] : [],
    supportPrompt:
      "Use the visual first. Check the money amount, price, budget limit, unit price, discount, or decision evidence before choosing.",
    workedSolution: item?.answer ? `The matching answer is ${item.answer}.` : "",
    misconceptionTargets: item?.misconceptionTargets ?? [],
    relatedAssessmentItemIds: [relatedAssessmentItemId],
    visualSupport: visual(item?.visual ?? spec.description),
  };
}

export const FINANCIAL_REAL_WORLD_STEP_PRACTICES:
  FinancialRealWorldStepPractice[] =
  FINANCIAL_REAL_WORLD_STEP_SPECS.flatMap((spec) => {
    const assessment = FINANCIAL_REAL_WORLD_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      return [];
    }

    return [{
      key: `financial-real-world-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description: `Practise ${spec.shortTitle.toLowerCase()} with scaffolded price tags, receipts, budget cards, unit-price comparisons, discounts, and real-world decision cards before checking independently.`,
      subjectKey: "mathematics",
      strandKey: FINANCIAL_REAL_WORLD_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: FINANCIAL_REAL_WORLD_PRACTICE_MODULE_KEY,
      parentModuleTitle: FINANCIAL_REAL_WORLD_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem.id, index),
      ),
    }];
  });

export function getFinancialRealWorldStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    FINANCIAL_REAL_WORLD_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getFinancialRealWorldStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    FINANCIAL_REAL_WORLD_STEP_PRACTICES.find(
      (candidate) => candidate.key === practiceKey,
    ) || null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const FINANCIAL_REAL_WORLD_STEP_PRACTICE_METADATA = {
  parentFamilyKey: FINANCIAL_REAL_WORLD_PARENT_FAMILY_KEY,
  parentFamilyTitle: FINANCIAL_REAL_WORLD_PARENT_FAMILY_TITLE,
  moduleKey: FINANCIAL_REAL_WORLD_PRACTICE_MODULE_KEY,
};
