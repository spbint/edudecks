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

export type NumberFractionsFoundationsProgressionBandKey =
  "fractions-foundations";

export type NumberFractionsFoundationsProgressionStepKey =
  | "represent-fractions-with-equal-parts"
  | "recognise-and-create-equivalent-fractions"
  | "compare-and-order-simple-fractions"
  | "use-fractions-in-sharing-and-measurement-contexts";

export type NumberFractionsFoundationsAssessmentFormat =
  | "equal_parts_fraction"
  | "numerator_denominator_meaning"
  | "fraction_number_line"
  | "equivalent_fraction_matching"
  | "equivalent_fraction_missing_value"
  | "equivalent_fraction_selection"
  | "same_denominator_comparison"
  | "same_numerator_comparison"
  | "benchmark_fraction_ordering"
  | "fraction_working_selection"
  | "fraction_sharing_context"
  | "fraction_context_classification";

export type NumberFractionsFoundationsMisconceptionCode =
  | "unequal-parts-fraction-error"
  | "numerator-denominator-role-confusion"
  | "denominator-as-size-confusion"
  | "fraction-number-line-placement-error"
  | "equivalent-fraction-scaling-error"
  | "same-denominator-comparison-error"
  | "same-numerator-comparison-error"
  | "benchmark-fraction-comparison-error"
  | "whole-number-thinking-with-fractions"
  | "fraction-sharing-context-error"
  | "fraction-greater-than-one-confusion"
  | "mixed-representation-confusion";

export type NumberFractionsFoundationsAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberFractionsFoundationsProgressionStepKey;
  ifCorrectGoToStepKey?: NumberFractionsFoundationsProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberFractionsFoundationsAssessmentItem = {
  id: string;
  progressionBandKey: NumberFractionsFoundationsProgressionBandKey;
  progressionStepKey: NumberFractionsFoundationsProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberFractionsFoundationsAssessmentFormat;
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
  misconceptionTargets: NumberFractionsFoundationsMisconceptionCode[];
  adaptiveRoute: NumberFractionsFoundationsAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY =
  "number-fractions-foundations-assessment-items-v1";

export const NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY: NumberFractionsFoundationsProgressionBandKey =
  "fractions-foundations";

export const NUMBER_FRACTIONS_FOUNDATIONS_ASSESSMENT_ITEMS: NumberFractionsFoundationsAssessmentItem[] =
  [
    {
      id: "fractions-foundations-equal-parts-001",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "represent-fractions-with-equal-parts",
      subElementKey: "fraction-meaning-and-representation",
      subElementTitle: "Fraction meaning and representation",
      subElementDescription:
        "Understand fractions as equal parts of a whole, collection or number line.",
      title: "Identify a fraction from equal parts",
      prompt:
        "A shape is split into 4 equal parts. 3 parts are shaded. What fraction is shaded?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "equal_parts_fraction",
      options: ["1/4", "3/4", "4/3", "3/7"],
      expectedAnswer: "3/4",
      acceptableAnswers: ["3/4"],
      markingGuide:
        "Award full credit for 3/4. The denominator is the 4 equal parts and the numerator is the 3 shaded parts.",
      workedSolution:
        "There are 4 equal parts altogether and 3 are shaded, so the shaded fraction is 3/4.",
      misconceptionTargets: [
        "unequal-parts-fraction-error",
        "numerator-denominator-role-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "represent-fractions-with-equal-parts",
        ifCorrectGoToStepKey: "recognise-and-create-equivalent-fractions",
        practiceRecommendation:
          "Practise naming the whole, counting equal parts, and then counting the selected parts.",
        diagnosticNote:
          "This item checks whether the learner understands that fractions depend on equal parts of a whole.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a simple area model with 3 of 4 equal parts shaded.",
      },
    },
    {
      id: "fractions-foundations-numerator-denominator-002",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "represent-fractions-with-equal-parts",
      subElementKey: "fraction-meaning-and-representation",
      subElementTitle: "Fraction meaning and representation",
      subElementDescription:
        "Understand fractions as equal parts of a whole, collection or number line.",
      title: "Match numerator and denominator meanings",
      prompt: "Match each fraction part to its meaning for 5/8.",
      difficulty: "foundation",
      answerType: "matching",
      format: "numerator_denominator_meaning",
      matchingPairs: [
        { prompt: "Numerator 5", correctMatch: "5 parts are selected or counted" },
        { prompt: "Denominator 8", correctMatch: "The whole is split into 8 equal parts" },
        { prompt: "Fraction 5/8", correctMatch: "5 of 8 equal parts" },
      ],
      expectedAnswer:
        "Numerator 5 = 5 parts selected; denominator 8 = 8 equal parts in the whole; 5/8 = 5 of 8 equal parts",
      acceptableAnswers: [
        "Numerator 5 = 5 parts selected; denominator 8 = 8 equal parts in the whole; 5/8 = 5 of 8 equal parts",
      ],
      markingGuide:
        "Award full credit for matching all three fraction parts to their meanings.",
      workedSolution:
        "The denominator tells how many equal parts make the whole. The numerator tells how many of those parts are selected.",
      misconceptionTargets: ["numerator-denominator-role-confusion"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "represent-fractions-with-equal-parts",
        ifCorrectGoToStepKey: "recognise-and-create-equivalent-fractions",
        practiceRecommendation:
          "Practise saying what the top and bottom numbers mean in a model before naming the fraction.",
        diagnosticNote:
          "This item checks whether the learner understands the roles of numerator and denominator.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a two-row table naming numerator and denominator meanings.",
      },
    },
    {
      id: "fractions-foundations-number-line-003",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "represent-fractions-with-equal-parts",
      subElementKey: "fraction-meaning-and-representation",
      subElementTitle: "Fraction meaning and representation",
      subElementDescription:
        "Understand fractions as equal parts of a whole, collection or number line.",
      title: "Place a simple fraction on a number line",
      prompt:
        "A number line from 0 to 1 is split into 4 equal spaces. What fraction is at the second tick after 0?",
      difficulty: "foundation",
      answerType: "short_symbolic",
      format: "fraction_number_line",
      expectedAnswer: "2/4",
      acceptableAnswers: ["2/4", "1/2"],
      markingGuide:
        "Award full credit for 2/4 or the equivalent fraction 1/2.",
      workedSolution:
        "Four equal spaces make fourths. The second tick after 0 is 2/4, which is the same as 1/2.",
      misconceptionTargets: [
        "fraction-number-line-placement-error",
        "equivalent-fraction-scaling-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "represent-fractions-with-equal-parts",
        ifCorrectGoToStepKey: "compare-and-order-simple-fractions",
        practiceRecommendation:
          "Practise partitioning the distance from 0 to 1 into equal spaces and counting the ticks from 0.",
        diagnosticNote:
          "This item checks whether the learner can treat fractions as positions on a number line, not only shaded parts.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a 0 to 1 number line partitioned into four equal spaces.",
      },
    },
    {
      id: "fractions-foundations-equivalent-match-004",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-and-create-equivalent-fractions",
      subElementKey: "equivalent-fractions",
      subElementTitle: "Equivalent fractions",
      subElementDescription:
        "Recognise and create fractions that represent the same value.",
      title: "Match equivalent fractions",
      prompt: "Match each fraction to an equivalent fraction.",
      difficulty: "developing",
      answerType: "matching",
      format: "equivalent_fraction_matching",
      matchingPairs: [
        { prompt: "1/2", correctMatch: "2/4" },
        { prompt: "2/3", correctMatch: "4/6" },
        { prompt: "3/4", correctMatch: "6/8" },
      ],
      expectedAnswer: "1/2 = 2/4; 2/3 = 4/6; 3/4 = 6/8",
      acceptableAnswers: ["1/2 = 2/4; 2/3 = 4/6; 3/4 = 6/8"],
      markingGuide:
        "Award full credit for matching all three fractions to equivalent forms.",
      workedSolution:
        "Equivalent fractions are made by multiplying or dividing the numerator and denominator by the same number.",
      misconceptionTargets: [
        "equivalent-fraction-scaling-error",
        "mixed-representation-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-and-create-equivalent-fractions",
        ifCorrectGoToStepKey: "compare-and-order-simple-fractions",
        practiceRecommendation:
          "Practise using fraction strips or same-scale multiplication to match equivalent fractions.",
        diagnosticNote:
          "This item checks whether the learner recognises simple equivalent fraction pairs.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use an equivalent-fraction table showing numerator and denominator scaled by the same factor.",
      },
    },
    {
      id: "fractions-foundations-equivalent-gap-005",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-and-create-equivalent-fractions",
      subElementKey: "equivalent-fractions",
      subElementTitle: "Equivalent fractions",
      subElementDescription:
        "Recognise and create fractions that represent the same value.",
      title: "Complete an equivalent fraction",
      prompt: "Complete the missing numerator.",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "equivalent_fraction_missing_value",
      gapText: "2/3 = __/6",
      gapAnswer: "4",
      gapAcceptableAnswers: ["4"],
      expectedAnswer: "4",
      acceptableAnswers: ["4"],
      markingGuide:
        "Award full credit for 4. The denominator 3 was multiplied by 2 to make 6, so the numerator 2 is also multiplied by 2.",
      workedSolution:
        "3 x 2 = 6, so multiply the numerator by the same factor: 2 x 2 = 4. Therefore 2/3 = 4/6.",
      misconceptionTargets: ["equivalent-fraction-scaling-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-and-create-equivalent-fractions",
        ifCorrectGoToStepKey: "compare-and-order-simple-fractions",
        practiceRecommendation:
          "Practise multiplying or dividing both parts of a fraction by the same factor.",
        diagnosticNote:
          "This item checks whether the learner keeps numerator and denominator scaling consistent.",
      },
      visualSupport: {
        type: "table",
        description:
          "Show the denominator scale factor and apply the same factor to the numerator.",
      },
    },
    {
      id: "fractions-foundations-equivalent-select-006",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "recognise-and-create-equivalent-fractions",
      subElementKey: "equivalent-fractions",
      subElementTitle: "Equivalent fractions",
      subElementDescription:
        "Recognise and create fractions that represent the same value.",
      title: "Select all equivalent fractions",
      prompt: "Select every fraction equivalent to 1/2.",
      difficulty: "developing",
      answerType: "multi_select",
      format: "equivalent_fraction_selection",
      structuredOptions: [
        { id: "two-fourths", label: "2/4" },
        { id: "three-sixths", label: "3/6" },
        { id: "four-eighths", label: "4/8" },
        { id: "one-third", label: "1/3" },
        { id: "two-sixths", label: "2/6" },
      ],
      correctOptionIds: ["two-fourths", "three-sixths", "four-eighths"],
      expectedAnswer: "2/4, 3/6 and 4/8",
      acceptableAnswers: ["2/4, 3/6 and 4/8", "2/4, 3/6, 4/8"],
      markingGuide:
        "Award full credit for selecting only 2/4, 3/6 and 4/8.",
      workedSolution:
        "Each correct option has the numerator as half of the denominator. 1/3 and 2/6 are not equal to 1/2.",
      misconceptionTargets: [
        "equivalent-fraction-scaling-error",
        "whole-number-thinking-with-fractions",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-and-create-equivalent-fractions",
        ifCorrectGoToStepKey: "compare-and-order-simple-fractions",
        practiceRecommendation:
          "Practise checking equivalent fractions by asking whether the selected part is the same size as one half.",
        diagnosticNote:
          "This item checks whether the learner can identify multiple fractions with the same value.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a table or fraction strip comparison for fractions equivalent to one half.",
      },
    },
    {
      id: "fractions-foundations-same-denominator-007",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-and-order-simple-fractions",
      subElementKey: "comparing-and-ordering-fractions",
      subElementTitle: "Comparing and ordering fractions",
      subElementDescription:
        "Compare and order fractions using benchmarks, denominators and representations.",
      title: "Compare fractions with the same denominator",
      prompt:
        "True or false: 3/8 is greater than 5/8 because 3 is less than 5. If false, choose the correction.",
      difficulty: "developing",
      answerType: "true_false_correction",
      format: "same_denominator_comparison",
      trueFalseStatement:
        "3/8 is greater than 5/8 because 3 is less than 5.",
      correctBoolean: false,
      correctionOptions: [
        "5/8 is greater because both fractions are eighths and 5 eighths is more than 3 eighths.",
        "3/8 is greater because 3 is smaller and smaller numbers make bigger fractions.",
        "The fractions are equal because the denominators are the same.",
      ],
      correctCorrection:
        "5/8 is greater because both fractions are eighths and 5 eighths is more than 3 eighths.",
      expectedAnswer: "5/8 is greater",
      acceptableAnswers: ["5/8 is greater", "5/8"],
      markingGuide:
        "Award full credit for identifying the statement as false and choosing the correction that compares the numerators when denominators match.",
      workedSolution:
        "The denominators are the same, so the parts are the same size. Five eighths is more than three eighths.",
      misconceptionTargets: ["same-denominator-comparison-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-and-order-simple-fractions",
        ifCorrectGoToStepKey: "use-fractions-in-sharing-and-measurement-contexts",
        practiceRecommendation:
          "Practise comparing fractions with the same denominator by counting how many same-size parts are selected.",
        diagnosticNote:
          "This item checks whether the learner compares same-denominator fractions using the numerator.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Place 3/8 and 5/8 on the same number line or fraction strip.",
      },
    },
    {
      id: "fractions-foundations-same-numerator-008",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-and-order-simple-fractions",
      subElementKey: "comparing-and-ordering-fractions",
      subElementTitle: "Comparing and ordering fractions",
      subElementDescription:
        "Compare and order fractions using benchmarks, denominators and representations.",
      title: "Explain same-numerator comparison",
      prompt:
        "A learner says 1/8 is bigger than 1/4 because 8 is bigger than 4. Which explanation is best?",
      difficulty: "secure",
      answerType: "choose_best_explanation",
      format: "same_numerator_comparison",
      structuredOptions: [
        {
          id: "fourths-bigger-parts",
          label: "1/4 is greater because fourths are larger parts than eighths.",
        },
        {
          id: "eight-is-bigger",
          label: "1/8 is greater because 8 is bigger than 4.",
        },
        {
          id: "same-numerator-equal",
          label: "They are equal because both fractions have numerator 1.",
        },
        {
          id: "denominator-is-ignored",
          label: "The denominator does not matter when comparing fractions.",
        },
      ],
      bestExplanationOptionId: "fourths-bigger-parts",
      expectedAnswer: "1/4 is greater because fourths are larger parts than eighths.",
      acceptableAnswers: [
        "1/4 is greater because fourths are larger parts than eighths.",
      ],
      markingGuide:
        "Award full credit for choosing the explanation that a smaller denominator means larger equal parts when the numerator is the same.",
      workedSolution:
        "If one whole is split into 4 equal parts, each part is larger than if the same whole is split into 8 equal parts. So 1/4 is greater than 1/8.",
      misconceptionTargets: [
        "same-numerator-comparison-error",
        "denominator-as-size-confusion",
        "whole-number-thinking-with-fractions",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-and-order-simple-fractions",
        ifCorrectGoToStepKey: "use-fractions-in-sharing-and-measurement-contexts",
        practiceRecommendation:
          "Practise comparing unit fractions with fraction strips or drawings where the same whole is split into different numbers of parts.",
        diagnosticNote:
          "This item checks whether the learner understands that larger denominators mean smaller equal parts for unit fractions.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a number line or fraction strip showing 1/4 to the right of 1/8.",
      },
    },
    {
      id: "fractions-foundations-benchmark-ordering-009",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-and-order-simple-fractions",
      subElementKey: "comparing-and-ordering-fractions",
      subElementTitle: "Comparing and ordering fractions",
      subElementDescription:
        "Compare and order fractions using benchmarks, denominators and representations.",
      title: "Order fractions using benchmarks",
      prompt: "Order these fractions from smallest to largest.",
      difficulty: "secure",
      answerType: "ordering",
      format: "benchmark_fraction_ordering",
      orderingItems: ["1/4", "3/4", "1/2", "5/4"],
      correctOrder: ["1/4", "1/2", "3/4", "5/4"],
      expectedAnswer: "1/4, 1/2, 3/4, 5/4",
      acceptableAnswers: ["1/4, 1/2, 3/4, 5/4", "1/4 1/2 3/4 5/4"],
      markingGuide:
        "Award full credit for ordering the fractions from 1/4 through 5/4.",
      workedSolution:
        "Use benchmarks: 1/4 is below 1/2, 3/4 is above 1/2 but below 1, and 5/4 is greater than 1.",
      misconceptionTargets: [
        "benchmark-fraction-comparison-error",
        "fraction-greater-than-one-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-and-order-simple-fractions",
        ifCorrectGoToStepKey: "use-fractions-in-sharing-and-measurement-contexts",
        practiceRecommendation:
          "Practise placing fractions near 0, 1/2 and 1 before ordering them.",
        diagnosticNote:
          "This item checks whether the learner uses benchmarks to order fractions, including a fraction greater than 1.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a number line from 0 to more than 1 with benchmark points at 1/2 and 1.",
      },
    },
    {
      id: "fractions-foundations-correct-working-010",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-fractions-in-sharing-and-measurement-contexts",
      subElementKey: "fraction-problem-solving-foundations",
      subElementTitle: "Fraction problem-solving foundations",
      subElementDescription:
        "Use simple fraction reasoning in sharing, measurement and everyday contexts.",
      title: "Select correct equivalent-fraction working",
      prompt: "Which working correctly shows that 3/4 = 6/8?",
      difficulty: "secure",
      answerType: "select_correct_working",
      format: "fraction_working_selection",
      structuredOptions: [
        {
          id: "scale-both-by-two",
          label: "Multiply the numerator and denominator by 2: 3 x 2 = 6 and 4 x 2 = 8.",
        },
        {
          id: "add-two-to-bottom",
          label: "Add 2 to the denominator only: 4 + 2 = 6, so the fractions match.",
        },
        {
          id: "multiply-top-only",
          label: "Multiply only the numerator by 2 because 3 x 2 = 6.",
        },
        {
          id: "compare-whole-numbers",
          label: "The fractions are equal because 6 is greater than 3 and 8 is greater than 4.",
        },
      ],
      correctWorkingOptionId: "scale-both-by-two",
      expectedAnswer:
        "Multiply the numerator and denominator by 2: 3 x 2 = 6 and 4 x 2 = 8.",
      acceptableAnswers: [
        "Multiply the numerator and denominator by 2: 3 x 2 = 6 and 4 x 2 = 8.",
      ],
      markingGuide:
        "Award full credit for selecting the working that scales numerator and denominator by the same factor.",
      workedSolution:
        "Equivalent fractions keep the same value by scaling both numerator and denominator by the same factor. Here both parts are multiplied by 2.",
      misconceptionTargets: [
        "equivalent-fraction-scaling-error",
        "whole-number-thinking-with-fractions",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "recognise-and-create-equivalent-fractions",
        ifCorrectGoToStepKey: "use-fractions-in-sharing-and-measurement-contexts",
        practiceRecommendation:
          "Practise checking equivalent-fraction working by looking for the same operation on the numerator and denominator.",
        diagnosticNote:
          "This item checks whether the learner can identify valid equivalent-fraction reasoning.",
      },
      visualSupport: {
        type: "table",
        description:
          "Show numerator and denominator each multiplied by the same scale factor.",
      },
    },
    {
      id: "fractions-foundations-sharing-context-011",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-fractions-in-sharing-and-measurement-contexts",
      subElementKey: "fraction-problem-solving-foundations",
      subElementTitle: "Fraction problem-solving foundations",
      subElementDescription:
        "Use simple fraction reasoning in sharing, measurement and everyday contexts.",
      title: "Solve a sharing context",
      prompt:
        "There are 20 counters. A learner uses 1/4 of them. How many counters does the learner use?",
      difficulty: "extension",
      answerType: "numeric",
      format: "fraction_sharing_context",
      expectedAnswer: "5",
      acceptableAnswers: ["5"],
      markingGuide:
        "Award full credit for 5 counters.",
      workedSolution:
        "One fourth means split the 20 counters into 4 equal groups. 20 / 4 = 5, so the learner uses 5 counters.",
      misconceptionTargets: [
        "fraction-sharing-context-error",
        "denominator-as-size-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-fractions-in-sharing-and-measurement-contexts",
        ifCorrectGoToStepKey: "recognise-and-create-equivalent-fractions",
        practiceRecommendation:
          "Practise finding unit fractions of collections by sharing the total into equal groups.",
        diagnosticNote:
          "This item checks whether the learner can use a simple fraction to solve a collection-sharing context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Show 20 counters shared into 4 equal groups.",
      },
    },
    {
      id: "fractions-foundations-context-classification-012",
      progressionBandKey: NUMBER_FRACTIONS_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-fractions-in-sharing-and-measurement-contexts",
      subElementKey: "fraction-problem-solving-foundations",
      subElementTitle: "Fraction problem-solving foundations",
      subElementDescription:
        "Use simple fraction reasoning in sharing, measurement and everyday contexts.",
      title: "Classify fractions in a recipe context",
      prompt:
        "A recipe uses these cup amounts. Classify each amount compared with 1/2 cup.",
      difficulty: "extension",
      answerType: "classification",
      format: "fraction_context_classification",
      classificationCategories: [
        { id: "less-than-half", label: "Less than 1/2" },
        { id: "equal-to-half", label: "Equal to 1/2" },
        { id: "greater-than-half", label: "Greater than 1/2" },
      ],
      classificationItems: [
        { id: "one-quarter-cup", label: "1/4 cup", correctCategoryId: "less-than-half" },
        { id: "two-fourths-cup", label: "2/4 cup", correctCategoryId: "equal-to-half" },
        { id: "three-fourths-cup", label: "3/4 cup", correctCategoryId: "greater-than-half" },
        { id: "five-fourths-cup", label: "5/4 cup", correctCategoryId: "greater-than-half" },
      ],
      expectedAnswer:
        "1/4 cup is less than 1/2; 2/4 cup is equal to 1/2; 3/4 cup and 5/4 cup are greater than 1/2",
      acceptableAnswers: [
        "1/4 cup is less than 1/2; 2/4 cup is equal to 1/2; 3/4 cup and 5/4 cup are greater than 1/2",
      ],
      markingGuide:
        "Award full credit for correctly classifying all four recipe amounts relative to 1/2.",
      workedSolution:
        "Use 1/2 as the benchmark. 1/4 is less than 1/2. 2/4 equals 1/2. 3/4 is greater than 1/2, and 5/4 is greater than 1 because it is more than a whole cup.",
      misconceptionTargets: [
        "benchmark-fraction-comparison-error",
        "fraction-greater-than-one-confusion",
        "fraction-sharing-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-and-order-simple-fractions",
        ifCorrectGoToStepKey: "use-fractions-in-sharing-and-measurement-contexts",
        practiceRecommendation:
          "Practise comparing recipe and measurement fractions with the benchmarks 1/2 and 1.",
        diagnosticNote:
          "This item checks whether the learner can use benchmark fractions in an everyday measurement context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use recipe cup amounts and compare each one with 1/2 cup.",
      },
    },
  ];

export function getNumberFractionsFoundationsAssessmentItemById(id: string) {
  return (
    NUMBER_FRACTIONS_FOUNDATIONS_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberFractionsFoundationsAssessmentItemsByStep(
  stepKey: NumberFractionsFoundationsProgressionStepKey,
) {
  return NUMBER_FRACTIONS_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberFractionsFoundationsAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_FRACTIONS_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberFractionsFoundationsAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_FRACTIONS_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
