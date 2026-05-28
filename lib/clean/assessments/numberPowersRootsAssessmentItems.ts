import type {
  NumberAssessmentAnswerType,
  NumberAssessmentClassificationCategory,
  NumberAssessmentClassificationItem,
  NumberAssessmentItemDifficulty,
  NumberAssessmentMatchingPair,
  NumberAssessmentOpenResponseReview,
  NumberAssessmentStructuredOption,
  NumberAssessmentVisualSupport,
} from "@/lib/clean/assessments/numberApproximationAssessmentItems";
import type { NumberProgressionBandKey } from "@/lib/clean/pathways/mathematicsYears6To10NumberProgressionMap";

export type NumberPowersRootsProgressionBandKey = Extract<
  NumberProgressionBandKey,
  "powers-roots-exponent-notation"
>;

export type NumberPowersRootsProgressionStepKey =
  | "connect-perfect-squares-and-square-roots"
  | "estimate-non-perfect-square-roots"
  | "represent-natural-numbers-as-products-of-powers"
  | "use-powers-of-ten-in-expanded-notation"
  | "apply-exponent-notation"
  | "apply-exponent-laws-with-positive-integer-exponents";

export type NumberPowersRootsAssessmentFormat =
  | "square_roots"
  | "exponent_notation"
  | "powers_of_ten"
  | "prime_factorisation"
  | "exponent_laws"
  | "reasoning";

export type NumberPowersRootsMisconceptionCode =
  | "square-root-perfect-square-confusion"
  | "square-root-estimation-error"
  | "exponent-notation-confusion"
  | "repeated-multiplication-confusion"
  | "powers-of-ten-place-value-error"
  | "prime-factorisation-exponent-error"
  | "exponent-law-multiplication-error"
  | "exponent-law-division-error"
  | "zero-exponent-confusion"
  | "base-vs-exponent-confusion";

export type NumberPowersRootsAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberPowersRootsProgressionStepKey;
  ifCorrectGoToStepKey?: NumberPowersRootsProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberPowersRootsAssessmentItem = {
  id: string;
  progressionBandKey: NumberPowersRootsProgressionBandKey;
  progressionStepKey: NumberPowersRootsProgressionStepKey;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberPowersRootsAssessmentFormat;
  options?: string[];
  structuredOptions?: NumberAssessmentStructuredOption[];
  correctOptionIds?: string[];
  matchingPairs?: NumberAssessmentMatchingPair[];
  orderingItems?: string[];
  correctOrder?: string[];
  classificationCategories?: NumberAssessmentClassificationCategory[];
  classificationItems?: NumberAssessmentClassificationItem[];
  gapText?: string;
  gapAnswer?: string;
  gapAcceptableAnswers?: string[];
  trueFalseStatement?: string;
  correctBoolean?: boolean;
  correctionOptions?: string[];
  correctCorrection?: string;
  correctWorkingOptionId?: string;
  bestExplanationOptionId?: string;
  expectedAnswer?: string;
  acceptableAnswers?: string[];
  markingGuide?: string;
  workedSolution?: string;
  misconceptionTargets: NumberPowersRootsMisconceptionCode[];
  adaptiveRoute: NumberPowersRootsAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY: NumberPowersRootsProgressionBandKey =
  "powers-roots-exponent-notation";

export const NUMBER_POWERS_ROOTS_ITEM_BANK_KEY =
  "number-powers-roots-assessment-items-v1";

export const NUMBER_POWERS_ROOTS_ASSESSMENT_ITEMS: NumberPowersRootsAssessmentItem[] =
  [
    {
      id: "powers-roots-perfect-square-001",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-perfect-squares-and-square-roots",
      title: "Find the square root of a perfect square",
      prompt: "If 14^2 = 196, what is sqrt(196)?",
      difficulty: "foundation",
      answerType: "numeric",
      format: "square_roots",
      expectedAnswer: "14",
      acceptableAnswers: ["14"],
      markingGuide:
        "Award full credit for 14. The square root asks which positive number squares to make 196.",
      workedSolution: "Because 14^2 = 196, sqrt(196) = 14.",
      misconceptionTargets: ["square-root-perfect-square-confusion"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-perfect-squares-and-square-roots",
        ifCorrectGoToStepKey: "estimate-non-perfect-square-roots",
        practiceRecommendation:
          "Practise matching perfect squares with their square roots and checking that the square root reverses squaring.",
        diagnosticNote:
          "This item checks whether the learner understands the inverse relationship between squaring and square roots.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "powers-roots-square-connection-002",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-perfect-squares-and-square-roots",
      title: "Connect a square number with its square root",
      prompt:
        "Classify each statement as a correct square-root match or not a correct match.",
      difficulty: "foundation",
      answerType: "classification",
      format: "square_roots",
      classificationCategories: [
        { id: "correct", label: "Correct match" },
        { id: "incorrect", label: "Not a correct match" },
      ],
      classificationItems: [
        {
          id: "sqrt-121",
          label: "121 and sqrt(121) = 11",
          correctCategoryId: "correct",
        },
        {
          id: "sqrt-81",
          label: "81 and sqrt(81) = 9/2",
          correctCategoryId: "incorrect",
        },
        {
          id: "sqrt-64",
          label: "64 and sqrt(64) = 6",
          correctCategoryId: "incorrect",
        },
        {
          id: "sqrt-144",
          label: "144 and sqrt(144) = 24",
          correctCategoryId: "incorrect",
        },
      ],
      expectedAnswer: "121 and sqrt(121) = 11",
      acceptableAnswers: ["121 and sqrt(121) = 11"],
      markingGuide:
        "Award full credit for the pair 121 and sqrt(121) = 11. The other options confuse the square root with halving or another incorrect value.",
      workedSolution:
        "11 x 11 = 121, so sqrt(121) = 11. The square root of a perfect square is the number that multiplies by itself to make that square.",
      misconceptionTargets: [
        "square-root-perfect-square-confusion",
        "repeated-multiplication-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-perfect-squares-and-square-roots",
        ifCorrectGoToStepKey: "estimate-non-perfect-square-roots",
        practiceRecommendation:
          "Practise checking square-root pairs by multiplying the proposed root by itself.",
        diagnosticNote:
          "This item checks whether the learner can move both ways between a perfect square and its square root.",
      },
      visualSupport: { type: "table", description: "Compare each square number with the value claimed to be its root." },
    },
    {
      id: "powers-roots-exponent-form-003",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "apply-exponent-notation",
      title: "Write repeated multiplication in exponent form",
      prompt: "Complete the exponent form for 6 x 6 x 6 x 6.",
      difficulty: "foundation",
      answerType: "fill_gap",
      format: "exponent_notation",
      gapText: "6 x 6 x 6 x 6 = 6^__",
      gapAnswer: "4",
      gapAcceptableAnswers: ["4"],
      expectedAnswer: "6^4",
      acceptableAnswers: ["6^4"],
      markingGuide:
        "Award full credit for 6^4. The base is 6 and the exponent counts how many equal factors of 6 are multiplied.",
      workedSolution:
        "There are four equal factors of 6, so the repeated multiplication is written as 6^4.",
      misconceptionTargets: [
        "exponent-notation-confusion",
        "repeated-multiplication-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "apply-exponent-notation",
        ifCorrectGoToStepKey: "represent-natural-numbers-as-products-of-powers",
        practiceRecommendation:
          "Practise identifying the repeated factor as the base and the number of factors as the exponent.",
        diagnosticNote:
          "This item checks whether the learner can translate repeated multiplication into exponential form.",
      },
      visualSupport: {
        type: "table",
        description: "Match the repeated factors to the correct base and exponent.",
      },
    },
    {
      id: "powers-roots-estimate-root-004",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "estimate-non-perfect-square-roots",
      title: "Estimate a square root between consecutive integers",
      prompt:
        "Put these square-root values in increasing order: sqrt(49), sqrt(36), sqrt(41).",
      difficulty: "developing",
      answerType: "ordering",
      format: "square_roots",
      orderingItems: ["sqrt(49)", "sqrt(36)", "sqrt(41)"],
      correctOrder: ["sqrt(36)", "sqrt(41)", "sqrt(49)"],
      expectedAnswer: "6 and 7",
      acceptableAnswers: [
        "6 and 7",
        "between 6 and 7",
        "6, 7",
        "6 to 7",
      ],
      markingGuide:
        "Award full credit for any response showing that sqrt(41) lies between 6 and 7.",
      workedSolution:
        "6^2 = 36 and 7^2 = 49. Since 41 is between 36 and 49, sqrt(41) lies between 6 and 7.",
      misconceptionTargets: ["square-root-estimation-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "estimate-non-perfect-square-roots",
        ifCorrectGoToStepKey: "connect-perfect-squares-and-square-roots",
        practiceRecommendation:
          "Practise comparing the number under the square root with nearby perfect squares before estimating its size.",
        diagnosticNote:
          "This item checks whether the learner can bracket a non-perfect square root using consecutive perfect squares.",
      },
      visualSupport: {
        type: "number_line",
        description: "Use nearby square numbers to place sqrt(41) between whole numbers.",
      },
    },
    {
      id: "powers-roots-powers-of-ten-005",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-powers-of-ten-in-expanded-notation",
      title: "Interpret expanded notation with powers of 10",
      prompt:
        "Match each powers-of-10 term with its place-value contribution.",
      difficulty: "developing",
      answerType: "matching",
      format: "powers_of_ten",
      matchingPairs: [
        { prompt: "4 x 10^3", correctMatch: "4000" },
        { prompt: "7 x 10^1", correctMatch: "70" },
        { prompt: "2", correctMatch: "2" },
      ],
      expectedAnswer: "4072",
      acceptableAnswers: ["4072"],
      markingGuide:
        "Award full credit for 4072. The terms represent 4000, 70, and 2.",
      workedSolution:
        "4 x 10^3 = 4000, 7 x 10^1 = 70, and 2 = 2. Adding them gives 4072.",
      misconceptionTargets: [
        "powers-of-ten-place-value-error",
        "base-vs-exponent-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-powers-of-ten-in-expanded-notation",
        ifCorrectGoToStepKey: "apply-exponent-notation",
        practiceRecommendation:
          "Practise linking each power of 10 term to its place-value contribution before combining the terms.",
        diagnosticNote:
          "This item checks whether the learner can read a number written in expanded notation with powers of 10.",
      },
      visualSupport: {
        type: "table",
        description: "Connect each power of 10 term to its place-value part.",
      },
    },
    {
      id: "powers-roots-prime-powers-006",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "represent-natural-numbers-as-products-of-powers",
      title: "Represent a number using prime powers",
      prompt: "Write 72 as a product of prime powers.",
      difficulty: "developing",
      answerType: "short_symbolic",
      format: "prime_factorisation",
      expectedAnswer: "2^3 x 3^2",
      acceptableAnswers: ["2^3 x 3^2", "3^2 x 2^3"],
      markingGuide:
        "Award full credit for 2^3 x 3^2 or the factors in the reverse order. The factorisation must use prime bases and exponents.",
      workedSolution:
        "72 = 2 x 2 x 2 x 3 x 3, so written as a product of prime powers it is 2^3 x 3^2.",
      misconceptionTargets: [
        "prime-factorisation-exponent-error",
        "exponent-notation-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "represent-natural-numbers-as-products-of-powers",
        ifCorrectGoToStepKey:
          "apply-exponent-laws-with-positive-integer-exponents",
        practiceRecommendation:
          "Practise counting repeated prime factors carefully and recording that count as the exponent.",
        diagnosticNote:
          "This item checks whether the learner can compress repeated prime factors into exponent form accurately.",
      },
      visualSupport: {
        type: "context_card",
        description: "Group repeated prime factors before writing the exponent form.",
      },
    },
    {
      id: "powers-roots-factor-tree-007",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "represent-natural-numbers-as-products-of-powers",
      title: "Interpret a prime factorisation from a factor tree",
      prompt:
        "A factor tree for 180 ends with prime factors 2, 2, 3, 3, and 5. Which working correctly writes 180 as a product of prime powers?",
      difficulty: "developing",
      answerType: "select_correct_working",
      format: "prime_factorisation",
      structuredOptions: [
        {
          id: "group-repeated-primes",
          label: "2 x 2 x 3 x 3 x 5 = 2^2 x 3^2 x 5",
        },
        {
          id: "multiply-all-primes",
          label: "2 x 2 x 3 x 3 x 5 = 2^4 x 5",
        },
        {
          id: "count-distinct-primes",
          label: "2 x 2 x 3 x 3 x 5 = 2 x 3 x 5",
        },
        {
          id: "use-composite-bases",
          label: "2 x 2 x 3 x 3 x 5 = 4^2 x 9 x 5",
        },
      ],
      correctWorkingOptionId: "group-repeated-primes",
      expectedAnswer: "2^2 x 3^2 x 5",
      acceptableAnswers: [
        "2^2 x 3^2 x 5",
        "3^2 x 2^2 x 5",
        "5 x 2^2 x 3^2",
      ],
      markingGuide:
        "Award full credit for 2^2 x 3^2 x 5 or an equivalent order. The repeated prime factors should be grouped with exponents.",
      workedSolution:
        "The prime factors are 2 x 2 x 3 x 3 x 5, so 180 = 2^2 x 3^2 x 5.",
      misconceptionTargets: [
        "prime-factorisation-exponent-error",
        "repeated-multiplication-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "represent-natural-numbers-as-products-of-powers",
        ifCorrectGoToStepKey:
          "apply-exponent-laws-with-positive-integer-exponents",
        practiceRecommendation:
          "Practise turning repeated prime factors from a factor tree into a compact exponent form.",
        diagnosticNote:
          "This item checks whether the learner can read the endpoint of a factor tree and rewrite the result using exponents.",
      },
      visualSupport: {
        type: "context_card",
        description: "Group the repeated prime factors shown at the end of the factor tree.",
      },
    },
    {
      id: "powers-roots-multiply-law-008",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "apply-exponent-laws-with-positive-integer-exponents",
      title: "Apply the multiplication law for exponents",
      prompt: "Simplify 5^3 x 5^4.",
      difficulty: "secure",
      answerType: "short_answer",
      format: "exponent_laws",
      expectedAnswer: "5^7",
      acceptableAnswers: ["5^7"],
      markingGuide:
        "Award full credit for 5^7. The base stays the same and the exponents are added.",
      workedSolution:
        "When multiplying powers with the same base, add the exponents. So 5^3 x 5^4 = 5^(3+4) = 5^7.",
      misconceptionTargets: [
        "exponent-law-multiplication-error",
        "base-vs-exponent-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "apply-exponent-laws-with-positive-integer-exponents",
        ifCorrectGoToStepKey:
          "apply-exponent-laws-with-positive-integer-exponents",
        practiceRecommendation:
          "Practise expanding powers into repeated multiplication, then regrouping them to see why the exponents add.",
        diagnosticNote:
          "This item checks whether the learner applies the multiplication law for powers with the same base correctly.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "powers-roots-division-law-009",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "apply-exponent-laws-with-positive-integer-exponents",
      title: "Apply the division law for exponents",
      prompt: "Select every expression equivalent to 8^6 / 8^2.",
      difficulty: "secure",
      answerType: "multi_select",
      format: "exponent_laws",
      structuredOptions: [
        { id: "eight-four", label: "8^4" },
        { id: "four-eights", label: "8 x 8 x 8 x 8" },
        { id: "eight-eight", label: "8^8" },
        { id: "four-eight", label: "4^8" },
      ],
      correctOptionIds: ["eight-four", "four-eights"],
      expectedAnswer: "8^4",
      acceptableAnswers: ["8^4"],
      markingGuide:
        "Award full credit for 8^4. The base stays the same and the exponents are subtracted.",
      workedSolution:
        "When dividing powers with the same base, subtract the exponents. So 8^6 / 8^2 = 8^(6-2) = 8^4.",
      misconceptionTargets: [
        "exponent-law-division-error",
        "base-vs-exponent-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "apply-exponent-laws-with-positive-integer-exponents",
        ifCorrectGoToStepKey:
          "apply-exponent-laws-with-positive-integer-exponents",
        practiceRecommendation:
          "Practise cancelling common factors in repeated multiplication to see why the exponents subtract in a quotient.",
        diagnosticNote:
          "This item checks whether the learner applies the division law for powers with the same base correctly.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "powers-roots-base-exponent-010",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "apply-exponent-notation",
      title: "Identify a base and exponent misconception",
      prompt: "Which explanation of 3^5 is correct?",
      difficulty: "secure",
      answerType: "multiple_choice",
      format: "reasoning",
      options: [
        "It means 3 x 5.",
        "It means 5 groups of 3 multiplied: 3 x 3 x 3 x 3 x 3.",
        "It means 3 + 3 + 3 + 3 + 3.",
        "It means 5 x 5 x 5.",
      ],
      expectedAnswer:
        "It means 5 groups of 3 multiplied: 3 x 3 x 3 x 3 x 3.",
      acceptableAnswers: [
        "It means 5 groups of 3 multiplied: 3 x 3 x 3 x 3 x 3.",
      ],
      markingGuide:
        "Award full credit for identifying that 3 is the base and 5 counts the number of repeated factors.",
      workedSolution:
        "In 3^5, the base is 3 and the exponent 5 tells us to multiply five factors of 3 together.",
      misconceptionTargets: [
        "base-vs-exponent-confusion",
        "exponent-notation-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "apply-exponent-notation",
        ifCorrectGoToStepKey:
          "apply-exponent-laws-with-positive-integer-exponents",
        practiceRecommendation:
          "Practise naming the base and exponent separately, then expanding the expression into repeated multiplication.",
        diagnosticNote:
          "This item checks whether the learner distinguishes the role of the base from the role of the exponent.",
      },
      visualSupport: {
        type: "table",
        description: "Compare different interpretations of 3^5 and decide which one matches repeated multiplication.",
      },
    },
    {
      id: "powers-roots-zero-exponent-011",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "apply-exponent-laws-with-positive-integer-exponents",
      title: "Explain the meaning of a zero exponent",
      prompt: "Which explanation best justifies why 9^0 = 1?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "reasoning",
      structuredOptions: [
        {
          id: "quotient-law",
          label:
            "9^3 / 9^3 is 1, and the exponent law also gives 9^(3-3) = 9^0, so 9^0 = 1.",
        },
        {
          id: "zero-means-zero",
          label: "The exponent is zero, so the whole value must be zero.",
        },
        {
          id: "base-minus-exponent",
          label: "Subtract the exponent from the base: 9 - 0 = 9.",
        },
        {
          id: "memorised-only",
          label: "It is 1 only because zero exponents are always written that way.",
        },
      ],
      bestExplanationOptionId: "quotient-law",
      expectedAnswer:
        "9^0 = 1 because dividing 9^1 by 9 leaves 9^0, and the value goes from 9 to 1.",
      acceptableAnswers: [
        "9^0 = 1 because each time the exponent decreases by 1 for the same base, the value is divided by 9, so 9^1 = 9 and 9^0 = 1.",
        "9^0 = 1 because the exponent laws show that dividing like bases subtracts exponents, so 9^3 / 9^3 = 9^0 = 1.",
      ],
      markingGuide:
        "Award full credit for explaining that equal powers divided by themselves give 1 and that exponent patterns lead to a zero exponent value of 1.",
      workedSolution:
        "Using exponent laws, 9^3 / 9^3 = 9^(3-3) = 9^0. But any non-zero number divided by itself is 1, so 9^0 = 1.",
      misconceptionTargets: [
        "zero-exponent-confusion",
        "exponent-law-division-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "apply-exponent-laws-with-positive-integer-exponents",
        practiceRecommendation:
          "Practise following exponent patterns downward and using equal-power quotients to justify why a zero exponent gives 1.",
        diagnosticNote:
          "This item checks whether the learner understands zero exponents through pattern or exponent-law reasoning rather than memorising a rule only.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "powers-roots-efficiency-012",
      progressionBandKey: NUMBER_POWERS_ROOTS_PROGRESSION_BAND_KEY,
      progressionStepKey: "apply-exponent-notation",
      title: "Explain why exponent notation is efficient",
      prompt:
        "True or false: 5^4 is just a shorter way to write 5 x 4. If false, choose the correction.",
      difficulty: "extension",
      answerType: "true_false_correction",
      format: "reasoning",
      trueFalseStatement: "5^4 is just a shorter way to write 5 x 4.",
      correctBoolean: false,
      correctionOptions: [
        "5^4 means four factors of 5 multiplied: 5 x 5 x 5 x 5.",
        "5^4 means five factors of 4 multiplied: 4 x 4 x 4 x 4 x 4.",
        "5^4 means 5 + 5 + 5 + 5.",
      ],
      correctCorrection:
        "5^4 means four factors of 5 multiplied: 5 x 5 x 5 x 5.",
      expectedAnswer:
        "Exponent notation is more efficient because it shows the repeated factor and how many times it is used in a shorter, clearer form.",
      acceptableAnswers: [
        "It is shorter and shows the repeated factor and the number of times it appears.",
        "5^4 is more efficient because it records four factors of 5 in a compact way.",
      ],
      markingGuide:
        "Award full credit for explaining that exponent notation is shorter and communicates the repeated factor structure clearly.",
      workedSolution:
        "5^4 is efficient because it keeps the repeated multiplication structure but writes it in a compact form. The base 5 tells us which factor repeats and the exponent 4 tells us how many times it repeats.",
      misconceptionTargets: [
        "exponent-notation-confusion",
        "base-vs-exponent-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "apply-exponent-notation",
        practiceRecommendation:
          "Practise comparing repeated multiplication strings with their exponent forms and saying what the base and exponent each mean.",
        diagnosticNote:
          "This item checks whether the learner understands exponent notation as a structural shortcut, not just a symbol to memorise.",
      },
      visualSupport: {
        type: "table",
        description: "Compare the long repeated multiplication with its compact exponent form.",
      },
    },
  ];

export function getNumberPowersRootsAssessmentItemById(id: string) {
  return NUMBER_POWERS_ROOTS_ASSESSMENT_ITEMS.find((item) => item.id === id) || null;
}

export function getNumberPowersRootsAssessmentItemsByStep(
  stepKey: NumberPowersRootsProgressionStepKey,
) {
  return NUMBER_POWERS_ROOTS_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberPowersRootsAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_POWERS_ROOTS_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}
