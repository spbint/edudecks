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

export type NumberMultiplicationDivisionFluencyProgressionBandKey =
  "multiplication-division-fluency";

export type NumberMultiplicationDivisionFluencyProgressionStepKey =
  | "recall-and-represent-multiplication-facts"
  | "connect-division-facts-and-equal-groups"
  | "use-fact-families-and-inverse-relationships"
  | "solve-multiplicative-context-problems";

export type NumberMultiplicationDivisionFluencyAssessmentFormat =
  | "array_multiplication"
  | "equal_groups_multiplication"
  | "multiplication_fact_fluency"
  | "division_sharing"
  | "division_grouping"
  | "division_related_fact"
  | "fact_family_completion"
  | "missing_factor_or_quotient"
  | "inverse_relationship_working"
  | "operation_context_classification"
  | "multiplicative_context_problem"
  | "multiplication_division_reasoning";

export type NumberMultiplicationDivisionFluencyMisconceptionCode =
  | "array-row-column-confusion"
  | "equal-groups-multiplication-confusion"
  | "multiplication-as-addition-only-error"
  | "division-sharing-grouping-confusion"
  | "division-remainder-context-error"
  | "multiplication-division-inverse-confusion"
  | "fact-family-relationship-error"
  | "missing-factor-error"
  | "multiplication-context-error"
  | "division-context-error"
  | "operation-choice-error"
  | "times-table-fluency-gap";

export type NumberMultiplicationDivisionFluencyAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberMultiplicationDivisionFluencyProgressionStepKey;
  ifCorrectGoToStepKey?: NumberMultiplicationDivisionFluencyProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberMultiplicationDivisionFluencyAssessmentItem = {
  id: string;
  progressionBandKey: NumberMultiplicationDivisionFluencyProgressionBandKey;
  progressionStepKey: NumberMultiplicationDivisionFluencyProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberMultiplicationDivisionFluencyAssessmentFormat;
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
  misconceptionTargets: NumberMultiplicationDivisionFluencyMisconceptionCode[];
  adaptiveRoute: NumberMultiplicationDivisionFluencyAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY =
  "number-multiplication-division-fluency-assessment-items-v1";

export const NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY: NumberMultiplicationDivisionFluencyProgressionBandKey =
  "multiplication-division-fluency";

export const NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ASSESSMENT_ITEMS: NumberMultiplicationDivisionFluencyAssessmentItem[] =
  [
    {
      id: "multiplication-division-fluency-array-001",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "recall-and-represent-multiplication-facts",
      subElementKey: "multiplication-facts-and-arrays",
      subElementTitle: "Multiplication facts and arrays",
      subElementDescription:
        "Connect multiplication facts with arrays, equal rows and repeated addition.",
      title: "Identify multiplication from an array",
      prompt:
        "An array has 4 equal rows with 6 counters in each row. Which multiplication fact matches the array?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "array_multiplication",
      options: ["4 x 6 = 24", "4 + 6 = 10", "6 - 4 = 2", "24 / 4 = 4"],
      expectedAnswer: "4 x 6 = 24",
      acceptableAnswers: ["4 x 6 = 24", "6 x 4 = 24", "24"],
      markingGuide:
        "Award full credit for selecting 4 x 6 = 24 or an equivalent multiplication fact.",
      workedSolution:
        "There are 4 rows and each row has 6 counters. That is 4 groups of 6, so 4 x 6 = 24.",
      misconceptionTargets: [
        "array-row-column-confusion",
        "equal-groups-multiplication-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recall-and-represent-multiplication-facts",
        ifCorrectGoToStepKey: "connect-division-facts-and-equal-groups",
        practiceRecommendation:
          "Practise reading arrays as equal rows and writing the matching multiplication fact.",
        diagnosticNote:
          "This item checks whether the learner connects rows and columns in an array to a multiplication fact.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use an array with 4 rows and 6 counters in each row.",
      },
    },
    {
      id: "multiplication-division-fluency-equal-groups-002",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "recall-and-represent-multiplication-facts",
      subElementKey: "multiplication-facts-and-arrays",
      subElementTitle: "Multiplication facts and arrays",
      subElementDescription:
        "Connect multiplication facts with arrays, equal rows and repeated addition.",
      title: "Match equal groups to equations",
      prompt: "Match each equal-groups description to its equation.",
      difficulty: "foundation",
      answerType: "matching",
      format: "equal_groups_multiplication",
      matchingPairs: [
        { prompt: "3 groups of 5", correctMatch: "3 x 5 = 15" },
        { prompt: "6 groups of 4", correctMatch: "6 x 4 = 24" },
        { prompt: "2 groups of 9", correctMatch: "2 x 9 = 18" },
      ],
      expectedAnswer:
        "3 groups of 5 = 3 x 5 = 15; 6 groups of 4 = 6 x 4 = 24; 2 groups of 9 = 2 x 9 = 18",
      acceptableAnswers: [
        "3 groups of 5 = 3 x 5 = 15; 6 groups of 4 = 6 x 4 = 24; 2 groups of 9 = 2 x 9 = 18",
      ],
      markingGuide:
        "Award full credit for matching all three equal-groups descriptions to the correct multiplication equations.",
      workedSolution:
        "The first number tells how many groups there are. The second number tells how many are in each group.",
      misconceptionTargets: [
        "equal-groups-multiplication-confusion",
        "multiplication-as-addition-only-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recall-and-represent-multiplication-facts",
        ifCorrectGoToStepKey: "connect-division-facts-and-equal-groups",
        practiceRecommendation:
          "Practise saying multiplication facts as groups of equal size.",
        diagnosticNote:
          "This item checks whether the learner links equal groups to the structure of multiplication.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use equal-group pictures for 3 groups of 5, 6 groups of 4 and 2 groups of 9.",
      },
    },
    {
      id: "multiplication-division-fluency-fact-003",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "recall-and-represent-multiplication-facts",
      subElementKey: "multiplication-facts-and-arrays",
      subElementTitle: "Multiplication facts and arrays",
      subElementDescription:
        "Connect multiplication facts with arrays, equal rows and repeated addition.",
      title: "Use a multiplication fact",
      prompt:
        "Order the skip-counting sequence for 8s to show 7 x 8.",
      difficulty: "foundation",
      answerType: "ordering",
      format: "multiplication_fact_fluency",
      orderingItems: ["8", "24", "56", "16", "40", "32", "48"],
      correctOrder: ["8", "16", "24", "32", "40", "48", "56"],
      expectedAnswer: "8, 16, 24, 32, 40, 48, 56",
      acceptableAnswers: [
        "8, 16, 24, 32, 40, 48, 56",
        "8 16 24 32 40 48 56",
      ],
      markingGuide:
        "Award full credit for ordering all seven multiples of 8 correctly through 56.",
      workedSolution:
        "Count by 8s seven times: 8, 16, 24, 32, 40, 48, 56. So 7 x 8 = 56.",
      misconceptionTargets: [
        "times-table-fluency-gap",
        "equal-groups-multiplication-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recall-and-represent-multiplication-facts",
        ifCorrectGoToStepKey: "connect-division-facts-and-equal-groups",
        practiceRecommendation:
          "Practise fluent recall of 7s and 8s facts using arrays, skip counting and known related facts.",
        diagnosticNote:
          "This item checks whether the learner can recall and apply a familiar multiplication fact.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use skip-counting jumps of 8 to reach 56 if the fact is not yet automatic.",
      },
    },
    {
      id: "multiplication-division-fluency-sharing-004",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-division-facts-and-equal-groups",
      subElementKey: "division-facts-and-equal-groups",
      subElementTitle: "Division facts and equal groups",
      subElementDescription:
        "Connect division facts with sharing, grouping and inverse multiplication.",
      title: "Interpret division as sharing",
      prompt:
        "24 counters are shared equally between 6 learners. How many counters does each learner get?",
      difficulty: "developing",
      answerType: "numeric",
      format: "division_sharing",
      expectedAnswer: "4",
      acceptableAnswers: ["4"],
      markingGuide:
        "Award full credit for 4 counters.",
      workedSolution:
        "24 shared equally between 6 means 24 / 6. Since 6 x 4 = 24, each learner gets 4 counters.",
      misconceptionTargets: [
        "division-sharing-grouping-confusion",
        "multiplication-division-inverse-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-division-facts-and-equal-groups",
        ifCorrectGoToStepKey: "use-fact-families-and-inverse-relationships",
        practiceRecommendation:
          "Practise sharing a total into equal groups and checking with the related multiplication fact.",
        diagnosticNote:
          "This item checks whether the learner interprets division as equal sharing.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Show 24 counters shared into 6 equal groups.",
      },
    },
    {
      id: "multiplication-division-fluency-grouping-005",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-division-facts-and-equal-groups",
      subElementKey: "division-facts-and-equal-groups",
      subElementTitle: "Division facts and equal groups",
      subElementDescription:
        "Connect division facts with sharing, grouping and inverse multiplication.",
      title: "Interpret division as grouping",
      prompt:
        "There are 35 pencils. Each cup holds 5 pencils. How many cups are needed?",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "division_grouping",
      gapText: "35 pencils grouped in 5s makes __ groups.",
      gapAnswer: "7",
      gapAcceptableAnswers: ["7"],
      expectedAnswer: "7",
      acceptableAnswers: ["7"],
      markingGuide:
        "Award full credit for 7 cups or groups.",
      workedSolution:
        "This asks how many groups of 5 are in 35. Since 7 x 5 = 35, there are 7 groups.",
      misconceptionTargets: [
        "division-sharing-grouping-confusion",
        "division-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-division-facts-and-equal-groups",
        ifCorrectGoToStepKey: "use-fact-families-and-inverse-relationships",
        practiceRecommendation:
          "Practise grouping totals into equal-size groups and naming the matching division sentence.",
        diagnosticNote:
          "This item checks whether the learner can interpret division as grouping, not only sharing.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Show 35 pencils placed into cups with 5 pencils in each cup.",
      },
    },
    {
      id: "multiplication-division-fluency-related-fact-006",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "connect-division-facts-and-equal-groups",
      subElementKey: "division-facts-and-equal-groups",
      subElementTitle: "Division facts and equal groups",
      subElementDescription:
        "Connect division facts with sharing, grouping and inverse multiplication.",
      title: "Connect division to multiplication",
      prompt:
        "True or false: 24 / 6 = 6 because 24 and 6 are both in the six times table. If false, choose the correction.",
      difficulty: "developing",
      answerType: "true_false_correction",
      format: "division_related_fact",
      trueFalseStatement:
        "24 / 6 = 6 because 24 and 6 are both in the six times table.",
      correctBoolean: false,
      correctionOptions: [
        "24 / 6 = 4 because 6 x 4 = 24.",
        "24 / 6 = 6 because 6 x 6 = 24.",
        "24 / 6 = 18 because 24 - 6 = 18.",
      ],
      correctCorrection: "24 / 6 = 4 because 6 x 4 = 24.",
      expectedAnswer: "24 / 6 = 4",
      acceptableAnswers: ["24 / 6 = 4", "4"],
      markingGuide:
        "Award full credit for identifying the statement as false and choosing the correction linked to 6 x 4 = 24.",
      workedSolution:
        "A division fact is checked by multiplication. The number that multiplies by 6 to make 24 is 4, so 24 / 6 = 4.",
      misconceptionTargets: [
        "multiplication-division-inverse-confusion",
        "fact-family-relationship-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "connect-division-facts-and-equal-groups",
        ifCorrectGoToStepKey: "use-fact-families-and-inverse-relationships",
        practiceRecommendation:
          "Practise checking division facts by asking which multiplication fact makes the total.",
        diagnosticNote:
          "This item checks whether the learner uses inverse multiplication to check division rather than noticing only a times-table pattern.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a fact table showing 6 x 4 = 24 and 24 / 6 = 4.",
      },
    },
    {
      id: "multiplication-division-fluency-fact-family-007",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-fact-families-and-inverse-relationships",
      subElementKey: "fact-families-and-inverse-relationships",
      subElementTitle: "Fact families and inverse relationships",
      subElementDescription:
        "Use related multiplication and division facts to solve missing-value problems.",
      title: "Select a full fact family",
      prompt: "Select every equation that belongs to the fact family for 6, 7 and 42.",
      difficulty: "developing",
      answerType: "multi_select",
      format: "fact_family_completion",
      structuredOptions: [
        { id: "six-times-seven", label: "6 x 7 = 42" },
        { id: "seven-times-six", label: "7 x 6 = 42" },
        { id: "forty-two-div-six", label: "42 / 6 = 7" },
        { id: "forty-two-div-seven", label: "42 / 7 = 6" },
        { id: "forty-two-div-six-equals-six", label: "42 / 6 = 6" },
      ],
      correctOptionIds: [
        "six-times-seven",
        "seven-times-six",
        "forty-two-div-six",
        "forty-two-div-seven",
      ],
      expectedAnswer:
        "6 x 7 = 42; 7 x 6 = 42; 42 / 6 = 7; 42 / 7 = 6",
      acceptableAnswers: [
        "6 x 7 = 42; 7 x 6 = 42; 42 / 6 = 7; 42 / 7 = 6",
      ],
      markingGuide:
        "Award full credit for selecting exactly the two multiplication and two division facts in the 6, 7, 42 family.",
      workedSolution:
        "The same three numbers make four related facts: 6 x 7 = 42, 7 x 6 = 42, 42 / 6 = 7 and 42 / 7 = 6.",
      misconceptionTargets: [
        "fact-family-relationship-error",
        "multiplication-division-inverse-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-fact-families-and-inverse-relationships",
        ifCorrectGoToStepKey: "solve-multiplicative-context-problems",
        practiceRecommendation:
          "Practise building complete fact families from one array or one set of three related numbers.",
        diagnosticNote:
          "This item checks whether the learner can connect multiplication and division facts in the same fact family.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a fact-family table with the numbers 6, 7 and 42.",
      },
    },
    {
      id: "multiplication-division-fluency-missing-value-008",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-fact-families-and-inverse-relationships",
      subElementKey: "fact-families-and-inverse-relationships",
      subElementTitle: "Fact families and inverse relationships",
      subElementDescription:
        "Use related multiplication and division facts to solve missing-value problems.",
      title: "Fill a missing factor",
      prompt: "Complete the number sentence: __ x 9 = 63.",
      difficulty: "secure",
      answerType: "short_symbolic",
      format: "missing_factor_or_quotient",
      expectedAnswer: "7",
      acceptableAnswers: ["7"],
      markingGuide:
        "Award full credit for 7.",
      workedSolution:
        "Use the related division fact: 63 / 9 = 7. So the missing factor is 7.",
      misconceptionTargets: [
        "missing-factor-error",
        "times-table-fluency-gap",
        "multiplication-division-inverse-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-fact-families-and-inverse-relationships",
        ifCorrectGoToStepKey: "solve-multiplicative-context-problems",
        practiceRecommendation:
          "Practise using division to find missing factors in multiplication equations.",
        diagnosticNote:
          "This item checks whether the learner can use inverse thinking to find a missing factor.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a fact-family table connecting 7 x 9 = 63 and 63 / 9 = 7.",
      },
    },
    {
      id: "multiplication-division-fluency-inverse-working-009",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-fact-families-and-inverse-relationships",
      subElementKey: "fact-families-and-inverse-relationships",
      subElementTitle: "Fact families and inverse relationships",
      subElementDescription:
        "Use related multiplication and division facts to solve missing-value problems.",
      title: "Choose correct inverse working",
      prompt: "Which working correctly solves 56 / 8?",
      difficulty: "secure",
      answerType: "select_correct_working",
      format: "inverse_relationship_working",
      structuredOptions: [
        {
          id: "related-multiplication",
          label: "Use 8 x 7 = 56, so 56 / 8 = 7.",
        },
        {
          id: "subtract-once",
          label: "Use 56 - 8 = 48, so 56 / 8 = 48.",
        },
        {
          id: "same-number",
          label: "Use 8 x 8 = 56, so 56 / 8 = 8.",
        },
        {
          id: "add-numbers",
          label: "Use 56 + 8 = 64, so 56 / 8 = 64.",
        },
      ],
      correctWorkingOptionId: "related-multiplication",
      expectedAnswer: "7",
      acceptableAnswers: ["7"],
      markingGuide:
        "Award full credit for selecting the working that uses 8 x 7 = 56.",
      workedSolution:
        "Division can be checked with multiplication. Since 8 x 7 = 56, 56 / 8 = 7.",
      misconceptionTargets: [
        "multiplication-division-inverse-confusion",
        "fact-family-relationship-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-fact-families-and-inverse-relationships",
        ifCorrectGoToStepKey: "solve-multiplicative-context-problems",
        practiceRecommendation:
          "Practise choosing the multiplication fact that checks a division calculation.",
        diagnosticNote:
          "This item checks whether the learner can choose correct inverse working for a division fact.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a related-facts table for 8, 7 and 56.",
      },
    },
    {
      id: "multiplication-division-fluency-context-classification-010",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-multiplicative-context-problems",
      subElementKey: "multiplicative-problem-solving",
      subElementTitle: "Multiplicative problem solving",
      subElementDescription:
        "Choose efficient multiplication or division strategies in simple contexts.",
      title: "Classify multiplication and division contexts",
      prompt: "Classify each context by the operation it needs.",
      difficulty: "secure",
      answerType: "classification",
      format: "operation_context_classification",
      classificationCategories: [
        { id: "multiplication", label: "Multiplication" },
        { id: "division-sharing", label: "Division: sharing" },
        { id: "division-grouping", label: "Division: grouping" },
      ],
      classificationItems: [
        {
          id: "five-bags-six",
          label: "5 bags with 6 apples in each bag",
          correctCategoryId: "multiplication",
        },
        {
          id: "share-forty-eight-six",
          label: "48 cards shared equally between 6 players",
          correctCategoryId: "division-sharing",
        },
        {
          id: "groups-of-four",
          label: "32 beads placed into groups of 4",
          correctCategoryId: "division-grouping",
        },
      ],
      expectedAnswer:
        "5 bags with 6 apples is multiplication; 48 cards shared between 6 players is division sharing; 32 beads in groups of 4 is division grouping.",
      acceptableAnswers: [
        "5 bags with 6 apples is multiplication; 48 cards shared between 6 players is division sharing; 32 beads in groups of 4 is division grouping.",
      ],
      markingGuide:
        "Award full credit for classifying all three contexts by operation and division meaning.",
      workedSolution:
        "Equal groups with a known number of groups and group size use multiplication. Sharing tells how many in each group. Grouping tells how many groups can be made.",
      misconceptionTargets: [
        "operation-choice-error",
        "multiplication-context-error",
        "division-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-multiplicative-context-problems",
        ifCorrectGoToStepKey: "solve-multiplicative-context-problems",
        practiceRecommendation:
          "Practise identifying whether a context asks for a total, a share size, or a number of groups.",
        diagnosticNote:
          "This item checks whether the learner can choose multiplication or division from the structure of a short context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use three context cards showing equal groups, sharing and grouping.",
      },
    },
    {
      id: "multiplication-division-fluency-context-problem-011",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-multiplicative-context-problems",
      subElementKey: "multiplicative-problem-solving",
      subElementTitle: "Multiplicative problem solving",
      subElementDescription:
        "Choose efficient multiplication or division strategies in simple contexts.",
      title: "Solve a short context problem",
      prompt:
        "A bookshelf has 8 shelves. Each shelf holds 9 books. How many books can the bookshelf hold altogether?",
      difficulty: "extension",
      answerType: "numeric",
      format: "multiplicative_context_problem",
      expectedAnswer: "72",
      acceptableAnswers: ["72"],
      markingGuide:
        "Award full credit for 72 books.",
      workedSolution:
        "There are 8 equal shelves with 9 books on each shelf. Use 8 x 9 = 72.",
      misconceptionTargets: [
        "multiplication-context-error",
        "times-table-fluency-gap",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-multiplicative-context-problems",
        ifCorrectGoToStepKey: "solve-multiplicative-context-problems",
        practiceRecommendation:
          "Practise identifying equal groups in context problems and writing the matching multiplication equation.",
        diagnosticNote:
          "This item checks whether the learner can choose and use multiplication in a practical equal-groups context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Show a bookshelf with 8 shelves and 9 books per shelf.",
      },
    },
    {
      id: "multiplication-division-fluency-best-explanation-012",
      progressionBandKey:
        NUMBER_MULTIPLICATION_DIVISION_FLUENCY_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-multiplicative-context-problems",
      subElementKey: "multiplicative-problem-solving",
      subElementTitle: "Multiplicative problem solving",
      subElementDescription:
        "Choose efficient multiplication or division strategies in simple contexts.",
      title: "Explain a multiplication misconception",
      prompt:
        "A learner says 6 groups of 4 is the same as 6 + 4 because both use 6 and 4. Which explanation is best?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "multiplication_division_reasoning",
      structuredOptions: [
        {
          id: "equal-groups",
          label: "6 groups of 4 means 4 + 4 + 4 + 4 + 4 + 4, which is 24. 6 + 4 is only 10.",
        },
        {
          id: "same-numbers",
          label: "They are the same because both use the numbers 6 and 4.",
        },
        {
          id: "always-add",
          label: "Groups always mean add the two numbers once.",
        },
        {
          id: "division-check",
          label: "6 groups of 4 means 6 / 4.",
        },
      ],
      bestExplanationOptionId: "equal-groups",
      expectedAnswer:
        "6 groups of 4 means 4 + 4 + 4 + 4 + 4 + 4, which is 24. 6 + 4 is only 10.",
      acceptableAnswers: [
        "6 groups of 4 means 4 + 4 + 4 + 4 + 4 + 4, which is 24. 6 + 4 is only 10.",
      ],
      markingGuide:
        "Award full credit for choosing the explanation that multiplication means repeated equal groups, not adding the two factors once.",
      workedSolution:
        "6 groups of 4 means six equal groups, each with 4. That is 6 x 4 = 24. The expression 6 + 4 combines two numbers once and equals 10.",
      misconceptionTargets: [
        "equal-groups-multiplication-confusion",
        "multiplication-as-addition-only-error",
        "operation-choice-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recall-and-represent-multiplication-facts",
        ifCorrectGoToStepKey: "solve-multiplicative-context-problems",
        practiceRecommendation:
          "Practise explaining multiplication as repeated equal groups and comparing it with ordinary addition.",
        diagnosticNote:
          "This item checks whether the learner can explain why multiplication is different from adding the two factors once.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Compare 6 equal groups of 4 with a single addition expression 6 + 4.",
      },
    },
  ];

export function getNumberMultiplicationDivisionFluencyAssessmentItemById(
  id: string,
) {
  return (
    NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberMultiplicationDivisionFluencyAssessmentItemsByStep(
  stepKey: NumberMultiplicationDivisionFluencyProgressionStepKey,
) {
  return NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberMultiplicationDivisionFluencyAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberMultiplicationDivisionFluencyAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
