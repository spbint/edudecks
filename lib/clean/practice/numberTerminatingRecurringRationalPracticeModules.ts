import {
  NUMBER_TERMINATING_RECURRING_RATIONAL_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberTerminatingRecurringRationalAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_TERMINATING_RECURRING_RATIONAL_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-terminating-recurring-rational-practice-module-v1",
  progressionBandKey: "terminating-recurring-rational-representations",
  title: "Terminating, recurring and rational representations",
  shortTitle: "Terminating and recurring decimals",
  description:
    "Practise terminating decimals, recurring decimals, fraction-decimal conversions, and rational versus irrational decimal representations.",
  yearBandLabel: "Years 7-9",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "years-9-10-consolidation",
  stepKey: "terminating-recurring-rational-representations",
  pathwayStepId:
    "mathematics::number-and-place-value::years-9-10-consolidation::terminating-recurring-rational-representations",
  relatedAssessmentBankKey: NUMBER_TERMINATING_RECURRING_RATIONAL_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Terminating decimals stop. Recurring decimals repeat a digit or repeating block forever. Fractions can often be written as decimal representations by dividing the numerator by the denominator, and rational numbers either terminate or recur as decimals. Non-terminating non-recurring decimals are irrational. Recurring notation can use plain text such as 0.3 recurring or 0.727272...",
    keyLanguage: [
      "terminating decimal",
      "recurring decimal",
      "repeating block",
      "rational number",
      "irrational number",
      "fraction",
      "decimal representation",
      "numerator",
      "denominator",
      "exact value",
      "approximation",
    ],
    workedExample:
      "3/8 = 0.375, so it is a terminating decimal. 1/3 = 0.333..., so it is a recurring decimal and is still rational because it is exactly equal to a fraction.",
    parentTip:
      "This module helps learners recognise whether a decimal representation is exact, repeating, terminating, rational, or irrational-looking.",
  },
  sections: [
    {
      id: "terminating-decimal-representations",
      type: "understanding",
      title: "Terminating decimal representations",
      learnerGoal:
        "I can recognise and convert rational numbers with terminating decimal representations.",
      tasks: [
        {
          id: "terminating-decimals-identify",
          title: "Identify terminating decimals",
          prompt:
            "From this list, write only the terminating decimals: 0.75, 0.125, 0.333..., 0.6 recurring, 2.5.",
          taskType: "short_answer",
          expectedAnswer: "0.75, 0.125, 2.5",
          acceptableAnswers: [
            "0.75, 0.125, 2.5",
            "0.75 0.125 2.5",
            "0.125, 0.75, 2.5",
          ],
          workedSolution:
            "A terminating decimal stops, so 0.75, 0.125 and 2.5 terminate. 0.333... and 0.6 recurring keep repeating.",
          supportPrompt:
            "Ask whether the decimal stops or whether it continues with a repeated pattern.",
          misconceptionTargets: [
            "terminating-decimal-recognition-error",
            "recurring-decimal-recognition-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-terminating-select-001",
          ],
        },
        {
          id: "terminating-decimals-match-fractions",
          title: "Match fractions to decimals",
          prompt:
            "Match each fraction to its terminating decimal: 1/2, 3/4, 7/20.",
          taskType: "sort_or_match",
          expectedAnswer: "1/2 = 0.5; 3/4 = 0.75; 7/20 = 0.35",
          acceptableAnswers: [
            "1/2 = 0.5; 3/4 = 0.75; 7/20 = 0.35",
            "1/2 0.5; 3/4 0.75; 7/20 0.35",
          ],
          workedSolution:
            "1/2 is 0.5, 3/4 is 0.75, and 7/20 is 35 hundredths, or 0.35.",
          supportPrompt:
            "Use common benchmark fractions first, then convert twentieths to hundredths.",
          misconceptionTargets: [
            "fraction-to-decimal-conversion-error",
            "place-value-denominator-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-fraction-match-002",
          ],
        },
        {
          id: "terminating-decimals-convert-to-fraction",
          title: "Convert a terminating decimal to a fraction",
          prompt: "Write 0.125 as a fraction in simplest form.",
          taskType: "short_answer",
          expectedAnswer: "1/8",
          acceptableAnswers: ["1/8", "125/1000"],
          workedSolution:
            "0.125 is 125 thousandths, so 0.125 = 125/1000. Dividing by 125 gives 1/8.",
          supportPrompt:
            "Write the decimal over 1000 first, then simplify the fraction.",
          misconceptionTargets: [
            "decimal-to-fraction-conversion-error",
            "place-value-denominator-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-decimal-fraction-gap-003",
          ],
        },
      ],
    },
    {
      id: "recurring-decimal-representations",
      type: "fluency",
      title: "Recurring decimal representations",
      learnerGoal:
        "I can recognise recurring decimals and connect them to rational numbers.",
      tasks: [
        {
          id: "recurring-decimals-identify",
          title: "Identify a recurring decimal",
          prompt: "Which value is recurring?",
          taskType: "multiple_choice",
          options: ["0.727272...", "0.72", "0.725", "0.7"],
          expectedAnswer: "0.727272...",
          acceptableAnswers: ["0.727272..."],
          workedSolution:
            "0.727272... repeats the block 72 forever, so it is recurring.",
          supportPrompt:
            "Look for a digit or block that repeats, not just a decimal with several digits.",
          misconceptionTargets: [
            "recurring-decimal-recognition-error",
            "repeating-block-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-recurring-choice-004",
          ],
        },
        {
          id: "recurring-decimals-match-fractions",
          title: "Match recurring decimals to fractions",
          prompt:
            "Match the recurring decimals to fractions: 0.333..., 0.666..., 0.111....",
          taskType: "sort_or_match",
          expectedAnswer: "0.333... = 1/3; 0.666... = 2/3; 0.111... = 1/9",
          acceptableAnswers: [
            "0.333... = 1/3; 0.666... = 2/3; 0.111... = 1/9",
            "0.333... 1/3; 0.666... 2/3; 0.111... 1/9",
          ],
          workedSolution:
            "One third is 0.333..., two thirds is 0.666..., and one ninth is 0.111....",
          supportPrompt:
            "Use familiar thirds and ninths as recurring decimal benchmarks.",
          misconceptionTargets: [
            "recurring-decimal-rational-confusion",
            "fraction-to-decimal-conversion-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-recurring-match-005",
          ],
        },
        {
          id: "recurring-decimals-rational-explanation",
          title: "Explain why a recurring decimal is rational",
          prompt: "Why is 0.444... a rational number?",
          taskType: "multiple_choice",
          options: [
            "It can be written exactly as the fraction 4/9.",
            "It goes on forever, so it cannot be rational.",
            "It is approximately 0.4, so it is the same as 4/10.",
            "It has no decimal endpoint, so no fraction can describe it.",
          ],
          expectedAnswer: "It can be written exactly as the fraction 4/9.",
          acceptableAnswers: [
            "It can be written exactly as the fraction 4/9.",
          ],
          workedSolution:
            "A rational number can be written as a fraction. The recurring decimal 0.444... is exactly 4/9.",
          supportPrompt:
            "Rational means fraction form is possible; it does not mean the decimal must stop.",
          misconceptionTargets: [
            "recurring-decimal-rational-confusion",
            "non-terminating-means-irrational-error",
            "approximation-vs-exact-decimal-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-recurring-explanation-006",
          ],
        },
      ],
    },
    {
      id: "fraction-decimal-conversions",
      type: "problem_solving",
      title: "Fraction and decimal conversions",
      learnerGoal:
        "I can convert between fractions and decimal forms, including simple recurring forms.",
      tasks: [
        {
          id: "fraction-decimal-convert-terminating",
          title: "Convert a fraction to a decimal",
          prompt: "Write 3/8 as a decimal.",
          taskType: "numeric",
          expectedAnswer: "0.375",
          acceptableAnswers: ["0.375"],
          workedSolution:
            "Divide 3 by 8, or use 1/8 = 0.125. Then 3/8 = 3 x 0.125 = 0.375.",
          supportPrompt:
            "Think of eighths as thousandths: 1/8 = 0.125.",
          misconceptionTargets: [
            "fraction-to-decimal-conversion-error",
            "place-value-denominator-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-fraction-decimal-numeric-007",
          ],
        },
        {
          id: "fraction-decimal-recurring-pair",
          title: "Recognise a recurring pair",
          prompt: "Write 0.333... as a fraction.",
          taskType: "short_answer",
          expectedAnswer: "1/3",
          acceptableAnswers: ["1/3"],
          workedSolution:
            "0.333... is the recurring decimal for one third, so 0.333... = 1/3 exactly.",
          supportPrompt:
            "Use the familiar benchmark that one whole divided into three equal parts gives 0.333... each.",
          misconceptionTargets: [
            "recurring-decimal-rational-confusion",
            "decimal-to-fraction-conversion-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-recurring-symbolic-008",
          ],
        },
        {
          id: "fraction-decimal-select-working",
          title: "Select correct conversion working",
          prompt: "Which working correctly converts 5/8 to a decimal?",
          taskType: "multiple_choice",
          options: [
            "5 / 8 = 0.625",
            "5 / 8 = 0.58 because the numerator and denominator become digits",
            "5 / 8 = 0.5 because 5 is close to half of 8",
            "5 / 8 = 0.625 recurring because every eighth recurs",
          ],
          expectedAnswer: "5 / 8 = 0.625",
          acceptableAnswers: ["5 / 8 = 0.625"],
          workedSolution:
            "Converting a fraction to a decimal means dividing the numerator by the denominator: 5 / 8 = 0.625.",
          supportPrompt:
            "Look for the working that uses division, not digit placement or rounding.",
          misconceptionTargets: [
            "fraction-to-decimal-conversion-error",
            "place-value-denominator-error",
            "approximation-vs-exact-decimal-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-conversion-working-009",
          ],
        },
      ],
    },
    {
      id: "rational-irrational-decimal-boundary",
      type: "reasoning",
      title: "Rational and irrational decimal boundary",
      learnerGoal:
        "I can distinguish terminating, recurring, and non-terminating non-recurring decimals.",
      tasks: [
        {
          id: "decimal-boundary-classify",
          title: "Classify decimal representations",
          prompt:
            "Classify each decimal: 0.75, 0.454545..., 3.14159265... with no repeating pattern.",
          taskType: "sort_or_match",
          expectedAnswer:
            "0.75 terminating; 0.454545... recurring; 3.14159265... non-terminating non-recurring",
          acceptableAnswers: [
            "0.75 terminating; 0.454545... recurring; 3.14159265... non-terminating non-recurring",
            "0.75 = terminating; 0.454545... = recurring; 3.14159265... = non-terminating non-recurring",
          ],
          workedSolution:
            "0.75 stops, 0.454545... repeats the block 45, and 3.14159265... with no repeating pattern is non-terminating non-recurring.",
          supportPrompt:
            "Check whether the decimal stops, repeats a block, or continues without a repeating block.",
          misconceptionTargets: [
            "rational-irrational-decimal-boundary-error",
            "recurring-decimal-recognition-error",
            "non-terminating-means-irrational-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-decimal-classification-010",
          ],
        },
        {
          id: "decimal-boundary-correct-misconception",
          title: "Correct a boundary misconception",
          prompt:
            "A learner says, 'Every non-terminating decimal is irrational.' Which correction is best?",
          taskType: "multiple_choice",
          options: [
            "Some non-terminating decimals are recurring, and recurring decimals are rational.",
            "All decimals are irrational unless they stop.",
            "Recurring decimals are only rational when rounded.",
            "A decimal is rational only if it has exactly two decimal places.",
          ],
          expectedAnswer:
            "Some non-terminating decimals are recurring, and recurring decimals are rational.",
          acceptableAnswers: [
            "Some non-terminating decimals are recurring, and recurring decimals are rational.",
          ],
          workedSolution:
            "Decimals such as 0.333... do not terminate, but they recur and can be written as fractions, so they are rational.",
          supportPrompt:
            "Separate non-terminating recurring decimals from non-terminating non-recurring decimals.",
          misconceptionTargets: [
            "non-terminating-means-irrational-error",
            "recurring-decimal-rational-confusion",
            "rational-irrational-decimal-boundary-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-boundary-correction-011",
          ],
        },
        {
          id: "decimal-boundary-compare-values",
          title: "Compare decimal representations",
          prompt:
            "Order from smallest to largest: 0.75, 2/3, 0.7 recurring.",
          taskType: "short_answer",
          expectedAnswer: "2/3, 0.7 recurring, 0.75",
          acceptableAnswers: [
            "2/3, 0.7 recurring, 0.75",
            "2/3 0.7 recurring 0.75",
            "0.666..., 0.777..., 0.75",
          ],
          workedSolution:
            "2/3 = 0.666..., 0.7 recurring means 0.777..., and 0.75 is 0.750. So the order is 2/3, 0.7 recurring, 0.75.",
          supportPrompt:
            "Convert each value to a comparable decimal, keeping recurring values exact.",
          misconceptionTargets: [
            "decimal-comparison-error",
            "recurring-decimal-recognition-error",
            "representation-context-error",
          ],
          relatedAssessmentItemIds: [
            "term-rec-rational-context-order-012",
          ],
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-terminating-decimals",
      title: "Mini Check: terminating decimals",
      prompt:
        "Which of these are terminating decimals: 0.4, 0.333..., 1.25, 0.18 recurring?",
      taskType: "short_answer",
      expectedAnswer: "0.4 and 1.25",
      acceptableAnswers: ["0.4 and 1.25", "0.4, 1.25", "1.25 and 0.4"],
      workedSolution:
        "0.4 and 1.25 stop, so they terminate. 0.333... and 0.18 recurring continue forever.",
      supportPrompt:
        "Look for decimals that stop rather than repeat.",
      misconceptionTargets: [
        "terminating-decimal-recognition-error",
        "recurring-decimal-recognition-error",
      ],
      relatedAssessmentItemIds: [
        "term-rec-rational-terminating-select-001",
        "term-rec-rational-decimal-fraction-gap-003",
      ],
    },
    {
      id: "mini-check-recurring-decimals",
      title: "Mini Check: recurring decimals",
      prompt: "Write 0.222... as a fraction.",
      taskType: "short_answer",
      expectedAnswer: "2/9",
      acceptableAnswers: ["2/9"],
      workedSolution:
        "0.111... is 1/9, so 0.222... is 2/9.",
      supportPrompt:
        "Use the ninths pattern for single-digit recurring decimals.",
      misconceptionTargets: [
        "recurring-decimal-rational-confusion",
        "repeating-block-error",
      ],
      relatedAssessmentItemIds: [
        "term-rec-rational-recurring-match-005",
        "term-rec-rational-recurring-explanation-006",
      ],
    },
    {
      id: "mini-check-fraction-decimal-conversions",
      title: "Mini Check: fraction-decimal conversion",
      prompt: "Write 7/20 as a decimal.",
      taskType: "numeric",
      expectedAnswer: "0.35",
      acceptableAnswers: ["0.35"],
      workedSolution:
        "7/20 is equivalent to 35/100, so the decimal is 0.35.",
      supportPrompt:
        "Convert twentieths to hundredths before writing the decimal.",
      misconceptionTargets: [
        "fraction-to-decimal-conversion-error",
        "place-value-denominator-error",
      ],
      relatedAssessmentItemIds: [
        "term-rec-rational-fraction-match-002",
        "term-rec-rational-fraction-decimal-numeric-007",
        "term-rec-rational-conversion-working-009",
      ],
    },
    {
      id: "mini-check-decimal-boundary",
      title: "Mini Check: decimal boundary",
      prompt:
        "Classify 0.81, 0.818181..., and 1.41421356... with no repeating pattern.",
      taskType: "sort_or_match",
      expectedAnswer:
        "0.81 terminating; 0.818181... recurring; 1.41421356... non-terminating non-recurring",
      acceptableAnswers: [
        "0.81 terminating; 0.818181... recurring; 1.41421356... non-terminating non-recurring",
        "0.81 = terminating; 0.818181... = recurring; 1.41421356... = non-terminating non-recurring",
      ],
      workedSolution:
        "0.81 stops, 0.818181... repeats the block 81, and 1.41421356... has no repeating block in the description.",
      supportPrompt:
        "Use the three categories: stops, repeats, or continues without a repeating block.",
      misconceptionTargets: [
        "rational-irrational-decimal-boundary-error",
        "non-terminating-means-irrational-error",
      ],
      relatedAssessmentItemIds: [
        "term-rec-rational-decimal-classification-010",
        "term-rec-rational-boundary-correction-011",
      ],
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised terminating, recurring and rational representations. They worked on recognising terminating and recurring decimals, converting between fractions and decimals, and distinguishing rational decimal representations from non-terminating non-recurring decimals.",
};

export const NUMBER_TERMINATING_RECURRING_RATIONAL_PRACTICE_MODULES =
  Object.freeze([NUMBER_TERMINATING_RECURRING_RATIONAL_PRACTICE_MODULE]);

export function getNumberTerminatingRecurringRationalPracticeModuleById(
  id: string,
) {
  const normalizedId = safe(id);
  return (
    NUMBER_TERMINATING_RECURRING_RATIONAL_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberTerminatingRecurringRationalPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_TERMINATING_RECURRING_RATIONAL_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
