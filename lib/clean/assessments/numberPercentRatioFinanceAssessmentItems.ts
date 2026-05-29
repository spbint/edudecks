import type {
  NumberAssessmentAnswerType,
  NumberAssessmentClassificationCategory,
  NumberAssessmentClassificationItem,
  NumberAssessmentItemDifficulty,
  NumberAssessmentMatchingPair,
  NumberAssessmentOpenResponseReview,
  NumberAssessmentStructuredOption,
  NumberAssessmentVisualSupport,
} from "@/lib/clean/assessments/numberApproximationAssessmentItems";
import type { NumberProgressionBandKey } from "@/lib/clean/pathways/mathematicsYears6To10NumberProgressionMap";

export type NumberPercentRatioFinanceProgressionBandKey = Extract<
  NumberProgressionBandKey,
  "percentages-ratio-financial-modelling"
>;

export type NumberPercentRatioFinanceProgressionStepKey =
  | "find-percentage-of-a-quantity"
  | "calculate-discounts-and-sale-prices"
  | "estimate-percentage-and-fraction-quantities"
  | "divide-quantities-by-ratio"
  | "calculate-percentage-profit"
  | "calculate-percentage-error"
  | "solve-financial-modelling-problems";

export type NumberPercentRatioFinanceAssessmentFormat =
  | "percentage_representations"
  | "percentage_of_quantity"
  | "ratio_sharing"
  | "ratio_scaling"
  | "financial_change"
  | "percentage_error"
  | "financial_modelling";

export type NumberPercentRatioFinanceMisconceptionCode =
  | "percentage-fraction-decimal-equivalence-error"
  | "percentage-of-quantity-error"
  | "percent-as-whole-number-error"
  | "ratio-part-whole-confusion"
  | "ratio-scaling-error"
  | "ratio-sharing-total-error"
  | "discount-vs-final-price-confusion"
  | "percentage-increase-decrease-error"
  | "profit-loss-direction-error"
  | "percentage-error-denominator-error"
  | "financial-context-operation-error"
  | "rate-or-unit-context-error";

export type NumberPercentRatioFinanceAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberPercentRatioFinanceProgressionStepKey;
  ifCorrectGoToStepKey?: NumberPercentRatioFinanceProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberPercentRatioFinanceAssessmentItem = {
  id: string;
  progressionBandKey: NumberPercentRatioFinanceProgressionBandKey;
  progressionStepKey: NumberPercentRatioFinanceProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberPercentRatioFinanceAssessmentFormat;
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
  misconceptionTargets: NumberPercentRatioFinanceMisconceptionCode[];
  adaptiveRoute: NumberPercentRatioFinanceAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY =
  "number-percent-ratio-finance-assessment-items-v1";

export const NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY: NumberPercentRatioFinanceProgressionBandKey =
  "percentages-ratio-financial-modelling";

export const NUMBER_PERCENT_RATIO_FINANCE_ASSESSMENT_ITEMS: NumberPercentRatioFinanceAssessmentItem[] =
  [
    {
      id: "percent-ratio-finance-equivalence-match-001",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "find-percentage-of-a-quantity",
      subElementKey: "percentage-of-quantities",
      subElementTitle: "Percentage of quantities",
      subElementDescription:
        "Find percentages of amounts and connect percentages to fractions and decimals.",
      title: "Match percentage representations",
      prompt: "Match each percentage with its equivalent fraction or decimal.",
      difficulty: "foundation",
      answerType: "matching",
      format: "percentage_representations",
      matchingPairs: [
        { prompt: "25%", correctMatch: "0.25 and 1/4" },
        { prompt: "10%", correctMatch: "0.10 and 1/10" },
        { prompt: "75%", correctMatch: "0.75 and 3/4" },
      ],
      expectedAnswer: "25% = 0.25 = 1/4; 10% = 0.10 = 1/10; 75% = 0.75 = 3/4",
      acceptableAnswers: [
        "25% = 0.25 = 1/4; 10% = 0.10 = 1/10; 75% = 0.75 = 3/4",
      ],
      markingGuide:
        "Award full credit for matching each percentage with both its decimal and fraction form.",
      workedSolution:
        "Percent means out of 100. 25% is 25/100 = 1/4 = 0.25, 10% is 1/10 = 0.10, and 75% is 3/4 = 0.75.",
      misconceptionTargets: [
        "percentage-fraction-decimal-equivalence-error",
        "percent-as-whole-number-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "find-percentage-of-a-quantity",
        ifCorrectGoToStepKey: "estimate-percentage-and-fraction-quantities",
        practiceRecommendation:
          "Practise converting common percentages to fractions and decimals using the per-hundred meaning.",
        diagnosticNote:
          "This item checks whether the learner connects percentage, decimal and fraction forms.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a table with percentage, decimal and fraction columns.",
      },
    },
    {
      id: "percent-ratio-finance-percentage-quantity-002",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "find-percentage-of-a-quantity",
      subElementKey: "percentage-of-quantities",
      subElementTitle: "Percentage of quantities",
      subElementDescription:
        "Find percentages of amounts and connect percentages to fractions and decimals.",
      title: "Find a percentage of a quantity",
      prompt: "Find 15% of 200.",
      difficulty: "foundation",
      answerType: "numeric",
      format: "percentage_of_quantity",
      expectedAnswer: "30",
      acceptableAnswers: ["30"],
      markingGuide:
        "Award full credit for 30. The learner may use 10% + 5% or multiply by 0.15.",
      workedSolution:
        "10% of 200 is 20 and 5% of 200 is 10, so 15% of 200 is 30.",
      misconceptionTargets: [
        "percentage-of-quantity-error",
        "percent-as-whole-number-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "find-percentage-of-a-quantity",
        ifCorrectGoToStepKey: "calculate-discounts-and-sale-prices",
        practiceRecommendation:
          "Practise using benchmark percentages such as 10%, 5%, 25% and 50% to find amounts.",
        diagnosticNote:
          "This item checks whether the learner can find a percentage of a whole quantity.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A simple amount card showing 200 as the whole quantity.",
      },
    },
    {
      id: "percent-ratio-finance-equivalent-select-003",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "estimate-percentage-and-fraction-quantities",
      subElementKey: "percentage-of-quantities",
      subElementTitle: "Percentage of quantities",
      subElementDescription:
        "Find percentages of amounts and connect percentages to fractions and decimals.",
      title: "Select equivalent percentage statements",
      prompt: "Select every statement equivalent to 40%.",
      difficulty: "foundation",
      answerType: "multi_select",
      format: "percentage_representations",
      structuredOptions: [
        { id: "forty-per-hundred", label: "40 out of 100" },
        { id: "two-fifths", label: "2/5" },
        { id: "point-four", label: "0.4" },
        { id: "four-percent", label: "0.04" },
        { id: "four-tenths", label: "4/10" },
      ],
      correctOptionIds: [
        "forty-per-hundred",
        "two-fifths",
        "point-four",
        "four-tenths",
      ],
      expectedAnswer: "40 out of 100, 2/5, 0.4, and 4/10",
      acceptableAnswers: ["40 out of 100, 2/5, 0.4, and 4/10"],
      markingGuide:
        "Award full credit for selecting all and only the statements equivalent to 40%.",
      workedSolution:
        "40% means 40/100, which simplifies to 2/5 and is 0.4 or 4/10. 0.04 is 4%, not 40%.",
      misconceptionTargets: [
        "percentage-fraction-decimal-equivalence-error",
        "percent-as-whole-number-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "find-percentage-of-a-quantity",
        ifCorrectGoToStepKey: "estimate-percentage-and-fraction-quantities",
        practiceRecommendation:
          "Practise distinguishing 40%, 4% and 0.4 using place value and per-hundred language.",
        diagnosticNote:
          "This item checks whether the learner can recognise equivalent percentage, fraction and decimal statements.",
      },
      visualSupport: {
        type: "table",
        description:
          "Compare percentage, fraction and decimal forms side by side.",
      },
    },
    {
      id: "percent-ratio-finance-ratio-scale-004",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "divide-quantities-by-ratio",
      subElementKey: "ratio-sharing-and-scaling",
      subElementTitle: "Ratio sharing and scaling",
      subElementDescription:
        "Divide and scale quantities using ratio relationships.",
      title: "Scale a ratio",
      prompt: "Scale the ratio 2:3 so that the first part is 8.",
      difficulty: "developing",
      answerType: "short_symbolic",
      format: "ratio_scaling",
      expectedAnswer: "8:12",
      acceptableAnswers: ["8:12", "8 to 12"],
      markingGuide:
        "Award full credit for 8:12. The ratio 2:3 has been multiplied by 4.",
      workedSolution:
        "The first part changes from 2 to 8, so multiply by 4. The second part is 3 x 4 = 12, giving 8:12.",
      misconceptionTargets: ["ratio-scaling-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "divide-quantities-by-ratio",
        ifCorrectGoToStepKey: "solve-financial-modelling-problems",
        practiceRecommendation:
          "Practise scaling both parts of a ratio by the same multiplier.",
        diagnosticNote:
          "This item checks whether the learner preserves ratio structure when scaling.",
      },
      visualSupport: {
        type: "table",
        description:
          "Show original parts and scaled parts in a two-row table.",
      },
    },
    {
      id: "percent-ratio-finance-ratio-fill-gap-005",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "divide-quantities-by-ratio",
      subElementKey: "ratio-sharing-and-scaling",
      subElementTitle: "Ratio sharing and scaling",
      subElementDescription:
        "Divide and scale quantities using ratio relationships.",
      title: "Find the value of one ratio part",
      prompt: "A total of 40 is shared in the ratio 2:3. Complete the gap.",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "ratio_sharing",
      gapText: "2 + 3 = 5 parts, so 1 part = 40 / __",
      gapAnswer: "5",
      gapAcceptableAnswers: ["5"],
      expectedAnswer: "5",
      acceptableAnswers: ["5"],
      markingGuide:
        "Award full credit for 5 because the total number of ratio parts is 2 + 3.",
      workedSolution:
        "The ratio has 2 + 3 = 5 equal parts in total. To find one part, divide 40 by 5.",
      misconceptionTargets: [
        "ratio-part-whole-confusion",
        "ratio-sharing-total-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "divide-quantities-by-ratio",
        ifCorrectGoToStepKey: "solve-financial-modelling-problems",
        practiceRecommendation:
          "Practise adding all ratio parts before dividing the total amount.",
        diagnosticNote:
          "This item checks whether the learner uses the total number of ratio parts rather than one part alone.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A ratio sharing card with total amount and ratio parts.",
      },
    },
    {
      id: "percent-ratio-finance-ratio-working-006",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "divide-quantities-by-ratio",
      subElementKey: "ratio-sharing-and-scaling",
      subElementTitle: "Ratio sharing and scaling",
      subElementDescription:
        "Divide and scale quantities using ratio relationships.",
      title: "Select correct ratio sharing working",
      prompt: "Which working correctly shares $96 in the ratio 1:3?",
      difficulty: "developing",
      answerType: "select_correct_working",
      format: "ratio_sharing",
      structuredOptions: [
        {
          id: "total-parts",
          label: "1 + 3 = 4 parts. $96 / 4 = $24, so the shares are $24 and $72.",
        },
        {
          id: "divide-by-three",
          label: "$96 / 3 = $32, so the shares are $32 and $96.",
        },
        {
          id: "halve-total",
          label: "There are two people, so each gets $48.",
        },
        {
          id: "subtract-parts",
          label: "3 - 1 = 2, so each part is $48 and the shares are $48 and $144.",
        },
      ],
      correctWorkingOptionId: "total-parts",
      expectedAnswer: "$24 and $72",
      acceptableAnswers: ["$24 and $72", "24 and 72"],
      markingGuide:
        "Award full credit for selecting the working that uses 4 total parts and gives $24 and $72.",
      workedSolution:
        "The ratio has 1 + 3 = 4 parts. One part is $96 / 4 = $24, so the two shares are $24 and 3 x $24 = $72.",
      misconceptionTargets: [
        "ratio-sharing-total-error",
        "ratio-part-whole-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "divide-quantities-by-ratio",
        ifCorrectGoToStepKey: "solve-financial-modelling-problems",
        practiceRecommendation:
          "Practise finding total parts, one part, then each share in ratio contexts.",
        diagnosticNote:
          "This item checks whether the learner can identify correct ratio-sharing working.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A money-sharing context card with candidate working paths.",
      },
    },
    {
      id: "percent-ratio-finance-discount-sale-price-007",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-discounts-and-sale-prices",
      subElementKey: "discounts-profit-and-financial-change",
      subElementTitle: "Discounts, profit and financial change",
      subElementDescription:
        "Apply percentage increase, decrease, discount, profit and loss reasoning.",
      title: "Calculate a sale price",
      prompt: "A $90 jacket is reduced by 20%. What is the sale price?",
      difficulty: "developing",
      answerType: "numeric",
      format: "financial_change",
      expectedAnswer: "72",
      acceptableAnswers: ["72", "$72"],
      markingGuide:
        "Award full credit for $72. A 20% discount on $90 is $18, so the sale price is $72.",
      workedSolution:
        "20% of $90 is $18. Subtract the discount from the original price: $90 - $18 = $72.",
      misconceptionTargets: [
        "discount-vs-final-price-confusion",
        "percentage-of-quantity-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-discounts-and-sale-prices",
        ifCorrectGoToStepKey: "calculate-percentage-profit",
        practiceRecommendation:
          "Practise finding the discount amount first, then subtracting it from the original price.",
        diagnosticNote:
          "This item checks whether the learner distinguishes discount amount from final sale price.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A sale-price card showing original price and discount percentage.",
      },
    },
    {
      id: "percent-ratio-finance-discount-order-008",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-discounts-and-sale-prices",
      subElementKey: "discounts-profit-and-financial-change",
      subElementTitle: "Discounts, profit and financial change",
      subElementDescription:
        "Apply percentage increase, decrease, discount, profit and loss reasoning.",
      title: "Order discounts by final price",
      prompt:
        "Each item starts at $100. Order these discounts from lowest final price to highest final price.",
      difficulty: "secure",
      answerType: "ordering",
      format: "financial_change",
      orderingItems: ["10% off", "25% off", "40% off", "15% off"],
      correctOrder: ["40% off", "25% off", "15% off", "10% off"],
      expectedAnswer: "40% off, 25% off, 15% off, 10% off",
      acceptableAnswers: [
        "40% off, 25% off, 15% off, 10% off",
        "40% 25% 15% 10%",
      ],
      markingGuide:
        "Award full credit for ordering the largest discount first because it gives the lowest final price.",
      workedSolution:
        "With the same original price, a larger discount gives a lower final price. So 40% off is lowest, then 25%, then 15%, then 10%.",
      misconceptionTargets: [
        "discount-vs-final-price-confusion",
        "percentage-increase-decrease-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-discounts-and-sale-prices",
        ifCorrectGoToStepKey: "calculate-percentage-profit",
        practiceRecommendation:
          "Practise comparing discounts by thinking about the final amount paid.",
        diagnosticNote:
          "This item checks whether the learner can reason about discount size and final price.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Order discount percentages from largest to smallest to compare final prices.",
      },
    },
    {
      id: "percent-ratio-finance-classify-change-009",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-percentage-profit",
      subElementKey: "discounts-profit-and-financial-change",
      subElementTitle: "Discounts, profit and financial change",
      subElementDescription:
        "Apply percentage increase, decrease, discount, profit and loss reasoning.",
      title: "Classify financial changes",
      prompt: "Classify each context by the type of financial change.",
      difficulty: "secure",
      answerType: "classification",
      format: "financial_change",
      classificationCategories: [
        { id: "increase", label: "Percentage increase" },
        { id: "decrease", label: "Percentage decrease or discount" },
        { id: "profit", label: "Profit" },
        { id: "loss", label: "Loss" },
      ],
      classificationItems: [
        { id: "rent-up", label: "Rent rises by 8%", correctCategoryId: "increase" },
        { id: "sale-off", label: "A coat is 30% off", correctCategoryId: "decrease" },
        { id: "sell-above-cost", label: "Bought for $80 and sold for $92", correctCategoryId: "profit" },
        { id: "sell-below-cost", label: "Bought for $50 and sold for $45", correctCategoryId: "loss" },
      ],
      expectedAnswer:
        "Rent increase; coat decrease or discount; $80 to $92 profit; $50 to $45 loss",
      acceptableAnswers: [
        "Rent increase; coat decrease or discount; $80 to $92 profit; $50 to $45 loss",
      ],
      markingGuide:
        "Award full credit for classifying each context by direction and financial meaning.",
      workedSolution:
        "A rise is an increase. A discount is a decrease. Selling above cost gives profit; selling below cost gives loss.",
      misconceptionTargets: [
        "profit-loss-direction-error",
        "percentage-increase-decrease-error",
        "financial-context-operation-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-percentage-profit",
        ifCorrectGoToStepKey: "solve-financial-modelling-problems",
        practiceRecommendation:
          "Practise identifying whether the context is an increase, decrease, profit or loss before calculating.",
        diagnosticNote:
          "This item checks whether the learner can interpret the direction and meaning of financial change.",
      },
      visualSupport: {
        type: "table",
        description:
          "Sort contexts into increase, decrease, profit and loss categories.",
      },
    },
    {
      id: "percent-ratio-finance-error-correction-010",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-percentage-error",
      subElementKey: "percentage-error-and-financial-modelling",
      subElementTitle: "Percentage error and financial modelling",
      subElementDescription:
        "Compare estimated and actual values, calculate percentage error, and reason about financial models.",
      title: "Correct percentage error reasoning",
      prompt:
        "True or false: if an estimate is 54 and the actual value is 60, the percentage error is 6% because the difference is 6.",
      difficulty: "secure",
      answerType: "true_false_correction",
      format: "percentage_error",
      trueFalseStatement:
        "If an estimate is 54 and the actual value is 60, the percentage error is 6% because the difference is 6.",
      correctBoolean: false,
      correctionOptions: [
        "The difference is 6, and 6 / 60 = 10%, so the percentage error is 10%.",
        "The percentage error is 6% because 60 - 54 = 6.",
        "The percentage error is 54 / 60 = 90%.",
      ],
      correctCorrection:
        "The difference is 6, and 6 / 60 = 10%, so the percentage error is 10%.",
      expectedAnswer: "10%",
      acceptableAnswers: ["10", "10%"],
      markingGuide:
        "Award full credit for identifying the statement as false and using the actual value as the denominator.",
      workedSolution:
        "The error amount is 60 - 54 = 6. Percentage error compares the error to the actual value: 6 / 60 = 0.10 = 10%.",
      misconceptionTargets: [
        "percentage-error-denominator-error",
        "percent-as-whole-number-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-percentage-error",
        ifCorrectGoToStepKey: "solve-financial-modelling-problems",
        practiceRecommendation:
          "Practise calculating error amount first, then dividing by the actual value.",
        diagnosticNote:
          "This item checks whether the learner uses the correct denominator for percentage error.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A comparison card showing estimated value, actual value and error amount.",
      },
    },
    {
      id: "percent-ratio-finance-modelling-explanation-011",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-financial-modelling-problems",
      subElementKey: "percentage-error-and-financial-modelling",
      subElementTitle: "Percentage error and financial modelling",
      subElementDescription:
        "Compare estimated and actual values, calculate percentage error, and reason about financial models.",
      title: "Choose the best modelling explanation",
      prompt:
        "A phone plan costs $30 for 10 GB and another costs $42 for 14 GB. Which explanation best compares the value?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "financial_modelling",
      structuredOptions: [
        {
          id: "same-rate",
          label: "Both plans cost $3 per GB, so they have the same unit rate.",
        },
        {
          id: "cheaper-total",
          label: "The $30 plan is always better because the total cost is lower.",
        },
        {
          id: "more-data",
          label: "The $42 plan is always better because it gives more data.",
        },
        {
          id: "subtract-costs",
          label: "The plans differ by $12, so the $42 plan is $12 per GB.",
        },
      ],
      bestExplanationOptionId: "same-rate",
      expectedAnswer:
        "Both plans cost $3 per GB, so they have the same unit rate.",
      acceptableAnswers: [
        "Both plans cost $3 per GB, so they have the same unit rate.",
      ],
      markingGuide:
        "Award full credit for comparing unit rates rather than total cost alone.",
      workedSolution:
        "$30 / 10 GB = $3 per GB. $42 / 14 GB = $3 per GB. The plans have the same value per GB.",
      misconceptionTargets: [
        "rate-or-unit-context-error",
        "financial-context-operation-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-financial-modelling-problems",
        ifCorrectGoToStepKey: "solve-financial-modelling-problems",
        practiceRecommendation:
          "Practise comparing financial options using unit rates when quantities differ.",
        diagnosticNote:
          "This item checks whether the learner compares financial options using a common unit.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A two-plan comparison card with cost and data amounts.",
      },
    },
    {
      id: "percent-ratio-finance-context-problem-012",
      progressionBandKey: NUMBER_PERCENT_RATIO_FINANCE_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-financial-modelling-problems",
      subElementKey: "percentage-error-and-financial-modelling",
      subElementTitle: "Percentage error and financial modelling",
      subElementDescription:
        "Compare estimated and actual values, calculate percentage error, and reason about financial models.",
      title: "Solve a short financial modelling context",
      prompt:
        "A club expects 120 members next year after a 20% increase. How many members does it expect?",
      difficulty: "extension",
      answerType: "multiple_choice",
      format: "financial_modelling",
      options: ["144", "140", "100", "24"],
      expectedAnswer: "144",
      acceptableAnswers: ["144"],
      markingGuide:
        "Award full credit for 144. A 20% increase means add 24 to 120.",
      workedSolution:
        "20% of 120 is 24. A 20% increase means 120 + 24 = 144 expected members.",
      misconceptionTargets: [
        "percentage-increase-decrease-error",
        "financial-context-operation-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-financial-modelling-problems",
        ifCorrectGoToStepKey: "solve-financial-modelling-problems",
        practiceRecommendation:
          "Practise identifying the original amount, the percentage change, and whether to add or subtract.",
        diagnosticNote:
          "This item checks whether the learner can apply percentage increase in a short modelling context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A membership projection card with original amount and percentage increase.",
      },
    },
  ];

export function getNumberPercentRatioFinanceAssessmentItemById(id: string) {
  return (
    NUMBER_PERCENT_RATIO_FINANCE_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberPercentRatioFinanceAssessmentItemsByStep(
  stepKey: NumberPercentRatioFinanceProgressionStepKey,
) {
  return NUMBER_PERCENT_RATIO_FINANCE_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberPercentRatioFinanceAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_PERCENT_RATIO_FINANCE_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberPercentRatioFinanceAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_PERCENT_RATIO_FINANCE_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
