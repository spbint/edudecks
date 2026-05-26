import type { NumberProgressionBandKey } from "@/lib/clean/pathways/mathematicsYears6To10NumberProgressionMap";

export type NumberApproximationProgressionBandKey = Extract<
  NumberProgressionBandKey,
  "approximation-estimation-error"
>;

export type NumberApproximationProgressionStepKey =
  | "round-decimals-to-a-required-accuracy"
  | "estimate-sums-and-products-using-rounding"
  | "compare-exact-and-estimated-results"
  | "truncate-and-round-values"
  | "analyse-approximation-error-in-contexts"
  | "recognise-repeated-approximation-effects";

export type NumberAssessmentItemDifficulty =
  | "foundation"
  | "developing"
  | "secure"
  | "extension";

export type NumberAssessmentAnswerType =
  | "multiple_choice"
  | "short_answer"
  | "numeric"
  | "worked_response"
  | "explain_or_justify";

export type NumberAssessmentItemFormat =
  | "rounding"
  | "estimation"
  | "truncation"
  | "error_comparison"
  | "applied_context"
  | "reasonableness"
  | "repeated_calculation";

export type NumberAssessmentMisconceptionCode =
  | "rounding-place-value-error"
  | "truncation-vs-rounding-confusion"
  | "decimal-operation-error"
  | "estimated-exact-confusion"
  | "unit-conversion-error"
  | "percentage-or-rate-context-error"
  | "rounding-too-early"
  | "reasonableness-not-checked";

export type NumberAssessmentAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberApproximationProgressionStepKey;
  ifCorrectGoToStepKey?: NumberApproximationProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberAssessmentVisualSupport = {
  type: "none" | "number_line" | "table" | "context_card";
  description?: string;
};

export type NumberAssessmentOpenResponseReview = {
  expectedResponse: string;
  successCriteria: string[];
  parentReviewPrompts: string[];
  aiReviewPrompt?: string;
  evidenceNote?: string;
};

export type NumberAssessmentItem = {
  id: string;
  progressionBandKey: NumberApproximationProgressionBandKey;
  progressionStepKey: NumberApproximationProgressionStepKey;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberAssessmentItemFormat;
  options?: string[];
  expectedAnswer?: string;
  acceptableAnswers?: string[];
  markingGuide?: string;
  workedSolution?: string;
  misconceptionTargets: NumberAssessmentMisconceptionCode[];
  adaptiveRoute: NumberAssessmentAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY: NumberApproximationProgressionBandKey =
  "approximation-estimation-error";

export const NUMBER_APPROXIMATION_ASSESSMENT_ITEMS: NumberAssessmentItem[] = [
  {
    id: "approx-round-decimal-001",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "round-decimals-to-a-required-accuracy",
    title: "Round a decimal to two decimal places",
    prompt: "Round 63.487 to 2 decimal places.",
    difficulty: "foundation",
    answerType: "numeric",
    format: "rounding",
    expectedAnswer: "63.49",
    acceptableAnswers: ["63.49"],
    markingGuide:
      "Award full credit for 63.49. An answer of 63.48 suggests the learner did not round up from the third decimal place.",
    workedSolution:
      "The second decimal place is the 8 in 63.487. Look at the next digit, which is 7. Because 7 is 5 or more, round 63.48 up to 63.49.",
    misconceptionTargets: ["rounding-place-value-error"],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "round-decimals-to-a-required-accuracy",
      ifCorrectGoToStepKey: "estimate-sums-and-products-using-rounding",
      practiceRecommendation:
        "Practise identifying the target decimal place and then checking the next digit before rounding.",
      diagnosticNote:
        "This item checks whether the learner can locate the required place and apply the rounding rule accurately.",
    },
    visualSupport: { type: "none" },
  },
  {
    id: "approx-estimate-sum-002",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "estimate-sums-and-products-using-rounding",
    title: "Estimate a sum by rounding each term",
    prompt: "Estimate 48.3 + 19.7 + 7.8 by rounding each number to the nearest whole number.",
    difficulty: "foundation",
    answerType: "numeric",
    format: "estimation",
    expectedAnswer: "76",
    acceptableAnswers: ["76"],
    markingGuide:
      "Award full credit for 76. The intended rounded values are 48, 20, and 8.",
    workedSolution:
      "Round 48.3 to 48, 19.7 to 20, and 7.8 to 8. Then add 48 + 20 + 8 = 76.",
    misconceptionTargets: ["rounding-place-value-error", "estimated-exact-confusion"],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "round-decimals-to-a-required-accuracy",
      ifCorrectGoToStepKey: "compare-exact-and-estimated-results",
      practiceRecommendation:
        "Practise rounding each value first, then combining the rounded numbers to form the estimate.",
      diagnosticNote:
        "This item checks whether the learner can estimate a sum by applying consistent rounding before adding.",
    },
    visualSupport: { type: "none" },
  },
  {
    id: "approx-truncate-round-003",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "truncate-and-round-values",
    title: "Distinguish truncation from rounding",
    prompt:
      "Which option correctly gives the truncated and rounded values of 18.786 to 1 decimal place?",
    difficulty: "foundation",
    answerType: "multiple_choice",
    format: "truncation",
    options: [
      "Truncated: 18.7, Rounded: 18.8",
      "Truncated: 18.8, Rounded: 18.7",
      "Truncated: 18.8, Rounded: 18.8",
      "Truncated: 18.7, Rounded: 18.7",
    ],
    expectedAnswer: "Truncated: 18.7, Rounded: 18.8",
    acceptableAnswers: ["Truncated: 18.7, Rounded: 18.8"],
    markingGuide:
      "Award full credit for the option showing truncation as 18.7 and rounding as 18.8.",
    workedSolution:
      "Truncating to 1 decimal place cuts off the digits after 18.7, so the truncated value is 18.7. Rounding to 1 decimal place looks at the next digit, which is 8, so 18.7 rounds up to 18.8.",
    misconceptionTargets: ["truncation-vs-rounding-confusion"],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "truncate-and-round-values",
      ifCorrectGoToStepKey: "compare-exact-and-estimated-results",
      practiceRecommendation:
        "Practise placing truncation and rounding side by side on the same decimals so the difference is visible.",
      diagnosticNote:
        "This item checks whether the learner distinguishes cutting digits off from rounding to the nearest value.",
    },
    visualSupport: {
      type: "table",
      description: "Compare the truncated value with the rounded value.",
    },
  },
  {
    id: "approx-estimate-product-004",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "estimate-sums-and-products-using-rounding",
    title: "Estimate a product with rounded factors",
    prompt: "Estimate 3.84 × 19.6 by rounding each factor to 1 significant figure.",
    difficulty: "developing",
    answerType: "numeric",
    format: "estimation",
    expectedAnswer: "80",
    acceptableAnswers: ["80"],
    markingGuide:
      "Award full credit for 80. The intended rounded factors are 4 and 20.",
    workedSolution:
      "Round 3.84 to 4 and 19.6 to 20. Then estimate 4 × 20 = 80.",
    misconceptionTargets: ["rounding-place-value-error", "decimal-operation-error"],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "estimate-sums-and-products-using-rounding",
      ifCorrectGoToStepKey: "compare-exact-and-estimated-results",
      practiceRecommendation:
        "Practise choosing rounded factors first, then multiplying the simpler values.",
      diagnosticNote:
        "This item checks whether the learner can estimate multiplication by selecting sensible rounded factors.",
    },
    visualSupport: { type: "none" },
  },
  {
    id: "approx-compare-exact-estimate-005",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "compare-exact-and-estimated-results",
    title: "Compare two estimates with an exact value",
    prompt:
      "The exact total is $182.40. Which estimate is closer: $180 or $195?",
    difficulty: "developing",
    answerType: "short_answer",
    format: "error_comparison",
    expectedAnswer: "$180",
    acceptableAnswers: ["180", "$180", "180 dollars", "$180 is closer"],
    markingGuide:
      "Award full credit for identifying $180. Strong responses may note that it is $2.40 away, while $195 is $12.60 away.",
    workedSolution:
      "$180 is closer because it is only $2.40 below the exact total, while $195 is $12.60 above it.",
    misconceptionTargets: ["estimated-exact-confusion", "reasonableness-not-checked"],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "estimate-sums-and-products-using-rounding",
      ifCorrectGoToStepKey: "analyse-approximation-error-in-contexts",
      practiceRecommendation:
        "Practise comparing how far each estimate is from the exact value before deciding which is closer.",
      diagnosticNote:
        "This item checks whether the learner compares estimates by distance from the exact result rather than by appearance.",
    },
    visualSupport: {
      type: "table",
      description: "Look at the exact total and compare which estimate is closer.",
    },
  },
  {
    id: "approx-best-method-006",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "compare-exact-and-estimated-results",
    title: "Choose the best approximation method",
    prompt:
      "A builder wants a quick estimate for the total length of 24 pieces of timber, each 2.48 m long. Which method gives the best quick estimate?",
    difficulty: "developing",
    answerType: "multiple_choice",
    format: "reasonableness",
    options: [
      "Use 24 × 2 = 48 m",
      "Use 20 × 2.5 = 50 m",
      "Use 24 × 2.5 = 60 m",
      "Use 25 × 3 = 75 m",
    ],
    expectedAnswer: "Use 24 × 2.5 = 60 m",
    acceptableAnswers: ["Use 24 × 2.5 = 60 m"],
    markingGuide:
      "Award full credit for the method using 24 × 2.5 = 60 m. It keeps the number of pieces exact and rounds the length sensibly.",
    workedSolution:
      "The exact total is 24 × 2.48 = 59.52 m. Using 24 × 2.5 = 60 m is the best quick estimate because it stays very close to the exact value.",
    misconceptionTargets: [
      "rounding-place-value-error",
      "reasonableness-not-checked",
    ],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "compare-exact-and-estimated-results",
      ifCorrectGoToStepKey: "analyse-approximation-error-in-contexts",
      practiceRecommendation:
        "Practise choosing which values to round and which to keep exact when making a quick but useful estimate.",
      diagnosticNote:
        "This item checks whether the learner selects an estimation method that preserves the most important quantity in context.",
    },
    visualSupport: {
      type: "context_card",
      description:
        "Timber lengths for comparing which quick estimate is the most sensible.",
    },
  },
  {
    id: "approx-money-context-007",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "analyse-approximation-error-in-contexts",
    title: "Estimate a repeated money total",
    prompt:
      "A club saves $47.60 each month for 9 months. Which is the best estimate of the total savings?",
    difficulty: "developing",
    answerType: "multiple_choice",
    format: "applied_context",
    options: ["$360", "$430", "$480", "$900"],
    expectedAnswer: "$430",
    acceptableAnswers: ["$430"],
    markingGuide:
      "Award full credit for $430. The exact total is $428.40, so $430 is the closest estimate.",
    workedSolution:
      "A sensible estimate is 48 × 9 = 432, which is close to $430. The exact total is $47.60 × 9 = $428.40, so $430 is the best estimate shown.",
    misconceptionTargets: [
      "percentage-or-rate-context-error",
      "estimated-exact-confusion",
      "reasonableness-not-checked",
    ],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "estimate-sums-and-products-using-rounding",
      ifCorrectGoToStepKey: "analyse-approximation-error-in-contexts",
      practiceRecommendation:
        "Practise rounding money amounts to nearby friendly numbers and checking whether the estimate still matches the context.",
      diagnosticNote:
        "This item checks whether the learner can make a practical estimate in a repeated money context and judge which option is sensible.",
    },
    visualSupport: {
      type: "context_card",
      description:
        "Monthly saving amount and number of months for judging the best estimate.",
    },
  },
  {
    id: "approx-reasonableness-008",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "compare-exact-and-estimated-results",
    title: "Explain whether an estimate is reasonable",
    prompt:
      "A student estimates 19.8 × 6.1 as 20 × 6 = 120. Is the estimate reasonable? Explain.",
    difficulty: "secure",
    answerType: "explain_or_justify",
    format: "reasonableness",
    expectedAnswer: "Yes, it is reasonable.",
    acceptableAnswers: [
      "Yes, it is reasonable.",
      "Yes, because the exact answer is close to 120.",
      "Yes, it is a slight underestimate but still close.",
    ],
    markingGuide:
      "Award full credit for explaining that the estimate is reasonable because the exact product is close to 120. Strong responses note that 19.8 is close to 20 and 6.1 is close to 6, and the exact answer is 120.78.",
    workedSolution:
      "The estimate is reasonable. The exact product is 19.8 × 6.1 = 120.78, so the estimate of 120 is only 0.78 away and is a slight underestimate.",
    misconceptionTargets: ["estimated-exact-confusion", "reasonableness-not-checked"],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "compare-exact-and-estimated-results",
      ifCorrectGoToStepKey: "analyse-approximation-error-in-contexts",
      practiceRecommendation:
        "Practise checking an estimate against the size of the exact answer and explaining whether the difference matters.",
      diagnosticNote:
        "This item checks whether the learner can judge the usefulness of an estimate rather than only compute it.",
    },
    visualSupport: { type: "none" },
    openResponseReview: {
      expectedResponse:
        "Yes. The estimate is reasonable because 19.8 is close to 20 and 6.1 is close to 6, so 20 x 6 should be close to the exact product. The exact product is 120.78, so the estimate is only a little low.",
      successCriteria: [
        "States that the estimate is reasonable.",
        "Identifies the rounded values used in the estimate.",
        "Explains why the rounded values are close to the originals.",
        "Optionally compares the estimate with the exact product.",
      ],
      parentReviewPrompts: [
        "Can the learner explain why 19.8 was treated like 20 and 6.1 like 6?",
        "Can the learner say whether the estimate is slightly high or low?",
        "Can the learner connect the estimate to the exact product or its size?",
      ],
      aiReviewPrompt:
        "Review the learner response against the success criteria. Suggest whether it appears secure, developing, or needs support. Do not make the final judgement; provide a parent-facing recommendation.",
      evidenceNote:
        "The learner judged whether an estimate was reasonable by comparing rounded values with the original multiplication.",
    },
  },
  {
    id: "approx-rounding-too-early-009",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "recognise-repeated-approximation-effects",
    title: "Recognise when rounding too early changes an answer",
    prompt:
      "Two students calculate 1.24 + 1.24 + 1.24. Student A rounds each number to 1 decimal place first. Student B adds first, then rounds the total to 1 decimal place. Which statement is correct?",
    difficulty: "secure",
    answerType: "multiple_choice",
    format: "repeated_calculation",
    options: [
      "Student A gets 3.6 and Student B gets 3.7",
      "Student A gets 3.7 and Student B gets 3.6",
      "Both students get 3.6",
      "Both students get 3.7",
    ],
    expectedAnswer: "Student A gets 3.6 and Student B gets 3.7",
    acceptableAnswers: ["Student A gets 3.6 and Student B gets 3.7"],
    markingGuide:
      "Award full credit for the option showing that early rounding changes the result.",
    workedSolution:
      "Student A rounds each 1.24 to 1.2, so the total is 1.2 + 1.2 + 1.2 = 3.6. Student B adds first: 1.24 + 1.24 + 1.24 = 3.72, then rounds to 1 decimal place to get 3.7. Rounding too early changed the final answer.",
    misconceptionTargets: ["rounding-too-early", "estimated-exact-confusion"],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "truncate-and-round-values",
      ifCorrectGoToStepKey: "analyse-approximation-error-in-contexts",
      practiceRecommendation:
        "Practise comparing 'round first' and 'round last' on the same calculation so the effect of early rounding becomes visible.",
      diagnosticNote:
        "This item checks whether the learner notices that repeated early rounding can shift a final result.",
    },
    visualSupport: {
      type: "table",
      description: "Compare Student A's method with Student B's method side by side.",
    },
  },
  {
    id: "approx-measurement-context-010",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "analyse-approximation-error-in-contexts",
    title: "Analyse approximation in an area estimate",
    prompt:
      "A path is 18.7 m long and 2.9 m wide. A gardener estimates the area as 19 × 3 = 57 m^2. Is the estimate an overestimate or an underestimate? About how much?",
    difficulty: "secure",
    answerType: "worked_response",
    format: "applied_context",
    expectedAnswer: "Overestimate by about 2.77 m^2",
    acceptableAnswers: [
      "Overestimate by about 2.8 m^2",
      "Overestimate by about 2.77 m^2",
      "It is an overestimate by roughly 3 square metres",
    ],
    markingGuide:
      "Award full credit for identifying that the estimate is too high and for giving a difference close to 2.77 m^2.",
    workedSolution:
      "The exact area is 18.7 × 2.9 = 54.23 m^2. The estimate is 57 m^2, so the estimate is an overestimate by 57 - 54.23 = 2.77 m^2.",
    misconceptionTargets: [
      "unit-conversion-error",
      "estimated-exact-confusion",
      "reasonableness-not-checked",
    ],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "compare-exact-and-estimated-results",
      ifCorrectGoToStepKey: "recognise-repeated-approximation-effects",
      practiceRecommendation:
        "Practise comparing estimated and exact areas in measurement contexts and describing whether the estimate is high or low.",
      diagnosticNote:
        "This item checks whether the learner can interpret approximation error in a practical measurement context.",
    },
    visualSupport: {
      type: "context_card",
      description:
        "Path dimensions and the gardener's estimate for comparing whether the estimate is high or low.",
    },
    openResponseReview: {
      expectedResponse:
        "The estimate is an overestimate. The exact area is 18.7 x 2.9 = 54.23 m^2, so 57 m^2 is about 2.77 m^2 too high.",
      successCriteria: [
        "Identifies the estimate as too high.",
        "Finds or refers to the exact area.",
        "Calculates or estimates the size of the difference.",
        "Uses square-metre language appropriately.",
      ],
      parentReviewPrompts: [
        "Can the learner explain why rounding both measurements up makes the area larger?",
        "Can the learner compare the estimate with the exact area?",
        "Can the learner describe the error using area units?",
      ],
      aiReviewPrompt:
        "Review the learner response against the success criteria. Suggest whether it appears secure, developing, or needs support. Do not make the final judgement; provide a parent-facing recommendation.",
      evidenceNote:
        "The learner analysed whether a measured area estimate was too high or too low and described the size of the error.",
    },
  },
  {
    id: "approx-circumference-context-011",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "analyse-approximation-error-in-contexts",
    title: "Compare a circumference estimate with the calculated value",
    prompt:
      "A student estimates the circumference of a circular planter with diameter 9.7 m by using 10 m and pi ≈ 3.14. They get 31.4 m. Using the original diameter with pi ≈ 3.14, is the estimate too high or too low? By about how much?",
    difficulty: "extension",
    answerType: "worked_response",
    format: "error_comparison",
    expectedAnswer: "Too high by about 0.94 m",
    acceptableAnswers: [
      "Too high by about 0.94 m",
      "Overestimate by about 0.94 m",
      "Too high by about 1 m",
    ],
    markingGuide:
      "Award full credit for identifying the estimate as too high and for giving a difference close to 0.94 m.",
    workedSolution:
      "Using the original diameter gives 3.14 × 9.7 = 30.458 m. The estimate was 31.4 m, so it is too high by 31.4 - 30.458 = 0.942 m, which is about 0.94 m.",
    misconceptionTargets: [
      "unit-conversion-error",
      "estimated-exact-confusion",
      "reasonableness-not-checked",
    ],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "analyse-approximation-error-in-contexts",
      ifCorrectGoToStepKey: "recognise-repeated-approximation-effects",
      practiceRecommendation:
        "Practise checking whether rounded geometric measurements create an overestimate or an underestimate before comparing the size of the error.",
      diagnosticNote:
        "This item checks whether the learner can compare an estimated geometric value with a calculation based on the original measurement.",
    },
    visualSupport: {
      type: "context_card",
      description: "Compare the rounded diameter method with the original diameter calculation.",
    },
    openResponseReview: {
      expectedResponse:
        "The estimate is too high. Using the original diameter gives 3.14 x 9.7 = 30.458 m, so 31.4 m is about 0.94 m too high.",
      successCriteria: [
        "Identifies the estimate as too high.",
        "Uses the original diameter in the calculation.",
        "Finds or estimates the difference between the two values.",
        "Explains the effect of rounding the diameter up.",
      ],
      parentReviewPrompts: [
        "Can the learner explain why replacing 9.7 with 10 changes the circumference upward?",
        "Can the learner compare the estimate with the value from the original diameter?",
        "Can the learner describe the error in metres?",
      ],
      aiReviewPrompt:
        "Review the learner response against the success criteria. Suggest whether it appears secure, developing, or needs support. Do not make the final judgement; provide a parent-facing recommendation.",
      evidenceNote:
        "The learner compared an estimated circumference with a calculation from the original measurement and explained the resulting error.",
    },
  },
  {
    id: "approx-repeated-calculation-012",
    progressionBandKey: NUMBER_APPROXIMATION_PROGRESSION_BAND_KEY,
    progressionStepKey: "recognise-repeated-approximation-effects",
    title: "Reason about repeated rounding in a financial model",
    prompt:
      "A savings app starts with $249.50 and adds 2.6% interest each year for 3 years. One method rounds to the nearest dollar at the end of each year. Another keeps decimals until the end. Which method gives the larger final balance, and why?",
    difficulty: "extension",
    answerType: "explain_or_justify",
    format: "repeated_calculation",
    expectedAnswer:
      "Rounding each year gives the larger final balance because the rounded-up amount is used again in the next year.",
    acceptableAnswers: [
      "Rounding each year gives the larger final balance because the rounded-up amount is used again in the next year.",
      "The year-by-year rounding method is larger because it rounds up earlier and that larger value carries forward.",
    ],
    markingGuide:
      "Award full credit for identifying the year-by-year rounding method as larger and for explaining that the rounded amount becomes the next starting balance.",
    workedSolution:
      "Keeping decimals gives 249.50 × 1.026 × 1.026 × 1.026 ≈ 269.47, which rounds to $269 at the end. Rounding each year gives about $256 after year 1, $263 after year 2, and $270 after year 3. The year-by-year method is larger because the rounded balance becomes the starting amount for the next calculation.",
    misconceptionTargets: [
      "rounding-too-early",
      "percentage-or-rate-context-error",
      "reasonableness-not-checked",
    ],
    adaptiveRoute: {
      ifIncorrectGoToStepKey: "analyse-approximation-error-in-contexts",
      practiceRecommendation:
        "Practise comparing 'round each step' and 'round at the end' in repeated calculations so the cumulative effect becomes visible.",
      diagnosticNote:
        "This item checks whether the learner recognises that repeated approximation choices can change a long-running result.",
    },
    visualSupport: {
      type: "context_card",
      description: "Compare the year-by-year rounding method with the keep-decimals-until-the-end method.",
    },
    openResponseReview: {
      expectedResponse:
        "Rounding each year gives the larger final balance because the rounded amount becomes the next starting balance, so the small increase carries forward each year.",
      successCriteria: [
        "Identifies which method gives the larger final balance.",
        "Explains that the rounded balance is reused in the next step.",
        "Describes the cumulative effect across multiple years.",
        "Connects the explanation to the financial context.",
      ],
      parentReviewPrompts: [
        "Can the learner explain what happens when a rounded value is reused in the next year?",
        "Can the learner describe why repeated rounding changes the final balance?",
        "Can the learner compare the two methods without needing every exact step?",
      ],
      aiReviewPrompt:
        "Review the learner response against the success criteria. Suggest whether it appears secure, developing, or needs support. Do not make the final judgement; provide a parent-facing recommendation.",
      evidenceNote:
        "The learner explained how repeated rounding choices can change a long-running financial calculation.",
    },
  },
];

export function getNumberApproximationAssessmentItemById(id: string) {
  return NUMBER_APPROXIMATION_ASSESSMENT_ITEMS.find((item) => item.id === id) || null;
}

export function getNumberApproximationAssessmentItemsByStep(
  stepKey: NumberApproximationProgressionStepKey,
) {
  return NUMBER_APPROXIMATION_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberApproximationAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_APPROXIMATION_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}
