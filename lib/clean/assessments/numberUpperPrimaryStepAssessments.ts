import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_DECIMALS_FOUNDATIONS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberDecimalsFoundationsAssessmentItems";
import { NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberFractionsFoundationsAssessmentItems";
import { NUMBER_MONEY_PRACTICAL_CONTEXTS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberMoneyPracticalContextsAssessmentItems";
import { NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberMultiplicationDivisionFluencyAssessmentItems";
import { NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPercentRatioFinanceAssessmentItems";
import { NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPlaceValueOperationsAssessmentItems";

export type UpperPrimaryStepAssessmentDefinition = {
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

const STAGE_KEY = "upper-primary";

function slug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function pathwayStepId(stepKey: string) {
  return `mathematics::number-and-place-value::${STAGE_KEY}::${stepKey}`;
}

function visual(description: string) {
  return { type: "context_card" as const, description };
}

function makeItem(
  step: { number: number; key: string; description: string; progressionBandKey: string },
  seed: Seed,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: `number-step-${step.number}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: step.progressionBandKey,
    progressionStepKey: step.key,
    subElementKey: seed.cluster,
    subElementTitle: seed.clusterTitle,
    subElementDescription: step.description,
    title: seed.title,
    prompt: seed.prompt,
    difficulty: index < 4 ? "foundation" : index < 8 ? "developing" : "secure",
    answerType: "multiple_choice",
    format: "upper_primary_visual_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: step.key,
      ifCorrectGoToStepKey: step.key,
      practiceRecommendation: "Practise this exact pathway step with visual number support.",
      diagnosticNote: "This checks the learner's understanding for this pathway step.",
    },
    visualSupport: visual(seed.visual),
  };
}

function defineStep(
  stepNumber: number,
  title: string,
  shortTitle: string,
  description: string,
  parent: {
    bankKey: NumberAssessmentBankKey;
    bankTitle: string;
    itemBankKey: string;
    progressionBandKey: string;
  },
  seeds: Seed[],
): UpperPrimaryStepAssessmentDefinition {
  const stepKey = slug(title);
  return {
    key: `number-step-${stepNumber}-${stepKey}-assessment-v1`,
    stepNumber,
    stepKey,
    pathwayStepId: pathwayStepId(stepKey),
    title,
    shortTitle,
    description,
    parentBankKey: parent.bankKey,
    parentBankTitle: parent.bankTitle,
    parentItemBankKey: parent.itemBankKey,
    progressionBandKey: parent.progressionBandKey,
    items: seeds.map((seed, index) =>
      makeItem(
        { number: stepNumber, key: stepKey, description, progressionBandKey: parent.progressionBandKey },
        seed,
        index,
      ),
    ),
  };
}

const placeValueParent = {
  bankKey: "place-value-and-whole-number-operations" as const,
  bankTitle: "Place value and operations",
  itemBankKey: NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY,
  progressionBandKey: "place-value-and-whole-number-operations",
};
const multiplicationParent = {
  bankKey: "multiplication-division-fluency" as const,
  bankTitle: "Multiplication and division",
  itemBankKey: NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY,
  progressionBandKey: "multiplication-division-fluency",
};
const fractionsParent = {
  bankKey: "fractions-foundations" as const,
  bankTitle: "Fractions foundations",
  itemBankKey: NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY,
  progressionBandKey: "fractions-foundations",
};
const decimalsParent = {
  bankKey: "decimals-foundations" as const,
  bankTitle: "Decimals foundations",
  itemBankKey: NUMBER_DECIMALS_FOUNDATIONS_ITEM_BANK_KEY,
  progressionBandKey: "decimals-foundations",
};
const moneyParent = {
  bankKey: "money-and-practical-number-contexts" as const,
  bankTitle: "Money and practical contexts",
  itemBankKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_ITEM_BANK_KEY,
  progressionBandKey: "money-and-practical-number-contexts",
};
const percentParent = {
  bankKey: "percentages-ratio-financial-modelling" as const,
  bankTitle: "Percent, ratio and finance",
  itemBankKey: NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
  progressionBandKey: "percentages-ratio-financial-modelling",
};

function options(answer: number, spread = 1) {
  return [String(answer - spread), String(answer), String(answer + spread)];
}

function largePlaceSeeds(): Seed[] {
  return [12045, 305600, 78009, 450120, 999999, 1000000, 640070, 203040, 870500, 506001, 720300, 901020].map((value, index) => ({
    cluster: index % 4 === 0 ? "read-large-numbers" : index % 4 === 1 ? "write-large-numbers" : index % 4 === 2 ? "interpret-place-value" : "compare-large-numbers",
    clusterTitle: index % 4 === 0 ? "Read larger numbers" : index % 4 === 1 ? "Write larger numbers" : index % 4 === 2 ? "Interpret place value" : "Compare larger numbers",
    title: `Large number ${index + 1}`,
    prompt: `Which number matches ${value.toLocaleString("en-AU")}?`,
    options: [String(value - 10), String(value), String(value + 100)],
    answer: String(value),
    visual: `early-number|caption=Use place-value number cards.|numbers=${value - 10},${value},${value + 100}`,
    misconceptionTargets: ["large-number-place-value-gap", "zero-placeholder-gap"],
  }));
}

function roundingSeeds(): Seed[] {
  return [
    [1482, 1500], [32649, 33000], [785, 800], [12450, 12000],
    [5099, 5100], [67010, 67000], [999, 1000], [43820, 44000],
    [158, 200], [2949, 3000], [7501, 8000], [640, 600],
  ].map(([value, answer], index) => ({
    cluster: index % 4 === 0 ? "round-to-tens" : index % 4 === 1 ? "round-to-hundreds" : index % 4 === 2 ? "round-to-thousands" : "reasonable-estimates",
    clusterTitle: index % 4 === 0 ? "Round to tens" : index % 4 === 1 ? "Round to hundreds" : index % 4 === 2 ? "Round to thousands" : "Reasonable estimates",
    title: `Round ${value}`,
    prompt: `Which estimate is reasonable for ${value}?`,
    options: options(answer, answer >= 1000 ? 100 : 10),
    answer: String(answer),
    visual: `early-number|caption=Place ${value} on a number line and round.|numbers=${value},${answer}`,
    misconceptionTargets: ["rounding-place-value-error", "estimation-reasonableness-gap"],
  }));
}

function decimalPlaceSeeds(): Seed[] {
  return [
    ["0.4", "Which decimal shows four tenths?"],
    ["0.07", "Which decimal shows seven hundredths?"],
    ["3.25", "Which number means 3 ones, 2 tenths and 5 hundredths?"],
    ["6.08", "Which decimal has 0 tenths and 8 hundredths?"],
    ["1.5", "Which decimal is the same as one and five tenths?"],
    ["2.09", "Which decimal has 9 hundredths?"],
    ["4.30", "Which decimal has 3 tenths?"],
    ["0.12", "Which decimal is twelve hundredths?"],
    ["7.04", "Which decimal has 4 hundredths?"],
    ["5.6", "Which decimal is five and six tenths?"],
    ["0.99", "Which decimal is ninety-nine hundredths?"],
    ["8.01", "Which decimal has one hundredth?"],
  ].map(([answer, prompt], index) => ({
    cluster: index % 4 === 0 ? "tenths" : index % 4 === 1 ? "hundredths" : index % 4 === 2 ? "decimal-partition" : "zero-in-decimals",
    clusterTitle: index % 4 === 0 ? "Tenths" : index % 4 === 1 ? "Hundredths" : index % 4 === 2 ? "Decimal partition" : "Zero in decimals",
    title: `Decimal ${answer}`,
    prompt: prompt as string,
    options: [answer as string, String(Number(answer) + 0.1), String(Number(answer) + 1)],
    answer: answer as string,
    visual: `early-number|caption=Use the decimal place-value cards.|numbers=${answer}`,
    misconceptionTargets: ["decimal-place-value-gap", "decimal-zero-placeholder-error"],
  }));
}

function decimalCompareSeeds(): Seed[] {
  return [
    ["0.6", "0.45", "0.6"], ["1.25", "1.2", "1.25"], ["2.08", "2.8", "2.8"],
    ["0.75", "0.7", "0.75"], ["3.04", "3.4", "3.4"], ["5.5", "5.50", "They are equal"],
    ["0.09", "0.1", "0.1"], ["4.02", "4.20", "4.20"], ["6.3", "6.27", "6.3"],
    ["7.01", "7.1", "7.1"], ["0.4", "0.40", "They are equal"], ["9.9", "9.09", "9.9"],
  ].map(([a, b, answer], index) => ({
    cluster: index % 4 === 0 ? "compare-decimals" : index % 4 === 1 ? "order-decimals" : index % 4 === 2 ? "equivalent-decimals" : "decimal-number-line",
    clusterTitle: index % 4 === 0 ? "Compare decimals" : index % 4 === 1 ? "Order decimals" : index % 4 === 2 ? "Equivalent decimals" : "Decimal number line",
    title: `${a} and ${b}`,
    prompt: `Which decimal is larger: ${a} or ${b}?`,
    options: [a as string, b as string, "They are equal"],
    answer: answer as string,
    visual: `early-number|caption=Compare the decimal cards.|numbers=${a},${b}`,
    misconceptionTargets: ["decimal-digit-count-error", "decimal-place-value-gap"],
  }));
}

function equivalentFractionSeeds(): Seed[] {
  const rows = [
    ["1/2", "2/4"], ["2/3", "4/6"], ["3/4", "6/8"], ["1/3", "2/6"],
    ["2/5", "4/10"], ["3/5", "6/10"], ["4/6", "2/3"], ["5/10", "1/2"],
    ["1/4", "2/8"], ["3/6", "1/2"], ["2/8", "1/4"], ["4/8", "1/2"],
  ];
  return rows.map(([fraction, answer], index) => ({
    cluster: index % 4 === 0 ? "equivalent-fractions" : index % 4 === 1 ? "compare-fractions" : index % 4 === 2 ? "generate-equivalents" : "order-fractions",
    clusterTitle: index % 4 === 0 ? "Equivalent fractions" : index % 4 === 1 ? "Compare fractions" : index % 4 === 2 ? "Generate equivalents" : "Order fractions",
    title: `${fraction} equivalents`,
    prompt: `Which fraction is equivalent to ${fraction}?`,
    options: [answer, fraction, "1/4"],
    answer,
    visual: `early-number|caption=Use equivalent fraction bars.|numbers=${fraction},${answer}`,
    misconceptionTargets: ["equivalent-fractions-gap", "fraction-size-confusion"],
  }));
}

function fractionAddSeeds(): Seed[] {
  return [
    ["1/4 + 1/4", "2/4"], ["1/3 + 1/3", "2/3"], ["3/4 - 1/4", "2/4"],
    ["5/6 - 2/6", "3/6"], ["1/2 + 1/4", "3/4"], ["2/3 + 1/6", "5/6"],
    ["4/5 - 2/5", "2/5"], ["3/8 + 2/8", "5/8"], ["5/10 + 3/10", "8/10"],
    ["7/8 - 3/8", "4/8"], ["1/4 + 2/4", "3/4"], ["6/6 - 1/6", "5/6"],
  ].map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "same-denominator-addition" : index % 4 === 1 ? "same-denominator-subtraction" : index % 4 === 2 ? "related-denominators" : "fraction-reasonableness",
    clusterTitle: index % 4 === 0 ? "Add like parts" : index % 4 === 1 ? "Subtract like parts" : index % 4 === 2 ? "Related denominators" : "Check fraction answers",
    title: question,
    prompt: `Which answer matches ${question}?`,
    options: [answer, "1/2", "1/4"],
    answer,
    visual: `early-number|caption=Use aligned fraction bars.|numbers=${question},${answer}`,
    misconceptionTargets: ["add-denominators-error", "fraction-part-alignment-gap"],
  }));
}

function multiDigitOperationSeeds(): Seed[] {
  return [
    [24, 15, 360], [36, 12, 432], [125, 4, 500], [84, 6, 14],
    [96, 8, 12], [235, 3, 705], [408, 4, 102], [52, 11, 572],
    [144, 12, 12], [67, 9, 603], [720, 6, 120], [28, 25, 700],
  ].map(([a, b, answer], index) => ({
    cluster: index % 4 === 0 ? "multiply-larger-numbers" : index % 4 === 1 ? "divide-larger-numbers" : index % 4 === 2 ? "choose-efficient-strategy" : "check-products-and-quotients",
    clusterTitle: index % 4 === 0 ? "Multiply larger numbers" : index % 4 === 1 ? "Divide larger numbers" : index % 4 === 2 ? "Efficient strategies" : "Check results",
    title: `${a} and ${b}`,
    prompt: index % 3 === 0 ? `What is ${a} x ${b}?` : `Which answer matches ${a} and ${b}?`,
    options: options(answer, Math.max(2, Math.floor(answer / 10))),
    answer: String(answer),
    visual: `early-number|caption=Use arrays, groups or place-value parts.|numbers=${a},${b},${answer}`,
    misconceptionTargets: ["multi-digit-operation-error", "strategy-selection-gap"],
  }));
}

function remainderSeeds(): Seed[] {
  return [
    [17, 5, "3 remainder 2"], [23, 4, "5 remainder 3"], [29, 6, "4 remainder 5"],
    [14, 3, "4 remainder 2"], [38, 7, "5 remainder 3"], [45, 8, "5 remainder 5"],
    [20, 6, "3 remainder 2"], [31, 5, "6 remainder 1"], [50, 9, "5 remainder 5"],
    [27, 4, "6 remainder 3"], [41, 6, "6 remainder 5"], [19, 2, "9 remainder 1"],
  ].map(([total, group, answer], index) => ({
    cluster: index % 4 === 0 ? "sharing-remainders" : index % 4 === 1 ? "grouping-remainders" : index % 4 === 2 ? "interpret-leftovers" : "round-or-not",
    clusterTitle: index % 4 === 0 ? "Sharing remainders" : index % 4 === 1 ? "Grouping remainders" : index % 4 === 2 ? "Leftovers" : "Use the context",
    title: `${total} divided by ${group}`,
    prompt: `Share ${total} into groups of ${group}. What happens?`,
    options: [answer as string, `${Math.floor(Number(total) / Number(group))} exactly`, `${Number(group)} remainder ${Number(total) % Number(group)}`],
    answer: answer as string,
    visual: `early-number|caption=Group the counters and notice leftovers.|groups=${total},${group}|labels=total,group size`,
    misconceptionTargets: ["remainder-interpretation-gap", "division-grouping-error"],
  }));
}

function percentConnectionSeeds(): Seed[] {
  const rows = [
    ["1/2", "0.5", "50%"], ["1/4", "0.25", "25%"], ["3/4", "0.75", "75%"],
    ["1/10", "0.1", "10%"], ["1/5", "0.2", "20%"], ["2/5", "0.4", "40%"],
    ["3/10", "0.3", "30%"], ["4/5", "0.8", "80%"], ["1", "1.0", "100%"],
    ["1/100", "0.01", "1%"], ["9/10", "0.9", "90%"], ["1/8", "0.125", "12.5%"],
  ];
  return rows.map(([fraction, decimal, percent], index) => ({
    cluster: index % 4 === 0 ? "fraction-decimal" : index % 4 === 1 ? "decimal-percent" : index % 4 === 2 ? "fraction-percent" : "equivalent-representations",
    clusterTitle: index % 4 === 0 ? "Fraction to decimal" : index % 4 === 1 ? "Decimal to percent" : index % 4 === 2 ? "Fraction to percent" : "Equivalent forms",
    title: `${fraction} ${decimal} ${percent}`,
    prompt: `Which set shows the same amount as ${fraction}?`,
    options: [`${fraction}, ${decimal}, ${percent}`, `${fraction}, ${decimal}, 5%`, `${fraction}, 1.0, ${percent}`],
    answer: `${fraction}, ${decimal}, ${percent}`,
    visual: `early-number|caption=Match fraction, decimal and percent cards.|numbers=${fraction},${decimal},${percent}`,
    misconceptionTargets: ["fraction-decimal-percent-connection-gap", "percent-place-value-error"],
  }));
}

function financialModelSeeds(): Seed[] {
  return [
    [25, 18, "$43"], [50, -12, "$38"], [120, 25, "$145"], [80, -20, "$60"],
    [35, 3, "$105"], [200, -45, "$155"], [15, 8, "$23"], [300, -75, "$225"],
    [42, 6, "$252"], [90, -15, "$75"], [125, 4, "$500"], [60, 25, "$85"],
  ].map(([a, b, answer], index) => ({
    cluster: index % 4 === 0 ? "budget-totals" : index % 4 === 1 ? "change-and-difference" : index % 4 === 2 ? "multiplicative-contexts" : "planning-and-comparing",
    clusterTitle: index % 4 === 0 ? "Budget totals" : index % 4 === 1 ? "Change and difference" : index % 4 === 2 ? "Multiplicative contexts" : "Planning and comparing",
    title: `Finance ${index + 1}`,
    prompt: Number(b) < 0 ? `Start with $${a} and spend $${Math.abs(Number(b))}. Which answer matches?` : `Use $${a} and ${b}. Which answer matches?`,
    options: [answer as string, `$${Number(String(answer).replace("$", "")) + 10}`, `$${Math.max(0, Number(String(answer).replace("$", "")) - 10)}`],
    answer: answer as string,
    visual: `early-number|caption=Use the money context cards.|numbers=$${a},${b},${answer}`,
    misconceptionTargets: ["financial-context-operation-choice-error", "money-reasonableness-gap"],
  }));
}

export const NUMBER_UPPER_PRIMARY_STEP_ASSESSMENTS = [
  defineStep(31, "Extend place value to larger numbers", "Larger place value", "Read, write and interpret larger whole numbers.", placeValueParent, largePlaceSeeds()),
  defineStep(32, "Round and estimate with larger numbers", "Round and estimate", "Use rounding and estimates with larger numbers.", placeValueParent, roundingSeeds()),
  defineStep(33, "Extend place value to decimals", "Decimal place value", "Use tenths and hundredths to understand decimal notation.", decimalsParent, decimalPlaceSeeds()),
  defineStep(34, "Compare and order decimals", "Compare decimals", "Compare and order decimals using place value.", decimalsParent, decimalCompareSeeds()),
  defineStep(35, "Compare, order and generate equivalent fractions", "Equivalent fractions", "Compare, order and generate equivalent fractions.", fractionsParent, equivalentFractionSeeds()),
  defineStep(36, "Add and subtract fractions with related denominators", "Add and subtract fractions", "Add and subtract fractions when denominators are the same or related.", fractionsParent, fractionAddSeeds()),
  defineStep(37, "Multiply and divide larger whole numbers using efficient strategies", "Larger multiplication and division", "Use efficient strategies for multiplying and dividing larger whole numbers.", multiplicationParent, multiDigitOperationSeeds()),
  defineStep(38, "Interpret remainders in context", "Remainders in context", "Decide what a remainder means in sharing, grouping and practical contexts.", multiplicationParent, remainderSeeds()),
  defineStep(39, "Connect fractions, decimals and percentages", "Fractions decimals percentages", "Connect fractions, decimals and percentages as equivalent representations.", percentParent, percentConnectionSeeds()),
  defineStep(40, "Use mathematical modelling in financial and real-world contexts", "Financial modelling", "Use number reasoning to model budgeting, comparison and practical decisions.", moneyParent, financialModelSeeds()),
] as const satisfies UpperPrimaryStepAssessmentDefinition[];

export const NUMBER_UPPER_PRIMARY_STEP_ASSESSMENT_ITEMS =
  NUMBER_UPPER_PRIMARY_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
