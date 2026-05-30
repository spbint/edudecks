import {
  NUMBER_PATTERNS_EARLY_ALGEBRA_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPatternsEarlyAlgebraAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_PATTERNS_EARLY_ALGEBRA_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-patterns-early-algebra-practice-module-v1",
  progressionBandKey: "number-patterns-and-early-algebraic-thinking",
  title: "Number patterns and early algebraic thinking",
  shortTitle: "Number patterns",
  description:
    "Practise skip-counting, growing and shrinking patterns, input-output rules, missing numbers and simple equation thinking.",
  yearBandLabel: "Years 3-5",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  stepKey: "number-patterns-and-early-algebraic-thinking",
  pathwayStepId:
    "mathematics::number-and-place-value::middle-primary::number-patterns-and-early-algebraic-thinking",
  relatedAssessmentBankKey: NUMBER_PATTERNS_EARLY_ALGEBRA_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Number patterns follow a rule. Skip-counting patterns increase or decrease by the same amount. Growing and shrinking patterns can be described by their change. Input-output tables show what happens when a rule is used, and missing-number equations can be solved by thinking about relationships and inverse operations.",
    keyLanguage: [
      "pattern",
      "sequence",
      "rule",
      "term",
      "increase",
      "decrease",
      "input",
      "output",
      "table",
      "equation",
      "missing number",
      "inverse",
    ],
    workedExample:
      "For the sequence 7, 11, 15, 19, compare each term with the next. The change is +4 every time, so the rule is add 4 and the next term is 23.",
    parentTip:
      "This module helps learners notice structure in numbers, which later supports algebra and problem solving.",
  },
  sections: [
    {
      id: "skip-counting-and-number-sequences",
      type: "fluency",
      title: "Skip-counting and number sequences",
      learnerGoal:
        "I can continue and describe number sequences using skip-counting and repeated changes.",
      tasks: [
        {
          id: "skip-counting-continue-sequence",
          title: "Continue the sequence",
          prompt:
            "Use equal jumps on a number line. Continue the sequence: 9, 14, 19, 24, __.",
          taskType: "numeric",
          expectedAnswer: "29",
          acceptableAnswers: ["29"],
          workedSolution:
            "Each term increases by 5, so 24 + 5 = 29.",
          supportPrompt:
            "Find the change from one term to the next, then repeat it.",
          misconceptionTargets: ["skip-counting-step-error"],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-skip-counting-001",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use equal jumps of 5 from 9 to 29 on a number line.",
          },
        },
        {
          id: "skip-counting-identify-rule",
          title: "Identify the rule",
          prompt: "Which rule fits the sequence 72, 64, 56, 48?",
          taskType: "multiple_choice",
          options: [
            "Subtract 8 each time",
            "Add 8 each time",
            "Subtract 6 each time",
            "Add 6 each time",
          ],
          expectedAnswer: "Subtract 8 each time",
          acceptableAnswers: ["Subtract 8 each time", "-8"],
          workedSolution:
            "72 to 64 is -8, and the same change happens each time.",
          supportPrompt:
            "Check both the size and direction of the change.",
          misconceptionTargets: [
            "sequence-rule-confusion",
            "shrinking-pattern-direction-error",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-sequence-rule-002",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use backward jumps of 8 on a number line.",
          },
        },
        {
          id: "skip-counting-membership",
          title: "Choose terms in the sequence",
          prompt:
            "A sequence starts at 7 and adds 7 each time. Which option lists only terms in the sequence?",
          taskType: "multiple_choice",
          options: [
            "14, 21, 28",
            "12, 21, 29",
            "7, 15, 23",
            "14, 20, 26",
          ],
          expectedAnswer: "14, 21, 28",
          acceptableAnswers: ["14, 21, 28", "14 21 28"],
          workedSolution:
            "Starting at 7 and adding 7 gives 7, 14, 21, 28.",
          supportPrompt:
            "Generate the sequence first, then compare the options.",
          misconceptionTargets: [
            "skip-counting-step-error",
            "sequence-rule-confusion",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-sequence-membership-003",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Mark terms with equal jumps of 7.",
          },
        },
      ],
    },
    {
      id: "growing-and-shrinking-patterns",
      type: "understanding",
      title: "Growing and shrinking patterns",
      learnerGoal:
        "I can identify, continue and describe increasing and decreasing number patterns.",
      tasks: [
        {
          id: "growing-pattern-next-term",
          title: "Continue a growing pattern",
          prompt:
            "A growing pattern has 4, 9, 14, 19. Type the next term.",
          taskType: "numeric",
          expectedAnswer: "24",
          acceptableAnswers: ["24"],
          workedSolution:
            "Each term increases by 5. Add 5 to 19 to get 24.",
          supportPrompt:
            "Record the change between each pair of terms.",
          misconceptionTargets: [
            "growing-pattern-rate-error",
            "pattern-continuation-error",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-growing-gap-004",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a pattern table showing each term and the change of +5.",
          },
        },
        {
          id: "shrinking-pattern-correction",
          title: "Correct a shrinking pattern",
          prompt:
            "A learner says 80, 73, 66, 59 continues with 66 because the numbers go up by 7. Which correction is best?",
          taskType: "multiple_choice",
          options: [
            "The pattern decreases by 7, so the next term is 52.",
            "The pattern increases by 7, so the next term is 66.",
            "The pattern decreases by 5, so the next term is 54.",
            "The pattern doubles each time.",
          ],
          expectedAnswer: "The pattern decreases by 7, so the next term is 52.",
          acceptableAnswers: [
            "The pattern decreases by 7, so the next term is 52.",
            "52",
          ],
          workedSolution:
            "80 to 73 is -7, 73 to 66 is -7, and 66 to 59 is -7. Continue with 59 - 7 = 52.",
          supportPrompt:
            "Decide whether the pattern is increasing or decreasing before continuing.",
          misconceptionTargets: [
            "shrinking-pattern-direction-error",
            "pattern-continuation-error",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-shrinking-correction-005",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use backward jumps of 7 on a number line.",
          },
        },
        {
          id: "pattern-rule-explanation",
          title: "Explain the change",
          prompt:
            "Which explanation best describes the rule for 6, 10, 14, 18?",
          taskType: "multiple_choice",
          options: [
            "Each term increases by 4.",
            "Each term increases by its position number.",
            "Any even number can come next.",
            "Each term is multiplied by 4.",
          ],
          expectedAnswer: "Each term increases by 4.",
          acceptableAnswers: ["Each term increases by 4.", "add 4", "+4"],
          workedSolution:
            "The difference between neighbouring terms is always 4.",
          supportPrompt:
            "Compare neighbouring terms, not just the type of numbers.",
          misconceptionTargets: [
            "sequence-rule-confusion",
            "term-position-confusion",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-rule-explanation-006",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a table to show each term and the repeated +4 change.",
          },
        },
      ],
    },
    {
      id: "input-output-rules-and-tables",
      type: "problem_solving",
      title: "Input-output rules and tables",
      learnerGoal:
        "I can use simple rules and tables to connect inputs and outputs.",
      tasks: [
        {
          id: "input-output-complete-table",
          title: "Complete a table",
          prompt:
            "The rule is output = input x 4. What is the output when the input is 6?",
          taskType: "numeric",
          expectedAnswer: "24",
          acceptableAnswers: ["24"],
          workedSolution:
            "Apply the rule to the input: 6 x 4 = 24.",
          supportPrompt:
            "Use the rule on the input number, not on the previous output.",
          misconceptionTargets: [
            "input-output-rule-error",
            "table-pattern-confusion",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-input-output-table-007",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use an input-output table with a multiply by 4 rule.",
          },
        },
        {
          id: "input-output-match-rule",
          title: "Match a rule to a table",
          prompt:
            "Which rule fits this input-output table: 3 -> 8, 4 -> 9, 5 -> 10?",
          taskType: "multiple_choice",
          options: ["Add 5", "Multiply by 5", "Subtract 5", "Add 3"],
          expectedAnswer: "Add 5",
          acceptableAnswers: ["Add 5", "+5"],
          workedSolution:
            "Each output is 5 more than the input: 3 + 5 = 8, 4 + 5 = 9, 5 + 5 = 10.",
          supportPrompt:
            "Test the same rule on every row.",
          misconceptionTargets: [
            "input-output-rule-error",
            "table-pattern-confusion",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-rule-table-match-008",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a table and compare each input to its output.",
          },
        },
        {
          id: "input-output-apply-rule",
          title: "Apply the rule",
          prompt:
            "A table uses the rule output = input + 15. Which working finds the output for input 26?",
          taskType: "multiple_choice",
          options: [
            "26 + 15 = 41",
            "26 - 15 = 11",
            "26 x 15 = 390",
            "15 + 15 = 30",
          ],
          expectedAnswer: "26 + 15 = 41",
          acceptableAnswers: ["26 + 15 = 41", "41"],
          workedSolution:
            "The rule says add 15 to the input. 26 + 15 = 41.",
          supportPrompt:
            "Read the operation in the rule before calculating.",
          misconceptionTargets: [
            "input-output-rule-error",
            "operation-choice-pattern-error",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-apply-rule-working-009",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a table row with input 26, rule add 15, output 41.",
          },
        },
      ],
    },
    {
      id: "missing-numbers-and-simple-equations",
      type: "reasoning",
      title: "Missing numbers and simple equations",
      learnerGoal:
        "I can solve missing-number statements and simple equations using number relationships.",
      tasks: [
        {
          id: "missing-number-equation",
          title: "Find the missing number",
          prompt: "Complete the equation: __ + 34 = 90.",
          taskType: "numeric",
          expectedAnswer: "56",
          acceptableAnswers: ["56"],
          workedSolution:
            "Use inverse thinking: 90 - 34 = 56. Check: 56 + 34 = 90.",
          supportPrompt:
            "Undo the addition with subtraction.",
          misconceptionTargets: [
            "missing-number-equation-error",
            "inverse-operation-gap",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-missing-equation-010",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a missing-number equation card with the total 90.",
          },
        },
        {
          id: "balanced-unbalanced-statements",
          title: "Classify balanced statements",
          prompt:
            "Which option lists only balanced statements?",
          taskType: "multiple_choice",
          options: [
            "15 + 5 = 10 + 10; 6 x 4 = 20 + 4",
            "15 + 5 = 19; 6 x 4 = 20 + 5",
            "30 - 8 = 20; 7 + 9 = 10 + 5",
            "12 + 6 = 20; 9 x 3 = 30",
          ],
          expectedAnswer: "15 + 5 = 10 + 10; 6 x 4 = 20 + 4",
          acceptableAnswers: [
            "15 + 5 = 10 + 10; 6 x 4 = 20 + 4",
          ],
          workedSolution:
            "Both sides of 15 + 5 = 10 + 10 are 20. Both sides of 6 x 4 = 20 + 4 are 24.",
          supportPrompt:
            "Calculate both sides of the equals sign.",
          misconceptionTargets: [
            "equality-balance-confusion",
            "missing-number-equation-error",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-balance-classification-011",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a balance-style card to compare each side of an equation.",
          },
        },
        {
          id: "inverse-thinking-context",
          title: "Use inverse thinking",
          prompt:
            "A number multiplied by 5 equals 45. Which working finds the missing number?",
          taskType: "multiple_choice",
          options: [
            "45 / 5 = 9",
            "45 + 5 = 50",
            "45 - 5 = 40",
            "45 x 5 = 225",
          ],
          expectedAnswer: "45 / 5 = 9",
          acceptableAnswers: ["45 / 5 = 9", "9"],
          workedSolution:
            "Division undoes multiplication. 45 / 5 = 9, so the missing number is 9.",
          supportPrompt:
            "Ask which operation undoes multiplication.",
          misconceptionTargets: [
            "inverse-operation-gap",
            "operation-choice-pattern-error",
          ],
          relatedAssessmentItemIds: [
            "patterns-early-algebra-inverse-context-012",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use an equation card showing an unknown number times 5 equals 45.",
          },
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-skip-counting-sequences",
      title: "Mini Check: number sequences",
      prompt: "Continue the sequence: 11, 18, 25, 32, __.",
      taskType: "numeric",
      expectedAnswer: "39",
      acceptableAnswers: ["39"],
      workedSolution:
        "The sequence increases by 7 each time. 32 + 7 = 39.",
      supportPrompt:
        "Find the repeated change between neighbouring terms.",
      misconceptionTargets: ["skip-counting-step-error"],
      relatedAssessmentItemIds: [
        "patterns-early-algebra-skip-counting-001",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use equal jumps of 7 from 11 to 39.",
      },
    },
    {
      id: "mini-check-growing-shrinking-patterns",
      title: "Mini Check: growing and shrinking",
      prompt: "A shrinking pattern is 90, 82, 74, 66. What is the next term?",
      taskType: "numeric",
      expectedAnswer: "58",
      acceptableAnswers: ["58"],
      workedSolution:
        "Each term decreases by 8, so 66 - 8 = 58.",
      supportPrompt:
        "Check whether the pattern is increasing or decreasing.",
      misconceptionTargets: [
        "shrinking-pattern-direction-error",
        "pattern-continuation-error",
      ],
      relatedAssessmentItemIds: [
        "patterns-early-algebra-shrinking-correction-005",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use backward jumps of 8 from 90 to 58.",
      },
    },
    {
      id: "mini-check-input-output-rules",
      title: "Mini Check: input-output rules",
      prompt: "The rule is output = input x 5. What is the output for input 8?",
      taskType: "numeric",
      expectedAnswer: "40",
      acceptableAnswers: ["40"],
      workedSolution:
        "Apply the rule to the input: 8 x 5 = 40.",
      supportPrompt:
        "Use the rule on the input in that row.",
      misconceptionTargets: [
        "input-output-rule-error",
        "table-pattern-confusion",
      ],
      relatedAssessmentItemIds: [
        "patterns-early-algebra-input-output-table-007",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use an input-output table with a multiply by 5 rule.",
      },
    },
    {
      id: "mini-check-missing-equations",
      title: "Mini Check: equations",
      prompt: "Complete the equation: __ x 6 = 42.",
      taskType: "numeric",
      expectedAnswer: "7",
      acceptableAnswers: ["7"],
      workedSolution:
        "Use inverse thinking: 42 / 6 = 7. Check: 7 x 6 = 42.",
      supportPrompt:
        "Undo multiplication with division.",
      misconceptionTargets: [
        "inverse-operation-gap",
        "missing-number-equation-error",
      ],
      relatedAssessmentItemIds: [
        "patterns-early-algebra-inverse-context-012",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Use a missing-number equation card for __ x 6 = 42.",
      },
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised number patterns and early algebraic thinking. They worked on sequences, growing and shrinking patterns, input-output rules, missing numbers and simple equations.",
};

export const NUMBER_PATTERNS_EARLY_ALGEBRA_PRACTICE_MODULES = Object.freeze([
  NUMBER_PATTERNS_EARLY_ALGEBRA_PRACTICE_MODULE,
]);

export function getNumberPatternsEarlyAlgebraPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_PATTERNS_EARLY_ALGEBRA_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberPatternsEarlyAlgebraPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_PATTERNS_EARLY_ALGEBRA_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
