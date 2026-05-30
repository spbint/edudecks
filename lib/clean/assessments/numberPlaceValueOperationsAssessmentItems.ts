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

export type NumberPlaceValueOperationsProgressionBandKey =
  "place-value-and-whole-number-operations";

export type NumberPlaceValueOperationsProgressionStepKey =
  | "read-write-and-partition-whole-numbers"
  | "compare-order-and-round-whole-numbers"
  | "use-addition-and-subtraction-strategies"
  | "use-multiplication-and-division-foundations";

export type NumberPlaceValueOperationsAssessmentFormat =
  | "digit_value"
  | "place_value_partitioning"
  | "flexible_renaming"
  | "whole_number_comparison"
  | "whole_number_ordering"
  | "whole_number_rounding"
  | "addition_strategy"
  | "subtraction_strategy"
  | "operation_equation"
  | "equal_groups_and_arrays"
  | "division_sharing"
  | "operation_reasoning";

export type NumberPlaceValueOperationsMisconceptionCode =
  | "place-value-digit-value-error"
  | "place-value-partitioning-error"
  | "flexible-renaming-error"
  | "whole-number-comparison-error"
  | "ordering-place-value-error"
  | "rounding-place-value-error"
  | "addition-regrouping-error"
  | "subtraction-regrouping-error"
  | "operation-inverse-confusion"
  | "multiplication-equal-groups-confusion"
  | "division-sharing-grouping-confusion"
  | "fact-family-relationship-error";

export type NumberPlaceValueOperationsAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberPlaceValueOperationsProgressionStepKey;
  ifCorrectGoToStepKey?: NumberPlaceValueOperationsProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberPlaceValueOperationsAssessmentItem = {
  id: string;
  progressionBandKey: NumberPlaceValueOperationsProgressionBandKey;
  progressionStepKey: NumberPlaceValueOperationsProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberPlaceValueOperationsAssessmentFormat;
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
  misconceptionTargets: NumberPlaceValueOperationsMisconceptionCode[];
  adaptiveRoute: NumberPlaceValueOperationsAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY =
  "number-place-value-operations-assessment-items-v1";

export const NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY: NumberPlaceValueOperationsProgressionBandKey =
  "place-value-and-whole-number-operations";

export const NUMBER_PLACE_VALUE_OPERATIONS_ASSESSMENT_ITEMS: NumberPlaceValueOperationsAssessmentItem[] =
  [
    {
      id: "place-value-ops-digit-value-001",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-write-and-partition-whole-numbers",
      subElementKey: "place-value-and-number-structure",
      subElementTitle: "Place value and number structure",
      subElementDescription:
        "Read, write, partition and rename whole numbers using place value.",
      title: "Identify the value of a digit",
      prompt: "In the number 5,482, what is the value of the digit 4?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "digit_value",
      options: ["4", "40", "400", "4,000"],
      expectedAnswer: "400",
      acceptableAnswers: ["400"],
      markingGuide:
        "Award full credit for 400. The digit 4 is in the hundreds place.",
      workedSolution:
        "In 5,482, the places are thousands, hundreds, tens and ones. The 4 is in the hundreds place, so its value is 400.",
      misconceptionTargets: ["place-value-digit-value-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-write-and-partition-whole-numbers",
        ifCorrectGoToStepKey: "compare-order-and-round-whole-numbers",
        practiceRecommendation:
          "Practise naming each digit's place and value in 3-digit and 4-digit numbers.",
        diagnosticNote:
          "This item checks whether the learner reads a digit by its place value rather than its face value.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a place-value table with thousands, hundreds, tens and ones.",
      },
    },
    {
      id: "place-value-ops-partition-match-002",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-write-and-partition-whole-numbers",
      subElementKey: "place-value-and-number-structure",
      subElementTitle: "Place value and number structure",
      subElementDescription:
        "Read, write, partition and rename whole numbers using place value.",
      title: "Match numbers to expanded form",
      prompt: "Match each number to its expanded form.",
      difficulty: "foundation",
      answerType: "matching",
      format: "place_value_partitioning",
      matchingPairs: [
        { prompt: "3,407", correctMatch: "3,000 + 400 + 7" },
        { prompt: "6,250", correctMatch: "6,000 + 200 + 50" },
        { prompt: "980", correctMatch: "900 + 80" },
      ],
      expectedAnswer:
        "3,407 = 3,000 + 400 + 7; 6,250 = 6,000 + 200 + 50; 980 = 900 + 80",
      acceptableAnswers: [
        "3,407 = 3,000 + 400 + 7; 6,250 = 6,000 + 200 + 50; 980 = 900 + 80",
      ],
      markingGuide:
        "Award full credit for matching all three numbers to their expanded forms.",
      workedSolution:
        "Partition each number by place value. Zero placeholders do not add a separate value.",
      misconceptionTargets: [
        "place-value-partitioning-error",
        "place-value-digit-value-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-write-and-partition-whole-numbers",
        ifCorrectGoToStepKey: "compare-order-and-round-whole-numbers",
        practiceRecommendation:
          "Practise partitioning numbers into thousands, hundreds, tens and ones, including numbers with zero placeholders.",
        diagnosticNote:
          "This item checks whether the learner can partition whole numbers using place-value parts.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a table showing each number split into thousands, hundreds, tens and ones.",
      },
    },
    {
      id: "place-value-ops-flexible-renaming-003",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-write-and-partition-whole-numbers",
      subElementKey: "place-value-and-number-structure",
      subElementTitle: "Place value and number structure",
      subElementDescription:
        "Read, write, partition and rename whole numbers using place value.",
      title: "Select equivalent renamed numbers",
      prompt: "Select every representation equal to 4,300.",
      difficulty: "foundation",
      answerType: "multi_select",
      format: "flexible_renaming",
      structuredOptions: [
        { id: "four-thousands-three-hundreds", label: "4 thousands and 3 hundreds" },
        { id: "three-thousands-thirteen-hundreds", label: "3 thousands and 13 hundreds" },
        { id: "forty-three-hundreds", label: "43 hundreds" },
        { id: "four-thousands-thirty-hundreds", label: "4 thousands and 30 hundreds" },
        { id: "four-hundreds-three-tens", label: "4 hundreds and 3 tens" },
      ],
      correctOptionIds: [
        "four-thousands-three-hundreds",
        "three-thousands-thirteen-hundreds",
        "forty-three-hundreds",
      ],
      expectedAnswer:
        "4 thousands and 3 hundreds; 3 thousands and 13 hundreds; 43 hundreds",
      acceptableAnswers: [
        "4 thousands and 3 hundreds; 3 thousands and 13 hundreds; 43 hundreds",
      ],
      markingGuide:
        "Award full credit for selecting only the three equivalent representations of 4,300.",
      workedSolution:
        "4 thousands and 3 hundreds is 4,300. 3 thousands and 13 hundreds is 3,000 + 1,300 = 4,300. 43 hundreds is also 4,300.",
      misconceptionTargets: [
        "flexible-renaming-error",
        "place-value-partitioning-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-write-and-partition-whole-numbers",
        ifCorrectGoToStepKey: "compare-order-and-round-whole-numbers",
        practiceRecommendation:
          "Practise renaming thousands as hundreds and hundreds as tens while keeping the total value unchanged.",
        diagnosticNote:
          "This item checks whether the learner can flexibly rename a whole number using equivalent place-value units.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a place-value table to trade 1 thousand for 10 hundreds.",
      },
    },
    {
      id: "place-value-ops-comparison-correction-004",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-order-and-round-whole-numbers",
      subElementKey: "comparing-ordering-and-rounding",
      subElementTitle: "Comparing, ordering and rounding",
      subElementDescription:
        "Compare, order and round whole numbers using place-value reasoning.",
      title: "Correct a whole-number comparison",
      prompt:
        "True or false: 506 is greater than 560 because 6 is greater than 5. If false, choose the correction.",
      difficulty: "developing",
      answerType: "true_false_correction",
      format: "whole_number_comparison",
      trueFalseStatement:
        "506 is greater than 560 because 6 is greater than 5.",
      correctBoolean: false,
      correctionOptions: [
        "560 is greater because both numbers have 5 hundreds, but 560 has 6 tens and 506 has 0 tens.",
        "506 is greater because ones are more important than tens.",
        "The numbers are equal because they both start with 5.",
      ],
      correctCorrection:
        "560 is greater because both numbers have 5 hundreds, but 560 has 6 tens and 506 has 0 tens.",
      expectedAnswer: "560 is greater",
      acceptableAnswers: ["560", "560 is greater"],
      markingGuide:
        "Award full credit for identifying the statement as false and choosing the correction based on tens place value.",
      workedSolution:
        "Compare from the largest place. Both numbers have 5 hundreds. Then compare tens: 560 has 6 tens and 506 has 0 tens, so 560 is greater.",
      misconceptionTargets: [
        "whole-number-comparison-error",
        "place-value-digit-value-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-order-and-round-whole-numbers",
        ifCorrectGoToStepKey: "compare-order-and-round-whole-numbers",
        practiceRecommendation:
          "Practise comparing whole numbers from the largest place value first.",
        diagnosticNote:
          "This item checks whether the learner compares digits by place value rather than by the size of a single digit.",
      },
      visualSupport: {
        type: "table",
        description:
          "Place 506 and 560 in a hundreds-tens-ones table before comparing.",
      },
    },
    {
      id: "place-value-ops-ordering-005",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-order-and-round-whole-numbers",
      subElementKey: "comparing-ordering-and-rounding",
      subElementTitle: "Comparing, ordering and rounding",
      subElementDescription:
        "Compare, order and round whole numbers using place-value reasoning.",
      title: "Order whole numbers",
      prompt: "Order these numbers from smallest to largest.",
      difficulty: "developing",
      answerType: "ordering",
      format: "whole_number_ordering",
      orderingItems: ["4,206", "4,260", "4,062", "4,602"],
      correctOrder: ["4,062", "4,206", "4,260", "4,602"],
      expectedAnswer: "4,062, 4,206, 4,260, 4,602",
      acceptableAnswers: [
        "4,062, 4,206, 4,260, 4,602",
        "4062, 4206, 4260, 4602",
      ],
      markingGuide:
        "Award full credit for ordering all four numbers from smallest to largest.",
      workedSolution:
        "All numbers have 4 thousands. Compare hundreds next, then tens and ones: 4,062 < 4,206 < 4,260 < 4,602.",
      misconceptionTargets: [
        "ordering-place-value-error",
        "whole-number-comparison-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-order-and-round-whole-numbers",
        ifCorrectGoToStepKey: "use-addition-and-subtraction-strategies",
        practiceRecommendation:
          "Practise ordering numbers by comparing thousands, then hundreds, then tens, then ones.",
        diagnosticNote:
          "This item checks whether the learner can order same-length whole numbers using each place in sequence.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Place the four numbers on a number line between 4,000 and 4,700.",
      },
    },
    {
      id: "place-value-ops-rounding-gap-006",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "compare-order-and-round-whole-numbers",
      subElementKey: "comparing-ordering-and-rounding",
      subElementTitle: "Comparing, ordering and rounding",
      subElementDescription:
        "Compare, order and round whole numbers using place-value reasoning.",
      title: "Round to the nearest hundred",
      prompt: "Complete the rounded value.",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "whole_number_rounding",
      gapText: "3,486 rounded to the nearest 100 is __.",
      gapAnswer: "3500",
      gapAcceptableAnswers: ["3,500", "3500"],
      expectedAnswer: "3,500",
      acceptableAnswers: ["3,500", "3500"],
      markingGuide:
        "Award full credit for 3,500. The number is between 3,400 and 3,500 and is closer to 3,500.",
      workedSolution:
        "To round to the nearest 100, look at the tens digit. In 3,486, the tens digit is 8, so round 3,400 up to 3,500.",
      misconceptionTargets: ["rounding-place-value-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "compare-order-and-round-whole-numbers",
        ifCorrectGoToStepKey: "use-addition-and-subtraction-strategies",
        practiceRecommendation:
          "Practise identifying the rounding place and the digit immediately to its right.",
        diagnosticNote:
          "This item checks whether the learner rounds a whole number using the correct place-value digit.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Show 3,486 between 3,400 and 3,500 on a number line.",
      },
    },
    {
      id: "place-value-ops-addition-working-007",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-addition-and-subtraction-strategies",
      subElementKey: "addition-and-subtraction-strategies",
      subElementTitle: "Addition and subtraction strategies",
      subElementDescription:
        "Use efficient mental and written strategies for addition and subtraction.",
      title: "Select correct addition working",
      prompt: "Which working correctly calculates 368 + 247?",
      difficulty: "developing",
      answerType: "select_correct_working",
      format: "addition_strategy",
      structuredOptions: [
        {
          id: "partition-and-add",
          label: "300 + 200 = 500, 60 + 40 = 100, 8 + 7 = 15, so total = 615.",
        },
        {
          id: "ignore-regrouping",
          label: "300 + 200 = 500, 60 + 40 = 100, 8 + 7 = 5, so total = 605.",
        },
        {
          id: "add-hundreds-only",
          label: "368 + 247 = 500 because 300 + 200 = 500.",
        },
        {
          id: "subtract-tens",
          label: "368 + 247 = 595 because the tens are subtracted.",
        },
      ],
      correctWorkingOptionId: "partition-and-add",
      expectedAnswer: "615",
      acceptableAnswers: ["615"],
      markingGuide:
        "Award full credit for selecting the partition-and-add working or giving 615.",
      workedSolution:
        "Add hundreds, tens and ones: 500 + 100 + 15 = 615. The 15 ones regroup as 1 ten and 5 ones.",
      misconceptionTargets: [
        "addition-regrouping-error",
        "place-value-partitioning-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-addition-and-subtraction-strategies",
        ifCorrectGoToStepKey: "use-addition-and-subtraction-strategies",
        practiceRecommendation:
          "Practise partitioning addends and regrouping ones or tens when totals pass 10.",
        diagnosticNote:
          "This item checks whether the learner can identify correct addition working with regrouping.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a hundreds-tens-ones table to combine place-value parts.",
      },
    },
    {
      id: "place-value-ops-subtraction-working-008",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-addition-and-subtraction-strategies",
      subElementKey: "addition-and-subtraction-strategies",
      subElementTitle: "Addition and subtraction strategies",
      subElementDescription:
        "Use efficient mental and written strategies for addition and subtraction.",
      title: "Select correct subtraction working",
      prompt: "Which working correctly calculates 604 - 278?",
      difficulty: "secure",
      answerType: "select_correct_working",
      format: "subtraction_strategy",
      structuredOptions: [
        {
          id: "rename-and-subtract",
          label: "604 = 5 hundreds, 9 tens and 14 ones. Then subtract 278 to get 326.",
        },
        {
          id: "subtract-smaller-digits",
          label: "604 - 278 = 474 because 8 - 4 = 4 and 7 - 0 = 7.",
        },
        {
          id: "subtract-without-renaming",
          label: "604 - 278 = 436 because 6 - 2 = 4, 0 - 7 = 3, and 4 - 8 = 6.",
        },
        {
          id: "subtract-hundreds-only",
          label: "604 - 278 = 400 because 600 - 200 = 400.",
        },
      ],
      correctWorkingOptionId: "rename-and-subtract",
      expectedAnswer: "326",
      acceptableAnswers: ["326"],
      markingGuide:
        "Award full credit for selecting the renaming strategy or giving 326.",
      workedSolution:
        "Regroup 604 as 5 hundreds, 9 tens and 14 ones. Then 14 - 8 = 6, 9 - 7 = 2, and 5 - 2 = 3, so the answer is 326.",
      misconceptionTargets: [
        "subtraction-regrouping-error",
        "operation-inverse-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-addition-and-subtraction-strategies",
        ifCorrectGoToStepKey: "use-multiplication-and-division-foundations",
        practiceRecommendation:
          "Practise renaming hundreds and tens before subtracting when a place does not have enough.",
        diagnosticNote:
          "This item checks whether the learner recognises correct subtraction with regrouping across a zero.",
      },
      visualSupport: {
        type: "table",
        description:
          "Show 604 renamed as 5 hundreds, 9 tens and 14 ones before subtracting.",
      },
    },
    {
      id: "place-value-ops-missing-equation-009",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-addition-and-subtraction-strategies",
      subElementKey: "addition-and-subtraction-strategies",
      subElementTitle: "Addition and subtraction strategies",
      subElementDescription:
        "Use efficient mental and written strategies for addition and subtraction.",
      title: "Complete a missing-value equation",
      prompt: "Complete the number sentence: 438 + __ = 500.",
      difficulty: "secure",
      answerType: "short_symbolic",
      format: "operation_equation",
      expectedAnswer: "62",
      acceptableAnswers: ["62", "+62"],
      markingGuide:
        "Award full credit for 62.",
      workedSolution:
        "Count from 438 to 500: 438 + 60 = 498, then add 2 more. The missing value is 62.",
      misconceptionTargets: [
        "operation-inverse-confusion",
        "addition-regrouping-error",
        "subtraction-regrouping-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-addition-and-subtraction-strategies",
        ifCorrectGoToStepKey: "use-multiplication-and-division-foundations",
        practiceRecommendation:
          "Practise using subtraction or counting-on to find missing addends.",
        diagnosticNote:
          "This item checks whether the learner understands addition and subtraction as inverse operations.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a jump strategy from 438 to 500 on an open number line.",
      },
    },
    {
      id: "place-value-ops-array-classification-010",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-multiplication-and-division-foundations",
      subElementKey: "multiplication-and-division-foundations",
      subElementTitle: "Multiplication and division foundations",
      subElementDescription:
        "Use equal groups, arrays, facts and basic division reasoning.",
      title: "Classify multiplication representations",
      prompt: "Classify each representation as matching 4 x 6 or not matching 4 x 6.",
      difficulty: "secure",
      answerType: "classification",
      format: "equal_groups_and_arrays",
      classificationCategories: [
        { id: "matches", label: "Matches 4 x 6" },
        { id: "does-not-match", label: "Does not match 4 x 6" },
      ],
      classificationItems: [
        { id: "four-groups-six", label: "4 groups of 6", correctCategoryId: "matches" },
        { id: "array-four-by-six", label: "An array with 4 rows of 6", correctCategoryId: "matches" },
        { id: "four-plus-six", label: "4 + 6", correctCategoryId: "does-not-match" },
        { id: "six-groups-four", label: "6 groups of 4", correctCategoryId: "matches" },
      ],
      expectedAnswer:
        "4 groups of 6, an array with 4 rows of 6, and 6 groups of 4 match 4 x 6; 4 + 6 does not.",
      acceptableAnswers: [
        "4 groups of 6, an array with 4 rows of 6, and 6 groups of 4 match 4 x 6; 4 + 6 does not.",
      ],
      markingGuide:
        "Award full credit for classifying the three multiplicative representations as matching 24 and 4 + 6 as not matching.",
      workedSolution:
        "4 x 6 means four groups of six, which is 24. A 4 by 6 array and 6 groups of 4 also show 24. But 4 + 6 is only 10.",
      misconceptionTargets: [
        "multiplication-equal-groups-confusion",
        "fact-family-relationship-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-multiplication-and-division-foundations",
        ifCorrectGoToStepKey: "use-multiplication-and-division-foundations",
        practiceRecommendation:
          "Practise connecting multiplication facts to equal groups and arrays.",
        diagnosticNote:
          "This item checks whether the learner sees multiplication as equal groups or arrays rather than ordinary addition of two numbers.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use array and equal-group descriptions for the same multiplication fact.",
      },
    },
    {
      id: "place-value-ops-division-sharing-011",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-multiplication-and-division-foundations",
      subElementKey: "multiplication-and-division-foundations",
      subElementTitle: "Multiplication and division foundations",
      subElementDescription:
        "Use equal groups, arrays, facts and basic division reasoning.",
      title: "Solve an equal-sharing problem",
      prompt:
        "36 stickers are shared equally between 4 learners. How many stickers does each learner get?",
      difficulty: "extension",
      answerType: "numeric",
      format: "division_sharing",
      expectedAnswer: "9",
      acceptableAnswers: ["9"],
      markingGuide:
        "Award full credit for 9 stickers.",
      workedSolution:
        "36 shared equally between 4 means 36 / 4. Since 4 x 9 = 36, each learner gets 9 stickers.",
      misconceptionTargets: [
        "division-sharing-grouping-confusion",
        "fact-family-relationship-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-multiplication-and-division-foundations",
        ifCorrectGoToStepKey: "use-multiplication-and-division-foundations",
        practiceRecommendation:
          "Practise using multiplication facts to solve equal-sharing division problems.",
        diagnosticNote:
          "This item checks whether the learner can interpret division as equal sharing and connect it to a multiplication fact.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Show 36 stickers being shared into 4 equal groups.",
      },
    },
    {
      id: "place-value-ops-multiplication-explanation-012",
      progressionBandKey: NUMBER_PLACE_VALUE_OPERATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-multiplication-and-division-foundations",
      subElementKey: "multiplication-and-division-foundations",
      subElementTitle: "Multiplication and division foundations",
      subElementDescription:
        "Use equal groups, arrays, facts and basic division reasoning.",
      title: "Explain a multiplication and division misconception",
      prompt:
        "A learner says 5 x 4 and 5 + 4 are the same because both use 5 and 4. Which explanation is best?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "operation_reasoning",
      structuredOptions: [
        {
          id: "equal-groups-explanation",
          label: "5 x 4 means 5 equal groups of 4, which is 20. 5 + 4 means combine 5 and 4, which is 9.",
        },
        {
          id: "same-numbers-same-answer",
          label: "They are the same because the same two numbers are used.",
        },
        {
          id: "multiplication-always-smaller",
          label: "They are different because multiplication always gives a smaller answer.",
        },
        {
          id: "addition-is-groups",
          label: "5 + 4 means 5 groups of 4, so it also equals 20.",
        },
      ],
      bestExplanationOptionId: "equal-groups-explanation",
      expectedAnswer:
        "5 x 4 means 5 equal groups of 4, which is 20. 5 + 4 means combine 5 and 4, which is 9.",
      acceptableAnswers: [
        "5 x 4 means 5 equal groups of 4, which is 20. 5 + 4 means combine 5 and 4, which is 9.",
      ],
      markingGuide:
        "Award full credit for the explanation that multiplication represents equal groups while addition combines quantities.",
      workedSolution:
        "Multiplication and addition are different operations. 5 x 4 is 5 groups of 4, or 20. 5 + 4 is 9.",
      misconceptionTargets: [
        "multiplication-equal-groups-confusion",
        "operation-inverse-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-multiplication-and-division-foundations",
        ifCorrectGoToStepKey: "use-multiplication-and-division-foundations",
        practiceRecommendation:
          "Practise explaining multiplication as equal groups and contrasting it with addition.",
        diagnosticNote:
          "This item checks whether the learner can explain the difference between multiplication and addition using equal groups.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Compare 5 groups of 4 with a single group made by joining 5 and 4.",
      },
    },
  ];

export function getNumberPlaceValueOperationsAssessmentItemById(id: string) {
  return (
    NUMBER_PLACE_VALUE_OPERATIONS_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberPlaceValueOperationsAssessmentItemsByStep(
  stepKey: NumberPlaceValueOperationsProgressionStepKey,
) {
  return NUMBER_PLACE_VALUE_OPERATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberPlaceValueOperationsAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_PLACE_VALUE_OPERATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberPlaceValueOperationsAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_PLACE_VALUE_OPERATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
