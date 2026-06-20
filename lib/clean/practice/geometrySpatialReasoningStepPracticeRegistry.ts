import {
  GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_KEY,
  GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_TITLE,
  GEOMETRY_SPATIAL_REASONING_STEP_ASSESSMENTS,
  GEOMETRY_SPATIAL_REASONING_STEP_SPECS,
  GEOMETRY_SPATIAL_REASONING_STRAND_KEY,
} from "@/lib/clean/assessments/geometrySpatialReasoningStepAssessmentRegistry";
import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import {
  NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
  getNumberStepPracticeDepthTaskCount,
} from "@/lib/clean/practice/numberStepPracticeTypes";

export const GEOMETRY_SPATIAL_REASONING_PRACTICE_MODULE_KEY =
  "geometry-spatial-reasoning-step-practice-module-v1";

export type GeometrySpatialReasoningStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: typeof GEOMETRY_SPATIAL_REASONING_STRAND_KEY;
  stageKey: CleanAssessmentStageKey;
  parentModuleId: typeof GEOMETRY_SPATIAL_REASONING_PRACTICE_MODULE_KEY;
  parentModuleTitle: typeof GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_TITLE;
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
  spec: (typeof GEOMETRY_SPATIAL_REASONING_STEP_SPECS)[number],
  relatedAssessmentItem: NumberAssessmentBankItem,
  index: number,
): NumberPracticeTask {
  const item = spec.cases[index];
  const fallbackTitle = `Practice ${index + 1}`;
  const visualDescription =
    relatedAssessmentItem.visualSupport?.type === "context_card"
      ? relatedAssessmentItem.visualSupport.description
      : item?.visual ?? spec.description;

  return {
    id: `geometry-spatial-reasoning-step-${spec.order}-practice-${String(
      index + 1,
    ).padStart(3, "0")}`,
    title: item?.title ?? fallbackTitle,
    prompt: item?.practicePrompt ?? spec.description,
    taskType: "multiple_choice",
    options: relatedAssessmentItem.options ?? item?.options ?? [],
    expectedAnswer: item?.answer ?? "",
    acceptableAnswers: item?.answer ? [item.answer] : [],
    supportPrompt:
      "Use the visual first. Check the shape, position, property, or movement, then choose the option that matches the geometry.",
    workedSolution: item?.answer ? `The matching answer is ${item.answer}.` : "",
    misconceptionTargets: item?.misconceptionTargets ?? [],
    relatedAssessmentItemIds: [relatedAssessmentItem.id],
    visualSupport: visual(safe(visualDescription) || spec.description),
  };
}

export const GEOMETRY_SPATIAL_REASONING_STEP_PRACTICES:
  GeometrySpatialReasoningStepPractice[] =
  GEOMETRY_SPATIAL_REASONING_STEP_SPECS.flatMap((spec) => {
    const assessment = GEOMETRY_SPATIAL_REASONING_STEP_ASSESSMENTS.find(
      (candidate) => candidate.pathwayStepId === spec.pathwayStepId,
    );

    if (!assessment) {
      return [];
    }

    return [{
      key: `geometry-spatial-reasoning-step-${spec.order}-${spec.stepKey}-practice-v1`,
      stepNumber: spec.stepNumber,
      stepKey: spec.stepKey,
      pathwayStepId: spec.pathwayStepId,
      title: spec.title,
      shortTitle: spec.shortTitle,
      description: `Practise ${spec.shortTitle.toLowerCase()} with scaffolded shape cards, grids, maps, symmetry diagrams, angle cards, nets, and transformation models before checking independently.`,
      subjectKey: "mathematics",
      strandKey: GEOMETRY_SPATIAL_REASONING_STRAND_KEY,
      stageKey: spec.stageKey,
      parentModuleId: GEOMETRY_SPATIAL_REASONING_PRACTICE_MODULE_KEY,
      parentModuleTitle: GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_TITLE,
      relatedStepAssessmentKey: assessment.key,
      depthOptions: NUMBER_STEP_PRACTICE_DEPTH_OPTIONS,
      tasks: assessment.items.map((assessmentItem, index) =>
        makePracticeTask(spec, assessmentItem, index),
      ),
    }];
  });

export function getGeometrySpatialReasoningStepPracticeForPathwayStep(
  context: StepPracticeContext,
) {
  const stepPracticeKey = safe(context.stepPracticeKey);
  const stepKey = safe(context.stepKey);
  const pathwayStepId = safe(context.pathwayStepId);

  return (
    GEOMETRY_SPATIAL_REASONING_STEP_PRACTICES.find(
      (practice) =>
        (stepPracticeKey && practice.key === stepPracticeKey) ||
        (pathwayStepId && practice.pathwayStepId === pathwayStepId) ||
        (stepKey && practice.stepKey === stepKey),
    ) || null
  );
}

export function getGeometrySpatialReasoningStepPracticeTasksForDepth(
  practiceKey: string,
  depth: NumberStepAssessmentDepth,
) {
  const practice =
    GEOMETRY_SPATIAL_REASONING_STEP_PRACTICES.find(
      (candidate) => candidate.key === practiceKey,
    ) || null;

  if (!practice) return [];

  return practice.tasks.slice(0, getNumberStepPracticeDepthTaskCount(depth));
}

export const GEOMETRY_SPATIAL_REASONING_STEP_PRACTICE_METADATA = {
  parentFamilyKey: GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_KEY,
  parentFamilyTitle: GEOMETRY_SPATIAL_REASONING_PARENT_FAMILY_TITLE,
  moduleKey: GEOMETRY_SPATIAL_REASONING_PRACTICE_MODULE_KEY,
};
