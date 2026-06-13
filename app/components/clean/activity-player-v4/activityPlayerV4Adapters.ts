import type { ActivityPlayerV4Sample } from "@/app/components/clean/activity-player-v4/ActivityPlayerV4.types";
import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function inferVisualKind(description?: string | null): ActivityPlayerV4Sample["visualKind"] {
  const text = safe(description).toLowerCase();
  if (!text) return "text";
  if (text.includes("numbers=")) return text.includes(":") ? "table" : "numbers";
  if (text.includes("groups=")) return "objects";
  if (/(dot|dots|counter|counters|dice|five-frame|card)/i.test(text)) return "dots";
  if (/(table|row|ratio|:)/i.test(text)) return "table";
  if (/(number|expression|equation|sqrt|\^)/i.test(text)) return "numbers";
  return "text";
}

export function practiceTasksToActivityPlayerV4Samples(
  tasks: NumberPracticeTask[],
  context: {
    source: string;
    stepLabel: string;
    fallbackTitle: string;
  },
): ActivityPlayerV4Sample[] {
  return tasks
    .filter((task) => task.taskType === "multiple_choice" && task.options?.length)
    .map((task) => ({
      id: task.id,
      label: task.title,
      mode: "practice",
      source: context.source,
      stepLabel: context.stepLabel,
      title: task.title || context.fallbackTitle,
      prompt: task.prompt,
      options: task.options ?? [],
      expectedAnswer: task.expectedAnswer ?? "",
      hint: task.supportPrompt ?? null,
      feedback: task.workedSolution ?? null,
      visualDescription: task.visualSupport?.description ?? null,
      visualKind: inferVisualKind(task.visualSupport?.description ?? task.prompt),
      metadata: {
        taskType: task.taskType,
        relatedAssessmentItemIds: task.relatedAssessmentItemIds ?? [],
      },
    }));
}

export function assessmentItemsToActivityPlayerV4Samples(
  items: NumberAssessmentBankItem[],
  context: {
    source: string;
    stepLabel: string;
    fallbackTitle: string;
  },
): ActivityPlayerV4Sample[] {
  return items
    .filter((item) => item.answerType === "multiple_choice" && item.options?.length)
    .map((item) => ({
      id: item.id,
      label: item.title,
      mode: "assess",
      source: context.source,
      stepLabel: context.stepLabel,
      title: item.title || context.fallbackTitle,
      prompt: item.prompt,
      options: item.options ?? [],
      expectedAnswer: item.expectedAnswer ?? "",
      hint: item.visualSupport?.description ?? null,
      feedback: item.workedSolution ?? null,
      visualDescription: item.visualSupport?.description ?? null,
      visualKind: inferVisualKind(item.visualSupport?.description ?? item.prompt),
      metadata: {
        answerType: item.answerType,
        difficulty: item.difficulty,
        format: item.format,
        subElementKey: item.subElementKey,
        subElementTitle: item.subElementTitle,
      },
    }));
}
