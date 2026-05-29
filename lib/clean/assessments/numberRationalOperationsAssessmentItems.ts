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

export type NumberRationalOperationsProgressionBandKey = Extract<
  NumberProgressionBandKey,
  "rational-numbers-and-operations"
>;

export type NumberRationalOperationsProgressionStepKey =
  | "compare-and-order-fractions"
  | "represent-fractions-on-number-lines"
  | "simplify-equivalent-fractions"
  | "add-and-subtract-fractions"
  | "operate-with-positive-rational-numbers"
  | "operate-with-integers"
  | "multiply-and-divide-decimals-by-powers-of-ten";

export type NumberRationalOperationsAssessmentFormat =
  | "equivalent_representations"
  | "fraction_operations"
  | "decimal_operations"
  | "rational_comparison"
  | "negative_rationals"
  | "applied_context";

export type NumberRationalOperationsMisconceptionCode =
  | "fraction-decimal-percent-equivalence-error"
  | "denominator-addition-error"
  | "common-denominator-gap"
  | "fraction-multiplication-error"
  | "fraction-division-error"
  | "decimal-place-value-error"
  | "negative-rational-ordering-error"
  | "rational-comparison-benchmark-error"
  | "operation-context-error"
  | "mixed-representation-confusion"
  | "percentage-as-whole-number-error";

export type NumberRationalOperationsAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberRationalOperationsProgressionStepKey;
  ifCorrectGoToStepKey?: NumberRationalOperationsProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberRationalOperationsAssessmentItem = {
  id: string;
  progressionBandKey: NumberRationalOperationsProgressionBandKey;
  progressionStepKey: NumberRationalOperationsProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberRationalOperationsAssessmentFormat;
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
  misconceptionTargets: NumberRationalOperationsMisconceptionCode[];
  adaptiveRoute: NumberRationalOperationsAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_RATIONAL_OPERATIONS_ITEM_BANK_KEY =
  "number-rational-operations-assessment-items-v1";

export const NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY: NumberRationalOperationsProgressionBandKey =
  "rational-numbers-and-operations";

export const NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS: NumberRationalOperationsAssessmentItem[] =
  [
    {
      id: "rational-ops-equivalent-match-001",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "simplify-equivalent-fractions",
      subElementKey: "equivalent-rational-representations",
      subElementTitle: "Equivalent rational representations",
      subElementDescription:
        "Connect fractions, decimals and percentages as equivalent rational values.",
      title: "Match equivalent rational representations",
      prompt: "Match each fraction with its equivalent decimal or percentage.",
      difficulty: "foundation",
      answerType: "matching",
      format: "equivalent_representations",
      matchingPairs: [
        { prompt: "1/2", correctMatch: "0.5 and 50%" },
        { prompt: "3/4", correctMatch: "0.75 and 75%" },
        { prompt: "1/5", correctMatch: "0.2 and 20%" },
      ],
      expectedAnswer: "1/2 = 0.5 = 50%; 3/4 = 0.75 = 75%; 1/5 = 0.2 = 20%",
      acceptableAnswers: [
        "1/2 = 0.5 = 50%; 3/4 = 0.75 = 75%; 1/5 = 0.2 = 20%",
      ],
      markingGuide:
        "Award full credit for matching each fraction with both its equivalent decimal and percentage.",
      workedSolution:
        "1/2 is 0.5 or 50%, 3/4 is 0.75 or 75%, and 1/5 is 0.2 or 20%.",
      misconceptionTargets: [
        "fraction-decimal-percent-equivalence-error",
        "percentage-as-whole-number-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "simplify-equivalent-fractions",
        ifCorrectGoToStepKey: "operate-with-positive-rational-numbers",
        practiceRecommendation:
          "Practise using benchmark fractions and per-hundred meaning to connect fractions, decimals and percentages.",
        diagnosticNote:
          "This item checks whether the learner recognises common equivalent rational representations.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use an equivalence table with fraction, decimal and percentage columns.",
      },
    },
    {
      id: "rational-ops-equivalent-select-002",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "simplify-equivalent-fractions",
      subElementKey: "equivalent-rational-representations",
      subElementTitle: "Equivalent rational representations",
      subElementDescription:
        "Connect fractions, decimals and percentages as equivalent rational values.",
      title: "Select equivalent values",
      prompt: "Select every value equivalent to 0.4.",
      difficulty: "foundation",
      answerType: "multi_select",
      format: "equivalent_representations",
      structuredOptions: [
        { id: "two-fifths", label: "2/5" },
        { id: "forty-percent", label: "40%" },
        { id: "four-hundredths", label: "4/100" },
        { id: "point-zero-four", label: "0.04" },
        { id: "four-tenths", label: "4/10" },
      ],
      correctOptionIds: ["two-fifths", "forty-percent", "four-tenths"],
      expectedAnswer: "2/5, 40%, and 4/10",
      acceptableAnswers: ["2/5, 40%, and 4/10"],
      markingGuide:
        "Award full credit for selecting 2/5, 40%, and 4/10 only.",
      workedSolution:
        "0.4 is four tenths, so it equals 4/10, 2/5, and 40%. It is not 4/100 or 0.04.",
      misconceptionTargets: [
        "fraction-decimal-percent-equivalence-error",
        "decimal-place-value-error",
        "percentage-as-whole-number-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "simplify-equivalent-fractions",
        ifCorrectGoToStepKey: "operate-with-positive-rational-numbers",
        practiceRecommendation:
          "Practise reading decimal place value before converting to fractions or percentages.",
        diagnosticNote:
          "This item checks whether the learner distinguishes tenths, hundredths and percentages when identifying equivalent values.",
      },
      visualSupport: {
        type: "table",
        description:
          "Compare each value by rewriting it as tenths, hundredths, or a percentage.",
      },
    },
    {
      id: "rational-ops-convert-gap-003",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "operate-with-positive-rational-numbers",
      subElementKey: "equivalent-rational-representations",
      subElementTitle: "Equivalent rational representations",
      subElementDescription:
        "Connect fractions, decimals and percentages as equivalent rational values.",
      title: "Complete a conversion chain",
      prompt: "Complete the missing percentage.",
      difficulty: "foundation",
      answerType: "fill_gap",
      format: "equivalent_representations",
      gapText: "3/5 = 0.6 = __%",
      gapAnswer: "60",
      gapAcceptableAnswers: ["60", "60%"],
      expectedAnswer: "60%",
      acceptableAnswers: ["60", "60%"],
      markingGuide:
        "Award full credit for 60 or 60%. 0.6 means 60 hundredths, so it is 60%.",
      workedSolution:
        "3/5 = 0.6. To convert 0.6 to a percentage, multiply by 100, giving 60%.",
      misconceptionTargets: [
        "fraction-decimal-percent-equivalence-error",
        "percentage-as-whole-number-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "operate-with-positive-rational-numbers",
        ifCorrectGoToStepKey: "compare-and-order-fractions",
        practiceRecommendation:
          "Practise converting decimals to percentages by using the per-hundred meaning.",
        diagnosticNote:
          "This item checks whether the learner can complete a fraction-decimal-percentage equivalence.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a three-column conversion table for fraction, decimal and percentage forms.",
      },
    },
    {
      id: "rational-ops-add-related-denominators-004",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "add-and-subtract-fractions",
      subElementKey: "fraction-and-decimal-operations",
      subElementTitle: "Fraction and decimal operations",
      subElementDescription:
        "Add, subtract, multiply and divide rational values accurately.",
      title: "Add fractions with related denominators",
      prompt: "Calculate 1/4 + 3/8.",
      difficulty: "developing",
      answerType: "short_symbolic",
      format: "fraction_operations",
      expectedAnswer: "5/8",
      acceptableAnswers: ["5/8"],
      markingGuide:
        "Award full credit for 5/8. Equivalent decimal 0.625 may show correct value, but the intended exact fraction is 5/8.",
      workedSolution:
        "Convert 1/4 to 2/8, then add 2/8 + 3/8 = 5/8.",
      misconceptionTargets: [
        "common-denominator-gap",
        "denominator-addition-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "add-and-subtract-fractions",
        ifCorrectGoToStepKey: "operate-with-positive-rational-numbers",
        practiceRecommendation:
          "Practise finding a common denominator before adding or subtracting fractions.",
        diagnosticNote:
          "This item checks whether the learner uses equivalent fractions instead of adding denominators.",
      },
      visualSupport: {
        type: "table",
        description:
          "Show 1/4 rewritten as 2/8 before adding eighths.",
      },
    },
    {
      id: "rational-ops-multiply-fractions-005",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "operate-with-positive-rational-numbers",
      subElementKey: "fraction-and-decimal-operations",
      subElementTitle: "Fraction and decimal operations",
      subElementDescription:
        "Add, subtract, multiply and divide rational values accurately.",
      title: "Multiply a fraction by another fraction",
      prompt: "Calculate 2/3 x 3/5.",
      difficulty: "developing",
      answerType: "short_symbolic",
      format: "fraction_operations",
      expectedAnswer: "2/5",
      acceptableAnswers: ["2/5", "6/15"],
      markingGuide:
        "Award full credit for 2/5 or unsimplified 6/15. Strongest response simplifies to 2/5.",
      workedSolution:
        "Multiply numerators and denominators: 2 x 3 over 3 x 5 = 6/15. Simplify by dividing by 3 to get 2/5.",
      misconceptionTargets: ["fraction-multiplication-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "operate-with-positive-rational-numbers",
        ifCorrectGoToStepKey: "operate-with-positive-rational-numbers",
        practiceRecommendation:
          "Practise multiplying numerators and denominators, then simplifying the result.",
        diagnosticNote:
          "This item checks whether the learner can multiply fractions and preserve equivalent value while simplifying.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "rational-ops-select-working-006",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "add-and-subtract-fractions",
      subElementKey: "fraction-and-decimal-operations",
      subElementTitle: "Fraction and decimal operations",
      subElementDescription:
        "Add, subtract, multiply and divide rational values accurately.",
      title: "Select correct fraction working",
      prompt: "Which working correctly solves 2/3 - 1/6?",
      difficulty: "developing",
      answerType: "select_correct_working",
      format: "fraction_operations",
      structuredOptions: [
        {
          id: "common-denominator",
          label: "2/3 = 4/6, so 4/6 - 1/6 = 3/6 = 1/2.",
        },
        {
          id: "subtract-denominators",
          label: "2/3 - 1/6 = 1/3 because 2 - 1 = 1 and 6 - 3 = 3.",
        },
        {
          id: "subtract-top-only",
          label: "2/3 - 1/6 = 1/6 because only the numerators change.",
        },
        {
          id: "add-denominators",
          label: "2/3 - 1/6 = 1/9 because denominators combine.",
        },
      ],
      correctWorkingOptionId: "common-denominator",
      expectedAnswer: "1/2",
      acceptableAnswers: ["1/2", "3/6"],
      markingGuide:
        "Award full credit for selecting the common-denominator working or giving 1/2.",
      workedSolution:
        "Rewrite 2/3 as 4/6. Then subtract 4/6 - 1/6 = 3/6, which simplifies to 1/2.",
      misconceptionTargets: [
        "common-denominator-gap",
        "denominator-addition-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "add-and-subtract-fractions",
        ifCorrectGoToStepKey: "operate-with-positive-rational-numbers",
        practiceRecommendation:
          "Practise rewriting fractions with a common denominator before subtracting.",
        diagnosticNote:
          "This item checks whether the learner can identify correct working and avoid denominator-operation misconceptions.",
      },
      visualSupport: {
        type: "table",
        description:
          "Compare each working path and identify where equivalent denominators are used.",
      },
    },
    {
      id: "rational-ops-compare-decimals-007",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "operate-with-positive-rational-numbers",
      subElementKey: "rational-number-comparison",
      subElementTitle: "Rational number comparison",
      subElementDescription:
        "Compare and order positive and negative rational numbers.",
      title: "Correct a decimal comparison misconception",
      prompt:
        "True or false: 0.4 is greater than 0.35 because 4 is greater than 35. If false, choose the correction.",
      difficulty: "developing",
      answerType: "true_false_correction",
      format: "rational_comparison",
      trueFalseStatement:
        "0.4 is greater than 0.35 because 4 is greater than 35.",
      correctBoolean: false,
      correctionOptions: [
        "0.4 is greater than 0.35 because 0.4 = 0.40, and 0.40 is greater than 0.35.",
        "0.35 is greater because 35 is greater than 4.",
        "They are equal because both start with 0.",
      ],
      correctCorrection:
        "0.4 is greater than 0.35 because 0.4 = 0.40, and 0.40 is greater than 0.35.",
      expectedAnswer: "0.4 is greater than 0.35",
      acceptableAnswers: ["0.4", "0.40", "0.4 is greater than 0.35"],
      markingGuide:
        "Award full credit for identifying the statement as false and choosing the correction using 0.40 > 0.35.",
      workedSolution:
        "Compare decimals using place value. 0.4 is 0.40, and 40 hundredths is greater than 35 hundredths.",
      misconceptionTargets: ["decimal-place-value-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "operate-with-positive-rational-numbers",
        ifCorrectGoToStepKey: "compare-and-order-fractions",
        practiceRecommendation:
          "Practise aligning decimal places before comparing decimal values.",
        diagnosticNote:
          "This item checks whether the learner compares decimal place value rather than whole-number digit strings.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Place 0.35 and 0.40 on a number line or compare as hundredths.",
      },
    },
    {
      id: "rational-ops-order-negatives-008",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "operate-with-integers",
      subElementKey: "rational-number-comparison",
      subElementTitle: "Rational number comparison",
      subElementDescription:
        "Compare and order positive and negative rational numbers.",
      title: "Order positive and negative rational numbers",
      prompt: "Order these values from smallest to largest.",
      difficulty: "secure",
      answerType: "ordering",
      format: "negative_rationals",
      orderingItems: ["-1/2", "0.25", "-0.75", "1/5"],
      correctOrder: ["-0.75", "-1/2", "1/5", "0.25"],
      expectedAnswer: "-0.75, -1/2, 1/5, 0.25",
      acceptableAnswers: [
        "-0.75, -1/2, 1/5, 0.25",
        "-0.75 -1/2 1/5 0.25",
      ],
      markingGuide:
        "Award full credit for the order -0.75, -1/2, 1/5, 0.25.",
      workedSolution:
        "-1/2 = -0.5 and 1/5 = 0.2. On the number line, -0.75 is left of -0.5, and 0.2 is left of 0.25.",
      misconceptionTargets: [
        "negative-rational-ordering-error",
        "mixed-representation-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "operate-with-integers",
        ifCorrectGoToStepKey: "compare-and-order-fractions",
        practiceRecommendation:
          "Practise converting mixed rational forms to a common representation before ordering on a number line.",
        diagnosticNote:
          "This item checks whether the learner can order positive and negative rational values across representations.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a number line and convert fractions to decimals where helpful.",
      },
    },
    {
      id: "rational-ops-classify-representations-009",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-and-order-fractions",
      subElementKey: "rational-number-comparison",
      subElementTitle: "Rational number comparison",
      subElementDescription:
        "Compare and order positive and negative rational numbers.",
      title: "Classify rational values by representation",
      prompt: "Classify each value by its representation type.",
      difficulty: "secure",
      answerType: "classification",
      format: "rational_comparison",
      classificationCategories: [
        { id: "fraction", label: "Fraction" },
        { id: "decimal", label: "Decimal" },
        { id: "percentage", label: "Percentage" },
        { id: "negative-rational", label: "Negative rational" },
      ],
      classificationItems: [
        { id: "three-quarters", label: "3/4", correctCategoryId: "fraction" },
        { id: "point-six", label: "0.6", correctCategoryId: "decimal" },
        { id: "eighty-percent", label: "80%", correctCategoryId: "percentage" },
        { id: "negative-two-fifths", label: "-2/5", correctCategoryId: "negative-rational" },
      ],
      expectedAnswer: "3/4 fraction; 0.6 decimal; 80% percentage; -2/5 negative rational",
      acceptableAnswers: [
        "3/4 fraction; 0.6 decimal; 80% percentage; -2/5 negative rational",
      ],
      markingGuide:
        "Award full credit for sorting each value into the intended representation type.",
      workedSolution:
        "3/4 is written as a fraction, 0.6 as a decimal, 80% as a percentage, and -2/5 as a negative rational value.",
      misconceptionTargets: [
        "mixed-representation-confusion",
        "negative-rational-ordering-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-and-order-fractions",
        ifCorrectGoToStepKey: "operate-with-positive-rational-numbers",
        practiceRecommendation:
          "Practise naming rational-number representations before comparing or operating with them.",
        diagnosticNote:
          "This item checks whether the learner can identify representation types, including negative rational forms.",
      },
      visualSupport: {
        type: "table",
        description:
          "Sort values into representation categories before comparing their sizes.",
      },
    },
    {
      id: "rational-ops-context-division-010",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "operate-with-positive-rational-numbers",
      subElementKey: "rational-operations-in-context",
      subElementTitle: "Rational operations in context",
      subElementDescription:
        "Apply rational-number operations to measurement, money, rates or everyday contexts.",
      title: "Divide a decimal in context",
      prompt:
        "A 2.4 m ribbon is cut into 6 equal pieces. How long is each piece in metres?",
      difficulty: "secure",
      answerType: "numeric",
      format: "applied_context",
      expectedAnswer: "0.4",
      acceptableAnswers: ["0.4", "0.40"],
      markingGuide:
        "Award full credit for 0.4 m or 0.40 m.",
      workedSolution:
        "Divide the total length by the number of pieces: 2.4 / 6 = 0.4. Each piece is 0.4 m long.",
      misconceptionTargets: [
        "fraction-division-error",
        "decimal-place-value-error",
        "operation-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "operate-with-positive-rational-numbers",
        ifCorrectGoToStepKey: "multiply-and-divide-decimals-by-powers-of-ten",
        practiceRecommendation:
          "Practise identifying the operation from the context before calculating with decimal values.",
        diagnosticNote:
          "This item checks whether the learner can divide a decimal amount equally in a measurement context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Ribbon length and number of equal pieces are shown as a short context.",
      },
    },
    {
      id: "rational-ops-context-explanation-011",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "add-and-subtract-fractions",
      subElementKey: "rational-operations-in-context",
      subElementTitle: "Rational operations in context",
      subElementDescription:
        "Apply rational-number operations to measurement, money, rates or everyday contexts.",
      title: "Choose the best fraction explanation",
      prompt: "Which explanation best shows why 1/4 + 1/4 = 1/2?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "fraction_operations",
      structuredOptions: [
        {
          id: "two-quarters",
          label: "Two quarters make 2/4, and 2/4 simplifies to 1/2.",
        },
        {
          id: "add-denominators",
          label: "Add the denominators to get 2/8, which is the same as 1/2.",
        },
        {
          id: "ignore-denominator",
          label: "One plus one is two, so the answer is 2.",
        },
        {
          id: "quarter-plus-quarter",
          label: "The answer is 1/4 because the denominator stays 4.",
        },
      ],
      bestExplanationOptionId: "two-quarters",
      expectedAnswer: "Two quarters make 2/4, and 2/4 simplifies to 1/2.",
      acceptableAnswers: ["Two quarters make 2/4, and 2/4 simplifies to 1/2."],
      markingGuide:
        "Award full credit for the explanation that two quarters make 2/4 and 2/4 simplifies to 1/2.",
      workedSolution:
        "The denominators are already the same, so add the numerators: 1/4 + 1/4 = 2/4. Since 2 and 4 share a factor of 2, 2/4 simplifies to 1/2.",
      misconceptionTargets: [
        "denominator-addition-error",
        "common-denominator-gap",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "add-and-subtract-fractions",
        ifCorrectGoToStepKey: "operate-with-positive-rational-numbers",
        practiceRecommendation:
          "Practise explaining fraction addition with like denominators before moving to unlike denominators.",
        diagnosticNote:
          "This item checks whether the learner understands why denominators describe the size of parts and should not be added.",
      },
      visualSupport: {
        type: "table",
        description:
          "Compare the correct explanation with common denominator-operation misconceptions.",
      },
    },
    {
      id: "rational-ops-context-money-012",
      progressionBandKey: NUMBER_RATIONAL_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "operate-with-positive-rational-numbers",
      subElementKey: "rational-operations-in-context",
      subElementTitle: "Rational operations in context",
      subElementDescription:
        "Apply rational-number operations to measurement, money, rates or everyday contexts.",
      title: "Solve a rational-operation money context",
      prompt:
        "A learner spends 3/5 of $40 on supplies. How much money is spent?",
      difficulty: "extension",
      answerType: "multiple_choice",
      format: "applied_context",
      options: ["$24", "$8", "$60", "$37"],
      expectedAnswer: "$24",
      acceptableAnswers: ["$24", "24"],
      markingGuide:
        "Award full credit for $24.",
      workedSolution:
        "Find 3/5 of 40. One fifth of 40 is 8, so three fifths is 3 x 8 = 24. The learner spends $24.",
      misconceptionTargets: [
        "operation-context-error",
        "fraction-multiplication-error",
        "percentage-as-whole-number-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "operate-with-positive-rational-numbers",
        ifCorrectGoToStepKey: "operate-with-positive-rational-numbers",
        practiceRecommendation:
          "Practise interpreting 'of' as multiplication and using unit fractions in money contexts.",
        diagnosticNote:
          "This item checks whether the learner can apply a rational operation in a short money context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Money amount and fractional part are shown as a short context card.",
      },
    },
  ];

export function getNumberRationalOperationsAssessmentItemById(id: string) {
  return (
    NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS.find((item) => item.id === id) ||
    null
  );
}

export function getNumberRationalOperationsAssessmentItemsByStep(
  stepKey: NumberRationalOperationsProgressionStepKey,
) {
  return NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberRationalOperationsAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberRationalOperationsAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_RATIONAL_OPERATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
