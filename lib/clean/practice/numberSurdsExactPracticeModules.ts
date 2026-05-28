import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

const NUMBER_SURDS_EXACT_ITEM_BANK_KEY =
  "number-surds-exact-assessment-items-v1";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_SURDS_EXACT_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-surds-exact-practice-module-v1",
  progressionBandKey: "surds-and-exact-form",
  title: "Surds and exact form",
  shortTitle: "Surds and exact form",
  description:
    "Practise surd notation, simplifying surds, surd operations, rationalising denominators, and exact form reasoning.",
  yearBandLabel: "Years 10-10A",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "years-9-10-consolidation",
  stepKey: "surds-and-exact-form",
  pathwayStepId:
    "mathematics::number-and-place-value::years-9-10-consolidation::surds-and-exact-form",
  relatedAssessmentBankKey: NUMBER_SURDS_EXACT_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Surds are exact square-root forms that cannot always be written as whole numbers. Exact form keeps the value precise while you simplify, combine, multiply, or rationalise expressions.",
    keyLanguage: [
      "surd",
      "exact form",
      "square root",
      "fractional power",
      "perfect-square factor",
      "like surds",
      "unlike surds",
      "rationalise",
      "denominator",
      "conjugate",
    ],
    workedExample:
      "sqrt(72) simplifies by finding a perfect-square factor: sqrt(72) = sqrt(36 x 2) = 6sqrt(2). This keeps the answer exact instead of rounding to a decimal.",
    parentTip:
      "This module is about keeping values exact and recognising when expressions are equivalent, not just getting a decimal answer.",
  },
  sections: [
    {
      id: "surd-notation-and-fractional-powers",
      type: "understanding",
      title: "Surd notation and fractional powers",
      learnerGoal: "I can connect fractional powers and surd notation.",
      tasks: [
        {
          id: "surd-notation-fractional-power-to-root",
          title: "Convert a fractional index",
          prompt: "Write 13^(1/2) in surd form.",
          taskType: "short_answer",
          expectedAnswer: "sqrt(13)",
          acceptableAnswers: ["sqrt(13)", "sqrt 13"],
          workedSolution:
            "An exponent of 1/2 means square root, so 13^(1/2) = sqrt(13).",
          supportPrompt:
            "Read the denominator 2 in the fractional index as square root.",
          misconceptionTargets: ["fractional-index-to-surd-confusion"],
          relatedAssessmentItemIds: ["surds-exact-fractional-form-001"],
        },
        {
          id: "surd-notation-evaluate-fractional-power",
          title: "Evaluate a fractional power",
          prompt: "Evaluate 27^(2/3).",
          taskType: "numeric",
          expectedAnswer: "9",
          acceptableAnswers: ["9"],
          workedSolution:
            "The denominator 3 means cube root, and the numerator 2 means square. The cube root of 27 is 3, and 3^2 = 9.",
          supportPrompt:
            "Take the root first, then apply the power.",
          misconceptionTargets: [
            "fractional-power-evaluation-error",
            "fractional-index-to-surd-confusion",
          ],
          relatedAssessmentItemIds: ["surds-exact-evaluate-power-002"],
        },
        {
          id: "surd-notation-equivalent-form",
          title: "Identify an equivalent form",
          prompt: "Which expression is equivalent to 7^(3/2)?",
          taskType: "multiple_choice",
          options: ["7sqrt(7)", "3sqrt(7)", "sqrt(21)", "7 + sqrt(7)"],
          expectedAnswer: "7sqrt(7)",
          acceptableAnswers: ["7sqrt(7)"],
          workedSolution:
            "7^(3/2) = 7^1 x 7^(1/2), so it equals 7sqrt(7).",
          supportPrompt:
            "Split 3/2 into 1 + 1/2 so you can see the whole-number factor and the square root.",
          misconceptionTargets: [
            "fractional-index-to-surd-confusion",
            "fractional-power-evaluation-error",
          ],
          relatedAssessmentItemIds: ["surds-exact-equivalent-form-003"],
        },
      ],
    },
    {
      id: "surd-simplification",
      type: "fluency",
      title: "Surd simplification",
      learnerGoal: "I can simplify surds using perfect-square factors.",
      tasks: [
        {
          id: "surd-simplification-simple-root",
          title: "Simplify a surd",
          prompt: "Simplify sqrt(72).",
          taskType: "short_answer",
          expectedAnswer: "6sqrt(2)",
          acceptableAnswers: ["6sqrt(2)", "6 sqrt(2)", "6sqrt 2"],
          workedSolution:
            "72 = 36 x 2, and 36 is a perfect square. So sqrt(72) = sqrt(36)sqrt(2) = 6sqrt(2).",
          supportPrompt:
            "Look for the largest perfect-square factor inside the root.",
          misconceptionTargets: [
            "surd-simplification-factor-error",
            "non-perfect-square-factor-error",
          ],
          relatedAssessmentItemIds: ["surds-exact-simplify-root-004"],
        },
        {
          id: "surd-simplification-with-coefficient",
          title: "Simplify with a coefficient",
          prompt: "Simplify 2sqrt(45).",
          taskType: "short_answer",
          expectedAnswer: "6sqrt(5)",
          acceptableAnswers: ["6sqrt(5)", "6 sqrt(5)", "6sqrt 5"],
          workedSolution:
            "sqrt(45) = sqrt(9 x 5) = 3sqrt(5). Then 2sqrt(45) = 2 x 3sqrt(5) = 6sqrt(5).",
          supportPrompt:
            "Simplify the square root first, then multiply by the outside coefficient.",
          misconceptionTargets: [
            "coefficient-surd-distribution-error",
            "surd-simplification-factor-error",
          ],
          relatedAssessmentItemIds: ["surds-exact-coefficient-005"],
        },
        {
          id: "surd-simplification-correct-step",
          title: "Choose the correct simplification step",
          prompt: "Which first step is best for simplifying sqrt(48)?",
          taskType: "multiple_choice",
          options: [
            "sqrt(48) = sqrt(16 x 3)",
            "sqrt(48) = sqrt(6 x 8), so it is 14",
            "sqrt(48) = 48sqrt(1)",
            "sqrt(48) = sqrt(4 x 12), so it must stop at 2sqrt(12)",
          ],
          expectedAnswer: "sqrt(48) = sqrt(16 x 3)",
          acceptableAnswers: ["sqrt(48) = sqrt(16 x 3)"],
          workedSolution:
            "Use the largest perfect-square factor. Since 48 = 16 x 3, sqrt(48) = 4sqrt(3).",
          supportPrompt:
            "Choose a factor pair with a perfect square, ideally the largest one.",
          misconceptionTargets: [
            "surd-simplification-factor-error",
            "non-perfect-square-factor-error",
          ],
          relatedAssessmentItemIds: [
            "surds-exact-simplify-root-004",
            "surds-exact-multi-step-009",
          ],
        },
      ],
    },
    {
      id: "surd-operations",
      type: "problem_solving",
      title: "Surd operations",
      learnerGoal: "I can multiply surds and combine like surd terms.",
      tasks: [
        {
          id: "surd-operations-multiply-surds",
          title: "Multiply two surds",
          prompt: "Simplify sqrt(6) x sqrt(24).",
          taskType: "numeric",
          expectedAnswer: "12",
          acceptableAnswers: ["12"],
          workedSolution:
            "sqrt(6) x sqrt(24) = sqrt(144), and sqrt(144) = 12.",
          supportPrompt:
            "Multiply the numbers under the square roots, then simplify.",
          misconceptionTargets: [
            "surd-multiplication-error",
            "surd-simplification-factor-error",
          ],
          relatedAssessmentItemIds: ["surds-exact-multiply-006"],
        },
        {
          id: "surd-operations-like-surds",
          title: "Combine like surds",
          prompt: "Simplify 4sqrt(3) - sqrt(3).",
          taskType: "short_answer",
          expectedAnswer: "3sqrt(3)",
          acceptableAnswers: ["3sqrt(3)", "3 sqrt(3)", "3sqrt 3"],
          workedSolution:
            "Both terms have the same radical part, sqrt(3). Subtract the coefficients: 4sqrt(3) - 1sqrt(3) = 3sqrt(3).",
          supportPrompt:
            "Like surds combine like algebraic terms: keep the radical part and combine coefficients.",
          misconceptionTargets: ["like-surd-combination-error"],
          relatedAssessmentItemIds: ["surds-exact-add-like-007"],
        },
        {
          id: "surd-operations-unlike-surds",
          title: "Recognise unlike surds",
          prompt: "True or false: sqrt(3) + sqrt(5) = sqrt(8).",
          taskType: "multiple_choice",
          options: ["True", "False"],
          expectedAnswer: "False",
          acceptableAnswers: ["False", "false"],
          workedSolution:
            "sqrt(3) and sqrt(5) are unlike surds, so they cannot be combined into one square root.",
          supportPrompt:
            "You can only add or subtract surds directly when the radical parts match after simplification.",
          misconceptionTargets: [
            "unlike-surd-combination-error",
            "surd-simplification-factor-error",
          ],
          relatedAssessmentItemIds: ["surds-exact-unlike-008"],
        },
      ],
    },
    {
      id: "rationalising-denominators-and-exact-form",
      type: "reasoning",
      title: "Rationalising denominators and exact form",
      learnerGoal:
        "I can rationalise denominators and explain why exact form matters.",
      tasks: [
        {
          id: "rationalising-denominators-simple",
          title: "Rationalise a simple denominator",
          prompt: "Rationalise 5 / sqrt(2).",
          taskType: "short_answer",
          expectedAnswer: "5sqrt(2) / 2",
          acceptableAnswers: [
            "5sqrt(2) / 2",
            "5sqrt(2)/2",
            "(5sqrt(2)) / 2",
            "(5sqrt(2))/2",
          ],
          workedSolution:
            "Multiply top and bottom by sqrt(2): 5 / sqrt(2) x sqrt(2) / sqrt(2) = 5sqrt(2) / 2.",
          supportPrompt:
            "Use an equivalent fraction so the denominator becomes a rational number.",
          misconceptionTargets: [
            "rationalising-denominator-error",
            "surd-multiplication-error",
          ],
          relatedAssessmentItemIds: ["surds-exact-rationalise-simple-010"],
        },
        {
          id: "rationalising-denominators-conjugate",
          title: "Choose the conjugate",
          prompt:
            "Which expression should you multiply by to rationalise 6 / (1 + sqrt(5))?",
          taskType: "multiple_choice",
          options: [
            "(1 - sqrt(5)) / (1 - sqrt(5))",
            "sqrt(5) / sqrt(5)",
            "(1 + sqrt(5)) / (1 + sqrt(5))",
            "5 / 5",
          ],
          expectedAnswer: "(1 - sqrt(5)) / (1 - sqrt(5))",
          acceptableAnswers: ["(1 - sqrt(5)) / (1 - sqrt(5))"],
          workedSolution:
            "The conjugate of 1 + sqrt(5) is 1 - sqrt(5). Multiplying by the conjugate makes the denominator 1 - 5, which has no surd.",
          supportPrompt:
            "For a binomial denominator, use the same two terms with the opposite sign between them.",
          misconceptionTargets: [
            "rationalising-denominator-error",
            "coefficient-surd-distribution-error",
          ],
          relatedAssessmentItemIds: ["surds-exact-rationalise-binomial-011"],
        },
        {
          id: "rationalising-denominators-exact-form",
          title: "Why exact form matters",
          prompt:
            "Which explanation best describes why 5sqrt(2) can be better than 7.071 in later algebra?",
          taskType: "multiple_choice",
          options: [
            "5sqrt(2) keeps the exact value; 7.071 is rounded and may introduce error later.",
            "7.071 is always exact because it is a decimal.",
            "5sqrt(2) is not a number until it is changed to a decimal.",
            "Exact form matters only when there are units.",
          ],
          expectedAnswer:
            "5sqrt(2) keeps the exact value; 7.071 is rounded and may introduce error later.",
          acceptableAnswers: [
            "5sqrt(2) keeps the exact value; 7.071 is rounded and may introduce error later.",
          ],
          workedSolution:
            "5sqrt(2) is exact. The decimal 7.071 is rounded, so using it too early can affect later exact calculations.",
          supportPrompt:
            "Ask which form keeps all the information and which form has already been rounded.",
          misconceptionTargets: [
            "exact-form-vs-decimal-error",
            "surd-simplification-factor-error",
          ],
          relatedAssessmentItemIds: ["surds-exact-why-exact-012"],
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-surd-notation-fractional-powers",
      title: "Mini Check: surd notation",
      prompt: "Write 11^(1/2) in surd form.",
      taskType: "short_answer",
      expectedAnswer: "sqrt(11)",
      acceptableAnswers: ["sqrt(11)", "sqrt 11"],
      workedSolution:
        "A power of 1/2 means square root, so 11^(1/2) = sqrt(11).",
      supportPrompt:
        "The denominator 2 in the fractional index means square root.",
      misconceptionTargets: ["fractional-index-to-surd-confusion"],
      relatedAssessmentItemIds: ["surds-exact-fractional-form-001"],
    },
    {
      id: "mini-check-surd-simplification",
      title: "Mini Check: simplify a surd",
      prompt: "Simplify sqrt(98).",
      taskType: "short_answer",
      expectedAnswer: "7sqrt(2)",
      acceptableAnswers: ["7sqrt(2)", "7 sqrt(2)", "7sqrt 2"],
      workedSolution:
        "98 = 49 x 2, so sqrt(98) = sqrt(49)sqrt(2) = 7sqrt(2).",
      supportPrompt:
        "Look for the largest perfect-square factor of 98.",
      misconceptionTargets: [
        "surd-simplification-factor-error",
        "non-perfect-square-factor-error",
      ],
      relatedAssessmentItemIds: ["surds-exact-simplify-root-004"],
    },
    {
      id: "mini-check-surd-operations",
      title: "Mini Check: surd operations",
      prompt: "Simplify 2sqrt(5) + 3sqrt(5).",
      taskType: "short_answer",
      expectedAnswer: "5sqrt(5)",
      acceptableAnswers: ["5sqrt(5)", "5 sqrt(5)", "5sqrt 5"],
      workedSolution:
        "The radical part is the same, so add the coefficients: 2sqrt(5) + 3sqrt(5) = 5sqrt(5).",
      supportPrompt:
        "Like surds have the same square-root part.",
      misconceptionTargets: ["like-surd-combination-error"],
      relatedAssessmentItemIds: ["surds-exact-add-like-007"],
    },
    {
      id: "mini-check-rationalising-exact-form",
      title: "Mini Check: rationalising",
      prompt: "Rationalise 3 / sqrt(5).",
      taskType: "short_answer",
      expectedAnswer: "3sqrt(5) / 5",
      acceptableAnswers: [
        "3sqrt(5) / 5",
        "3sqrt(5)/5",
        "(3sqrt(5)) / 5",
        "(3sqrt(5))/5",
      ],
      workedSolution:
        "Multiply top and bottom by sqrt(5): 3 / sqrt(5) x sqrt(5) / sqrt(5) = 3sqrt(5) / 5.",
      supportPrompt:
        "Use the same square root on the numerator and denominator.",
      misconceptionTargets: [
        "rationalising-denominator-error",
        "surd-multiplication-error",
      ],
      relatedAssessmentItemIds: ["surds-exact-rationalise-simple-010"],
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised surds and exact form. They worked on fractional powers, simplifying surds, combining and multiplying surds, rationalising denominators, and explaining why exact form matters.",
};

export const NUMBER_SURDS_EXACT_PRACTICE_MODULES = Object.freeze([
  NUMBER_SURDS_EXACT_PRACTICE_MODULE,
]);

export function getNumberSurdsExactPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_SURDS_EXACT_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberSurdsExactPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_SURDS_EXACT_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
