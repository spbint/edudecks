import type { ActivityPlayerV4Sample } from "@/app/components/clean/activity-player-v4/ActivityPlayerV4.types";
import { NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_ITEMS } from "@/lib/clean/assessments/numberStep1RecogniseSmallQuantitiesAssessmentItems";
import { RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS } from "@/lib/clean/assessments/ratioProportionalReasoningStepAssessmentRegistry";
import { NUMBER_POWERS_ROOTS_PRACTICE_MODULE } from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function firstMultipleChoicePracticeTask() {
  return NUMBER_POWERS_ROOTS_PRACTICE_MODULE.sections
    .flatMap((section) => section.tasks)
    .find((task) => task.taskType === "multiple_choice" && task.options?.length);
}

function ratioAssessmentItem() {
  return (
    RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS
      .flatMap((assessment) => assessment.items)
      .find((item) => item.title === "Table row check") ??
    RATIO_PROPORTIONAL_REASONING_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items)[0]
  );
}

export function buildActivityPlayerV4Samples(): ActivityPlayerV4Sample[] {
  const earlyItem = NUMBER_STEP_1_RECOGNISE_SMALL_QUANTITIES_ASSESSMENT_ITEMS[0];
  const reasoningTask = firstMultipleChoicePracticeTask();
  const ratioItem = ratioAssessmentItem();

  const samples: Array<ActivityPlayerV4Sample | null> = [
    earlyItem
      ? {
          id: earlyItem.id,
          label: "Early visual item",
          mode: "assess",
          source: "Existing Number assessment item",
          stepLabel: "Step 1 - Assess",
          title: earlyItem.title,
          prompt: earlyItem.prompt,
          options: earlyItem.options ?? [],
          expectedAnswer: earlyItem.expectedAnswer ?? "",
          hint: earlyItem.visualSupport?.description ?? null,
          feedback: earlyItem.workedSolution ?? null,
          visualDescription: earlyItem.visualSupport?.description ?? null,
          visualKind: "dots",
        }
      : null,
    reasoningTask
      ? {
          id: reasoningTask.id,
          label: "Reasoning item",
          mode: "practice",
          source: "Existing Powers and roots practice task",
          stepLabel: "Powers and roots - Practise",
          title: reasoningTask.title,
          prompt: reasoningTask.prompt,
          options: reasoningTask.options ?? [],
          expectedAnswer: reasoningTask.expectedAnswer ?? "",
          hint: reasoningTask.supportPrompt ?? null,
          feedback: reasoningTask.workedSolution ?? null,
          visualDescription: reasoningTask.visualSupport?.description ?? null,
          visualKind: "numbers",
        }
      : null,
    ratioItem
      ? {
          id: ratioItem.id,
          label: "Higher-level item",
          mode: "assess",
          source: "Existing Ratio assessment item",
          stepLabel: "Ratio - Assess",
          title: ratioItem.title,
          prompt: ratioItem.prompt,
          options: ratioItem.options ?? [],
          expectedAnswer: ratioItem.expectedAnswer ?? "",
          hint: ratioItem.visualSupport?.description ?? null,
          feedback: ratioItem.workedSolution ?? null,
          visualDescription: ratioItem.visualSupport?.description ?? null,
          visualKind: "table",
        }
      : null,
  ];

  return samples.filter((sample): sample is ActivityPlayerV4Sample => Boolean(sample && sample.options.length));
}
