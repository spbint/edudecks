import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberIntegersCoordinatesPropertiesAssessmentItems";
import { NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPercentRatioFinanceAssessmentItems";
import { NUMBER_PATTERNS_EARLY_ALGEBRA_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPatternsEarlyAlgebraAssessmentItems";
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
const STEP_48_NUMBER = 48;
const STEP_48_KEY = "apply-estimation-rounding-and-bounds";
const STEP_48_PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::lower-secondary::apply-estimation-rounding-and-bounds";
const STEP_49_NUMBER = 49;
const STEP_49_KEY = "explain-calculation-choices-and-reasonableness";
const STEP_49_PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::lower-secondary::explain-calculation-choices-and-reasonableness";
const STEP_50_NUMBER = 50;
const STEP_50_KEY = "use-number-relationships-to-support-algebraic-thinking";
const STEP_50_PATHWAY_STEP_ID =
  "mathematics::number-and-place-value::lower-secondary::use-number-relationships-to-support-algebraic-thinking";

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

function makeStep48Item(seed: Seed, index: number): NumberAssessmentBankItem {
  return {
    id: `number-step-${STEP_48_NUMBER}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: "approximation-estimation-error",
    progressionStepKey: STEP_48_KEY,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription:
      "Use approximation, rounding and lower/upper bounds to judge answers sensibly and reason about limits of accuracy.",
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "lower_secondary_estimation_bounds_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: STEP_48_KEY,
      ifCorrectGoToStepKey: STEP_48_KEY,
      practiceRecommendation:
        "Practise rounding to a suitable accuracy, estimating first, and using lower and upper bounds to check reasonableness.",
      diagnosticNote:
        "This checks estimation, rounding, bounds, possible-value ranges and limits of accuracy for this pathway step.",
    },
    visualSupport: visual(seed.visual),
  };
}

function makeStep49Item(seed: Seed, index: number): NumberAssessmentBankItem {
  return {
    id: `number-step-${STEP_49_NUMBER}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: "approximation-estimation-error",
    progressionStepKey: STEP_49_KEY,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription:
      "Choose and explain calculation strategies, then judge whether answers are reasonable in context.",
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "lower_secondary_reasonableness_strategy_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: STEP_49_KEY,
      ifCorrectGoToStepKey: STEP_49_KEY,
      practiceRecommendation:
        "Practise choosing a method, estimating to check reasonableness, and explaining why the strategy fits the problem.",
      diagnosticNote:
        "This checks calculation choice, method explanation, estimation checks and reasonableness reasoning for this pathway step.",
    },
    visualSupport: visual(seed.visual),
  };
}

function makeStep50Item(seed: Seed, index: number): NumberAssessmentBankItem {
  return {
    id: `number-step-${STEP_50_NUMBER}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: "number-patterns-and-early-algebraic-thinking",
    progressionStepKey: STEP_50_KEY,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription:
      "Use number patterns, rules, tables and nth-term relationships to support early algebraic reasoning.",
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "lower_secondary_algebraic_patterns_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: STEP_50_KEY,
      ifCorrectGoToStepKey: STEP_50_KEY,
      practiceRecommendation:
        "Practise extending patterns, completing input-output tables, writing rules and using nth-term relationships.",
      diagnosticNote:
        "This checks number-pattern, rule, table and early algebraic generalisation reasoning for this pathway step.",
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

const step48Seeds: Seed[] = [
  {
    cluster: "estimate-one-significant-figure",
    clusterTitle: "Estimate to 1 significant figure",
    title: "Estimate a sum",
    prompt: "Estimate 298 + 412 by rounding each number to 1 significant figure.",
    options: ["700", "600", "800"],
    answer: "700",
    visual:
      "early-number|caption=Round to friendly values before adding.|numbers=298 + 412,300 + 400,700|labels=calculation,estimate,answer",
    misconceptionTargets: ["rounding-place-value-error", "estimated-exact-confusion"],
  },
  {
    cluster: "estimate-one-significant-figure",
    clusterTitle: "Estimate to 1 significant figure",
    title: "Estimate a product",
    prompt: "Estimate 317 x 21 by rounding each number to 1 significant figure.",
    options: ["6,000", "7,000", "600"],
    answer: "6,000",
    visual:
      "early-number|caption=Use 300 x 20 as a quick estimate.|numbers=317 x 21,300 x 20,6,000|labels=calculation,estimate,answer",
    misconceptionTargets: ["rounding-place-value-error", "place-value-product-error"],
  },
  {
    cluster: "estimate-one-significant-figure",
    clusterTitle: "Estimate to 1 significant figure",
    title: "Estimate a division",
    prompt: "Estimate 7,351 ÷ 28 by rounding each number to 1 significant figure.",
    options: ["about 200", "about 250", "about 300"],
    answer: "about 200",
    visual:
      "early-number|caption=Use 7,000 ÷ 30 to judge the size of the answer.|numbers=7,351 ÷ 28,7,000 ÷ 30,about 200|labels=calculation,estimate,answer",
    misconceptionTargets: ["division-estimation-gap", "estimated-exact-confusion"],
  },
  {
    cluster: "rounding-whole-numbers",
    clusterTitle: "Round whole numbers",
    title: "Round to the nearest thousand",
    prompt: "Round 62,847 to the nearest 1,000.",
    options: ["63,000", "62,000", "62,800"],
    answer: "63,000",
    visual:
      "early-number|caption=Look at the hundreds digit to round to the nearest 1,000.|numbers=62,847,nearest 1,000,63,000|labels=number,accuracy,rounded value",
    misconceptionTargets: ["rounding-place-value-error", "nearest-thousand-gap"],
  },
  {
    cluster: "rounding-decimals",
    clusterTitle: "Round decimals",
    title: "Round to decimal places",
    prompt: "Round 12.678 to 2 decimal places.",
    options: ["12.68", "12.67", "12.70"],
    answer: "12.68",
    visual:
      "early-number|caption=Keep two decimal places and check the next digit.|numbers=12.678,2 decimal places,12.68|labels=number,accuracy,rounded value",
    misconceptionTargets: ["rounding-place-value-error", "decimal-place-gap"],
  },
  {
    cluster: "whole-number-bounds",
    clusterTitle: "Whole-number bounds",
    title: "Find bounds for a rounded ten",
    prompt: "A value rounded to the nearest 10 is 240. What are the lower and upper bounds?",
    options: ["235 and 245", "230 and 250", "240 and 250"],
    answer: "235 and 245",
    visual:
      "early-number|caption=Values from 235 up to but not including 245 round to 240.|numbers=235,240,245|labels=lower bound,rounded value,upper bound",
    misconceptionTargets: ["bounds-half-interval-gap", "upper-bound-inclusion-confusion"],
  },
  {
    cluster: "decimal-bounds",
    clusterTitle: "Decimal bounds",
    title: "Find bounds for a whole-number rounding",
    prompt: "A length is 4 to the nearest whole number. What are the lower and upper bounds?",
    options: ["3.5 and 4.5", "3.55 and 4.45", "4.0 and 5.0"],
    answer: "3.5 and 4.5",
    visual:
      "early-number|caption=Nearest whole number bounds are half a unit either side.|numbers=3.5,4,4.5|labels=lower bound,rounded value,upper bound",
    misconceptionTargets: ["bounds-half-interval-gap", "whole-number-bound-error"],
  },
  {
    cluster: "decimal-place-bounds",
    clusterTitle: "Decimal-place bounds",
    title: "Find bounds for 1 decimal place",
    prompt: "A value is 3.7 to 1 decimal place. What are the lower and upper bounds?",
    options: ["3.65 and 3.75", "3.675 and 3.685", "3.6 and 3.8"],
    answer: "3.65 and 3.75",
    visual:
      "early-number|caption=For 1 decimal place, the half-step is 0.05.|numbers=3.65,3.7,3.75|labels=lower bound,rounded value,upper bound",
    misconceptionTargets: ["decimal-bound-size-error", "bounds-half-interval-gap"],
  },
  {
    cluster: "bounds-in-context",
    clusterTitle: "Bounds in context",
    title: "Use bounds for pages",
    prompt: "A book is rounded to 200 pages to the nearest 10 pages. What are the lower and upper bounds?",
    options: ["195 and 205", "190 and 210", "198 and 200"],
    answer: "195 and 205",
    visual:
      "early-number|caption=Any value from 195 up to but not including 205 rounds to 200.|numbers=195,200 pages,205|labels=lower bound,rounded value,upper bound",
    misconceptionTargets: ["context-bounds-gap", "rounding-interval-width-error"],
  },
  {
    cluster: "estimate-in-context",
    clusterTitle: "Estimate in context",
    title: "Estimate a shop total",
    prompt: "A shop sells a box for $2.97. About how much would 7 boxes cost?",
    options: ["about $21", "about $14", "about $28"],
    answer: "about $21",
    visual:
      "early-number|caption=Round $2.97 to $3, then multiply by 7.|numbers=$2.97,$3 x 7,about $21|labels=price,estimate,total",
    misconceptionTargets: ["money-estimation-gap", "reasonableness-not-checked"],
  },
  {
    cluster: "reasonableness-check",
    clusterTitle: "Reasonableness check",
    title: "Judge a calculated answer",
    prompt: "A learner estimates 49 x 21 as about 1,000. Is that sensible?",
    options: ["Yes, because 50 x 20 = 1,000", "No, it should be about 100", "No, it should be about 10,000"],
    answer: "Yes, because 50 x 20 = 1,000",
    visual:
      "early-number|caption=Use nearby friendly numbers to check the size of the answer.|numbers=49 x 21,50 x 20,1,000|labels=calculation,estimate,reasonable size",
    misconceptionTargets: ["reasonableness-not-checked", "place-value-product-error"],
  },
];

const step49Seeds: Seed[] = [
  {
    cluster: "explain-calculation",
    clusterTitle: "Explain the calculation",
    title: "Choose a strategy",
    prompt: "Which method is a good choice for 5,327 + 1,796?",
    options: ["Written method", "Guess and check", "Count by ones"],
    answer: "Written method",
    visual:
      "early-number|caption=Choose a method, then explain why it fits the numbers.|numbers=5327 + 1796,Written method,estimate check|labels=calculation,my strategy,why it works",
    misconceptionTargets: ["strategy-choice-gap", "written-method-avoidance"],
  },
  {
    cluster: "choose-and-explain",
    clusterTitle: "Choose and explain",
    title: "Match a method to subtraction",
    prompt: "Which method is a sensible first choice for 8,450 - 3,275?",
    options: ["Written subtraction", "Add the numbers", "Multiply by 10"],
    answer: "Written subtraction",
    visual:
      "early-number|caption=The operation and number size help choose the strategy.|numbers=8450 - 3275,Written subtraction,check by adding|labels=calculation,method,check",
    misconceptionTargets: ["operation-choice-error", "inverse-check-gap"],
  },
  {
    cluster: "choose-and-explain",
    clusterTitle: "Choose and explain",
    title: "Choose for multiplication",
    prompt: "Which method best fits 36 x 24?",
    options: ["Partition 24 into 20 and 4", "Round both numbers and stop", "Subtract 24 from 36"],
    answer: "Partition 24 into 20 and 4",
    visual:
      "early-number|caption=Use structure: 36 x 20 plus 36 x 4.|numbers=36 x 24,36 x 20,36 x 4|labels=calculation,part 1,part 2",
    misconceptionTargets: ["multiplication-strategy-gap", "rounding-as-exact-error"],
  },
  {
    cluster: "explain-calculation",
    clusterTitle: "Explain the calculation",
    title: "Choose for division",
    prompt: "Which strategy helps with 4,896 divided by 16?",
    options: ["Use division with a multiplication check", "Add 16 once", "Ignore the remainder"],
    answer: "Use division with a multiplication check",
    visual:
      "early-number|caption=Division answers can be checked with multiplication.|numbers=4896 / 16,quotient,quotient x 16|labels=calculation,my answer,check",
    misconceptionTargets: ["division-check-gap", "operation-inverse-gap"],
  },
  {
    cluster: "reasonableness-check",
    clusterTitle: "Is the answer reasonable?",
    title: "Check a sum",
    prompt: "Is this answer reasonable: 6,198 + 2,345 = 8,543?",
    options: ["Yes", "No", "Not enough information"],
    answer: "Yes",
    visual:
      "early-number|caption=Use an estimate before accepting the exact answer.|numbers=6198 + 2345,6200 + 2300,about 8500|labels=calculation,estimate,reasonable size",
    misconceptionTargets: ["reasonableness-not-checked", "estimation-gap"],
  },
  {
    cluster: "reasonableness-check",
    clusterTitle: "Is the answer reasonable?",
    title: "Check a difference",
    prompt: "Is this answer reasonable: 9,000 - 4,752 = 4,348?",
    options: ["No", "Yes", "It must be 9,000"],
    answer: "No",
    visual:
      "early-number|caption=Estimate: 9000 - 4800 is about 4200, but the exact check gives 4248.|numbers=9000 - 4752,about 4200,4348?|labels=calculation,estimate,answer to question",
    misconceptionTargets: ["subtraction-error-not-detected", "reasonableness-not-checked"],
  },
  {
    cluster: "reasonableness-check",
    clusterTitle: "Is the answer reasonable?",
    title: "Check a product",
    prompt: "Is this answer reasonable: 27 x 48 = 1,296?",
    options: ["Yes", "No", "Only if rounded"],
    answer: "Yes",
    visual:
      "early-number|caption=27 x 48 is close to 30 x 50, so a result near 1500 is sensible.|numbers=27 x 48,30 x 50,1296|labels=calculation,estimate,answer",
    misconceptionTargets: ["multiplication-size-gap", "estimate-comparison-gap"],
  },
  {
    cluster: "reasonableness-check",
    clusterTitle: "Is the answer reasonable?",
    title: "Check a quotient",
    prompt: "Is this answer reasonable: 5,832 divided by 18 = 350?",
    options: ["No", "Yes", "It cannot be checked"],
    answer: "No",
    visual:
      "early-number|caption=Check with multiplication: 350 x 18 is much larger than 5832.|numbers=5832 / 18,350 x 18,too high|labels=division,check,decision",
    misconceptionTargets: ["division-size-gap", "inverse-check-gap"],
  },
  {
    cluster: "compare-two-methods",
    clusterTitle: "Compare two methods",
    title: "Compare addition methods",
    prompt: "For 4,386 + 2,957, which comparison is strongest?",
    options: [
      "Written method gives the exact total; rounding gives a reasonableness check.",
      "Rounding gives the exact total.",
      "Neither method can help.",
    ],
    answer: "Written method gives the exact total; rounding gives a reasonableness check.",
    visual:
      "early-number|caption=Compare exact work with an estimate check.|numbers=4386 + 2957,written total,rounded check|labels=calculation,method A,method B",
    misconceptionTargets: ["method-purpose-confusion", "estimate-as-exact-error"],
  },
  {
    cluster: "compare-two-methods",
    clusterTitle: "Compare two methods",
    title: "Compare division methods",
    prompt: "For 7,236 divided by 18, which check is useful?",
    options: ["Multiply the quotient by 18", "Add 18 once", "Round the quotient to zero"],
    answer: "Multiply the quotient by 18",
    visual:
      "early-number|caption=The inverse operation checks whether the quotient fits.|numbers=7236 / 18,quotient x 18,7236|labels=calculation,inverse check,target",
    misconceptionTargets: ["inverse-check-gap", "division-method-purpose-gap"],
  },
  {
    cluster: "real-world-reasoning",
    clusterTitle: "Real-world reasoning",
    title: "Check a discount",
    prompt:
      "A blender costs $59.95 and is 15% off. Which reasonableness check is best?",
    options: [
      "Estimate 15% of $60 and subtract it.",
      "Add 15 to 59.95.",
      "Ignore the discount.",
    ],
    answer: "Estimate 15% of $60 and subtract it.",
    visual:
      "early-number|caption=Use a friendly price to check the discount size.|numbers=$59.95,15% off,$60 estimate|labels=price,discount,check",
    misconceptionTargets: ["percent-discount-reasoning-gap", "context-check-gap"],
  },
  {
    cluster: "reflect",
    clusterTitle: "Reflect",
    title: "Identify strong reasoning",
    prompt: "Which statement best describes good mathematical reasoning?",
    options: [
      "Choose a method, explain why it fits, and check whether the answer makes sense.",
      "Write any answer quickly.",
      "Only check answers when they are whole numbers.",
    ],
    answer: "Choose a method, explain why it fits, and check whether the answer makes sense.",
    visual:
      "early-number|caption=A strong answer includes method, explanation and a reasonableness check.|numbers=method,why it works,check|labels=strategy,explanation,reasonableness",
    misconceptionTargets: ["reasoning-communication-gap", "checking-value-gap"],
  },
];

const step50Seeds: Seed[] = [
  {
    cluster: "find-the-pattern",
    clusterTitle: "Find the pattern",
    title: "Continue an add 3 pattern",
    prompt: "Find the next three terms: 2, 5, 8, 11, 14, __, __, __",
    options: ["17, 20, 23", "16, 18, 20", "18, 22, 26"],
    answer: "17, 20, 23",
    visual:
      "early-number|caption=Look at the step between terms.|numbers=2,5,8,11,14,?, ?, ?|labels=term 1,term 2,term 3,term 4,term 5,next,next,next",
    misconceptionTargets: ["pattern-step-gap", "missing-term-error"],
  },
  {
    cluster: "find-the-pattern",
    clusterTitle: "Find the pattern",
    title: "Describe a counting rule",
    prompt: "What is the rule for 3, 6, 9, 12, 15, ...?",
    options: ["Add 3", "Multiply by 3 each time", "Add 6"],
    answer: "Add 3",
    visual:
      "early-number|caption=The same amount is added each time.|numbers=3,6,9,12,15|labels=term 1,term 2,term 3,term 4,term 5",
    misconceptionTargets: ["recursive-rule-gap", "multiplicative-rule-confusion"],
  },
  {
    cluster: "complete-the-table",
    clusterTitle: "Complete the table",
    title: "Use an add 4 table",
    prompt: "Rule: add 4. What is the output for input n = 4?",
    options: ["8", "4", "16"],
    answer: "8",
    visual:
      "early-number|caption=Apply the rule to the input.|numbers=Rule: add 4,n = 4,output = 8|labels=rule,input,output",
    misconceptionTargets: ["input-output-rule-error", "operation-application-gap"],
  },
  {
    cluster: "complete-the-table",
    clusterTitle: "Complete the table",
    title: "Use a multiply rule",
    prompt: "Rule: multiply by 3. What is the output for input n = 5?",
    options: ["15", "8", "10"],
    answer: "15",
    visual:
      "early-number|caption=Multiply the input by 3.|numbers=Rule: x3,n = 5,output = 15|labels=rule,input,output",
    misconceptionTargets: ["input-output-rule-error", "additive-instead-of-multiplicative"],
  },
  {
    cluster: "write-a-rule",
    clusterTitle: "Write a rule",
    title: "Write an add 5 rule",
    prompt: "Write the rule for 6, 11, 16, 21, 26, ...",
    options: ["Add 5", "Add 6", "Multiply by 5"],
    answer: "Add 5",
    visual:
      "early-number|caption=Check the difference between neighbouring terms.|numbers=6,11,16,21,26|labels=term 1,term 2,term 3,term 4,term 5",
    misconceptionTargets: ["rule-writing-gap", "first-term-as-rule-error"],
  },
  {
    cluster: "write-a-rule",
    clusterTitle: "Write a rule",
    title: "Write a subtract 10 rule",
    prompt: "Write the rule for 100, 90, 80, 70, 60, ...",
    options: ["Subtract 10", "Add 10", "Divide by 10"],
    answer: "Subtract 10",
    visual:
      "early-number|caption=This pattern decreases by the same amount each time.|numbers=100,90,80,70,60|labels=term 1,term 2,term 3,term 4,term 5",
    misconceptionTargets: ["decreasing-pattern-gap", "operation-direction-error"],
  },
  {
    cluster: "use-the-rule",
    clusterTitle: "Use the rule",
    title: "Find a later term",
    prompt: "A pattern starts at 24 and adds 7 each time. What is the 10th term?",
    options: ["87", "94", "70"],
    answer: "87",
    visual:
      "early-number|caption=The 10th term is 9 steps after the first term.|numbers=24,+7,10th term,87|labels=start,step,target,answer",
    misconceptionTargets: ["term-number-off-by-one", "repeated-addition-gap"],
  },
  {
    cluster: "use-the-rule",
    clusterTitle: "Use the rule",
    title: "Use double then subtract",
    prompt: "Rule: double the input, then subtract 2. What is the output for n = 9?",
    options: ["16", "18", "20"],
    answer: "16",
    visual:
      "early-number|caption=Use both parts of the rule in order.|numbers=n = 9,double = 18,18 - 2 = 16|labels=input,step 1,output",
    misconceptionTargets: ["two-step-rule-error", "operation-order-gap"],
  },
  {
    cluster: "generalize",
    clusterTitle: "Generalize",
    title: "Choose an nth term",
    prompt: "Choose the nth term for 3, 7, 11, 15, 19, ...",
    options: ["4n - 1", "3n + 1", "n + 4"],
    answer: "4n - 1",
    visual:
      "early-number|caption=The pattern increases by 4, then adjust to match term 1.|numbers=3,7,11,15,4n - 1|labels=term 1,term 2,term 3,term 4,nth term",
    misconceptionTargets: ["nth-term-gap", "coefficient-as-first-term-error"],
  },
  {
    cluster: "generalize",
    clusterTitle: "Generalize",
    title: "Choose a multiplicative nth term",
    prompt: "Choose the nth term for 5, 10, 15, 20, 25, ...",
    options: ["5n", "n + 5", "5 + n"],
    answer: "5n",
    visual:
      "early-number|caption=Each term is 5 times the term number.|numbers=n,1,2,3,5n|labels=term number,term 1,term 2,term 3,rule",
    misconceptionTargets: ["multiplicative-nth-term-gap", "additive-rule-confusion"],
  },
  {
    cluster: "problem-solving",
    clusterTitle: "Problem solving",
    title: "Solve a pattern problem",
    prompt: "A pattern starts at 4. Each term is 5 more than the previous term. What is the 30th term?",
    options: ["149", "154", "150"],
    answer: "149",
    visual:
      "early-number|caption=There are 29 jumps of 5 after the first term.|numbers=4,29 jumps,x5,149|labels=start,number of jumps,step size,answer",
    misconceptionTargets: ["term-number-off-by-one", "pattern-problem-solving-gap"],
  },
  {
    cluster: "problem-solving",
    clusterTitle: "Problem solving",
    title: "Use a rule from a situation",
    prompt: "A pattern is made by multiplying the term number by 7. What is the 18th term?",
    options: ["126", "25", "117"],
    answer: "126",
    visual:
      "early-number|caption=Use the rule with the term number.|numbers=n = 18,x7,126|labels=term number,rule,answer",
    misconceptionTargets: ["rule-application-gap", "term-number-confusion"],
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
  {
    key: `number-step-${STEP_48_NUMBER}-${STEP_48_KEY}-assessment-v1`,
    stepNumber: STEP_48_NUMBER,
    stepKey: STEP_48_KEY,
    pathwayStepId: STEP_48_PATHWAY_STEP_ID,
    title: "Apply estimation, rounding and bounds",
    shortTitle: "Estimation and bounds",
    description:
      "Use approximation and limits of accuracy to judge answers sensibly.",
    parentBankKey: "approximation-estimation-error" as const,
    parentBankTitle: "Approximation and estimation",
    parentItemBankKey: "number-approximation-assessment-items-v1",
    progressionBandKey: "approximation-estimation-error",
    items: step48Seeds.map((seed, index) => makeStep48Item(seed, index)),
  },
  {
    key: `number-step-${STEP_49_NUMBER}-${STEP_49_KEY}-assessment-v1`,
    stepNumber: STEP_49_NUMBER,
    stepKey: STEP_49_KEY,
    pathwayStepId: STEP_49_PATHWAY_STEP_ID,
    title: "Explain calculation choices and reasonableness",
    shortTitle: "Calculation choices",
    description:
      "Explain the methods you use and decide if answers make sense.",
    parentBankKey: "approximation-estimation-error" as const,
    parentBankTitle: "Approximation and estimation",
    parentItemBankKey: "number-approximation-assessment-items-v1",
    progressionBandKey: "approximation-estimation-error",
    items: step49Seeds.map((seed, index) => makeStep49Item(seed, index)),
  },
  {
    key: `number-step-${STEP_50_NUMBER}-${STEP_50_KEY}-assessment-v1`,
    stepNumber: STEP_50_NUMBER,
    stepKey: STEP_50_KEY,
    pathwayStepId: STEP_50_PATHWAY_STEP_ID,
    title: "Use number relationships to support algebraic thinking",
    shortTitle: "Algebraic patterns",
    description:
      "Look for patterns and generalize relationships.",
    parentBankKey: "number-patterns-and-early-algebraic-thinking" as const,
    parentBankTitle: "Number patterns",
    parentItemBankKey: NUMBER_PATTERNS_EARLY_ALGEBRA_ITEM_BANK_KEY,
    progressionBandKey: "number-patterns-and-early-algebraic-thinking",
    items: step50Seeds.map((seed, index) => makeStep50Item(seed, index)),
  },
] as const satisfies LowerSecondaryStepAssessmentDefinition[];

export const NUMBER_LOWER_SECONDARY_STEP_ASSESSMENT_ITEMS =
  NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
