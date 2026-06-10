import { NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS } from "@/lib/clean/assessments/numberLowerSecondaryStepAssessments";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";

export type LowerSecondaryStepPracticeDefinition = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  parentModuleId: string;
  parentModuleTitle: string;
  relatedStepAssessmentKey: string;
  tasks: NumberPracticeTask[];
};

function visual(description: string) {
  return { type: "context_card" as const, description };
}

function makeTask(
  assessment: (typeof NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS)[number],
  index: number,
): NumberPracticeTask {
  const assessmentItem = assessment.items[index];
  const expectedAnswer = assessmentItem.expectedAnswer || "";

  return {
    id: `number-step-${assessment.stepNumber}-practice-${String(index + 1).padStart(3, "0")}`,
    title: assessmentItem.title,
    prompt: `Practise: ${assessmentItem.prompt}`,
    taskType: "multiple_choice",
    options: assessmentItem.options,
    expectedAnswer,
    acceptableAnswers: assessmentItem.acceptableAnswers,
    supportPrompt:
      "Switch between the number forms first. Then choose the answer that matches the value and context.",
    workedSolution: `The matching answer is ${expectedAnswer}.`,
    misconceptionTargets: assessmentItem.misconceptionTargets,
    relatedAssessmentItemIds: [assessmentItem.id],
    visualSupport: visual(
      assessmentItem.visualSupport?.description ||
        "early-number|caption=Use the number-form cards.|numbers=1/2,0.5,50%",
    ),
  };
}

export const NUMBER_LOWER_SECONDARY_STEP_PRACTICES =
  NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS.map((assessment) => ({
    key: `number-step-${assessment.stepNumber}-${assessment.stepKey}-practice-v1`,
    stepNumber: assessment.stepNumber,
    stepKey: assessment.stepKey,
    pathwayStepId: assessment.pathwayStepId,
    title: assessment.title,
    shortTitle: assessment.shortTitle,
    description: `Practise ${assessment.description.toLowerCase()}`,
    parentModuleId: "number-percent-ratio-finance-practice-module-v1",
    parentModuleTitle: "Percent, ratio and finance",
    relatedStepAssessmentKey: assessment.key,
    tasks: assessment.items.map((_, index) => makeTask(assessment, index)),
  })) satisfies LowerSecondaryStepPracticeDefinition[];
