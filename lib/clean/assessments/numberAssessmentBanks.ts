import {
  NUMBER_APPROXIMATION_ASSESSMENT_ITEMS,
  type NumberAssessmentAnswerType as BaseNumberAssessmentAnswerType,
  type NumberAssessmentItemDifficulty,
  type NumberAssessmentOpenResponseReview,
  type NumberAssessmentVisualSupport,
} from "@/lib/clean/assessments/numberApproximationAssessmentItems";
import {
  NUMBER_ADDITIVE_STRATEGIES_ASSESSMENT_ITEMS,
  NUMBER_ADDITIVE_STRATEGIES_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberAdditiveStrategiesAssessmentItems";
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
  NUMBER_PLACE_VALUE_OPERATIONS_ASSESSMENT_ITEMS,
  NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPlaceValueOperationsAssessmentItems";
import {
  NUMBER_DECIMALS_FOUNDATIONS_ASSESSMENT_ITEMS,
  NUMBER_DECIMALS_FOUNDATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberDecimalsFoundationsAssessmentItems";
import {
  NUMBER_FRACTIONS_FOUNDATIONS_ASSESSMENT_ITEMS,
  NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberFractionsFoundationsAssessmentItems";
import {
  NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ASSESSMENT_ITEMS,
  NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberMultiplicationDivisionFluencyAssessmentItems";
import {
  NUMBER_PATTERNS_EARLY_ALGEBRA_ASSESSMENT_ITEMS,
  NUMBER_PATTERNS_EARLY_ALGEBRA_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPatternsEarlyAlgebraAssessmentItems";
import {
  NUMBER_POWERS_ROOTS_ASSESSMENT_ITEMS,
  NUMBER_POWERS_ROOTS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPowersRootsAssessmentItems";
import {
  NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS,
  NUMBER_RATIONAL_OPERATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberRationalOperationsAssessmentItems";
import {
  NUMBER_TERMINATING_RECURRING_RATIONAL_ASSESSMENT_ITEMS,
  NUMBER_TERMINATING_RECURRING_RATIONAL_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberTerminatingRecurringRationalAssessmentItems";
import {
  NUMBER_SURDS_EXACT_ASSESSMENT_ITEMS,
  NUMBER_SURDS_EXACT_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberSurdsExactAssessmentItems";

export type NumberAssessmentBankKey =
  | "place-value-and-whole-number-operations"
  | "additive-strategies-and-problem-solving"
  | "multiplication-division-fluency"
  | "number-patterns-and-early-algebraic-thinking"
  | "fractions-foundations"
  | "decimals-foundations"
  | "integers-coordinates-number-properties"
  | "rational-numbers-and-operations"
  | "terminating-recurring-rational-representations"
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
    key: "place-value-and-whole-number-operations",
    title: "Place value and whole-number operations",
    shortTitle: "Place value and operations",
    description:
      "Checks place value, number structure, comparing, ordering, rounding, addition and subtraction strategies, and multiplication and division foundations.",
    yearBandLabel: "Years 3-5",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stepKey: "place-value-and-whole-number-operations",
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::place-value-and-whole-number-operations",
    progressionBandKey: "place-value-and-whole-number-operations",
    itemBankKey: NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number",
    items: NUMBER_PLACE_VALUE_OPERATIONS_ASSESSMENT_ITEMS,
  },
  {
    key: "additive-strategies-and-problem-solving",
    title: "Additive strategies and problem solving",
    shortTitle: "Additive strategies",
    description:
      "Checks mental addition and subtraction strategies, written addition and subtraction, regrouping, missing-number equations and additive problem solving.",
    yearBandLabel: "Years 3-5",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stepKey: "additive-strategies-and-problem-solving",
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::additive-strategies-and-problem-solving",
    progressionBandKey: "additive-strategies-and-problem-solving",
    itemBankKey: NUMBER_ADDITIVE_STRATEGIES_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number",
    items: NUMBER_ADDITIVE_STRATEGIES_ASSESSMENT_ITEMS,
  },
  {
    key: "multiplication-division-fluency",
    title: "Multiplication and division fluency",
    shortTitle: "Multiplication and division",
    description:
      "Checks multiplication facts, arrays, equal groups, division facts, fact families, inverse relationships and multiplicative problem solving.",
    yearBandLabel: "Years 3-5",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stepKey: "multiplication-division-fluency",
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::multiplication-division-fluency",
    progressionBandKey: "multiplication-division-fluency",
    itemBankKey: NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number",
    items: NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ASSESSMENT_ITEMS,
  },
  {
    key: "number-patterns-and-early-algebraic-thinking",
    title: "Number patterns and early algebraic thinking",
    shortTitle: "Number patterns",
    description:
      "Checks skip-counting, growing and shrinking patterns, input-output rules, missing numbers and simple equation thinking.",
    yearBandLabel: "Years 3-5",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stepKey: "number-patterns-and-early-algebraic-thinking",
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::number-patterns-and-early-algebraic-thinking",
    progressionBandKey: "number-patterns-and-early-algebraic-thinking",
    itemBankKey: NUMBER_PATTERNS_EARLY_ALGEBRA_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number",
    items: NUMBER_PATTERNS_EARLY_ALGEBRA_ASSESSMENT_ITEMS,
  },
  {
    key: "fractions-foundations",
    title: "Fractions foundations",
    shortTitle: "Fractions foundations",
    description:
      "Checks fraction meaning, fraction representation, equivalent fractions, comparing and ordering fractions, and simple fraction problem solving.",
    yearBandLabel: "Years 3-5",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stepKey: "fractions-foundations",
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::fractions-foundations",
    progressionBandKey: "fractions-foundations",
    itemBankKey: NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number",
    items: NUMBER_FRACTIONS_FOUNDATIONS_ASSESSMENT_ITEMS,
  },
  {
    key: "decimals-foundations",
    title: "Decimals foundations",
    shortTitle: "Decimals foundations",
    description:
      "Checks decimal place value, tenths and hundredths, fraction-decimal connections, comparing, ordering and rounding decimals, and simple money or measurement contexts.",
    yearBandLabel: "Years 3-5",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "middle-primary",
    stepKey: "decimals-foundations",
    pathwayStepId:
      "mathematics::number-and-place-value::middle-primary::decimals-foundations",
    progressionBandKey: "decimals-foundations",
    itemBankKey: NUMBER_DECIMALS_FOUNDATIONS_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number",
    items: NUMBER_DECIMALS_FOUNDATIONS_ASSESSMENT_ITEMS,
  },
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
    sourceRoute: "/assessments/number",
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
    sourceRoute: "/assessments/number",
    items: NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS,
  },
  {
    key: "terminating-recurring-rational-representations",
    title: "Terminating, recurring and rational representations",
    shortTitle: "Terminating and recurring decimals",
    description:
      "Checks terminating decimals, recurring decimals, fraction-decimal conversion, rational representations, and the rational/irrational decimal boundary.",
    yearBandLabel: "Years 7-9",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "years-9-10-consolidation",
    stepKey: "terminating-recurring-rational-representations",
    pathwayStepId:
      "mathematics::number-and-place-value::years-9-10-consolidation::terminating-recurring-rational-representations",
    progressionBandKey: "terminating-recurring-rational-representations",
    itemBankKey: NUMBER_TERMINATING_RECURRING_RATIONAL_ITEM_BANK_KEY,
    sourceRoute: "/assessments/number",
    items: NUMBER_TERMINATING_RECURRING_RATIONAL_ASSESSMENT_ITEMS,
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
    sourceRoute: "/assessments/number",
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
    sourceRoute: "/assessments/number",
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
    sourceRoute: "/assessments/number",
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
    sourceRoute: "/assessments/number",
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
    sourceRoute: "/assessments/number",
    items: NUMBER_APPROXIMATION_ASSESSMENT_ITEMS,
  },
];

export function getNumberAssessmentBankByKey(key: NumberAssessmentBankKey) {
  return NUMBER_ASSESSMENT_BANKS.find((bank) => bank.key === key) || null;
}
