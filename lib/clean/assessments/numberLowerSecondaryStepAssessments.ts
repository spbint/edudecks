import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
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
] as const satisfies LowerSecondaryStepAssessmentDefinition[];

export const NUMBER_LOWER_SECONDARY_STEP_ASSESSMENT_ITEMS =
  NUMBER_LOWER_SECONDARY_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
