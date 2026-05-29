import {
  NUMBER_RATIONAL_OPERATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberRationalOperationsAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_RATIONAL_OPERATIONS_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-rational-operations-practice-module-v1",
  progressionBandKey: "rational-numbers-and-operations",
  title: "Rational numbers and operations",
  shortTitle: "Rational operations",
  description:
    "Practise equivalent rational representations, fraction and decimal operations, rational-number comparison, and rational operations in context.",
  yearBandLabel: "Years 6-8",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "years-9-10-consolidation",
  stepKey: "rational-numbers-and-operations",
  pathwayStepId:
    "mathematics::number-and-place-value::years-9-10-consolidation::rational-numbers-and-operations",
  relatedAssessmentBankKey: NUMBER_RATIONAL_OPERATIONS_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Rational numbers can be written as fractions, decimals and percentages. Equivalent values can look different but mean the same amount, so careful place-value, denominator and number-line thinking helps you compare and calculate with them.",
    keyLanguage: [
      "rational number",
      "equivalent fraction",
      "decimal",
      "percentage",
      "denominator",
      "numerator",
      "common denominator",
      "benchmark",
      "negative number",
      "number line",
      "context",
    ],
    workedExample:
      "0.75, 75% and 3/4 all describe the same amount. For 1/4 + 3/8, rewrite 1/4 as 2/8, then add 2/8 + 3/8 = 5/8.",
    parentTip:
      "This module is about recognising equivalent values, comparing rational numbers carefully, and choosing sensible operations in context.",
  },
  sections: [
    {
      id: "equivalent-rational-representations",
      type: "understanding",
      title: "Equivalent rational representations",
      learnerGoal:
        "I can connect fractions, decimals and percentages as equivalent rational values.",
      tasks: [
        {
          id: "equivalent-representations-match",
          title: "Match equivalent values",
          prompt:
            "Match each fraction to an equivalent decimal and percentage: 1/2, 3/4, 1/5.",
          taskType: "sort_or_match",
          expectedAnswer:
            "1/2 = 0.5 = 50%; 3/4 = 0.75 = 75%; 1/5 = 0.2 = 20%",
          acceptableAnswers: [
            "1/2 = 0.5 = 50%; 3/4 = 0.75 = 75%; 1/5 = 0.2 = 20%",
          ],
          workedSolution:
            "1/2 is 0.5 or 50%, 3/4 is 0.75 or 75%, and 1/5 is 0.2 or 20%.",
          supportPrompt:
            "Use benchmark fractions first, then convert the decimal to a percentage.",
          misconceptionTargets: [
            "fraction-decimal-percent-equivalence-error",
            "percentage-as-whole-number-error",
          ],
          relatedAssessmentItemIds: ["rational-ops-equivalent-match-001"],
        },
        {
          id: "equivalent-representations-select",
          title: "Select equivalents of 0.4",
          prompt: "Which values are equivalent to 0.4?",
          taskType: "multiple_choice",
          options: [
            "2/5, 40%, and 4/10",
            "4/100 and 0.04",
            "4/5 and 80%",
            "40/10 and 400%",
          ],
          expectedAnswer: "2/5, 40%, and 4/10",
          acceptableAnswers: ["2/5, 40%, and 4/10"],
          workedSolution:
            "0.4 is four tenths, so it equals 4/10, 2/5 and 40%.",
          supportPrompt:
            "Read 0.4 as four tenths before changing representation.",
          misconceptionTargets: [
            "fraction-decimal-percent-equivalence-error",
            "decimal-place-value-error",
          ],
          relatedAssessmentItemIds: ["rational-ops-equivalent-select-002"],
        },
        {
          id: "equivalent-representations-fill-gap",
          title: "Complete a conversion chain",
          prompt: "Complete the missing value: 3/5 = 0.6 = __%.",
          taskType: "numeric",
          expectedAnswer: "60",
          acceptableAnswers: ["60", "60%"],
          workedSolution:
            "0.6 means 60 hundredths, so 0.6 = 60%.",
          supportPrompt:
            "Multiply the decimal by 100 to write it as a percentage.",
          misconceptionTargets: [
            "fraction-decimal-percent-equivalence-error",
            "percentage-as-whole-number-error",
          ],
          relatedAssessmentItemIds: ["rational-ops-convert-gap-003"],
        },
      ],
    },
    {
      id: "fraction-and-decimal-operations",
      type: "fluency",
      title: "Fraction and decimal operations",
      learnerGoal: "I can operate with fractions and decimals accurately.",
      tasks: [
        {
          id: "fraction-decimal-operations-add",
          title: "Add with related denominators",
          prompt: "Calculate 1/4 + 3/8.",
          taskType: "short_answer",
          expectedAnswer: "5/8",
          acceptableAnswers: ["5/8"],
          workedSolution:
            "Rewrite 1/4 as 2/8. Then 2/8 + 3/8 = 5/8.",
          supportPrompt:
            "Find a common denominator before adding the numerators.",
          misconceptionTargets: [
            "common-denominator-gap",
            "denominator-addition-error",
          ],
          relatedAssessmentItemIds: ["rational-ops-add-related-denominators-004"],
        },
        {
          id: "fraction-decimal-operations-multiply",
          title: "Multiply fractions",
          prompt: "Calculate 2/3 x 3/5.",
          taskType: "short_answer",
          expectedAnswer: "2/5",
          acceptableAnswers: ["2/5", "6/15"],
          workedSolution:
            "Multiply numerators and denominators: 2 x 3 over 3 x 5 = 6/15. Simplify to 2/5.",
          supportPrompt:
            "Multiply across first, then simplify if possible.",
          misconceptionTargets: ["fraction-multiplication-error"],
          relatedAssessmentItemIds: ["rational-ops-multiply-fractions-005"],
        },
        {
          id: "fraction-decimal-operations-decimal-context",
          title: "Divide a decimal amount",
          prompt:
            "A 2.4 m ribbon is cut into 6 equal pieces. How long is each piece in metres?",
          taskType: "numeric",
          expectedAnswer: "0.4",
          acceptableAnswers: ["0.4", "0.40"],
          workedSolution:
            "Divide the total length by the number of pieces: 2.4 / 6 = 0.4.",
          supportPrompt:
            "The word equal means each piece has the same length, so divide.",
          misconceptionTargets: [
            "fraction-division-error",
            "decimal-place-value-error",
            "operation-context-error",
          ],
          relatedAssessmentItemIds: ["rational-ops-context-division-010"],
        },
      ],
    },
    {
      id: "rational-number-comparison",
      type: "problem_solving",
      title: "Rational number comparison",
      learnerGoal:
        "I can compare and order rational numbers, including negative values.",
      tasks: [
        {
          id: "rational-comparison-order",
          title: "Order rational numbers",
          prompt:
            "Order from smallest to largest: -1/2, 0.25, -0.75, 1/5.",
          taskType: "short_answer",
          expectedAnswer: "-0.75, -1/2, 1/5, 0.25",
          acceptableAnswers: [
            "-0.75, -1/2, 1/5, 0.25",
            "-0.75 -1/2 1/5 0.25",
          ],
          workedSolution:
            "-1/2 = -0.5 and 1/5 = 0.2. From left to right on a number line: -0.75, -0.5, 0.2, 0.25.",
          supportPrompt:
            "Convert fractions to decimals, then use the number line.",
          misconceptionTargets: [
            "negative-rational-ordering-error",
            "mixed-representation-confusion",
          ],
          relatedAssessmentItemIds: ["rational-ops-order-negatives-008"],
        },
        {
          id: "rational-comparison-decimal-correction",
          title: "Correct a decimal comparison",
          prompt:
            "A learner says 0.35 is greater than 0.4 because 35 is greater than 4. What correction is best?",
          taskType: "multiple_choice",
          options: [
            "0.4 is greater because 0.4 = 0.40, and 0.40 > 0.35.",
            "0.35 is greater because 35 > 4.",
            "They are equal because both start with 0.",
            "0.4 is greater because it has fewer digits.",
          ],
          expectedAnswer:
            "0.4 is greater because 0.4 = 0.40, and 0.40 > 0.35.",
          acceptableAnswers: [
            "0.4 is greater because 0.4 = 0.40, and 0.40 > 0.35.",
          ],
          workedSolution:
            "Write 0.4 as 0.40. Then compare hundredths: 40 hundredths is greater than 35 hundredths.",
          supportPrompt:
            "Line up decimal places before comparing.",
          misconceptionTargets: ["decimal-place-value-error"],
          relatedAssessmentItemIds: ["rational-ops-compare-decimals-007"],
        },
        {
          id: "rational-comparison-classify",
          title: "Classify rational representations",
          prompt:
            "Classify 3/4, 0.6, 80%, and -2/5 as fraction, decimal, percentage, or negative rational.",
          taskType: "sort_or_match",
          expectedAnswer:
            "3/4 fraction; 0.6 decimal; 80% percentage; -2/5 negative rational",
          acceptableAnswers: [
            "3/4 fraction; 0.6 decimal; 80% percentage; -2/5 negative rational",
          ],
          workedSolution:
            "3/4 is a fraction, 0.6 is a decimal, 80% is a percentage, and -2/5 is a negative rational value.",
          supportPrompt:
            "Name the form first. The negative sign matters when classifying -2/5.",
          misconceptionTargets: [
            "mixed-representation-confusion",
            "negative-rational-ordering-error",
          ],
          relatedAssessmentItemIds: ["rational-ops-classify-representations-009"],
        },
      ],
    },
    {
      id: "rational-operations-in-context",
      type: "reasoning",
      title: "Rational operations in context",
      learnerGoal:
        "I can choose and use rational-number operations in short contexts.",
      tasks: [
        {
          id: "rational-context-best-explanation",
          title: "Choose the best explanation",
          prompt: "Which explanation best shows why 1/4 + 1/4 = 1/2?",
          taskType: "multiple_choice",
          options: [
            "Two quarters make 2/4, and 2/4 simplifies to 1/2.",
            "Add denominators to get 2/8, which is the same as 1/2.",
            "One plus one is two, so the answer is 2.",
            "The answer is 1/4 because the denominator stays 4.",
          ],
          expectedAnswer:
            "Two quarters make 2/4, and 2/4 simplifies to 1/2.",
          acceptableAnswers: [
            "Two quarters make 2/4, and 2/4 simplifies to 1/2.",
          ],
          workedSolution:
            "The denominators are already the same, so add the numerators: 1/4 + 1/4 = 2/4. Then simplify 2/4 to 1/2.",
          supportPrompt:
            "The denominator names the size of the parts; it does not get added.",
          misconceptionTargets: [
            "denominator-addition-error",
            "common-denominator-gap",
          ],
          relatedAssessmentItemIds: ["rational-ops-context-explanation-011"],
        },
        {
          id: "rational-context-money",
          title: "Solve a money context",
          prompt:
            "A learner spends 3/5 of $40 on supplies. How much money is spent?",
          taskType: "multiple_choice",
          options: ["$24", "$8", "$60", "$37"],
          expectedAnswer: "$24",
          acceptableAnswers: ["$24", "24"],
          workedSolution:
            "One fifth of $40 is $8, so three fifths is 3 x $8 = $24.",
          supportPrompt:
            "In this context, 'of' means multiply by the fraction.",
          misconceptionTargets: [
            "operation-context-error",
            "fraction-multiplication-error",
          ],
          relatedAssessmentItemIds: ["rational-ops-context-money-012"],
        },
        {
          id: "rational-context-correct-working",
          title: "Select correct working",
          prompt: "Which working correctly solves 2/3 - 1/6?",
          taskType: "multiple_choice",
          options: [
            "2/3 = 4/6, so 4/6 - 1/6 = 3/6 = 1/2.",
            "2/3 - 1/6 = 1/3 because 2 - 1 = 1 and 6 - 3 = 3.",
            "2/3 - 1/6 = 1/6 because only the numerators change.",
            "2/3 - 1/6 = 1/9 because denominators combine.",
          ],
          expectedAnswer:
            "2/3 = 4/6, so 4/6 - 1/6 = 3/6 = 1/2.",
          acceptableAnswers: [
            "2/3 = 4/6, so 4/6 - 1/6 = 3/6 = 1/2.",
          ],
          workedSolution:
            "Rewrite 2/3 as 4/6, then subtract the sixths: 4/6 - 1/6 = 3/6 = 1/2.",
          supportPrompt:
            "Look for the working that creates a common denominator first.",
          misconceptionTargets: [
            "common-denominator-gap",
            "denominator-addition-error",
          ],
          relatedAssessmentItemIds: ["rational-ops-select-working-006"],
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-equivalent-representations",
      title: "Mini Check: equivalent representations",
      prompt: "Write 7/10 as a decimal and a percentage.",
      taskType: "short_answer",
      expectedAnswer: "0.7 and 70%",
      acceptableAnswers: ["0.7 and 70%", "0.7, 70%", "0.70 and 70%"],
      workedSolution:
        "7/10 is seven tenths, so the decimal is 0.7 and the percentage is 70%.",
      supportPrompt:
        "Tenths become one decimal place. Percent means out of 100.",
      misconceptionTargets: [
        "fraction-decimal-percent-equivalence-error",
        "percentage-as-whole-number-error",
      ],
      relatedAssessmentItemIds: ["rational-ops-convert-gap-003"],
    },
    {
      id: "mini-check-fraction-decimal-operations",
      title: "Mini Check: fraction operation",
      prompt: "Calculate 5/6 - 1/3.",
      taskType: "short_answer",
      expectedAnswer: "1/2",
      acceptableAnswers: ["1/2", "3/6"],
      workedSolution:
        "Rewrite 1/3 as 2/6, then 5/6 - 2/6 = 3/6 = 1/2.",
      supportPrompt:
        "Rewrite both fractions with sixths before subtracting.",
      misconceptionTargets: [
        "common-denominator-gap",
        "denominator-addition-error",
      ],
      relatedAssessmentItemIds: [
        "rational-ops-add-related-denominators-004",
        "rational-ops-select-working-006",
      ],
    },
    {
      id: "mini-check-rational-comparison",
      title: "Mini Check: rational comparison",
      prompt: "Order from smallest to largest: -0.2, -1/4, 0.15.",
      taskType: "short_answer",
      expectedAnswer: "-1/4, -0.2, 0.15",
      acceptableAnswers: [
        "-1/4, -0.2, 0.15",
        "-0.25, -0.2, 0.15",
        "-1/4 -0.2 0.15",
      ],
      workedSolution:
        "-1/4 = -0.25. On a number line, -0.25 is smaller than -0.2, and both are smaller than 0.15.",
      supportPrompt:
        "Convert -1/4 to -0.25, then compare positions on a number line.",
      misconceptionTargets: [
        "negative-rational-ordering-error",
        "mixed-representation-confusion",
      ],
      relatedAssessmentItemIds: ["rational-ops-order-negatives-008"],
    },
    {
      id: "mini-check-context-operation",
      title: "Mini Check: context operation",
      prompt:
        "A 3.6 litre drink is shared equally into 9 cups. How many litres are in each cup?",
      taskType: "numeric",
      expectedAnswer: "0.4",
      acceptableAnswers: ["0.4", "0.40"],
      workedSolution:
        "Share equally means divide: 3.6 / 9 = 0.4 litres in each cup.",
      supportPrompt:
        "Identify the operation first: equal sharing uses division.",
      misconceptionTargets: [
        "operation-context-error",
        "decimal-place-value-error",
      ],
      relatedAssessmentItemIds: ["rational-ops-context-division-010"],
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised rational numbers and operations. They worked on equivalent fractions, decimals and percentages, fraction and decimal operations, comparing rational numbers, and choosing operations in context.",
};

export const NUMBER_RATIONAL_OPERATIONS_PRACTICE_MODULES = Object.freeze([
  NUMBER_RATIONAL_OPERATIONS_PRACTICE_MODULE,
]);

export function getNumberRationalOperationsPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_RATIONAL_OPERATIONS_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberRationalOperationsPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_RATIONAL_OPERATIONS_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
