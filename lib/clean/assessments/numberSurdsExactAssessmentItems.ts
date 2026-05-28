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

export type NumberSurdsExactProgressionBandKey = Extract<
  NumberProgressionBandKey,
  "surds-and-exact-form"
>;

export type NumberSurdsExactProgressionStepKey =
  | "write-fractional-powers-in-surd-form"
  | "evaluate-fractional-powers"
  | "simplify-surds"
  | "multiply-surds"
  | "add-and-subtract-like-surds"
  | "simplify-expressions-containing-multiple-surds"
  | "rationalise-denominators";

export type NumberSurdsExactAssessmentFormat =
  | "fractional_powers"
  | "surd_equivalence"
  | "surd_simplification"
  | "surd_operations"
  | "multi_step_surd_reasoning"
  | "rationalising"
  | "exact_form_reasoning";

export type NumberSurdsExactMisconceptionCode =
  | "fractional-index-to-surd-confusion"
  | "fractional-power-evaluation-error"
  | "non-perfect-square-factor-error"
  | "surd-simplification-factor-error"
  | "like-surd-combination-error"
  | "unlike-surd-combination-error"
  | "surd-multiplication-error"
  | "rationalising-denominator-error"
  | "exact-form-vs-decimal-error"
  | "coefficient-surd-distribution-error";

export type NumberSurdsExactAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberSurdsExactProgressionStepKey;
  ifCorrectGoToStepKey?: NumberSurdsExactProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberSurdsExactAssessmentItem = {
  id: string;
  progressionBandKey: NumberSurdsExactProgressionBandKey;
  progressionStepKey: NumberSurdsExactProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberSurdsExactAssessmentFormat;
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
  misconceptionTargets: NumberSurdsExactMisconceptionCode[];
  adaptiveRoute: NumberSurdsExactAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY: NumberSurdsExactProgressionBandKey =
  "surds-and-exact-form";

export const NUMBER_SURDS_EXACT_ITEM_BANK_KEY =
  "number-surds-exact-assessment-items-v1";

export const NUMBER_SURDS_EXACT_ASSESSMENT_ITEMS: NumberSurdsExactAssessmentItem[] =
  [
    {
      id: "surds-exact-fractional-form-001",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "write-fractional-powers-in-surd-form",
      subElementKey: "surd-notation-and-fractional-powers",
      subElementTitle: "Surd notation and fractional powers",
      subElementDescription: "Connect fractional powers and surd notation.",
      title: "Write a fractional power in surd form",
      prompt: "Complete the equivalent surd form.",
      difficulty: "foundation",
      answerType: "fill_gap",
      format: "fractional_powers",
      gapText: "13^(1/2) = __",
      gapAnswer: "sqrt(13)",
      gapAcceptableAnswers: ["sqrt 13", "sqrt(13)"],
      expectedAnswer: "sqrt(13)",
      acceptableAnswers: ["sqrt(13)"],
      markingGuide:
        "Award full credit for sqrt(13). A power of 1/2 means take the square root.",
      workedSolution:
        "An exponent of 1/2 means square root, so 13^(1/2) = sqrt(13).",
      misconceptionTargets: ["fractional-index-to-surd-confusion"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "write-fractional-powers-in-surd-form",
        ifCorrectGoToStepKey: "evaluate-fractional-powers",
        practiceRecommendation:
          "Practise matching common fractional indices such as 1/2 with their equivalent radical forms.",
        diagnosticNote:
          "This item checks whether the learner can translate a simple fractional index into square-root notation.",
      },
      visualSupport: {
        type: "table",
        description:
          "Compare the fractional index with the radical notation it represents.",
      },
    },
    {
      id: "surds-exact-evaluate-power-002",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "evaluate-fractional-powers",
      subElementKey: "surd-notation-and-fractional-powers",
      subElementTitle: "Surd notation and fractional powers",
      subElementDescription: "Connect fractional powers and surd notation.",
      title: "Evaluate a fractional power",
      prompt: "Evaluate 27^(2/3).",
      difficulty: "foundation",
      answerType: "numeric",
      format: "fractional_powers",
      expectedAnswer: "9",
      acceptableAnswers: ["9"],
      markingGuide:
        "Award full credit for 9. The cube root of 27 is 3, and then 3^2 = 9.",
      workedSolution:
        "27^(2/3) means take the cube root first and then square the result. The cube root of 27 is 3, so 27^(2/3) = 3^2 = 9.",
      misconceptionTargets: [
        "fractional-power-evaluation-error",
        "fractional-index-to-surd-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "evaluate-fractional-powers",
        ifCorrectGoToStepKey: "simplify-surds",
        practiceRecommendation:
          "Practise reading the denominator of the fractional index as the root and the numerator as the power.",
        diagnosticNote:
          "This item checks whether the learner applies the root and power in the correct order when evaluating a fractional power.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "surds-exact-equivalent-form-003",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "write-fractional-powers-in-surd-form",
      subElementKey: "surd-notation-and-fractional-powers",
      subElementTitle: "Surd notation and fractional powers",
      subElementDescription: "Connect fractional powers and surd notation.",
      title: "Identify an equivalent surd form",
      prompt: "Which expression is equivalent to 7^(3/2)?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "surd_equivalence",
      options: ["7sqrt(7)", "3sqrt(7)", "sqrt(21)", "7 + sqrt(7)"],
      expectedAnswer: "7sqrt(7)",
      acceptableAnswers: ["7sqrt(7)"],
      markingGuide:
        "Award full credit for 7sqrt(7). Since 7^(3/2) = 7 x 7^(1/2), it equals 7sqrt(7).",
      workedSolution:
        "7^(3/2) can be read as 7^1 x 7^(1/2), which is 7sqrt(7).",
      misconceptionTargets: [
        "fractional-index-to-surd-confusion",
        "fractional-power-evaluation-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "write-fractional-powers-in-surd-form",
        ifCorrectGoToStepKey: "evaluate-fractional-powers",
        practiceRecommendation:
          "Practise splitting a fractional power into an integer power and a root when the index is greater than 1/2.",
        diagnosticNote:
          "This item checks whether the learner can recognise an equivalent exact surd form for a fractional power.",
      },
      visualSupport: {
        type: "table",
        description:
          "Compare each option with the structure of 7^(3/2) before choosing.",
      },
    },
    {
      id: "surds-exact-simplify-root-004",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "simplify-surds",
      subElementKey: "surd-simplification",
      subElementTitle: "Surd simplification",
      subElementDescription:
        "Simplify surds using perfect-square factors.",
      title: "Simplify a surd using a square factor",
      prompt: "Simplify sqrt(72).",
      difficulty: "developing",
      answerType: "short_symbolic",
      format: "surd_simplification",
      expectedAnswer: "6sqrt(2)",
      acceptableAnswers: ["6sqrt(2)"],
      markingGuide:
        "Award full credit for 6sqrt(2). sqrt(72) = sqrt(36 x 2) = 6sqrt(2).",
      workedSolution:
        "Use the largest perfect-square factor of 72. Since 72 = 36 x 2, sqrt(72) = sqrt(36)sqrt(2) = 6sqrt(2).",
      misconceptionTargets: [
        "surd-simplification-factor-error",
        "non-perfect-square-factor-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "simplify-surds",
        ifCorrectGoToStepKey: "multiply-surds",
        practiceRecommendation:
          "Practise finding the largest perfect-square factor before rewriting the surd.",
        diagnosticNote:
          "This item checks whether the learner can factor a radicand and simplify it into exact surd form.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "surds-exact-coefficient-005",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "simplify-surds",
      subElementKey: "surd-simplification",
      subElementTitle: "Surd simplification",
      subElementDescription:
        "Simplify surds using perfect-square factors.",
      title: "Simplify a surd with a coefficient",
      prompt: "Select every expression equivalent to 2sqrt(45).",
      difficulty: "developing",
      answerType: "multi_select",
      format: "surd_simplification",
      structuredOptions: [
        { id: "six-root-five", label: "6sqrt(5)" },
        { id: "root-one-eighty", label: "sqrt(180)" },
        { id: "two-root-nine-five", label: "2sqrt(9 x 5)" },
        { id: "ten-root-three", label: "10sqrt(3)" },
      ],
      correctOptionIds: ["six-root-five", "root-one-eighty", "two-root-nine-five"],
      expectedAnswer: "6sqrt(5)",
      acceptableAnswers: ["6sqrt(5)"],
      markingGuide:
        "Award full credit for 6sqrt(5). sqrt(45) = 3sqrt(5), so 2sqrt(45) = 2 x 3sqrt(5) = 6sqrt(5).",
      workedSolution:
        "Start by simplifying the surd: sqrt(45) = sqrt(9 x 5) = 3sqrt(5). Then multiply by the outside coefficient: 2 x 3sqrt(5) = 6sqrt(5).",
      misconceptionTargets: [
        "coefficient-surd-distribution-error",
        "surd-simplification-factor-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "simplify-surds",
        ifCorrectGoToStepKey: "add-and-subtract-like-surds",
        practiceRecommendation:
          "Practise simplifying the surd first and then multiplying by any outside coefficient.",
        diagnosticNote:
          "This item checks whether the learner can keep the coefficient and the simplified surd structure organised correctly.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "surds-exact-multiply-006",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "multiply-surds",
      subElementKey: "surd-operations",
      subElementTitle: "Surd operations",
      subElementDescription: "Multiply, add and subtract surd expressions.",
      title: "Multiply two surds",
      prompt: "Simplify sqrt(6) x sqrt(24).",
      difficulty: "developing",
      answerType: "numeric",
      format: "surd_operations",
      expectedAnswer: "12",
      acceptableAnswers: ["12"],
      markingGuide:
        "Award full credit for 12. sqrt(6) x sqrt(24) = sqrt(144) = 12.",
      workedSolution:
        "Multiply the values under the radicals first: sqrt(6) x sqrt(24) = sqrt(144). Since sqrt(144) = 12, the product is 12.",
      misconceptionTargets: [
        "surd-multiplication-error",
        "surd-simplification-factor-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "multiply-surds",
        ifCorrectGoToStepKey: "rationalise-denominators",
        practiceRecommendation:
          "Practise multiplying the radicands first and then checking whether the result simplifies to a perfect square or simpler surd.",
        diagnosticNote:
          "This item checks whether the learner can multiply two surds and simplify the exact result correctly.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "surds-exact-add-like-007",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "add-and-subtract-like-surds",
      subElementKey: "surd-operations",
      subElementTitle: "Surd operations",
      subElementDescription: "Multiply, add and subtract surd expressions.",
      title: "Add and subtract like surds",
      prompt: "Classify each expression by whether it contains like surds.",
      difficulty: "developing",
      answerType: "classification",
      format: "surd_operations",
      classificationCategories: [
        { id: "like-surds", label: "Like surds" },
        { id: "unlike-surds", label: "Unlike surds" },
      ],
      classificationItems: [
        {
          id: "four-root-three-minus-root-three",
          label: "4sqrt(3) - sqrt(3)",
          correctCategoryId: "like-surds",
        },
        {
          id: "root-three-plus-root-five",
          label: "sqrt(3) + sqrt(5)",
          correctCategoryId: "unlike-surds",
        },
        {
          id: "root-eight-plus-root-eighteen",
          label: "sqrt(8) + sqrt(18)",
          correctCategoryId: "like-surds",
        },
      ],
      expectedAnswer: "3sqrt(3)",
      acceptableAnswers: ["3sqrt(3)"],
      markingGuide:
        "Award full credit for 3sqrt(3). Like surds combine by adding or subtracting their coefficients.",
      workedSolution:
        "Both terms involve sqrt(3), so they are like surds. Subtract the coefficients: 4sqrt(3) - 1sqrt(3) = 3sqrt(3).",
      misconceptionTargets: ["like-surd-combination-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "add-and-subtract-like-surds",
        ifCorrectGoToStepKey:
          "simplify-expressions-containing-multiple-surds",
        practiceRecommendation:
          "Practise spotting when the radical part is identical so only the coefficients need to be combined.",
        diagnosticNote:
          "This item checks whether the learner recognises and combines like surds in the same way as like terms.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "surds-exact-unlike-008",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "add-and-subtract-like-surds",
      subElementKey: "surd-operations",
      subElementTitle: "Surd operations",
      subElementDescription: "Multiply, add and subtract surd expressions.",
      title: "Recognise when surds are unlike",
      prompt:
        "True or false: sqrt(3) + sqrt(5) can be simplified to sqrt(8). If false, choose the correction.",
      difficulty: "secure",
      answerType: "true_false_correction",
      format: "surd_operations",
      trueFalseStatement: "sqrt(3) + sqrt(5) can be simplified to sqrt(8).",
      correctBoolean: false,
      correctionOptions: [
        "sqrt(3) and sqrt(5) are unlike surds, so they cannot be combined into one surd.",
        "All square roots can be added by adding the numbers under the roots.",
        "sqrt(3) + sqrt(5) equals 8.",
      ],
      correctCorrection:
        "sqrt(3) and sqrt(5) are unlike surds, so they cannot be combined into one surd.",
      expectedAnswer: "sqrt(3) + sqrt(5)",
      acceptableAnswers: ["sqrt(3) + sqrt(5)"],
      markingGuide:
        "Award full credit for sqrt(3) + sqrt(5). The other expressions simplify or combine into like surds.",
      workedSolution:
        "2sqrt(5) + 3sqrt(5) combines to 5sqrt(5). sqrt(8) + sqrt(18) becomes 2sqrt(2) + 3sqrt(2) = 5sqrt(2). sqrt(12) - sqrt(3) becomes 2sqrt(3) - sqrt(3) = sqrt(3). But sqrt(3) and sqrt(5) are unlike surds, so they cannot be combined into one like-surd term.",
      misconceptionTargets: [
        "unlike-surd-combination-error",
        "surd-simplification-factor-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "add-and-subtract-like-surds",
        ifCorrectGoToStepKey:
          "simplify-expressions-containing-multiple-surds",
        practiceRecommendation:
          "Practise simplifying each surd first and then deciding whether the radical parts match.",
        diagnosticNote:
          "This item checks whether the learner understands that unlike surds cannot be merged just because they are both square roots.",
      },
      visualSupport: {
        type: "table",
        description:
          "Simplify each option mentally first, then check which radical parts match.",
      },
    },
    {
      id: "surds-exact-multi-step-009",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "simplify-expressions-containing-multiple-surds",
      subElementKey: "surd-simplification",
      subElementTitle: "Surd simplification",
      subElementDescription:
        "Simplify surds using perfect-square factors.",
      title: "Simplify an expression with several surd terms",
      prompt:
        "Put these simplification steps in the correct order for sqrt(12) + sqrt(27) - sqrt(48).",
      difficulty: "secure",
      answerType: "ordering",
      format: "multi_step_surd_reasoning",
      orderingItems: [
        "Combine to get sqrt(3).",
        "Rewrite as 2sqrt(3) + 3sqrt(3) - 4sqrt(3).",
        "Simplify each surd using square factors.",
      ],
      correctOrder: [
        "Simplify each surd using square factors.",
        "Rewrite as 2sqrt(3) + 3sqrt(3) - 4sqrt(3).",
        "Combine to get sqrt(3).",
      ],
      expectedAnswer:
        "sqrt(12) = 2sqrt(3), sqrt(27) = 3sqrt(3), and sqrt(48) = 4sqrt(3), so the expression simplifies to sqrt(3).",
      acceptableAnswers: [
        "sqrt(3)",
        "2sqrt(3) + 3sqrt(3) - 4sqrt(3) = sqrt(3)",
      ],
      markingGuide:
        "Award full credit for correctly simplifying each surd and combining the like terms to reach sqrt(3).",
      workedSolution:
        "Rewrite each surd first: sqrt(12) = 2sqrt(3), sqrt(27) = 3sqrt(3), and sqrt(48) = 4sqrt(3). Then combine the like terms: 2sqrt(3) + 3sqrt(3) - 4sqrt(3) = sqrt(3).",
      misconceptionTargets: [
        "like-surd-combination-error",
        "surd-simplification-factor-error",
        "coefficient-surd-distribution-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "simplify-expressions-containing-multiple-surds",
        ifCorrectGoToStepKey: "rationalise-denominators",
        practiceRecommendation:
          "Practise rewriting every surd into its simplest exact form before combining the terms.",
        diagnosticNote:
          "This item checks whether the learner can carry out a multi-step surd simplification without losing structure or signs.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "surds-exact-rationalise-simple-010",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "rationalise-denominators",
      subElementKey: "rationalising-denominators-and-exact-form",
      subElementTitle: "Rationalising denominators and exact form",
      subElementDescription:
        "Rationalise denominators and explain exact form.",
      title: "Rationalise a simple denominator",
      prompt: "Match each expression with its equivalent rationalised or unrationalised form.",
      difficulty: "secure",
      answerType: "matching",
      format: "rationalising",
      matchingPairs: [
        { prompt: "5 / sqrt(2)", correctMatch: "5sqrt(2) / 2" },
        { prompt: "3 / sqrt(5)", correctMatch: "3sqrt(5) / 5" },
        { prompt: "sqrt(7) / 7", correctMatch: "1 / sqrt(7)" },
      ],
      expectedAnswer: "5sqrt(2) / 2",
      acceptableAnswers: ["5sqrt(2) / 2", "(5sqrt(2)) / 2", "5sqrt(2)/2"],
      markingGuide:
        "Award full credit for any equivalent form of 5sqrt(2) / 2. The denominator should no longer contain a surd.",
      workedSolution:
        "Multiply the numerator and denominator by sqrt(2): 5 / sqrt(2) x sqrt(2) / sqrt(2) = 5sqrt(2) / 2.",
      misconceptionTargets: [
        "rationalising-denominator-error",
        "surd-multiplication-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "rationalise-denominators",
        ifCorrectGoToStepKey: "rationalise-denominators",
        practiceRecommendation:
          "Practise multiplying the numerator and denominator by the same surd so the denominator becomes rational.",
        diagnosticNote:
          "This item checks whether the learner can use an equivalent fraction to remove a simple radical from the denominator.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "surds-exact-rationalise-binomial-011",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "rationalise-denominators",
      subElementKey: "rationalising-denominators-and-exact-form",
      subElementTitle: "Rationalising denominators and exact form",
      subElementDescription:
        "Rationalise denominators and explain exact form.",
      title: "Rationalise a denominator using a conjugate",
      prompt:
        "Which working correctly rationalises 6 / (1 + sqrt(5))?",
      difficulty: "extension",
      answerType: "select_correct_working",
      format: "rationalising",
      structuredOptions: [
        {
          id: "use-conjugate",
          label:
            "Multiply by (1 - sqrt(5)) / (1 - sqrt(5)); the denominator becomes 1 - 5, giving an equivalent form with no surd in the denominator.",
        },
        {
          id: "multiply-root-five",
          label:
            "Multiply by sqrt(5) / sqrt(5); the denominator becomes sqrt(5) + 5, so it is rationalised.",
        },
        {
          id: "add-conjugate",
          label:
            "Add (1 - sqrt(5)) to the denominator only so the surd cancels.",
        },
        {
          id: "square-denominator",
          label:
            "Square only the denominator to remove the square root and leave the numerator unchanged.",
        },
      ],
      correctWorkingOptionId: "use-conjugate",
      expectedAnswer:
        "Multiply by (1 - sqrt(5)) / (1 - sqrt(5)) to get 6(1 - sqrt(5)) / (1 - 5), which simplifies to 3(sqrt(5) - 1) / 2.",
      acceptableAnswers: [
        "3(sqrt(5) - 1) / 2",
        "(3sqrt(5) - 3) / 2",
        "(3sqrt(5)-3)/2",
      ],
      markingGuide:
        "Award full credit for an equivalent rationalised form such as 3(sqrt(5) - 1) / 2. The learner should use the conjugate and reach an equivalent exact expression with no surd left in the denominator.",
      workedSolution:
        "Use the conjugate of the denominator: 6 / (1 + sqrt(5)) x (1 - sqrt(5)) / (1 - sqrt(5)) = 6(1 - sqrt(5)) / (1 - 5). The denominator becomes -4, so the expression simplifies to 6(sqrt(5) - 1) / 4 = 3(sqrt(5) - 1) / 2.",
      misconceptionTargets: [
        "rationalising-denominator-error",
        "coefficient-surd-distribution-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "rationalise-denominators",
        practiceRecommendation:
          "Practise identifying the conjugate and expanding the denominator carefully so the middle terms cancel.",
        diagnosticNote:
          "This item checks whether the learner can rationalise a binomial surd denominator while preserving exact form.",
      },
      visualSupport: { type: "none" },
    },
    {
      id: "surds-exact-why-exact-012",
      progressionBandKey: NUMBER_SURDS_EXACT_PROGRESSION_BAND_KEY,
      progressionStepKey: "simplify-surds",
      subElementKey: "rationalising-denominators-and-exact-form",
      subElementTitle: "Rationalising denominators and exact form",
      subElementDescription:
        "Rationalise denominators and explain exact form.",
      title: "Explain why exact surd form can be preferable",
      prompt:
        "A calculator gives sqrt(50) as about 7.071. Which explanation best describes why keeping 5sqrt(2) can be better than rounding too early?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "exact_form_reasoning",
      structuredOptions: [
        {
          id: "preserve-precision",
          label:
            "5sqrt(2) keeps the exact value, while 7.071 is rounded and can introduce error into later calculations.",
        },
        {
          id: "decimal-always-exact",
          label:
            "7.071 is better because all decimals are exact and surds are only estimates.",
        },
        {
          id: "surd-not-number",
          label:
            "5sqrt(2) is better because it is not a number until it is converted to a decimal.",
        },
        {
          id: "rounding-removes-units",
          label:
            "Rounding is only a problem when the units disappear from the answer.",
        },
      ],
      bestExplanationOptionId: "preserve-precision",
      expectedAnswer:
        "Exact surd form keeps the full value without rounding, so it avoids early approximation error and is often better for later exact calculations.",
      acceptableAnswers: [
        "Exact form keeps the full value and avoids rounding error in later work.",
        "Keeping 5sqrt(2) is better when exact values matter because rounding too early can change later answers.",
      ],
      markingGuide:
        "Award full credit for explaining that exact form preserves precision and avoids rounding errors that can affect later calculations.",
      workedSolution:
        "sqrt(50) simplifies to 5sqrt(2), which is exact. Writing 7.071 is only an approximation. Exact form is often better because later calculations can stay precise, and rounding can be delayed until the context actually requires an estimate.",
      misconceptionTargets: [
        "exact-form-vs-decimal-error",
        "surd-simplification-factor-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "simplify-surds",
        practiceRecommendation:
          "Practise comparing exact surd forms with rounded decimals and deciding when an approximation is actually needed.",
        diagnosticNote:
          "This item checks whether the learner understands the value of keeping an irrational result in exact form rather than rounding too early.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Consider what information is kept in 5sqrt(2) that is lost once the value is rounded.",
      },
    },
  ];

export function getNumberSurdsExactAssessmentItemById(id: string) {
  return NUMBER_SURDS_EXACT_ASSESSMENT_ITEMS.find((item) => item.id === id) || null;
}

export function getNumberSurdsExactAssessmentItemsByStep(
  stepKey: NumberSurdsExactProgressionStepKey,
) {
  return NUMBER_SURDS_EXACT_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberSurdsExactAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_SURDS_EXACT_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}
