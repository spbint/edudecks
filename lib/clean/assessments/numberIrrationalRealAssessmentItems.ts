import type {
  NumberAssessmentAnswerType,
  NumberAssessmentItemDifficulty,
  NumberAssessmentOpenResponseReview,
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
      prompt: "Which two numbers are irrational?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "classification",
      options: [
        "sqrt(9) and 0.75",
        "sqrt(5) and pi",
        "1/3 and 2.4",
        "0.6 recurring and sqrt(16)",
      ],
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
      prompt:
        "Which classification is correct for sqrt(4), sqrt(13), and 0.2 recurring?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "classification",
      options: [
        "All three numbers are irrational",
        "Rational: sqrt(4), 0.2 recurring; Irrational: sqrt(13)",
        "Rational: sqrt(13); Irrational: sqrt(4), 0.2 recurring",
        "Rational: sqrt(4); Irrational: sqrt(13), 0.2 recurring",
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
      prompt: "Between which two consecutive integers does sqrt(27) lie?",
      difficulty: "foundation",
      answerType: "short_answer",
      format: "number_line",
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
      prompt: "Which statement about pi is correct?",
      difficulty: "developing",
      answerType: "multiple_choice",
      format: "real_number_reasoning",
      options: [
        "pi is rational because 3.14 is a terminating decimal.",
        "pi is irrational, and 3.14 is only an approximation.",
        "pi is irrational only when it appears in geometry formulas.",
        "pi equals 22/7 exactly.",
      ],
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
        "A number line has points at 3, 3.2, 3.5, and 3.8. Which point is closest to sqrt(10)?",
      difficulty: "developing",
      answerType: "multiple_choice",
      format: "number_line",
      options: ["3", "3.2", "3.5", "3.8"],
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
        "Which expression gives the exact area of a circle with radius 5 cm?",
      difficulty: "developing",
      answerType: "multiple_choice",
      format: "exact_form",
      options: ["25pi cm^2", "78.5 cm^2", "157 cm^2", "31.4 cm^2"],
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
      prompt: "Is 0.272727... rational or irrational?",
      difficulty: "developing",
      answerType: "short_answer",
      format: "classification",
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
      answerType: "worked_response",
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
      openResponseReview: {
        expectedResponse:
          "The exact area is 49pi cm^2 because A = pi r^2 and 7^2 = 49.",
        successCriteria: [
          "Uses the circle area formula pi r^2.",
          "Squares the radius correctly.",
          "Writes the answer in exact form using pi.",
          "Does not replace pi with a decimal as the final exact answer.",
        ],
        parentReviewPrompts: [
          "Can the learner explain why the radius is squared?",
          "Can the learner say why 49pi is exact but 153.86 is approximate?",
          "Can the learner connect the formula to the final answer clearly?",
        ],
        aiReviewPrompt:
          "Review the learner response against the success criteria. Suggest whether it appears secure, developing, or needs support. Do not make the final judgement; provide a parent-facing recommendation.",
        evidenceNote:
          "The learner used the circle area formula and kept the final result in exact form using pi.",
      },
    },
    {
      id: "irr-real-compare-009",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "place-rational-and-irrational-numbers-on-a-number-line",
      title: "Compare rational and irrational values",
      prompt: "Which number is greatest: 1.7, sqrt(3), 8/5, or pi/2?",
      difficulty: "secure",
      answerType: "short_answer",
      format: "real_number_reasoning",
      expectedAnswer: "sqrt(3)",
      acceptableAnswers: ["sqrt(3)", "sqrt 3"],
      markingGuide:
        "Award full credit for sqrt(3). It is about 1.732, which is greater than 1.7, 1.6, and about 1.57.",
      workedSolution:
        "Compare decimal values: 1.7 = 1.7, sqrt(3) is about 1.732, 8/5 = 1.6, and pi/2 is about 1.57. So sqrt(3) is the greatest.",
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
      prompt: "Explain why sqrt(49) is rational but sqrt(50) is irrational.",
      difficulty: "secure",
      answerType: "explain_or_justify",
      format: "real_number_reasoning",
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
      openResponseReview: {
        expectedResponse:
          "sqrt(49) is rational because it equals 7 exactly. sqrt(50) is irrational because 50 is not a perfect square, so the square root is not an exact integer or fraction of integers.",
        successCriteria: [
          "States that sqrt(49) equals 7 exactly.",
          "Identifies 49 as a perfect square.",
          "States that 50 is not a perfect square.",
          "Explains why that makes sqrt(50) irrational.",
        ],
        parentReviewPrompts: [
          "Can the learner explain what a perfect square means here?",
          "Can the learner connect the radicand to the type of number produced by the square root?",
          "Can the learner justify both classifications rather than only naming them?",
        ],
        aiReviewPrompt:
          "Review the learner response against the success criteria. Suggest whether it appears secure, developing, or needs support. Do not make the final judgement; provide a parent-facing recommendation.",
        evidenceNote:
          "The learner explained how perfect squares and non-perfect squares affect whether a square root is rational or irrational.",
      },
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
      answerType: "worked_response",
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
      openResponseReview: {
        expectedResponse:
          "The exact area is 3sqrt(12) cm^2, which is also 6sqrt(3) cm^2 after simplification.",
        successCriteria: [
          "Uses the triangle area formula 1/2 x base x height.",
          "Substitutes the base and square-root height correctly.",
          "Keeps the result in exact form.",
          "Optionally simplifies sqrt(12) to 2sqrt(3).",
        ],
        parentReviewPrompts: [
          "Can the learner explain where the 1/2 comes from in the triangle area formula?",
          "Can the learner keep the radical in the answer instead of converting it to a decimal too early?",
          "Can the learner explain whether simplification changes the exact value?",
        ],
        aiReviewPrompt:
          "Review the learner response against the success criteria. Suggest whether it appears secure, developing, or needs support. Do not make the final judgement; provide a parent-facing recommendation.",
        evidenceNote:
          "The learner used a geometry formula with a square-root measure and preserved an exact real-number result.",
      },
    },
    {
      id: "irr-real-context-012",
      progressionBandKey: NUMBER_IRRATIONAL_REAL_PROGRESSION_BAND_KEY,
      progressionStepKey:
        "solve-applied-problems-involving-exact-real-number-values",
      title: "Explain the difference between an exact and approximate real-number answer",
      prompt:
        "A circular garden has radius 4 m. One student writes the boundary length as 8pi m. Another writes 25.12 m. Which answer is exact, and when might the other answer still be useful? Explain.",
      difficulty: "extension",
      answerType: "explain_or_justify",
      format: "applied_context",
      expectedAnswer:
        "8pi m is the exact answer. 25.12 m is an approximation that can be useful for practical measurement or estimating materials.",
      acceptableAnswers: [
        "8pi m is exact and 25.12 m is an approximation.",
        "The exact answer is 8pi m. 25.12 m is useful as an approximate measurement.",
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
      openResponseReview: {
        expectedResponse:
          "8pi m is the exact answer because it keeps pi in exact form. 25.12 m is an approximation found by replacing pi with 3.14, and that can still be useful for practical measuring.",
        successCriteria: [
          "Identifies 8pi m as the exact answer.",
          "Explains that 25.12 m is approximate because pi was replaced by a decimal.",
          "States a practical reason why the approximation may still be useful.",
          "Connects the explanation to the circle context.",
        ],
        parentReviewPrompts: [
          "Can the learner explain why pi should stay in the exact answer?",
          "Can the learner describe when a decimal approximation is more practical?",
          "Can the learner distinguish exact mathematics from useful measurement estimates?",
        ],
        aiReviewPrompt:
          "Review the learner response against the success criteria. Suggest whether it appears secure, developing, or needs support. Do not make the final judgement; provide a parent-facing recommendation.",
        evidenceNote:
          "The learner explained the difference between an exact real-number form and a practical decimal approximation in context.",
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
