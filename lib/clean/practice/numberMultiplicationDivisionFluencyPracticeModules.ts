import {
  NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberMultiplicationDivisionFluencyAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-multiplication-division-fluency-practice-module-v1",
  progressionBandKey: "multiplication-division-fluency",
  title: "Multiplication and division fluency",
  shortTitle: "Multiplication and division",
  description:
    "Practise multiplication facts, arrays, equal groups, division facts, fact families, inverse relationships and multiplicative problem solving.",
  yearBandLabel: "Years 3-5",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  stepKey: "multiplication-division-fluency",
  pathwayStepId:
    "mathematics::number-and-place-value::middle-primary::multiplication-division-fluency",
  relatedAssessmentBankKey:
    NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Multiplication can show equal groups, arrays or repeated addition. Division can mean sharing equally or making equal groups. Multiplication and division are inverse operations, so fact families help connect related facts. Number lines and skip-counting can help with multiples, and choosing the right operation depends on the story.",
    keyLanguage: [
      "multiplication",
      "division",
      "equal groups",
      "array",
      "repeated addition",
      "sharing",
      "grouping",
      "inverse",
      "fact family",
      "multiple",
      "product",
      "quotient",
    ],
    workedExample:
      "An array with 4 rows of 6 shows 4 x 6 = 24. The same fact family also gives 6 x 4 = 24, 24 / 4 = 6 and 24 / 6 = 4.",
    parentTip:
      "This module strengthens fluent multiplication and division reasoning, not just memorising times tables.",
  },
  sections: [
    {
      id: "multiplication-facts-and-arrays",
      type: "fluency",
      title: "Multiplication facts and arrays",
      learnerGoal:
        "I can connect multiplication facts with arrays, equal rows and repeated addition.",
      tasks: [
        {
          id: "multiplication-facts-array-match",
          title: "Match arrays to multiplication facts",
          prompt:
            "Use array pictures. Match each array description to its multiplication fact: 3 rows of 4, 5 rows of 6, 2 rows of 8.",
          taskType: "sort_or_match",
          expectedAnswer:
            "3 rows of 4 = 3 x 4 = 12; 5 rows of 6 = 5 x 6 = 30; 2 rows of 8 = 2 x 8 = 16",
          acceptableAnswers: [
            "3 rows of 4 = 3 x 4 = 12; 5 rows of 6 = 5 x 6 = 30; 2 rows of 8 = 2 x 8 = 16",
            "3x4=12; 5x6=30; 2x8=16",
          ],
          workedSolution:
            "Rows are equal groups. Multiply the number of rows by the number in each row.",
          supportPrompt:
            "Say each array as equal rows before writing the equation.",
          misconceptionTargets: [
            "array-row-column-confusion",
            "equal-groups-multiplication-confusion",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-array-001",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use array context cards with rows and columns labelled.",
          },
        },
        {
          id: "multiplication-facts-equal-groups",
          title: "Choose the equal-groups equation",
          prompt:
            "There are 7 equal groups with 3 counters in each group. Which equation matches?",
          taskType: "multiple_choice",
          options: ["7 x 3 = 21", "7 + 3 = 10", "21 / 7 = 7", "7 - 3 = 4"],
          expectedAnswer: "7 x 3 = 21",
          acceptableAnswers: ["7 x 3 = 21", "21"],
          workedSolution:
            "There are 7 groups, and each group has 3 counters. That is 7 x 3 = 21.",
          supportPrompt:
            "Ask how many groups there are and how many are in each group.",
          misconceptionTargets: [
            "equal-groups-multiplication-confusion",
            "multiplication-as-addition-only-error",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-equal-groups-002",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Show 7 equal groups with 3 counters in each group.",
          },
        },
        {
          id: "multiplication-facts-fluent-product",
          title: "Use a multiplication fact",
          prompt:
            "Use skip-counting or a number line if needed. What is 8 x 7?",
          taskType: "numeric",
          expectedAnswer: "56",
          acceptableAnswers: ["56"],
          workedSolution:
            "Count seven groups of 8: 8, 16, 24, 32, 40, 48, 56. So 8 x 7 = 56.",
          supportPrompt:
            "Use a number line with jumps of 8 until there are 7 jumps.",
          misconceptionTargets: [
            "times-table-fluency-gap",
            "equal-groups-multiplication-confusion",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-fact-003",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use seven equal jumps of 8 on a skip-counting number line.",
          },
        },
      ],
    },
    {
      id: "division-facts-and-equal-groups",
      type: "understanding",
      title: "Division facts and equal groups",
      learnerGoal:
        "I can connect division facts with sharing, grouping and inverse multiplication.",
      tasks: [
        {
          id: "division-facts-sharing-context",
          title: "Classify a sharing story",
          prompt:
            "24 counters are shared equally between 6 learners. Choose the description that matches the story.",
          taskType: "multiple_choice",
          options: [
            "Division as sharing: 24 / 6 asks how many counters each learner gets.",
            "Division as grouping: 24 / 6 asks how many groups of 6 learners there are.",
            "Multiplication: 24 x 6 asks for the total.",
            "Addition: 24 + 6 asks for the total.",
          ],
          expectedAnswer:
            "Division as sharing: 24 / 6 asks how many counters each learner gets.",
          acceptableAnswers: [
            "Division as sharing: 24 / 6 asks how many counters each learner gets.",
          ],
          workedSolution:
            "The total is shared between 6 learners, so division finds the size of each share.",
          supportPrompt:
            "Sharing means the number of groups is known and the share size is unknown.",
          misconceptionTargets: [
            "division-sharing-grouping-confusion",
            "division-context-error",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-sharing-004",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Show 24 counters shared into 6 equal learner groups.",
          },
        },
        {
          id: "division-facts-grouping-gap",
          title: "Complete a grouping equation",
          prompt:
            "There are 35 pencils. Each cup holds 5 pencils. Complete: 35 / 5 = __ cups.",
          taskType: "numeric",
          expectedAnswer: "7",
          acceptableAnswers: ["7"],
          workedSolution:
            "This asks how many groups of 5 are in 35. Since 7 x 5 = 35, 35 / 5 = 7.",
          supportPrompt:
            "Make equal groups of 5 until all 35 pencils are used.",
          misconceptionTargets: [
            "division-sharing-grouping-confusion",
            "division-context-error",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-grouping-005",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Show 35 pencils grouped into cups with 5 pencils in each cup.",
          },
        },
        {
          id: "division-facts-related-multiplication",
          title: "Choose related multiplication working",
          prompt:
            "Which working correctly solves 48 / 6?",
          taskType: "multiple_choice",
          options: [
            "Use 6 x 8 = 48, so 48 / 6 = 8.",
            "Use 6 + 8 = 14, so 48 / 6 = 14.",
            "Use 48 - 6 = 42, so 48 / 6 = 42.",
            "Use 6 x 6 = 48, so 48 / 6 = 6.",
          ],
          expectedAnswer: "Use 6 x 8 = 48, so 48 / 6 = 8.",
          acceptableAnswers: ["Use 6 x 8 = 48, so 48 / 6 = 8.", "8"],
          workedSolution:
            "Division can be checked with multiplication. The number that multiplies by 6 to make 48 is 8.",
          supportPrompt:
            "Ask: 6 times what number makes 48?",
          misconceptionTargets: [
            "multiplication-division-inverse-confusion",
            "fact-family-relationship-error",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-related-fact-006",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a related-facts table showing 6 x 8 = 48 and 48 / 6 = 8.",
          },
        },
      ],
    },
    {
      id: "fact-families-and-inverse-relationships",
      type: "reasoning",
      title: "Fact families and inverse relationships",
      learnerGoal:
        "I can use related multiplication and division facts to solve missing-value problems.",
      tasks: [
        {
          id: "fact-families-select-equations",
          title: "Select a fact family",
          prompt:
            "Which option lists only equations in the fact family for 4, 9 and 36?",
          taskType: "multiple_choice",
          options: [
            "4 x 9 = 36; 9 x 4 = 36; 36 / 4 = 9; 36 / 9 = 4",
            "4 x 9 = 36; 36 / 4 = 4; 9 + 4 = 13; 36 - 9 = 27",
            "4 + 9 = 36; 9 x 4 = 13; 36 / 9 = 9; 36 / 4 = 4",
            "36 x 4 = 9; 36 x 9 = 4; 4 / 9 = 36; 9 / 4 = 36",
          ],
          expectedAnswer:
            "4 x 9 = 36; 9 x 4 = 36; 36 / 4 = 9; 36 / 9 = 4",
          acceptableAnswers: [
            "4 x 9 = 36; 9 x 4 = 36; 36 / 4 = 9; 36 / 9 = 4",
          ],
          workedSolution:
            "The same three numbers make two multiplication facts and two division facts.",
          supportPrompt:
            "Put 4, 9 and 36 into a fact-family table.",
          misconceptionTargets: [
            "fact-family-relationship-error",
            "multiplication-division-inverse-confusion",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-fact-family-007",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a fact-family table for 4, 9 and 36.",
          },
        },
        {
          id: "fact-families-missing-factor",
          title: "Find a missing factor",
          prompt: "Complete the equation: __ x 8 = 64.",
          taskType: "short_answer",
          expectedAnswer: "8",
          acceptableAnswers: ["8"],
          workedSolution:
            "Use the related division fact: 64 / 8 = 8. The missing factor is 8.",
          supportPrompt:
            "Turn the missing-factor problem into a division fact.",
          misconceptionTargets: [
            "missing-factor-error",
            "times-table-fluency-gap",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-missing-value-008",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a fact-family table connecting 8 x 8 = 64 and 64 / 8 = 8.",
          },
        },
        {
          id: "fact-families-inverse-explanation",
          title: "Explain inverse reasoning",
          prompt:
            "A learner solves 56 / 8 by subtracting 8 once and getting 48. Which explanation is best?",
          taskType: "multiple_choice",
          options: [
            "Use multiplication instead: 8 x 7 = 56, so 56 / 8 = 7.",
            "Subtracting 8 once is enough because division means take away once.",
            "56 / 8 = 8 because both numbers include 8.",
            "56 / 8 cannot be checked with multiplication.",
          ],
          expectedAnswer:
            "Use multiplication instead: 8 x 7 = 56, so 56 / 8 = 7.",
          acceptableAnswers: [
            "Use multiplication instead: 8 x 7 = 56, so 56 / 8 = 7.",
            "7",
          ],
          workedSolution:
            "Division asks how many equal groups or how many in each group. The inverse multiplication fact checks the answer.",
          supportPrompt:
            "Find the multiplication fact with 8 and 56.",
          misconceptionTargets: [
            "multiplication-division-inverse-confusion",
            "fact-family-relationship-error",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-inverse-working-009",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a related-facts table for 8, 7 and 56.",
          },
        },
      ],
    },
    {
      id: "multiplicative-problem-solving",
      type: "problem_solving",
      title: "Multiplicative problem solving",
      learnerGoal:
        "I can choose multiplication or division strategies in simple contexts.",
      tasks: [
        {
          id: "multiplicative-problem-solving-context-correction",
          title: "Correct an operation choice",
          prompt:
            "True or false: 6 bags with 4 apples in each bag should be solved with 6 + 4 because the numbers are 6 and 4. If false, choose the correction.",
          taskType: "multiple_choice",
          options: [
            "False. Use 6 x 4 because there are 6 equal groups of 4.",
            "True. Add 6 + 4 because both numbers appear in the story.",
            "False. Use 6 / 4 because there are two numbers.",
            "True. Multiplication is only for arrays, not bags.",
          ],
          expectedAnswer:
            "False. Use 6 x 4 because there are 6 equal groups of 4.",
          acceptableAnswers: [
            "False. Use 6 x 4 because there are 6 equal groups of 4.",
            "6 x 4",
          ],
          workedSolution:
            "The story has 6 equal groups and 4 in each group, so multiplication finds the total.",
          supportPrompt:
            "Look for equal groups in the story before choosing the operation.",
          misconceptionTargets: [
            "operation-choice-error",
            "multiplication-context-error",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-context-classification-010",
            "multiplication-division-fluency-best-explanation-012",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a context card showing 6 bags with 4 apples in each bag.",
          },
        },
        {
          id: "multiplicative-problem-solving-word-problem",
          title: "Solve a multiplication story",
          prompt:
            "A bookshelf has 8 shelves. Each shelf holds 9 books. How many books can it hold altogether?",
          taskType: "numeric",
          expectedAnswer: "72",
          acceptableAnswers: ["72"],
          workedSolution:
            "There are 8 equal shelves with 9 books on each shelf. Use 8 x 9 = 72.",
          supportPrompt:
            "Draw equal shelves or write the equal-groups equation.",
          misconceptionTargets: [
            "multiplication-context-error",
            "times-table-fluency-gap",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-context-problem-011",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a bookshelf context card with 8 shelves and 9 books per shelf.",
          },
        },
        {
          id: "multiplicative-problem-solving-best-explanation",
          title: "Explain equal groups",
          prompt:
            "A learner says 6 groups of 4 is the same as 6 + 4. Which explanation is best?",
          taskType: "multiple_choice",
          options: [
            "6 groups of 4 means 4 + 4 + 4 + 4 + 4 + 4, which is 24. 6 + 4 is 10.",
            "They are the same because they use the same numbers.",
            "6 groups of 4 means 6 / 4.",
            "Groups always mean add the two numbers once.",
          ],
          expectedAnswer:
            "6 groups of 4 means 4 + 4 + 4 + 4 + 4 + 4, which is 24. 6 + 4 is 10.",
          acceptableAnswers: [
            "6 groups of 4 means 4 + 4 + 4 + 4 + 4 + 4, which is 24. 6 + 4 is 10.",
          ],
          workedSolution:
            "Multiplication shows repeated equal groups. Adding the two factors once is a different situation.",
          supportPrompt:
            "Build six equal groups of four and compare that with one 6 plus one 4.",
          misconceptionTargets: [
            "equal-groups-multiplication-confusion",
            "multiplication-as-addition-only-error",
            "operation-choice-error",
          ],
          relatedAssessmentItemIds: [
            "multiplication-division-fluency-best-explanation-012",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Compare six equal groups of 4 with a single 6 + 4 context.",
          },
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-multiplication-facts-and-arrays",
      title: "Mini Check: arrays and facts",
      prompt:
        "An array has 6 rows with 5 counters in each row. Write the multiplication fact and product.",
      taskType: "short_answer",
      expectedAnswer: "6 x 5 = 30",
      acceptableAnswers: ["6 x 5 = 30", "5 x 6 = 30", "30"],
      workedSolution:
        "There are 6 equal rows and 5 counters in each row, so 6 x 5 = 30.",
      supportPrompt:
        "Read the array as rows and counters in each row.",
      misconceptionTargets: [
        "array-row-column-confusion",
        "equal-groups-multiplication-confusion",
      ],
      relatedAssessmentItemIds: [
        "multiplication-division-fluency-array-001",
        "multiplication-division-fluency-equal-groups-002",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Use an array with 6 rows and 5 counters in each row.",
      },
    },
    {
      id: "mini-check-division-facts-and-equal-groups",
      title: "Mini Check: division facts",
      prompt:
        "42 counters are put into equal groups of 6. How many groups are made?",
      taskType: "numeric",
      expectedAnswer: "7",
      acceptableAnswers: ["7"],
      workedSolution:
        "This is grouping. Since 7 x 6 = 42, there are 7 groups.",
      supportPrompt:
        "Ask how many groups of 6 are in 42.",
      misconceptionTargets: [
        "division-sharing-grouping-confusion",
        "multiplication-division-inverse-confusion",
      ],
      relatedAssessmentItemIds: [
        "multiplication-division-fluency-grouping-005",
        "multiplication-division-fluency-related-fact-006",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Show 42 counters arranged into equal groups of 6.",
      },
    },
    {
      id: "mini-check-fact-families-inverse",
      title: "Mini Check: fact family",
      prompt:
        "Write two multiplication facts and two division facts for 3, 8 and 24.",
      taskType: "short_answer",
      expectedAnswer:
        "3 x 8 = 24; 8 x 3 = 24; 24 / 3 = 8; 24 / 8 = 3",
      acceptableAnswers: [
        "3 x 8 = 24; 8 x 3 = 24; 24 / 3 = 8; 24 / 8 = 3",
        "8 x 3 = 24; 3 x 8 = 24; 24 / 8 = 3; 24 / 3 = 8",
      ],
      workedSolution:
        "A fact family uses the same three numbers in related multiplication and division facts.",
      supportPrompt:
        "Put 3, 8 and 24 into a fact-family table.",
      misconceptionTargets: [
        "fact-family-relationship-error",
        "multiplication-division-inverse-confusion",
      ],
      relatedAssessmentItemIds: [
        "multiplication-division-fluency-fact-family-007",
        "multiplication-division-fluency-inverse-working-009",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use a fact-family table with blanks for two multiplication and two division facts.",
      },
    },
    {
      id: "mini-check-multiplicative-problem-solving",
      title: "Mini Check: choose and solve",
      prompt:
        "There are 9 boxes with 6 pencils in each box. What operation should you use, and how many pencils are there altogether?",
      taskType: "short_answer",
      expectedAnswer: "9 x 6 = 54",
      acceptableAnswers: ["9 x 6 = 54", "6 x 9 = 54", "54"],
      workedSolution:
        "There are 9 equal groups of 6 pencils, so use multiplication: 9 x 6 = 54.",
      supportPrompt:
        "Look for equal groups and decide whether the total is unknown.",
      misconceptionTargets: [
        "operation-choice-error",
        "multiplication-context-error",
        "times-table-fluency-gap",
      ],
      relatedAssessmentItemIds: [
        "multiplication-division-fluency-context-classification-010",
        "multiplication-division-fluency-context-problem-011",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Use a context card showing 9 boxes with 6 pencils in each box.",
      },
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised multiplication and division fluency. They worked on arrays, equal groups, sharing, grouping, related facts, fact families, inverse relationships and choosing operations in simple contexts.",
};

export const NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PRACTICE_MODULES =
  Object.freeze([NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PRACTICE_MODULE]);

export function getNumberMultiplicationDivisionFluencyPracticeModuleById(
  id: string,
) {
  const normalizedId = safe(id);
  return (
    NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberMultiplicationDivisionFluencyPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
