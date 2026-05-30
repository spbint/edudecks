import {
  NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberFractionsFoundationsAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_FRACTIONS_FOUNDATIONS_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-fractions-foundations-practice-module-v1",
  progressionBandKey: "fractions-foundations",
  title: "Fractions foundations",
  shortTitle: "Fractions foundations",
  description:
    "Practise fraction meaning, equal parts, equivalent fractions, comparing and ordering fractions, and simple fraction problem solving.",
  yearBandLabel: "Years 3-5",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  stepKey: "fractions-foundations",
  pathwayStepId:
    "mathematics::number-and-place-value::middle-primary::fractions-foundations",
  relatedAssessmentBankKey: NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Fractions show equal parts of a whole, a collection, or a number line. The numerator tells how many parts are being counted, and the denominator tells how many equal parts make the whole. Equivalent fractions look different but have the same value, and benchmarks like 0, 1/2 and 1 help when comparing and ordering.",
    keyLanguage: [
      "fraction",
      "numerator",
      "denominator",
      "equal parts",
      "whole",
      "equivalent fraction",
      "number line",
      "benchmark",
      "compare",
      "order",
      "sharing",
    ],
    workedExample:
      "If a bar is split into 4 equal parts and 3 are shaded, the shaded amount is 3/4. On a number line from 0 to 1, 2/4 lands at the same point as 1/2.",
    parentTip:
      "This module helps learners see fractions as numbers and quantities, not just symbols to memorise.",
  },
  sections: [
    {
      id: "fraction-meaning-and-representation",
      type: "understanding",
      title: "Fraction meaning and representation",
      learnerGoal:
        "I can understand fractions as equal parts of a whole, collection or number line.",
      tasks: [
        {
          id: "fraction-meaning-shaded-equal-parts",
          title: "Name shaded equal parts",
          prompt:
            "A fraction bar is split into 6 equal parts. 4 parts are shaded. What fraction is shaded?",
          taskType: "multiple_choice",
          options: ["4/6", "6/4", "4/10", "2/6"],
          expectedAnswer: "4/6",
          acceptableAnswers: ["4/6", "2/3"],
          workedSolution:
            "There are 6 equal parts in the whole and 4 are shaded, so the shaded fraction is 4/6. This is also equivalent to 2/3.",
          supportPrompt:
            "Count the equal parts in the whole for the denominator, then count shaded parts for the numerator.",
          misconceptionTargets: [
            "unequal-parts-fraction-error",
            "numerator-denominator-role-confusion",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-equal-parts-001",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a fraction bar split into 6 equal parts with 4 shaded.",
          },
        },
        {
          id: "fraction-meaning-numerator-denominator-match",
          title: "Match fraction language",
          prompt:
            "Match the parts of 3/5: numerator 3, denominator 5, and fraction 3/5.",
          taskType: "sort_or_match",
          expectedAnswer:
            "numerator 3 = 3 parts counted; denominator 5 = 5 equal parts in the whole; 3/5 = 3 of 5 equal parts",
          acceptableAnswers: [
            "numerator 3 = 3 parts counted; denominator 5 = 5 equal parts in the whole; 3/5 = 3 of 5 equal parts",
          ],
          workedSolution:
            "The denominator names the number of equal parts in the whole. The numerator counts how many of those parts are used.",
          supportPrompt:
            "Read the bottom number as the size of the whole partition and the top number as the count.",
          misconceptionTargets: ["numerator-denominator-role-confusion"],
          relatedAssessmentItemIds: [
            "fractions-foundations-numerator-denominator-002",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a simple table matching numerator, denominator and fraction meaning.",
          },
        },
        {
          id: "fraction-meaning-number-line-third",
          title: "Place a fraction on a number line",
          prompt:
            "A number line from 0 to 1 is split into 3 equal spaces. Which fraction is at the first tick after 0?",
          taskType: "short_answer",
          expectedAnswer: "1/3",
          acceptableAnswers: ["1/3", "one third"],
          workedSolution:
            "Three equal spaces make thirds. The first tick after 0 is 1/3.",
          supportPrompt:
            "Count spaces, not tick marks, to name the denominator.",
          misconceptionTargets: [
            "fraction-number-line-placement-error",
            "denominator-as-size-confusion",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-number-line-003",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use a 0 to 1 number line partitioned into three equal spaces.",
          },
        },
      ],
    },
    {
      id: "equivalent-fractions",
      type: "fluency",
      title: "Equivalent fractions",
      learnerGoal:
        "I can recognise and create fractions that have the same value.",
      tasks: [
        {
          id: "equivalent-fractions-match-bars",
          title: "Match equivalent fractions",
          prompt:
            "Match each fraction to an equivalent fraction using equal-length fraction bars: 1/2, 1/3, 3/4.",
          taskType: "sort_or_match",
          expectedAnswer: "1/2 = 2/4; 1/3 = 2/6; 3/4 = 6/8",
          acceptableAnswers: ["1/2 = 2/4; 1/3 = 2/6; 3/4 = 6/8"],
          workedSolution:
            "Equivalent fractions cover the same amount of the same whole. Each pair is made by multiplying numerator and denominator by the same number.",
          supportPrompt:
            "Use fraction bars of the same length and look for bars that end at the same point.",
          misconceptionTargets: [
            "equivalent-fraction-scaling-error",
            "mixed-representation-confusion",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-equivalent-match-004",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use an equivalent-fraction table and aligned fraction bars.",
          },
        },
        {
          id: "equivalent-fractions-missing-denominator",
          title: "Complete an equivalent fraction",
          prompt: "Complete the missing denominator: 3/4 = 6/__.",
          taskType: "numeric",
          expectedAnswer: "8",
          acceptableAnswers: ["8"],
          workedSolution:
            "The numerator 3 was multiplied by 2 to make 6, so the denominator 4 must also be multiplied by 2. The missing denominator is 8.",
          supportPrompt:
            "Find the scale factor on the numerator, then use the same factor on the denominator.",
          misconceptionTargets: ["equivalent-fraction-scaling-error"],
          relatedAssessmentItemIds: [
            "fractions-foundations-equivalent-gap-005",
            "fractions-foundations-correct-working-010",
          ],
          visualSupport: {
            type: "table",
            description:
              "Show numerator and denominator each scaled by the same factor.",
          },
        },
        {
          id: "equivalent-fractions-select-halves",
          title: "Select fractions equal to one half",
          prompt:
            "Which option lists only fractions equivalent to 1/2?",
          taskType: "multiple_choice",
          options: [
            "2/4, 3/6, 5/10",
            "1/3, 2/6, 3/9",
            "2/3, 4/6, 6/9",
            "1/4, 2/8, 3/12",
          ],
          expectedAnswer: "2/4, 3/6, 5/10",
          acceptableAnswers: ["2/4, 3/6, 5/10"],
          workedSolution:
            "Each fraction in the correct option has a numerator that is half of the denominator, so each has the value 1/2.",
          supportPrompt:
            "Use the benchmark 1/2 and ask whether the top number is exactly half of the bottom number.",
          misconceptionTargets: [
            "equivalent-fraction-scaling-error",
            "whole-number-thinking-with-fractions",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-equivalent-select-006",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a table or fraction bars comparing each fraction with 1/2.",
          },
        },
      ],
    },
    {
      id: "comparing-and-ordering-fractions",
      type: "reasoning",
      title: "Comparing and ordering fractions",
      learnerGoal:
        "I can compare and order fractions using benchmarks and representations.",
      tasks: [
        {
          id: "comparing-fractions-same-denominator",
          title: "Correct a same-denominator comparison",
          prompt:
            "True or false: 6/10 is greater than 4/10 because both fractions are tenths and 6 tenths is more than 4 tenths.",
          taskType: "multiple_choice",
          options: ["True", "False"],
          expectedAnswer: "True",
          acceptableAnswers: ["True", "true"],
          workedSolution:
            "Both fractions have the same denominator, so the parts are the same size. Six tenths is greater than four tenths.",
          supportPrompt:
            "When denominators match, compare how many same-size parts are counted.",
          misconceptionTargets: ["same-denominator-comparison-error"],
          relatedAssessmentItemIds: [
            "fractions-foundations-same-denominator-007",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Place 4/10 and 6/10 on the same number line or aligned fraction bar.",
          },
        },
        {
          id: "comparing-fractions-same-numerator",
          title: "Explain unit fraction size",
          prompt:
            "A learner says 1/6 is greater than 1/3 because 6 is greater than 3. Which explanation is best?",
          taskType: "multiple_choice",
          options: [
            "1/3 is greater because thirds are larger parts than sixths.",
            "1/6 is greater because 6 is greater than 3.",
            "They are equal because both have numerator 1.",
            "The denominator does not affect the size of a fraction.",
          ],
          expectedAnswer:
            "1/3 is greater because thirds are larger parts than sixths.",
          acceptableAnswers: [
            "1/3 is greater because thirds are larger parts than sixths.",
          ],
          workedSolution:
            "Splitting the same whole into 3 equal parts makes larger pieces than splitting it into 6 equal parts. So 1/3 is greater than 1/6.",
          supportPrompt:
            "Draw two same-size bars: one split into thirds and one split into sixths.",
          misconceptionTargets: [
            "same-numerator-comparison-error",
            "denominator-as-size-confusion",
            "whole-number-thinking-with-fractions",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-same-numerator-008",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Show 1/3 and 1/6 on the same 0 to 1 number line or aligned bars.",
          },
        },
        {
          id: "comparing-fractions-benchmark-order",
          title: "Order with benchmarks",
          prompt:
            "Order from smallest to largest using the benchmarks 0, 1/2 and 1: 2/4, 1/4, 4/4, 3/4.",
          taskType: "short_answer",
          expectedAnswer: "1/4, 2/4, 3/4, 4/4",
          acceptableAnswers: [
            "1/4, 2/4, 3/4, 4/4",
            "1/4 2/4 3/4 4/4",
          ],
          workedSolution:
            "1/4 is below 1/2, 2/4 is equal to 1/2, 3/4 is above 1/2, and 4/4 is equal to 1.",
          supportPrompt:
            "Place each fraction near 0, 1/2 or 1 before ordering.",
          misconceptionTargets: [
            "benchmark-fraction-comparison-error",
            "fraction-greater-than-one-confusion",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-benchmark-ordering-009",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use a 0 to 1 number line with benchmark points at 1/2 and 1.",
          },
        },
      ],
    },
    {
      id: "fraction-problem-solving-foundations",
      type: "problem_solving",
      title: "Fraction problem-solving foundations",
      learnerGoal:
        "I can use simple fraction reasoning in sharing, measurement and everyday contexts.",
      tasks: [
        {
          id: "fraction-problem-sharing-quantity",
          title: "Find a fraction of a collection",
          prompt:
            "A tray has 24 counters. A learner uses 1/3 of them. How many counters are used?",
          taskType: "numeric",
          expectedAnswer: "8",
          acceptableAnswers: ["8"],
          workedSolution:
            "One third means split 24 counters into 3 equal groups. 24 / 3 = 8, so the learner uses 8 counters.",
          supportPrompt:
            "For 1/3 of a collection, share the total into 3 equal groups.",
          misconceptionTargets: [
            "fraction-sharing-context-error",
            "denominator-as-size-confusion",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-sharing-context-011",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Show 24 counters shared into 3 equal groups.",
          },
        },
        {
          id: "fraction-problem-correct-working",
          title: "Choose correct fraction working",
          prompt:
            "Which working correctly finds 3/4 of 20 counters?",
          taskType: "multiple_choice",
          options: [
            "20 / 4 = 5, then 3 x 5 = 15.",
            "20 + 4 + 3 = 27.",
            "20 / 3 = 6 remainder 2, so the answer is 6.",
            "3 x 4 = 12, so the answer is 12.",
          ],
          expectedAnswer: "20 / 4 = 5, then 3 x 5 = 15.",
          acceptableAnswers: ["20 / 4 = 5, then 3 x 5 = 15.", "15"],
          workedSolution:
            "One fourth of 20 is 5. Three fourths is three groups of 5, which is 15.",
          supportPrompt:
            "Find one equal part first, then count the number of parts needed.",
          misconceptionTargets: [
            "fraction-sharing-context-error",
            "whole-number-thinking-with-fractions",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-correct-working-010",
            "fractions-foundations-sharing-context-011",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Show 20 counters grouped into fourths, then select 3 groups.",
          },
        },
        {
          id: "fraction-problem-context-classification",
          title: "Classify fraction context parts",
          prompt:
            "Classify each part of the story: A whole pizza is cut into 8 equal slices and 3 slices are eaten.",
          taskType: "sort_or_match",
          expectedAnswer:
            "whole = pizza; denominator = 8 equal slices; numerator = 3 eaten slices; fraction eaten = 3/8",
          acceptableAnswers: [
            "whole = pizza; denominator = 8 equal slices; numerator = 3 eaten slices; fraction eaten = 3/8",
          ],
          workedSolution:
            "The whole is the pizza. It is split into 8 equal slices, so the denominator is 8. Three slices are eaten, so the numerator is 3 and the fraction eaten is 3/8.",
          supportPrompt:
            "Name the whole first, then count total equal parts and selected parts.",
          misconceptionTargets: [
            "fraction-sharing-context-error",
            "numerator-denominator-role-confusion",
            "mixed-representation-confusion",
          ],
          relatedAssessmentItemIds: [
            "fractions-foundations-context-classification-012",
            "fractions-foundations-equal-parts-001",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Show a pizza split into 8 equal slices with 3 eaten or shaded.",
          },
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-fraction-meaning",
      title: "Mini Check: fraction meaning",
      prompt:
        "A bar is split into 5 equal parts and 2 parts are shaded. What fraction is shaded?",
      taskType: "short_answer",
      expectedAnswer: "2/5",
      acceptableAnswers: ["2/5", "two fifths"],
      workedSolution:
        "There are 5 equal parts in the whole and 2 are shaded, so the shaded fraction is 2/5.",
      supportPrompt:
        "Denominator is total equal parts. Numerator is shaded parts.",
      misconceptionTargets: [
        "unequal-parts-fraction-error",
        "numerator-denominator-role-confusion",
      ],
      relatedAssessmentItemIds: [
        "fractions-foundations-equal-parts-001",
        "fractions-foundations-numerator-denominator-002",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Use a fraction bar split into 5 equal parts with 2 shaded.",
      },
    },
    {
      id: "mini-check-equivalent-fractions",
      title: "Mini Check: equivalent fractions",
      prompt: "Complete the equivalent fraction: 4/6 = __/3.",
      taskType: "numeric",
      expectedAnswer: "2",
      acceptableAnswers: ["2"],
      workedSolution:
        "The denominator 6 was divided by 2 to make 3, so divide the numerator 4 by 2 as well. 4/6 = 2/3.",
      supportPrompt:
        "Use the same operation on the numerator and denominator.",
      misconceptionTargets: ["equivalent-fraction-scaling-error"],
      relatedAssessmentItemIds: [
        "fractions-foundations-equivalent-gap-005",
      ],
      visualSupport: {
        type: "table",
        description:
          "Show numerator and denominator each divided by the same factor.",
      },
    },
    {
      id: "mini-check-comparing-ordering",
      title: "Mini Check: comparing and ordering",
      prompt: "Order from smallest to largest: 1/6, 1/2, 1/3.",
      taskType: "short_answer",
      expectedAnswer: "1/6, 1/3, 1/2",
      acceptableAnswers: ["1/6, 1/3, 1/2", "1/6 1/3 1/2"],
      workedSolution:
        "For unit fractions, more equal parts means each part is smaller. So 1/6 is smallest, then 1/3, then 1/2.",
      supportPrompt:
        "Use equal-length fraction bars or place each fraction on a 0 to 1 number line.",
      misconceptionTargets: [
        "same-numerator-comparison-error",
        "denominator-as-size-confusion",
      ],
      relatedAssessmentItemIds: [
        "fractions-foundations-same-numerator-008",
        "fractions-foundations-benchmark-ordering-009",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use a 0 to 1 number line showing 1/6, 1/3 and 1/2.",
      },
    },
    {
      id: "mini-check-fraction-problem-solving",
      title: "Mini Check: sharing context",
      prompt:
        "There are 30 beads. A learner uses 2/5 of them. How many beads are used?",
      taskType: "numeric",
      expectedAnswer: "12",
      acceptableAnswers: ["12"],
      workedSolution:
        "One fifth of 30 is 6. Two fifths is 2 x 6 = 12 beads.",
      supportPrompt:
        "Find one fifth first, then count two of those equal groups.",
      misconceptionTargets: [
        "fraction-sharing-context-error",
        "denominator-as-size-confusion",
      ],
      relatedAssessmentItemIds: [
        "fractions-foundations-sharing-context-011",
        "fractions-foundations-correct-working-010",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Show 30 beads shared into 5 equal groups with 2 groups selected.",
      },
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised fractions foundations. They worked on equal parts, numerator and denominator meaning, equivalent fractions, comparing and ordering with benchmarks, and using fractions in simple sharing and measurement contexts.",
};

export const NUMBER_FRACTIONS_FOUNDATIONS_PRACTICE_MODULES = Object.freeze([
  NUMBER_FRACTIONS_FOUNDATIONS_PRACTICE_MODULE,
]);

export function getNumberFractionsFoundationsPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_FRACTIONS_FOUNDATIONS_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberFractionsFoundationsPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_FRACTIONS_FOUNDATIONS_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
