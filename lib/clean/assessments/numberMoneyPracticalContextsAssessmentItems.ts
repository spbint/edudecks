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

export type NumberMoneyPracticalContextsProgressionBandKey =
  "money-and-practical-number-contexts";

export type NumberMoneyPracticalContextsProgressionStepKey =
  | "recognise-and-represent-money-values"
  | "calculate-money-totals-and-change"
  | "solve-practical-measurement-and-time-contexts"
  | "estimate-budget-and-check-reasonableness";

export type NumberMoneyPracticalContextsAssessmentFormat =
  | "money_value_equivalence"
  | "money_notation"
  | "money_amount_ordering"
  | "money_total"
  | "change_calculation"
  | "money_working"
  | "measurement_context"
  | "elapsed_time_context"
  | "context_operation_choice"
  | "budget_classification"
  | "estimate_reasonableness"
  | "money_misconception_explanation";

export type NumberMoneyPracticalContextsMisconceptionCode =
  | "coin-note-value-confusion"
  | "money-decimal-place-value-error"
  | "cents-dollars-conversion-error"
  | "money-addition-regrouping-error"
  | "change-as-subtraction-error"
  | "operation-choice-context-error"
  | "measurement-unit-confusion"
  | "elapsed-time-counting-error"
  | "budget-constraint-error"
  | "estimation-reasonableness-gap"
  | "rounding-money-context-error"
  | "multi-step-practical-context-error";

export type NumberMoneyPracticalContextsAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberMoneyPracticalContextsProgressionStepKey;
  ifCorrectGoToStepKey?: NumberMoneyPracticalContextsProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberMoneyPracticalContextsAssessmentItem = {
  id: string;
  progressionBandKey: NumberMoneyPracticalContextsProgressionBandKey;
  progressionStepKey: NumberMoneyPracticalContextsProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberMoneyPracticalContextsAssessmentFormat;
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
  misconceptionTargets: NumberMoneyPracticalContextsMisconceptionCode[];
  adaptiveRoute: NumberMoneyPracticalContextsAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_MONEY_PRACTICAL_CONTEXTS_ITEM_BANK_KEY =
  "number-money-practical-contexts-assessment-items-v1";

export const NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY: NumberMoneyPracticalContextsProgressionBandKey =
  "money-and-practical-number-contexts";

export const NUMBER_MONEY_PRACTICAL_CONTEXTS_ASSESSMENT_ITEMS: NumberMoneyPracticalContextsAssessmentItem[] =
  [
    {
      id: "money-practical-contexts-equivalent-amounts-001",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-and-represent-money-values",
      subElementKey: "money-values-and-equivalent-amounts",
      subElementTitle: "Money values and equivalent amounts",
      subElementDescription:
        "Recognise, compare and represent money amounts using dollars, cents and equivalent combinations.",
      title: "Match equivalent money amounts",
      prompt: "Match each money amount to an equivalent representation.",
      difficulty: "foundation",
      answerType: "matching",
      format: "money_value_equivalence",
      matchingPairs: [
        { prompt: "$1.50", correctMatch: "150 cents" },
        { prompt: "$2.05", correctMatch: "205 cents" },
        { prompt: "75 cents", correctMatch: "$0.75" },
      ],
      expectedAnswer:
        "$1.50 = 150 cents; $2.05 = 205 cents; 75 cents = $0.75",
      acceptableAnswers: [
        "$1.50 = 150 cents; $2.05 = 205 cents; 75 cents = $0.75",
      ],
      markingGuide:
        "Award full credit for matching all three dollar-and-cent representations.",
      workedSolution:
        "One dollar is 100 cents. $1.50 is 150 cents, $2.05 is 205 cents, and 75 cents is $0.75.",
      misconceptionTargets: [
        "coin-note-value-confusion",
        "cents-dollars-conversion-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-and-represent-money-values",
        ifCorrectGoToStepKey: "calculate-money-totals-and-change",
        practiceRecommendation:
          "Practise converting between dollars, cents and common money combinations.",
        diagnosticNote:
          "This item checks whether the learner can connect dollar-and-cent notation with cents.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a money table showing dollars, cents and equivalent notation.",
      },
    },
    {
      id: "money-practical-contexts-money-notation-002",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-and-represent-money-values",
      subElementKey: "money-values-and-equivalent-amounts",
      subElementTitle: "Money values and equivalent amounts",
      subElementDescription:
        "Recognise, compare and represent money amounts using dollars, cents and equivalent combinations.",
      title: "Write dollars and cents",
      prompt: "Write 3 dollars and 7 cents using money notation.",
      difficulty: "foundation",
      answerType: "short_symbolic",
      format: "money_notation",
      expectedAnswer: "$3.07",
      acceptableAnswers: ["$3.07", "3.07"],
      markingGuide:
        "Award full credit for $3.07. The zero shows there are 0 tens of cents.",
      workedSolution:
        "Seven cents is written as 07 in the cents places, so 3 dollars and 7 cents is $3.07.",
      misconceptionTargets: [
        "money-decimal-place-value-error",
        "cents-dollars-conversion-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-and-represent-money-values",
        ifCorrectGoToStepKey: "calculate-money-totals-and-change",
        practiceRecommendation:
          "Practise writing cents with two decimal places, including amounts less than 10 cents.",
        diagnosticNote:
          "This item checks whether the learner uses two cents places in money notation.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a dollars-tens of cents-ones of cents place-value table.",
      },
    },
    {
      id: "money-practical-contexts-order-amounts-003",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-and-represent-money-values",
      subElementKey: "money-values-and-equivalent-amounts",
      subElementTitle: "Money values and equivalent amounts",
      subElementDescription:
        "Recognise, compare and represent money amounts using dollars, cents and equivalent combinations.",
      title: "Order money amounts",
      prompt: "Order these amounts from least to greatest.",
      difficulty: "foundation",
      answerType: "ordering",
      format: "money_amount_ordering",
      orderingItems: ["$2.40", "$2.04", "$2.45", "$2.14"],
      correctOrder: ["$2.04", "$2.14", "$2.40", "$2.45"],
      expectedAnswer: "$2.04, $2.14, $2.40, $2.45",
      acceptableAnswers: [
        "$2.04, $2.14, $2.40, $2.45",
        "2.04, 2.14, 2.40, 2.45",
      ],
      markingGuide:
        "Award full credit for ordering all four amounts from least to greatest.",
      workedSolution:
        "All amounts are 2 dollars. Compare the cents: 04, 14, 40, 45.",
      misconceptionTargets: [
        "money-decimal-place-value-error",
        "cents-dollars-conversion-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-and-represent-money-values",
        ifCorrectGoToStepKey: "calculate-money-totals-and-change",
        practiceRecommendation:
          "Practise comparing money amounts by dollars first, then cents.",
        diagnosticNote:
          "This item checks whether the learner compares money using decimal place value.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Place the amounts on a number line between $2.00 and $2.50.",
      },
    },
    {
      id: "money-practical-contexts-total-004",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-money-totals-and-change",
      subElementKey: "money-calculations-and-change",
      subElementTitle: "Money calculations and change",
      subElementDescription:
        "Add, subtract and reason with money totals, costs and change.",
      title: "Add money amounts",
      prompt: "A snack costs $2.35 and a drink costs $1.40. What is the total cost?",
      difficulty: "developing",
      answerType: "numeric",
      format: "money_total",
      expectedAnswer: "3.75",
      acceptableAnswers: ["3.75", "$3.75"],
      markingGuide:
        "Award full credit for $3.75.",
      workedSolution:
        "$2.35 + $1.40 = $3.75. Add dollars with dollars and cents with cents.",
      misconceptionTargets: [
        "money-addition-regrouping-error",
        "money-decimal-place-value-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-money-totals-and-change",
        ifCorrectGoToStepKey: "calculate-money-totals-and-change",
        practiceRecommendation:
          "Practise adding dollars and cents with aligned decimal places.",
        diagnosticNote:
          "This item checks whether the learner can add money amounts accurately in a simple context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a shop context card with the two item prices and total cost.",
      },
    },
    {
      id: "money-practical-contexts-change-gap-005",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-money-totals-and-change",
      subElementKey: "money-calculations-and-change",
      subElementTitle: "Money calculations and change",
      subElementDescription:
        "Add, subtract and reason with money totals, costs and change.",
      title: "Calculate change",
      prompt: "Complete the change calculation.",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "change_calculation",
      gapText: "A book costs $6.75. Paid with $10. Change = $__.",
      gapAnswer: "3.25",
      gapAcceptableAnswers: ["3.25", "$3.25"],
      expectedAnswer: "$3.25",
      acceptableAnswers: ["3.25", "$3.25"],
      markingGuide:
        "Award full credit for $3.25.",
      workedSolution:
        "Find the difference from $6.75 to $10.00. $6.75 + $3.25 = $10.00, so the change is $3.25.",
      misconceptionTargets: [
        "change-as-subtraction-error",
        "money-decimal-place-value-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-money-totals-and-change",
        ifCorrectGoToStepKey: "solve-practical-measurement-and-time-contexts",
        practiceRecommendation:
          "Practise finding change by counting on to the amount paid.",
        diagnosticNote:
          "This item checks whether the learner can interpret change as the difference between cost and amount paid.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line from $6.75 to $10.00.",
      },
    },
    {
      id: "money-practical-contexts-correct-working-006",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-money-totals-and-change",
      subElementKey: "money-calculations-and-change",
      subElementTitle: "Money calculations and change",
      subElementDescription:
        "Add, subtract and reason with money totals, costs and change.",
      title: "Select correct money working",
      prompt:
        "Which working correctly finds the total for $4.80 + $2.65?",
      difficulty: "developing",
      answerType: "select_correct_working",
      format: "money_working",
      structuredOptions: [
        {
          id: "aligned-decimals",
          label: "$4.80 + $2.65 = $7.45 because 80 cents + 65 cents = 145 cents.",
        },
        {
          id: "ignore-zero",
          label: "$4.80 + $2.65 = $6.145 because 80 + 65 is written after the decimal point.",
        },
        {
          id: "add-dollars-only",
          label: "$4.80 + $2.65 = $6.00 because 4 + 2 = 6.",
        },
        {
          id: "subtract-cents",
          label: "$4.80 + $2.65 = $6.15 because 80 - 65 = 15.",
        },
      ],
      correctWorkingOptionId: "aligned-decimals",
      expectedAnswer: "$7.45",
      acceptableAnswers: ["$7.45", "7.45"],
      markingGuide:
        "Award full credit for selecting the aligned decimal working.",
      workedSolution:
        "80 cents + 65 cents = 145 cents, which is $1.45. Add this to 4 + 2 dollars to get $7.45.",
      misconceptionTargets: [
        "money-addition-regrouping-error",
        "money-decimal-place-value-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-money-totals-and-change",
        ifCorrectGoToStepKey: "solve-practical-measurement-and-time-contexts",
        practiceRecommendation:
          "Practise lining up decimal points and regrouping cents into dollars.",
        diagnosticNote:
          "This item checks whether the learner recognises correct working when cents regroup past 100.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a dollars-and-cents table with decimal points aligned.",
      },
    },
    {
      id: "money-practical-contexts-measurement-007",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-practical-measurement-and-time-contexts",
      subElementKey: "practical-measurement-and-time-contexts",
      subElementTitle: "Practical measurement and time contexts",
      subElementDescription:
        "Use number operations in practical measurement, time and everyday contexts.",
      title: "Solve a measurement context",
      prompt:
        "A ribbon is 2 m long. Mia uses 75 cm. How many centimetres are left?",
      difficulty: "developing",
      answerType: "numeric",
      format: "measurement_context",
      expectedAnswer: "125",
      acceptableAnswers: ["125", "125 cm"],
      markingGuide:
        "Award full credit for 125 cm.",
      workedSolution:
        "2 m is 200 cm. 200 cm - 75 cm = 125 cm.",
      misconceptionTargets: [
        "measurement-unit-confusion",
        "operation-choice-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-practical-measurement-and-time-contexts",
        ifCorrectGoToStepKey: "solve-practical-measurement-and-time-contexts",
        practiceRecommendation:
          "Practise converting practical units before calculating.",
        diagnosticNote:
          "This item checks whether the learner converts metres to centimetres before subtracting.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a ribbon context card showing 200 cm total and 75 cm used.",
      },
    },
    {
      id: "money-practical-contexts-time-008",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-practical-measurement-and-time-contexts",
      subElementKey: "practical-measurement-and-time-contexts",
      subElementTitle: "Practical measurement and time contexts",
      subElementDescription:
        "Use number operations in practical measurement, time and everyday contexts.",
      title: "Find elapsed time",
      prompt:
        "A lesson starts at 9:35 and ends at 10:20. How many minutes long is the lesson?",
      difficulty: "secure",
      answerType: "short_symbolic",
      format: "elapsed_time_context",
      expectedAnswer: "45 minutes",
      acceptableAnswers: ["45", "45 minutes", "45 min"],
      markingGuide:
        "Award full credit for 45 minutes.",
      workedSolution:
        "From 9:35 to 10:00 is 25 minutes. From 10:00 to 10:20 is 20 minutes. Total = 45 minutes.",
      misconceptionTargets: [
        "elapsed-time-counting-error",
        "operation-choice-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-practical-measurement-and-time-contexts",
        ifCorrectGoToStepKey: "estimate-budget-and-check-reasonableness",
        practiceRecommendation:
          "Practise counting time through the next hour using an open number line.",
        diagnosticNote:
          "This item checks whether the learner can calculate elapsed time across an hour boundary.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open time number line from 9:35 to 10:20 through 10:00.",
      },
    },
    {
      id: "money-practical-contexts-operation-classification-009",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-practical-measurement-and-time-contexts",
      subElementKey: "practical-measurement-and-time-contexts",
      subElementTitle: "Practical measurement and time contexts",
      subElementDescription:
        "Use number operations in practical measurement, time and everyday contexts.",
      title: "Classify practical contexts",
      prompt: "Classify each context by the operation idea it needs.",
      difficulty: "secure",
      answerType: "classification",
      format: "context_operation_choice",
      classificationCategories: [
        { id: "add-total", label: "Add to find a total" },
        { id: "subtract-left", label: "Subtract to find what is left" },
        { id: "find-difference", label: "Find a difference" },
      ],
      classificationItems: [
        {
          id: "two-prices",
          label: "A pencil costs $1.20 and an eraser costs $0.80. How much altogether?",
          correctCategoryId: "add-total",
        },
        {
          id: "water-left",
          label: "A bottle has 750 mL and 280 mL is used. How much is left?",
          correctCategoryId: "subtract-left",
        },
        {
          id: "compare-distance",
          label: "One walk is 3 km and another is 5 km. How much longer is the second walk?",
          correctCategoryId: "find-difference",
        },
      ],
      expectedAnswer:
        "Pencil and eraser = add; water left = subtract; longer walk = difference.",
      acceptableAnswers: [
        "Pencil and eraser = add; water left = subtract; longer walk = difference.",
      ],
      markingGuide:
        "Award full credit for classifying all three contexts by operation idea.",
      workedSolution:
        "Altogether means add. Left means subtract from the starting amount. Longer compares the difference.",
      misconceptionTargets: [
        "operation-choice-context-error",
        "measurement-unit-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-practical-measurement-and-time-contexts",
        ifCorrectGoToStepKey: "estimate-budget-and-check-reasonableness",
        practiceRecommendation:
          "Practise identifying whether a practical story asks for a total, leftover amount or difference.",
        diagnosticNote:
          "This item checks whether the learner can choose an operation from the structure of a practical context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use context cards for total, left-over and difference situations.",
      },
    },
    {
      id: "money-practical-contexts-budget-010",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "estimate-budget-and-check-reasonableness",
      subElementKey: "estimation-budgeting-and-reasonableness",
      subElementTitle: "Estimation, budgeting and reasonableness",
      subElementDescription:
        "Estimate, compare with budgets and check whether practical answers are reasonable.",
      title: "Classify budget choices",
      prompt: "A learner has $10. Classify each purchase as within budget or over budget.",
      difficulty: "secure",
      answerType: "classification",
      format: "budget_classification",
      classificationCategories: [
        { id: "within-budget", label: "Within $10 budget" },
        { id: "over-budget", label: "Over $10 budget" },
      ],
      classificationItems: [
        { id: "notebook-pen", label: "$6.50 + $2.25", correctCategoryId: "within-budget" },
        { id: "markers-paper", label: "$7.80 + $3.10", correctCategoryId: "over-budget" },
        { id: "folder-stickers", label: "$4.95 + $4.90", correctCategoryId: "within-budget" },
      ],
      expectedAnswer:
        "$6.50 + $2.25 and $4.95 + $4.90 are within budget; $7.80 + $3.10 is over budget.",
      acceptableAnswers: [
        "$6.50 + $2.25 and $4.95 + $4.90 are within budget; $7.80 + $3.10 is over budget.",
      ],
      markingGuide:
        "Award full credit for classifying all three purchases against the $10 budget.",
      workedSolution:
        "$6.50 + $2.25 = $8.75. $7.80 + $3.10 = $10.90. $4.95 + $4.90 = $9.85.",
      misconceptionTargets: [
        "budget-constraint-error",
        "money-addition-regrouping-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "estimate-budget-and-check-reasonableness",
        ifCorrectGoToStepKey: "estimate-budget-and-check-reasonableness",
        practiceRecommendation:
          "Practise adding likely purchases and comparing the total with a budget.",
        diagnosticNote:
          "This item checks whether the learner can use money calculations to make budget decisions.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a budget table listing item totals and the $10 limit.",
      },
    },
    {
      id: "money-practical-contexts-reasonableness-011",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "estimate-budget-and-check-reasonableness",
      subElementKey: "estimation-budgeting-and-reasonableness",
      subElementTitle: "Estimation, budgeting and reasonableness",
      subElementDescription:
        "Estimate, compare with budgets and check whether practical answers are reasonable.",
      title: "Check whether an answer is reasonable",
      prompt:
        "A learner says $4.95 + $3.20 = $18.15. Which explanation best checks the answer?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "estimate_reasonableness",
      structuredOptions: [
        {
          id: "estimate-eight",
          label: "$4.95 is about $5 and $3.20 is about $3, so the total should be about $8, not $18.15.",
        },
        {
          id: "more-digits",
          label: "$18.15 is reasonable because it has more digits than the addends.",
        },
        {
          id: "dollars-only",
          label: "Only add the dollars, so any answer over $7 is reasonable.",
        },
        {
          id: "ignore-estimate",
          label: "Estimation cannot help with money.",
        },
      ],
      bestExplanationOptionId: "estimate-eight",
      expectedAnswer:
        "$4.95 is about $5 and $3.20 is about $3, so the total should be about $8, not $18.15.",
      acceptableAnswers: [
        "$4.95 is about $5 and $3.20 is about $3, so the total should be about $8, not $18.15.",
      ],
      markingGuide:
        "Award full credit for using an estimate near $8 to reject $18.15.",
      workedSolution:
        "Round $4.95 to about $5 and $3.20 to about $3. The total should be about $8. The exact total is $8.15.",
      misconceptionTargets: [
        "estimation-reasonableness-gap",
        "rounding-money-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "estimate-budget-and-check-reasonableness",
        ifCorrectGoToStepKey: "estimate-budget-and-check-reasonableness",
        practiceRecommendation:
          "Practise estimating money totals before accepting an exact answer.",
        diagnosticNote:
          "This item checks whether the learner can use estimation to detect an unreasonable money answer.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use money benchmarks near $5, $3 and $8 on a number line.",
      },
    },
    {
      id: "money-practical-contexts-misconception-012",
      progressionBandKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "estimate-budget-and-check-reasonableness",
      subElementKey: "estimation-budgeting-and-reasonableness",
      subElementTitle: "Estimation, budgeting and reasonableness",
      subElementDescription:
        "Estimate, compare with budgets and check whether practical answers are reasonable.",
      title: "Correct a practical money misconception",
      prompt:
        "True or false: $3.5 is the same as $3.05 because both have 3 dollars and a 5. If false, choose the correction.",
      difficulty: "extension",
      answerType: "true_false_correction",
      format: "money_misconception_explanation",
      trueFalseStatement:
        "$3.5 is the same as $3.05 because both have 3 dollars and a 5.",
      correctBoolean: false,
      correctionOptions: [
        "$3.5 means $3.50, which is greater than $3.05.",
        "$3.05 means $3.50, so they are equal.",
        "$3.5 is less than $3.05 because it has fewer digits.",
      ],
      correctCorrection: "$3.5 means $3.50, which is greater than $3.05.",
      expectedAnswer: "$3.5 means $3.50",
      acceptableAnswers: ["$3.5 means $3.50", "$3.50 is greater than $3.05"],
      markingGuide:
        "Award full credit for identifying the statement as false and explaining that $3.5 means $3.50.",
      workedSolution:
        "Money has two cents places. $3.5 is $3.50, or 350 cents. $3.05 is 305 cents, so $3.50 is greater.",
      misconceptionTargets: [
        "money-decimal-place-value-error",
        "cents-dollars-conversion-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-and-represent-money-values",
        ifCorrectGoToStepKey: "estimate-budget-and-check-reasonableness",
        practiceRecommendation:
          "Practise reading money decimals as dollars and cents with two cents places.",
        diagnosticNote:
          "This item checks whether the learner understands zeros and decimal places in money notation.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a money place-value table showing $3.50 and $3.05.",
      },
    },
  ];

export function getNumberMoneyPracticalContextsAssessmentItemById(id: string) {
  return (
    NUMBER_MONEY_PRACTICAL_CONTEXTS_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberMoneyPracticalContextsAssessmentItemsByStep(
  stepKey: NumberMoneyPracticalContextsProgressionStepKey,
) {
  return NUMBER_MONEY_PRACTICAL_CONTEXTS_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberMoneyPracticalContextsAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_MONEY_PRACTICAL_CONTEXTS_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberMoneyPracticalContextsAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_MONEY_PRACTICAL_CONTEXTS_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
