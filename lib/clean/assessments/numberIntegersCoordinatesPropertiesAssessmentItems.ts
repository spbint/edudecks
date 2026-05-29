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

export type NumberIntegersCoordinatesPropertiesProgressionBandKey = Extract<
  NumberProgressionBandKey,
  "integers-coordinates-number-properties"
>;

export type NumberIntegersCoordinatesPropertiesProgressionStepKey =
  | "represent-integers-on-a-number-line"
  | "identify-coordinates-on-the-cartesian-plane"
  | "classify-prime-composite-and-square-numbers"
  | "use-factor-trees-and-prime-factorisation"
  | "operate-with-integers";

export type NumberIntegersCoordinatesPropertiesAssessmentFormat =
  | "integer_ordering"
  | "integer_operations"
  | "coordinate_location"
  | "coordinate_movement"
  | "factors_multiples"
  | "divisibility"
  | "prime_composite_properties"
  | "number_property_context";

export type NumberIntegersCoordinatesPropertiesMisconceptionCode =
  | "negative-number-ordering-error"
  | "integer-operation-sign-error"
  | "subtraction-as-smaller-error"
  | "coordinate-order-reversal"
  | "quadrant-sign-confusion"
  | "factor-multiple-confusion"
  | "divisibility-rule-error"
  | "common-factor-multiple-confusion"
  | "prime-composite-classification-error"
  | "one-as-prime-error"
  | "even-odd-property-error"
  | "number-property-context-error";

export type NumberIntegersCoordinatesPropertiesAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberIntegersCoordinatesPropertiesProgressionStepKey;
  ifCorrectGoToStepKey?: NumberIntegersCoordinatesPropertiesProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberIntegersCoordinatesPropertiesAssessmentItem = {
  id: string;
  progressionBandKey: NumberIntegersCoordinatesPropertiesProgressionBandKey;
  progressionStepKey: NumberIntegersCoordinatesPropertiesProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberIntegersCoordinatesPropertiesAssessmentFormat;
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
  misconceptionTargets: NumberIntegersCoordinatesPropertiesMisconceptionCode[];
  adaptiveRoute: NumberIntegersCoordinatesPropertiesAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY =
  "number-integers-coordinates-properties-assessment-items-v1";

export const NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY: NumberIntegersCoordinatesPropertiesProgressionBandKey =
  "integers-coordinates-number-properties";

export const NUMBER_INTEGERS_COORDINATES_PROPERTIES_ASSESSMENT_ITEMS: NumberIntegersCoordinatesPropertiesAssessmentItem[] =
  [
    {
      id: "integers-coordinates-properties-order-integers-001",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "represent-integers-on-a-number-line",
      subElementKey: "integer-ordering-and-operations",
      subElementTitle: "Integer ordering and operations",
      subElementDescription:
        "Compare, order and operate with positive and negative integers.",
      title: "Order positive and negative integers",
      prompt: "Order these integers from smallest to largest.",
      difficulty: "foundation",
      answerType: "ordering",
      format: "integer_ordering",
      orderingItems: ["-7", "4", "-2", "0"],
      correctOrder: ["-7", "-2", "0", "4"],
      expectedAnswer: "-7, -2, 0, 4",
      acceptableAnswers: ["-7, -2, 0, 4", "-7 -2 0 4"],
      markingGuide:
        "Award full credit for ordering the integers from left to right on the number line.",
      workedSolution:
        "Numbers further left on a number line are smaller. The order is -7, -2, 0, 4.",
      misconceptionTargets: ["negative-number-ordering-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "represent-integers-on-a-number-line",
        ifCorrectGoToStepKey: "operate-with-integers",
        practiceRecommendation:
          "Practise placing negative and positive integers on a number line before comparing them.",
        diagnosticNote:
          "This item checks whether the learner orders negative values by position, not by digit size.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a horizontal number line with negative numbers left of zero.",
      },
    },
    {
      id: "integers-coordinates-properties-calculate-integers-002",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "operate-with-integers",
      subElementKey: "integer-ordering-and-operations",
      subElementTitle: "Integer ordering and operations",
      subElementDescription:
        "Compare, order and operate with positive and negative integers.",
      title: "Calculate with integers",
      prompt: "Calculate -6 + 9 - 4.",
      difficulty: "foundation",
      answerType: "numeric",
      format: "integer_operations",
      expectedAnswer: "-1",
      acceptableAnswers: ["-1"],
      markingGuide:
        "Award full credit for -1. Equivalent working may use a number line or signed arithmetic.",
      workedSolution:
        "-6 + 9 = 3, then 3 - 4 = -1.",
      misconceptionTargets: [
        "integer-operation-sign-error",
        "subtraction-as-smaller-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "operate-with-integers",
        ifCorrectGoToStepKey: "identify-coordinates-on-the-cartesian-plane",
        practiceRecommendation:
          "Practise moving right for addition and left for subtraction on an integer number line.",
        diagnosticNote:
          "This item checks whether the learner keeps track of sign changes across a short integer expression.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "A number line can show movement from -6 right 9, then left 4.",
      },
    },
    {
      id: "integers-coordinates-properties-integer-working-003",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "operate-with-integers",
      subElementKey: "integer-ordering-and-operations",
      subElementTitle: "Integer ordering and operations",
      subElementDescription:
        "Compare, order and operate with positive and negative integers.",
      title: "Select correct integer working",
      prompt: "Which working correctly calculates 5 - (-3)?",
      difficulty: "foundation",
      answerType: "select_correct_working",
      format: "integer_operations",
      structuredOptions: [
        {
          id: "add-opposite",
          label: "Subtracting -3 is the same as adding 3, so 5 - (-3) = 8.",
        },
        {
          id: "always-smaller",
          label: "Subtraction always makes a number smaller, so the answer is 2.",
        },
        {
          id: "ignore-negative",
          label: "Ignore the negative sign and calculate 5 - 3 = 2.",
        },
        {
          id: "multiply-signs",
          label: "Two negatives make a negative, so the answer is -8.",
        },
      ],
      correctWorkingOptionId: "add-opposite",
      expectedAnswer: "8",
      acceptableAnswers: ["8"],
      markingGuide:
        "Award full credit for selecting the working that treats subtracting a negative as adding.",
      workedSolution:
        "Subtracting a negative moves right on the number line. 5 - (-3) = 5 + 3 = 8.",
      misconceptionTargets: [
        "integer-operation-sign-error",
        "subtraction-as-smaller-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "operate-with-integers",
        ifCorrectGoToStepKey: "identify-coordinates-on-the-cartesian-plane",
        practiceRecommendation:
          "Practise interpreting subtracting a negative as moving in the positive direction.",
        diagnosticNote:
          "This item checks whether the learner can identify correct signed-integer working.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a number line to show that subtracting -3 moves three places right.",
      },
    },
    {
      id: "integers-coordinates-properties-identify-coordinate-004",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-coordinates-on-the-cartesian-plane",
      subElementKey: "coordinates-and-integer-position",
      subElementTitle: "Coordinates and integer position",
      subElementDescription:
        "Read, plot and reason about points using integer coordinates.",
      title: "Identify a coordinate point",
      prompt:
        "A point is 3 units right of the origin and 2 units below the origin. What are its coordinates?",
      difficulty: "developing",
      answerType: "short_symbolic",
      format: "coordinate_location",
      expectedAnswer: "(3, -2)",
      acceptableAnswers: ["(3, -2)", "3,-2", "3, -2"],
      markingGuide:
        "Award full credit for (3, -2). The x-coordinate is positive and the y-coordinate is negative.",
      workedSolution:
        "Right of the origin gives x = 3. Below the origin gives y = -2, so the point is (3, -2).",
      misconceptionTargets: [
        "coordinate-order-reversal",
        "quadrant-sign-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-coordinates-on-the-cartesian-plane",
        ifCorrectGoToStepKey: "represent-integers-on-a-number-line",
        practiceRecommendation:
          "Practise reading coordinates as x first, then y, with signs showing direction from the origin.",
        diagnosticNote:
          "This item checks whether the learner reads integer coordinates in the correct order.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A coordinate description using right/left and up/down from the origin.",
      },
    },
    {
      id: "integers-coordinates-properties-coordinate-match-005",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-coordinates-on-the-cartesian-plane",
      subElementKey: "coordinates-and-integer-position",
      subElementTitle: "Coordinates and integer position",
      subElementDescription:
        "Read, plot and reason about points using integer coordinates.",
      title: "Match coordinates to quadrant descriptions",
      prompt: "Match each coordinate with its quadrant or axis location.",
      difficulty: "developing",
      answerType: "matching",
      format: "coordinate_location",
      matchingPairs: [
        { prompt: "(4, 2)", correctMatch: "Quadrant I" },
        { prompt: "(-3, 5)", correctMatch: "Quadrant II" },
        { prompt: "(0, -6)", correctMatch: "On the y-axis below the origin" },
      ],
      expectedAnswer:
        "(4, 2) Quadrant I; (-3, 5) Quadrant II; (0, -6) y-axis below origin",
      acceptableAnswers: [
        "(4, 2) Quadrant I; (-3, 5) Quadrant II; (0, -6) y-axis below origin",
      ],
      markingGuide:
        "Award full credit for matching each coordinate with the correct sign-based location.",
      workedSolution:
        "Positive x and positive y is Quadrant I. Negative x and positive y is Quadrant II. If x = 0, the point lies on the y-axis.",
      misconceptionTargets: [
        "quadrant-sign-confusion",
        "coordinate-order-reversal",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-coordinates-on-the-cartesian-plane",
        ifCorrectGoToStepKey: "operate-with-integers",
        practiceRecommendation:
          "Practise linking coordinate signs to quadrants and axes.",
        diagnosticNote:
          "This item checks whether the learner interprets signs in coordinate locations.",
      },
      visualSupport: {
        type: "table",
        description:
          "A sign table for x and y values across quadrants and axes.",
      },
    },
    {
      id: "integers-coordinates-properties-coordinate-movement-006",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "identify-coordinates-on-the-cartesian-plane",
      subElementKey: "coordinates-and-integer-position",
      subElementTitle: "Coordinates and integer position",
      subElementDescription:
        "Read, plot and reason about points using integer coordinates.",
      title: "Reason about movement on a coordinate grid",
      prompt:
        "Start at (-2, 3). Move 5 units right and 4 units down. What is the new point?",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "coordinate_movement",
      gapText: "New point = (__, -1)",
      gapAnswer: "3",
      gapAcceptableAnswers: ["3", "(3, -1)", "3, -1"],
      expectedAnswer: "(3, -1)",
      acceptableAnswers: ["(3, -1)", "3,-1", "3, -1"],
      markingGuide:
        "Award full credit for completing the coordinate as (3, -1).",
      workedSolution:
        "Moving right increases x: -2 + 5 = 3. Moving down decreases y: 3 - 4 = -1. The new point is (3, -1).",
      misconceptionTargets: [
        "coordinate-order-reversal",
        "integer-operation-sign-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "identify-coordinates-on-the-cartesian-plane",
        ifCorrectGoToStepKey: "operate-with-integers",
        practiceRecommendation:
          "Practise changing x for left/right movement and y for up/down movement.",
        diagnosticNote:
          "This item checks whether the learner can apply integer movement on a coordinate grid.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A coordinate movement context from a starting point.",
      },
    },
    {
      id: "integers-coordinates-properties-factor-multiple-classify-007",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-factor-trees-and-prime-factorisation",
      subElementKey: "factors-multiples-and-divisibility",
      subElementTitle: "Factors, multiples and divisibility",
      subElementDescription:
        "Identify factors, multiples and divisibility relationships.",
      title: "Classify factors and multiples",
      prompt: "Classify each statement as factor, multiple, or neither.",
      difficulty: "developing",
      answerType: "classification",
      format: "factors_multiples",
      classificationCategories: [
        { id: "factor", label: "Factor statement" },
        { id: "multiple", label: "Multiple statement" },
        { id: "neither", label: "Neither" },
      ],
      classificationItems: [
        { id: "three-factor-twelve", label: "3 is a factor of 12", correctCategoryId: "factor" },
        { id: "twenty-multiple-five", label: "20 is a multiple of 5", correctCategoryId: "multiple" },
        { id: "seven-factor-twenty", label: "7 is a factor of 20", correctCategoryId: "neither" },
      ],
      expectedAnswer:
        "3 is a factor of 12; 20 is a multiple of 5; 7 is neither for 20",
      acceptableAnswers: [
        "3 is a factor of 12; 20 is a multiple of 5; 7 is neither for 20",
      ],
      markingGuide:
        "Award full credit for classifying each relationship correctly.",
      workedSolution:
        "3 divides 12 exactly, so 3 is a factor. 20 = 5 x 4, so 20 is a multiple of 5. 7 does not divide 20 exactly.",
      misconceptionTargets: [
        "factor-multiple-confusion",
        "divisibility-rule-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-factor-trees-and-prime-factorisation",
        ifCorrectGoToStepKey: "classify-prime-composite-and-square-numbers",
        practiceRecommendation:
          "Practise using exact division to decide factor and multiple relationships.",
        diagnosticNote:
          "This item checks whether the learner distinguishes factors from multiples.",
      },
      visualSupport: {
        type: "table",
        description:
          "A table sorting factor, multiple and neither relationships.",
      },
    },
    {
      id: "integers-coordinates-properties-divisibility-008",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-factor-trees-and-prime-factorisation",
      subElementKey: "factors-multiples-and-divisibility",
      subElementTitle: "Factors, multiples and divisibility",
      subElementDescription:
        "Identify factors, multiples and divisibility relationships.",
      title: "Use a divisibility rule",
      prompt: "Which option explains why 156 is divisible by 3?",
      difficulty: "secure",
      answerType: "multiple_choice",
      format: "divisibility",
      options: [
        "1 + 5 + 6 = 12, and 12 is divisible by 3.",
        "156 ends in 6, so it is divisible by 3.",
        "156 is greater than 100, so it is divisible by 3.",
        "156 has three digits, so it is divisible by 3.",
      ],
      expectedAnswer: "1 + 5 + 6 = 12, and 12 is divisible by 3.",
      acceptableAnswers: ["1 + 5 + 6 = 12, and 12 is divisible by 3."],
      markingGuide:
        "Award full credit for using the digit-sum rule for divisibility by 3.",
      workedSolution:
        "For divisibility by 3, add the digits. 1 + 5 + 6 = 12, and 12 is divisible by 3, so 156 is divisible by 3.",
      misconceptionTargets: ["divisibility-rule-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-factor-trees-and-prime-factorisation",
        ifCorrectGoToStepKey: "classify-prime-composite-and-square-numbers",
        practiceRecommendation:
          "Practise divisibility rules for 2, 3, 5, 9 and 10 using digit patterns.",
        diagnosticNote:
          "This item checks whether the learner applies a divisibility rule rather than guessing from size or digit count.",
      },
      visualSupport: {
        type: "table",
        description:
          "A divisibility-rule table for common factors.",
      },
    },
    {
      id: "integers-coordinates-properties-common-factor-multiple-009",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-factor-trees-and-prime-factorisation",
      subElementKey: "factors-multiples-and-divisibility",
      subElementTitle: "Factors, multiples and divisibility",
      subElementDescription:
        "Identify factors, multiples and divisibility relationships.",
      title: "Find a common factor",
      prompt: "Find the highest common factor of 18 and 24.",
      difficulty: "secure",
      answerType: "numeric",
      format: "factors_multiples",
      expectedAnswer: "6",
      acceptableAnswers: ["6"],
      markingGuide:
        "Award full credit for 6.",
      workedSolution:
        "Factors of 18 include 1, 2, 3, 6, 9, 18. Factors of 24 include 1, 2, 3, 4, 6, 8, 12, 24. The highest common factor is 6.",
      misconceptionTargets: [
        "common-factor-multiple-confusion",
        "factor-multiple-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-factor-trees-and-prime-factorisation",
        ifCorrectGoToStepKey: "classify-prime-composite-and-square-numbers",
        practiceRecommendation:
          "Practise listing factors before comparing common factors and common multiples.",
        diagnosticNote:
          "This item checks whether the learner can find a common factor and avoid confusing it with a common multiple.",
      },
      visualSupport: {
        type: "table",
        description:
          "A factor-list table for 18 and 24.",
      },
    },
    {
      id: "integers-coordinates-properties-prime-composite-010",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "classify-prime-composite-and-square-numbers",
      subElementKey: "primes-composites-and-number-properties",
      subElementTitle: "Primes, composites and number properties",
      subElementDescription:
        "Use prime/composite classification and number properties to reason about whole numbers.",
      title: "Classify primes, composites and one",
      prompt:
        "True or false: 1 is prime because it has one factor. If false, choose the correction.",
      difficulty: "secure",
      answerType: "true_false_correction",
      format: "prime_composite_properties",
      trueFalseStatement: "1 is prime because it has one factor.",
      correctBoolean: false,
      correctionOptions: [
        "1 is neither prime nor composite because a prime number has exactly two factors.",
        "1 is composite because it has fewer than two factors.",
        "1 is prime because it is odd.",
      ],
      correctCorrection:
        "1 is neither prime nor composite because a prime number has exactly two factors.",
      expectedAnswer: "1 is neither prime nor composite",
      acceptableAnswers: [
        "1 is neither prime nor composite",
        "neither prime nor composite",
      ],
      markingGuide:
        "Award full credit for identifying the statement as false and choosing the correction that primes have exactly two factors.",
      workedSolution:
        "A prime number has exactly two factors. The number 1 has only one factor, so it is neither prime nor composite.",
      misconceptionTargets: [
        "prime-composite-classification-error",
        "one-as-prime-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "classify-prime-composite-and-square-numbers",
        ifCorrectGoToStepKey: "use-factor-trees-and-prime-factorisation",
        practiceRecommendation:
          "Practise counting factors to classify primes, composites and 1.",
        diagnosticNote:
          "This item checks whether the learner uses factor count to classify whole numbers.",
      },
      visualSupport: {
        type: "table",
        description:
          "A table for sorting numbers by factor count.",
      },
    },
    {
      id: "integers-coordinates-properties-true-statements-011",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "classify-prime-composite-and-square-numbers",
      subElementKey: "primes-composites-and-number-properties",
      subElementTitle: "Primes, composites and number properties",
      subElementDescription:
        "Use prime/composite classification and number properties to reason about whole numbers.",
      title: "Select true number-property statements",
      prompt: "Select every true statement about 36.",
      difficulty: "extension",
      answerType: "multi_select",
      format: "number_property_context",
      structuredOptions: [
        { id: "square", label: "36 is a square number." },
        { id: "composite", label: "36 is composite." },
        { id: "multiple-six", label: "36 is a multiple of 6." },
        { id: "prime", label: "36 is prime." },
        { id: "odd", label: "36 is odd." },
      ],
      correctOptionIds: ["square", "composite", "multiple-six"],
      expectedAnswer: "36 is square, composite, and a multiple of 6",
      acceptableAnswers: [
        "36 is square, composite, and a multiple of 6",
      ],
      markingGuide:
        "Award full credit for selecting square, composite, and multiple of 6 only.",
      workedSolution:
        "36 = 6 x 6, so it is square. It has more than two factors, so it is composite. It is also 6 x 6, so it is a multiple of 6.",
      misconceptionTargets: [
        "prime-composite-classification-error",
        "even-odd-property-error",
        "factor-multiple-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "classify-prime-composite-and-square-numbers",
        ifCorrectGoToStepKey: "use-factor-trees-and-prime-factorisation",
        practiceRecommendation:
          "Practise checking several number properties one at a time using factors and multiples.",
        diagnosticNote:
          "This item checks whether the learner can identify multiple true properties of a whole number.",
      },
      visualSupport: {
        type: "table",
        description:
          "A property checklist for square, composite, multiple, prime and odd.",
      },
    },
    {
      id: "integers-coordinates-properties-context-012",
      progressionBandKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "classify-prime-composite-and-square-numbers",
      subElementKey: "primes-composites-and-number-properties",
      subElementTitle: "Primes, composites and number properties",
      subElementDescription:
        "Use prime/composite classification and number properties to reason about whole numbers.",
      title: "Choose the best number-property explanation",
      prompt:
        "A game makes teams of equal size from 30 players. Which explanation best uses number properties?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "number_property_context",
      structuredOptions: [
        {
          id: "factor-sizes",
          label: "Team sizes must be factors of 30, such as 2, 3, 5, 6, 10 or 15.",
        },
        {
          id: "prime-only",
          label: "Only prime team sizes work because 30 is composite.",
        },
        {
          id: "any-size",
          label: "Any team size works because 30 is even.",
        },
        {
          id: "multiples-only",
          label: "Team sizes must be multiples of 30.",
        },
      ],
      bestExplanationOptionId: "factor-sizes",
      expectedAnswer:
        "Team sizes must be factors of 30, such as 2, 3, 5, 6, 10 or 15.",
      acceptableAnswers: [
        "Team sizes must be factors of 30, such as 2, 3, 5, 6, 10 or 15.",
      ],
      markingGuide:
        "Award full credit for recognising that equal team sizes must divide 30 exactly.",
      workedSolution:
        "Equal teams mean each team size must divide the total exactly. The possible team sizes are factors of 30.",
      misconceptionTargets: [
        "number-property-context-error",
        "factor-multiple-confusion",
        "prime-composite-classification-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "classify-prime-composite-and-square-numbers",
        ifCorrectGoToStepKey: "use-factor-trees-and-prime-factorisation",
        practiceRecommendation:
          "Practise using factors to reason about equal groups in context.",
        diagnosticNote:
          "This item checks whether the learner can apply number properties in an equal-group context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "A team-making context using 30 players and equal groups.",
      },
    },
  ];

export function getNumberIntegersCoordinatesPropertiesAssessmentItemById(
  id: string,
) {
  return (
    NUMBER_INTEGERS_COORDINATES_PROPERTIES_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberIntegersCoordinatesPropertiesAssessmentItemsByStep(
  stepKey: NumberIntegersCoordinatesPropertiesProgressionStepKey,
) {
  return NUMBER_INTEGERS_COORDINATES_PROPERTIES_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberIntegersCoordinatesPropertiesAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_INTEGERS_COORDINATES_PROPERTIES_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberIntegersCoordinatesPropertiesAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_INTEGERS_COORDINATES_PROPERTIES_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
