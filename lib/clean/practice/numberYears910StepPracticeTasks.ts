import { NUMBER_YEARS_9_10_STEP_ASSESSMENTS } from "@/lib/clean/assessments/numberYears910StepAssessments";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";

export type Years910StepPracticeDefinition = {
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
  if (parentBankKey === "powers-roots-exponent-notation") {
    return { id: "number-powers-roots-practice-module-v1", title: "Powers and roots" };
  }
  if (parentBankKey === "surds-and-exact-form") {
    return { id: "number-surds-exact-practice-module-v1", title: "Surds and exact form" };
  }
  if (parentBankKey === "percentages-ratio-financial-modelling") {
    return { id: "number-percent-ratio-finance-practice-module-v1", title: "Percent, ratio and finance" };
  }
  if (parentBankKey === "integers-coordinates-number-properties") {
    return { id: "number-integers-coordinates-properties-practice-module-v1", title: "Integers and coordinates" };
  }
  if (parentBankKey === "approximation-estimation-error") {
    return { id: "number-approximation-practice-module-v1", title: "Approximation and error" };
  }
  return { id: "number-rational-operations-practice-module-v1", title: "Rational operations" };
}

function makeTask(
  assessment: (typeof NUMBER_YEARS_9_10_STEP_ASSESSMENTS)[number],
  index: number,
): NumberPracticeTask {
  const assessmentItem = assessment.items[index];
  const expectedAnswer = assessmentItem.expectedAnswer || "";
  const isStep51 =
    assessment.stepKey ===
    "work-with-standard-form-and-very-large-or-very-small-numbers";
  const isStep53 =
    assessment.stepKey ===
    "calculate-exactly-with-fractions-and-multiples-of-pi-where-appropriate";
  const isStep54 =
    assessment.stepKey === "work-with-percentage-change-growth-and-decay";
  const isStep55 =
    assessment.stepKey === "apply-ratio-proportion-and-rates-of-change";
  const isStep56 =
    assessment.stepKey ===
    "use-number-skills-in-algebraic-and-graphical-contexts";
  const isStep57 =
    assessment.stepKey === "solve-financial-and-real-world-modelling-problems";
  const isStep58 =
    assessment.stepKey === "interpret-limits-of-accuracy-and-rounding";
  return {
    id: `number-step-${assessment.stepNumber}-practice-${String(index + 1).padStart(3, "0")}`,
    title: assessmentItem.title,
    prompt: `Practise: ${assessmentItem.prompt}`,
    taskType: "multiple_choice",
    options: assessmentItem.options,
    expectedAnswer,
    acceptableAnswers: assessmentItem.acceptableAnswers,
    supportPrompt:
      isStep51
        ? "Use a x 10^n with 1 <= a < 10. Track whether the decimal movement makes the number larger or smaller."
        : isStep53
          ? "Keep the answer exact. Simplify fractions, combine like pi terms, and use circle formulas before choosing."
          : isStep54
            ? "Choose the multiplier first: increases use 1 + p/100, decreases use 1 - p/100, and repeated changes multiply."
            : isStep55
              ? "Identify the structure first: ratio parts, direct proportion y = kx, inverse proportion xy = k, or rate = amount / time."
              : isStep56
                ? "Work step by step: collect like terms, keep equations balanced, substitute carefully, and read graph units before choosing."
                : isStep57
                  ? "Organise the known values first. Keep units consistent, choose the operation for each step, and check the answer makes sense."
                  : isStep58
                    ? "Identify the rounding accuracy first. Use half the rounding unit for bounds, and round only the final answer unless told otherwise."
                  : "Use the visual model, table or context card first. Then choose the matching answer.",
    workedSolution: `The matching answer is ${expectedAnswer}.`,
    misconceptionTargets: assessmentItem.misconceptionTargets,
    relatedAssessmentItemIds: [assessmentItem.id],
    visualSupport: visual(
      assessmentItem.visualSupport?.description ||
        "early-number|caption=Use the number model.|numbers=1,2,3",
    ),
  };
}

export const NUMBER_YEARS_9_10_STEP_PRACTICES =
  NUMBER_YEARS_9_10_STEP_ASSESSMENTS.map((assessment) => {
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
  }) satisfies Years910StepPracticeDefinition[];
