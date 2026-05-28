import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

const NUMBER_APPROXIMATION_ITEM_BANK_KEY =
  "number-approximation-assessment-items-v1";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_APPROXIMATION_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-approximation-practice-module-v1",
  progressionBandKey: "approximation-estimation-error",
  title: "Approximation, estimation and error",
  shortTitle: "Approximation and error",
  description:
    "Practise rounding, truncation, estimation, exact versus estimated comparisons, and error reasoning.",
  yearBandLabel: "Years 7-10",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "years-9-10-consolidation",
  stepKey: "approximation-estimation-error",
  pathwayStepId:
    "mathematics::number-and-place-value::years-9-10-consolidation::approximation-estimation-error",
  relatedAssessmentBankKey: NUMBER_APPROXIMATION_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Approximation helps you decide whether an answer is close enough for the context. Rounding changes a number to a nearby simpler value, while truncation cuts digits off without rounding.",
    keyLanguage: [
      "rounding",
      "truncation",
      "estimate",
      "exact value",
      "approximation",
      "error",
      "reasonableness",
      "significant figure",
      "decimal place",
    ],
    workedExample:
      "For 18.786 to 1 decimal place, truncation gives 18.7 because the extra digits are cut off. Rounding gives 18.8 because the next digit is 8, so 18.7 rounds up.",
    parentTip:
      "This module is about judging whether an answer is close enough for the situation, not just calculating. Ask whether the estimate is sensible, too high, too low, or accurate enough for the context.",
  },
  sections: [
    {
      id: "rounding-and-truncation",
      type: "understanding",
      title: "Rounding and truncation",
      learnerGoal:
        "I can distinguish rounding from truncating and use place-value accuracy correctly.",
      tasks: [
        {
          id: "rounding-and-truncation-round-decimal",
          title: "Round to two decimal places",
          prompt: "Round 42.386 to 2 decimal places.",
          taskType: "numeric",
          expectedAnswer: "42.39",
          acceptableAnswers: ["42.39"],
          workedSolution:
            "The second decimal place is the 8 in 42.386. The next digit is 6, so round 42.38 up to 42.39.",
          supportPrompt:
            "Circle the required decimal place first, then look at the digit immediately after it.",
          misconceptionTargets: ["rounding-place-value-error"],
          relatedAssessmentItemIds: ["approx-round-decimal-001"],
        },
        {
          id: "rounding-and-truncation-truncate-decimal",
          title: "Truncate to one decimal place",
          prompt: "Truncate 18.786 to 1 decimal place.",
          taskType: "numeric",
          expectedAnswer: "18.7",
          acceptableAnswers: ["18.7"],
          workedSolution:
            "Truncating means cutting off extra digits without rounding. Keep 18.7 and remove the remaining digits.",
          supportPrompt:
            "Do not look at whether the next digit is 5 or more. That rule belongs to rounding, not truncation.",
          misconceptionTargets: ["truncation-vs-rounding-confusion"],
          relatedAssessmentItemIds: ["approx-truncate-round-003"],
        },
        {
          id: "rounding-and-truncation-compare-methods",
          title: "Compare rounding and truncation",
          prompt:
            "For 7.962 to 1 decimal place, which statement is correct?",
          taskType: "multiple_choice",
          options: [
            "Truncating gives 7.9 and rounding gives 8.0.",
            "Truncating gives 8.0 and rounding gives 7.9.",
            "Both methods give 7.9.",
            "Both methods give 8.0.",
          ],
          expectedAnswer: "Truncating gives 7.9 and rounding gives 8.0.",
          acceptableAnswers: ["Truncating gives 7.9 and rounding gives 8.0."],
          workedSolution:
            "Truncation cuts after 7.9. Rounding checks the next digit, 6, so 7.9 rounds up to 8.0.",
          supportPrompt:
            "Write the two methods side by side: cut off for truncation, check the next digit for rounding.",
          misconceptionTargets: [
            "truncation-vs-rounding-confusion",
            "rounding-place-value-error",
          ],
          relatedAssessmentItemIds: [
            "approx-truncate-round-003",
            "approx-rounding-too-early-009",
          ],
        },
      ],
    },
    {
      id: "estimation-with-operations",
      type: "fluency",
      title: "Estimation with operations",
      learnerGoal:
        "I can estimate sums, products and practical calculations using sensible rounded values.",
      tasks: [
        {
          id: "estimation-with-operations-estimate-sum",
          title: "Estimate a sum",
          prompt: "Estimate 28.4 + 51.8 + 9.6 by rounding to whole numbers first.",
          taskType: "numeric",
          expectedAnswer: "90",
          acceptableAnswers: ["90"],
          workedSolution:
            "28.4 rounds to 28, 51.8 rounds to 52, and 9.6 rounds to 10. Then 28 + 52 + 10 = 90.",
          supportPrompt:
            "Round each number first, then add the rounded values.",
          misconceptionTargets: [
            "rounding-place-value-error",
            "estimated-exact-confusion",
          ],
          relatedAssessmentItemIds: ["approx-estimate-sum-002"],
        },
        {
          id: "estimation-with-operations-estimate-product",
          title: "Estimate a product",
          prompt:
            "Which quick estimate is best for 4.12 x 18.9 using 1 significant figure?",
          taskType: "multiple_choice",
          options: ["4 x 20 = 80", "4 x 10 = 40", "5 x 20 = 100", "4.12 x 19 = 78.28"],
          expectedAnswer: "4 x 20 = 80",
          acceptableAnswers: ["4 x 20 = 80"],
          workedSolution:
            "4.12 rounds to 4 and 18.9 rounds to 20, so the quick estimate is 4 x 20 = 80.",
          supportPrompt:
            "For a 1 significant figure estimate, round each factor to one non-zero digit.",
          misconceptionTargets: [
            "rounding-place-value-error",
            "decimal-operation-error",
          ],
          relatedAssessmentItemIds: ["approx-estimate-product-004"],
        },
        {
          id: "estimation-with-operations-method-choice",
          title: "Choose a sensible method",
          prompt:
            "A subscription costs $47.60 each month for 9 months. Which estimate is sensible?",
          taskType: "multiple_choice",
          options: [
            "Use 48 x 9, giving about $432.",
            "Use 40 x 9, giving about $360.",
            "Use 50 x 20, giving about $1000.",
            "Use 47.60 + 9, giving about $57.",
          ],
          expectedAnswer: "Use 48 x 9, giving about $432.",
          acceptableAnswers: ["Use 48 x 9, giving about $432."],
          workedSolution:
            "$47.60 is close to $48, and the number of months stays 9. The estimate is 48 x 9 = 432.",
          supportPrompt:
            "Keep the repeated count accurate and round the money amount to a nearby friendly value.",
          misconceptionTargets: [
            "percentage-or-rate-context-error",
            "reasonableness-not-checked",
          ],
          relatedAssessmentItemIds: ["approx-money-context-007"],
        },
      ],
    },
    {
      id: "exact-vs-estimated-comparison",
      type: "problem_solving",
      title: "Exact versus estimated comparison",
      learnerGoal:
        "I can compare exact and estimated values and decide which estimate is closer.",
      tasks: [
        {
          id: "exact-vs-estimated-comparison-closest-estimate",
          title: "Choose the closer estimate",
          prompt:
            "The exact total is $182.40. Which estimate is closer: $180 or $195?",
          taskType: "multiple_choice",
          options: ["$180", "$195"],
          expectedAnswer: "$180",
          acceptableAnswers: ["$180", "180"],
          workedSolution:
            "$180 is $2.40 away from the exact total. $195 is $12.60 away, so $180 is closer.",
          supportPrompt:
            "Find the distance from each estimate to the exact value, then compare the distances.",
          misconceptionTargets: [
            "estimated-exact-confusion",
            "reasonableness-not-checked",
          ],
          relatedAssessmentItemIds: ["approx-compare-exact-estimate-005"],
        },
        {
          id: "exact-vs-estimated-comparison-order-closeness",
          title: "Order estimates by closeness",
          prompt:
            "The exact value is 54.23. Write these estimates from closest to furthest: 54, 57, 50.",
          taskType: "short_answer",
          expectedAnswer: "54, 57, 50",
          acceptableAnswers: ["54, 57, 50", "54 57 50", "54 then 57 then 50"],
          workedSolution:
            "54 is 0.23 away, 57 is 2.77 away, and 50 is 4.23 away. So the order is 54, 57, 50.",
          supportPrompt:
            "Subtract each estimate from the exact value and compare the sizes of the differences.",
          misconceptionTargets: [
            "estimated-exact-confusion",
            "reasonableness-not-checked",
          ],
          relatedAssessmentItemIds: ["approx-measurement-context-010"],
        },
        {
          id: "exact-vs-estimated-comparison-context-useful",
          title: "Decide whether an estimate is useful",
          prompt:
            "A planter circumference is estimated as 31.4 m, and the value from the original measurement is 30.458 m. Is the estimate useful for a quick check?",
          taskType: "multiple_choice",
          options: [
            "Yes, because the estimate is less than 1 m away.",
            "No, because every estimate must equal the exact value.",
            "No, because circumference cannot be estimated.",
            "Yes, because all rounded answers are exact.",
          ],
          expectedAnswer: "Yes, because the estimate is less than 1 m away.",
          acceptableAnswers: ["Yes, because the estimate is less than 1 m away."],
          workedSolution:
            "31.4 - 30.458 = 0.942 m, so the estimate is less than 1 m away. That is useful for a quick reasonableness check.",
          supportPrompt:
            "Useful estimates do not have to be exact. They need to be close enough for the purpose.",
          misconceptionTargets: [
            "estimated-exact-confusion",
            "unit-conversion-error",
            "reasonableness-not-checked",
          ],
          relatedAssessmentItemIds: ["approx-circumference-context-011"],
        },
      ],
    },
    {
      id: "error-and-repeated-approximation",
      type: "reasoning",
      title: "Error and repeated approximation",
      learnerGoal:
        "I can reason about approximation error, early rounding and repeated rounding effects.",
      tasks: [
        {
          id: "error-and-repeated-approximation-high-low",
          title: "Identify high or low error",
          prompt:
            "A path area is estimated as 19 x 3 = 57 m^2. The exact area is 54.23 m^2. Is the estimate too high or too low?",
          taskType: "multiple_choice",
          options: ["Too high", "Too low", "Exactly equal"],
          expectedAnswer: "Too high",
          acceptableAnswers: ["Too high", "too high"],
          workedSolution:
            "57 is greater than 54.23, so the estimate is too high by 57 - 54.23 = 2.77 m^2.",
          supportPrompt:
            "Compare the estimate directly with the exact value before finding the difference.",
          misconceptionTargets: [
            "estimated-exact-confusion",
            "reasonableness-not-checked",
          ],
          relatedAssessmentItemIds: ["approx-measurement-context-010"],
        },
        {
          id: "error-and-repeated-approximation-round-first-last",
          title: "Compare round-first and round-last",
          prompt:
            "Three values of 1.24 are added. Which method is more accurate: round each value first, or add first and round the total?",
          taskType: "multiple_choice",
          options: [
            "Add first and round the total.",
            "Round each value first.",
            "Both methods must be equally accurate.",
            "Neither method can be compared.",
          ],
          expectedAnswer: "Add first and round the total.",
          acceptableAnswers: ["Add first and round the total."],
          workedSolution:
            "Rounding first gives 1.2 + 1.2 + 1.2 = 3.6. Adding first gives 3.72, which rounds to 3.7. Keeping precision until the end is more accurate.",
          supportPrompt:
            "Do both methods side by side and compare them with the unrounded total.",
          misconceptionTargets: [
            "rounding-too-early",
            "estimated-exact-confusion",
          ],
          relatedAssessmentItemIds: ["approx-rounding-too-early-009"],
        },
        {
          id: "error-and-repeated-approximation-accumulated-error",
          title: "Recognise accumulated error",
          prompt:
            "Why can rounding after each year in a savings calculation change the final balance?",
          taskType: "multiple_choice",
          options: [
            "Because each rounded balance becomes the starting value for the next year.",
            "Because rounding always makes every answer smaller.",
            "Because percentages cannot be estimated.",
            "Because repeated calculations ignore place value.",
          ],
          expectedAnswer:
            "Because each rounded balance becomes the starting value for the next year.",
          acceptableAnswers: [
            "Because each rounded balance becomes the starting value for the next year.",
          ],
          workedSolution:
            "In a repeated calculation, the rounded value is reused. A small rounding change can carry forward and affect later steps.",
          supportPrompt:
            "Look for whether the rounded result is used again in the next calculation.",
          misconceptionTargets: [
            "rounding-too-early",
            "percentage-or-rate-context-error",
            "reasonableness-not-checked",
          ],
          relatedAssessmentItemIds: ["approx-repeated-calculation-012"],
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-rounding-truncation",
      title: "Mini Check: rounding and truncation",
      prompt:
        "Truncate 9.876 to 2 decimal places, then round 9.876 to 2 decimal places. Write both answers.",
      taskType: "short_answer",
      expectedAnswer: "9.87, 9.88",
      acceptableAnswers: [
        "9.87, 9.88",
        "truncated 9.87, rounded 9.88",
        "9.87 and 9.88",
      ],
      workedSolution:
        "Truncating cuts off after 9.87. Rounding checks the next digit, 6, so 9.87 rounds up to 9.88.",
      supportPrompt:
        "Remember: truncation cuts; rounding checks the next digit.",
      misconceptionTargets: [
        "truncation-vs-rounding-confusion",
        "rounding-place-value-error",
      ],
      relatedAssessmentItemIds: ["approx-truncate-round-003"],
    },
    {
      id: "mini-check-estimation-with-operations",
      title: "Mini Check: estimation with operations",
      prompt: "Estimate 6.18 x 31.2 using 1 significant figure for each factor.",
      taskType: "numeric",
      expectedAnswer: "180",
      acceptableAnswers: ["180"],
      workedSolution:
        "6.18 rounds to 6 and 31.2 rounds to 30. Then 6 x 30 = 180.",
      supportPrompt:
        "Round each factor to one significant figure before multiplying.",
      misconceptionTargets: [
        "rounding-place-value-error",
        "decimal-operation-error",
      ],
      relatedAssessmentItemIds: ["approx-estimate-product-004"],
    },
    {
      id: "mini-check-exact-estimated-comparison",
      title: "Mini Check: exact versus estimated",
      prompt:
        "The exact value is 120.78. Which estimate is closer: 120 or 125?",
      taskType: "multiple_choice",
      options: ["120", "125"],
      expectedAnswer: "120",
      acceptableAnswers: ["120"],
      workedSolution:
        "120 is 0.78 away from the exact value, while 125 is 4.22 away. So 120 is closer.",
      supportPrompt:
        "Compare distance from the exact value, not just which number looks larger.",
      misconceptionTargets: [
        "estimated-exact-confusion",
        "reasonableness-not-checked",
      ],
      relatedAssessmentItemIds: ["approx-reasonableness-008"],
    },
    {
      id: "mini-check-error-repeated-approximation",
      title: "Mini Check: repeated approximation",
      prompt:
        "True or false: rounding after every step in a repeated calculation can change the final result.",
      taskType: "multiple_choice",
      options: ["True", "False"],
      expectedAnswer: "True",
      acceptableAnswers: ["True", "true"],
      workedSolution:
        "True. Each rounded value may be used in the next step, so the rounding error can accumulate.",
      supportPrompt:
        "Ask whether a rounded answer is being reused later.",
      misconceptionTargets: [
        "rounding-too-early",
        "reasonableness-not-checked",
      ],
      relatedAssessmentItemIds: ["approx-repeated-calculation-012"],
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised approximation, estimation and error. They worked on rounding and truncation, estimating with operations, comparing exact and estimated values, and reasoning about early or repeated rounding effects.",
};

export const NUMBER_APPROXIMATION_PRACTICE_MODULES = Object.freeze([
  NUMBER_APPROXIMATION_PRACTICE_MODULE,
]);

export function getNumberApproximationPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_APPROXIMATION_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberApproximationPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_APPROXIMATION_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
