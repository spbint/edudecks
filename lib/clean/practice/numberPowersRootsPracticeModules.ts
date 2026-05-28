import {
  NUMBER_POWERS_ROOTS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberPowersRootsAssessmentItems";

export type NumberPracticeModuleSectionType =
  | "learn"
  | "understanding"
  | "fluency"
  | "problem_solving"
  | "reasoning"
  | "mini_check";

export type NumberPracticeTaskType =
  | "worked_example"
  | "multiple_choice"
  | "short_answer"
  | "numeric"
  | "explain"
  | "sort_or_match";

export type NumberPracticeTask = {
  id: string;
  title: string;
  prompt: string;
  taskType: NumberPracticeTaskType;
  expectedAnswer?: string;
  acceptableAnswers?: string[];
  options?: string[];
  workedSolution?: string;
  supportPrompt?: string;
  misconceptionTargets: string[];
  relatedAssessmentItemIds?: string[];
};

export type NumberPracticeSection = {
  id: string;
  type: NumberPracticeModuleSectionType;
  title: string;
  learnerGoal: string;
  tasks: NumberPracticeTask[];
};

export type NumberPracticeModule = {
  id: string;
  progressionBandKey: string;
  title: string;
  shortTitle: string;
  description: string;
  yearBandLabel: string;
  subjectKey: "mathematics";
  strandKey: "number-and-place-value";
  stageKey: string;
  stepKey: string;
  pathwayStepId: string;
  relatedAssessmentBankKey: string;
  learnCard: {
    bigIdea: string;
    keyLanguage: string[];
    workedExample: string;
    parentTip: string;
  };
  sections: NumberPracticeSection[];
  miniCheck: NumberPracticeTask[];
  evidenceSummaryTemplate: string;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_POWERS_ROOTS_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-powers-roots-practice-module-v1",
  progressionBandKey: "powers-roots-exponent-notation",
  title: "Powers, roots and exponent notation",
  shortTitle: "Powers and roots",
  description:
    "Practise square roots, powers, exponent notation, powers of 10 and simple exponent laws.",
  yearBandLabel: "Years 7-8",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "years-9-10-consolidation",
  stepKey: "powers-roots-exponent-notation",
  pathwayStepId:
    "mathematics::number-and-place-value::years-9-10-consolidation::powers-roots-exponent-notation",
  relatedAssessmentBankKey: NUMBER_POWERS_ROOTS_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Exponent notation is a compact way to describe repeated multiplication. Square roots reverse square numbers, and exponent laws help simplify expressions with the same base.",
    keyLanguage: [
      "square number",
      "square root",
      "exponent",
      "base",
      "power",
      "repeated multiplication",
      "prime factorisation",
      "powers of 10",
    ],
    workedExample:
      "6 x 6 x 6 x 6 is 6^4 because the base is 6 and there are four repeated factors. Since 13^2 = 169, sqrt(169) = 13.",
    parentTip:
      "Ask the learner to say what repeats, how many times it repeats, and whether a root is reversing a square number.",
  },
  sections: [
    {
      id: "understanding",
      type: "understanding",
      title: "Understanding",
      learnerGoal:
        "I can connect powers, roots and repeated multiplication.",
      tasks: [
        {
          id: "understanding-match-repeated-multiplication",
          title: "Match repeated multiplication to exponent form",
          prompt: "Which expression matches 5 x 5 x 5?",
          taskType: "multiple_choice",
          options: ["5^3", "3^5", "5 x 3", "5 + 5 + 5"],
          expectedAnswer: "5^3",
          acceptableAnswers: ["5^3"],
          workedSolution:
            "The repeated factor is 5 and it appears 3 times, so the exponent form is 5^3.",
          supportPrompt:
            "Underline the factor that repeats, then count how many factors there are.",
          misconceptionTargets: [
            "exponent-notation-confusion",
            "repeated-multiplication-confusion",
          ],
          relatedAssessmentItemIds: [
            "powers-roots-exponent-form-003",
            "powers-roots-base-exponent-010",
          ],
        },
        {
          id: "understanding-square-root-connection",
          title: "Connect a square number and its square root",
          prompt:
            "Complete the matching statement: if 12^2 = 144, then sqrt(144) = __.",
          taskType: "numeric",
          expectedAnswer: "12",
          acceptableAnswers: ["12"],
          workedSolution:
            "12^2 means 12 x 12, which equals 144. The square root reverses that square, so sqrt(144) = 12.",
          supportPrompt:
            "Ask: which number multiplied by itself gives 144?",
          misconceptionTargets: ["square-root-perfect-square-confusion"],
          relatedAssessmentItemIds: [
            "powers-roots-perfect-square-001",
            "powers-roots-square-connection-002",
          ],
        },
        {
          id: "understanding-identify-base-exponent",
          title: "Identify the base and exponent",
          prompt: "In 7^4, what is the base and what is the exponent?",
          taskType: "short_answer",
          expectedAnswer: "base 7, exponent 4",
          acceptableAnswers: [
            "base 7, exponent 4",
            "the base is 7 and the exponent is 4",
            "7 is the base and 4 is the exponent",
          ],
          workedSolution:
            "The base is the repeated factor, so the base is 7. The exponent counts the repeated factors, so the exponent is 4.",
          supportPrompt:
            "Read 7^4 as four factors of 7 multiplied together.",
          misconceptionTargets: [
            "base-vs-exponent-confusion",
            "exponent-notation-confusion",
          ],
          relatedAssessmentItemIds: ["powers-roots-base-exponent-010"],
        },
      ],
    },
    {
      id: "fluency",
      type: "fluency",
      title: "Fluency",
      learnerGoal: "I can calculate and simplify simple powers and roots.",
      tasks: [
        {
          id: "fluency-square-root-169",
          title: "Calculate a square root",
          prompt: "Calculate sqrt(169).",
          taskType: "numeric",
          expectedAnswer: "13",
          acceptableAnswers: ["13"],
          workedSolution:
            "13 x 13 = 169, so sqrt(169) = 13.",
          supportPrompt:
            "Think of nearby square numbers: 12^2 = 144 and 13^2 = 169.",
          misconceptionTargets: ["square-root-perfect-square-confusion"],
          relatedAssessmentItemIds: ["powers-roots-perfect-square-001"],
        },
        {
          id: "fluency-write-exponent-form",
          title: "Write exponent form",
          prompt: "Write 3 x 3 x 3 x 3 in exponent form.",
          taskType: "short_answer",
          expectedAnswer: "3^4",
          acceptableAnswers: ["3^4"],
          workedSolution:
            "There are four factors of 3, so the expression is 3^4.",
          supportPrompt:
            "The repeated factor becomes the base. The number of factors becomes the exponent.",
          misconceptionTargets: [
            "exponent-notation-confusion",
            "repeated-multiplication-confusion",
          ],
          relatedAssessmentItemIds: ["powers-roots-exponent-form-003"],
        },
        {
          id: "fluency-division-law",
          title: "Simplify a quotient of powers",
          prompt: "Simplify 8^5 / 8^2.",
          taskType: "short_answer",
          expectedAnswer: "8^3",
          acceptableAnswers: ["8^3"],
          workedSolution:
            "When dividing powers with the same base, subtract the exponents: 8^(5-2) = 8^3.",
          supportPrompt:
            "Expand the powers and cancel two common factors of 8.",
          misconceptionTargets: [
            "exponent-law-division-error",
            "base-vs-exponent-confusion",
          ],
          relatedAssessmentItemIds: ["powers-roots-division-law-009"],
        },
      ],
    },
    {
      id: "problem-solving",
      type: "problem_solving",
      title: "Problem Solving",
      learnerGoal:
        "I can use powers and roots in short mathematical contexts.",
      tasks: [
        {
          id: "problem-solving-estimate-root-70",
          title: "Estimate a square root",
          prompt:
            "Between which two consecutive whole numbers does sqrt(70) lie?",
          taskType: "short_answer",
          expectedAnswer: "8 and 9",
          acceptableAnswers: [
            "8 and 9",
            "between 8 and 9",
            "8, 9",
            "8 to 9",
          ],
          workedSolution:
            "8^2 = 64 and 9^2 = 81. Since 70 is between 64 and 81, sqrt(70) lies between 8 and 9.",
          supportPrompt:
            "Find the perfect squares just below and just above 70.",
          misconceptionTargets: ["square-root-estimation-error"],
          relatedAssessmentItemIds: ["powers-roots-estimate-root-004"],
        },
        {
          id: "problem-solving-prime-powers-360",
          title: "Represent a number using prime powers",
          prompt: "Write 360 as a product of prime powers.",
          taskType: "short_answer",
          expectedAnswer: "2^3 x 3^2 x 5",
          acceptableAnswers: [
            "2^3 x 3^2 x 5",
            "2^3 * 3^2 * 5",
            "3^2 x 2^3 x 5",
            "5 x 2^3 x 3^2",
          ],
          workedSolution:
            "360 = 36 x 10 = 2^2 x 3^2 x 2 x 5 = 2^3 x 3^2 x 5.",
          supportPrompt:
            "Break 360 into smaller factor pairs, then keep factoring until only primes remain.",
          misconceptionTargets: [
            "prime-factorisation-exponent-error",
            "exponent-notation-confusion",
          ],
          relatedAssessmentItemIds: [
            "powers-roots-prime-powers-006",
            "powers-roots-factor-tree-007",
          ],
        },
        {
          id: "problem-solving-powers-of-ten",
          title: "Interpret powers of 10 notation",
          prompt: "What number is 4.05 x 10^3?",
          taskType: "numeric",
          expectedAnswer: "4050",
          acceptableAnswers: ["4050", "4,050"],
          workedSolution:
            "10^3 = 1000, so 4.05 x 10^3 = 4.05 x 1000 = 4050.",
          supportPrompt:
            "Multiplying by 10^3 shifts each digit three place-value positions to the left.",
          misconceptionTargets: [
            "powers-of-ten-place-value-error",
            "base-vs-exponent-confusion",
          ],
          relatedAssessmentItemIds: ["powers-roots-powers-of-ten-005"],
        },
      ],
    },
    {
      id: "reasoning",
      type: "reasoning",
      title: "Reasoning",
      learnerGoal: "I can explain why exponent rules work.",
      tasks: [
        {
          id: "reasoning-multiplication-law",
          title: "Explain the multiplication law",
          prompt: "Explain why 6^3 x 6^2 = 6^5.",
          taskType: "explain",
          expectedAnswer:
            "6^3 x 6^2 has three factors of 6 and two more factors of 6, so there are five factors of 6 altogether: 6^5.",
          acceptableAnswers: [
            "There are 3 factors of 6 and 2 factors of 6, making 5 factors of 6 altogether.",
            "When multiplying powers with the same base, add the exponents because the repeated factors combine.",
          ],
          workedSolution:
            "6^3 x 6^2 = (6 x 6 x 6) x (6 x 6), which is five factors of 6, so it equals 6^5.",
          supportPrompt:
            "Write both powers out as repeated multiplication before using the rule.",
          misconceptionTargets: [
            "exponent-law-multiplication-error",
            "repeated-multiplication-confusion",
          ],
          relatedAssessmentItemIds: ["powers-roots-multiply-law-008"],
        },
        {
          id: "reasoning-zero-exponent-pattern",
          title: "Explain a zero exponent",
          prompt: "Use a pattern to explain why 10^0 = 1.",
          taskType: "explain",
          expectedAnswer:
            "The pattern divides by 10 each time the exponent decreases: 10^2 = 100, 10^1 = 10, so 10^0 = 1.",
          acceptableAnswers: [
            "Each step down divides by 10, so after 10^1 = 10, 10^0 = 1.",
            "10^1 / 10 = 10^0, and 10 / 10 = 1.",
          ],
          workedSolution:
            "Going from 10^3 to 10^2 to 10^1 divides by 10 each time. One more step gives 10^0 = 1.",
          supportPrompt:
            "Write 10^3, 10^2, 10^1 and look at what happens each step.",
          misconceptionTargets: [
            "zero-exponent-confusion",
            "exponent-law-division-error",
          ],
          relatedAssessmentItemIds: ["powers-roots-zero-exponent-011"],
        },
        {
          id: "reasoning-exact-and-not-whole-root",
          title: "Compare exact and non-whole square roots",
          prompt:
            "Explain why sqrt(49) is exact as a whole number but sqrt(50) is not a whole number.",
          taskType: "explain",
          expectedAnswer:
            "49 is a perfect square because 7 x 7 = 49, so sqrt(49) = 7. But 50 is between 49 and 64, so sqrt(50) is between 7 and 8 and is not a whole number.",
          acceptableAnswers: [
            "sqrt(49) = 7 because 7^2 = 49, while sqrt(50) is between 7 and 8 because 50 is between 49 and 64.",
            "49 is a perfect square and 50 is not, so only sqrt(49) is a whole number.",
          ],
          workedSolution:
            "Perfect squares have whole-number square roots. Since 49 is 7^2, sqrt(49) = 7. Since 50 is not a perfect square, sqrt(50) is not a whole number.",
          supportPrompt:
            "Compare 50 with the nearby perfect squares 49 and 64.",
          misconceptionTargets: [
            "square-root-perfect-square-confusion",
            "square-root-estimation-error",
          ],
          relatedAssessmentItemIds: [
            "powers-roots-perfect-square-001",
            "powers-roots-estimate-root-004",
          ],
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-perfect-square-root",
      title: "Mini Check: square root",
      prompt: "Calculate sqrt(225).",
      taskType: "numeric",
      expectedAnswer: "15",
      acceptableAnswers: ["15"],
      workedSolution:
        "15 x 15 = 225, so sqrt(225) = 15.",
      misconceptionTargets: ["square-root-perfect-square-confusion"],
      relatedAssessmentItemIds: ["powers-roots-perfect-square-001"],
    },
    {
      id: "mini-check-exponent-notation",
      title: "Mini Check: exponent notation",
      prompt: "Write 9 x 9 x 9 in exponent form.",
      taskType: "short_answer",
      expectedAnswer: "9^3",
      acceptableAnswers: ["9^3"],
      workedSolution:
        "The repeated factor is 9 and there are three factors, so the expression is 9^3.",
      misconceptionTargets: [
        "exponent-notation-confusion",
        "repeated-multiplication-confusion",
      ],
      relatedAssessmentItemIds: ["powers-roots-exponent-form-003"],
    },
    {
      id: "mini-check-exponent-law",
      title: "Mini Check: exponent law",
      prompt: "Simplify 4^2 x 4^5.",
      taskType: "short_answer",
      expectedAnswer: "4^7",
      acceptableAnswers: ["4^7"],
      workedSolution:
        "When multiplying powers with the same base, add the exponents: 4^(2+5) = 4^7.",
      misconceptionTargets: [
        "exponent-law-multiplication-error",
        "base-vs-exponent-confusion",
      ],
      relatedAssessmentItemIds: ["powers-roots-multiply-law-008"],
    },
    {
      id: "mini-check-reasoning",
      title: "Mini Check: reasoning",
      prompt:
        "Explain why 11^4 / 11^2 simplifies to 11^2.",
      taskType: "explain",
      expectedAnswer:
        "11^4 has four factors of 11 and dividing by 11^2 removes two of them, leaving two factors of 11, so the result is 11^2.",
      acceptableAnswers: [
        "When dividing powers with the same base, subtract the exponents: 11^(4-2) = 11^2.",
        "Two factors of 11 cancel, leaving 11 x 11, which is 11^2.",
      ],
      workedSolution:
        "11^4 / 11^2 = (11 x 11 x 11 x 11) / (11 x 11). Two factors cancel, leaving 11 x 11 = 11^2.",
      misconceptionTargets: [
        "exponent-law-division-error",
        "repeated-multiplication-confusion",
      ],
      relatedAssessmentItemIds: ["powers-roots-division-law-009"],
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised powers, roots and exponent notation. They worked on connecting square numbers and square roots, writing repeated multiplication using exponents, interpreting powers of 10, and applying simple exponent laws.",
};

export const NUMBER_UPPER_NUMBER_PRACTICE_MODULES = Object.freeze([
  NUMBER_POWERS_ROOTS_PRACTICE_MODULE,
]);

export function getNumberPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_UPPER_NUMBER_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_UPPER_NUMBER_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
