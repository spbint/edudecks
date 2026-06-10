import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberIntegersCoordinatesPropertiesAssessmentItems";
import { NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPercentRatioFinanceAssessmentItems";

export type LowerSecondaryStepAssessmentDefinition = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  parentBankKey: NumberAssessmentBankKey;
  parentBankTitle: string;
  parentItemBankKey: string;
  progressionBandKey: string;
  items: NumberAssessmentBankItem[];
};

type Seed = {
  cluster: string;
  clusterTitle: string;
  title: string;
  prompt: string;
  options: string[];
  answer: string;
  visual: string;
  misconceptionTargets: string[];
};

const STEP_NUMBER = 41;
const STEP_KEY = "work-fluently-with-integers-decimals-fractions-and-percentages";
const PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::lower-secondary::work-fluently-with-integers-decimals-fractions-and-percentages";
const STEP_42_NUMBER = 42;
const STEP_42_KEY = "understand-negative-numbers-and-number-lines";
const STEP_42_PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::lower-secondary::understand-negative-numbers-and-number-lines";

function visual(description: string) {
  return { type: "context_card" as const, description };
}

function makeItem(seed: Seed, index: number): NumberAssessmentBankItem {
  return {
    id: `number-step-${STEP_NUMBER}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: "percentages-ratio-financial-modelling",
    progressionStepKey: STEP_KEY,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription:
      "Use integers, decimals, fractions and percentages flexibly, and choose useful forms for the task.",
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "lower_secondary_number_form_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: STEP_KEY,
      ifCorrectGoToStepKey: STEP_KEY,
      practiceRecommendation:
        "Practise switching between integer, decimal, fraction and percentage forms.",
      diagnosticNote:
        "This checks flexible number-form conversion, comparison and context reasoning for this pathway step.",
    },
    visualSupport: visual(seed.visual),
  };
}

function makeStep42Item(seed: Seed, index: number): NumberAssessmentBankItem {
  return {
    id: `number-step-${STEP_42_NUMBER}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: "integers-coordinates-number-properties",
    progressionStepKey: STEP_42_KEY,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription:
      "Use negative numbers and number lines to reason about direction, comparison and real-world contexts below zero.",
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "lower_secondary_negative_number_line_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: STEP_42_KEY,
      ifCorrectGoToStepKey: STEP_42_KEY,
      practiceRecommendation:
        "Practise using zero, direction and number lines to compare and move with negative numbers.",
      diagnosticNote:
        "This checks negative-number direction, comparison, ordering and context reasoning for this pathway step.",
    },
    visualSupport: visual(seed.visual),
  };
}

const seeds: Seed[] = [
  {
    cluster: "decimal-to-fraction",
    clusterTitle: "Decimal to fraction",
    title: "Write a decimal as a fraction",
    prompt: "Write 0.25 as a fraction in simplest form.",
    options: ["1/4", "25/10", "1/2"],
    answer: "1/4",
    visual:
      "early-number|caption=Switch from decimal to simplest fraction.|numbers=0.25,1/4|labels=decimal,simplest fraction",
    misconceptionTargets: ["decimal-place-value-fraction-error", "fraction-simplification-gap"],
  },
  {
    cluster: "fraction-to-decimal",
    clusterTitle: "Fraction to decimal",
    title: "Write a fraction as a decimal",
    prompt: "Write 3/4 as a decimal.",
    options: ["0.75", "0.34", "0.3"],
    answer: "0.75",
    visual:
      "early-number|caption=Switch from fraction to decimal.|numbers=3/4,0.75|labels=fraction,decimal",
    misconceptionTargets: ["fraction-decimal-connection-gap", "division-interpretation-gap"],
  },
  {
    cluster: "decimal-to-percentage",
    clusterTitle: "Decimal to percentage",
    title: "Write a decimal as a percentage",
    prompt: "Write 0.18 as a percentage.",
    options: ["18%", "1.8%", "180%"],
    answer: "18%",
    visual:
      "early-number|caption=Switch from decimal to percentage.|numbers=0.18,18%|labels=decimal,percentage",
    misconceptionTargets: ["percent-place-value-error", "decimal-percent-scale-gap"],
  },
  {
    cluster: "percentage-to-decimal",
    clusterTitle: "Percentage to decimal",
    title: "Write a percentage as a decimal",
    prompt: "Write 72.5% as a decimal.",
    options: ["0.725", "7.25", "72.5"],
    answer: "0.725",
    visual:
      "early-number|caption=Switch from percentage to decimal.|numbers=72.5%,0.725|labels=percentage,decimal",
    misconceptionTargets: ["percent-decimal-scale-error", "place-value-shift-gap"],
  },
  {
    cluster: "mixed-form-comparison",
    clusterTitle: "Mixed form comparison",
    title: "Compare a percentage and decimal",
    prompt: "Use <, > or =: 25% __ 0.2",
    options: ["<", ">", "="],
    answer: ">",
    visual:
      "early-number|caption=Convert both values to compare them.|numbers=25%,0.2,>|labels=left,right,symbol",
    misconceptionTargets: ["mixed-form-comparison-error", "percent-decimal-connection-gap"],
  },
  {
    cluster: "integer-comparison",
    clusterTitle: "Integer and decimal comparison",
    title: "Compare negative values",
    prompt: "Use <, > or =: -3 __ -2.5",
    options: ["<", ">", "="],
    answer: "<",
    visual:
      "early-number|caption=Compare negative numbers by position on the number line.|numbers=-3,-2.5,<|labels=left,right,symbol",
    misconceptionTargets: ["negative-number-order-error", "number-line-direction-gap"],
  },
  {
    cluster: "negative-equivalent-forms",
    clusterTitle: "Negative equivalent forms",
    title: "Compare a negative decimal and percentage",
    prompt: "Use <, > or =: -1.2 __ -120%",
    options: ["<", ">", "="],
    answer: "=",
    visual:
      "early-number|caption=Switch percentage to decimal before comparing.|numbers=-1.2,-120%,=|labels=decimal,percentage,symbol",
    misconceptionTargets: ["negative-percent-conversion-error", "equivalent-form-gap"],
  },
  {
    cluster: "real-world-percentages",
    clusterTitle: "Real-world percentages",
    title: "Find a sale price",
    prompt:
      "A jacket is on sale for 30% off. The original price is $64.40. What is the sale price?",
    options: ["$45.08", "$34.40", "$19.32"],
    answer: "$45.08",
    visual:
      "early-number|caption=30% off means 70% of the original price.|numbers=$64.40,30%,70%,$45.08|labels=original,discount,pay,price",
    misconceptionTargets: ["discount-base-error", "percentage-of-money-gap"],
  },
  {
    cluster: "fraction-of-quantity",
    clusterTitle: "Fraction and percent of a quantity",
    title: "Find a percentage of pieces",
    prompt: "A chocolate bar has 24 pieces. Mark eats 40% of the pieces. How many pieces did he eat?",
    options: ["9.6 pieces", "10 pieces", "8 pieces"],
    answer: "9.6 pieces",
    visual:
      "early-number|caption=Use 40% as 0.4 of the quantity.|numbers=24,40%,0.4,9.6|labels=pieces,percent,decimal,eaten",
    misconceptionTargets: ["percent-of-quantity-error", "context-rounding-gap"],
  },
  {
    cluster: "best-form-context",
    clusterTitle: "Best form for context",
    title: "Choose the useful percentage",
    prompt: "A student scored 18 out of 25. Which percentage shows the score?",
    options: ["72%", "18%", "25%"],
    answer: "72%",
    visual:
      "early-number|caption=Convert the fraction score to a percentage.|numbers=18/25,0.72,72%|labels=fraction,decimal,percentage",
    misconceptionTargets: ["fraction-percent-conversion-error", "score-context-gap"],
  },
  {
    cluster: "multi-step-context",
    clusterTitle: "Multi-step context",
    title: "Discount then GST",
    prompt:
      "A shop gives a 15% discount on a $82 item. Then 8% GST is added to the sale price. What is the final price?",
    options: ["$75.28", "$76.90", "$73.80"],
    answer: "$75.28",
    visual:
      "early-number|caption=Use the discount first, then add GST to the sale price.|numbers=$82,15%,85%,8%,$75.28|labels=original,discount,sale part,GST,final",
    misconceptionTargets: ["multi-step-percentage-order-error", "tax-after-discount-gap"],
  },
];

const step42Seeds: Seed[] = [
  {
    cluster: "number-line-movement-left",
    clusterTitle: "Movement left on a number line",
    title: "Move left from a starting number",
    prompt: "Which number is 3 steps to the left of 1?",
    options: ["-2", "2", "4"],
    answer: "-2",
    visual:
      "early-number|caption=Start at 1 and move 3 steps left.|numbers=-5,5,1,-2|labels=min,max,start,end",
    misconceptionTargets: ["left-right-direction-error", "negative-number-line-gap"],
  },
  {
    cluster: "number-line-movement-right",
    clusterTitle: "Movement right on a number line",
    title: "Move right from a negative number",
    prompt: "Which number is 5 steps to the right of -7?",
    options: ["-2", "2", "-12"],
    answer: "-2",
    visual:
      "early-number|caption=Start at -7 and move 5 steps right.|numbers=-10,10,-7,-2|labels=min,max,start,end",
    misconceptionTargets: ["right-from-negative-error", "integer-movement-gap"],
  },
  {
    cluster: "compare-integers",
    clusterTitle: "Compare integers",
    title: "Compare a negative and positive integer",
    prompt: "Use <, > or =: -3 __ 2",
    options: ["<", ">", "="],
    answer: "<",
    visual:
      "early-number|caption=Compare positions on the number line.|numbers=-5,5,-3,2,<|labels=min,max,left,right,symbol",
    misconceptionTargets: ["negative-positive-comparison-error", "symbol-direction-gap"],
  },
  {
    cluster: "compare-negative-integers",
    clusterTitle: "Compare two negative numbers",
    title: "Compare negative integers",
    prompt: "Use <, > or =: -7 __ -4",
    options: ["<", ">", "="],
    answer: "<",
    visual:
      "early-number|caption=The farther left number is smaller.|numbers=-10,2,-7,-4,<|labels=min,max,left,right,symbol",
    misconceptionTargets: ["negative-number-order-error", "larger-digit-negative-error"],
  },
  {
    cluster: "order-positive-negative",
    clusterTitle: "Order positive and negative numbers",
    title: "Order numbers least to greatest",
    prompt: "Order the numbers from least to greatest: -5, 2, -8, 0, 4",
    options: ["-8, -5, 0, 2, 4", "4, 2, 0, -5, -8", "-5, -8, 0, 2, 4"],
    answer: "-8, -5, 0, 2, 4",
    visual:
      "early-number|caption=Place each number from left to right.|numbers=-8,-5,0,2,4|labels=least,next,zero,next,greatest",
    misconceptionTargets: ["integer-ordering-error", "zero-position-gap"],
  },
  {
    cluster: "temperature-context",
    clusterTitle: "Temperature below zero",
    title: "Represent below-zero temperature",
    prompt: "The temperature is 6 degrees below zero. Which number represents this?",
    options: ["-6", "6", "0"],
    answer: "-6",
    visual:
      "early-number|caption=Below zero is represented with a negative number.|numbers=-6,0,6|labels=below zero,zero,above zero",
    misconceptionTargets: ["below-zero-sign-error", "temperature-context-gap"],
  },
  {
    cluster: "money-context",
    clusterTitle: "Negative money balance",
    title: "Represent an overdrawn balance",
    prompt: "A bank account balance is $45 overdrawn. Which number represents the balance?",
    options: ["-$45", "$45", "$0"],
    answer: "-$45",
    visual:
      "early-number|caption=Overdrawn means the balance is below zero.|numbers=-$45,$0,$45|labels=overdrawn,zero,positive balance",
    misconceptionTargets: ["negative-money-context-error", "overdrawn-balance-gap"],
  },
  {
    cluster: "movement-context",
    clusterTitle: "Movement from a negative position",
    title: "Move up from below zero",
    prompt: "A diver is at -8 metres. He swims up 15 metres. What is his new position?",
    options: ["7 metres", "-23 metres", "15 metres"],
    answer: "7 metres",
    visual:
      "early-number|caption=Start at -8 and move up 15 metres.|numbers=-10,10,-8,7|labels=min,max,start,end",
    misconceptionTargets: ["integer-movement-context-error", "up-from-negative-gap"],
  },
  {
    cluster: "halfway-on-number-line",
    clusterTitle: "Halfway on a number line",
    title: "Find a halfway point",
    prompt: "What number is halfway between -10 and 0?",
    options: ["-5", "5", "-10"],
    answer: "-5",
    visual:
      "early-number|caption=Halfway means equal distance from both ends.|numbers=-10,0,-5|labels=start,end,halfway",
    misconceptionTargets: ["negative-midpoint-error", "distance-on-number-line-gap"],
  },
  {
    cluster: "distance-from-zero",
    clusterTitle: "Distance from zero",
    title: "Compare distance from zero",
    prompt: "Which is farther from 0: -12 or 8?",
    options: ["-12", "8", "They are the same distance"],
    answer: "-12",
    visual:
      "early-number|caption=Distance from zero ignores direction.|numbers=-12,0,8|labels=left of zero,zero,right of zero",
    misconceptionTargets: ["absolute-distance-gap", "negative-distance-confusion"],
  },
];

export const NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS = [
  {
    key: `number-step-${STEP_NUMBER}-${STEP_KEY}-assessment-v1`,
    stepNumber: STEP_NUMBER,
    stepKey: STEP_KEY,
    pathwayStepId: PATHWAY_STEP_ID,
    title: "Work fluently with integers, decimals, fractions and percentages",
    shortTitle: "Flexible number forms",
    description:
      "Use different number forms flexibly and switch between them with purpose.",
    parentBankKey: "percentages-ratio-financial-modelling" as const,
    parentBankTitle: "Percent, ratio and finance",
    parentItemBankKey: NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
    progressionBandKey: "percentages-ratio-financial-modelling",
    items: seeds.map((seed, index) => makeItem(seed, index)),
  },
  {
    key: `number-step-${STEP_42_NUMBER}-${STEP_42_KEY}-assessment-v1`,
    stepNumber: STEP_42_NUMBER,
    stepKey: STEP_42_KEY,
    pathwayStepId: STEP_42_PATHWAY_STEP_ID,
    title: "Understand negative numbers and number lines",
    shortTitle: "Negative numbers",
    description:
      "Use numbers below zero in context and reason about direction and comparison.",
    parentBankKey: "integers-coordinates-number-properties" as const,
    parentBankTitle: "Integers and coordinates",
    parentItemBankKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY,
    progressionBandKey: "integers-coordinates-number-properties",
    items: step42Seeds.map((seed, index) => makeStep42Item(seed, index)),
  },
] as const satisfies LowerSecondaryStepAssessmentDefinition[];

export const NUMBER_LOWER_SECONDARY_STEP_ASSESSMENT_ITEMS =
  NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
