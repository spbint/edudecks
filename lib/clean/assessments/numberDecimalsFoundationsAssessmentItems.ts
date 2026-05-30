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

export type NumberDecimalsFoundationsProgressionBandKey =
  "decimals-foundations";

export type NumberDecimalsFoundationsProgressionStepKey =
  | "read-write-and-partition-decimals"
  | "connect-fractions-and-decimals"
  | "compare-order-and-round-decimals"
  | "use-decimals-in-money-and-measurement-contexts";

export type NumberDecimalsFoundationsAssessmentFormat =
  | "decimal_digit_value"
  | "tenths_hundredths_reading"
  | "decimal_partitioning"
  | "fraction_decimal_matching"
  | "fraction_decimal_missing_equivalence"
  | "equivalent_decimal_representations"
  | "decimal_comparison"
  | "decimal_ordering_number_line"
  | "decimal_rounding"
  | "decimal_comparison_working"
  | "money_measurement_decimal_context"
  | "decimal_place_value_explanation";

export type NumberDecimalsFoundationsMisconceptionCode =
  | "decimal-place-value-error"
  | "tenths-hundredths-confusion"
  | "decimal-as-whole-number-thinking"
  | "decimal-zero-placeholder-error"
  | "fraction-decimal-equivalence-error"
  | "decimal-comparison-length-error"
  | "decimal-number-line-placement-error"
  | "decimal-rounding-error"
  | "money-decimal-context-error"
  | "measurement-decimal-context-error"
  | "decimal-partitioning-error"
  | "decimal-benchmark-confusion";

export type NumberDecimalsFoundationsAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberDecimalsFoundationsProgressionStepKey;
  ifCorrectGoToStepKey?: NumberDecimalsFoundationsProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberDecimalsFoundationsAssessmentItem = {
  id: string;
  progressionBandKey: NumberDecimalsFoundationsProgressionBandKey;
  progressionStepKey: NumberDecimalsFoundationsProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberDecimalsFoundationsAssessmentFormat;
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
  misconceptionTargets: NumberDecimalsFoundationsMisconceptionCode[];
  adaptiveRoute: NumberDecimalsFoundationsAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_DECIMALS_FOUNDATIONS_ITEM_BANK_KEY =
  "number-decimals-foundations-assessment-items-v1";

export const NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY: NumberDecimalsFoundationsProgressionBandKey =
  "decimals-foundations";

export const NUMBER_DECIMALS_FOUNDATIONS_ASSESSMENT_ITEMS: NumberDecimalsFoundationsAssessmentItem[] =
  [
    {
      id: "decimals-foundations-digit-value-001",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-write-and-partition-decimals",
      subElementKey: "decimal-place-value",
      subElementTitle: "Decimal place value",
      subElementDescription:
        "Read, write, partition and rename decimals using tenths and hundredths.",
      title: "Identify a decimal digit value",
      prompt: "In 3.47, what is the value of the digit 4?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "decimal_digit_value",
      options: ["4", "4 tenths", "4 hundredths", "40"],
      expectedAnswer: "4 tenths",
      acceptableAnswers: ["4 tenths", "0.4"],
      markingGuide:
        "Award full credit for 4 tenths or 0.4. The 4 is immediately after the decimal point.",
      workedSolution:
        "In 3.47, the 4 is in the tenths place, so its value is 4 tenths or 0.4.",
      misconceptionTargets: [
        "decimal-place-value-error",
        "tenths-hundredths-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-write-and-partition-decimals",
        ifCorrectGoToStepKey: "connect-fractions-and-decimals",
        practiceRecommendation:
          "Practise reading tenths and hundredths in a place-value chart.",
        diagnosticNote:
          "This item checks whether the learner reads decimal digits by place value rather than as whole-number digits.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a decimal place-value chart showing ones, tenths and hundredths.",
      },
    },
    {
      id: "decimals-foundations-tenths-hundredths-002",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-write-and-partition-decimals",
      subElementKey: "decimal-place-value",
      subElementTitle: "Decimal place value",
      subElementDescription:
        "Read, write, partition and rename decimals using tenths and hundredths.",
      title: "Read tenths and hundredths",
      prompt:
        "Classify each decimal by the place value used by the final digit.",
      difficulty: "foundation",
      answerType: "classification",
      format: "tenths_hundredths_reading",
      classificationCategories: [
        { id: "tenths", label: "Final digit is tenths" },
        { id: "hundredths", label: "Final digit is hundredths" },
      ],
      classificationItems: [
        { id: "zero-point-six", label: "0.6", correctCategoryId: "tenths" },
        { id: "zero-point-zero-six", label: "0.06", correctCategoryId: "hundredths" },
        { id: "two-point-three-five", label: "2.35", correctCategoryId: "hundredths" },
      ],
      expectedAnswer:
        "0.6 ends in tenths; 0.06 ends in hundredths; 2.35 ends in hundredths",
      acceptableAnswers: [
        "0.6 ends in tenths; 0.06 ends in hundredths; 2.35 ends in hundredths",
      ],
      markingGuide:
        "Award full credit for classifying all three decimals by the place value of their final digit.",
      workedSolution:
        "The first digit after the decimal point is tenths. The second digit is hundredths, so 0.06 and 2.35 both end in the hundredths place.",
      misconceptionTargets: [
        "tenths-hundredths-confusion",
        "decimal-zero-placeholder-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-write-and-partition-decimals",
        ifCorrectGoToStepKey: "connect-fractions-and-decimals",
        practiceRecommendation:
          "Practise naming each decimal place and explaining what zero placeholders mean.",
        diagnosticNote:
          "This item checks whether the learner distinguishes tenths from hundredths.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a decimal place-value chart with examples in the tenths and hundredths columns.",
      },
    },
    {
      id: "decimals-foundations-partition-003",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-write-and-partition-decimals",
      subElementKey: "decimal-place-value",
      subElementTitle: "Decimal place value",
      subElementDescription:
        "Read, write, partition and rename decimals using tenths and hundredths.",
      title: "Partition a decimal",
      prompt: "Complete the partition: 5.28 = 5 + __ + 0.08.",
      difficulty: "foundation",
      answerType: "fill_gap",
      format: "decimal_partitioning",
      gapText: "5.28 = 5 + __ + 0.08",
      gapAnswer: "0.2",
      gapAcceptableAnswers: ["0.2", "0.20", "2 tenths"],
      expectedAnswer: "0.2",
      acceptableAnswers: ["0.2", "0.20", "2 tenths"],
      markingGuide:
        "Award full credit for 0.2, 0.20 or 2 tenths.",
      workedSolution:
        "5.28 has 5 ones, 2 tenths and 8 hundredths. So 5.28 = 5 + 0.2 + 0.08.",
      misconceptionTargets: [
        "decimal-partitioning-error",
        "tenths-hundredths-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-write-and-partition-decimals",
        ifCorrectGoToStepKey: "connect-fractions-and-decimals",
        practiceRecommendation:
          "Practise partitioning decimals into ones, tenths and hundredths.",
        diagnosticNote:
          "This item checks whether the learner can split a decimal into place-value parts.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a decimal place-value table and expanded-form row.",
      },
    },
    {
      id: "decimals-foundations-fraction-decimal-match-004",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-fractions-and-decimals",
      subElementKey: "fraction-decimal-connections",
      subElementTitle: "Fraction and decimal connections",
      subElementDescription:
        "Connect common fractions with decimal representations.",
      title: "Match common fractions and decimals",
      prompt: "Match each fraction to its decimal.",
      difficulty: "developing",
      answerType: "matching",
      format: "fraction_decimal_matching",
      matchingPairs: [
        { prompt: "1/2", correctMatch: "0.5" },
        { prompt: "1/4", correctMatch: "0.25" },
        { prompt: "3/4", correctMatch: "0.75" },
      ],
      expectedAnswer: "1/2 = 0.5; 1/4 = 0.25; 3/4 = 0.75",
      acceptableAnswers: ["1/2 = 0.5; 1/4 = 0.25; 3/4 = 0.75"],
      markingGuide:
        "Award full credit for all three fraction-decimal matches.",
      workedSolution:
        "One half is 0.5, one quarter is 0.25, and three quarters is 0.75.",
      misconceptionTargets: [
        "fraction-decimal-equivalence-error",
        "decimal-benchmark-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-fractions-and-decimals",
        ifCorrectGoToStepKey: "compare-order-and-round-decimals",
        practiceRecommendation:
          "Practise matching common fractions to tenths and hundredths grids.",
        diagnosticNote:
          "This item checks whether the learner knows common fraction-decimal benchmark pairs.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a fraction-decimal matching table with halves and quarters.",
      },
    },
    {
      id: "decimals-foundations-equivalence-gap-005",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-fractions-and-decimals",
      subElementKey: "fraction-decimal-connections",
      subElementTitle: "Fraction and decimal connections",
      subElementDescription:
        "Connect common fractions with decimal representations.",
      title: "Complete a fraction-decimal equivalence",
      prompt: "Complete the missing decimal: 4/10 = __.",
      difficulty: "developing",
      answerType: "short_symbolic",
      format: "fraction_decimal_missing_equivalence",
      expectedAnswer: "0.4",
      acceptableAnswers: ["0.4", "0.40"],
      markingGuide:
        "Award full credit for 0.4 or 0.40.",
      workedSolution:
        "4/10 means 4 tenths, which is written as 0.4. It can also be written as 0.40.",
      misconceptionTargets: [
        "fraction-decimal-equivalence-error",
        "decimal-zero-placeholder-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-fractions-and-decimals",
        ifCorrectGoToStepKey: "compare-order-and-round-decimals",
        practiceRecommendation:
          "Practise writing tenths as fractions and decimals side by side.",
        diagnosticNote:
          "This item checks whether the learner connects tenths fractions to decimal notation.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a tenths grid or table showing 4/10 and 0.4.",
      },
    },
    {
      id: "decimals-foundations-equivalent-select-006",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-fractions-and-decimals",
      subElementKey: "fraction-decimal-connections",
      subElementTitle: "Fraction and decimal connections",
      subElementDescription:
        "Connect common fractions with decimal representations.",
      title: "Select equivalent decimal representations",
      prompt: "Select every representation equal to 1/2.",
      difficulty: "developing",
      answerType: "multi_select",
      format: "equivalent_decimal_representations",
      structuredOptions: [
        { id: "zero-point-five", label: "0.5" },
        { id: "zero-point-fifty", label: "0.50" },
        { id: "fifty-cents", label: "$0.50" },
        { id: "zero-point-zero-five", label: "0.05" },
        { id: "five-hundredths", label: "5/100" },
      ],
      correctOptionIds: [
        "zero-point-five",
        "zero-point-fifty",
        "fifty-cents",
      ],
      expectedAnswer: "0.5, 0.50 and $0.50",
      acceptableAnswers: ["0.5, 0.50 and $0.50", "0.5, 0.50, $0.50"],
      markingGuide:
        "Award full credit for selecting only 0.5, 0.50 and $0.50.",
      workedSolution:
        "One half is 0.5, which is the same value as 0.50. In money, $0.50 is fifty cents, or half a dollar.",
      misconceptionTargets: [
        "fraction-decimal-equivalence-error",
        "decimal-zero-placeholder-error",
        "money-decimal-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-fractions-and-decimals",
        ifCorrectGoToStepKey: "compare-order-and-round-decimals",
        practiceRecommendation:
          "Practise comparing equivalent tenths, hundredths and money amounts.",
        diagnosticNote:
          "This item checks whether the learner recognises equivalent decimal and money forms of one half.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a table comparing 1/2, 0.5, 0.50 and $0.50.",
      },
    },
    {
      id: "decimals-foundations-comparison-correction-007",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-order-and-round-decimals",
      subElementKey: "comparing-ordering-and-rounding-decimals",
      subElementTitle: "Comparing, ordering and rounding decimals",
      subElementDescription:
        "Compare, order and round decimals using place-value reasoning.",
      title: "Correct a decimal comparison",
      prompt:
        "True or false: 0.40 is bigger than 0.4 because it has more digits. If false, choose the correction.",
      difficulty: "developing",
      answerType: "true_false_correction",
      format: "decimal_comparison",
      trueFalseStatement:
        "0.40 is bigger than 0.4 because it has more digits.",
      correctBoolean: false,
      correctionOptions: [
        "0.40 and 0.4 are equal because 0.4 means 4 tenths and 0.40 means 40 hundredths.",
        "0.40 is greater because two decimal places always make a bigger number.",
        "0.4 is greater because shorter decimals are always larger.",
      ],
      correctCorrection:
        "0.40 and 0.4 are equal because 0.4 means 4 tenths and 0.40 means 40 hundredths.",
      expectedAnswer: "0.40 and 0.4 are equal",
      acceptableAnswers: ["0.40 and 0.4 are equal", "equal", "0.40 = 0.4"],
      markingGuide:
        "Award full credit for identifying the statement as false and choosing the correction that trailing zeroes do not change the value.",
      workedSolution:
        "0.4 is 4 tenths. 0.40 is 40 hundredths, which is also 4 tenths. They are equal.",
      misconceptionTargets: [
        "decimal-zero-placeholder-error",
        "decimal-comparison-length-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-order-and-round-decimals",
        ifCorrectGoToStepKey: "use-decimals-in-money-and-measurement-contexts",
        practiceRecommendation:
          "Practise adding zero placeholders to compare decimals without changing their value.",
        diagnosticNote:
          "This item checks whether the learner understands that trailing zeroes can preserve decimal value.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a tenths and hundredths place-value chart to compare 0.4 and 0.40.",
      },
    },
    {
      id: "decimals-foundations-ordering-number-line-008",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-order-and-round-decimals",
      subElementKey: "comparing-ordering-and-rounding-decimals",
      subElementTitle: "Comparing, ordering and rounding decimals",
      subElementDescription:
        "Compare, order and round decimals using place-value reasoning.",
      title: "Order decimals on a number line",
      prompt: "Order these decimals from smallest to largest.",
      difficulty: "secure",
      answerType: "ordering",
      format: "decimal_ordering_number_line",
      orderingItems: ["0.7", "0.07", "0.75", "0.5"],
      correctOrder: ["0.07", "0.5", "0.7", "0.75"],
      expectedAnswer: "0.07, 0.5, 0.7, 0.75",
      acceptableAnswers: ["0.07, 0.5, 0.7, 0.75", "0.07 0.5 0.7 0.75"],
      markingGuide:
        "Award full credit for ordering all four decimals correctly.",
      workedSolution:
        "Use place value or a 0 to 1 number line: 0.07 is near 0, 0.5 is one half, 0.7 is 7 tenths, and 0.75 is greater than 0.7.",
      misconceptionTargets: [
        "decimal-number-line-placement-error",
        "decimal-comparison-length-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-order-and-round-decimals",
        ifCorrectGoToStepKey: "use-decimals-in-money-and-measurement-contexts",
        practiceRecommendation:
          "Practise placing decimals between 0 and 1 using tenths and hundredths benchmarks.",
        diagnosticNote:
          "This item checks whether the learner can order decimals with different numbers of decimal places.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a 0 to 1 number line with benchmarks at 0.5, 0.7 and 0.75.",
      },
    },
    {
      id: "decimals-foundations-rounding-009",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-order-and-round-decimals",
      subElementKey: "comparing-ordering-and-rounding-decimals",
      subElementTitle: "Comparing, ordering and rounding decimals",
      subElementDescription:
        "Compare, order and round decimals using place-value reasoning.",
      title: "Round a decimal to the nearest tenth",
      prompt: "Round 4.68 to the nearest tenth.",
      difficulty: "secure",
      answerType: "numeric",
      format: "decimal_rounding",
      expectedAnswer: "4.7",
      acceptableAnswers: ["4.7", "4.70"],
      markingGuide:
        "Award full credit for 4.7 or 4.70.",
      workedSolution:
        "To round to the nearest tenth, look at the hundredths digit. In 4.68, the hundredths digit is 8, so 4.6 rounds up to 4.7.",
      misconceptionTargets: [
        "decimal-rounding-error",
        "tenths-hundredths-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-order-and-round-decimals",
        ifCorrectGoToStepKey: "use-decimals-in-money-and-measurement-contexts",
        practiceRecommendation:
          "Practise identifying the rounding place and the digit immediately to its right.",
        diagnosticNote:
          "This item checks whether the learner rounds decimals using the correct place.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Show 4.68 between 4.6 and 4.7 on a number line.",
      },
    },
    {
      id: "decimals-foundations-comparison-working-010",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-decimals-in-money-and-measurement-contexts",
      subElementKey: "decimal-problem-solving-foundations",
      subElementTitle: "Decimal problem-solving foundations",
      subElementDescription:
        "Use decimals in simple money, measurement and everyday contexts.",
      title: "Select correct decimal comparison working",
      prompt: "Which working correctly compares 0.6 and 0.45?",
      difficulty: "secure",
      answerType: "select_correct_working",
      format: "decimal_comparison_working",
      structuredOptions: [
        {
          id: "write-zero-placeholder",
          label: "Write 0.6 as 0.60, then compare 60 hundredths with 45 hundredths. So 0.6 > 0.45.",
        },
        {
          id: "compare-whole-digits",
          label: "0.6 is smaller because 6 is smaller than 45.",
        },
        {
          id: "longer-is-greater",
          label: "0.45 is greater because it has more decimal digits.",
        },
        {
          id: "ignore-decimal-point",
          label: "0.6 and 0.45 are equal because they both start with 0.",
        },
      ],
      correctWorkingOptionId: "write-zero-placeholder",
      expectedAnswer: "0.6 > 0.45",
      acceptableAnswers: ["0.6 > 0.45", "0.60 > 0.45"],
      markingGuide:
        "Award full credit for selecting the working that writes 0.6 as 0.60 and compares hundredths.",
      workedSolution:
        "0.6 is 6 tenths, which is 60 hundredths. Since 60 hundredths is more than 45 hundredths, 0.6 is greater.",
      misconceptionTargets: [
        "decimal-comparison-length-error",
        "decimal-as-whole-number-thinking",
        "decimal-zero-placeholder-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-order-and-round-decimals",
        ifCorrectGoToStepKey: "use-decimals-in-money-and-measurement-contexts",
        practiceRecommendation:
          "Practise using zero placeholders to compare decimals with different lengths.",
        diagnosticNote:
          "This item checks whether the learner can choose valid decimal comparison working.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a tenths and hundredths table comparing 0.60 and 0.45.",
      },
    },
    {
      id: "decimals-foundations-money-measurement-011",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-decimals-in-money-and-measurement-contexts",
      subElementKey: "decimal-problem-solving-foundations",
      subElementTitle: "Decimal problem-solving foundations",
      subElementDescription:
        "Use decimals in simple money, measurement and everyday contexts.",
      title: "Solve a money decimal problem",
      prompt:
        "A pencil costs $1.35 and an eraser costs $0.40. What is the total cost?",
      difficulty: "extension",
      answerType: "numeric",
      format: "money_measurement_decimal_context",
      expectedAnswer: "1.75",
      acceptableAnswers: ["1.75", "$1.75"],
      markingGuide:
        "Award full credit for 1.75 or $1.75.",
      workedSolution:
        "Add the money amounts: $1.35 + $0.40 = $1.75.",
      misconceptionTargets: [
        "money-decimal-context-error",
        "decimal-place-value-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-decimals-in-money-and-measurement-contexts",
        ifCorrectGoToStepKey: "connect-fractions-and-decimals",
        practiceRecommendation:
          "Practise lining up dollars and cents when adding money amounts.",
        diagnosticNote:
          "This item checks whether the learner can use decimals in a simple money context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a money context card showing $1.35 and $0.40 added together.",
      },
    },
    {
      id: "decimals-foundations-best-explanation-012",
      progressionBandKey: NUMBER_DECIMALS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-decimals-in-money-and-measurement-contexts",
      subElementKey: "decimal-problem-solving-foundations",
      subElementTitle: "Decimal problem-solving foundations",
      subElementDescription:
        "Use decimals in simple money, measurement and everyday contexts.",
      title: "Explain a decimal place-value misconception",
      prompt:
        "A learner says 2.08 is the same as 2.8 because both use the digits 2 and 8. Which explanation is best?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "decimal_place_value_explanation",
      structuredOptions: [
        {
          id: "zero-placeholder-matters",
          label: "2.08 has 8 hundredths, while 2.8 has 8 tenths. The zero placeholder changes the place of the 8.",
        },
        {
          id: "same-digits-equal",
          label: "They are equal because the same digits appear in both numbers.",
        },
        {
          id: "shorter-is-smaller",
          label: "2.8 is smaller because it has fewer decimal places.",
        },
        {
          id: "decimal-point-ignored",
          label: "The decimal point does not affect the value of the digits.",
        },
      ],
      bestExplanationOptionId: "zero-placeholder-matters",
      expectedAnswer:
        "2.08 has 8 hundredths, while 2.8 has 8 tenths. The zero placeholder changes the place of the 8.",
      acceptableAnswers: [
        "2.08 has 8 hundredths, while 2.8 has 8 tenths. The zero placeholder changes the place of the 8.",
      ],
      markingGuide:
        "Award full credit for choosing the explanation that distinguishes 8 hundredths from 8 tenths.",
      workedSolution:
        "In 2.08, the 8 is in the hundredths place. In 2.8, the 8 is in the tenths place. Since tenths are larger than hundredths, the numbers are not equal.",
      misconceptionTargets: [
        "decimal-zero-placeholder-error",
        "decimal-place-value-error",
        "decimal-as-whole-number-thinking",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-write-and-partition-decimals",
        ifCorrectGoToStepKey: "use-decimals-in-money-and-measurement-contexts",
        practiceRecommendation:
          "Practise reading decimals aloud as tenths and hundredths, especially when zero placeholders appear.",
        diagnosticNote:
          "This item checks whether the learner understands that zero placeholders affect decimal place value.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a place-value chart comparing 2.08 and 2.8.",
      },
    },
  ];

export function getNumberDecimalsFoundationsAssessmentItemById(id: string) {
  return (
    NUMBER_DECIMALS_FOUNDATIONS_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberDecimalsFoundationsAssessmentItemsByStep(
  stepKey: NumberDecimalsFoundationsProgressionStepKey,
) {
  return NUMBER_DECIMALS_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberDecimalsFoundationsAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_DECIMALS_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberDecimalsFoundationsAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_DECIMALS_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
