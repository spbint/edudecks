import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import { NUMBER_FOUNDATION_STEP_ASSESSMENTS } from "@/lib/clean/assessments/numberFoundationStepAssessments";

export type FoundationStepPracticeDefinition = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  relatedStepAssessmentKey: string;
  tasks: NumberPracticeTask[];
};

function visual(description: string) {
  return {
    type: "context_card" as const,
    description,
  };
}

function makeTask(
  assessment: (typeof NUMBER_FOUNDATION_STEP_ASSESSMENTS)[number],
  index: number,
): NumberPracticeTask {
  const assessmentItem = assessment.items[index];
  const expectedAnswer = assessmentItem.expectedAnswer || "";
  return {
    id: `number-step-${assessment.stepNumber}-practice-${String(index + 1).padStart(3, "0")}`,
    title: assessmentItem.title,
    prompt: assessmentItem.prompt.replace("Which", "Practise: which").replace("How many?", "Practise: how many?"),
    taskType: "multiple_choice",
    options: assessmentItem.options,
    expectedAnswer,
    acceptableAnswers: assessmentItem.acceptableAnswers,
    supportPrompt:
      "Look at the visual first. Say what you notice, then choose the matching answer.",
    workedSolution: `The matching answer is ${expectedAnswer}.`,
    misconceptionTargets: assessmentItem.misconceptionTargets,
    relatedAssessmentItemIds: [assessmentItem.id],
    visualSupport: visual(
      assessmentItem.visualSupport?.description ||
        "early-number|caption=Use the counters or number cards.|groups=3|labels=counters",
    ),
  };
}

export const NUMBER_FOUNDATION_STEP_PRACTICES =
  NUMBER_FOUNDATION_STEP_ASSESSMENTS.map((assessment) => ({
    key: `number-step-${assessment.stepNumber}-${assessment.stepKey}-practice-v1`,
    stepNumber: assessment.stepNumber,
    stepKey: assessment.stepKey,
    pathwayStepId: assessment.pathwayStepId,
    title: assessment.title,
    shortTitle: assessment.shortTitle,
    description: assessment.description.replace("Connect", "Practise connecting"),
    relatedStepAssessmentKey: assessment.key,
    tasks: assessment.items.map((_, index) => makeTask(assessment, index)),
  })) satisfies FoundationStepPracticeDefinition[];
