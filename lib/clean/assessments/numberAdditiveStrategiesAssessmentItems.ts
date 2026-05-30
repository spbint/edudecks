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

export type NumberAdditiveStrategiesProgressionBandKey =
  "additive-strategies-and-problem-solving";

export type NumberAdditiveStrategiesProgressionStepKey =
  | "use-mental-addition-strategies"
  | "use-mental-subtraction-strategies"
  | "use-written-addition-and-subtraction-strategies"
  | "solve-additive-problem-solving-contexts";

export type NumberAdditiveStrategiesAssessmentFormat =
  | "place_value_addition"
  | "addition_compensation"
  | "mental_addition_working"
  | "subtraction_counting_on"
  | "subtraction_compensation"
  | "subtraction_reasoning"
  | "written_addition_regrouping"
  | "written_subtraction_regrouping"
  | "missing_number_equation"
  | "additive_context_classification"
  | "multi_step_additive_context"
  | "reasonableness_checking";

export type NumberAdditiveStrategiesMisconceptionCode =
  | "place-value-addition-error"
  | "compensation-strategy-error"
  | "friendly-number-strategy-gap"
  | "counting-on-subtraction-error"
  | "subtraction-as-take-away-only-error"
  | "regrouping-addition-error"
  | "regrouping-subtraction-error"
  | "missing-number-equation-error"
  | "operation-choice-additive-error"
  | "comparison-difference-context-error"
  | "multi-step-additive-context-error"
  | "reasonableness-checking-gap";

export type NumberAdditiveStrategiesAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberAdditiveStrategiesProgressionStepKey;
  ifCorrectGoToStepKey?: NumberAdditiveStrategiesProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberAdditiveStrategiesAssessmentItem = {
  id: string;
  progressionBandKey: NumberAdditiveStrategiesProgressionBandKey;
  progressionStepKey: NumberAdditiveStrategiesProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberAdditiveStrategiesAssessmentFormat;
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
  misconceptionTargets: NumberAdditiveStrategiesMisconceptionCode[];
  adaptiveRoute: NumberAdditiveStrategiesAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_ADDITIVE_STRATEGIES_ITEM_BANK_KEY =
  "number-additive-strategies-assessment-items-v1";

export const NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY: NumberAdditiveStrategiesProgressionBandKey =
  "additive-strategies-and-problem-solving";

export const NUMBER_ADDITIVE_STRATEGIES_ASSESSMENT_ITEMS: NumberAdditiveStrategiesAssessmentItem[] =
  [
    {
      id: "additive-strategies-place-value-addition-001",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-mental-addition-strategies",
      subElementKey: "mental-addition-strategies",
      subElementTitle: "Mental addition strategies",
      subElementDescription:
        "Use place value, compensation and friendly numbers to add efficiently.",
      title: "Add with place-value parts",
      prompt: "Use place-value partitioning to calculate 346 + 230.",
      difficulty: "foundation",
      answerType: "numeric",
      format: "place_value_addition",
      expectedAnswer: "576",
      acceptableAnswers: ["576"],
      markingGuide:
        "Award full credit for 576, including equivalent working that partitions by hundreds, tens and ones.",
      workedSolution:
        "346 is 300 + 40 + 6. Add 230 as 200 + 30. Hundreds: 300 + 200 = 500. Tens: 40 + 30 = 70. Ones: 6. Total = 576.",
      misconceptionTargets: ["place-value-addition-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-mental-addition-strategies",
        ifCorrectGoToStepKey: "use-mental-addition-strategies",
        practiceRecommendation:
          "Practise partitioning both addends into place-value parts before adding.",
        diagnosticNote:
          "This item checks whether the learner can use place value to combine hundreds, tens and ones accurately.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a place-value table showing hundreds, tens and ones for 346 and 230.",
      },
    },
    {
      id: "additive-strategies-compensation-002",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-mental-addition-strategies",
      subElementKey: "mental-addition-strategies",
      subElementTitle: "Mental addition strategies",
      subElementDescription:
        "Use place value, compensation and friendly numbers to add efficiently.",
      title: "Use compensation for addition",
      prompt:
        "True or false: 298 + 47 can be solved as 300 + 47 - 2. If true, choose the result.",
      difficulty: "foundation",
      answerType: "true_false_correction",
      format: "addition_compensation",
      trueFalseStatement: "298 + 47 can be solved as 300 + 47 - 2.",
      correctBoolean: true,
      correctionOptions: [
        "True. 300 + 47 = 347, then subtract 2 to get 345.",
        "False. Adding 2 to 298 means the answer must stay 347.",
        "False. 298 + 47 should be 300 + 47 + 2.",
      ],
      correctCorrection:
        "True. 300 + 47 = 347, then subtract 2 to get 345.",
      expectedAnswer: "345",
      acceptableAnswers: ["345"],
      markingGuide:
        "Award full credit for identifying the compensation as true and selecting 345.",
      workedSolution:
        "298 is 2 less than 300. Use the friendly number 300, then compensate by subtracting 2: 300 + 47 - 2 = 345.",
      misconceptionTargets: [
        "compensation-strategy-error",
        "friendly-number-strategy-gap",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-mental-addition-strategies",
        ifCorrectGoToStepKey: "use-mental-subtraction-strategies",
        practiceRecommendation:
          "Practise adjusting one addend to a friendly number and compensating in the opposite direction.",
        diagnosticNote:
          "This item checks whether the learner can use compensation without changing the total incorrectly.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a number line to show 298 moving up 2 to 300, then compensating by subtracting 2 from the final total.",
      },
    },
    {
      id: "additive-strategies-mental-addition-working-003",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-mental-addition-strategies",
      subElementKey: "mental-addition-strategies",
      subElementTitle: "Mental addition strategies",
      subElementDescription:
        "Use place value, compensation and friendly numbers to add efficiently.",
      title: "Choose correct mental addition working",
      prompt: "Which working correctly calculates 399 + 126?",
      difficulty: "foundation",
      answerType: "select_correct_working",
      format: "mental_addition_working",
      structuredOptions: [
        {
          id: "add-one-compensate",
          label: "400 + 126 = 526, then subtract 1, so the answer is 525.",
        },
        {
          id: "add-one-keep",
          label: "400 + 126 = 526, so the answer is 526.",
        },
        {
          id: "subtract-one",
          label: "398 + 126 = 524, so the answer is 524.",
        },
        {
          id: "hundreds-only",
          label: "300 + 100 = 400, so the answer is 400.",
        },
      ],
      correctWorkingOptionId: "add-one-compensate",
      expectedAnswer: "525",
      acceptableAnswers: ["525"],
      markingGuide:
        "Award full credit for choosing the working that compensates after changing 399 to 400.",
      workedSolution:
        "399 is 1 less than 400. Add 400 + 126 = 526, then subtract 1 to compensate. The answer is 525.",
      misconceptionTargets: [
        "compensation-strategy-error",
        "friendly-number-strategy-gap",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-mental-addition-strategies",
        ifCorrectGoToStepKey: "use-mental-subtraction-strategies",
        practiceRecommendation:
          "Practise choosing efficient mental addition strategies and checking that compensation keeps the total unchanged.",
        diagnosticNote:
          "This item checks whether the learner can choose a correct mental addition strategy using a friendly number.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line showing the adjustment from 399 to 400 and the compensation step.",
      },
    },
    {
      id: "additive-strategies-counting-on-004",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-mental-subtraction-strategies",
      subElementKey: "mental-subtraction-strategies",
      subElementTitle: "Mental subtraction strategies",
      subElementDescription:
        "Use counting on, compensation and place value to subtract efficiently.",
      title: "Subtract by counting on",
      prompt: "Use counting on to find 503 - 478.",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "subtraction_counting_on",
      gapText: "478 to 500 is 22, and 500 to 503 is 3, so 503 - 478 = __.",
      gapAnswer: "25",
      gapAcceptableAnswers: ["25"],
      expectedAnswer: "25",
      acceptableAnswers: ["25"],
      markingGuide:
        "Award full credit for 25 using counting on or another valid subtraction strategy.",
      workedSolution:
        "Count up from 478 to 503: +22 reaches 500, then +3 reaches 503. The difference is 22 + 3 = 25.",
      misconceptionTargets: [
        "counting-on-subtraction-error",
        "subtraction-as-take-away-only-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-mental-subtraction-strategies",
        ifCorrectGoToStepKey: "use-mental-subtraction-strategies",
        practiceRecommendation:
          "Practise subtraction as finding the difference by counting on to a friendly number.",
        diagnosticNote:
          "This item checks whether the learner can use counting on for subtraction when the numbers are close together.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line from 478 to 503 with jumps to 500 and then 503.",
      },
    },
    {
      id: "additive-strategies-subtraction-compensation-005",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-mental-subtraction-strategies",
      subElementKey: "mental-subtraction-strategies",
      subElementTitle: "Mental subtraction strategies",
      subElementDescription:
        "Use counting on, compensation and place value to subtract efficiently.",
      title: "Use compensation for subtraction",
      prompt: "Which expression is equivalent to 752 - 198?",
      difficulty: "developing",
      answerType: "multiple_choice",
      format: "subtraction_compensation",
      options: [
        "752 - 200 + 2",
        "752 - 200 - 2",
        "752 + 200 - 2",
        "752 - 100 - 98 - 2",
      ],
      expectedAnswer: "752 - 200 + 2",
      acceptableAnswers: ["752 - 200 + 2", "554"],
      markingGuide:
        "Award full credit for recognising that subtracting 198 can be done by subtracting 200 and adding 2 back.",
      workedSolution:
        "198 is 2 less than 200. If you subtract 200, you subtract 2 too many, so add 2 back: 752 - 200 + 2 = 554.",
      misconceptionTargets: ["compensation-strategy-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-mental-subtraction-strategies",
        ifCorrectGoToStepKey: "use-written-addition-and-subtraction-strategies",
        practiceRecommendation:
          "Practise subtracting near-friendly numbers and compensating for how much extra was subtracted.",
        diagnosticNote:
          "This item checks whether the learner compensates correctly when subtracting a number near a hundred.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a number line to show subtracting 200, then adding 2 back.",
      },
    },
    {
      id: "additive-strategies-subtraction-explanation-006",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-mental-subtraction-strategies",
      subElementKey: "mental-subtraction-strategies",
      subElementTitle: "Mental subtraction strategies",
      subElementDescription:
        "Use counting on, compensation and place value to subtract efficiently.",
      title: "Explain a subtraction misconception",
      prompt:
        "A learner says 603 - 597 is hard because you must always take away using columns. Which explanation is best?",
      difficulty: "developing",
      answerType: "choose_best_explanation",
      format: "subtraction_reasoning",
      structuredOptions: [
        {
          id: "difference",
          label: "Use difference thinking: 597 to 600 is 3, then 600 to 603 is 3, so the difference is 6.",
        },
        {
          id: "always-columns",
          label: "The only correct way is column subtraction, even when numbers are close.",
        },
        {
          id: "subtract-digits",
          label: "Subtract the smaller digit from the larger digit in each place to get 194.",
        },
        {
          id: "add-both",
          label: "Add 603 and 597 because subtraction and addition are the same.",
        },
      ],
      bestExplanationOptionId: "difference",
      expectedAnswer:
        "Use difference thinking: 597 to 600 is 3, then 600 to 603 is 3, so the difference is 6.",
      acceptableAnswers: [
        "Use difference thinking: 597 to 600 is 3, then 600 to 603 is 3, so the difference is 6.",
        "6",
      ],
      markingGuide:
        "Award full credit for selecting the explanation that uses counting on to find a small difference.",
      workedSolution:
        "Subtraction can mean finding the difference. Since 597 and 603 are close, count on: 3 + 3 = 6.",
      misconceptionTargets: [
        "subtraction-as-take-away-only-error",
        "counting-on-subtraction-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "use-mental-subtraction-strategies",
        ifCorrectGoToStepKey: "use-written-addition-and-subtraction-strategies",
        practiceRecommendation:
          "Practise choosing counting-on when two numbers are close together.",
        diagnosticNote:
          "This item checks whether the learner understands subtraction as difference, not only take-away with columns.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line from 597 to 603 with jumps through 600.",
      },
    },
    {
      id: "additive-strategies-written-addition-007",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-written-addition-and-subtraction-strategies",
      subElementKey: "written-addition-and-subtraction",
      subElementTitle: "Written addition and subtraction",
      subElementDescription:
        "Use written strategies, regrouping and renaming accurately.",
      title: "Written addition with regrouping",
      prompt: "Calculate 458 + 367 using a written or place-value strategy.",
      difficulty: "developing",
      answerType: "short_symbolic",
      format: "written_addition_regrouping",
      expectedAnswer: "825",
      acceptableAnswers: ["825"],
      markingGuide:
        "Award full credit for 825 with regrouping of ones and tens handled correctly.",
      workedSolution:
        "8 + 7 = 15 ones, so write 5 ones and regroup 1 ten. 5 tens + 6 tens + 1 ten = 12 tens, so write 2 tens and regroup 1 hundred. 4 hundreds + 3 hundreds + 1 hundred = 8 hundreds. Total = 825.",
      misconceptionTargets: ["regrouping-addition-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "use-written-addition-and-subtraction-strategies",
        ifCorrectGoToStepKey: "use-written-addition-and-subtraction-strategies",
        practiceRecommendation:
          "Practise written addition where both ones and tens need regrouping.",
        diagnosticNote:
          "This item checks whether the learner can regroup accurately in written addition.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a place-value table with columns aligned for hundreds, tens and ones.",
      },
    },
    {
      id: "additive-strategies-written-subtraction-008",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-written-addition-and-subtraction-strategies",
      subElementKey: "written-addition-and-subtraction",
      subElementTitle: "Written addition and subtraction",
      subElementDescription:
        "Use written strategies, regrouping and renaming accurately.",
      title: "Written subtraction with renaming",
      prompt: "Which working correctly calculates 704 - 368?",
      difficulty: "secure",
      answerType: "select_correct_working",
      format: "written_subtraction_regrouping",
      structuredOptions: [
        {
          id: "rename",
          label: "Rename 704 as 6 hundreds, 9 tens and 14 ones, then subtract to get 336.",
        },
        {
          id: "subtract-up",
          label: "Use 8 - 4 and 6 - 0, so the answer is 464.",
        },
        {
          id: "ignore-zero",
          label: "Ignore the zero tens and subtract 7 hundreds - 3 hundreds to get 400.",
        },
        {
          id: "subtract-ones-only",
          label: "Subtract only the ones, so the answer is 696.",
        },
      ],
      correctWorkingOptionId: "rename",
      expectedAnswer: "336",
      acceptableAnswers: ["336"],
      markingGuide:
        "Award full credit for selecting the renaming strategy or giving 336.",
      workedSolution:
        "704 needs renaming because there are not enough ones or tens. Rename 704 as 6 hundreds, 9 tens and 14 ones. Then subtract 368 to get 336.",
      misconceptionTargets: ["regrouping-subtraction-error"],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "use-written-addition-and-subtraction-strategies",
        ifCorrectGoToStepKey: "solve-additive-problem-solving-contexts",
        practiceRecommendation:
          "Practise renaming through a zero in written subtraction.",
        diagnosticNote:
          "This item checks whether the learner can rename hundreds and tens accurately before subtracting.",
      },
      visualSupport: {
        type: "table",
        description:
          "Show 704 renamed in a hundreds-tens-ones table before subtracting 368.",
      },
    },
    {
      id: "additive-strategies-missing-equation-009",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "use-written-addition-and-subtraction-strategies",
      subElementKey: "written-addition-and-subtraction",
      subElementTitle: "Written addition and subtraction",
      subElementDescription:
        "Use written strategies, regrouping and renaming accurately.",
      title: "Find a missing number",
      prompt: "Complete the equation: 920 - __ = 575.",
      difficulty: "secure",
      answerType: "fill_gap",
      format: "missing_number_equation",
      gapText: "920 - __ = 575",
      gapAnswer: "345",
      gapAcceptableAnswers: ["345"],
      expectedAnswer: "345",
      acceptableAnswers: ["345"],
      markingGuide:
        "Award full credit for 345, found by 920 - 575 or by counting on from 575 to 920.",
      workedSolution:
        "Use inverse thinking: 920 - 575 = 345. Check: 575 + 345 = 920.",
      misconceptionTargets: [
        "missing-number-equation-error",
        "regrouping-subtraction-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey:
          "use-written-addition-and-subtraction-strategies",
        ifCorrectGoToStepKey: "solve-additive-problem-solving-contexts",
        practiceRecommendation:
          "Practise using inverse operations to solve missing-number equations.",
        diagnosticNote:
          "This item checks whether the learner can choose the correct inverse relationship in a missing-number subtraction equation.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open number line to count on from 575 to 920, or a place-value table for 920 - 575.",
      },
    },
    {
      id: "additive-strategies-context-classification-010",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-additive-problem-solving-contexts",
      subElementKey: "additive-problem-solving",
      subElementTitle: "Additive problem solving",
      subElementDescription:
        "Choose addition or subtraction strategies in one-step and simple multi-step contexts.",
      title: "Classify additive contexts",
      prompt: "Classify each context by the operation idea it uses.",
      difficulty: "secure",
      answerType: "classification",
      format: "additive_context_classification",
      classificationCategories: [
        { id: "addition", label: "Addition: combine" },
        { id: "subtraction", label: "Subtraction: take away" },
        { id: "difference", label: "Comparison/difference" },
      ],
      classificationItems: [
        {
          id: "combine-books",
          label: "A class has 128 fiction books and 96 non-fiction books. How many books altogether?",
          correctCategoryId: "addition",
        },
        {
          id: "spent-money",
          label: "Mia had $250 and spent $85. How much is left?",
          correctCategoryId: "subtraction",
        },
        {
          id: "compare-scores",
          label: "Team A scored 416 points and Team B scored 389. How many more did Team A score?",
          correctCategoryId: "difference",
        },
      ],
      expectedAnswer:
        "Books = addition; money left = subtraction; score comparison = difference.",
      acceptableAnswers: [
        "Books = addition; money left = subtraction; score comparison = difference.",
      ],
      markingGuide:
        "Award full credit for classifying all three contexts by additive structure.",
      workedSolution:
        "Combining two amounts uses addition. Taking away uses subtraction. Asking how many more or fewer uses comparison/difference.",
      misconceptionTargets: [
        "operation-choice-additive-error",
        "comparison-difference-context-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-additive-problem-solving-contexts",
        ifCorrectGoToStepKey: "solve-additive-problem-solving-contexts",
        practiceRecommendation:
          "Practise identifying whether a story is combining, taking away, or comparing two amounts.",
        diagnosticNote:
          "This item checks whether the learner can choose the operation idea from the structure of the context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use three context cards showing combine, take-away and comparison situations.",
      },
    },
    {
      id: "additive-strategies-multi-step-context-011",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-additive-problem-solving-contexts",
      subElementKey: "additive-problem-solving",
      subElementTitle: "Additive problem solving",
      subElementDescription:
        "Choose addition or subtraction strategies in one-step and simple multi-step contexts.",
      title: "Solve a multi-step additive context",
      prompt:
        "A school garden had 245 seedlings. Students planted 118 more, then gave 76 seedlings to another class. How many seedlings are in the garden now?",
      difficulty: "extension",
      answerType: "numeric",
      format: "multi_step_additive_context",
      expectedAnswer: "287",
      acceptableAnswers: ["287"],
      markingGuide:
        "Award full credit for 287 with both the addition and subtraction steps represented.",
      workedSolution:
        "First add the new seedlings: 245 + 118 = 363. Then subtract the seedlings given away: 363 - 76 = 287.",
      misconceptionTargets: [
        "multi-step-additive-context-error",
        "operation-choice-additive-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-additive-problem-solving-contexts",
        ifCorrectGoToStepKey: "solve-additive-problem-solving-contexts",
        practiceRecommendation:
          "Practise reading each action in a multi-step additive story and deciding whether it adds to or subtracts from the total.",
        diagnosticNote:
          "This item checks whether the learner can track a total through a simple add-then-subtract context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a part-part-whole or bar-model context card showing start, add, then subtract.",
      },
    },
    {
      id: "additive-strategies-reasonableness-012",
      progressionBandKey: NUMBER_ADDITIVE_STRATEGIES_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-additive-problem-solving-contexts",
      subElementKey: "additive-problem-solving",
      subElementTitle: "Additive problem solving",
      subElementDescription:
        "Choose addition or subtraction strategies in one-step and simple multi-step contexts.",
      title: "Choose a strategy and check reasonableness",
      prompt:
        "A learner calculates 489 + 312 = 701. Which explanation best checks whether the answer is reasonable?",
      difficulty: "extension",
      answerType: "choose_best_explanation",
      format: "reasonableness_checking",
      structuredOptions: [
        {
          id: "estimate",
          label: "Estimate 489 as about 500 and 312 as about 300. The sum should be about 800, so 701 is probably too low.",
        },
        {
          id: "last-digit",
          label: "Only check the last digit. Since 9 + 2 ends in 1, 701 must be right.",
        },
        {
          id: "smaller-than-addends",
          label: "701 is larger than 312, so it must be correct.",
        },
        {
          id: "ignore-estimate",
          label: "Reasonableness is not useful for addition.",
        },
      ],
      bestExplanationOptionId: "estimate",
      expectedAnswer:
        "Estimate 489 as about 500 and 312 as about 300. The sum should be about 800, so 701 is probably too low.",
      acceptableAnswers: [
        "Estimate 489 as about 500 and 312 as about 300. The sum should be about 800, so 701 is probably too low.",
      ],
      markingGuide:
        "Award full credit for choosing the estimate that shows 701 is not reasonable.",
      workedSolution:
        "489 is close to 500 and 312 is close to 300. 500 + 300 = 800, so an answer near 800 is expected. The exact sum is 801, so 701 is too low.",
      misconceptionTargets: [
        "reasonableness-checking-gap",
        "place-value-addition-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-additive-problem-solving-contexts",
        ifCorrectGoToStepKey: "solve-additive-problem-solving-contexts",
        practiceRecommendation:
          "Practise estimating before or after calculation to check whether an answer makes sense.",
        diagnosticNote:
          "This item checks whether the learner can use estimation to catch an unreasonable additive answer.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use benchmark numbers 500 and 300 to estimate a total near 800 on a number line.",
      },
    },
  ];

export function getNumberAdditiveStrategiesAssessmentItemById(id: string) {
  return (
    NUMBER_ADDITIVE_STRATEGIES_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberAdditiveStrategiesAssessmentItemsByStep(
  stepKey: NumberAdditiveStrategiesProgressionStepKey,
) {
  return NUMBER_ADDITIVE_STRATEGIES_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberAdditiveStrategiesAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_ADDITIVE_STRATEGIES_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberAdditiveStrategiesAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_ADDITIVE_STRATEGIES_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
