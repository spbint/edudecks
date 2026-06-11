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
  const isReasonablenessStep =
    assessment.stepKey === "explain-calculation-choices-and-reasonableness";
  const isAlgebraicThinkingStep =
    assessment.stepKey === "use-number-relationships-to-support-algebraic-thinking";

  return {
    id: `number-step-${assessment.stepNumber}-practice-${String(index + 1).padStart(3, "0")}`,
    title: assessmentItem.title,
    prompt: `Practise: ${assessmentItem.prompt}`,
    taskType: "multiple_choice",
    options: assessmentItem.options,
    expectedAnswer,
    acceptableAnswers: assessmentItem.acceptableAnswers,
    supportPrompt:
      isReasonablenessStep
        ? "Choose the method or judgement that fits the calculation. Use an estimate, inverse operation or context check before choosing."
        : isAlgebraicThinkingStep
          ? "Find the pattern rule first. Then use the rule with the input, term number or missing term."
          : "Switch between the number forms first. Then choose the answer that matches the value and context.",
    workedSolution: `The matching answer is ${expectedAnswer}.`,
    misconceptionTargets: assessmentItem.misconceptionTargets,
    relatedAssessmentItemIds: [assessmentItem.id],
    visualSupport: visual(
      assessmentItem.visualSupport?.description ||
        "early-number|caption=Use the number-form cards.|numbers=1/2,0.5,50%",
    ),
  };
}

function getLowerSecondaryPracticeParent(
  assessment: (typeof NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS)[number],
) {
  if (assessment.parentBankKey === "approximation-estimation-error") {
    return {
      id: "number-approximation-practice-module-v1",
      title: "Approximation and estimation",
    };
  }

  if (assessment.parentBankKey === "number-patterns-and-early-algebraic-thinking") {
    return {
      id: "number-patterns-early-algebra-practice-module-v1",
      title: "Number patterns",
    };
  }

  if (assessment.parentBankKey === "powers-roots-exponent-notation") {
    return {
      id: "number-powers-roots-practice-module-v1",
      title: "Powers and roots",
    };
  }

  if (assessment.parentBankKey === "integers-coordinates-number-properties") {
    return {
      id: "number-integers-coordinates-properties-practice-module-v1",
      title: "Integers and coordinates",
    };
  }

  return {
    id: "number-percent-ratio-finance-practice-module-v1",
    title: "Percent, ratio and finance",
  };
}

export const NUMBER_LOWER_SECONDARY_STEP_PRACTICES =
  NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS.map((assessment) => {
    const parent = getLowerSecondaryPracticeParent(assessment);

    return {
      key: `number-step-${assessment.stepNumber}-${assessment.stepKey}-practice-v1`,
      stepNumber: assessment.stepNumber,
      stepKey: assessment.stepKey,
      pathwayStepId: assessment.pathwayStepId,
      title: assessment.title,
      shortTitle: assessment.shortTitle,
      description: `Practise ${assessment.description.toLowerCase()}`,
      parentModuleId: parent.id,
      parentModuleTitle: parent.title,
      relatedStepAssessmentKey: assessment.key,
      tasks: assessment.items.map((_, index) => makeTask(assessment, index)),
    };
  }) satisfies LowerSecondaryStepPracticeDefinition[];
