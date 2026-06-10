import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberIntegersCoordinatesPropertiesAssessmentItems";
import { NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPercentRatioFinanceAssessmentItems";
import { NUMBER_POWERS_ROOTS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPowersRootsAssessmentItems";

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
const STEP_44_NUMBER = 44;
const STEP_44_KEY = "use-index-notation-powers-and-roots";
const STEP_44_PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::lower-secondary::use-index-notation-powers-and-roots";
const STEP_45_NUMBER = 45;
const STEP_45_KEY = "work-with-ratio-and-rates";
const STEP_45_PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::lower-secondary::work-with-ratio-and-rates";
const STEP_46_NUMBER = 46;
const STEP_46_KEY = "use-proportional-reasoning";
const STEP_46_PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::lower-secondary::use-proportional-reasoning";

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

function makeStep44Item(seed: Seed, index: number): NumberAssessmentBankItem {
  return {
    id: `number-step-${STEP_44_NUMBER}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: "powers-roots-exponent-notation",
    progressionStepKey: STEP_44_KEY,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription:
      "Use index notation to represent repeated multiplication, evaluate powers, find square roots and connect powers and roots as inverse operations.",
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 7 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "lower_secondary_powers_roots_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: STEP_44_KEY,
      ifCorrectGoToStepKey: STEP_44_KEY,
      practiceRecommendation:
        "Practise moving between repeated multiplication, index notation, evaluated powers and roots.",
      diagnosticNote:
        "This checks powers, roots, exponent notation and inverse relationship reasoning for this pathway step.",
    },
    visualSupport: visual(seed.visual),
  };
}

function makeStep45Item(seed: Seed, index: number): NumberAssessmentBankItem {
  return {
    id: `number-step-${STEP_45_NUMBER}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: "percentages-ratio-financial-modelling",
    progressionStepKey: STEP_45_KEY,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription:
      "Compare quantities multiplicatively, simplify and generate equivalent ratios, and use rates in meaningful real-world contexts.",
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "lower_secondary_ratio_rate_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: STEP_45_KEY,
      ifCorrectGoToStepKey: STEP_45_KEY,
      practiceRecommendation:
        "Practise simplifying ratios, building equivalent ratios and using unit rates in context.",
      diagnosticNote:
        "This checks ratio simplification, equivalent ratios, unit rates and multiplicative comparison for this pathway step.",
    },
    visualSupport: visual(seed.visual),
  };
}

function makeStep46Item(seed: Seed, index: number): NumberAssessmentBankItem {
  return {
    id: `number-step-${STEP_46_NUMBER}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: "percentages-ratio-financial-modelling",
    progressionStepKey: STEP_46_KEY,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription:
      "Scale quantities up or down, compare fairly using unit rates, and reason about equivalent proportional relationships.",
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "lower_secondary_proportional_reasoning_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: STEP_46_KEY,
      ifCorrectGoToStepKey: STEP_46_KEY,
      practiceRecommendation:
        "Practise equivalent proportions, scale factors, ratio tables and fair unit-rate comparisons.",
      diagnosticNote:
        "This checks proportional reasoning with equivalent ratios, scaling, unit rates and real-world same-rate contexts for this pathway step.",
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

const step44Seeds: Seed[] = [
  {
    cluster: "write-index-notation",
    clusterTitle: "Write index notation",
    title: "Write repeated multiplication as a power",
    prompt: "Write this repeated multiplication using index notation: 2 x 2 x 2",
    options: ["2^3", "3^2", "2 x 3"],
    answer: "2^3",
    visual:
      "early-number|caption=The base is 2 and it repeats 3 times.|numbers=2,3,2^3|labels=base,exponent,power",
    misconceptionTargets: ["base-exponent-confusion", "repeated-multiplication-index-gap"],
  },
  {
    cluster: "variable-index-notation",
    clusterTitle: "Variable index notation",
    title: "Write variable repeated multiplication as a power",
    prompt: "Write this repeated multiplication using index notation: a x a x a x a",
    options: ["a^4", "4a", "a + 4"],
    answer: "a^4",
    visual:
      "early-number|caption=The base is a and it repeats 4 times.|numbers=a,4,a^4|labels=base,exponent,power",
    misconceptionTargets: ["variable-power-notation-error", "coefficient-exponent-confusion"],
  },
  {
    cluster: "expand-index-notation",
    clusterTitle: "Expand index notation",
    title: "Expand a power",
    prompt: "Expand the power as repeated multiplication: 4^2",
    options: ["4 x 4", "2 x 2 x 2 x 2", "4 + 4"],
    answer: "4 x 4",
    visual:
      "early-number|caption=The exponent tells how many factors of the base to write.|numbers=4^2,4 x 4|labels=power,expanded form",
    misconceptionTargets: ["power-as-multiplication-by-exponent-error", "expanded-form-gap"],
  },
  {
    cluster: "evaluate-powers",
    clusterTitle: "Evaluate powers",
    title: "Evaluate a power",
    prompt: "Evaluate the power: 5^3",
    options: ["125", "15", "25"],
    answer: "125",
    visual:
      "early-number|caption=5^3 means 5 x 5 x 5.|numbers=5^3,5 x 5 x 5,125|labels=power,expanded form,value",
    misconceptionTargets: ["power-evaluation-error", "exponent-as-multiplier-error"],
  },
  {
    cluster: "square-roots",
    clusterTitle: "Square roots",
    title: "Find a square root",
    prompt: "Find the square root: sqrt(81)",
    options: ["9", "8", "18"],
    answer: "9",
    visual:
      "early-number|caption=The square root asks which number squared gives 81.|numbers=sqrt(81),9,9^2 = 81|labels=root,side,power check",
    misconceptionTargets: ["square-root-perfect-square-confusion", "root-inverse-gap"],
  },
  {
    cluster: "power-root-inverse",
    clusterTitle: "Powers and roots as inverses",
    title: "Connect powers and roots",
    prompt: "Complete the inverse relationship: (sqrt(49))^2",
    options: ["49", "7", "14"],
    answer: "49",
    visual:
      "early-number|caption=Square root and squaring undo each other for this value.|numbers=sqrt(49),7,7^2,49|labels=root,value,square,result",
    misconceptionTargets: ["inverse-operation-gap", "square-root-result-confusion"],
  },
  {
    cluster: "perfect-square-context",
    clusterTitle: "Perfect square context",
    title: "Find a square side length",
    prompt: "The area of a square garden is 144 m^2. What is the length of one side?",
    options: ["12 m", "14 m", "72 m"],
    answer: "12 m",
    visual:
      "early-number|caption=For a square, side length is the square root of the area.|numbers=144 m^2,sqrt(144),12 m|labels=area,root,side length",
    misconceptionTargets: ["area-square-root-gap", "halve-area-error"],
  },
  {
    cluster: "cube-context",
    clusterTitle: "Cube context",
    title: "Find a cube edge length",
    prompt: "A cube has a volume of 216 cm^3. What is the length of one edge?",
    options: ["6 cm", "12 cm", "36 cm"],
    answer: "6 cm",
    visual:
      "early-number|caption=6^3 means 6 x 6 x 6, which gives the cube volume.|numbers=6^3,216 cm^3,6 cm|labels=power,volume,edge",
    misconceptionTargets: ["cube-root-context-gap", "volume-edge-confusion"],
  },
  {
    cluster: "number-squared",
    clusterTitle: "Number squared",
    title: "Reverse a square",
    prompt: "A number squared is 169. What is the number?",
    options: ["13", "12", "14"],
    answer: "13",
    visual:
      "early-number|caption=Find the number whose square is 169.|numbers=n^2 = 169,sqrt(169),13|labels=equation,root,number",
    misconceptionTargets: ["perfect-square-memory-gap", "root-as-half-error"],
  },
];

const step45Seeds: Seed[] = [
  {
    cluster: "ratio-simplification",
    clusterTitle: "Simplify ratios",
    title: "Simplify a ratio",
    prompt: "Write the ratio 6 : 9 in simplest form.",
    options: ["2 : 3", "3 : 2", "6 : 3"],
    answer: "2 : 3",
    visual:
      "early-number|caption=Divide both parts by the same common factor.|numbers=6 : 9,3,2 : 3|labels=ratio,common factor,simplest form",
    misconceptionTargets: ["ratio-simplification-gap", "common-factor-error"],
  },
  {
    cluster: "ratio-simplification",
    clusterTitle: "Simplify ratios",
    title: "Simplify a larger ratio",
    prompt: "Write the ratio 24 : 36 in simplest form.",
    options: ["2 : 3", "3 : 2", "4 : 6"],
    answer: "2 : 3",
    visual:
      "early-number|caption=Use the greatest common factor to reduce both parts.|numbers=24 : 36,12,2 : 3|labels=ratio,common factor,simplest form",
    misconceptionTargets: ["ratio-simplification-gap", "not-fully-simplified-ratio"],
  },
  {
    cluster: "unit-ratio-form",
    clusterTitle: "Form 1:n",
    title: "Write a ratio in unit form",
    prompt: "Write the ratio 3 : 9 in the form 1:n.",
    options: ["1 : 3", "1 : 6", "3 : 1"],
    answer: "1 : 3",
    visual:
      "early-number|caption=Divide both parts by 3 so the first part is 1.|numbers=3 : 9,3,1 : 3|labels=ratio,divide by,unit ratio",
    misconceptionTargets: ["unit-ratio-form-gap", "ratio-order-reversal"],
  },
  {
    cluster: "equivalent-ratios",
    clusterTitle: "Equivalent ratios",
    title: "Choose equivalent ratios",
    prompt: "Choose two equivalent ratios for 2 : 3.",
    options: ["4 : 6 and 6 : 9", "3 : 2 and 6 : 4", "2 : 6 and 3 : 9"],
    answer: "4 : 6 and 6 : 9",
    visual:
      "early-number|caption=Equivalent ratios multiply both parts by the same scale factor.|numbers=2 : 3,4 : 6,6 : 9|labels=base ratio,x2,x3",
    misconceptionTargets: ["equivalent-ratio-gap", "unequal-scale-factor-error"],
  },
  {
    cluster: "ratio-in-context",
    clusterTitle: "Ratio in context",
    title: "Use a fruit ratio",
    prompt: "In a fruit bowl, there are 8 apples and 12 oranges. What is the ratio of apples to oranges?",
    options: ["2 : 3", "3 : 2", "8 : 20"],
    answer: "2 : 3",
    visual:
      "early-number|caption=Compare apples to oranges, then simplify the ratio.|numbers=8 apples,12 oranges,2 : 3|labels=apples,oranges,simplified ratio",
    misconceptionTargets: ["part-to-part-ratio-gap", "part-to-whole-ratio-confusion"],
  },
  {
    cluster: "ratio-in-context",
    clusterTitle: "Ratio in context",
    title: "Use a classroom ratio",
    prompt: "A classroom has 15 girls and 10 boys. What is the ratio of girls to boys?",
    options: ["3 : 2", "2 : 3", "15 : 25"],
    answer: "3 : 2",
    visual:
      "early-number|caption=Keep the ratio order: girls to boys.|numbers=15 girls,10 boys,3 : 2|labels=girls,boys,simplified ratio",
    misconceptionTargets: ["ratio-order-reversal", "part-to-whole-ratio-confusion"],
  },
  {
    cluster: "unit-rates",
    clusterTitle: "Unit rates",
    title: "Find speed",
    prompt: "A car travels 180 km in 3 hours. What is its speed in km per hour?",
    options: ["60 km/h", "90 km/h", "180 km/h"],
    answer: "60 km/h",
    visual:
      "early-number|caption=Rate equals total distance divided by time.|numbers=180 km,3 h,60 km/h|labels=distance,time,unit rate",
    misconceptionTargets: ["unit-rate-division-gap", "speed-context-error"],
  },
  {
    cluster: "unit-rates",
    clusterTitle: "Unit rates",
    title: "Find litres per minute",
    prompt: "A tap fills a tank with 60 litres of water in 15 minutes. What is the rate in litres per minute?",
    options: ["4 L/min", "15 L/min", "900 L/min"],
    answer: "4 L/min",
    visual:
      "early-number|caption=Divide total litres by minutes to find litres each minute.|numbers=60 L,15 min,4 L/min|labels=total,time,unit rate",
    misconceptionTargets: ["unit-rate-division-gap", "multiplication-instead-of-division"],
  },
  {
    cluster: "unit-rates",
    clusterTitle: "Unit rates",
    title: "Find cost per kilogram",
    prompt: "If 5 kg of apples cost $20, what is the cost per kg?",
    options: ["$4 per kg", "$5 per kg", "$20 per kg"],
    answer: "$4 per kg",
    visual:
      "early-number|caption=Divide total cost by kilograms to find the cost for 1 kg.|numbers=$20,5 kg,$4 per kg|labels=cost,mass,unit price",
    misconceptionTargets: ["unit-price-gap", "rate-denominator-confusion"],
  },
  {
    cluster: "multiplicative-comparison",
    clusterTitle: "Multiplicative comparison",
    title: "Scale a recipe ratio",
    prompt:
      "A recipe for lemonade uses 1 part lemon juice to 4 parts water. If you have 2 cups of lemon juice, how many cups of water do you need?",
    options: ["8 cups", "6 cups", "4 cups"],
    answer: "8 cups",
    visual:
      "early-number|caption=Scale both parts of the ratio by the same factor.|numbers=1 : 4,x2,2 : 8|labels=recipe ratio,scale factor,new ratio",
    misconceptionTargets: ["scale-factor-gap", "additive-ratio-error"],
  },
  {
    cluster: "scale-factor",
    clusterTitle: "Scale factor",
    title: "Use a scale factor",
    prompt: "A photo is enlarged using a scale factor of 3. If the original photo is 7 cm wide, how wide is the enlarged photo?",
    options: ["21 cm", "10 cm", "14 cm"],
    answer: "21 cm",
    visual:
      "early-number|caption=Multiply the original width by the scale factor.|numbers=7 cm,x3,21 cm|labels=original,scale factor,enlarged",
    misconceptionTargets: ["scale-factor-gap", "additive-scaling-error"],
  },
  {
    cluster: "multi-step-ratio",
    clusterTitle: "Multi-step ratio",
    title: "Split a total using a ratio",
    prompt:
      "A recipe for fruit punch uses apple juice and orange juice in the ratio 2 : 3. If the recipe needs 15 litres of juice, how many litres of each juice are needed?",
    options: [
      "Apple juice 6 L, orange juice 9 L",
      "Apple juice 5 L, orange juice 10 L",
      "Apple juice 9 L, orange juice 6 L",
    ],
    answer: "Apple juice 6 L, orange juice 9 L",
    visual:
      "early-number|caption=There are 5 parts altogether, so each part is 3 L.|numbers=2 : 3,5 parts,3 L per part,6 L and 9 L|labels=ratio,total parts,unit part,amounts",
    misconceptionTargets: ["ratio-sharing-gap", "part-total-confusion"],
  },
];

const step46Seeds: Seed[] = [
  {
    cluster: "equivalent-proportions",
    clusterTitle: "Equivalent proportions",
    title: "Check equivalent proportions",
    prompt: "Do these ratios form an equivalent proportion: 2 : 3 and 4 : 6?",
    options: ["Equivalent", "Not equivalent"],
    answer: "Equivalent",
    visual:
      "early-number|caption=Both parts are multiplied by 2, so the relationship stays proportional.|numbers=2 : 3,x2,4 : 6|labels=first ratio,scale factor,second ratio",
    misconceptionTargets: ["equivalent-proportion-gap", "additive-ratio-error"],
  },
  {
    cluster: "equivalent-proportions",
    clusterTitle: "Equivalent proportions",
    title: "Check a scaled proportion",
    prompt: "Do these ratios form an equivalent proportion: 3 : 5 and 9 : 15?",
    options: ["Equivalent", "Not equivalent"],
    answer: "Equivalent",
    visual:
      "early-number|caption=Both parts are multiplied by 3.|numbers=3 : 5,x3,9 : 15|labels=first ratio,scale factor,second ratio",
    misconceptionTargets: ["equivalent-proportion-gap", "scale-factor-mismatch"],
  },
  {
    cluster: "scale-up-down",
    clusterTitle: "Scale up and down",
    title: "Scale a muffin recipe",
    prompt:
      "The table shows cups of flour needed to make different batches of muffins. If 1 batch uses 1.5 cups, how many cups are needed for 4 batches?",
    options: ["6 cups", "4.5 cups", "7.5 cups"],
    answer: "6 cups",
    visual:
      "early-number|caption=Scale 1.5 cups by 4 batches.|numbers=1 batch,1.5 cups,4 batches,6 cups|labels=batch,flour,scaled batch,scaled flour",
    misconceptionTargets: ["scale-factor-gap", "proportion-table-gap"],
  },
  {
    cluster: "recipe-scaling",
    clusterTitle: "Recipe scaling",
    title: "Scale a recipe",
    prompt: "A recipe uses 2 cups of rice to serve 3 people. How much rice is needed to serve 9 people?",
    options: ["6 cups", "4 cups", "9 cups"],
    answer: "6 cups",
    visual:
      "early-number|caption=Serving 9 people is 3 times as many people.|numbers=2 cups,3 people,x3,6 cups|labels=rice,people,scale factor,needed rice",
    misconceptionTargets: ["recipe-proportion-gap", "additive-scaling-error"],
  },
  {
    cluster: "fuel-proportion",
    clusterTitle: "Fuel proportion",
    title: "Scale fuel distance",
    prompt: "A car travels 180 km with 12 litres of fuel. How far can it travel with 18 litres?",
    options: ["270 km", "240 km", "300 km"],
    answer: "270 km",
    visual:
      "early-number|caption=18 litres is 1.5 times 12 litres, so scale the distance by 1.5.|numbers=180 km,12 L,18 L,270 km|labels=distance,fuel,new fuel,new distance",
    misconceptionTargets: ["fuel-rate-proportion-gap", "same-rate-scaling-error"],
  },
  {
    cluster: "fair-comparison",
    clusterTitle: "Fair comparison",
    title: "Compare value per pen",
    prompt: "A pack of 4 pens costs $3.20. A pack of 7 pens costs $5.60. Which pack is better value?",
    options: ["4-pack", "7-pack", "Same value"],
    answer: "Same value",
    visual:
      "early-number|caption=Compare cost per pen, not total cost.|numbers=$3.20/4,$5.60/7,$0.80 each|labels=4-pack,7-pack,unit price",
    misconceptionTargets: ["unit-rate-comparison-gap", "total-cost-bias"],
  },
  {
    cluster: "unit-price-comparison",
    clusterTitle: "Unit price comparison",
    title: "Compare value per 100 g",
    prompt: "500 g of cheese costs $4.50. 800 g of cheese costs $7.20. Which is better value per 100 g?",
    options: ["500 g pack", "800 g pack", "Same value"],
    answer: "Same value",
    visual:
      "early-number|caption=Both packs cost $0.90 per 100 g.|numbers=$4.50/500 g,$7.20/800 g,$0.90 per 100 g|labels=small pack,large pack,unit price",
    misconceptionTargets: ["unit-price-comparison-gap", "larger-pack-bias"],
  },
  {
    cluster: "map-scale",
    clusterTitle: "Map scale",
    title: "Use a map scale",
    prompt:
      "A map uses a scale of 1 cm to represent 50 km. The distance between two cities on the map is 7.4 cm. What is the actual distance?",
    options: ["370 km", "57.4 km", "740 km"],
    answer: "370 km",
    visual:
      "early-number|caption=Multiply each map centimetre by 50 km.|numbers=1 cm,50 km,7.4 cm,370 km|labels=map unit,real unit,map distance,actual distance",
    misconceptionTargets: ["map-scale-gap", "decimal-scale-error"],
  },
  {
    cluster: "fraction-proportion",
    clusterTitle: "Fraction proportion",
    title: "Use a class proportion",
    prompt: "A school has 240 students. 3/5 of the students are girls. How many boys are there?",
    options: ["96 boys", "144 boys", "120 boys"],
    answer: "96 boys",
    visual:
      "early-number|caption=If 3/5 are girls, then 2/5 are boys.|numbers=240,3/5 girls,2/5 boys,96 boys|labels=total,girls,boys fraction,boys",
    misconceptionTargets: ["fraction-complement-gap", "proportion-of-total-error"],
  },
  {
    cluster: "same-rate-challenge",
    clusterTitle: "Same-rate challenge",
    title: "Use a production rate",
    prompt: "A company can produce 150 notebooks in 3 hours. How long will it take to produce 500 notebooks at the same rate?",
    options: ["10 hours", "9 hours", "12 hours"],
    answer: "10 hours",
    visual:
      "early-number|caption=Find 50 notebooks per hour, then divide 500 by 50.|numbers=150 notebooks,3 h,50 per h,10 h|labels=output,time,unit rate,needed time",
    misconceptionTargets: ["same-rate-reasoning-gap", "rate-inversion-error"],
  },
  {
    cluster: "fuel-rate-challenge",
    clusterTitle: "Fuel-rate challenge",
    title: "Use the same fuel rate",
    prompt:
      "A family drove 360 km using 24 litres of fuel. If they continue at the same rate, how many kilometres can they drive with 40 litres?",
    options: ["600 km", "540 km", "640 km"],
    answer: "600 km",
    visual:
      "early-number|caption=360 km in 24 L means 15 km per litre.|numbers=360 km,24 L,15 km/L,40 L,600 km|labels=distance,fuel,unit rate,new fuel,new distance",
    misconceptionTargets: ["fuel-rate-proportion-gap", "unit-rate-application-error"],
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
  {
    key: `number-step-${STEP_44_NUMBER}-${STEP_44_KEY}-assessment-v1`,
    stepNumber: STEP_44_NUMBER,
    stepKey: STEP_44_KEY,
    pathwayStepId: STEP_44_PATHWAY_STEP_ID,
    title: "Use index notation, powers and roots",
    shortTitle: "Powers and roots",
    description:
      "Represent repeated multiplication efficiently and connect it to inverse ideas.",
    parentBankKey: "powers-roots-exponent-notation" as const,
    parentBankTitle: "Powers and roots",
    parentItemBankKey: NUMBER_POWERS_ROOTS_ITEM_BANK_KEY,
    progressionBandKey: "powers-roots-exponent-notation",
    items: step44Seeds.map((seed, index) => makeStep44Item(seed, index)),
  },
  {
    key: `number-step-${STEP_45_NUMBER}-${STEP_45_KEY}-assessment-v1`,
    stepNumber: STEP_45_NUMBER,
    stepKey: STEP_45_KEY,
    pathwayStepId: STEP_45_PATHWAY_STEP_ID,
    title: "Work with ratio and rates",
    shortTitle: "Ratio and rates",
    description:
      "Compare quantities multiplicatively and use rates in meaningful contexts.",
    parentBankKey: "percentages-ratio-financial-modelling" as const,
    parentBankTitle: "Percent, ratio and finance",
    parentItemBankKey: NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
    progressionBandKey: "percentages-ratio-financial-modelling",
    items: step45Seeds.map((seed, index) => makeStep45Item(seed, index)),
  },
  {
    key: `number-step-${STEP_46_NUMBER}-${STEP_46_KEY}-assessment-v1`,
    stepNumber: STEP_46_NUMBER,
    stepKey: STEP_46_KEY,
    pathwayStepId: STEP_46_PATHWAY_STEP_ID,
    title: "Use proportional reasoning",
    shortTitle: "Proportional reasoning",
    description:
      "Scale up or down, compare fairly, and reason about equivalent relationships.",
    parentBankKey: "percentages-ratio-financial-modelling" as const,
    parentBankTitle: "Percent, ratio and finance",
    parentItemBankKey: NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
    progressionBandKey: "percentages-ratio-financial-modelling",
    items: step46Seeds.map((seed, index) => makeStep46Item(seed, index)),
  },
] as const satisfies LowerSecondaryStepAssessmentDefinition[];

export const NUMBER_LOWER_SECONDARY_STEP_ASSESSMENT_ITEMS =
  NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
