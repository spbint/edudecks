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
      : spec.order === 3
        ? "Use the picture first. Count the blocks or paperclips carefully, read the simple centimetre mark when shown, then choose the matching measurement."
        : spec.order === 4
          ? "Use the picture first. Read the o'clock clock, count the simple coins, or compare the price labels before choosing."
          : spec.order === 5
            ? "Use the visual first. Match the object or context to the measuring tool, then choose the sensible standard unit or reading."
            : spec.order === 6
              ? "Estimate first, then compare with the actual measurement. Decide whether the estimate is close and reflect on whether it makes sense."
              : spec.order === 7
                ? "Read the practical measurement story first, choose the operation, keep the unit, and check that the answer fits the context."
                : spec.order === 8
                  ? "Use the measurement model first. Connect the fraction, decimal, and converted unit before comparing or solving."
                  : spec.order === 9
                    ? "Choose the unit or conversion for the context first, then compare precision or check whether the measurement is reasonable."
                    : spec.order === 10
                      ? "Read the design or science brief first. Use the measurements, table, or constraint to plan, calculate, and justify the decision."
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
          : spec.order === 3
            ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded block measurements, paperclip measurements, simple centimetre ruler cards, and informal-or-standard unit choices before checking independently.`
            : spec.order === 4
              ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded o'clock clocks, routine time cards, Australian coin groups, simple price comparisons, and shopping total cards before checking independently.`
              : spec.order === 5
                ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded rulers, scales, measuring jugs, clocks, pencils, pets, milk bottles, buckets, and recess-time contexts before checking independently.`
                : spec.order === 6
                  ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded estimate-first cards, pencil and book measurements, bottle capacities, closest-estimate choices, and estimate-measure-compare-reflect prompts before checking independently.`
                  : spec.order === 7
                    ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded ribbon, pencil, book, rope, bucket, package, garden-bed, water-tank and clock-time calculation cards before checking independently.`
                    : spec.order === 8
                      ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded metre strips, litre models, centimetre-to-metre conversions, millilitre-to-litre conversions, number lines, ribbons, bottles and containers before checking independently.`
                      : spec.order === 9
                        ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded unit-choice cards, conversion cards, precision comparison cards, sensible-measurement choices, mixed-unit challenges and precision investigation tables before checking independently.`
                        : spec.order === 10
                          ? `Practise ${spec.shortTitle.toLowerCase()} with scaffolded garden-bed plans, birdhouse wood tables, evaporation investigations, terrarium layout cards, jug conversions, bridge design briefs and leaf-growth data tables before checking independently.`
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
