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

export type NumberPatternsEarlyAlgebraProgressionBandKey =
  "number-patterns-and-early-algebraic-thinking";

export type NumberPatternsEarlyAlgebraProgressionStepKey =
  | "continue-and-describe-number-sequences"
  | "identify-growing-and-shrinking-patterns"
  | "use-input-output-rules-and-tables"
  | "solve-missing-number-and-simple-equations";

export type NumberPatternsEarlyAlgebraAssessmentFormat =
  | "skip_counting_sequence"
  | "sequence_rule"
  | "sequence_membership"
  | "growing_pattern"
  | "shrinking_pattern"
  | "pattern_rule_explanation"
  | "input_output_table"
  | "rule_table_matching"
  | "apply_rule_working"
  | "missing_number_equation"
  | "balanced_number_statements"
  | "inverse_equation_context";

export type NumberPatternsEarlyAlgebraMisconceptionCode =
  | "skip-counting-step-error"
  | "sequence-rule-confusion"
  | "pattern-continuation-error"
  | "growing-pattern-rate-error"
  | "shrinking-pattern-direction-error"
  | "input-output-rule-error"
  | "table-pattern-confusion"
  | "missing-number-equation-error"
  | "equality-balance-confusion"
  | "inverse-operation-gap"
  | "operation-choice-pattern-error"
  | "term-position-confusion";

export type NumberPatternsEarlyAlgebraAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberPatternsEarlyAlgebraProgressionStepKey;
  ifCorrectGoToStepKey?: NumberPatternsEarlyAlgebraProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberPatternsEarlyAlgebraAssessmentItem = {
  id: string;
  progressionBandKey: NumberPatternsEarlyAlgebraProgressionBandKey;
  progressionStepKey: NumberPatternsEarlyAlgebraProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberPatternsEarlyAlgebraAssessmentFormat;
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
  misconceptionTargets: NumberPatternsEarlyAlgebraMisconceptionCode[];
  adaptiveRoute: NumberPatternsEarlyAlgebraAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_PATTERNS_EARLY_ALGEBRA_ITEM_BANK_KEY =
  "number-patterns-early-algebra-assessment-items-v1";

export const NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY: NumberPatternsEarlyAlgebraProgressionBandKey =
  "number-patterns-and-early-algebraic-thinking";

export const NUMBER_PATTERNS_EARLY_ALGEBRA_ASSESSMENT_ITEMS: NumberPatternsEarlyAlgebraAssessmentItem[] =
  [
    {
      id: "patterns-early-algebra-skip-counting-001",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "continue-and-describe-number-sequences",
      subElementKey: "skip-counting-and-number-sequences",
      subElementTitle: "Skip-counting and number sequences",
      subElementDescription:
        "Continue and interpret number sequences using skip-counting and repeated changes.",
      title: "Continue a skip-counting sequence",
      prompt: "Continue the sequence: 8, 12, 16, 20, __.",
      difficulty: "foundation",
      answerType: "numeric",
      format: "skip_counting_sequence",
      expectedAnswer: "24",
      acceptableAnswers: ["24"],
      markingGuide:
        "Award full credit for 24. The sequence increases by 4 each time.",
      workedSolution:
        "Each term increases by 4: 8, 12, 16, 20, 24.",
      misconceptionTargets: ["skip-counting-step-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "continue-and-describe-number-sequences",
        ifCorrectGoToStepKey: "continue-and-describe-number-sequences",
        practiceRecommendation:
          "Practise marking equal jumps on a number line before continuing skip-counting sequences.",
        diagnosticNote:
          "This item checks whether the learner can notice and continue a constant skip-counting step.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a number line with equal jumps of 4 from 8 to 24.",
      },
    },
    {
      id: "patterns-early-algebra-sequence-rule-002",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "continue-and-describe-number-sequences",
      subElementKey: "skip-counting-and-number-sequences",
      subElementTitle: "Skip-counting and number sequences",
      subElementDescription:
        "Continue and interpret number sequences using skip-counting and repeated changes.",
      title: "Identify a sequence rule",
      prompt: "What rule describes the sequence 45, 40, 35, 30?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "sequence_rule",
      options: [
        "Subtract 5 each time",
        "Add 5 each time",
        "Subtract 10 each time",
        "Add 10 each time",
      ],
      expectedAnswer: "Subtract 5 each time",
      acceptableAnswers: ["Subtract 5 each time", "-5"],
      markingGuide:
        "Award full credit for identifying that the sequence decreases by 5 each time.",
      workedSolution:
        "45 to 40 is -5, 40 to 35 is -5, and 35 to 30 is -5. The rule is subtract 5 each time.",
      misconceptionTargets: [
        "sequence-rule-confusion",
        "shrinking-pattern-direction-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "continue-and-describe-number-sequences",
        ifCorrectGoToStepKey: "identify-growing-and-shrinking-patterns",
        practiceRecommendation:
          "Practise comparing each term with the next term and naming whether the sequence increases or decreases.",
        diagnosticNote:
          "This item checks whether the learner can identify both the size and direction of the repeated change.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use backward jumps of 5 on a number line from 45 to 30.",
      },
    },
    {
      id: "patterns-early-algebra-sequence-membership-003",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "continue-and-describe-number-sequences",
      subElementKey: "skip-counting-and-number-sequences",
      subElementTitle: "Skip-counting and number sequences",
      subElementDescription:
        "Continue and interpret number sequences using skip-counting and repeated changes.",
      title: "Choose terms in a sequence",
      prompt:
        "The sequence starts at 6 and adds 6 each time. Select every number that belongs in the sequence.",
      difficulty: "foundation",
      answerType: "multi_select",
      format: "sequence_membership",
      structuredOptions: [
        { id: "twelve", label: "12" },
        { id: "eighteen", label: "18" },
        { id: "twenty", label: "20" },
        { id: "twenty-four", label: "24" },
        { id: "thirty-one", label: "31" },
      ],
      correctOptionIds: ["twelve", "eighteen", "twenty-four"],
      expectedAnswer: "12, 18 and 24",
      acceptableAnswers: ["12, 18 and 24", "12,18,24"],
      markingGuide:
        "Award full credit for selecting exactly 12, 18 and 24.",
      workedSolution:
        "Starting from 6 and adding 6 gives 6, 12, 18, 24, 30. So 12, 18 and 24 belong.",
      misconceptionTargets: [
        "skip-counting-step-error",
        "sequence-rule-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "continue-and-describe-number-sequences",
        ifCorrectGoToStepKey: "identify-growing-and-shrinking-patterns",
        practiceRecommendation:
          "Practise generating several terms before deciding whether a number belongs in a sequence.",
        diagnosticNote:
          "This item checks whether the learner can apply a sequence rule to identify matching terms.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use equal jumps of 6 to mark the terms in the sequence.",
      },
    },
    {
      id: "patterns-early-algebra-growing-gap-004",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-growing-and-shrinking-patterns",
      subElementKey: "growing-and-shrinking-patterns",
      subElementTitle: "Growing and shrinking patterns",
      subElementDescription:
        "Identify, continue and describe increasing and decreasing number patterns.",
      title: "Continue a growing pattern",
      prompt:
        "A pattern starts with 3 tiles and grows by 4 tiles each step. Complete the next step.",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "growing_pattern",
      gapText: "3, 7, 11, 15, __",
      gapAnswer: "19",
      gapAcceptableAnswers: ["19"],
      expectedAnswer: "19",
      acceptableAnswers: ["19"],
      markingGuide:
        "Award full credit for 19. The pattern increases by 4 each step.",
      workedSolution:
        "Each step adds 4 tiles: 3, 7, 11, 15, 19.",
      misconceptionTargets: [
        "growing-pattern-rate-error",
        "pattern-continuation-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-growing-and-shrinking-patterns",
        ifCorrectGoToStepKey: "identify-growing-and-shrinking-patterns",
        practiceRecommendation:
          "Practise recording the change between each step in a growing pattern table.",
        diagnosticNote:
          "This item checks whether the learner continues a growing pattern using the repeated change.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a growing tile pattern card showing 4 more tiles added each step.",
      },
    },
    {
      id: "patterns-early-algebra-shrinking-correction-005",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-growing-and-shrinking-patterns",
      subElementKey: "growing-and-shrinking-patterns",
      subElementTitle: "Growing and shrinking patterns",
      subElementDescription:
        "Identify, continue and describe increasing and decreasing number patterns.",
      title: "Correct a shrinking pattern",
      prompt:
        "True or false: 52, 46, 40, 34 continues with 40 because the numbers are going up by 6. If false, choose the correction.",
      difficulty: "developing",
      answerType: "true_false_correction",
      format: "shrinking_pattern",
      trueFalseStatement:
        "52, 46, 40, 34 continues with 40 because the numbers are going up by 6.",
      correctBoolean: false,
      correctionOptions: [
        "The pattern decreases by 6, so the next term is 28.",
        "The pattern increases by 6, so the next term is 40.",
        "The pattern changes by 4, so the next term is 30.",
      ],
      correctCorrection: "The pattern decreases by 6, so the next term is 28.",
      expectedAnswer: "28",
      acceptableAnswers: ["28"],
      markingGuide:
        "Award full credit for identifying the statement as false and choosing 28 as the next term.",
      workedSolution:
        "Each term decreases by 6: 52, 46, 40, 34, 28.",
      misconceptionTargets: [
        "shrinking-pattern-direction-error",
        "pattern-continuation-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-growing-and-shrinking-patterns",
        ifCorrectGoToStepKey: "identify-growing-and-shrinking-patterns",
        practiceRecommendation:
          "Practise labelling a pattern as increasing or decreasing before continuing it.",
        diagnosticNote:
          "This item checks whether the learner attends to the direction of change in a shrinking pattern.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use backward jumps of 6 on a number line from 52 to 28.",
      },
    },
    {
      id: "patterns-early-algebra-rule-explanation-006",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-growing-and-shrinking-patterns",
      subElementKey: "growing-and-shrinking-patterns",
      subElementTitle: "Growing and shrinking patterns",
      subElementDescription:
        "Identify, continue and describe increasing and decreasing number patterns.",
      title: "Explain a pattern rule",
      prompt:
        "A pattern has terms 5, 9, 13, 17. Which explanation best describes the rule?",
      difficulty: "developing",
      answerType: "choose_best_explanation",
      format: "pattern_rule_explanation",
      structuredOptions: [
        {
          id: "add-four",
          label: "Each term increases by 4, so the next term is found by adding 4.",
        },
        {
          id: "add-position",
          label: "Each term increases by its position number.",
        },
        {
          id: "odd-only",
          label: "The rule is only that every term is odd, so any odd number can come next.",
        },
        {
          id: "multiply-four",
          label: "Each term is multiplied by 4.",
        },
      ],
      bestExplanationOptionId: "add-four",
      expectedAnswer:
        "Each term increases by 4, so the next term is found by adding 4.",
      acceptableAnswers: [
        "Each term increases by 4, so the next term is found by adding 4.",
      ],
      markingGuide:
        "Award full credit for choosing the explanation that names the constant change of +4.",
      workedSolution:
        "5 to 9 is +4, 9 to 13 is +4, and 13 to 17 is +4. The rule is add 4 each time.",
      misconceptionTargets: [
        "sequence-rule-confusion",
        "term-position-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-growing-and-shrinking-patterns",
        ifCorrectGoToStepKey: "use-input-output-rules-and-tables",
        practiceRecommendation:
          "Practise explaining a rule using the repeated change between neighbouring terms.",
        diagnosticNote:
          "This item checks whether the learner can describe the structure of a growing number pattern.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a pattern table with terms and the change between terms.",
      },
    },
    {
      id: "patterns-early-algebra-input-output-table-007",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-input-output-rules-and-tables",
      subElementKey: "input-output-rules-and-tables",
      subElementTitle: "Input-output rules and tables",
      subElementDescription:
        "Use simple rules and tables to connect inputs and outputs.",
      title: "Complete an input-output table",
      prompt:
        "The rule is output = input x 3. Complete the missing output for input 7.",
      difficulty: "developing",
      answerType: "numeric",
      format: "input_output_table",
      expectedAnswer: "21",
      acceptableAnswers: ["21"],
      markingGuide:
        "Award full credit for 21.",
      workedSolution:
        "Apply the rule to the input: 7 x 3 = 21.",
      misconceptionTargets: [
        "input-output-rule-error",
        "table-pattern-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-input-output-rules-and-tables",
        ifCorrectGoToStepKey: "use-input-output-rules-and-tables",
        practiceRecommendation:
          "Practise applying the same rule to each input in a table.",
        diagnosticNote:
          "This item checks whether the learner can use an input-output rule to calculate an output.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use an input-output table with the rule multiply by 3.",
      },
    },
    {
      id: "patterns-early-algebra-rule-table-match-008",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-input-output-rules-and-tables",
      subElementKey: "input-output-rules-and-tables",
      subElementTitle: "Input-output rules and tables",
      subElementDescription:
        "Use simple rules and tables to connect inputs and outputs.",
      title: "Match rules to tables",
      prompt: "Match each input-output table to its rule.",
      difficulty: "secure",
      answerType: "matching",
      format: "rule_table_matching",
      matchingPairs: [
        { prompt: "1 -> 6, 2 -> 7, 3 -> 8", correctMatch: "Add 5" },
        { prompt: "2 -> 4, 4 -> 8, 6 -> 12", correctMatch: "Multiply by 2" },
        { prompt: "10 -> 7, 9 -> 6, 8 -> 5", correctMatch: "Subtract 3" },
      ],
      expectedAnswer:
        "1 -> 6, 2 -> 7, 3 -> 8 = Add 5; 2 -> 4, 4 -> 8, 6 -> 12 = Multiply by 2; 10 -> 7, 9 -> 6, 8 -> 5 = Subtract 3",
      acceptableAnswers: [
        "1 -> 6, 2 -> 7, 3 -> 8 = Add 5; 2 -> 4, 4 -> 8, 6 -> 12 = Multiply by 2; 10 -> 7, 9 -> 6, 8 -> 5 = Subtract 3",
      ],
      markingGuide:
        "Award full credit for matching all three tables to their rules.",
      workedSolution:
        "Compare each input with its output. The first table adds 5, the second doubles, and the third subtracts 3.",
      misconceptionTargets: [
        "input-output-rule-error",
        "table-pattern-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-input-output-rules-and-tables",
        ifCorrectGoToStepKey: "solve-missing-number-and-simple-equations",
        practiceRecommendation:
          "Practise comparing input and output pairs to decide which rule works for every row.",
        diagnosticNote:
          "This item checks whether the learner can infer a rule from matching input-output pairs.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use three input-output tables and test one rule across every row.",
      },
    },
    {
      id: "patterns-early-algebra-apply-rule-working-009",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-input-output-rules-and-tables",
      subElementKey: "input-output-rules-and-tables",
      subElementTitle: "Input-output rules and tables",
      subElementDescription:
        "Use simple rules and tables to connect inputs and outputs.",
      title: "Select correct rule working",
      prompt:
        "A table uses the rule output = input + 12. Which working correctly finds the output for input 18?",
      difficulty: "secure",
      answerType: "select_correct_working",
      format: "apply_rule_working",
      structuredOptions: [
        {
          id: "add-twelve",
          label: "18 + 12 = 30, so the output is 30.",
        },
        {
          id: "subtract-twelve",
          label: "18 - 12 = 6, so the output is 6.",
        },
        {
          id: "multiply-twelve",
          label: "18 x 12 = 216, so the output is 216.",
        },
        {
          id: "use-output-as-input",
          label: "12 + 12 = 24, so the output is 24.",
        },
      ],
      correctWorkingOptionId: "add-twelve",
      expectedAnswer: "30",
      acceptableAnswers: ["30"],
      markingGuide:
        "Award full credit for selecting 18 + 12 = 30.",
      workedSolution:
        "The rule says add 12 to the input. For input 18, calculate 18 + 12 = 30.",
      misconceptionTargets: [
        "input-output-rule-error",
        "operation-choice-pattern-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-input-output-rules-and-tables",
        ifCorrectGoToStepKey: "solve-missing-number-and-simple-equations",
        practiceRecommendation:
          "Practise reading the operation in a rule before applying it to the input.",
        diagnosticNote:
          "This item checks whether the learner can choose correct working for a given input-output rule.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a table row showing input 18 and the rule add 12.",
      },
    },
    {
      id: "patterns-early-algebra-missing-equation-010",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-missing-number-and-simple-equations",
      subElementKey: "missing-numbers-and-simple-equations",
      subElementTitle: "Missing numbers and simple equations",
      subElementDescription:
        "Solve missing-number statements and simple equations using number relationships.",
      title: "Solve a missing-number equation",
      prompt: "Complete the equation: __ + 27 = 65.",
      difficulty: "secure",
      answerType: "short_symbolic",
      format: "missing_number_equation",
      expectedAnswer: "38",
      acceptableAnswers: ["38"],
      markingGuide:
        "Award full credit for 38.",
      workedSolution:
        "Use inverse thinking: 65 - 27 = 38. Check: 38 + 27 = 65.",
      misconceptionTargets: [
        "missing-number-equation-error",
        "inverse-operation-gap",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-missing-number-and-simple-equations",
        ifCorrectGoToStepKey: "solve-missing-number-and-simple-equations",
        practiceRecommendation:
          "Practise using inverse operations to find missing values in equations.",
        diagnosticNote:
          "This item checks whether the learner can solve a missing addend using the relationship between addition and subtraction.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a simple equation or balance card showing a missing addend.",
      },
    },
    {
      id: "patterns-early-algebra-balance-classification-011",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-missing-number-and-simple-equations",
      subElementKey: "missing-numbers-and-simple-equations",
      subElementTitle: "Missing numbers and simple equations",
      subElementDescription:
        "Solve missing-number statements and simple equations using number relationships.",
      title: "Classify balanced number statements",
      prompt: "Classify each number statement as balanced or unbalanced.",
      difficulty: "extension",
      answerType: "classification",
      format: "balanced_number_statements",
      classificationCategories: [
        { id: "balanced", label: "Balanced" },
        { id: "unbalanced", label: "Unbalanced" },
      ],
      classificationItems: [
        { id: "twelve-plus-eight", label: "12 + 8 = 10 + 10", correctCategoryId: "balanced" },
        { id: "thirty-minus-six", label: "30 - 6 = 20 + 5", correctCategoryId: "unbalanced" },
        { id: "seven-times-three", label: "7 x 3 = 18 + 3", correctCategoryId: "balanced" },
      ],
      expectedAnswer:
        "12 + 8 = 10 + 10 is balanced; 30 - 6 = 20 + 5 is unbalanced; 7 x 3 = 18 + 3 is balanced.",
      acceptableAnswers: [
        "12 + 8 = 10 + 10 is balanced; 30 - 6 = 20 + 5 is unbalanced; 7 x 3 = 18 + 3 is balanced.",
      ],
      markingGuide:
        "Award full credit for classifying all three statements correctly.",
      workedSolution:
        "A statement is balanced when both sides have the same value. 20 = 20, 24 is not 25, and 21 = 21.",
      misconceptionTargets: [
        "equality-balance-confusion",
        "missing-number-equation-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-missing-number-and-simple-equations",
        ifCorrectGoToStepKey: "solve-missing-number-and-simple-equations",
        practiceRecommendation:
          "Practise checking both sides of an equals sign before deciding whether a statement is true.",
        diagnosticNote:
          "This item checks whether the learner understands the equals sign as a balance between two values.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a balance-style context card to compare the value on each side.",
      },
    },
    {
      id: "patterns-early-algebra-inverse-context-012",
      progressionBandKey: NUMBER_PATTERNS_EARLY_ALGEBRA_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-missing-number-and-simple-equations",
      subElementKey: "missing-numbers-and-simple-equations",
      subElementTitle: "Missing numbers and simple equations",
      subElementDescription:
        "Solve missing-number statements and simple equations using number relationships.",
      title: "Solve with inverse thinking",
      prompt:
        "A number is multiplied by 4 to make 36. Which explanation best finds the missing number?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "inverse_equation_context",
      structuredOptions: [
        {
          id: "divide-by-four",
          label: "Use the inverse operation: 36 / 4 = 9, so the missing number is 9.",
        },
        {
          id: "add-four",
          label: "Use 36 + 4 = 40, so the missing number is 40.",
        },
        {
          id: "subtract-four",
          label: "Use 36 - 4 = 32, so the missing number is 32.",
        },
        {
          id: "multiply-again",
          label: "Use 36 x 4 = 144, so the missing number is 144.",
        },
      ],
      bestExplanationOptionId: "divide-by-four",
      expectedAnswer:
        "Use the inverse operation: 36 / 4 = 9, so the missing number is 9.",
      acceptableAnswers: [
        "Use the inverse operation: 36 / 4 = 9, so the missing number is 9.",
        "9",
      ],
      markingGuide:
        "Award full credit for using division as the inverse of multiplication and finding 9.",
      workedSolution:
        "If a missing number times 4 equals 36, divide 36 by 4 to undo the multiplication. The missing number is 9.",
      misconceptionTargets: [
        "inverse-operation-gap",
        "operation-choice-pattern-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-missing-number-and-simple-equations",
        ifCorrectGoToStepKey: "solve-missing-number-and-simple-equations",
        practiceRecommendation:
          "Practise undoing operations to solve simple equations and checking the result in the original statement.",
        diagnosticNote:
          "This item checks whether the learner can use inverse thinking to solve a simple multiplication equation.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a simple equation card showing an unknown value multiplied by 4 equals 36.",
      },
    },
  ];

export function getNumberPatternsEarlyAlgebraAssessmentItemById(id: string) {
  return (
    NUMBER_PATTERNS_EARLY_ALGEBRA_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberPatternsEarlyAlgebraAssessmentItemsByStep(
  stepKey: NumberPatternsEarlyAlgebraProgressionStepKey,
) {
  return NUMBER_PATTERNS_EARLY_ALGEBRA_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberPatternsEarlyAlgebraAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_PATTERNS_EARLY_ALGEBRA_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberPatternsEarlyAlgebraAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_PATTERNS_EARLY_ALGEBRA_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
