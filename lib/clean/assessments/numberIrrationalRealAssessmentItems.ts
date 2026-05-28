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

export type NumberIrrationalRealProgressionBandKey = Extract<
  NumberProgressionBandKey,
  "irrational-and-real-numbers"
>;

export type NumberIrrationalRealProgressionStepKey =
  | "recognise-irrational-numbers-including-square-roots-and-pi"
  | "classify-numbers-as-rational-or-irrational"
  | "identify-statements-about-irrational-numbers"
  | "place-rational-and-irrational-numbers-on-a-number-line"
  | "solve-applied-problems-involving-exact-real-number-values";

export type NumberIrrationalRealAssessmentFormat =
  | "classification"
  | "number_line"
  | "exact_form"
  | "real_number_reasoning"
  | "applied_context"
  | "geometric_reasoning";

export type NumberIrrationalRealMisconceptionCode =
  | "rational-irrational-classification-error"
  | "square-root-estimation-error"
  | "pi-as-rational-error"
  | "exact-vs-decimal-form-confusion"
  | "number-line-placement-error"
  | "area-formula-exact-form-error"
  | "surd-simplification-readiness-gap"
  | "recurring-decimal-rational-confusion"
  | "approximation-treated-as-exact"
  | "real-number-comparison-error";

export type NumberIrrationalRealAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberIrrationalRealProgressionStepKey;
  ifCorrectGoToStepKey?: NumberIrrationalRealProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberIrrationalRealAssessmentItem = {
  id: string;
  progressionBandKey: NumberIrrationalRealProgressionBandKey;
  progressionStepKey: NumberIrrationalRealProgressionStepKey;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberIrrationalRealAssessmentFormat;
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
  misconceptionTargets: NumberIrrationalRealMisconceptionCode[];
  adaptiveRoute: NumberIrrationalRealAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY: NumberIrrationalRealProgressionBandKey =
  "irrational-and-real-numbers";

export const NUMBER_IRRATIONAL_REAL_ITEM_BANK_KEY =
  "number-irrational-real-assessment-items-v1";

export const NUMBER_IRRATIONAL_REAL_ASSESSMENT_ITEMS: NumberIrrationalRealAssessmentItem[] =
  [
    {
      id: "irr-real-identify-001",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "recognise-irrational-numbers-including-square-roots-and-pi",
      title: "Recognise irrational numbers in a mixed list",
      prompt: "Select every irrational number in the list.",
      difficulty: "foundation",
      answerType: "multi_select",
      format: "classification",
      structuredOptions: [
        { id: "sqrt-9", label: "sqrt(9)" },
        { id: "sqrt-5", label: "sqrt(5)" },
        { id: "pi", label: "pi" },
        { id: "one-third", label: "1/3" },
        { id: "recurring-decimal", label: "0.6 recurring" },
      ],
      correctOptionIds: ["sqrt-5", "pi"],
      expectedAnswer: "sqrt(5) and pi",
      acceptableAnswers: ["sqrt(5) and pi"],
      markingGuide:
        "Award full credit for selecting sqrt(5) and pi. Perfect square roots, fractions, terminating decimals, and recurring decimals are rational.",
      workedSolution:
        "sqrt(5) is irrational because 5 is not a perfect square, and pi is irrational. The other options contain rational numbers.",
      misconceptionTargets: [
        "rational-irrational-classification-error",
        "pi-as-rational-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "recognise-irrational-numbers-including-square-roots-and-pi",
        ifCorrectGoToStepKey: "classify-numbers-as-rational-or-irrational",
        practiceRecommendation:
          "Practise sorting perfect square roots, non-perfect square roots, fractions, terminating decimals, and recurring decimals.",
        diagnosticNote:
          "This item checks whether the learner recognises familiar irrational forms and does not misclassify common rational forms.",
      },
      visualSupport: {
        type: "table",
        description: "Compare the forms before deciding which values are irrational.",
      },
    },
    {
      id: "irr-real-classify-002",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "classify-numbers-as-rational-or-irrational",
      title: "Classify numbers as rational or irrational",
      prompt: "Classify each number as rational or irrational.",
      difficulty: "foundation",
      answerType: "classification",
      format: "classification",
      classificationCategories: [
        { id: "rational", label: "Rational" },
        { id: "irrational", label: "Irrational" },
      ],
      classificationItems: [
        { id: "sqrt-4", label: "sqrt(4)", correctCategoryId: "rational" },
        { id: "sqrt-13", label: "sqrt(13)", correctCategoryId: "irrational" },
        {
          id: "point-two-recurring",
          label: "0.2 recurring",
          correctCategoryId: "rational",
        },
      ],
      expectedAnswer:
        "Rational: sqrt(4), 0.2 recurring; Irrational: sqrt(13)",
      acceptableAnswers: [
        "Rational: sqrt(4), 0.2 recurring; Irrational: sqrt(13)",
      ],
      markingGuide:
        "Award full credit for identifying sqrt(4) and 0.2 recurring as rational and sqrt(13) as irrational.",
      workedSolution:
        "sqrt(4) = 2, so it is rational. 0.2 recurring can be written as a fraction, so it is rational. sqrt(13) is irrational because 13 is not a perfect square.",
      misconceptionTargets: [
        "rational-irrational-classification-error",
        "recurring-decimal-rational-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "classify-numbers-as-rational-or-irrational",
        ifCorrectGoToStepKey: "identify-statements-about-irrational-numbers",
        practiceRecommendation:
          "Practise rewriting square roots and recurring decimals in equivalent forms before classifying them.",
        diagnosticNote:
          "This item checks whether the learner uses equivalent forms rather than judging rationality from notation alone.",
      },
      visualSupport: {
        type: "table",
        description: "Sort each value by whether it can be written as a fraction of integers.",
      },
    },
    {
      id: "irr-real-sqrt-between-003",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "place-rational-and-irrational-numbers-on-a-number-line",
      title: "Estimate a square root between consecutive integers",
      prompt: "Complete the statement for the position of sqrt(27).",
      difficulty: "foundation",
      answerType: "fill_gap",
      format: "number_line",
      gapText: "sqrt(27) lies between __.",
      gapAnswer: "5 and 6",
      gapAcceptableAnswers: ["between 5 and 6", "5, 6", "5 to 6"],
      expectedAnswer: "5 and 6",
      acceptableAnswers: [
        "5 and 6",
        "between 5 and 6",
        "5, 6",
        "5 to 6",
      ],
      markingGuide:
        "Award full credit for any response showing that sqrt(27) lies between 5 and 6.",
      workedSolution:
        "5^2 = 25 and 6^2 = 36. Since 27 is between 25 and 36, sqrt(27) is between 5 and 6.",
      misconceptionTargets: [
        "square-root-estimation-error",
        "number-line-placement-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "place-rational-and-irrational-numbers-on-a-number-line",
        ifCorrectGoToStepKey:
          "place-rational-and-irrational-numbers-on-a-number-line",
        practiceRecommendation:
          "Practise bracketing square roots by comparing the radicand with nearby perfect squares.",
        diagnosticNote:
          "This item checks whether the learner can estimate the size of an irrational square root before placing it.",
      },
      visualSupport: {
        type: "number_line",
        description: "Use nearby perfect squares to decide where sqrt(27) belongs.",
      },
    },
    {
      id: "irr-real-pi-004",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-statements-about-irrational-numbers",
      title: "Recognise the difference between pi and an approximation",
      prompt: "Which explanation about pi and 3.14 is best?",
      difficulty: "developing",
      answerType: "choose_best_explanation",
      format: "real_number_reasoning",
      structuredOptions: [
        {
          id: "pi-irrational-approximation",
          label: "pi is irrational, and 3.14 is only an approximation.",
        },
        {
          id: "pi-rational-terminating",
          label: "pi is rational because 3.14 is a terminating decimal.",
        },
        {
          id: "pi-only-geometry",
          label: "pi is irrational only when it appears in geometry formulas.",
        },
        { id: "pi-22-7", label: "pi equals 22/7 exactly." },
      ],
      bestExplanationOptionId: "pi-irrational-approximation",
      expectedAnswer: "pi is irrational, and 3.14 is only an approximation.",
      acceptableAnswers: [
        "pi is irrational, and 3.14 is only an approximation.",
      ],
      markingGuide:
        "Award full credit for the statement that pi is irrational and 3.14 is an approximation.",
      workedSolution:
        "pi is irrational, so it cannot be written exactly as a fraction of integers or as a terminating or recurring decimal. 3.14 is a useful approximation, not the exact value of pi.",
      misconceptionTargets: [
        "pi-as-rational-error",
        "approximation-treated-as-exact",
        "exact-vs-decimal-form-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "recognise-irrational-numbers-including-square-roots-and-pi",
        ifCorrectGoToStepKey: "solve-applied-problems-involving-exact-real-number-values",
        practiceRecommendation:
          "Practise distinguishing an exact value such as pi from rounded decimal approximations such as 3.14.",
        diagnosticNote:
          "This item checks whether the learner understands that a familiar decimal for pi is an approximation, not the exact value.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "irr-real-number-line-005",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "place-rational-and-irrational-numbers-on-a-number-line",
      title: "Choose the number-line point closest to an irrational value",
      prompt:
        "Put these values in increasing order on a number line.",
      difficulty: "developing",
      answerType: "ordering",
      format: "number_line",
      orderingItems: ["3.5", "3", "sqrt(10)", "3.2"],
      correctOrder: ["3", "sqrt(10)", "3.2", "3.5"],
      expectedAnswer: "3.2",
      acceptableAnswers: ["3.2"],
      markingGuide:
        "Award full credit for 3.2. sqrt(10) is about 3.16, so 3.2 is the closest point shown.",
      workedSolution:
        "sqrt(10) is a little more than 3 because 3^2 = 9, and it is much less than 3.5. A decimal approximation is about 3.16, so 3.2 is the closest point.",
      misconceptionTargets: [
        "number-line-placement-error",
        "square-root-estimation-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "place-rational-and-irrational-numbers-on-a-number-line",
        ifCorrectGoToStepKey: "identify-statements-about-irrational-numbers",
        practiceRecommendation:
          "Practise estimating irrational values first, then matching them to the nearest point on a number line.",
        diagnosticNote:
          "This item checks whether the learner can turn an exact irrational form into a sensible approximate location.",
      },
      visualSupport: {
        type: "number_line",
        description: "Compare sqrt(10) with nearby decimal points on the number line.",
      },
    },
    {
      id: "irr-real-exact-form-006",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "solve-applied-problems-involving-exact-real-number-values",
      title: "Choose the exact form of a circle area",
      prompt:
        "Match each circle-area expression with whether it is exact or approximate for radius 5 cm.",
      difficulty: "developing",
      answerType: "matching",
      format: "exact_form",
      matchingPairs: [
        { prompt: "25pi cm^2", correctMatch: "Exact area" },
        { prompt: "78.5 cm^2", correctMatch: "Approximation using pi about 3.14" },
        { prompt: "31.4 cm^2", correctMatch: "Not the area for radius 5 cm" },
      ],
      expectedAnswer: "25pi cm^2",
      acceptableAnswers: ["25pi cm^2", "25pi"],
      markingGuide:
        "Award full credit for 25pi cm^2. Decimal answers are approximations, not exact forms.",
      workedSolution:
        "Use A = pi r^2. With radius 5 cm, the exact area is pi x 5^2 = 25pi cm^2.",
      misconceptionTargets: [
        "area-formula-exact-form-error",
        "exact-vs-decimal-form-confusion",
        "approximation-treated-as-exact",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "solve-applied-problems-involving-exact-real-number-values",
        ifCorrectGoToStepKey:
          "solve-applied-problems-involving-exact-real-number-values",
        practiceRecommendation:
          "Practise deciding when a geometry answer should stay in exact form rather than being turned into a decimal too early.",
        diagnosticNote:
          "This item checks whether the learner keeps pi in exact form when the task asks for an exact answer.",
      },
      visualSupport: {
        type: "context_card",
        description: "Keep the area in terms of pi instead of replacing pi with a decimal.",
      },
    },
    {
      id: "irr-real-recurring-007",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "classify-numbers-as-rational-or-irrational",
      title: "Recognise that a recurring decimal is rational",
      prompt:
        "True or false: 0.272727... is irrational because it has infinitely many decimal places. If false, choose the correction.",
      difficulty: "developing",
      answerType: "true_false_correction",
      format: "classification",
      trueFalseStatement:
        "0.272727... is irrational because it has infinitely many decimal places.",
      correctBoolean: false,
      correctionOptions: [
        "It is rational because the decimal pattern recurs and can be written as a fraction.",
        "It is irrational because every infinite decimal is irrational.",
        "It is rational only if it terminates.",
      ],
      correctCorrection:
        "It is rational because the decimal pattern recurs and can be written as a fraction.",
      expectedAnswer: "rational",
      acceptableAnswers: [
        "rational",
        "it is rational",
      ],
      markingGuide:
        "Award full credit for identifying 0.272727... as rational.",
      workedSolution:
        "A recurring decimal is rational because it can be written as a fraction. So 0.272727... is rational.",
      misconceptionTargets: [
        "recurring-decimal-rational-confusion",
        "rational-irrational-classification-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "classify-numbers-as-rational-or-irrational",
        ifCorrectGoToStepKey: "identify-statements-about-irrational-numbers",
        practiceRecommendation:
          "Practise connecting recurring decimals to fractions so they are not mistaken for irrational numbers.",
        diagnosticNote:
          "This item checks whether the learner knows that an endlessly repeating decimal is still rational.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "irr-real-circle-area-008",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "solve-applied-problems-involving-exact-real-number-values",
      title: "Write the exact area of a circle in terms of pi",
      prompt: "A circle has radius 7 cm. Write its exact area in terms of pi.",
      difficulty: "secure",
      answerType: "short_symbolic",
      format: "geometric_reasoning",
      expectedAnswer: "49pi cm^2",
      acceptableAnswers: [
        "49pi",
        "49 pi",
        "49pi cm^2",
        "49 pi cm^2",
      ],
      markingGuide:
        "Award full credit for 49pi cm^2 or an equivalent exact form. A decimal approximation does not meet the exact-form requirement by itself.",
      workedSolution:
        "Use A = pi r^2. With radius 7 cm, A = pi x 7^2 = 49pi cm^2.",
      misconceptionTargets: [
        "area-formula-exact-form-error",
        "exact-vs-decimal-form-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "solve-applied-problems-involving-exact-real-number-values",
        ifCorrectGoToStepKey:
          "solve-applied-problems-involving-exact-real-number-values",
        practiceRecommendation:
          "Practise substituting the radius correctly into pi r^2 and keeping the final answer in exact form.",
        diagnosticNote:
          "This item checks whether the learner can apply the circle area formula and preserve exact form.",
      },
      visualSupport: {
        type: "context_card",
        description: "Use the circle area formula and leave pi in the exact answer.",
      },
    },
    {
      id: "irr-real-compare-009",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "place-rational-and-irrational-numbers-on-a-number-line",
      title: "Compare rational and irrational values",
      prompt: "To two decimal places, what is sqrt(3)?",
      difficulty: "secure",
      answerType: "numeric",
      format: "real_number_reasoning",
      expectedAnswer: "1.73",
      acceptableAnswers: ["1.73"],
      markingGuide:
        "Award full credit for 1.73. This checks that sqrt(3) is estimated near 1.732 before comparison or placement.",
      workedSolution:
        "sqrt(3) is about 1.732, so to two decimal places it is 1.73.",
      misconceptionTargets: [
        "real-number-comparison-error",
        "number-line-placement-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "place-rational-and-irrational-numbers-on-a-number-line",
        ifCorrectGoToStepKey:
          "solve-applied-problems-involving-exact-real-number-values",
        practiceRecommendation:
          "Practise comparing rational and irrational numbers by estimating them to a common decimal scale.",
        diagnosticNote:
          "This item checks whether the learner can compare different real-number forms by value rather than by appearance.",
      },
      visualSupport: {
        type: "number_line",
        description: "Estimate each value on the same scale before deciding which is greatest.",
      },
    },
    {
      id: "irr-real-radicand-010",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-statements-about-irrational-numbers",
      title: "Explain why one square root is rational and another is irrational",
      prompt:
        "Which working correctly explains why sqrt(49) is rational but sqrt(50) is irrational?",
      difficulty: "secure",
      answerType: "select_correct_working",
      format: "real_number_reasoning",
      structuredOptions: [
        {
          id: "perfect-square-test",
          label:
            "49 is a perfect square, so sqrt(49) = 7. 50 is not a perfect square, so sqrt(50) is irrational.",
        },
        {
          id: "close-to-seven",
          label:
            "sqrt(50) is close to 7, so it is rational, but sqrt(49) is irrational because it uses a square root sign.",
        },
        {
          id: "all-square-roots",
          label: "All square roots are irrational, except when they are written as decimals.",
        },
        {
          id: "bigger-number",
          label:
            "sqrt(50) is irrational only because 50 is larger than 49.",
        },
      ],
      correctWorkingOptionId: "perfect-square-test",
      expectedAnswer:
        "sqrt(49) is rational because it equals 7 exactly. sqrt(50) is irrational because 50 is not a perfect square, so its decimal form does not terminate or recur.",
      acceptableAnswers: [
        "sqrt(49) is rational because it equals 7 exactly. sqrt(50) is irrational because 50 is not a perfect square.",
        "sqrt(49)=7, so it is rational. sqrt(50) is not a perfect square, so it is irrational.",
      ],
      markingGuide:
        "Award full credit for noting that sqrt(49) equals an integer exactly and that sqrt(50) is not the square root of a perfect square.",
      workedSolution:
        "49 is a perfect square because 7 x 7 = 49, so sqrt(49) = 7 and is rational. 50 is not a perfect square, so sqrt(50) cannot be written exactly as a fraction of integers and is irrational.",
      misconceptionTargets: [
        "rational-irrational-classification-error",
        "surd-simplification-readiness-gap",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-statements-about-irrational-numbers",
        ifCorrectGoToStepKey:
          "solve-applied-problems-involving-exact-real-number-values",
        practiceRecommendation:
          "Practise deciding whether the radicand is a perfect square before classifying the square root.",
        diagnosticNote:
          "This item checks whether the learner can explain how the radicand determines whether a square root is rational or irrational.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "irr-real-triangle-area-011",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "solve-applied-problems-involving-exact-real-number-values",
      title: "Calculate an exact area involving a square root",
      prompt:
        "A triangle has base 6 cm and height sqrt(12) cm. Write its exact area.",
      difficulty: "extension",
      answerType: "short_answer",
      format: "geometric_reasoning",
      expectedAnswer: "3sqrt(12) cm^2",
      acceptableAnswers: [
        "3sqrt(12)",
        "3sqrt(12) cm^2",
        "6sqrt(3)",
        "6sqrt(3) cm^2",
      ],
      markingGuide:
        "Award full credit for 3sqrt(12) cm^2 or the simplified equivalent 6sqrt(3) cm^2.",
      workedSolution:
        "Area of a triangle is 1/2 x base x height. So the exact area is 1/2 x 6 x sqrt(12) = 3sqrt(12) cm^2, which can also be simplified to 6sqrt(3) cm^2.",
      misconceptionTargets: [
        "area-formula-exact-form-error",
        "surd-simplification-readiness-gap",
        "exact-vs-decimal-form-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "solve-applied-problems-involving-exact-real-number-values",
        practiceRecommendation:
          "Practise applying geometry formulas with square root lengths and keeping the answer in exact form before simplifying if useful.",
        diagnosticNote:
          "This item checks whether the learner can combine a geometry formula with an irrational length without dropping the radical.",
      },
      visualSupport: {
        type: "context_card",
        description: "Use the triangle area formula and keep the square root in exact form.",
      },
    },
    {
      id: "irr-real-context-012",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "solve-applied-problems-involving-exact-real-number-values",
      title: "Explain the difference between an exact and approximate real-number answer",
      prompt:
        "A circular garden has radius 4 m. One student writes the boundary length as 8pi m. Another writes 25.12 m. Which statement is best?",
      difficulty: "extension",
      answerType: "multiple_choice",
      format: "applied_context",
      options: [
        "8pi m is exact; 25.12 m is an approximation useful for practical measuring.",
        "25.12 m is exact because it is a decimal.",
        "Both are exact because they describe the same garden.",
        "8pi m is approximate because it contains pi.",
      ],
      expectedAnswer:
        "8pi m is exact; 25.12 m is an approximation useful for practical measuring.",
      acceptableAnswers: [
        "8pi m is exact; 25.12 m is an approximation useful for practical measuring.",
      ],
      markingGuide:
        "Award full credit for identifying 8pi m as exact and for explaining that 25.12 m comes from approximating pi and may still be useful in a practical context.",
      workedSolution:
        "The circumference is 2pi r = 2pi x 4 = 8pi m, so 8pi m is exact. Using pi about 3.14 gives 8pi about 25.12 m, which is useful when a decimal measurement is needed in practice.",
      misconceptionTargets: [
        "exact-vs-decimal-form-confusion",
        "approximation-treated-as-exact",
        "pi-as-rational-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "solve-applied-problems-involving-exact-real-number-values",
        practiceRecommendation:
          "Practise deciding when an exact form should be kept and when a decimal approximation is useful for the context.",
        diagnosticNote:
          "This item checks whether the learner distinguishes exact real-number forms from practical approximations and can explain the role of each.",
      },
      visualSupport: {
        type: "context_card",
        description: "Compare the exact circumference with a decimal approximation for a real measurement context.",
      },
    },
  ];

export function getNumberIrrationalRealAssessmentItemById(id: string) {
  return NUMBER_IRRATIONAL_REAL_ASSESSMENT_ITEMS.find((item) => item.id === id) || null;
}

export function getNumberIrrationalRealAssessmentItemsByStep(
  stepKey: NumberIrrationalRealProgressionStepKey,
) {
  return NUMBER_IRRATIONAL_REAL_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberIrrationalRealAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_IRRATIONAL_REAL_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}
