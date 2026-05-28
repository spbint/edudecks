import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

const NUMBER_IRRATIONAL_REAL_ITEM_BANK_KEY =
  "number-irrational-real-assessment-items-v1";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_IRRATIONAL_REAL_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-irrational-real-practice-module-v1",
  progressionBandKey: "irrational-and-real-numbers",
  title: "Irrational and real numbers",
  shortTitle: "Real numbers",
  description:
    "Practise rational and irrational classification, square-root estimation, pi and exact form, and real-number comparison.",
  yearBandLabel: "Years 8-10",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "years-9-10-consolidation",
  stepKey: "irrational-and-real-numbers",
  pathwayStepId:
    "mathematics::number-and-place-value::years-9-10-consolidation::irrational-and-real-numbers",
  relatedAssessmentBankKey: NUMBER_IRRATIONAL_REAL_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Rational numbers can be written as fractions. Irrational numbers cannot be written exactly as fractions, so exact form and decimal approximation each have a useful role.",
    keyLanguage: [
      "rational number",
      "irrational number",
      "exact form",
      "approximation",
      "pi",
      "square root",
      "recurring decimal",
      "terminating decimal",
      "number line",
      "comparison",
    ],
    workedExample:
      "sqrt(9) is rational because it equals 3 exactly. sqrt(5) is irrational because 5 is not a perfect square. pi is irrational, while 3.14 is only an approximation of pi.",
    parentTip:
      "This module is about recognising what kind of number something is and whether a value is exact or approximate.",
  },
  sections: [
    {
      id: "rational-irrational-classification",
      type: "understanding",
      title: "Rational and irrational classification",
      learnerGoal:
        "I can classify rational and irrational numbers across fractions, decimals, square roots and pi.",
      tasks: [
        {
          id: "rational-irrational-classification-mixed-list",
          title: "Select the irrational values",
          prompt:
            "Which values are irrational: sqrt(16), sqrt(7), pi, 2/5, 0.3 recurring?",
          taskType: "short_answer",
          expectedAnswer: "sqrt(7) and pi",
          acceptableAnswers: [
            "sqrt(7) and pi",
            "pi and sqrt(7)",
            "sqrt(7), pi",
            "pi, sqrt(7)",
          ],
          workedSolution:
            "sqrt(16) = 4, so it is rational. 2/5 and 0.3 recurring are rational. sqrt(7) and pi are irrational.",
          supportPrompt:
            "Check whether each value can be written exactly as a fraction of integers.",
          misconceptionTargets: [
            "rational-irrational-classification-error",
            "pi-as-rational-error",
          ],
          relatedAssessmentItemIds: ["irr-real-identify-001"],
        },
        {
          id: "rational-irrational-classification-recurring-decimal",
          title: "Recurring decimals are rational",
          prompt: "Is 0.272727... rational or irrational?",
          taskType: "multiple_choice",
          options: ["Rational", "Irrational"],
          expectedAnswer: "Rational",
          acceptableAnswers: ["Rational", "rational"],
          workedSolution:
            "0.272727... has a recurring pattern, so it can be written as a fraction. That makes it rational.",
          supportPrompt:
            "An infinite decimal can still be rational if its pattern repeats forever.",
          misconceptionTargets: [
            "recurring-decimal-rational-confusion",
            "rational-irrational-classification-error",
          ],
          relatedAssessmentItemIds: ["irr-real-recurring-007"],
        },
        {
          id: "rational-irrational-classification-sort-values",
          title: "Classify three values",
          prompt:
            "Classify sqrt(4), sqrt(13), and 0.2 recurring. Write the rational values first, then the irrational value.",
          taskType: "short_answer",
          expectedAnswer: "Rational: sqrt(4), 0.2 recurring; Irrational: sqrt(13)",
          acceptableAnswers: [
            "Rational: sqrt(4), 0.2 recurring; Irrational: sqrt(13)",
            "sqrt(4) and 0.2 recurring are rational; sqrt(13) is irrational",
            "rational sqrt(4), 0.2 recurring; irrational sqrt(13)",
          ],
          workedSolution:
            "sqrt(4) = 2, so it is rational. 0.2 recurring can be written as a fraction, so it is rational. sqrt(13) is irrational because 13 is not a perfect square.",
          supportPrompt:
            "Evaluate perfect square roots and remember that recurring decimals are rational.",
          misconceptionTargets: [
            "rational-irrational-classification-error",
            "recurring-decimal-rational-confusion",
          ],
          relatedAssessmentItemIds: ["irr-real-classify-002"],
        },
      ],
    },
    {
      id: "pi-and-exact-form",
      type: "fluency",
      title: "Pi and exact form",
      learnerGoal:
        "I can distinguish exact forms from decimal approximations involving pi.",
      tasks: [
        {
          id: "pi-and-exact-form-pi-approximation",
          title: "Explain pi and 3.14",
          prompt: "Which statement is correct?",
          taskType: "multiple_choice",
          options: [
            "pi is irrational, and 3.14 is an approximation.",
            "pi is rational because 3.14 terminates.",
            "pi equals 22/7 exactly.",
            "pi is irrational only in geometry.",
          ],
          expectedAnswer: "pi is irrational, and 3.14 is an approximation.",
          acceptableAnswers: ["pi is irrational, and 3.14 is an approximation."],
          workedSolution:
            "pi is irrational. 3.14 is a useful rounded decimal, but it is not exactly equal to pi.",
          supportPrompt:
            "Separate the exact value pi from the decimal approximation used for calculating.",
          misconceptionTargets: [
            "pi-as-rational-error",
            "approximation-treated-as-exact",
          ],
          relatedAssessmentItemIds: ["irr-real-pi-004"],
        },
        {
          id: "pi-and-exact-form-circle-area",
          title: "Write exact area",
          prompt: "A circle has radius 5 cm. Write its exact area in terms of pi.",
          taskType: "short_answer",
          expectedAnswer: "25pi cm^2",
          acceptableAnswers: ["25pi", "25 pi", "25pi cm^2", "25 pi cm^2"],
          workedSolution:
            "Use A = pi r^2. With radius 5 cm, A = pi x 5^2 = 25pi cm^2.",
          supportPrompt:
            "Keep pi in the answer when exact form is requested.",
          misconceptionTargets: [
            "area-formula-exact-form-error",
            "exact-vs-decimal-form-confusion",
          ],
          relatedAssessmentItemIds: [
            "irr-real-exact-form-006",
            "irr-real-circle-area-008",
          ],
        },
        {
          id: "pi-and-exact-form-exact-vs-decimal",
          title: "Exact or approximate?",
          prompt:
            "For a circle with radius 4 m, which statement correctly compares 8pi m and 25.12 m?",
          taskType: "multiple_choice",
          options: [
            "8pi m is exact; 25.12 m is an approximation.",
            "25.12 m is exact because it is a decimal.",
            "8pi m is approximate because it contains pi.",
            "Both are exact because they describe the same circle.",
          ],
          expectedAnswer: "8pi m is exact; 25.12 m is an approximation.",
          acceptableAnswers: ["8pi m is exact; 25.12 m is an approximation."],
          workedSolution:
            "The exact circumference is 8pi m. Using pi about 3.14 gives the approximation 25.12 m.",
          supportPrompt:
            "A decimal can be practical without being exact.",
          misconceptionTargets: [
            "exact-vs-decimal-form-confusion",
            "approximation-treated-as-exact",
            "pi-as-rational-error",
          ],
          relatedAssessmentItemIds: ["irr-real-context-012"],
        },
      ],
    },
    {
      id: "square-root-estimation",
      type: "problem_solving",
      title: "Square-root estimation",
      learnerGoal:
        "I can estimate non-perfect square roots between whole numbers.",
      tasks: [
        {
          id: "square-root-estimation-between-integers",
          title: "Place a square root between integers",
          prompt: "Between which two consecutive whole numbers does sqrt(27) lie?",
          taskType: "short_answer",
          expectedAnswer: "5 and 6",
          acceptableAnswers: ["5 and 6", "between 5 and 6", "5, 6", "5 to 6"],
          workedSolution:
            "5^2 = 25 and 6^2 = 36. Since 27 is between 25 and 36, sqrt(27) lies between 5 and 6.",
          supportPrompt:
            "Find the perfect squares just below and just above the number inside the root.",
          misconceptionTargets: [
            "square-root-estimation-error",
            "number-line-placement-error",
          ],
          relatedAssessmentItemIds: ["irr-real-sqrt-between-003"],
        },
        {
          id: "square-root-estimation-compare-roots",
          title: "Compare square roots",
          prompt:
            "Put these in increasing order: sqrt(10), 3.5, 3.2, 3.",
          taskType: "short_answer",
          expectedAnswer: "3, sqrt(10), 3.2, 3.5",
          acceptableAnswers: [
            "3, sqrt(10), 3.2, 3.5",
            "3 sqrt(10) 3.2 3.5",
            "3 then sqrt(10) then 3.2 then 3.5",
          ],
          workedSolution:
            "sqrt(10) is about 3.16, so it is greater than 3 but less than 3.2.",
          supportPrompt:
            "Estimate sqrt(10) first, then compare everything on the same number line.",
          misconceptionTargets: [
            "square-root-estimation-error",
            "real-number-comparison-error",
          ],
          relatedAssessmentItemIds: [
            "irr-real-number-line-005",
            "irr-real-compare-009",
          ],
        },
        {
          id: "square-root-estimation-perfect-non-perfect",
          title: "Perfect and non-perfect roots",
          prompt:
            "Which explanation correctly compares sqrt(49) and sqrt(50)?",
          taskType: "multiple_choice",
          options: [
            "sqrt(49) is rational because it equals 7; sqrt(50) is irrational because 50 is not a perfect square.",
            "Both are rational because they are close to 7.",
            "Both are irrational because they use square root signs.",
            "sqrt(50) is rational because it is larger than sqrt(49).",
          ],
          expectedAnswer:
            "sqrt(49) is rational because it equals 7; sqrt(50) is irrational because 50 is not a perfect square.",
          acceptableAnswers: [
            "sqrt(49) is rational because it equals 7; sqrt(50) is irrational because 50 is not a perfect square.",
          ],
          workedSolution:
            "49 is a perfect square, so sqrt(49) = 7. 50 is not a perfect square, so sqrt(50) is irrational.",
          supportPrompt:
            "Check whether the number inside the root is a perfect square.",
          misconceptionTargets: [
            "rational-irrational-classification-error",
            "surd-simplification-readiness-gap",
          ],
          relatedAssessmentItemIds: ["irr-real-radicand-010"],
        },
      ],
    },
    {
      id: "real-number-position-and-comparison",
      type: "reasoning",
      title: "Real-number position and comparison",
      learnerGoal:
        "I can compare and position rational and irrational numbers.",
      tasks: [
        {
          id: "real-number-position-and-comparison-decimal-scale",
          title: "Compare on a decimal scale",
          prompt: "To two decimal places, what is sqrt(3)?",
          taskType: "numeric",
          expectedAnswer: "1.73",
          acceptableAnswers: ["1.73"],
          workedSolution:
            "sqrt(3) is about 1.732, so to two decimal places it is 1.73.",
          supportPrompt:
            "A decimal approximation helps compare an irrational value with other decimals.",
          misconceptionTargets: [
            "real-number-comparison-error",
            "number-line-placement-error",
          ],
          relatedAssessmentItemIds: ["irr-real-compare-009"],
        },
        {
          id: "real-number-position-and-comparison-position-values",
          title: "Order real numbers",
          prompt:
            "Put these values in increasing order: 1.7, sqrt(3), 1.75.",
          taskType: "short_answer",
          expectedAnswer: "1.7, sqrt(3), 1.75",
          acceptableAnswers: [
            "1.7, sqrt(3), 1.75",
            "1.7 sqrt(3) 1.75",
            "1.7 then sqrt(3) then 1.75",
          ],
          workedSolution:
            "sqrt(3) is about 1.73, so it sits between 1.7 and 1.75.",
          supportPrompt:
            "Estimate the irrational value before ordering the list.",
          misconceptionTargets: [
            "real-number-comparison-error",
            "number-line-placement-error",
          ],
          relatedAssessmentItemIds: [
            "irr-real-compare-009",
            "irr-real-number-line-005",
          ],
        },
        {
          id: "real-number-position-and-comparison-exact-approx-context",
          title: "Match exact and approximate roles",
          prompt:
            "A circular garden has circumference 8pi m, about 25.12 m. Which form is exact, and which is useful for practical measuring?",
          taskType: "short_answer",
          expectedAnswer: "8pi m is exact; 25.12 m is approximate",
          acceptableAnswers: [
            "8pi m is exact; 25.12 m is approximate",
            "8pi is exact and 25.12 is an approximation",
            "8pi m exact, 25.12 m approximate",
          ],
          workedSolution:
            "8pi m is exact because it keeps pi. 25.12 m uses pi about 3.14, so it is an approximation useful for measuring.",
          supportPrompt:
            "Look for whether pi has been replaced by a decimal.",
          misconceptionTargets: [
            "exact-vs-decimal-form-confusion",
            "approximation-treated-as-exact",
          ],
          relatedAssessmentItemIds: ["irr-real-context-012"],
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-rational-irrational-classification",
      title: "Mini Check: classification",
      prompt: "Which values are irrational: sqrt(25), sqrt(11), pi, 0.75?",
      taskType: "short_answer",
      expectedAnswer: "sqrt(11) and pi",
      acceptableAnswers: [
        "sqrt(11) and pi",
        "pi and sqrt(11)",
        "sqrt(11), pi",
        "pi, sqrt(11)",
      ],
      workedSolution:
        "sqrt(25) = 5 and 0.75 is rational. sqrt(11) and pi are irrational.",
      supportPrompt:
        "Perfect square roots and terminating decimals are rational.",
      misconceptionTargets: [
        "rational-irrational-classification-error",
        "pi-as-rational-error",
      ],
      relatedAssessmentItemIds: ["irr-real-identify-001"],
    },
    {
      id: "mini-check-pi-exact-form",
      title: "Mini Check: pi and exact form",
      prompt: "A circle has radius 7 cm. Write its exact area in terms of pi.",
      taskType: "short_answer",
      expectedAnswer: "49pi cm^2",
      acceptableAnswers: ["49pi", "49 pi", "49pi cm^2", "49 pi cm^2"],
      workedSolution:
        "A = pi r^2, so A = pi x 7^2 = 49pi cm^2.",
      supportPrompt:
        "Use exact form by keeping pi in the answer.",
      misconceptionTargets: [
        "area-formula-exact-form-error",
        "exact-vs-decimal-form-confusion",
      ],
      relatedAssessmentItemIds: ["irr-real-circle-area-008"],
    },
    {
      id: "mini-check-square-root-estimation",
      title: "Mini Check: square-root estimation",
      prompt: "Between which two consecutive whole numbers does sqrt(41) lie?",
      taskType: "short_answer",
      expectedAnswer: "6 and 7",
      acceptableAnswers: ["6 and 7", "between 6 and 7", "6, 7", "6 to 7"],
      workedSolution:
        "6^2 = 36 and 7^2 = 49. Since 41 is between 36 and 49, sqrt(41) lies between 6 and 7.",
      supportPrompt:
        "Find the nearest perfect squares on either side.",
      misconceptionTargets: [
        "square-root-estimation-error",
        "number-line-placement-error",
      ],
      relatedAssessmentItemIds: ["irr-real-sqrt-between-003"],
    },
    {
      id: "mini-check-real-number-comparison",
      title: "Mini Check: real-number comparison",
      prompt: "Put these in increasing order: 2.2, sqrt(5), 2.3.",
      taskType: "short_answer",
      expectedAnswer: "2.2, sqrt(5), 2.3",
      acceptableAnswers: [
        "2.2, sqrt(5), 2.3",
        "2.2 sqrt(5) 2.3",
        "2.2 then sqrt(5) then 2.3",
      ],
      workedSolution:
        "sqrt(5) is about 2.236, so it lies between 2.2 and 2.3.",
      supportPrompt:
        "Approximate the square root before placing it.",
      misconceptionTargets: [
        "real-number-comparison-error",
        "number-line-placement-error",
      ],
      relatedAssessmentItemIds: ["irr-real-number-line-005"],
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised irrational and real numbers. They worked on rational and irrational classification, pi and exact form, square-root estimation, and comparing real-number values.",
};

export const NUMBER_IRRATIONAL_REAL_PRACTICE_MODULES = Object.freeze([
  NUMBER_IRRATIONAL_REAL_PRACTICE_MODULE,
]);

export function getNumberIrrationalRealPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_IRRATIONAL_REAL_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberIrrationalRealPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_IRRATIONAL_REAL_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
