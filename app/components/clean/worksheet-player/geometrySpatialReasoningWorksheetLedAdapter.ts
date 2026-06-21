import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";
import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import type { WorksheetLedActivity } from "@/app/components/clean/worksheet-player/WorksheetLedPlayer";

const TARGET_GSR_STEPS = new Set([1, 4, 6, 7]);

type WorksheetLedSource = {
  id: string;
  title: string;
  prompt: string;
  expectedAnswer?: string;
  workedSolution?: string;
  markingGuide?: string;
  supportPrompt?: string;
  visualSupport?: {
    type?: string;
    description?: string;
  };
};

function stepNumberFromId(id: string) {
  const match = id.match(/geometry-spatial-reasoning-step-(\d+)-/);
  return match ? Number(match[1]) : null;
}

function isTargetGsrTask(source: WorksheetLedSource) {
  const stepNumber = stepNumberFromId(source.id);
  return stepNumber !== null && TARGET_GSR_STEPS.has(stepNumber);
}

function visualDescription(source: WorksheetLedSource) {
  return source.visualSupport?.description?.trim() || "";
}

function toWorksheetLedActivity(
  source: WorksheetLedSource,
  mode: WorksheetLedActivity["mode"],
): WorksheetLedActivity {
  return {
    id: source.id,
    title: source.title,
    prompt: source.prompt,
    mode,
    expectedAnswer: source.expectedAnswer,
    explanation: source.workedSolution || source.markingGuide,
    supportHint: source.supportPrompt,
    visualDescription: visualDescription(source),
    worksheetReference: "Geometry and Spatial Reasoning worksheet task",
  };
}

export function geometrySpatialReasoningPracticeTasksToWorksheetLedActivities(
  tasks: NumberPracticeTask[],
) {
  return tasks
    .filter(isTargetGsrTask)
    .map((task) => toWorksheetLedActivity(task, "practise"));
}

export function geometrySpatialReasoningAssessmentItemsToWorksheetLedActivities(
  items: NumberAssessmentBankItem[],
) {
  return items
    .filter(isTargetGsrTask)
    .map((item) => toWorksheetLedActivity(item, "assess"));
}
