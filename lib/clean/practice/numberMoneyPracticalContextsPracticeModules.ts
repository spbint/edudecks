import {
  NUMBER_MONEY_PRACTICAL_CONTEXTS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberMoneyPracticalContextsAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_MONEY_PRACTICAL_CONTEXTS_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-money-practical-contexts-practice-module-v1",
  progressionBandKey: "money-and-practical-number-contexts",
  title: "Money and practical number contexts",
  shortTitle: "Money and practical contexts",
  description:
    "Practise money values, dollars and cents, totals, change, practical measurement and time contexts, budgeting, estimation and reasonableness.",
  yearBandLabel: "Years 3-5",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  stepKey: "money-and-practical-number-contexts",
  pathwayStepId:
    "mathematics::number-and-place-value::middle-primary::money-and-practical-number-contexts",
  relatedAssessmentBankKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Money and practical number problems use the same number ideas in real contexts. Money uses dollars and cents, with two cents places. Practical problems often ask for a total, what is left, a difference, change, elapsed time or whether a choice fits a budget. Estimating helps check whether an answer makes sense.",
    keyLanguage: [
      "money",
      "dollars",
      "cents",
      "total",
      "change",
      "budget",
      "estimate",
      "reasonable",
      "difference",
      "measurement",
      "time",
      "context",
    ],
    workedExample:
      "For $6.75 paid with $10, count on from $6.75 to $7.00, then to $10.00. The jumps are $0.25 and $3.00, so the change is $3.25.",
    parentTip:
      "This module helps learners connect number skills to everyday decisions, not just calculate with numbers on a page.",
  },
  sections: [
    {
      id: "money-values-and-equivalent-amounts",
      type: "understanding",
      title: "Money values and equivalent amounts",
      learnerGoal:
        "I can recognise, compare and represent money amounts using dollars, cents and equivalent combinations.",
      tasks: [
        {
          id: "money-values-equivalent-cents",
          title: "Match dollars and cents",
          prompt: "What is $2.30 in cents?",
          taskType: "numeric",
          expectedAnswer: "230",
          acceptableAnswers: ["230", "230 cents"],
          workedSolution:
            "$2 is 200 cents and $0.30 is 30 cents. Total = 230 cents.",
          supportPrompt:
            "Remember that 1 dollar is 100 cents.",
          misconceptionTargets: [
            "coin-note-value-confusion",
            "cents-dollars-conversion-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-equivalent-amounts-001",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a dollars-and-cents table to convert $2.30 to cents.",
          },
        },
        {
          id: "money-values-write-notation",
          title: "Write money notation",
          prompt: "Write 5 dollars and 9 cents using money notation.",
          taskType: "short_answer",
          expectedAnswer: "$5.09",
          acceptableAnswers: ["$5.09", "5.09"],
          workedSolution:
            "Nine cents is written as 09 in the cents places, so the amount is $5.09.",
          supportPrompt:
            "Use two cents places after the decimal point.",
          misconceptionTargets: [
            "money-decimal-place-value-error",
            "cents-dollars-conversion-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-money-notation-002",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a money place-value table with dollars, tens of cents and ones of cents.",
          },
        },
        {
          id: "money-values-order-amounts",
          title: "Order money amounts",
          prompt:
            "Order from least to greatest: $4.05, $4.50, $4.15, $4.01.",
          taskType: "short_answer",
          expectedAnswer: "$4.01, $4.05, $4.15, $4.50",
          acceptableAnswers: [
            "$4.01, $4.05, $4.15, $4.50",
            "4.01, 4.05, 4.15, 4.50",
            "$4.01 $4.05 $4.15 $4.50",
          ],
          workedSolution:
            "All amounts have 4 dollars. Compare the cents: 01, 05, 15, 50.",
          supportPrompt:
            "Compare dollars first, then cents.",
          misconceptionTargets: [
            "money-decimal-place-value-error",
            "cents-dollars-conversion-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-order-amounts-003",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Place the amounts on a number line from $4.00 to $4.50.",
          },
        },
      ],
    },
    {
      id: "money-calculations-and-change",
      type: "fluency",
      title: "Money calculations and change",
      learnerGoal:
        "I can add, subtract and reason with money totals, costs and change.",
      tasks: [
        {
          id: "money-calculations-total",
          title: "Find the total cost",
          prompt: "A notebook costs $3.45 and a pen costs $1.25. What is the total cost?",
          taskType: "numeric",
          expectedAnswer: "4.70",
          acceptableAnswers: ["4.70", "$4.70", "4.7", "$4.7"],
          workedSolution:
            "$3.45 + $1.25 = $4.70. Add cents with cents and dollars with dollars.",
          supportPrompt:
            "Line up the decimal points before adding.",
          misconceptionTargets: [
            "money-addition-regrouping-error",
            "money-decimal-place-value-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-total-004",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a shop card showing the two prices and a total.",
          },
        },
        {
          id: "money-calculations-change",
          title: "Calculate change",
          prompt: "An item costs $8.60. It is paid for with $10. How much change is given?",
          taskType: "numeric",
          expectedAnswer: "1.40",
          acceptableAnswers: ["1.40", "$1.40", "1.4", "$1.4"],
          workedSolution:
            "Count on from $8.60 to $10.00. $8.60 + $1.40 = $10.00.",
          supportPrompt:
            "Use counting on to the amount paid.",
          misconceptionTargets: [
            "change-as-subtraction-error",
            "money-decimal-place-value-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-change-gap-005",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open number line from $8.60 to $10.00.",
          },
        },
        {
          id: "money-calculations-correct-working",
          title: "Choose correct working",
          prompt: "Which working correctly calculates $5.75 + $2.60?",
          taskType: "multiple_choice",
          options: [
            "$5.75 + $2.60 = $8.35",
            "$5.75 + $2.60 = $7.135",
            "$5.75 + $2.60 = $7.00",
            "$5.75 + $2.60 = $3.15",
          ],
          expectedAnswer: "$5.75 + $2.60 = $8.35",
          acceptableAnswers: ["$5.75 + $2.60 = $8.35", "$8.35", "8.35"],
          workedSolution:
            "75 cents + 60 cents = 135 cents, or $1.35. 5 + 2 dollars + $1.35 = $8.35.",
          supportPrompt:
            "Regroup 100 cents as 1 dollar.",
          misconceptionTargets: [
            "money-addition-regrouping-error",
            "money-decimal-place-value-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-correct-working-006",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a dollars-and-cents table with decimal points aligned.",
          },
        },
      ],
    },
    {
      id: "practical-measurement-and-time-contexts",
      type: "problem_solving",
      title: "Practical measurement and time contexts",
      learnerGoal:
        "I can use number operations in practical measurement, time and everyday contexts.",
      tasks: [
        {
          id: "practical-context-measurement",
          title: "Solve a measurement problem",
          prompt: "A rope is 3 m long. Sam cuts off 85 cm. How many centimetres remain?",
          taskType: "numeric",
          expectedAnswer: "215",
          acceptableAnswers: ["215", "215 cm"],
          workedSolution:
            "3 m is 300 cm. 300 cm - 85 cm = 215 cm.",
          supportPrompt:
            "Convert metres to centimetres before subtracting.",
          misconceptionTargets: [
            "measurement-unit-confusion",
            "operation-choice-context-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-measurement-007",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a rope context card showing 300 cm total and 85 cm cut off.",
          },
        },
        {
          id: "practical-context-time",
          title: "Find elapsed time",
          prompt: "A game starts at 2:45 and ends at 3:25. How many minutes long is it?",
          taskType: "numeric",
          expectedAnswer: "40",
          acceptableAnswers: ["40", "40 minutes", "40 min"],
          workedSolution:
            "From 2:45 to 3:00 is 15 minutes. From 3:00 to 3:25 is 25 minutes. Total = 40 minutes.",
          supportPrompt:
            "Count through the next hour on an open number line.",
          misconceptionTargets: [
            "elapsed-time-counting-error",
            "operation-choice-context-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-time-008",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open time number line from 2:45 to 3:25.",
          },
        },
        {
          id: "practical-context-operation-choice",
          title: "Choose the operation idea",
          prompt:
            "Which option correctly classifies these contexts: total cost of two items, water left after pouring, and how much longer one walk is than another?",
          taskType: "multiple_choice",
          options: [
            "Add; subtract; find a difference",
            "Subtract; add; add",
            "Find a difference; subtract; add",
            "Add; add; add",
          ],
          expectedAnswer: "Add; subtract; find a difference",
          acceptableAnswers: ["Add; subtract; find a difference"],
          workedSolution:
            "Altogether means add. Left means subtract from the start. Longer asks for a difference.",
          supportPrompt:
            "Ask what the story is trying to find.",
          misconceptionTargets: [
            "operation-choice-context-error",
            "measurement-unit-confusion",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-operation-classification-009",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use context cards for total, left-over and difference stories.",
          },
        },
      ],
    },
    {
      id: "estimation-budgeting-and-reasonableness",
      type: "reasoning",
      title: "Estimation, budgeting and reasonableness",
      learnerGoal:
        "I can estimate, compare with budgets and check whether practical answers are reasonable.",
      tasks: [
        {
          id: "budget-within-or-over",
          title: "Check a budget",
          prompt: "A learner has $15. Can they buy items costing $8.45 and $5.80?",
          taskType: "multiple_choice",
          options: [
            "Yes, because the total is $14.25.",
            "No, because the total is $15.25.",
            "Yes, because 8 + 5 is less than 15, so cents do not matter.",
            "No, because both prices have cents.",
          ],
          expectedAnswer: "Yes, because the total is $14.25.",
          acceptableAnswers: ["Yes, because the total is $14.25.", "yes", "$14.25"],
          workedSolution:
            "$8.45 + $5.80 = $14.25, which is within a $15 budget.",
          supportPrompt:
            "Add the prices, then compare the total with the budget.",
          misconceptionTargets: [
            "budget-constraint-error",
            "money-addition-regrouping-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-budget-010",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a budget table showing the two prices and the $15 limit.",
          },
        },
        {
          id: "reasonableness-estimate",
          title: "Estimate to check",
          prompt:
            "A learner says $6.90 + $2.15 = $19.05. Which estimate checks the answer?",
          taskType: "multiple_choice",
          options: [
            "$6.90 is about $7 and $2.15 is about $2, so the total should be about $9.",
            "$6.90 is about $70 and $2.15 is about $20, so the total should be about $90.",
            "Only the cents matter, so $19.05 is reasonable.",
            "Estimation cannot be used with money.",
          ],
          expectedAnswer:
            "$6.90 is about $7 and $2.15 is about $2, so the total should be about $9.",
          acceptableAnswers: [
            "$6.90 is about $7 and $2.15 is about $2, so the total should be about $9.",
          ],
          workedSolution:
            "The total should be near $9, and the exact total is $9.05. $19.05 is too high.",
          supportPrompt:
            "Round each price to a nearby whole dollar first.",
          misconceptionTargets: [
            "estimation-reasonableness-gap",
            "rounding-money-context-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-reasonableness-011",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use whole-dollar benchmarks around $7, $2 and $9.",
          },
        },
        {
          id: "money-decimal-misconception",
          title: "Correct money notation",
          prompt:
            "A learner says $4.7 is less than $4.25 because 7 is less than 25. Which correction is best?",
          taskType: "multiple_choice",
          options: [
            "$4.7 means $4.70, which is greater than $4.25.",
            "$4.7 means $4.07, which is less than $4.25.",
            "$4.7 and $4.25 are equal because both have 4 dollars.",
            "$4.25 is greater because it has more digits.",
          ],
          expectedAnswer: "$4.7 means $4.70, which is greater than $4.25.",
          acceptableAnswers: [
            "$4.7 means $4.70, which is greater than $4.25.",
            "$4.70 is greater than $4.25",
          ],
          workedSolution:
            "Money uses two cents places. $4.7 is $4.70, and 70 cents is more than 25 cents.",
          supportPrompt:
            "Write both amounts with two cents places before comparing.",
          misconceptionTargets: [
            "money-decimal-place-value-error",
            "cents-dollars-conversion-error",
          ],
          relatedAssessmentItemIds: [
            "money-practical-contexts-misconception-012",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a money place-value table to compare $4.70 and $4.25.",
          },
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-money-values",
      title: "Mini Check: money values",
      prompt: "Write 4 dollars and 6 cents using money notation.",
      taskType: "short_answer",
      expectedAnswer: "$4.06",
      acceptableAnswers: ["$4.06", "4.06"],
      workedSolution:
        "Six cents is written as 06 in the cents places, so the amount is $4.06.",
      supportPrompt:
        "Use two cents places after the decimal point.",
      misconceptionTargets: [
        "money-decimal-place-value-error",
        "cents-dollars-conversion-error",
      ],
      relatedAssessmentItemIds: [
        "money-practical-contexts-money-notation-002",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use a dollars-and-cents place-value table.",
      },
    },
    {
      id: "mini-check-money-change",
      title: "Mini Check: change",
      prompt: "An item costs $7.35 and is paid for with $10. How much change is given?",
      taskType: "numeric",
      expectedAnswer: "2.65",
      acceptableAnswers: ["2.65", "$2.65"],
      workedSolution:
        "Count on from $7.35 to $10.00. $7.35 + $2.65 = $10.00.",
      supportPrompt:
        "Use an open number line to count up to $10.",
      misconceptionTargets: [
        "change-as-subtraction-error",
        "money-decimal-place-value-error",
      ],
      relatedAssessmentItemIds: [
        "money-practical-contexts-change-gap-005",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line from $7.35 to $10.00.",
      },
    },
    {
      id: "mini-check-practical-time",
      title: "Mini Check: practical time",
      prompt: "A class starts at 11:40 and ends at 12:15. How many minutes long is it?",
      taskType: "numeric",
      expectedAnswer: "35",
      acceptableAnswers: ["35", "35 minutes", "35 min"],
      workedSolution:
        "11:40 to 12:00 is 20 minutes, and 12:00 to 12:15 is 15 minutes. Total = 35 minutes.",
      supportPrompt:
        "Count through the hour first.",
      misconceptionTargets: [
        "elapsed-time-counting-error",
        "operation-choice-context-error",
      ],
      relatedAssessmentItemIds: [
        "money-practical-contexts-time-008",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use an open time number line from 11:40 to 12:15.",
      },
    },
    {
      id: "mini-check-budget-reasonableness",
      title: "Mini Check: budget and estimate",
      prompt: "A learner has $12. Can they buy items costing $6.95 and $4.80?",
      taskType: "multiple_choice",
      options: [
        "Yes, because the total is $11.75.",
        "No, because the total is $12.75.",
        "Yes, because 6 + 4 is less than 12 and cents do not matter.",
        "No, because both prices have cents.",
      ],
      expectedAnswer: "Yes, because the total is $11.75.",
      acceptableAnswers: ["Yes, because the total is $11.75.", "yes", "$11.75"],
      workedSolution:
        "$6.95 + $4.80 = $11.75, which is within a $12 budget.",
      supportPrompt:
        "Add the prices exactly, then compare with the budget.",
      misconceptionTargets: [
        "budget-constraint-error",
        "estimation-reasonableness-gap",
      ],
      relatedAssessmentItemIds: [
        "money-practical-contexts-budget-010",
        "money-practical-contexts-reasonableness-011",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use a budget table showing the prices, total and $12 limit.",
      },
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised money and practical number contexts. They worked on dollars and cents, totals, change, measurement and time contexts, budgeting, estimation and reasonableness.",
};

export const NUMBER_MONEY_PRACTICAL_CONTEXTS_PRACTICE_MODULES = Object.freeze([
  NUMBER_MONEY_PRACTICAL_CONTEXTS_PRACTICE_MODULE,
]);

export function getNumberMoneyPracticalContextsPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_MONEY_PRACTICAL_CONTEXTS_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberMoneyPracticalContextsPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_MONEY_PRACTICAL_CONTEXTS_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
