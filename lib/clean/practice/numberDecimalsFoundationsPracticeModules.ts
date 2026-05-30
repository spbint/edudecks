import {
  NUMBER_DECIMALS_FOUNDATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberDecimalsFoundationsAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_DECIMALS_FOUNDATIONS_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-decimals-foundations-practice-module-v1",
  progressionBandKey: "decimals-foundations",
  title: "Decimals foundations",
  shortTitle: "Decimals foundations",
  description:
    "Practise decimal place value, tenths and hundredths, fraction-decimal connections, comparing, ordering and rounding decimals, and simple money or measurement contexts.",
  yearBandLabel: "Years 3-5",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  stepKey: "decimals-foundations",
  pathwayStepId:
    "mathematics::number-and-place-value::middle-primary::decimals-foundations",
  relatedAssessmentBankKey: NUMBER_DECIMALS_FOUNDATIONS_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Decimals extend place value beyond the ones place. Tenths are one part out of 10, and hundredths are one part out of 100. Decimals can connect to fractions, money and measurement. Zeroes can help show place value without changing the amount, and number lines help compare, order and round decimals.",
    keyLanguage: [
      "decimal",
      "decimal point",
      "tenth",
      "hundredth",
      "place value",
      "fraction",
      "equivalent",
      "number line",
      "round",
      "money",
      "measurement",
    ],
    workedExample:
      "0.4 means 4 tenths. It can also be written as 0.40, which means 40 hundredths. On a number line from 0 to 1, 0.4 and 0.40 land at the same point.",
    parentTip:
      "This module helps learners see decimals as numbers and quantities, not just digits after a decimal point.",
  },
  sections: [
    {
      id: "decimal-place-value",
      type: "understanding",
      title: "Decimal place value",
      learnerGoal:
        "I can read, write, partition and rename decimals using tenths and hundredths.",
      tasks: [
        {
          id: "decimal-place-value-digit-value",
          title: "Name a decimal digit value",
          prompt:
            "Use a place-value chart for ones, tenths and hundredths. In 6.38, what is the value of the digit 3?",
          taskType: "multiple_choice",
          options: ["3 ones", "3 tenths", "3 hundredths", "30 hundredths"],
          expectedAnswer: "3 tenths",
          acceptableAnswers: ["3 tenths", "0.3"],
          workedSolution:
            "The 3 is the first digit after the decimal point, so it is in the tenths place. Its value is 3 tenths, or 0.3.",
          supportPrompt:
            "Read the decimal places from left to right: ones, tenths, hundredths.",
          misconceptionTargets: [
            "decimal-place-value-error",
            "tenths-hundredths-confusion",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-digit-value-001",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a decimal place-value chart with columns for ones, tenths and hundredths.",
          },
        },
        {
          id: "decimal-place-value-partition-match",
          title: "Match decimal partitions",
          prompt:
            "Match each decimal to its place-value partition: 4.26, 3.05, 7.8.",
          taskType: "sort_or_match",
          expectedAnswer:
            "4.26 = 4 + 0.2 + 0.06; 3.05 = 3 + 0.05; 7.8 = 7 + 0.8",
          acceptableAnswers: [
            "4.26 = 4 + 0.2 + 0.06; 3.05 = 3 + 0.05; 7.8 = 7 + 0.8",
            "4.26=4+0.2+0.06; 3.05=3+0.05; 7.8=7+0.8",
          ],
          workedSolution:
            "Partition each decimal by place value. 4.26 has 4 ones, 2 tenths and 6 hundredths. 3.05 has 3 ones and 5 hundredths.",
          supportPrompt:
            "Write each digit in a place-value table before writing the expanded form.",
          misconceptionTargets: [
            "decimal-partitioning-error",
            "decimal-zero-placeholder-error",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-partition-003",
            "decimals-foundations-tenths-hundredths-002",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a tenths and hundredths table with an expanded-form row.",
          },
        },
        {
          id: "decimal-place-value-zero-correction",
          title: "Explain a decimal zero",
          prompt:
            "True or false: 2.08 is the same as 2.8 because both numbers use the digits 2 and 8. If false, write the correction.",
          taskType: "short_answer",
          expectedAnswer:
            "False. 2.08 has 8 hundredths, while 2.8 has 8 tenths.",
          acceptableAnswers: [
            "False. 2.08 has 8 hundredths, while 2.8 has 8 tenths.",
            "false 2.08 has 8 hundredths and 2.8 has 8 tenths",
            "false",
          ],
          workedSolution:
            "The zero in 2.08 holds the tenths place, so the 8 is in the hundredths place. In 2.8, the 8 is in the tenths place.",
          supportPrompt:
            "Put both numbers in a place-value chart and compare the place of the 8.",
          misconceptionTargets: [
            "decimal-zero-placeholder-error",
            "decimal-place-value-error",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-best-explanation-012",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a place-value chart comparing 2.08 and 2.8.",
          },
        },
      ],
    },
    {
      id: "fraction-decimal-connections",
      type: "fluency",
      title: "Fraction and decimal connections",
      learnerGoal:
        "I can connect common fractions with decimal representations.",
      tasks: [
        {
          id: "fraction-decimal-connections-match",
          title: "Match fractions and decimals",
          prompt:
            "Use a fraction-decimal table or hundredths grid. Match each fraction to its decimal: 1/2, 1/4, 3/4.",
          taskType: "sort_or_match",
          expectedAnswer: "1/2 = 0.5; 1/4 = 0.25; 3/4 = 0.75",
          acceptableAnswers: ["1/2 = 0.5; 1/4 = 0.25; 3/4 = 0.75"],
          workedSolution:
            "One half is 0.5, one quarter is 0.25, and three quarters is 0.75.",
          supportPrompt:
            "Use 100 as the whole: 1/2 is 50/100, 1/4 is 25/100, and 3/4 is 75/100.",
          misconceptionTargets: [
            "fraction-decimal-equivalence-error",
            "decimal-benchmark-confusion",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-fraction-decimal-match-004",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a fraction-decimal matching table with halves and quarters.",
          },
        },
        {
          id: "fraction-decimal-connections-gap",
          title: "Complete a decimal equivalence",
          prompt: "Complete the missing decimal: 7/10 = __.",
          taskType: "short_answer",
          expectedAnswer: "0.7",
          acceptableAnswers: ["0.7", "0.70"],
          workedSolution:
            "7/10 means 7 tenths, which is written as 0.7. It can also be written as 0.70.",
          supportPrompt:
            "Tenths are the first place after the decimal point.",
          misconceptionTargets: [
            "fraction-decimal-equivalence-error",
            "tenths-hundredths-confusion",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-equivalence-gap-005",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a tenths grid or table showing 7/10 and 0.7.",
          },
        },
        {
          id: "fraction-decimal-connections-equivalent-select",
          title: "Select equivalent representations",
          prompt: "Which option lists only representations equal to 1/4?",
          taskType: "multiple_choice",
          options: [
            "0.25, 25/100, $0.25",
            "0.4, 4/10, $0.04",
            "0.75, 75/100, $0.75",
            "0.05, 5/10, $0.50",
          ],
          expectedAnswer: "0.25, 25/100, $0.25",
          acceptableAnswers: ["0.25, 25/100, $0.25"],
          workedSolution:
            "One quarter is 25 out of 100, which is 25/100 or 0.25. In money, $0.25 is 25 cents, or one quarter of a dollar.",
          supportPrompt:
            "Think of one whole as 100 hundredths or 100 cents.",
          misconceptionTargets: [
            "fraction-decimal-equivalence-error",
            "money-decimal-context-error",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-equivalent-select-006",
            "decimals-foundations-fraction-decimal-match-004",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a table comparing 1/4, 25/100, 0.25 and $0.25.",
          },
        },
      ],
    },
    {
      id: "comparing-ordering-and-rounding-decimals",
      type: "reasoning",
      title: "Comparing, ordering and rounding decimals",
      learnerGoal:
        "I can compare, order and round decimals using place-value reasoning.",
      tasks: [
        {
          id: "decimal-comparison-best-explanation",
          title: "Explain a decimal comparison",
          prompt:
            "A learner says 0.45 is greater than 0.6 because 45 is greater than 6. Which explanation is best?",
          taskType: "multiple_choice",
          options: [
            "0.6 is greater because 0.6 = 0.60, and 60 hundredths is greater than 45 hundredths.",
            "0.45 is greater because 45 is greater than 6.",
            "They are equal because both numbers are less than 1.",
            "The number with more decimal digits is always greater.",
          ],
          expectedAnswer:
            "0.6 is greater because 0.6 = 0.60, and 60 hundredths is greater than 45 hundredths.",
          acceptableAnswers: [
            "0.6 is greater because 0.6 = 0.60, and 60 hundredths is greater than 45 hundredths.",
          ],
          workedSolution:
            "Write 0.6 as 0.60 so both numbers use hundredths. 60 hundredths is greater than 45 hundredths.",
          supportPrompt:
            "Use zero placeholders to compare decimals with the same number of places.",
          misconceptionTargets: [
            "decimal-comparison-length-error",
            "decimal-as-whole-number-thinking",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-comparison-working-010",
            "decimals-foundations-comparison-correction-007",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a tenths and hundredths table comparing 0.60 and 0.45.",
          },
        },
        {
          id: "decimal-ordering-number-line",
          title: "Order decimals on a number line",
          prompt:
            "Order these decimals from smallest to largest using a 0 to 1 number line: 0.09, 0.9, 0.45, 0.5.",
          taskType: "short_answer",
          expectedAnswer: "0.09, 0.45, 0.5, 0.9",
          acceptableAnswers: [
            "0.09, 0.45, 0.5, 0.9",
            "0.09 0.45 0.5 0.9",
          ],
          workedSolution:
            "0.09 is close to 0, 0.45 is just below 0.5, 0.5 is one half, and 0.9 is close to 1.",
          supportPrompt:
            "Mark 0, 0.5 and 1 first, then place each decimal near the right benchmark.",
          misconceptionTargets: [
            "decimal-number-line-placement-error",
            "decimal-comparison-length-error",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-ordering-number-line-008",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use a 0 to 1 number line with benchmarks at 0.5 and 1.",
          },
        },
        {
          id: "decimal-rounding-nearest-tenth",
          title: "Round to the nearest tenth",
          prompt:
            "Use a number line between 3.4 and 3.5. Round 3.46 to the nearest tenth.",
          taskType: "numeric",
          expectedAnswer: "3.5",
          acceptableAnswers: ["3.5", "3.50"],
          workedSolution:
            "To round to the nearest tenth, look at the hundredths digit. In 3.46, the hundredths digit is 6, so 3.46 rounds up to 3.5.",
          supportPrompt:
            "Find the tenths place, then look at the digit immediately to its right.",
          misconceptionTargets: [
            "decimal-rounding-error",
            "tenths-hundredths-confusion",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-rounding-009",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Show 3.46 between 3.4 and 3.5 on a number line.",
          },
        },
      ],
    },
    {
      id: "decimal-problem-solving-foundations",
      type: "problem_solving",
      title: "Decimal problem-solving foundations",
      learnerGoal:
        "I can use decimals in simple money, measurement and everyday contexts.",
      tasks: [
        {
          id: "decimal-context-money-total",
          title: "Add money amounts",
          prompt:
            "A notebook costs $2.35 and a sticker costs $0.40. What is the total cost?",
          taskType: "numeric",
          expectedAnswer: "2.75",
          acceptableAnswers: ["2.75", "$2.75"],
          workedSolution:
            "Line up dollars and cents: $2.35 + $0.40 = $2.75.",
          supportPrompt:
            "Write both amounts with two decimal places before adding.",
          misconceptionTargets: [
            "money-decimal-context-error",
            "decimal-place-value-error",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-money-measurement-011",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a money context card showing $2.35 and $0.40 added together.",
          },
        },
        {
          id: "decimal-context-measurement-classify",
          title: "Classify decimal contexts",
          prompt:
            "Classify these as money or measurement: $1.50, 2.4 m, $0.75, 3.08 kg.",
          taskType: "sort_or_match",
          expectedAnswer:
            "$1.50 = money; 2.4 m = measurement; $0.75 = money; 3.08 kg = measurement",
          acceptableAnswers: [
            "$1.50 = money; 2.4 m = measurement; $0.75 = money; 3.08 kg = measurement",
          ],
          workedSolution:
            "Dollar signs show money amounts. Units such as m and kg show measurements.",
          supportPrompt:
            "Look for the unit or symbol attached to each decimal.",
          misconceptionTargets: [
            "money-decimal-context-error",
            "measurement-decimal-context-error",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-money-measurement-011",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use context cards for money amounts and measurement amounts.",
          },
        },
        {
          id: "decimal-context-correct-working",
          title: "Choose correct decimal working",
          prompt:
            "Which working correctly compares 1.7 m and 1.65 m?",
          taskType: "multiple_choice",
          options: [
            "Write 1.7 as 1.70, then compare 70 hundredths with 65 hundredths. So 1.7 m > 1.65 m.",
            "1.65 m is greater because 65 is greater than 7.",
            "1.7 m and 1.65 m are equal because both start with 1.",
            "1.7 m is smaller because it has fewer decimal digits.",
          ],
          expectedAnswer:
            "Write 1.7 as 1.70, then compare 70 hundredths with 65 hundredths. So 1.7 m > 1.65 m.",
          acceptableAnswers: [
            "Write 1.7 as 1.70, then compare 70 hundredths with 65 hundredths. So 1.7 m > 1.65 m.",
            "1.7 m > 1.65 m",
          ],
          workedSolution:
            "1.7 m is the same as 1.70 m. Since 70 hundredths is greater than 65 hundredths, 1.7 m is longer.",
          supportPrompt:
            "Use zero placeholders so both measurements have hundredths.",
          misconceptionTargets: [
            "measurement-decimal-context-error",
            "decimal-comparison-length-error",
            "decimal-zero-placeholder-error",
          ],
          relatedAssessmentItemIds: [
            "decimals-foundations-comparison-working-010",
            "decimals-foundations-best-explanation-012",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a place-value table comparing 1.70 m and 1.65 m.",
          },
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-decimal-place-value",
      title: "Mini Check: decimal place value",
      prompt: "Complete the partition: 8.37 = 8 + __ + 0.07.",
      taskType: "short_answer",
      expectedAnswer: "0.3",
      acceptableAnswers: ["0.3", "0.30", "3 tenths"],
      workedSolution:
        "8.37 has 8 ones, 3 tenths and 7 hundredths, so 8.37 = 8 + 0.3 + 0.07.",
      supportPrompt:
        "Put 8.37 into a place-value chart before partitioning.",
      misconceptionTargets: [
        "decimal-partitioning-error",
        "tenths-hundredths-confusion",
      ],
      relatedAssessmentItemIds: [
        "decimals-foundations-partition-003",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use a decimal place-value table with ones, tenths and hundredths.",
      },
    },
    {
      id: "mini-check-fraction-decimal-connections",
      title: "Mini Check: fraction-decimal connection",
      prompt: "Write 3/4 as a decimal.",
      taskType: "short_answer",
      expectedAnswer: "0.75",
      acceptableAnswers: ["0.75"],
      workedSolution:
        "3/4 is 75/100, so it is written as 0.75.",
      supportPrompt:
        "Use a hundredths grid or remember that 1/4 is 0.25.",
      misconceptionTargets: [
        "fraction-decimal-equivalence-error",
        "decimal-benchmark-confusion",
      ],
      relatedAssessmentItemIds: [
        "decimals-foundations-fraction-decimal-match-004",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use a fraction-decimal table for quarters.",
      },
    },
    {
      id: "mini-check-comparing-ordering-rounding-decimals",
      title: "Mini Check: compare and round",
      prompt:
        "Order from smallest to largest: 0.6, 0.06, 0.66. Then round 0.66 to the nearest tenth.",
      taskType: "short_answer",
      expectedAnswer: "0.06, 0.6, 0.66; 0.7",
      acceptableAnswers: [
        "0.06, 0.6, 0.66; 0.7",
        "0.06 0.6 0.66 0.7",
      ],
      workedSolution:
        "0.06 is 6 hundredths, 0.6 is 60 hundredths, and 0.66 is 66 hundredths. To round 0.66 to the nearest tenth, the hundredths digit is 6, so it rounds to 0.7.",
      supportPrompt:
        "Use a 0 to 1 number line and compare hundredths.",
      misconceptionTargets: [
        "decimal-number-line-placement-error",
        "decimal-rounding-error",
      ],
      relatedAssessmentItemIds: [
        "decimals-foundations-ordering-number-line-008",
        "decimals-foundations-rounding-009",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use a 0 to 1 number line with marks for 0.06, 0.6, 0.66 and 0.7.",
      },
    },
    {
      id: "mini-check-decimal-problem-solving",
      title: "Mini Check: decimal context",
      prompt:
        "A ribbon is 1.25 m long. Another ribbon is 0.50 m long. What is the total length?",
      taskType: "numeric",
      expectedAnswer: "1.75",
      acceptableAnswers: ["1.75", "1.75 m"],
      workedSolution:
        "Add the measurements by place value: 1.25 m + 0.50 m = 1.75 m.",
      supportPrompt:
        "Line up the decimal points and add tenths with tenths and hundredths with hundredths.",
      misconceptionTargets: [
        "measurement-decimal-context-error",
        "decimal-place-value-error",
      ],
      relatedAssessmentItemIds: [
        "decimals-foundations-money-measurement-011",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Use a measurement context card showing 1.25 m and 0.50 m ribbons.",
      },
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised decimals foundations. They worked on tenths and hundredths, decimal place value, fraction-decimal connections, comparing, ordering and rounding decimals, and using decimals in money and measurement contexts.",
};

export const NUMBER_DECIMALS_FOUNDATIONS_PRACTICE_MODULES = Object.freeze([
  NUMBER_DECIMALS_FOUNDATIONS_PRACTICE_MODULE,
]);

export function getNumberDecimalsFoundationsPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_DECIMALS_FOUNDATIONS_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberDecimalsFoundationsPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_DECIMALS_FOUNDATIONS_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
