import {
  NUMBER_ADDITIVE_STRATEGIES_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberAdditiveStrategiesAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_ADDITIVE_STRATEGIES_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-additive-strategies-practice-module-v1",
  progressionBandKey: "additive-strategies-and-problem-solving",
  title: "Additive strategies and problem solving",
  shortTitle: "Additive strategies",
  description:
    "Practise mental addition and subtraction strategies, written addition and subtraction, regrouping, missing-number equations and additive problem solving.",
  yearBandLabel: "Years 3-5",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  stepKey: "additive-strategies-and-problem-solving",
  pathwayStepId:
    "mathematics::number-and-place-value::middle-primary::additive-strategies-and-problem-solving",
  relatedAssessmentBankKey: NUMBER_ADDITIVE_STRATEGIES_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Addition joins or combines amounts. Subtraction can mean take away, compare, or find the difference. Mental strategies can use place value, friendly numbers and compensation. Written strategies help when numbers are larger, and regrouping means renaming values without changing the total. Checking reasonableness helps catch mistakes.",
    keyLanguage: [
      "addition",
      "subtraction",
      "difference",
      "compensation",
      "friendly number",
      "place value",
      "regrouping",
      "renaming",
      "missing number",
      "strategy",
      "estimate",
      "reasonableness",
    ],
    workedExample:
      "For 399 + 126, use the friendly number 400. 400 + 126 = 526, then subtract 1 because 399 is one less than 400. The answer is 525.",
    parentTip:
      "This module helps learners choose sensible strategies rather than relying on one written method for every problem.",
  },
  sections: [
    {
      id: "mental-addition-strategies",
      type: "fluency",
      title: "Mental addition strategies",
      learnerGoal:
        "I can use place value, compensation and friendly numbers to add efficiently.",
      tasks: [
        {
          id: "mental-addition-place-value-partition",
          title: "Add with place-value parts",
          prompt:
            "Use a place-value table or mental partitioning. Calculate 425 + 260.",
          taskType: "numeric",
          expectedAnswer: "685",
          acceptableAnswers: ["685"],
          workedSolution:
            "425 is 400 + 20 + 5. Add 260 as 200 + 60. 400 + 200 = 600, 20 + 60 = 80, and 5 remains. Total = 685.",
          supportPrompt:
            "Add hundreds with hundreds, tens with tens, and ones with ones.",
          misconceptionTargets: ["place-value-addition-error"],
          relatedAssessmentItemIds: [
            "additive-strategies-place-value-addition-001",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a hundreds-tens-ones table to partition both addends.",
          },
        },
        {
          id: "mental-addition-friendly-compensation",
          title: "Use a friendly number",
          prompt: "Which working correctly calculates 499 + 238?",
          taskType: "multiple_choice",
          options: [
            "500 + 238 = 738, then subtract 1 to get 737.",
            "500 + 238 = 738, so the answer is 738.",
            "499 + 200 = 699, so the answer is 699.",
            "500 - 238 = 262, then subtract 1.",
          ],
          expectedAnswer: "500 + 238 = 738, then subtract 1 to get 737.",
          acceptableAnswers: [
            "500 + 238 = 738, then subtract 1 to get 737.",
            "737",
          ],
          workedSolution:
            "499 is 1 less than 500. Add with 500, then subtract 1 from the result: 738 - 1 = 737.",
          supportPrompt:
            "When you make an addend larger, compensate by making the answer smaller.",
          misconceptionTargets: [
            "compensation-strategy-error",
            "friendly-number-strategy-gap",
          ],
          relatedAssessmentItemIds: [
            "additive-strategies-compensation-002",
            "additive-strategies-mental-addition-working-003",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open number line showing 499 adjusted to 500, then compensated by 1.",
          },
        },
        {
          id: "mental-addition-best-strategy",
          title: "Choose an efficient strategy",
          prompt:
            "A learner needs to calculate 397 + 85. Which strategy is most efficient?",
          taskType: "multiple_choice",
          options: [
            "Use 400 + 85 = 485, then subtract 3 to get 482.",
            "Use 397 + 80 = 477 and stop there.",
            "Use 300 + 80 only because they are the largest parts.",
            "Subtract 85 from 397 because 397 is larger.",
          ],
          expectedAnswer: "Use 400 + 85 = 485, then subtract 3 to get 482.",
          acceptableAnswers: [
            "Use 400 + 85 = 485, then subtract 3 to get 482.",
            "482",
          ],
          workedSolution:
            "397 is close to the friendly number 400. Add 400 + 85, then subtract the extra 3.",
          supportPrompt:
            "Look for a number close to a hundred, then compensate.",
          misconceptionTargets: [
            "friendly-number-strategy-gap",
            "compensation-strategy-error",
          ],
          relatedAssessmentItemIds: [
            "additive-strategies-mental-addition-working-003",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use a number line to show 397 as 400 - 3.",
          },
        },
      ],
    },
    {
      id: "mental-subtraction-strategies",
      type: "understanding",
      title: "Mental subtraction strategies",
      learnerGoal:
        "I can use counting on, compensation and place value to subtract efficiently.",
      tasks: [
        {
          id: "mental-subtraction-counting-on",
          title: "Count on to find a difference",
          prompt:
            "Complete the counting-on strategy: 568 to 600 is 32, and 600 to 612 is 12, so 612 - 568 = __.",
          taskType: "numeric",
          expectedAnswer: "44",
          acceptableAnswers: ["44"],
          workedSolution:
            "Count from 568 to 612. The jumps are 32 and 12, so the difference is 32 + 12 = 44.",
          supportPrompt:
            "Use an open number line and jump to the friendly number 600 first.",
          misconceptionTargets: [
            "counting-on-subtraction-error",
            "subtraction-as-take-away-only-error",
          ],
          relatedAssessmentItemIds: [
            "additive-strategies-counting-on-004",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open number line from 568 to 612 with a jump through 600.",
          },
        },
        {
          id: "mental-subtraction-compensation",
          title: "Subtract a near-friendly number",
          prompt: "Which working correctly calculates 846 - 399?",
          taskType: "multiple_choice",
          options: [
            "846 - 400 + 1 = 447",
            "846 - 400 - 1 = 445",
            "846 + 400 - 1 = 1245",
            "846 - 300 = 546",
          ],
          expectedAnswer: "846 - 400 + 1 = 447",
          acceptableAnswers: ["846 - 400 + 1 = 447", "447"],
          workedSolution:
            "399 is 1 less than 400. If you subtract 400, you subtract 1 too many, so add 1 back.",
          supportPrompt:
            "When you subtract too much, add the extra amount back.",
          misconceptionTargets: ["compensation-strategy-error"],
          relatedAssessmentItemIds: [
            "additive-strategies-subtraction-compensation-005",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use a number line showing subtract 400, then add 1 back.",
          },
        },
        {
          id: "mental-subtraction-difference-explanation",
          title: "Explain difference thinking",
          prompt:
            "A learner says 701 - 698 must be done with column subtraction. Which explanation is best?",
          taskType: "multiple_choice",
          options: [
            "The numbers are close, so count on from 698 to 701. The difference is 3.",
            "Column subtraction is the only correct strategy.",
            "Subtract the smaller digit from the larger digit in each place to get 197.",
            "Add 701 and 698 because the numbers are close.",
          ],
          expectedAnswer:
            "The numbers are close, so count on from 698 to 701. The difference is 3.",
          acceptableAnswers: [
            "The numbers are close, so count on from 698 to 701. The difference is 3.",
            "3",
          ],
          workedSolution:
            "Subtraction can mean finding a difference. 698 to 700 is 2, then 700 to 701 is 1, so the difference is 3.",
          supportPrompt:
            "Use an open number line when the two numbers are close together.",
          misconceptionTargets: [
            "subtraction-as-take-away-only-error",
            "counting-on-subtraction-error",
          ],
          relatedAssessmentItemIds: [
            "additive-strategies-subtraction-explanation-006",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open number line from 698 to 701 with jumps through 700.",
          },
        },
      ],
    },
    {
      id: "written-addition-and-subtraction",
      type: "problem_solving",
      title: "Written addition and subtraction",
      learnerGoal:
        "I can use written strategies, regrouping and renaming accurately.",
      tasks: [
        {
          id: "written-addition-regrouping",
          title: "Add with regrouping",
          prompt: "Use a written strategy to calculate 569 + 284.",
          taskType: "numeric",
          expectedAnswer: "853",
          acceptableAnswers: ["853"],
          workedSolution:
            "9 + 4 = 13 ones, regroup 1 ten. 6 tens + 8 tens + 1 ten = 15 tens, regroup 1 hundred. 5 hundreds + 2 hundreds + 1 hundred = 8 hundreds. Total = 853.",
          supportPrompt:
            "Line up hundreds, tens and ones before adding.",
          misconceptionTargets: ["regrouping-addition-error"],
          relatedAssessmentItemIds: [
            "additive-strategies-written-addition-007",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a place-value table with regrouping from ones to tens and tens to hundreds.",
          },
        },
        {
          id: "written-subtraction-renaming",
          title: "Choose correct renaming",
          prompt: "Which working correctly calculates 802 - 457?",
          taskType: "multiple_choice",
          options: [
            "Rename 802 as 7 hundreds, 9 tens and 12 ones, then subtract to get 345.",
            "Use 8 - 4, 5 - 0 and 7 - 2 to get 457.",
            "Ignore the zero tens and subtract only hundreds and ones.",
            "802 - 457 = 555 because every lower digit is subtracted from the higher digit.",
          ],
          expectedAnswer:
            "Rename 802 as 7 hundreds, 9 tens and 12 ones, then subtract to get 345.",
          acceptableAnswers: [
            "Rename 802 as 7 hundreds, 9 tens and 12 ones, then subtract to get 345.",
            "345",
          ],
          workedSolution:
            "802 has 0 tens and 2 ones, so rename through the zero: 7 hundreds, 9 tens and 12 ones. Then subtract 457 to get 345.",
          supportPrompt:
            "When there are not enough ones and the tens are zero, rename one hundred into tens first.",
          misconceptionTargets: ["regrouping-subtraction-error"],
          relatedAssessmentItemIds: [
            "additive-strategies-written-subtraction-008",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a place-value table showing 802 renamed before subtracting.",
          },
        },
        {
          id: "written-missing-number-equation",
          title: "Solve a missing-number equation",
          prompt: "Complete the equation: 740 - __ = 465.",
          taskType: "numeric",
          expectedAnswer: "275",
          acceptableAnswers: ["275"],
          workedSolution:
            "Use inverse thinking: 740 - 465 = 275. Check with 465 + 275 = 740.",
          supportPrompt:
            "Turn the missing subtraction amount into 740 - 465.",
          misconceptionTargets: [
            "missing-number-equation-error",
            "regrouping-subtraction-error",
          ],
          relatedAssessmentItemIds: [
            "additive-strategies-missing-equation-009",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use a number line or place-value table to find the difference from 465 to 740.",
          },
        },
      ],
    },
    {
      id: "additive-problem-solving",
      type: "reasoning",
      title: "Additive problem solving",
      learnerGoal:
        "I can choose addition or subtraction strategies in one-step and simple multi-step contexts.",
      tasks: [
        {
          id: "additive-problem-context-classification",
          title: "Choose the additive structure",
          prompt:
            "Which option correctly classifies these contexts: combining two collections, spending money from a starting amount, and asking how many more one score is than another?",
          taskType: "multiple_choice",
          options: [
            "Addition; subtraction; comparison/difference",
            "Subtraction; addition; addition",
            "Comparison/difference; subtraction; addition",
            "Addition; addition; addition",
          ],
          expectedAnswer: "Addition; subtraction; comparison/difference",
          acceptableAnswers: ["Addition; subtraction; comparison/difference"],
          workedSolution:
            "Combining uses addition. Spending from a starting amount uses subtraction. Asking how many more compares the difference.",
          supportPrompt:
            "Ask what is unknown: a total, what is left, or a difference.",
          misconceptionTargets: [
            "operation-choice-additive-error",
            "comparison-difference-context-error",
          ],
          relatedAssessmentItemIds: [
            "additive-strategies-context-classification-010",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use context cards for combine, take-away and comparison stories.",
          },
        },
        {
          id: "additive-problem-multi-step",
          title: "Solve a two-step story",
          prompt:
            "A library had 365 books on display. Staff added 128 more, then removed 74. How many books are on display now?",
          taskType: "numeric",
          expectedAnswer: "419",
          acceptableAnswers: ["419"],
          workedSolution:
            "First add: 365 + 128 = 493. Then subtract: 493 - 74 = 419.",
          supportPrompt:
            "Track the total after each action in the story.",
          misconceptionTargets: [
            "multi-step-additive-context-error",
            "operation-choice-additive-error",
          ],
          relatedAssessmentItemIds: [
            "additive-strategies-multi-step-context-011",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a bar-model or context card showing start, add, then subtract.",
          },
        },
        {
          id: "additive-problem-reasonableness-check",
          title: "Check reasonableness",
          prompt:
            "A learner says 612 + 289 = 801. Which check is best?",
          taskType: "multiple_choice",
          options: [
            "Estimate 612 as about 600 and 289 as about 300. The sum should be about 900, so 801 is too low.",
            "Only check the ones digit. 2 + 9 ends in 1, so 801 is definitely correct.",
            "801 is bigger than 612, so it must be right.",
            "Do not estimate because estimates are always exact.",
          ],
          expectedAnswer:
            "Estimate 612 as about 600 and 289 as about 300. The sum should be about 900, so 801 is too low.",
          acceptableAnswers: [
            "Estimate 612 as about 600 and 289 as about 300. The sum should be about 900, so 801 is too low.",
          ],
          workedSolution:
            "600 + 300 = 900, so a reasonable exact answer should be near 900. The exact sum is 901, so 801 is too low.",
          supportPrompt:
            "Round each number to a friendly benchmark, then compare the estimate with the answer.",
          misconceptionTargets: [
            "reasonableness-checking-gap",
            "place-value-addition-error",
          ],
          relatedAssessmentItemIds: [
            "additive-strategies-reasonableness-012",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use number-line benchmarks near 600, 300 and 900.",
          },
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-mental-addition-strategies",
      title: "Mini Check: mental addition",
      prompt: "Use a mental strategy to calculate 398 + 57.",
      taskType: "short_answer",
      expectedAnswer: "455",
      acceptableAnswers: ["455", "400 + 57 - 2 = 455"],
      workedSolution:
        "398 is 2 less than 400. 400 + 57 = 457, then subtract 2 to get 455.",
      supportPrompt:
        "Use the friendly number 400, then compensate.",
      misconceptionTargets: [
        "compensation-strategy-error",
        "friendly-number-strategy-gap",
      ],
      relatedAssessmentItemIds: [
        "additive-strategies-compensation-002",
        "additive-strategies-mental-addition-working-003",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line showing 398 adjusted to 400.",
      },
    },
    {
      id: "mini-check-mental-subtraction-strategies",
      title: "Mini Check: mental subtraction",
      prompt: "Find 804 - 789 by counting on.",
      taskType: "numeric",
      expectedAnswer: "15",
      acceptableAnswers: ["15"],
      workedSolution:
        "789 to 800 is 11, and 800 to 804 is 4. The difference is 11 + 4 = 15.",
      supportPrompt:
        "Jump from 789 to a friendly number first.",
      misconceptionTargets: [
        "counting-on-subtraction-error",
        "subtraction-as-take-away-only-error",
      ],
      relatedAssessmentItemIds: [
        "additive-strategies-counting-on-004",
        "additive-strategies-subtraction-explanation-006",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line from 789 to 804 through 800.",
      },
    },
    {
      id: "mini-check-written-addition-subtraction",
      title: "Mini Check: written strategies",
      prompt: "Calculate 603 - 278.",
      taskType: "numeric",
      expectedAnswer: "325",
      acceptableAnswers: ["325"],
      workedSolution:
        "Rename 603 as 5 hundreds, 9 tens and 13 ones. Then subtract 278 to get 325.",
      supportPrompt:
        "Rename through the zero before subtracting.",
      misconceptionTargets: ["regrouping-subtraction-error"],
      relatedAssessmentItemIds: [
        "additive-strategies-written-subtraction-008",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use a place-value table showing 603 renamed before subtracting.",
      },
    },
    {
      id: "mini-check-additive-problem-solving",
      title: "Mini Check: additive problem solving",
      prompt:
        "A club had 286 tickets. It printed 145 more, then sold 98. How many tickets are left?",
      taskType: "numeric",
      expectedAnswer: "333",
      acceptableAnswers: ["333"],
      workedSolution:
        "First add the printed tickets: 286 + 145 = 431. Then subtract the tickets sold: 431 - 98 = 333.",
      supportPrompt:
        "Follow the story actions in order: add, then subtract.",
      misconceptionTargets: [
        "multi-step-additive-context-error",
        "operation-choice-additive-error",
      ],
      relatedAssessmentItemIds: [
        "additive-strategies-multi-step-context-011",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Use a context card showing start, add printed tickets, then subtract sold tickets.",
      },
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised additive strategies and problem solving. They worked on mental addition, mental subtraction, written addition and subtraction, regrouping, missing-number equations and additive contexts.",
};

export const NUMBER_ADDITIVE_STRATEGIES_PRACTICE_MODULES = Object.freeze([
  NUMBER_ADDITIVE_STRATEGIES_PRACTICE_MODULE,
]);

export function getNumberAdditiveStrategiesPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_ADDITIVE_STRATEGIES_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberAdditiveStrategiesPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_ADDITIVE_STRATEGIES_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
