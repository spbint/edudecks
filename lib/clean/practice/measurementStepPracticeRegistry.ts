import {
  MEASUREMENT_PARENT_FAMILY_KEY,
  MEASUREMENT_PARENT_FAMILY_TITLE,
  MEASUREMENT_STEP_ASSESSMENTS,
  MEASUREMENT_STEP_SPECS,
  MEASUREMENT_STRAND_KEY,
} from "@/lib/clean/assessments/measurementStepAssessmentRegistry";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const MEASUREMENT_PRACTICE_MODULE_KEY =
  "measurement-step-practice-module-v1";

export type MeasurementStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof MEASUREMENT_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof MEASUREMENT_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof MEASUREMENT_PARENT_FAMILY_TITLE;
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
  spec: (typeof MEASUREMENT_STEP_SPECS)[number],
  relatedAssessmentItemId: string,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];
  const fallbackTitle = `Practice ${index + 1}`;
  const supportPrompt =
    spec.order <= 2
      ? "Use the picture first. Match the everyday word, order, coin, or price label, then choose the answer that fits the context."
      : "Use the visual first. Match the quantity, unit, and tool, then check whether the answer makes sense in the context.";

  return {
    id: `measurement-step-${spec.order}-practice-${String(index + 1).padStart(
      3,
      "0",
    )}`,
    title: item?.title ?? fallbackTitle,
    prompt: item?.practicePrompt ?? spec.description,
    taskType: "multiple_choice",
    options: item?.options ?? [],
    expectedAnswer: item?.answer ?? "",
    acceptableAnswers: item?.answer ? [item.answer] : [],
    supportPrompt,
    workedSolution: item?.answer ? `The matching answer is ${item.answer}.` : "",
    misconceptionTargets: item?.misconceptionTargets ?? [],
    relatedAssessmentItemIds: [relatedAssessmentItemId],
    visualSupport: visual(item?.visual ?? spec.description),
  };
}

export const MEASUREMENT_STEP_PRACTICES: MeasurementStepPractice[] =
  MEASUREMENT_STEP_SPECS.flatMap((spec) => {
    const assessment = MEASUREMENT_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      return [];
    }

    return [{
      key: `measurement-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description:
        spec.order <= 2
          ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded everyday pictures, routine cards, simple comparison cards, Australian coin labels, and practical context models before checking independently.`
          : `Practise ${spec.shortTitle.toLowerCase()} with scaffolded measuring strips, clocks, grids, unit cards, conversion tables, and practical context models before checking independently.`,
      subjectKey: "mathematics",
      strandKey: MEASUREMENT_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: MEASUREMENT_PRACTICE_MODULE_KEY,
      parentModuleTitle: MEASUREMENT_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem.id, index),
      ),
    }];
  });

export function getMeasurementStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    MEASUREMENT_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getMeasurementStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    MEASUREMENT_STEP_PRACTICES.find(
      (candidate) => candidate.key === practiceKey,
    ) || null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const MEASUREMENT_STEP_PRACTICE_METADATA = {
  parentFamilyKey: MEASUREMENT_PARENT_FAMILY_KEY,
  parentFamilyTitle: MEASUREMENT_PARENT_FAMILY_TITLE,
  moduleKey: MEASUREMENT_PRACTICE_MODULE_KEY,
};
