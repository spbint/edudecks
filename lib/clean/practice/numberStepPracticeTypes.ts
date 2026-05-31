import type { NumberPracticeTask } from "@/lib/clean/practice/numberPowersRootsPracticeModules";
import type { NumberStepAssessmentDepth } from "@/lib/clean/assessments/numberStepAssessmentTypes";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export type NumberStepPracticeDepth = NumberStepAssessmentDepth;

export type NumberStepPracticeDepthOption = {
  key: NumberStepPracticeDepth;
  label: string;
  taskCount: number;
  description: string;
};

export type NumberStepPractice = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  subjectKey: "mathematics";
  strandKey: "number-and-place-value";
  stageKey: CleanAssessmentStageKey;
  parentModuleId: string;
  parentModuleTitle: string;
  relatedStepAssessmentKey: string;
  depthOptions: NumberStepPracticeDepthOption[];
  tasks: NumberPracticeTask[];
};

export const NUMBER_STEP_PRACTICE_DEPTH_OPTIONS: NumberStepPracticeDepthOption[] = [
  {
    key: "basic",
    label: "Basic",
    taskCount: 4,
    description: "4 tasks",
  },
  {
    key: "standard",
    label: "Standard",
    taskCount: 8,
    description: "8 tasks",
  },
  {
    key: "comprehensive",
    label: "Comprehensive",
    taskCount: 12,
    description: "12 tasks",
  },
];

export function getNumberStepPracticeDepthTaskCount(depth: NumberStepPracticeDepth) {
  return (
    NUMBER_STEP_PRACTICE_DEPTH_OPTIONS.find((option) => option.key === depth)
      ?.taskCount ?? 4
  );
}
