import {
  NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPlaceValueOperationsAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-place-value-operations-practice-module-v1",
  progressionBandKey: "place-value-and-whole-number-operations",
  title: "Place value and whole-number operations",
  shortTitle: "Place value and operations",
  description:
    "Practise place value, number structure, comparing, ordering, rounding, addition and subtraction strategies, and multiplication and division foundations.",
  yearBandLabel: "Years 3-5",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  stepKey: "place-value-and-whole-number-operations",
  pathwayStepId:
    "mathematics::number-and-place-value::middle-primary::place-value-and-whole-number-operations",
  relatedAssessmentBankKey: NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Place value tells us what a digit is worth depending on its position. Numbers can be partitioned, renamed, compared, ordered and rounded using place value. Addition and subtraction can use regrouping, multiplication can show equal groups or arrays, and division can show sharing or grouping.",
    keyLanguage: [
      "place value",
      "digit",
      "value",
      "partition",
      "expanded form",
      "compare",
      "order",
      "round",
      "regroup",
      "equal groups",
      "array",
      "divide",
      "share",
    ],
    workedExample:
      "4,306 can be partitioned as 4,000 + 300 + 6. It can also be renamed as 43 hundreds and 6 ones. For 356 + 248, add place-value parts: 300 + 200, 50 + 40, and 6 + 8, then regroup.",
    parentTip:
      "This module strengthens the foundations that later support fractions, decimals, multiplication, division and problem solving.",
  },
  sections: [
    {
      id: "place-value-and-number-structure",
      type: "understanding",
      title: "Place value and number structure",
      learnerGoal:
        "I can read, write, partition and rename whole numbers using place value.",
      tasks: [
        {
          id: "place-value-structure-digit-value",
          title: "Name a digit value",
          prompt: "In 7,364, what is the value of the digit 3?",
          taskType: "multiple_choice",
          options: ["3", "30", "300", "3,000"],
          expectedAnswer: "300",
          acceptableAnswers: ["300"],
          workedSolution:
            "The digit 3 is in the hundreds place, so its value is 300.",
          supportPrompt:
            "Read the places from left to right: thousands, hundreds, tens, ones.",
          misconceptionTargets: ["place-value-digit-value-error"],
          relatedAssessmentItemIds: ["place-value-ops-digit-value-001"],
          visualSupport: {
            type: "table",
            description:
              "Use a thousands-hundreds-tens-ones table to locate the digit 3.",
          },
        },
        {
          id: "place-value-structure-expanded-match",
          title: "Match expanded forms",
          prompt:
            "Match each number to its expanded form: 5,208; 3,740; 690.",
          taskType: "sort_or_match",
          expectedAnswer:
            "5,208 = 5,000 + 200 + 8; 3,740 = 3,000 + 700 + 40; 690 = 600 + 90",
          acceptableAnswers: [
            "5,208 = 5,000 + 200 + 8; 3,740 = 3,000 + 700 + 40; 690 = 600 + 90",
            "5208 = 5000 + 200 + 8; 3740 = 3000 + 700 + 40; 690 = 600 + 90",
          ],
          workedSolution:
            "Split each number by place value. A zero placeholder does not need its own addend.",
          supportPrompt:
            "Use thousands, hundreds, tens and ones columns before writing expanded form.",
          misconceptionTargets: [
            "place-value-partitioning-error",
            "place-value-digit-value-error",
          ],
          relatedAssessmentItemIds: ["place-value-ops-partition-match-002"],
          visualSupport: {
            type: "table",
            description:
              "Use a place-value table before matching each number to expanded form.",
          },
        },
        {
          id: "place-value-structure-flexible-renaming",
          title: "Select equivalent renamings",
          prompt: "Which option lists only representations equal to 2,500?",
          taskType: "multiple_choice",
          options: [
            "2 thousands and 5 hundreds; 25 hundreds; 1 thousand and 15 hundreds",
            "2 thousands and 50 hundreds; 25 tens; 2 hundreds and 5 ones",
            "2 hundreds and 5 tens; 250 ones; 25 thousands",
            "2 thousands and 5 tens; 20 hundreds and 5 tens; 250",
          ],
          expectedAnswer:
            "2 thousands and 5 hundreds; 25 hundreds; 1 thousand and 15 hundreds",
          acceptableAnswers: [
            "2 thousands and 5 hundreds; 25 hundreds; 1 thousand and 15 hundreds",
          ],
          workedSolution:
            "2 thousands and 5 hundreds is 2,500. 25 hundreds is also 2,500. 1 thousand and 15 hundreds is 1,000 + 1,500 = 2,500.",
          supportPrompt:
            "Remember that 1 thousand can be renamed as 10 hundreds.",
          misconceptionTargets: [
            "flexible-renaming-error",
            "place-value-partitioning-error",
          ],
          relatedAssessmentItemIds: [
            "place-value-ops-flexible-renaming-003",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a place-value table to rename thousands as hundreds.",
          },
        },
      ],
    },
    {
      id: "comparing-ordering-and-rounding",
      type: "fluency",
      title: "Comparing, ordering and rounding",
      learnerGoal:
        "I can compare, order and round whole numbers using place-value reasoning.",
      tasks: [
        {
          id: "comparing-ordering-correct-comparison",
          title: "Correct a comparison",
          prompt:
            "A learner says 6,095 is greater than 6,509 because 95 is greater than 9. Which correction is best?",
          taskType: "multiple_choice",
          options: [
            "6,509 is greater because both have 6 thousands, then 5 hundreds is greater than 0 hundreds.",
            "6,095 is greater because 95 is greater than 9.",
            "The numbers are equal because both start with 6.",
            "6,095 is greater because it has a 9 in the tens place.",
          ],
          expectedAnswer:
            "6,509 is greater because both have 6 thousands, then 5 hundreds is greater than 0 hundreds.",
          acceptableAnswers: [
            "6,509 is greater because both have 6 thousands, then 5 hundreds is greater than 0 hundreds.",
          ],
          workedSolution:
            "Compare from the largest place. Both numbers have 6 thousands. In the hundreds place, 6,509 has 5 hundreds and 6,095 has 0 hundreds, so 6,509 is greater.",
          supportPrompt:
            "Line up the digits by place value before comparing.",
          misconceptionTargets: [
            "whole-number-comparison-error",
            "ordering-place-value-error",
          ],
          relatedAssessmentItemIds: [
            "place-value-ops-comparison-correction-004",
          ],
          visualSupport: {
            type: "table",
            description:
              "Line both numbers up in a place-value table before comparing.",
          },
        },
        {
          id: "comparing-ordering-order-numbers",
          title: "Order numbers",
          prompt:
            "Order from smallest to largest: 8,042, 8,420, 8,204, 8,024.",
          taskType: "short_answer",
          expectedAnswer: "8,024, 8,042, 8,204, 8,420",
          acceptableAnswers: [
            "8,024, 8,042, 8,204, 8,420",
            "8024, 8042, 8204, 8420",
            "8,024 8,042 8,204 8,420",
          ],
          workedSolution:
            "All have 8 thousands. Compare hundreds, then tens, then ones: 8,024, 8,042, 8,204, 8,420.",
          supportPrompt:
            "When the thousands match, move to hundreds, then tens, then ones.",
          misconceptionTargets: [
            "ordering-place-value-error",
            "whole-number-comparison-error",
          ],
          relatedAssessmentItemIds: ["place-value-ops-ordering-005"],
          visualSupport: {
            type: "number_line",
            description:
              "Place the four numbers on a number line after comparing place values.",
          },
        },
        {
          id: "comparing-ordering-round-nearest-hundred",
          title: "Round a whole number",
          prompt: "Round 7,649 to the nearest 100.",
          taskType: "numeric",
          expectedAnswer: "7600",
          acceptableAnswers: ["7,600", "7600"],
          workedSolution:
            "To round to the nearest 100, look at the tens digit. The tens digit is 4, so 7,649 rounds down to 7,600.",
          supportPrompt:
            "Identify the rounding place first, then look one place to the right.",
          misconceptionTargets: ["rounding-place-value-error"],
          relatedAssessmentItemIds: ["place-value-ops-rounding-gap-006"],
          visualSupport: {
            type: "number_line",
            description:
              "Show 7,649 between the nearest hundred benchmarks.",
          },
        },
      ],
    },
    {
      id: "addition-and-subtraction-strategies",
      type: "problem_solving",
      title: "Addition and subtraction strategies",
      learnerGoal:
        "I can use efficient addition and subtraction strategies.",
      tasks: [
        {
          id: "addition-subtraction-select-addition",
          title: "Choose addition working",
          prompt: "Which working correctly calculates 456 + 278?",
          taskType: "multiple_choice",
          options: [
            "400 + 200 = 600, 50 + 70 = 120, 6 + 8 = 14, so total = 734.",
            "400 + 200 = 600, 50 + 70 = 120, 6 + 8 = 4, so total = 724.",
            "456 + 278 = 600 because 400 + 200 = 600.",
            "456 + 278 = 634 because the tens are subtracted.",
          ],
          expectedAnswer:
            "400 + 200 = 600, 50 + 70 = 120, 6 + 8 = 14, so total = 734.",
          acceptableAnswers: [
            "400 + 200 = 600, 50 + 70 = 120, 6 + 8 = 14, so total = 734.",
            "734",
          ],
          workedSolution:
            "Add by place value: 600 + 120 + 14 = 734.",
          supportPrompt:
            "Check whether each place-value part has been included and regrouped.",
          misconceptionTargets: [
            "addition-regrouping-error",
            "place-value-partitioning-error",
          ],
          relatedAssessmentItemIds: [
            "place-value-ops-addition-working-007",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a hundreds-tens-ones table to combine like place-value parts.",
          },
        },
        {
          id: "addition-subtraction-explain-subtraction",
          title: "Choose subtraction explanation",
          prompt:
            "Why is renaming needed for 703 - 468?",
          taskType: "multiple_choice",
          options: [
            "There are not enough ones or tens in 703, so a hundred must be renamed as tens and then ones before subtracting.",
            "Renaming is needed because subtraction always makes every digit smaller.",
            "Renaming is not needed because 8 - 3 can be used in the ones place.",
            "Only the hundreds digits matter, so 703 - 468 is about 300.",
          ],
          expectedAnswer:
            "There are not enough ones or tens in 703, so a hundred must be renamed as tens and then ones before subtracting.",
          acceptableAnswers: [
            "There are not enough ones or tens in 703, so a hundred must be renamed as tens and then ones before subtracting.",
          ],
          workedSolution:
            "703 has 0 tens and 3 ones. To subtract 8 ones and 6 tens, rename 1 hundred as 10 tens, then rename 1 ten as 10 ones.",
          supportPrompt:
            "Look for the place where the top number does not have enough to subtract.",
          misconceptionTargets: [
            "subtraction-regrouping-error",
            "operation-inverse-confusion",
          ],
          relatedAssessmentItemIds: [
            "place-value-ops-subtraction-working-008",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a place-value table to show renaming through the zero.",
          },
        },
        {
          id: "addition-subtraction-missing-value",
          title: "Find a missing addend",
          prompt: "Complete the equation: 275 + __ = 600.",
          taskType: "numeric",
          expectedAnswer: "325",
          acceptableAnswers: ["325"],
          workedSolution:
            "Count on from 275 to 600: 275 + 25 = 300, then +300 = 600. The missing value is 325.",
          supportPrompt:
            "Use counting-on or calculate 600 - 275.",
          misconceptionTargets: [
            "operation-inverse-confusion",
            "subtraction-regrouping-error",
          ],
          relatedAssessmentItemIds: [
            "place-value-ops-missing-equation-009",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open number line to count on from 275 to 600.",
          },
        },
      ],
    },
    {
      id: "multiplication-and-division-foundations",
      type: "reasoning",
      title: "Multiplication and division foundations",
      learnerGoal:
        "I can connect multiplication and division to equal groups, arrays and sharing.",
      tasks: [
        {
          id: "multiplication-division-classify-groups",
          title: "Classify equal-group representations",
          prompt:
            "Which representations match 3 x 8?",
          taskType: "multiple_choice",
          options: [
            "3 groups of 8, an array with 3 rows of 8, and 8 groups of 3",
            "3 + 8 only",
            "3 groups of 8 and 3 + 8 only",
            "8 - 3 and 3 + 8",
          ],
          expectedAnswer:
            "3 groups of 8, an array with 3 rows of 8, and 8 groups of 3",
          acceptableAnswers: [
            "3 groups of 8, an array with 3 rows of 8, and 8 groups of 3",
          ],
          workedSolution:
            "3 x 8 means 3 groups of 8, which is 24. An 8 by 3 array also shows 24. But 3 + 8 is only 11.",
          supportPrompt:
            "Ask whether each representation shows equal groups with the same total.",
          misconceptionTargets: [
            "multiplication-equal-groups-confusion",
            "fact-family-relationship-error",
          ],
          relatedAssessmentItemIds: [
            "place-value-ops-array-classification-010",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use equal-group and array cards to compare representations of 3 x 8.",
          },
        },
        {
          id: "multiplication-division-sharing",
          title: "Solve a sharing problem",
          prompt:
            "48 counters are shared equally into 6 groups. How many counters are in each group?",
          taskType: "numeric",
          expectedAnswer: "8",
          acceptableAnswers: ["8"],
          workedSolution:
            "48 shared into 6 equal groups means 48 / 6. Since 6 x 8 = 48, each group has 8 counters.",
          supportPrompt:
            "Use a multiplication fact to check the division answer.",
          misconceptionTargets: [
            "division-sharing-grouping-confusion",
            "fact-family-relationship-error",
          ],
          relatedAssessmentItemIds: [
            "place-value-ops-division-sharing-011",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Show 48 counters shared into 6 equal groups.",
          },
        },
        {
          id: "multiplication-division-best-explanation",
          title: "Explain multiplication and division",
          prompt:
            "A learner says 6 x 5 and 6 + 5 are the same because both use 6 and 5. Which explanation is best?",
          taskType: "multiple_choice",
          options: [
            "6 x 5 means 6 equal groups of 5, which is 30. 6 + 5 means combine 6 and 5, which is 11.",
            "They are the same because the same numbers are used.",
            "6 + 5 means 6 groups of 5, so it is 30.",
            "Multiplication always makes a smaller answer than addition.",
          ],
          expectedAnswer:
            "6 x 5 means 6 equal groups of 5, which is 30. 6 + 5 means combine 6 and 5, which is 11.",
          acceptableAnswers: [
            "6 x 5 means 6 equal groups of 5, which is 30. 6 + 5 means combine 6 and 5, which is 11.",
          ],
          workedSolution:
            "Multiplication shows equal groups. Addition combines quantities. 6 x 5 = 30, while 6 + 5 = 11.",
          supportPrompt:
            "Build the equal groups, then compare them with a single addition story.",
          misconceptionTargets: [
            "multiplication-equal-groups-confusion",
            "operation-inverse-confusion",
          ],
          relatedAssessmentItemIds: [
            "place-value-ops-multiplication-explanation-012",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Compare an equal-groups card for 6 x 5 with an addition card for 6 + 5.",
          },
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-place-value-structure",
      title: "Mini Check: place value",
      prompt: "Write 6,305 in expanded form.",
      taskType: "short_answer",
      expectedAnswer: "6,000 + 300 + 5",
      acceptableAnswers: ["6,000 + 300 + 5", "6000 + 300 + 5"],
      workedSolution:
        "6,305 has 6 thousands, 3 hundreds, 0 tens and 5 ones, so expanded form is 6,000 + 300 + 5.",
      supportPrompt:
        "Use a place-value table and leave out the zero tens addend.",
      misconceptionTargets: [
        "place-value-partitioning-error",
        "place-value-digit-value-error",
      ],
      relatedAssessmentItemIds: ["place-value-ops-partition-match-002"],
      visualSupport: {
        type: "table",
        description:
          "Use a place-value table and leave out the zero tens addend.",
      },
    },
    {
      id: "mini-check-comparing-ordering-rounding",
      title: "Mini Check: rounding",
      prompt: "Round 4,582 to the nearest 1,000.",
      taskType: "numeric",
      expectedAnswer: "5000",
      acceptableAnswers: ["5,000", "5000"],
      workedSolution:
        "To round to the nearest 1,000, look at the hundreds digit. The hundreds digit is 5, so 4,582 rounds up to 5,000.",
      supportPrompt:
        "Find the thousands place, then look one digit to the right.",
      misconceptionTargets: ["rounding-place-value-error"],
      relatedAssessmentItemIds: ["place-value-ops-rounding-gap-006"],
      visualSupport: {
        type: "number_line",
        description:
          "Show 4,582 between 4,000 and 5,000 before rounding.",
      },
    },
    {
      id: "mini-check-addition-subtraction",
      title: "Mini Check: missing value",
      prompt: "Complete the equation: 720 - __ = 455.",
      taskType: "numeric",
      expectedAnswer: "265",
      acceptableAnswers: ["265"],
      workedSolution:
        "Use inverse thinking: 720 - 455 = 265, so 720 - 265 = 455.",
      supportPrompt:
        "Turn the missing-value subtraction into 720 - 455.",
      misconceptionTargets: [
        "operation-inverse-confusion",
        "subtraction-regrouping-error",
      ],
      relatedAssessmentItemIds: [
        "place-value-ops-missing-equation-009",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line or inverse subtraction to find the missing value.",
      },
    },
    {
      id: "mini-check-multiplication-division",
      title: "Mini Check: sharing",
      prompt:
        "54 pencils are shared equally between 9 cups. How many pencils are in each cup?",
      taskType: "numeric",
      expectedAnswer: "6",
      acceptableAnswers: ["6"],
      workedSolution:
        "54 shared equally between 9 cups means 54 / 9. Since 9 x 6 = 54, each cup has 6 pencils.",
      supportPrompt:
        "Use the related multiplication fact to check the division.",
      misconceptionTargets: [
        "division-sharing-grouping-confusion",
        "fact-family-relationship-error",
      ],
      relatedAssessmentItemIds: [
        "place-value-ops-division-sharing-011",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Show 54 pencils shared equally between 9 cups.",
      },
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised place value and whole-number operations. They worked on digit value, partitioning, comparing, ordering, rounding, addition and subtraction strategies, equal groups, arrays and sharing.",
};

export const NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULES = Object.freeze([
  NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULE,
]);

export function getNumberPlaceValueOperationsPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberPlaceValueOperationsPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_PLACE_VALUE_OPERATIONS_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
