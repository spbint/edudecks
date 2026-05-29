import {
  NUMBER_APPROXIMATION_ASSESSMENT_ITEMS,
  type NumberAssessmentAnswerType as BaseNumberAssessmentAnswerType,
  type NumberAssessmentItemDifficulty,
  type NumberAssessmentOpenResponseReview,
  type NumberAssessmentVisualSupport,
} from "@/lib/clean/assessments/numberApproximationAssessmentItems";
import type {
  CleanAssessmentStageKey,
  CleanAssessmentSubjectKey,
} from "@/lib/clean/assessments/types";
import {
  NUMBER_INTEGERS_COORDINATES_PROPERTIES_ASSESSMENT_ITEMS,
  NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberIntegersCoordinatesPropertiesAssessmentItems";
import {
  NUMBER_IRRATIONAL_REAL_ASSESSMENT_ITEMS,
  NUMBER_IRRATIONAL_REAL_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberIrrationalRealAssessmentItems";
import {
  NUMBER_PERCENT_RATIO_FINANCE_ASSESSMENT_ITEMS,
  NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPercentRatioFinanceAssessmentItems";
import {
  NUMBER_POWERS_ROOTS_ASSESSMENT_ITEMS,
  NUMBER_POWERS_ROOTS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPowersRootsAssessmentItems";
import {
  NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS,
  NUMBER_RATIONAL_OPERATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberRationalOperationsAssessmentItems";
import {
  NUMBER_SURDS_EXACT_ASSESSMENT_ITEMS,
  NUMBER_SURDS_EXACT_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberSurdsExactAssessmentItems";

export type NumberAssessmentBankKey =
  | "integers-coordinates-number-properties"
  | "rational-numbers-and-operations"
  | "percentages-ratio-financial-modelling"
  | "powers-roots-exponent-notation"
  | "surds-and-exact-form"
  | "approximation-estimation-error"
  | "irrational-and-real-numbers";

export type NumberAssessmentStructuredAnswerType =
  | "multi_select"
  | "short_symbolic"
  | "matching"
  | "ordering"
  | "classification"
  | "select_correct_working"
  | "choose_best_explanation"
  | "fill_gap"
  | "true_false_correction";

export type NumberAssessmentAnswerType =
  | BaseNumberAssessmentAnswerType
  | NumberAssessmentStructuredAnswerType;

export type NumberAssessmentStructuredOption = {
  id: string;
  label: string;
  value?: string;
};

export type NumberAssessmentMatchingPair = {
  prompt: string;
  correctMatch: string;
};

export type NumberAssessmentClassificationCategory = {
  id: string;
  label: string;
};

export type NumberAssessmentClassificationItem = {
  id: string;
  label: string;
  correctCategoryId: string;
};

export type NumberAssessmentBankItem = {
  id: string;
  progressionBandKey: string;
  progressionStepKey: string;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: string;
  options?: string[];
  structuredOptions?: NumberAssessmentStructuredOption[];
  correctOptionIds?: string[];
  matchingPairs?: NumberAssessmentMatchingPair[];
  orderingItems?: string[];
  correctOrder?: string[];
  classificationCategories?: NumberAssessmentClassificationCategory[];
  classificationItems?: NumberAssessmentClassificationItem[];
  gapText?: string;
  gapAnswer?: string;
  gapAcceptableAnswers?: string[];
  trueFalseStatement?: string;
  correctBoolean?: boolean;
  correctionOptions?: string[];
  correctCorrection?: string;
  correctWorkingOptionId?: string;
  bestExplanationOptionId?: string;
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
    key: "integers-coordinates-number-properties",
    title: "Integers, coordinates and number properties",
    shortTitle: "Integers and coordinates",
    description:
      "Checks integer ordering and operations, coordinates, factors, multiples, divisibility, primes, composites and number properties.",
    yearBandLabel: "Years 6-8",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stepKey: "integers-coordinates-number-properties",
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::integers-coordinates-number-properties",
    progressionBandKey: "integers-coordinates-number-properties",
    itemBankKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number-approximation-prototype",
    items: NUMBER_INTEGERS_COORDINATES_PROPERTIES_ASSESSMENT_ITEMS,
  },
  {
    key: "rational-numbers-and-operations",
    title: "Rational numbers and operations",
    shortTitle: "Rational operations",
    description:
      "Checks equivalent rational representations, fraction and decimal operations, rational-number comparison, and rational operations in context.",
    yearBandLabel: "Years 6-8",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stepKey: "rational-numbers-and-operations",
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::rational-numbers-and-operations",
    progressionBandKey: "rational-numbers-and-operations",
    itemBankKey: NUMBER_RATIONAL_OPERATIONS_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number-approximation-prototype",
    items: NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS,
  },
  {
    key: "percentages-ratio-financial-modelling",
    title: "Percentages, ratio and financial modelling",
    shortTitle: "Percent, ratio and finance",
    description:
      "Checks percentages, equivalent representations, ratio sharing, discounts, profit, percentage error and financial modelling.",
    yearBandLabel: "Years 6-8",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stepKey: "percentages-ratio-financial-modelling",
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::percentages-ratio-financial-modelling",
    progressionBandKey: "percentages-ratio-financial-modelling",
    itemBankKey: NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number-approximation-prototype",
    items: NUMBER_PERCENT_RATIO_FINANCE_ASSESSMENT_ITEMS,
  },
  {
    key: "powers-roots-exponent-notation",
    title: "Powers, roots and exponent notation",
    shortTitle: "Powers and roots",
    description:
      "Checks square roots, powers, exponent notation, prime powers, powers of 10 and exponent laws.",
    yearBandLabel: "Years 7-8",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stepKey: "powers-roots-exponent-notation",
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::powers-roots-exponent-notation",
    progressionBandKey: "powers-roots-exponent-notation",
    itemBankKey: NUMBER_POWERS_ROOTS_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number-approximation-prototype",
    items: NUMBER_POWERS_ROOTS_ASSESSMENT_ITEMS,
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
  {
    key: "surds-and-exact-form",
    title: "Surds and exact form",
    shortTitle: "Surds and exact form",
    description:
      "Checks surd notation, simplifying surds, surd operations, rationalising denominators and exact form reasoning.",
    yearBandLabel: "Years 10-10A",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stepKey: "surds-and-exact-form",
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::surds-and-exact-form",
    progressionBandKey: "surds-and-exact-form",
    itemBankKey: NUMBER_SURDS_EXACT_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number-approximation-prototype",
    items: NUMBER_SURDS_EXACT_ASSESSMENT_ITEMS,
  },
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
];

export function getNumberAssessmentBankByKey(key: NumberAssessmentBankKey) {
  return NUMBER_ASSESSMENT_BANKS.find((bank) => bank.key === key) || null;
}
