import {
  STATISTICS_DATA_PARENT_FAMILY_KEY,
  STATISTICS_DATA_PARENT_FAMILY_TITLE,
  STATISTICS_DATA_STEP_ASSESSMENTS,
  STATISTICS_DATA_STEP_SPECS,
  STATISTICS_DATA_STRAND_KEY,
} from "@/lib/clean/assessments/statisticsDataStepAssessmentRegistry";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const STATISTICS_DATA_PRACTICE_MODULE_KEY =
  "statistics-and-data-step-practice-module-v1";

export type StatisticsDataStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof STATISTICS_DATA_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof STATISTICS_DATA_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof STATISTICS_DATA_PARENT_FAMILY_TITLE;
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
  spec: (typeof STATISTICS_DATA_STEP_SPECS)[number],
  relatedAssessmentItemId: string,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];
  const fallbackTitle = `Practice ${index + 1}`;

  return {
    id: `statistics-data-step-${spec.order}-practice-${String(index + 1).padStart(
      3,
      "0",
    )}`,
    title: item?.title ?? fallbackTitle,
    prompt: item?.practicePrompt ?? spec.description,
    taskType: "multiple_choice",
    options: item?.options ?? [],
    expectedAnswer: item?.answer ?? "",
    acceptableAnswers: item?.answer ? [item.answer] : [],
    supportPrompt:
      "Use the visual first. Check the categories, counts, scale, or evidence before choosing the answer.",
    workedSolution: item?.answer ? `The matching answer is ${item.answer}.` : "",
    misconceptionTargets: item?.misconceptionTargets ?? [],
    relatedAssessmentItemIds: [relatedAssessmentItemId],
    visualSupport: visual(item?.visual ?? spec.description),
  };
}

export const STATISTICS_DATA_STEP_PRACTICES: StatisticsDataStepPractice[] =
  STATISTICS_DATA_STEP_SPECS.flatMap((spec) => {
    const assessment = STATISTICS_DATA_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      return [];
    }

    return [{
      key: `statistics-data-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description: `Practise ${spec.shortTitle.toLowerCase()} with scaffolded sorting cards, tally charts, graph cards, tables, and data-claim contexts before checking independently.`,
      subjectKey: "mathematics",
      strandKey: STATISTICS_DATA_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: STATISTICS_DATA_PRACTICE_MODULE_KEY,
      parentModuleTitle: STATISTICS_DATA_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem.id, index),
      ),
    }];
  });

export function getStatisticsDataStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    STATISTICS_DATA_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getStatisticsDataStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    STATISTICS_DATA_STEP_PRACTICES.find(
      (candidate) => candidate.key === practiceKey,
    ) || null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const STATISTICS_DATA_STEP_PRACTICE_METADATA = {
  parentFamilyKey: STATISTICS_DATA_PARENT_FAMILY_KEY,
  parentFamilyTitle: STATISTICS_DATA_PARENT_FAMILY_TITLE,
  moduleKey: STATISTICS_DATA_PRACTICE_MODULE_KEY,
};
