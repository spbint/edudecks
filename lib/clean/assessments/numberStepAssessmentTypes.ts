import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import type { CleanAssessmentStageKey } from "@/lib/clean/assessments/types";

export type NumberStepAssessmentDepth = "basic" | "standard" | "comprehensive";

export type NumberStepAssessmentDepthOption = {
  key: NumberStepAssessmentDepth;
  label: string;
  itemCount: number;
  description: string;
};

export type NumberStepAssessment = {
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
  parentBankKey: NumberAssessmentBankKey;
  parentBankTitle: string;
  parentItemBankKey: string;
  progressionBandKey: string;
  sourceRoute: string;
  depthOptions: NumberStepAssessmentDepthOption[];
  items: NumberAssessmentBankItem[];
};

export const NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS: NumberStepAssessmentDepthOption[] = [
  {
    key: "basic",
    label: "Basic",
    itemCount: 4,
    description: "4 questions",
  },
  {
    key: "standard",
    label: "Standard",
    itemCount: 8,
    description: "8 questions",
  },
  {
    key: "comprehensive",
    label: "Comprehensive",
    itemCount: 12,
    description: "12 questions",
  },
];

export function getNumberStepAssessmentDepthItemCount(
  depth: NumberStepAssessmentDepth,
) {
  return (
    NUMBER_STEP_ASSESSMENT_DEPTH_OPTIONS.find((option) => option.key === depth)
      ?.itemCount ?? 4
  );
}

export function getNumberStepAssessmentStatus(
  correctCount: number,
  itemCount: number,
) {
  if (itemCount <= 4) {
    if (correctCount >= 3) return "Secure";
    if (correctCount === 2) return "Developing / consolidating";
    return "Needs support";
  }

  const percentage = itemCount ? correctCount / itemCount : 0;
  if (percentage >= 0.8) return "Secure";
  if (percentage >= 0.6) return "Consolidating";
  if (percentage >= 0.4) return "Developing";
  return "Needs support";
}
