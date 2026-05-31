import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberIntegersCoordinatesPropertiesAssessmentItems";
import { NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPercentRatioFinanceAssessmentItems";
import { NUMBER_POWERS_ROOTS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPowersRootsAssessmentItems";
import { NUMBER_RATIONAL_OPERATIONS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberRationalOperationsAssessmentItems";
import { NUMBER_SURDS_EXACT_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberSurdsExactAssessmentItems";

export type Years910StepAssessmentDefinition = {
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

type ParentBank = {
  bankKey: NumberAssessmentBankKey;
  bankTitle: string;
  itemBankKey: string;
  progressionBandKey: string;
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

const STAGE_KEY = "years-9-10-consolidation";
const APPROXIMATION_ITEM_BANK_KEY = "number-approximation-assessment-items-v1";

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
    format: "years_9_10_visual_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: step.key,
      ifCorrectGoToStepKey: step.key,
      practiceRecommendation: "Practise this exact pathway step with the matching visual model.",
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
  parent: ParentBank,
  seeds: Seed[],
): Years910StepAssessmentDefinition {
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

const powersParent: ParentBank = {
  bankKey: "powers-roots-exponent-notation",
  bankTitle: "Powers and roots",
  itemBankKey: NUMBER_POWERS_ROOTS_ITEM_BANK_KEY,
  progressionBandKey: "powers-roots-exponent-notation",
};

const surdsParent: ParentBank = {
  bankKey: "surds-and-exact-form",
  bankTitle: "Surds and exact form",
  itemBankKey: NUMBER_SURDS_EXACT_ITEM_BANK_KEY,
  progressionBandKey: "surds-and-exact-form",
};

const percentParent: ParentBank = {
  bankKey: "percentages-ratio-financial-modelling",
  bankTitle: "Percent, ratio and finance",
  itemBankKey: NUMBER_PERCENT_RATIO_FINANCE_ITEM_BANK_KEY,
  progressionBandKey: "percentages-ratio-financial-modelling",
};

const integersParent: ParentBank = {
  bankKey: "integers-coordinates-number-properties",
  bankTitle: "Integers and coordinates",
  itemBankKey: NUMBER_INTEGERS_COORDINATES_PROPERTIES_ITEM_BANK_KEY,
  progressionBandKey: "integers-coordinates-number-properties",
};

const rationalParent: ParentBank = {
  bankKey: "rational-numbers-and-operations",
  bankTitle: "Rational operations",
  itemBankKey: NUMBER_RATIONAL_OPERATIONS_ITEM_BANK_KEY,
  progressionBandKey: "rational-numbers-and-operations",
};

const approximationParent: ParentBank = {
  bankKey: "approximation-estimation-error",
  bankTitle: "Approximation and error",
  itemBankKey: APPROXIMATION_ITEM_BANK_KEY,
  progressionBandKey: "approximation-estimation-error",
};

function standardFormSeeds(): Seed[] {
  const rows = [
    ["4.2 x 10^5", "420000"], ["6.03 x 10^-3", "0.00603"], ["8.1 x 10^7", "81000000"],
    ["3.5 x 10^-4", "0.00035"], ["9.04 x 10^6", "9040000"], ["7.2 x 10^-2", "0.072"],
    ["1.25 x 10^8", "125000000"], ["5.6 x 10^-5", "0.000056"], ["2.01 x 10^4", "20100"],
    ["4.75 x 10^-1", "0.475"], ["9.99 x 10^3", "9990"], ["6.4 x 10^-6", "0.0000064"],
  ];
  return rows.map(([standard, ordinary], index) => {
    const distractorA = ordinary.includes(".") ? ordinary.replace("0.", "0.0") : `${ordinary}0`;
    const distractorB = ordinary.includes(".") ? ordinary.replace("0.", "0.00") : ordinary.slice(0, -1);
    return {
      cluster: index % 4 === 0 ? "large-scale-standard-form" : index % 4 === 1 ? "small-scale-standard-form" : index % 4 === 2 ? "powers-of-ten" : "compare-standard-form",
      clusterTitle: index % 4 === 0 ? "Large-scale standard form" : index % 4 === 1 ? "Small-scale standard form" : index % 4 === 2 ? "Powers of ten" : "Compare standard form",
      title: `Standard form ${index + 1}`,
      prompt: `Which ordinary number matches ${standard}?`,
      options: [ordinary, distractorA, distractorB],
      answer: ordinary,
      visual: `early-number|caption=Use powers-of-ten cards to scale the number.|numbers=${standard},${ordinary}`,
      misconceptionTargets: ["standard-form-place-value-error", "negative-exponent-scale-gap"],
    };
  });
}

function powersRootsSeeds(): Seed[] {
  const rows = [
    ["3^4", "81"], ["sqrt(144)", "12"], ["2^5 x 2^3", "2^8"], ["10^3", "1000"],
    ["sqrt(0.49)", "0.7"], ["5^0", "1"], ["9^(1/2)", "3"], ["4^3", "64"],
    ["sqrt(2.25)", "1.5"], ["7^2", "49"], ["2^-3", "1/8"], ["sqrt(196)", "14"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "powers" : index % 4 === 1 ? "roots" : index % 4 === 2 ? "index-laws" : "powers-in-context",
    clusterTitle: index % 4 === 0 ? "Powers" : index % 4 === 1 ? "Roots" : index % 4 === 2 ? "Index laws" : "Powers in context",
    title: question,
    prompt: `Which answer matches ${question}?`,
    options: [answer, "1", "12"],
    answer,
    visual: `early-number|caption=Connect the power or root to its value.|numbers=${question},${answer}`,
    misconceptionTargets: ["power-repeated-multiplication-gap", "root-inverse-gap"],
  }));
}

function exactFormSeeds(): Seed[] {
  const rows = [
    ["half of 6pi", "3pi"], ["sqrt(50)", "5sqrt(2)"], ["2pi + 3pi", "5pi"],
    ["sqrt(72)", "6sqrt(2)"], ["area 9pi divided by 3", "3pi"], ["sqrt(18) + sqrt(8)", "5sqrt(2)"],
    ["4 x pi/2", "2pi"], ["sqrt(48)", "4sqrt(3)"], ["3sqrt(5) + 2sqrt(5)", "5sqrt(5)"],
    ["circumference 2pi x 7", "14pi"], ["sqrt(27)", "3sqrt(3)"], ["5pi - 2pi", "3pi"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "exact-pi-values" : index % 4 === 1 ? "simplify-surds" : index % 4 === 2 ? "combine-exact-terms" : "choose-exact-form",
    clusterTitle: index % 4 === 0 ? "Exact pi values" : index % 4 === 1 ? "Simplify surds" : index % 4 === 2 ? "Combine exact terms" : "Choose exact form",
    title: `Exact form ${index + 1}`,
    prompt: `Which exact form matches ${question}?`,
    options: [answer, question, "9.42"],
    answer,
    visual: `early-number|caption=Keep exact cards together instead of rounding.|numbers=${question},${answer}`,
    misconceptionTargets: ["exact-form-rounded-too-early", "unlike-surd-combination-error"],
  }));
}

function percentageChangeSeeds(): Seed[] {
  const rows = [
    ["Increase 80 by 10%", "88"], ["Decrease 120 by 25%", "90"], ["Increase 50 by 40%", "70"],
    ["Decrease 200 by 15%", "170"], ["Increase 64 by 12.5%", "72"], ["Decrease 90 by 10%", "81"],
    ["Increase 300 by 8%", "324"], ["Decrease 45 by 20%", "36"], ["Increase 160 by 5%", "168"],
    ["Decrease 75 by 40%", "45"], ["Increase 250 by 12%", "280"], ["Decrease 1000 by 3%", "970"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "percentage-increase" : index % 4 === 1 ? "percentage-decrease" : index % 4 === 2 ? "multiplier-method" : "growth-decay-contexts",
    clusterTitle: index % 4 === 0 ? "Percentage increase" : index % 4 === 1 ? "Percentage decrease" : index % 4 === 2 ? "Multiplier method" : "Growth and decay",
    title: `Percentage change ${index + 1}`,
    prompt: `${question}. Which result is correct?`,
    options: [answer, String(Number(answer) + 10), String(Math.max(0, Number(answer) - 10))],
    answer,
    visual: `early-number|caption=Use the percentage change bar.|numbers=${question},${answer}`,
    misconceptionTargets: ["percentage-change-base-error", "increase-decrease-direction-error"],
  }));
}

function ratioRateSeeds(): Seed[] {
  const rows = [
    ["Share $60 in the ratio 2:3. Smaller share", "$24"], ["3 kg costs $12. Cost for 5 kg", "$20"],
    ["Map scale 1 cm:4 km. 6 cm", "24 km"], ["Speed 180 km in 3 h", "60 km/h"],
    ["Ratio 4:5, total 81. First part", "36"], ["Recipe 2 cups for 5 serves. 15 serves", "6 cups"],
    ["Rate 8 L in 4 min", "2 L/min"], ["Exchange $50 at 1.5 per dollar", "75"],
    ["Ratio 1:4, total 35. Larger part", "28"], ["120 pages in 3 h", "40 pages/h"],
    ["5 m costs $30. Cost per m", "$6"], ["Scale 1:200, 4 cm real length", "800 cm"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "ratio-sharing" : index % 4 === 1 ? "unit-rates" : index % 4 === 2 ? "scale-and-proportion" : "rates-of-change",
    clusterTitle: index % 4 === 0 ? "Ratio sharing" : index % 4 === 1 ? "Unit rates" : index % 4 === 2 ? "Scale and proportion" : "Rates of change",
    title: `Ratio/rate ${index + 1}`,
    prompt: `${question}. Which answer matches?`,
    options: [answer, "12", "40"],
    answer,
    visual: `early-number|caption=Use ratio, scale or rate cards.|numbers=${question},${answer}`,
    misconceptionTargets: ["additive-ratio-error", "unit-rate-gap"],
  }));
}

function algebraGraphSeeds(): Seed[] {
  const rows = [
    ["y = 2x + 3 when x = 4", "11"], ["Point (3,-2) quadrant", "IV"], ["Gradient from (0,2) to (3,8)", "2"],
    ["x + 7 = 12", "5"], ["y = -x + 5 when x = 2", "3"], ["Point (-4,6) quadrant", "II"],
    ["2x = 18", "9"], ["Gradient from (1,1) to (4,10)", "3"], ["y = 3x - 1 when x = 5", "14"],
    ["Point (-2,-7) quadrant", "III"], ["x/4 = 6", "24"], ["Gradient from (0,0) to (5,20)", "4"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "substitution" : index % 4 === 1 ? "coordinates" : index % 4 === 2 ? "gradient-rate" : "solve-simple-equations",
    clusterTitle: index % 4 === 0 ? "Substitution" : index % 4 === 1 ? "Coordinates" : index % 4 === 2 ? "Gradient and rate" : "Solve equations",
    title: `Algebra and graph ${index + 1}`,
    prompt: `${question}. Which answer is correct?`,
    options: [answer, "0", "6"],
    answer,
    visual: `early-number|caption=Use coordinate and equation cards.|numbers=${question},${answer}`,
    misconceptionTargets: ["integer-coordinate-error", "substitution-order-error"],
  }));
}

function financialModellingSeeds(): Seed[] {
  const rows = [
    ["$500 at 6% simple interest for 1 year", "$30"], ["$80 item with 25% off", "$60"],
    ["$240 shared 3:5, larger share", "$150"], ["Profit: buy $45 sell $60", "$15"],
    ["$1200 at 5% simple interest for 2 years", "$120"], ["$90 plus 10% GST", "$99"],
    ["$300 budget, spend $125 and $90", "$85 left"], ["Loss: buy $70 sell $55", "$15"],
    ["$40 with 15% discount", "$34"], ["$600 split 2:1", "$400 and $200"],
    ["$250 increases by 8%", "$270"], ["$1000 decreases by 12%", "$880"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "interest" : index % 4 === 1 ? "discounts-and-tax" : index % 4 === 2 ? "compare-options" : "profit-loss",
    clusterTitle: index % 4 === 0 ? "Interest" : index % 4 === 1 ? "Discounts and tax" : index % 4 === 2 ? "Compare options" : "Profit and loss",
    title: `Financial model ${index + 1}`,
    prompt: `${question}. Which result matches?`,
    options: [answer, "$10", "$100"],
    answer,
    visual: `early-number|caption=Use the finance context cards.|numbers=${question},${answer}`,
    misconceptionTargets: ["financial-operation-choice-error", "percentage-money-gap"],
  }));
}

function accuracySeeds(): Seed[] {
  const rows = [
    ["38 rounded to nearest 10", "40"], ["2.347 rounded to 2 dp", "2.35"],
    ["Measured 12.4 cm to nearest mm bounds", "12.35 to 12.45 cm"], ["0.00981 to 2 sig figs", "0.0098"],
    ["1450 to 2 sig figs", "1500"], ["7.995 to 2 dp", "8.00"],
    ["Nearest metre: 16 m lower bound", "15.5 m"], ["Estimate 49.8 x 20.1", "about 1000"],
    ["0.03456 to 3 sig figs", "0.0346"], ["Nearest dollar: $28 lower bound", "$27.50"],
    ["3.14159 to 3 dp", "3.142"], ["Estimate 198 divided by 4.9", "about 40"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "rounding" : index % 4 === 1 ? "significant-figures" : index % 4 === 2 ? "bounds" : "reasonable-estimates",
    clusterTitle: index % 4 === 0 ? "Rounding" : index % 4 === 1 ? "Significant figures" : index % 4 === 2 ? "Bounds" : "Reasonable estimates",
    title: `Accuracy ${index + 1}`,
    prompt: `${question}. Which answer is correct?`,
    options: [answer, "not enough information", "0"],
    answer,
    visual: `early-number|caption=Use rounding and bounds number-line cards.|numbers=${question},${answer}`,
    misconceptionTargets: ["rounding-boundary-error", "accuracy-language-gap"],
  }));
}

function strategySeeds(): Seed[] {
  const rows = [
    ["49 x 21", "50 x 21 - 21"], ["125 x 16", "125 x 8 x 2"], ["98 + 37", "100 + 35"],
    ["15% of 80", "10% + 5%"], ["3.6 x 25", "3.6 x 100 / 4"], ["999 + 486", "1000 + 485"],
    ["24 x 35", "24 x 30 + 24 x 5"], ["72 divided by 9", "use 9 x 8"], ["0.5 x 18", "half of 18"],
    ["75% of 64", "three quarters of 64"], ["14 x 99", "14 x 100 - 14"], ["48 + 27 + 52", "48 + 52 + 27"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "compensation" : index % 4 === 1 ? "factorisation" : index % 4 === 2 ? "partitioning" : "choose-method",
    clusterTitle: index % 4 === 0 ? "Compensation" : index % 4 === 1 ? "Factorisation" : index % 4 === 2 ? "Partitioning" : "Choose a method",
    title: `Strategy ${index + 1}`,
    prompt: `Which strategy works well for ${question}?`,
    options: [answer, "guess and check only", "round the final answer first"],
    answer,
    visual: `early-number|caption=Compare efficient strategy cards.|numbers=${question},${answer}`,
    misconceptionTargets: ["inefficient-strategy-choice", "operation-structure-gap"],
  }));
}

function reasoningSeeds(): Seed[] {
  const rows = [
    ["Why is 0.4 bigger than 0.35?", "Four tenths is more than thirty-five hundredths"],
    ["Why does 6 x 18 equal 108?", "6 x 20 minus 6 x 2"],
    ["Why is 3/4 the same as 75%?", "75 out of 100 is three quarters"],
    ["Why can sqrt(50) be 5sqrt(2)?", "50 has factor 25"],
    ["Which check supports 23 x 19 = 437?", "23 x 20 - 23"],
    ["Why is a 20% discount on $90 equal $18?", "10% is $9, so 20% is $18"],
    ["Why is -3 less than 1?", "-3 is left of 1 on the number line"],
    ["Which reason supports rounding 498 to 500?", "498 is close to 500"],
    ["Why keep pi exact?", "Rounding pi can lose precision"],
    ["Why is ratio 2:3 not the same as difference 1?", "Ratio compares multiplicatively"],
    ["Which explanation fits 2^-2 = 1/4?", "Negative powers make reciprocal powers"],
    ["Why are estimates useful?", "They check if answers are reasonable"],
  ];
  return rows.map(([question, answer], index) => ({
    cluster: index % 4 === 0 ? "explain-place-value" : index % 4 === 1 ? "justify-operations" : index % 4 === 2 ? "compare-representations" : "reasonableness",
    clusterTitle: index % 4 === 0 ? "Explain place value" : index % 4 === 1 ? "Justify operations" : index % 4 === 2 ? "Compare representations" : "Reasonableness",
    title: `Reasoning ${index + 1}`,
    prompt: `${question} Which explanation is best?`,
    options: [answer, "Because it looks bigger", "Because the answer is always the first number"],
    answer,
    visual: `early-number|caption=Use explanation cards to match claim and reason.|numbers=${question},${answer}`,
    misconceptionTargets: ["reasoning-without-evidence", "representation-connection-gap"],
  }));
}

export const NUMBER_YEARS_9_10_STEP_ASSESSMENTS = [
  defineStep(51, "Work with standard form and very large or very small numbers", "Standard form", "Represent scale efficiently when ordinary notation becomes awkward.", powersParent, standardFormSeeds()),
  defineStep(52, "Use powers, roots and indices in context", "Powers roots indices", "Apply exponential and inverse ideas in calculations and mathematical models.", powersParent, powersRootsSeeds()),
  defineStep(53, "Calculate exactly with fractions and multiples of pi where appropriate", "Exact fractions and pi", "Preserve exact values when estimation would lose important structure.", surdsParent, exactFormSeeds()),
  defineStep(54, "Work with percentage change, growth and decay", "Percentage change", "Reason about increase, decrease, and repeated change in practical settings.", percentParent, percentageChangeSeeds()),
  defineStep(55, "Apply ratio, proportion and rates of change", "Ratio proportion rates", "Use multiplicative thinking in more demanding financial, graphical, and scientific contexts.", percentParent, ratioRateSeeds()),
  defineStep(56, "Use number skills in algebraic and graphical contexts", "Number in algebra and graphs", "Bring numerical fluency into equations, graphs, and coordinate reasoning.", integersParent, algebraGraphSeeds()),
  defineStep(57, "Solve financial and real-world modelling problems", "Financial modelling", "Use mathematics to compare options, justify decisions, and interpret outcomes.", percentParent, financialModellingSeeds()),
  defineStep(58, "Interpret limits of accuracy and rounding", "Accuracy and rounding", "Understand how measurement, rounding, and approximation affect conclusions.", approximationParent, accuracySeeds()),
  defineStep(59, "Select efficient calculation strategies for unfamiliar problems", "Efficient strategies", "Choose, adapt, and combine methods when the answer path is not obvious.", rationalParent, strategySeeds()),
  defineStep(60, "Justify and communicate mathematical reasoning", "Mathematical reasoning", "Explain methods clearly, compare approaches, and defend conclusions with evidence.", rationalParent, reasoningSeeds()),
] as const satisfies Years910StepAssessmentDefinition[];

export const NUMBER_YEARS_9_10_STEP_ASSESSMENT_ITEMS =
  NUMBER_YEARS_9_10_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
