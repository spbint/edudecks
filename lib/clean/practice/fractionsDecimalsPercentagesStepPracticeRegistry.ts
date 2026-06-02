import {
  FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_KEY,
  FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_TITLE,
  FRACTIONS_DECIMALS_PERCENTAGES_STEP_ASSESSMENTS,
  FRACTIONS_DECIMALS_PERCENTAGES_STEP_SPECS,
  FRACTIONS_DECIMALS_PERCENTAGES_STRAND_KEY,
} from "@/lib/clean/assessments/fractionsDecimalsPercentagesStepAssessmentRegistry";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const FRACTIONS_DECIMALS_PERCENTAGES_PRACTICE_MODULE_KEY =
  "fractions-decimals-percentages-step-practice-module-v1";

export type FractionsDecimalsPercentagesStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof FRACTIONS_DECIMALS_PERCENTAGES_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof FRACTIONS_DECIMALS_PERCENTAGES_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_TITLE;
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
  spec: (typeof FRACTIONS_DECIMALS_PERCENTAGES_STEP_SPECS)[number],
  relatedAssessmentItemId: string,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];
  const fallbackTitle = `Practice ${index + 1}`;

  return {
    id: `fractions-decimals-percentages-step-${spec.order}-practice-${String(
      index + 1,
    ).padStart(3, "0")}`,
    title: item?.title ?? fallbackTitle,
    prompt: item?.practicePrompt ?? spec.description,
    taskType: "multiple_choice",
    options: item?.options ?? [],
    expectedAnswer: item?.answer ?? "",
    acceptableAnswers: item?.answer ? [item.answer] : [],
    supportPrompt:
      "Use the visual first. Name the whole, count the equal parts, then choose the matching answer.",
    workedSolution: item?.answer ? `The matching answer is ${item.answer}.` : "",
    misconceptionTargets: item?.misconceptionTargets ?? [],
    relatedAssessmentItemIds: [relatedAssessmentItemId],
    visualSupport: visual(item?.visual ?? spec.description),
  };
}

export const FRACTIONS_DECIMALS_PERCENTAGES_STEP_PRACTICES:
  FractionsDecimalsPercentagesStepPractice[] =
  FRACTIONS_DECIMALS_PERCENTAGES_STEP_SPECS.flatMap((spec) => {
    const assessment = FRACTIONS_DECIMALS_PERCENTAGES_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      return [];
    }

    return [{
      key: `fractions-decimals-percentages-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description: `Practise ${spec.shortTitle.toLowerCase()} with scaffolded fraction, decimal, percentage, and context models before checking independently.`,
      subjectKey: "mathematics",
      strandKey: FRACTIONS_DECIMALS_PERCENTAGES_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: FRACTIONS_DECIMALS_PERCENTAGES_PRACTICE_MODULE_KEY,
      parentModuleTitle: FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem.id, index),
      ),
    }];
  });

export function getFractionsDecimalsPercentagesStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    FRACTIONS_DECIMALS_PERCENTAGES_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getFractionsDecimalsPercentagesStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    FRACTIONS_DECIMALS_PERCENTAGES_STEP_PRACTICES.find(
      (candidate) => candidate.key === practiceKey,
    ) || null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const FRACTIONS_DECIMALS_PERCENTAGES_STEP_PRACTICE_METADATA = {
  parentFamilyKey: FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_KEY,
  parentFamilyTitle: FRACTIONS_DECIMALS_PERCENTAGES_PARENT_FAMILY_TITLE,
  moduleKey: FRACTIONS_DECIMALS_PERCENTAGES_PRACTICE_MODULE_KEY,
};
