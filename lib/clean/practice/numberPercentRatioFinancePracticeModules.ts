import {
  NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPercentRatioFinanceAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_PERCENT_RATIO_FINANCE_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-percent-ratio-finance-practice-module-v1",
  progressionBandKey: "percentages-ratio-financial-modelling",
  title: "Percentages, ratio and financial modelling",
  shortTitle: "Percent, ratio and finance",
  description:
    "Practise percentages, ratio sharing, discounts, profit, percentage error and practical financial modelling.",
  yearBandLabel: "Years 6-8",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "years-9-10-consolidation",
  stepKey: "percentages-ratio-financial-modelling",
  pathwayStepId:
    "mathematics::number-and-place-value::years-9-10-consolidation::percentages-ratio-financial-modelling",
  relatedAssessmentBankKey: NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Percentages are parts out of 100, and they connect to decimals and fractions. Ratios compare quantities and can be scaled. In money contexts, discounts, increases, profit, loss and percentage error all depend on choosing the right original or actual value.",
    keyLanguage: [
      "percentage",
      "fraction",
      "decimal",
      "ratio",
      "scale factor",
      "discount",
      "sale price",
      "increase",
      "decrease",
      "profit",
      "percentage error",
      "actual value",
      "estimated value",
      "financial model",
    ],
    workedExample:
      "20% off $90 means the discount is 20% of $90, which is $18. The sale price is $90 - $18 = $72. If an estimate is 54 and the actual value is 60, the error is 6 and the percentage error is 6 / 60 = 10%.",
    parentTip:
      "This module helps learners make sense of percentages and ratios in real contexts, especially money, discounts, comparisons and estimates.",
  },
  sections: [
    {
      id: "percentage-of-quantities",
      type: "understanding",
      title: "Percentage of quantities",
      learnerGoal:
        "I can find percentages of quantities and connect percentages with fractions and decimals.",
      tasks: [
        {
          id: "percentage-of-quantities-find-amount",
          title: "Find a percentage of an amount",
          prompt: "Find 15% of 200.",
          taskType: "numeric",
          expectedAnswer: "30",
          acceptableAnswers: ["30"],
          workedSolution:
            "10% of 200 is 20 and 5% is 10, so 15% is 20 + 10 = 30.",
          supportPrompt:
            "Break 15% into benchmark percentages: 10% and 5%.",
          misconceptionTargets: [
            "percentage-of-quantity-error",
            "percent-as-whole-number-error",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-percentage-quantity-002",
          ],
        },
        {
          id: "percentage-of-quantities-match-forms",
          title: "Match percentage forms",
          prompt:
            "Match 25%, 10%, and 75% to equivalent fractions and decimals.",
          taskType: "sort_or_match",
          expectedAnswer:
            "25% = 0.25 = 1/4; 10% = 0.10 = 1/10; 75% = 0.75 = 3/4",
          acceptableAnswers: [
            "25% = 0.25 = 1/4; 10% = 0.10 = 1/10; 75% = 0.75 = 3/4",
          ],
          workedSolution:
            "Percent means out of 100. Simplify each fraction and write the decimal form.",
          supportPrompt:
            "Start by writing each percentage as a fraction over 100.",
          misconceptionTargets: [
            "percentage-fraction-decimal-equivalence-error",
            "percent-as-whole-number-error",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-equivalence-match-001",
          ],
        },
        {
          id: "percentage-of-quantities-fill-gap",
          title: "Complete an equivalent statement",
          prompt: "Complete the missing value: 40% = 0.4 = __/10.",
          taskType: "numeric",
          expectedAnswer: "4",
          acceptableAnswers: ["4", "4/10"],
          workedSolution:
            "40% is 40 out of 100, which is 0.4 or 4 tenths.",
          supportPrompt:
            "Read 0.4 as four tenths.",
          misconceptionTargets: [
            "percentage-fraction-decimal-equivalence-error",
            "percent-as-whole-number-error",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-equivalent-select-003",
          ],
        },
      ],
    },
    {
      id: "ratio-sharing-and-scaling",
      type: "fluency",
      title: "Ratio sharing and scaling",
      learnerGoal:
        "I can divide and scale quantities using ratio relationships.",
      tasks: [
        {
          id: "ratio-sharing-and-scaling-share-total",
          title: "Share an amount in a ratio",
          prompt: "Share $96 in the ratio 1:3. What are the two shares?",
          taskType: "short_answer",
          expectedAnswer: "$24 and $72",
          acceptableAnswers: ["$24 and $72", "24 and 72", "$24, $72"],
          workedSolution:
            "1 + 3 = 4 parts. One part is $96 / 4 = $24, so the shares are $24 and $72.",
          supportPrompt:
            "Add the ratio parts first, then find one part.",
          misconceptionTargets: [
            "ratio-sharing-total-error",
            "ratio-part-whole-confusion",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-ratio-working-006",
          ],
        },
        {
          id: "ratio-sharing-and-scaling-scale-ratio",
          title: "Scale a ratio",
          prompt: "Scale the ratio 2:3 so that the first part is 8.",
          taskType: "short_answer",
          expectedAnswer: "8:12",
          acceptableAnswers: ["8:12", "8 to 12"],
          workedSolution:
            "The first part was multiplied by 4, so multiply the second part by 4 too: 3 x 4 = 12.",
          supportPrompt:
            "Use the same scale factor for both parts.",
          misconceptionTargets: ["ratio-scaling-error"],
          relatedAssessmentItemIds: ["percent-ratio-finance-ratio-scale-004"],
        },
        {
          id: "ratio-sharing-and-scaling-correct-working",
          title: "Choose correct ratio working",
          prompt: "Which working correctly shares 40 in the ratio 2:3?",
          taskType: "multiple_choice",
          options: [
            "2 + 3 = 5 parts, 40 / 5 = 8, so the shares are 16 and 24.",
            "40 / 3 = 13.33, so the shares are 13.33 and 26.67.",
            "There are two numbers in the ratio, so each share is 20.",
            "3 - 2 = 1, so one share is 40.",
          ],
          expectedAnswer:
            "2 + 3 = 5 parts, 40 / 5 = 8, so the shares are 16 and 24.",
          acceptableAnswers: [
            "2 + 3 = 5 parts, 40 / 5 = 8, so the shares are 16 and 24.",
          ],
          workedSolution:
            "The ratio has 5 total parts. One part is 8, so 2 parts are 16 and 3 parts are 24.",
          supportPrompt:
            "Find total parts before finding the value of one part.",
          misconceptionTargets: [
            "ratio-sharing-total-error",
            "ratio-part-whole-confusion",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-ratio-fill-gap-005",
            "percent-ratio-finance-ratio-working-006",
          ],
        },
      ],
    },
    {
      id: "discounts-profit-and-financial-change",
      type: "problem_solving",
      title: "Discounts, profit and financial change",
      learnerGoal:
        "I can reason about discounts, sale prices, percentage change, profit and loss.",
      tasks: [
        {
          id: "discounts-profit-financial-change-sale-price",
          title: "Calculate a sale price",
          prompt: "A $90 jacket is reduced by 20%. What is the sale price?",
          taskType: "numeric",
          expectedAnswer: "72",
          acceptableAnswers: ["72", "$72"],
          workedSolution:
            "20% of $90 is $18. The sale price is $90 - $18 = $72.",
          supportPrompt:
            "Find the discount amount first, then subtract it.",
          misconceptionTargets: [
            "discount-vs-final-price-confusion",
            "percentage-of-quantity-error",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-discount-sale-price-007",
          ],
        },
        {
          id: "discounts-profit-financial-change-classify",
          title: "Classify financial changes",
          prompt:
            "Classify these as increase, decrease/discount, profit, or loss: rent rises by 8%; coat is 30% off; bought for $80 and sold for $92; bought for $50 and sold for $45.",
          taskType: "sort_or_match",
          expectedAnswer:
            "rent increase; coat decrease or discount; $80 to $92 profit; $50 to $45 loss",
          acceptableAnswers: [
            "rent increase; coat decrease or discount; $80 to $92 profit; $50 to $45 loss",
          ],
          workedSolution:
            "A rise is an increase, a discount is a decrease, selling above cost is profit, and selling below cost is loss.",
          supportPrompt:
            "Decide whether the value goes up, down, above cost, or below cost.",
          misconceptionTargets: [
            "profit-loss-direction-error",
            "percentage-increase-decrease-error",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-classify-change-009",
          ],
        },
        {
          id: "discounts-profit-financial-change-explanation",
          title: "Explain a discount misconception",
          prompt: "Which explanation is best: 20% off means pay 20% of the price?",
          taskType: "multiple_choice",
          options: [
            "No. 20% off means subtract 20%, so the customer pays 80% of the original price.",
            "Yes. 20% off always means the final price is 20% of the original price.",
            "No. 20% off means add 20% to the original price.",
            "Yes. Discount and final price are the same thing.",
          ],
          expectedAnswer:
            "No. 20% off means subtract 20%, so the customer pays 80% of the original price.",
          acceptableAnswers: [
            "No. 20% off means subtract 20%, so the customer pays 80% of the original price.",
          ],
          workedSolution:
            "The discount is 20% of the original price. The remaining price is 100% - 20% = 80% of the original.",
          supportPrompt:
            "Separate the discount amount from the final amount paid.",
          misconceptionTargets: [
            "discount-vs-final-price-confusion",
            "percentage-increase-decrease-error",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-discount-order-008",
          ],
        },
      ],
    },
    {
      id: "percentage-error-and-financial-modelling",
      type: "reasoning",
      title: "Percentage error and financial modelling",
      learnerGoal:
        "I can compare estimated and actual values and reason about financial models.",
      tasks: [
        {
          id: "percentage-error-financial-modelling-error",
          title: "Calculate percentage error",
          prompt:
            "An estimate is 54 and the actual value is 60. What is the percentage error?",
          taskType: "numeric",
          expectedAnswer: "10",
          acceptableAnswers: ["10", "10%"],
          workedSolution:
            "The error is 60 - 54 = 6. Percentage error is 6 / 60 = 0.10 = 10%.",
          supportPrompt:
            "Use the actual value as the denominator.",
          misconceptionTargets: [
            "percentage-error-denominator-error",
            "percent-as-whole-number-error",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-error-correction-010",
          ],
        },
        {
          id: "percentage-error-financial-modelling-working",
          title: "Choose percentage error working",
          prompt:
            "Which working correctly finds the percentage error for estimate 18 and actual 20?",
          taskType: "multiple_choice",
          options: [
            "20 - 18 = 2, and 2 / 20 = 10%.",
            "20 - 18 = 2, so the percentage error is 2%.",
            "18 / 20 = 90%, so the percentage error is 90%.",
            "20 / 18 = 111.1%, so the percentage error is 111.1%.",
          ],
          expectedAnswer: "20 - 18 = 2, and 2 / 20 = 10%.",
          acceptableAnswers: ["20 - 18 = 2, and 2 / 20 = 10%."],
          workedSolution:
            "Find the difference, then compare that difference with the actual value.",
          supportPrompt:
            "Percentage error is error amount divided by actual value.",
          misconceptionTargets: ["percentage-error-denominator-error"],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-error-correction-010",
          ],
        },
        {
          id: "percentage-error-financial-modelling-unit-rate",
          title: "Compare financial models",
          prompt:
            "A plan costs $30 for 10 GB and another costs $42 for 14 GB. Which statement is correct?",
          taskType: "multiple_choice",
          options: [
            "Both plans cost $3 per GB, so they have the same unit rate.",
            "The $30 plan is always better because the total cost is lower.",
            "The $42 plan is always better because it gives more data.",
            "The difference in cost means the second plan is $12 per GB.",
          ],
          expectedAnswer:
            "Both plans cost $3 per GB, so they have the same unit rate.",
          acceptableAnswers: [
            "Both plans cost $3 per GB, so they have the same unit rate.",
          ],
          workedSolution:
            "$30 / 10 GB = $3 per GB. $42 / 14 GB = $3 per GB, so the unit rates match.",
          supportPrompt:
            "Compare cost per one GB, not total cost alone.",
          misconceptionTargets: [
            "rate-or-unit-context-error",
            "financial-context-operation-error",
          ],
          relatedAssessmentItemIds: [
            "percent-ratio-finance-modelling-explanation-011",
          ],
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-percentage-of-quantities",
      title: "Mini Check: percentage of quantities",
      prompt: "Find 25% of 160.",
      taskType: "numeric",
      expectedAnswer: "40",
      acceptableAnswers: ["40"],
      workedSolution:
        "25% is one quarter. One quarter of 160 is 40.",
      supportPrompt:
        "Use the benchmark 25% = 1/4.",
      misconceptionTargets: ["percentage-of-quantity-error"],
      relatedAssessmentItemIds: [
        "percent-ratio-finance-percentage-quantity-002",
      ],
    },
    {
      id: "mini-check-ratio-sharing-scaling",
      title: "Mini Check: ratio sharing",
      prompt: "Share 72 in the ratio 3:5. What are the two shares?",
      taskType: "short_answer",
      expectedAnswer: "27 and 45",
      acceptableAnswers: ["27 and 45", "27, 45"],
      workedSolution:
        "3 + 5 = 8 parts. One part is 72 / 8 = 9, so the shares are 27 and 45.",
      supportPrompt:
        "Find the total number of parts first.",
      misconceptionTargets: ["ratio-sharing-total-error"],
      relatedAssessmentItemIds: ["percent-ratio-finance-ratio-working-006"],
    },
    {
      id: "mini-check-financial-change",
      title: "Mini Check: financial change",
      prompt: "An item bought for $80 sells for $92. What is the profit?",
      taskType: "numeric",
      expectedAnswer: "12",
      acceptableAnswers: ["12", "$12"],
      workedSolution:
        "Profit is selling price minus cost price: $92 - $80 = $12.",
      supportPrompt:
        "Profit means the sale price is higher than the cost price.",
      misconceptionTargets: ["profit-loss-direction-error"],
      relatedAssessmentItemIds: [
        "percent-ratio-finance-classify-change-009",
      ],
    },
    {
      id: "mini-check-percentage-error-modelling",
      title: "Mini Check: percentage error",
      prompt: "An estimate is 45 and the actual value is 50. Find the percentage error.",
      taskType: "numeric",
      expectedAnswer: "10",
      acceptableAnswers: ["10", "10%"],
      workedSolution:
        "The error is 5. Percentage error is 5 / 50 = 0.10 = 10%.",
      supportPrompt:
        "Divide the error amount by the actual value.",
      misconceptionTargets: ["percentage-error-denominator-error"],
      relatedAssessmentItemIds: [
        "percent-ratio-finance-error-correction-010",
      ],
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised percentages, ratio and financial modelling. They worked on percentage quantities, ratio sharing and scaling, discounts and financial change, and percentage error in practical models.",
};

export const NUMBER_PERCENT_RATIO_FINANCE_PRACTICE_MODULES = Object.freeze([
  NUMBER_PERCENT_RATIO_FINANCE_PRACTICE_MODULE,
]);

export function getNumberPercentRatioFinancePracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_PERCENT_RATIO_FINANCE_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberPercentRatioFinancePracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_PERCENT_RATIO_FINANCE_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
