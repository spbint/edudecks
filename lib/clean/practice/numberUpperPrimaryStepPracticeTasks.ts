import { NUMBER_UPPER_PRIMARY_STEP_ASSESSMENTS } from "@/lib/clean/assessments/numberUpperPrimaryStepAssessments";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";

export type UpperPrimaryStepPracticeDefinition = {
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

function moduleFor(parentBankKey: string) {
  if (parentBankKey === "additive-strategies-and-problem-solving") {
    return { id: "number-additive-strategies-practice-module-v1", title: "Additive strategies and problem solving" };
  }
  if (parentBankKey === "multiplication-division-fluency") {
    return { id: "number-multiplication-division-fluency-practice-module-v1", title: "Multiplication and division fluency" };
  }
  if (parentBankKey === "fractions-foundations") {
    return { id: "number-fractions-foundations-practice-module-v1", title: "Fractions foundations" };
  }
  if (parentBankKey === "decimals-foundations") {
    return { id: "number-decimals-foundations-practice-module-v1", title: "Decimals foundations" };
  }
  if (parentBankKey === "percent-ratio-finance") {
    return { id: "number-percent-ratio-finance-practice-module-v1", title: "Percent, ratio and finance" };
  }
  if (parentBankKey === "money-and-practical-number-contexts") {
    return { id: "number-money-practical-contexts-practice-module-v1", title: "Money and practical contexts" };
  }
  return { id: "number-place-value-operations-practice-module-v1", title: "Place value and operations" };
}

function makeTask(
  assessment: (typeof NUMBER_UPPER_PRIMARY_STEP_ASSESSMENTS)[number],
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
      "Use the model, table or number cards first. Then choose the matching answer.",
    workedSolution: `The matching answer is ${expectedAnswer}.`,
    misconceptionTargets: assessmentItem.misconceptionTargets,
    relatedAssessmentItemIds: [assessmentItem.id],
    visualSupport: visual(
      assessmentItem.visualSupport?.description ||
        "early-number|caption=Use the visual support.|numbers=1,2,3",
    ),
  };
}

export const NUMBER_UPPER_PRIMARY_STEP_PRACTICES =
  NUMBER_UPPER_PRIMARY_STEP_ASSESSMENTS.map((assessment) => {
    const parentModule = moduleFor(assessment.parentBankKey);
    return {
      key: `number-step-${assessment.stepNumber}-${assessment.stepKey}-practice-v1`,
      stepNumber: assessment.stepNumber,
      stepKey: assessment.stepKey,
      pathwayStepId: assessment.pathwayStepId,
      title: assessment.title,
      shortTitle: assessment.shortTitle,
      description: `Practise ${assessment.description.toLowerCase()}`,
      parentModuleId: parentModule.id,
      parentModuleTitle: parentModule.title,
      relatedStepAssessmentKey: assessment.key,
      tasks: assessment.items.map((_, index) => makeTask(assessment, index)),
    };
  }) satisfies UpperPrimaryStepPracticeDefinition[];
