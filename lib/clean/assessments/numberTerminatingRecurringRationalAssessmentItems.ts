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

export type NumberTerminatingRecurringRationalProgressionBandKey = Extract<
  NumberProgressionBandKey,
  "terminating-recurring-rational-representations"
>;

export type NumberTerminatingRecurringRationalProgressionStepKey =
  | "identify-terminating-decimals-from-fractions"
  | "connect-recurring-decimals-to-fractions"
  | "represent-recurring-decimals-with-correct-notation"
  | "recognise-rational-representations-across-forms";

export type NumberTerminatingRecurringRationalAssessmentFormat =
  | "terminating_decimal_recognition"
  | "recurring_decimal_recognition"
  | "fraction_decimal_conversion"
  | "recurring_notation"
  | "decimal_classification"
  | "decimal_comparison"
  | "representation_context";

export type NumberTerminatingRecurringRationalMisconceptionCode =
  | "terminating-decimal-recognition-error"
  | "recurring-decimal-recognition-error"
  | "recurring-decimal-rational-confusion"
  | "decimal-to-fraction-conversion-error"
  | "fraction-to-decimal-conversion-error"
  | "place-value-denominator-error"
  | "repeating-block-error"
  | "rational-irrational-decimal-boundary-error"
  | "non-terminating-means-irrational-error"
  | "approximation-vs-exact-decimal-error"
  | "decimal-comparison-error"
  | "representation-context-error";

export type NumberTerminatingRecurringRationalAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberTerminatingRecurringRationalProgressionStepKey;
  ifCorrectGoToStepKey?: NumberTerminatingRecurringRationalProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberTerminatingRecurringRationalAssessmentItem = {
  id: string;
  progressionBandKey: NumberTerminatingRecurringRationalProgressionBandKey;
  progressionStepKey: NumberTerminatingRecurringRationalProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberTerminatingRecurringRationalAssessmentFormat;
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
  misconceptionTargets: NumberTerminatingRecurringRationalMisconceptionCode[];
  adaptiveRoute: NumberTerminatingRecurringRationalAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_TERMINATING_RECURRING_RATIONAL_ITEM_BANK_KEY =
  "number-terminating-recurring-rational-assessment-items-v1";

export const NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY: NumberTerminatingRecurringRationalProgressionBandKey =
  "terminating-recurring-rational-representations";

export const NUMBER_TERMINATING_RECURRING_RATIONAL_ASSESSMENT_ITEMS: NumberTerminatingRecurringRationalAssessmentItem[] =
  [
    {
      id: "term-rec-rational-terminating-select-001",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-terminating-decimals-from-fractions",
      subElementKey: "terminating-decimal-representations",
      subElementTitle: "Terminating decimal representations",
      subElementDescription:
        "Recognise and convert rational numbers with terminating decimal representations.",
      title: "Identify terminating decimals",
      prompt: "Select every decimal that terminates.",
      difficulty: "foundation",
      answerType: "multi_select",
      format: "terminating_decimal_recognition",
      structuredOptions: [
        { id: "point-seven-five", label: "0.75" },
        { id: "point-one-two-five", label: "0.125" },
        { id: "one-third-decimal", label: "0.333..." },
        { id: "point-six-recurring", label: "0.6 recurring" },
        { id: "two-point-five", label: "2.5" },
      ],
      correctOptionIds: ["point-seven-five", "point-one-two-five", "two-point-five"],
      expectedAnswer: "0.75, 0.125, and 2.5",
      acceptableAnswers: ["0.75, 0.125, and 2.5"],
      markingGuide:
        "Award full credit for selecting only decimals that stop after a finite number of decimal places.",
      workedSolution:
        "0.75, 0.125 and 2.5 terminate because their decimal digits stop. 0.333... and 0.6 recurring continue with a repeating pattern.",
      misconceptionTargets: [
        "terminating-decimal-recognition-error",
        "recurring-decimal-recognition-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-terminating-decimals-from-fractions",
        ifCorrectGoToStepKey: "connect-recurring-decimals-to-fractions",
        practiceRecommendation:
          "Practise sorting decimals by whether the digits stop or continue in a repeating pattern.",
        diagnosticNote:
          "This item checks whether the learner recognises terminating decimals by their finite decimal expansion.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a table with terminating and recurring examples side by side.",
      },
    },
    {
      id: "term-rec-rational-fraction-match-002",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-terminating-decimals-from-fractions",
      subElementKey: "terminating-decimal-representations",
      subElementTitle: "Terminating decimal representations",
      subElementDescription:
        "Recognise and convert rational numbers with terminating decimal representations.",
      title: "Match fractions to terminating decimals",
      prompt: "Match each fraction with its terminating decimal.",
      difficulty: "foundation",
      answerType: "matching",
      format: "fraction_decimal_conversion",
      matchingPairs: [
        { prompt: "1/2", correctMatch: "0.5" },
        { prompt: "3/4", correctMatch: "0.75" },
        { prompt: "7/20", correctMatch: "0.35" },
      ],
      expectedAnswer: "1/2 = 0.5; 3/4 = 0.75; 7/20 = 0.35",
      acceptableAnswers: ["1/2 = 0.5; 3/4 = 0.75; 7/20 = 0.35"],
      markingGuide:
        "Award full credit for matching all three fractions to their decimal forms.",
      workedSolution:
        "1/2 = 0.5, 3/4 = 0.75, and 7/20 = 35/100 = 0.35.",
      misconceptionTargets: [
        "fraction-to-decimal-conversion-error",
        "place-value-denominator-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-terminating-decimals-from-fractions",
        ifCorrectGoToStepKey: "recognise-rational-representations-across-forms",
        practiceRecommendation:
          "Practise converting familiar denominators such as 2, 4, 5, 10 and 20 into decimal forms.",
        diagnosticNote:
          "This item checks whether the learner can connect simple fractions to terminating decimals.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a fraction-to-decimal matching table for common terminating decimal fractions.",
      },
    },
    {
      id: "term-rec-rational-decimal-fraction-gap-003",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-rational-representations-across-forms",
      subElementKey: "terminating-decimal-representations",
      subElementTitle: "Terminating decimal representations",
      subElementDescription:
        "Recognise and convert rational numbers with terminating decimal representations.",
      title: "Convert a terminating decimal to a fraction",
      prompt: "Complete the missing numerator.",
      difficulty: "foundation",
      answerType: "fill_gap",
      format: "fraction_decimal_conversion",
      gapText: "0.125 = __/1000 = 1/8",
      gapAnswer: "125",
      gapAcceptableAnswers: ["125"],
      expectedAnswer: "125",
      acceptableAnswers: ["125", "125/1000", "1/8"],
      markingGuide:
        "Award full credit for 125 in the gap or an equivalent fraction showing 0.125 = 125/1000 = 1/8.",
      workedSolution:
        "0.125 has three decimal places, so it is 125 thousandths: 125/1000. Dividing numerator and denominator by 125 gives 1/8.",
      misconceptionTargets: [
        "decimal-to-fraction-conversion-error",
        "place-value-denominator-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-rational-representations-across-forms",
        ifCorrectGoToStepKey: "connect-recurring-decimals-to-fractions",
        practiceRecommendation:
          "Practise reading decimal place value before simplifying the fraction.",
        diagnosticNote:
          "This item checks whether the learner uses thousandths correctly when converting a terminating decimal to a fraction.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a place-value table showing tenths, hundredths and thousandths.",
      },
    },
    {
      id: "term-rec-rational-recurring-choice-004",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "represent-recurring-decimals-with-correct-notation",
      subElementKey: "recurring-decimal-representations",
      subElementTitle: "Recurring decimal representations",
      subElementDescription:
        "Recognise recurring decimals and connect them to rational numbers.",
      title: "Identify a recurring decimal",
      prompt: "Which decimal is recurring?",
      difficulty: "developing",
      answerType: "multiple_choice",
      format: "recurring_decimal_recognition",
      options: ["0.727272...", "0.72", "0.702", "0.7200"],
      expectedAnswer: "0.727272...",
      acceptableAnswers: ["0.727272...", "0.72 recurring"],
      markingGuide:
        "Award full credit for selecting 0.727272..., where the block 72 repeats.",
      workedSolution:
        "0.727272... is recurring because the block 72 repeats without ending. The other decimals terminate.",
      misconceptionTargets: [
        "recurring-decimal-recognition-error",
        "repeating-block-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "represent-recurring-decimals-with-correct-notation",
        ifCorrectGoToStepKey: "connect-recurring-decimals-to-fractions",
        practiceRecommendation:
          "Practise identifying the repeating block in a decimal before naming it as recurring.",
        diagnosticNote:
          "This item checks whether the learner can recognise a recurring decimal from its repeated digit block.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "term-rec-rational-recurring-match-005",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-recurring-decimals-to-fractions",
      subElementKey: "recurring-decimal-representations",
      subElementTitle: "Recurring decimal representations",
      subElementDescription:
        "Recognise recurring decimals and connect them to rational numbers.",
      title: "Match recurring decimals to fractions",
      prompt: "Match each recurring decimal to its fraction form.",
      difficulty: "developing",
      answerType: "matching",
      format: "recurring_decimal_recognition",
      matchingPairs: [
        { prompt: "0.333...", correctMatch: "1/3" },
        { prompt: "0.666...", correctMatch: "2/3" },
        { prompt: "0.111...", correctMatch: "1/9" },
      ],
      expectedAnswer: "0.333... = 1/3; 0.666... = 2/3; 0.111... = 1/9",
      acceptableAnswers: [
        "0.333... = 1/3; 0.666... = 2/3; 0.111... = 1/9",
      ],
      markingGuide:
        "Award full credit for matching all three familiar recurring decimals to fractions.",
      workedSolution:
        "1/3 = 0.333..., 2/3 = 0.666..., and 1/9 = 0.111.... Each decimal has a repeating digit.",
      misconceptionTargets: [
        "recurring-decimal-rational-confusion",
        "fraction-to-decimal-conversion-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-recurring-decimals-to-fractions",
        ifCorrectGoToStepKey: "represent-recurring-decimals-with-correct-notation",
        practiceRecommendation:
          "Practise matching common recurring decimals to familiar fractions such as thirds and ninths.",
        diagnosticNote:
          "This item checks whether the learner connects recurring decimals to exact fraction values.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a matching table with recurring decimals and familiar fraction forms.",
      },
    },
    {
      id: "term-rec-rational-recurring-explanation-006",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-recurring-decimals-to-fractions",
      subElementKey: "recurring-decimal-representations",
      subElementTitle: "Recurring decimal representations",
      subElementDescription:
        "Recognise recurring decimals and connect them to rational numbers.",
      title: "Explain why recurring decimals are rational",
      prompt: "Which explanation best shows why 0.444... is rational?",
      difficulty: "developing",
      answerType: "choose_best_explanation",
      format: "recurring_decimal_recognition",
      structuredOptions: [
        {
          id: "recurs-as-fraction",
          label:
            "It is rational because the digit 4 repeats and the value can be written as 4/9.",
        },
        {
          id: "goes-on-forever",
          label:
            "It is irrational because it goes on forever.",
        },
        {
          id: "rounded-four-tenths",
          label:
            "It is rational only because it rounds to 0.4.",
        },
        {
          id: "no-fraction",
          label:
            "It cannot be rational because no recurring decimal can be a fraction.",
        },
      ],
      bestExplanationOptionId: "recurs-as-fraction",
      expectedAnswer:
        "It is rational because the digit 4 repeats and the value can be written as 4/9.",
      acceptableAnswers: [
        "It is rational because the digit 4 repeats and the value can be written as 4/9.",
      ],
      markingGuide:
        "Award full credit for explaining that a recurring decimal is rational because it can be written as a fraction.",
      workedSolution:
        "A decimal with a repeating pattern can be written as a fraction. Since 0.444... = 4/9, it is rational.",
      misconceptionTargets: [
        "recurring-decimal-rational-confusion",
        "non-terminating-means-irrational-error",
        "approximation-vs-exact-decimal-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-recurring-decimals-to-fractions",
        ifCorrectGoToStepKey: "recognise-rational-representations-across-forms",
        practiceRecommendation:
          "Practise explaining why recurring decimals are exact rational values, not rounded estimates.",
        diagnosticNote:
          "This item checks whether the learner understands the rational status of recurring decimals.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "term-rec-rational-fraction-decimal-numeric-007",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-terminating-decimals-from-fractions",
      subElementKey: "fraction-decimal-conversions",
      subElementTitle: "Fraction and decimal conversions",
      subElementDescription:
        "Convert between fractions and decimal forms, including simple recurring forms.",
      title: "Convert a fraction to a terminating decimal",
      prompt: "Write 3/8 as a decimal.",
      difficulty: "developing",
      answerType: "numeric",
      format: "fraction_decimal_conversion",
      expectedAnswer: "0.375",
      acceptableAnswers: ["0.375"],
      markingGuide:
        "Award full credit for 0.375.",
      workedSolution:
        "Divide 3 by 8, or rewrite 3/8 as 375/1000. So 3/8 = 0.375.",
      misconceptionTargets: [
        "fraction-to-decimal-conversion-error",
        "place-value-denominator-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-terminating-decimals-from-fractions",
        ifCorrectGoToStepKey: "recognise-rational-representations-across-forms",
        practiceRecommendation:
          "Practise converting fractions by division and by equivalent denominators such as thousandths.",
        diagnosticNote:
          "This item checks whether the learner can convert a fraction to an exact terminating decimal.",
      },
      visualSupport: {
        type: "table",
        description:
          "Show 3/8 as an equivalent fraction with denominator 1000.",
      },
    },
    {
      id: "term-rec-rational-recurring-symbolic-008",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-recurring-decimals-to-fractions",
      subElementKey: "fraction-decimal-conversions",
      subElementTitle: "Fraction and decimal conversions",
      subElementDescription:
        "Convert between fractions and decimal forms, including simple recurring forms.",
      title: "Convert a recurring decimal to a fraction",
      prompt: "Write 0.333... as a fraction.",
      difficulty: "secure",
      answerType: "short_symbolic",
      format: "fraction_decimal_conversion",
      expectedAnswer: "1/3",
      acceptableAnswers: ["1/3", "one third"],
      markingGuide:
        "Award full credit for 1/3.",
      workedSolution:
        "0.333... is the recurring decimal form of one third, so 0.333... = 1/3.",
      misconceptionTargets: [
        "recurring-decimal-rational-confusion",
        "decimal-to-fraction-conversion-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-recurring-decimals-to-fractions",
        ifCorrectGoToStepKey: "represent-recurring-decimals-with-correct-notation",
        practiceRecommendation:
          "Practise familiar recurring fraction pairs such as 1/3, 2/3 and 1/9.",
        diagnosticNote:
          "This item checks whether the learner recognises a simple recurring decimal as an exact fraction.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "term-rec-rational-conversion-working-009",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-terminating-decimals-from-fractions",
      subElementKey: "fraction-decimal-conversions",
      subElementTitle: "Fraction and decimal conversions",
      subElementDescription:
        "Convert between fractions and decimal forms, including simple recurring forms.",
      title: "Select correct fraction-to-decimal working",
      prompt: "Which working correctly converts 5/8 to a decimal?",
      difficulty: "secure",
      answerType: "select_correct_working",
      format: "fraction_decimal_conversion",
      structuredOptions: [
        {
          id: "divide-correctly",
          label: "5 / 8 = 0.625, so 5/8 = 0.625.",
        },
        {
          id: "write-sixty-two-five",
          label: "5/8 = 5.8 because the numerator and denominator become digits.",
        },
        {
          id: "round-to-half",
          label: "5/8 = 0.5 because 5 is close to half of 8.",
        },
        {
          id: "denominator-to-hundred",
          label: "5/8 = 5/100 = 0.05 because decimals use hundredths.",
        },
      ],
      correctWorkingOptionId: "divide-correctly",
      expectedAnswer: "0.625",
      acceptableAnswers: ["0.625"],
      markingGuide:
        "Award full credit for selecting the division working or giving 0.625.",
      workedSolution:
        "A fraction means division. Calculate 5 / 8 = 0.625, so 5/8 is 0.625.",
      misconceptionTargets: [
        "fraction-to-decimal-conversion-error",
        "place-value-denominator-error",
        "approximation-vs-exact-decimal-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-terminating-decimals-from-fractions",
        ifCorrectGoToStepKey: "recognise-rational-representations-across-forms",
        practiceRecommendation:
          "Practise using division to convert fractions to decimals and checking whether the result is exact or rounded.",
        diagnosticNote:
          "This item checks whether the learner selects a valid conversion method instead of treating the fraction notation as decimal digits.",
      },
      visualSupport: {
        type: "table",
        description:
          "Compare correct division working with common fraction-to-decimal misconceptions.",
      },
    },
    {
      id: "term-rec-rational-decimal-classification-010",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-rational-representations-across-forms",
      subElementKey: "rational-irrational-decimal-boundary",
      subElementTitle: "Rational and irrational decimal boundary",
      subElementDescription:
        "Distinguish terminating, recurring, and non-terminating non-recurring decimal representations.",
      title: "Classify decimal representations",
      prompt:
        "Classify each decimal as terminating, recurring, or non-terminating non-recurring.",
      difficulty: "secure",
      answerType: "classification",
      format: "decimal_classification",
      classificationCategories: [
        { id: "terminating", label: "Terminating" },
        { id: "recurring", label: "Recurring" },
        {
          id: "non-terminating-non-recurring",
          label: "Non-terminating non-recurring",
        },
      ],
      classificationItems: [
        { id: "zero-seven-five", label: "0.75", correctCategoryId: "terminating" },
        { id: "zero-four-five", label: "0.454545...", correctCategoryId: "recurring" },
        {
          id: "pi-approx-pattern",
          label: "3.14159265...",
          correctCategoryId: "non-terminating-non-recurring",
        },
      ],
      expectedAnswer:
        "0.75 terminating; 0.454545... recurring; 3.14159265... non-terminating non-recurring",
      acceptableAnswers: [
        "0.75 terminating; 0.454545... recurring; 3.14159265... non-terminating non-recurring",
      ],
      markingGuide:
        "Award full credit for classifying all three decimal types correctly.",
      workedSolution:
        "0.75 stops, so it terminates. 0.454545... repeats the block 45, so it recurs. 3.14159265... does not show a repeating block, so it is non-terminating non-recurring.",
      misconceptionTargets: [
        "rational-irrational-decimal-boundary-error",
        "recurring-decimal-recognition-error",
        "non-terminating-means-irrational-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-rational-representations-across-forms",
        ifCorrectGoToStepKey: "represent-recurring-decimals-with-correct-notation",
        practiceRecommendation:
          "Practise sorting decimal expansions by whether they stop, repeat, or continue without a repeating block.",
        diagnosticNote:
          "This item checks whether the learner can distinguish the three main decimal-expansion types.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a three-column sort for terminating, recurring, and non-terminating non-recurring decimals.",
      },
    },
    {
      id: "term-rec-rational-boundary-correction-011",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-rational-representations-across-forms",
      subElementKey: "rational-irrational-decimal-boundary",
      subElementTitle: "Rational and irrational decimal boundary",
      subElementDescription:
        "Distinguish terminating, recurring, and non-terminating non-recurring decimal representations.",
      title: "Correct a rational and irrational boundary misconception",
      prompt:
        "True or false: Every non-terminating decimal is irrational. If false, choose the correction.",
      difficulty: "extension",
      answerType: "true_false_correction",
      format: "decimal_classification",
      trueFalseStatement: "Every non-terminating decimal is irrational.",
      correctBoolean: false,
      correctionOptions: [
        "Some non-terminating decimals are recurring, and recurring decimals are rational.",
        "Every non-terminating decimal is rational.",
        "A decimal is irrational only when it has exactly three decimal places.",
      ],
      correctCorrection:
        "Some non-terminating decimals are recurring, and recurring decimals are rational.",
      expectedAnswer:
        "Some non-terminating decimals are recurring, and recurring decimals are rational.",
      acceptableAnswers: [
        "Some non-terminating decimals are recurring, and recurring decimals are rational.",
        "recurring decimals are rational",
      ],
      markingGuide:
        "Award full credit for identifying the statement as false and correcting it with the recurring-decimal exception.",
      workedSolution:
        "A non-terminating decimal can be recurring, such as 0.333..., and recurring decimals are rational. Non-terminating non-recurring decimals are irrational.",
      misconceptionTargets: [
        "non-terminating-means-irrational-error",
        "recurring-decimal-rational-confusion",
        "rational-irrational-decimal-boundary-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-rational-representations-across-forms",
        ifCorrectGoToStepKey: "represent-recurring-decimals-with-correct-notation",
        practiceRecommendation:
          "Practise separating non-terminating recurring decimals from non-terminating non-recurring decimals.",
        diagnosticNote:
          "This item checks whether the learner can state the boundary between rational recurring decimals and irrational decimals.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "term-rec-rational-context-order-012",
      progressionBandKey:
        NUMBER_TERMINATING_RECURRING_RATIONAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-rational-representations-across-forms",
      subElementKey: "rational-irrational-decimal-boundary",
      subElementTitle: "Rational and irrational decimal boundary",
      subElementDescription:
        "Distinguish terminating, recurring, and non-terminating non-recurring decimal representations.",
      title: "Order rational representations in context",
      prompt:
        "Three completion rates are recorded as 0.75, 2/3 and 0.7 recurring. Order them from smallest to largest.",
      difficulty: "extension",
      answerType: "ordering",
      format: "representation_context",
      orderingItems: ["0.75", "2/3", "0.7 recurring"],
      correctOrder: ["2/3", "0.7 recurring", "0.75"],
      expectedAnswer: "2/3, 0.7 recurring, 0.75",
      acceptableAnswers: [
        "2/3, 0.7 recurring, 0.75",
        "2/3 0.7 recurring 0.75",
        "0.666..., 0.777..., 0.75",
      ],
      markingGuide:
        "Award full credit for ordering 2/3 first, then 0.7 recurring, then 0.75.",
      workedSolution:
        "2/3 = 0.666..., 0.7 recurring means 0.777..., and 0.75 = 0.750. So the increasing order is 2/3, 0.7 recurring, 0.75.",
      misconceptionTargets: [
        "decimal-comparison-error",
        "recurring-decimal-recognition-error",
        "representation-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-rational-representations-across-forms",
        ifCorrectGoToStepKey: "connect-recurring-decimals-to-fractions",
        practiceRecommendation:
          "Practise converting mixed rational representations to comparable decimal forms before ordering them in context.",
        diagnosticNote:
          "This item checks whether the learner can choose comparable representations for a short decimal/rational context.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Convert each representation to a decimal and place them on a number line from least to greatest.",
      },
    },
  ];

export function getNumberTerminatingRecurringRationalAssessmentItemById(
  id: string,
) {
  return (
    NUMBER_TERMINATING_RECURRING_RATIONAL_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberTerminatingRecurringRationalAssessmentItemsByStep(
  stepKey: NumberTerminatingRecurringRationalProgressionStepKey,
) {
  return NUMBER_TERMINATING_RECURRING_RATIONAL_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberTerminatingRecurringRationalAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_TERMINATING_RECURRING_RATIONAL_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberTerminatingRecurringRationalAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_TERMINATING_RECURRING_RATIONAL_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
