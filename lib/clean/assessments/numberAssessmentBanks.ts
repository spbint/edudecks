import {
  NUMBER_APPROXIMATION_ASSESSMENT_ITEMS,
  type NumberAssessmentAnswerType,
  type NumberAssessmentItemDifficulty,
  type NumberAssessmentOpenResponseReview,
  type NumberAssessmentVisualSupport,
} from "@/lib/clean/assessments/numberApproximationAssessmentItems";
import type {
  CleanAssessmentStageKey,
  CleanAssessmentSubjectKey,
} from "@/lib/clean/assessments/types";
import {
  NUMBER_IRRATIONAL_REAL_ASSESSMENT_ITEMS,
  NUMBER_IRRATIONAL_REAL_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberIrrationalRealAssessmentItems";

export type NumberAssessmentBankKey =
  | "approximation-estimation-error"
  | "irrational-and-real-numbers";

export type NumberAssessmentBankItem = {
  id: string;
  progressionBandKey: string;
  progressionStepKey: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: string;
  options?: string[];
  expectedAnswer?: string;
  acceptableAnswers?: string[];
  markingGuide?: string;
  workedSolution?: string;
  misconceptionTargets: string[];
  adaptiveRoute: {
    ifIncorrectGoToStepKey?: string;
    ifCorrectGoToStepKey?: string;
    practiceRecommendation: string;
    diagnosticNote: string;
  };
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export type NumberAssessmentBankConfig = {
  key: NumberAssessmentBankKey;
  title: string;
  shortTitle: string;
  description: string;
  yearBandLabel: string;
  subjectKey: CleanAssessmentSubjectKey;
  strandKey: "number-and-place-value";
  stageKey: CleanAssessmentStageKey;
  stepKey: string;
  pathwayStepId: string;
  progressionBandKey: string;
  itemBankKey: string;
  sourceRoute: string;
  items: NumberAssessmentBankItem[];
};

const NUMBER_APPROXIMATION_ITEM_BANK_KEY =
  "number-approximation-assessment-items-v1";

// These pathway step ids are stable prototype keys until matching canonical
// Years 9-10 Number steps are added to the pathway registry.
export const NUMBER_ASSESSMENT_BANKS: NumberAssessmentBankConfig[] = [
  {
    key: "approximation-estimation-error",
    title: "Approximation, estimation and error",
    shortTitle: "Approximation and error",
    description:
      "Checks rounding, truncation, estimation, exact versus approximate values, and error reasoning.",
    yearBandLabel: "Years 7-10",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stepKey: "approximation-estimation-error",
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::approximation-estimation-error",
    progressionBandKey: "approximation-estimation-error",
    itemBankKey: NUMBER_APPROXIMATION_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number-approximation-prototype",
    items: NUMBER_APPROXIMATION_ASSESSMENT_ITEMS,
  },
  {
    key: "irrational-and-real-numbers",
    title: "Irrational and real numbers",
    shortTitle: "Real numbers",
    description:
      "Checks rational and irrational classification, square roots, pi, exact form, number-line reasoning, and exact area contexts.",
    yearBandLabel: "Years 8-10",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stepKey: "irrational-and-real-numbers",
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::irrational-and-real-numbers",
    progressionBandKey: "irrational-and-real-numbers",
    itemBankKey: NUMBER_IRRATIONAL_REAL_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number-approximation-prototype",
    items: NUMBER_IRRATIONAL_REAL_ASSESSMENT_ITEMS,
  },
];

export function getNumberAssessmentBankByKey(key: NumberAssessmentBankKey) {
  return NUMBER_ASSESSMENT_BANKS.find((bank) => bank.key === key) || null;
}
