import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_ADDITIVE_STRATEGIES_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberAdditiveStrategiesAssessmentItems";
import { NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberFractionsFoundationsAssessmentItems";
import { NUMBER_MONEY_PRACTICAL_CONTEXTS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberMoneyPracticalContextsAssessmentItems";
import { NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberMultiplicationDivisionFluencyAssessmentItems";
import { NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPlaceValueOperationsAssessmentItems";

export type MiddlePrimaryStepAssessmentDefinition = {
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

const STAGE_KEY = "middle-primary";

function slug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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
    format: "middle_primary_visual_card",
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
): MiddlePrimaryStepAssessmentDefinition {
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
const additiveParent = {
  bankKey: "additive-strategies-and-problem-solving" as const,
  bankTitle: "Additive strategies",
  itemBankKey: NUMBER_ADDITIVE_STRATEGIES_ITEM_BANK_KEY,
  progressionBandKey: "additive-strategies-and-problem-solving",
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
const moneyParent = {
  bankKey: "money-and-practical-number-contexts" as const,
  bankTitle: "Money and practical contexts",
  itemBankKey: NUMBER_MONEY_PRACTICAL_CONTEXTS_ITEM_BANK_KEY,
  progressionBandKey: "money-and-practical-number-contexts",
};

function numberOptions(answer: number, spread = 1) {
  return [String(answer - spread), String(answer), String(answer + spread)];
}

function compareSeeds(): Seed[] {
  return [
    [432, "432", "Which number is four hundred thirty-two?"],
    [1008, "1008", "Which number is one thousand eight?"],
    [760, "760", "Which number has 7 hundreds and 6 tens?"],
    [1295, "1295", "Which number matches 1 thousand, 2 hundreds, 9 tens and 5 ones?"],
    [348, "348", "Which number is between 347 and 349?"],
    [902, "902", "Which number is greater than 899?"],
    [1170, "1170", "Which number is smallest: 1170, 1710 or 1701?"],
    [2045, "2045", "Which number is largest: 2045, 2005 or 205?"],
    [999, "999", "Which number comes just before 1000?"],
    [1001, "1001", "Which number comes just after 1000?"],
    [1560, "1560", "Which number has 15 hundreds and 6 tens?"],
    [2403, "2403", "Which number has a zero in the tens place?"],
  ].map(([value, answer, prompt], index) => ({
    cluster: index % 4 === 0 ? "read-large-numbers" : index % 4 === 1 ? "write-large-numbers" : index % 4 === 2 ? "compare-large-numbers" : "order-large-numbers",
    clusterTitle: index % 4 === 0 ? "Read larger numbers" : index % 4 === 1 ? "Write larger numbers" : index % 4 === 2 ? "Compare larger numbers" : "Order larger numbers",
    title: `Number ${value}`,
    prompt: prompt as string,
    options: [String(Number(answer) - 1), String(answer), String(Number(answer) + 10)],
    answer: answer as string,
    visual: `early-number|caption=Use the place-value number cards.|numbers=${Number(answer) - 1},${answer},${Number(answer) + 10}`,
    misconceptionTargets: ["large-number-place-value-gap", "digit-order-confusion"],
  }));
}

function hundredsSeeds(): Seed[] {
  return [324, 506, 780, 912, 431, 650, 809, 125, 999, 407, 260, 1000].map((value, index) => {
    const hundreds = Math.floor((value % 1000) / 100);
    const tens = Math.floor((value % 100) / 10);
    const ones = value % 10;
    return {
      cluster: index % 4 === 0 ? "hundreds" : index % 4 === 1 ? "tens" : index % 4 === 2 ? "ones" : "three-digit-structure",
      clusterTitle: index % 4 === 0 ? "Hundreds" : index % 4 === 1 ? "Tens" : index % 4 === 2 ? "Ones" : "Three-digit structure",
      title: `Build ${value}`,
      prompt: `Which parts make ${value}?`,
      options: [`${hundreds} hundreds, ${tens} tens and ${ones} ones`, `${tens} hundreds, ${hundreds} tens and ${ones} ones`, `${hundreds} hundreds, ${ones} tens and ${tens} ones`],
      answer: `${hundreds} hundreds, ${tens} tens and ${ones} ones`,
      visual: `early-number|caption=Use hundreds, tens and ones.|groups=${hundreds},${tens},${ones}|labels=hundreds,tens,ones`,
      misconceptionTargets: ["hundreds-tens-ones-confusion", "zero-placeholder-gap"],
    };
  });
}

function regroupSeeds(): Seed[] {
  return [236, 354, 482, 517, 609, 728, 845, 960, 372, 491, 508, 631].map((value, index) => {
    const hundreds = Math.floor(value / 100);
    const rest = value - hundreds * 100;
    return {
      cluster: index % 4 === 0 ? "partition" : index % 4 === 1 ? "regroup" : index % 4 === 2 ? "recombine" : "flexible-number-parts",
      clusterTitle: index % 4 === 0 ? "Partition" : index % 4 === 1 ? "Regroup" : index % 4 === 2 ? "Recombine" : "Flexible number parts",
      title: `Regroup ${value}`,
      prompt: `Which is another way to make ${value}?`,
      options: [`${hundreds - 1} hundreds and ${rest + 100}`, `${hundreds} hundreds and ${rest + 100}`, `${hundreds + 1} hundreds and ${rest}`],
      answer: `${hundreds - 1} hundreds and ${rest + 100}`,
      visual: `early-number|caption=Trade one hundred into tens and ones.|groups=${hundreds},${rest}|labels=hundreds,rest`,
      misconceptionTargets: ["regrouping-place-value-gap", "partition-recombine-error"],
    };
  });
}

function zeroSeeds(): Seed[] {
  return [205, 340, 1006, 704, 902, 1080, 400, 103, 2500, 607, 1010, 3008].map((value, index) => {
    const text = String(value);
    return {
      cluster: index % 4 === 0 ? "zero-in-tens" : index % 4 === 1 ? "zero-in-ones" : index % 4 === 2 ? "zero-in-hundreds" : "zero-placeholder",
      clusterTitle: index % 4 === 0 ? "Zero in tens" : index % 4 === 1 ? "Zero in ones" : index % 4 === 2 ? "Zero in hundreds" : "Zero as placeholder",
      title: `Zero in ${value}`,
      prompt: `What does the 0 do in ${value}?`,
      options: ["It holds a place", "It always means the number is 0", "It can be ignored"],
      answer: "It holds a place",
      visual: `early-number|caption=Look at each digit in ${text}.|numbers=${text}`,
      misconceptionTargets: ["zero-placeholder-gap", "place-value-digit-omission"],
    };
  });
}

function addSubtractSeeds(): Seed[] {
  return [
    [234, 125, 359, "How many altogether?"],
    [560, -230, 330, "How many are left?"],
    [418, 207, 625, "Add the numbers."],
    [732, -411, 321, "Subtract the numbers."],
    [345, 286, 631, "How many altogether?"],
    [804, -276, 528, "How many are left?"],
    [129, 478, 607, "Add the numbers."],
    [900, -455, 445, "Subtract the numbers."],
    [275, 325, 600, "How many altogether?"],
    [1000, -375, 625, "How many are left?"],
    [486, 219, 705, "Add the numbers."],
    [713, -268, 445, "Subtract the numbers."],
  ].map(([a, b, answer, prompt], index) => ({
    cluster: Number(b) > 0 ? "addition-place-value" : "subtraction-place-value",
    clusterTitle: Number(b) > 0 ? "Addition with place value" : "Subtraction with place value",
    title: `Calculation ${index + 1}`,
    prompt: `${prompt} ${a} ${Number(b) > 0 ? "+" : "-"} ${Math.abs(Number(b))}`,
    options: numberOptions(Number(answer), 10),
    answer: String(answer),
    visual: `early-number|caption=Use place-value parts.|groups=${Math.floor(Number(a) / 100)},${Math.abs(Number(b))}|labels=start,change`,
    misconceptionTargets: ["regrouping-error", "place-value-calculation-gap"],
  }));
}

function multiplicationFactsSeeds(): Seed[] {
  return [
    [3, 4, 12], [6, 5, 30], [7, 2, 14], [8, 3, 24],
    [4, 9, 36], [5, 8, 40], [6, 6, 36], [9, 3, 27],
    [7, 4, 28], [8, 2, 16], [5, 12, 60], [10, 7, 70],
  ].map(([a, b, answer], index) => ({
    cluster: index % 4 === 0 ? "facts" : index % 4 === 1 ? "related-division" : index % 4 === 2 ? "arrays" : "fact-choice",
    clusterTitle: index % 4 === 0 ? "Multiplication facts" : index % 4 === 1 ? "Related division" : index % 4 === 2 ? "Arrays" : "Choose a fact",
    title: `${a} x ${b}`,
    prompt: `What is ${a} x ${b}?`,
    options: numberOptions(answer, b),
    answer: String(answer),
    visual: `early-number|caption=See ${a} groups of ${b}.|groups=${a},${b}|labels=groups,in each group`,
    misconceptionTargets: ["multiplication-fact-recall-gap", "equal-groups-counting-error"],
  }));
}

function arrayDivisionSeeds(): Seed[] {
  return [
    [4, 3, 12], [5, 4, 20], [6, 3, 18], [7, 2, 14],
    [3, 8, 24], [4, 6, 24], [5, 5, 25], [8, 4, 32],
    [9, 2, 18], [6, 6, 36], [10, 3, 30], [7, 5, 35],
  ].map(([rows, columns, answer], index) => ({
    cluster: index % 3 === 0 ? "arrays" : index % 3 === 1 ? "equal-groups" : "division-with-groups",
    clusterTitle: index % 3 === 0 ? "Arrays" : index % 3 === 1 ? "Equal groups" : "Division with groups",
    title: `${rows} by ${columns}`,
    prompt: `Which number matches ${rows} rows of ${columns}?`,
    options: numberOptions(answer, columns),
    answer: String(answer),
    visual: `early-number|caption=Use the array or groups.|groups=${rows},${columns}|labels=rows,in each row`,
    misconceptionTargets: ["array-structure-gap", "division-equal-groups-confusion"],
  }));
}

function estimateSeeds(): Seed[] {
  return [
    [48, 21, 70], [196, 203, 400], [312, 89, 400], [78, 19, 100],
    [451, 252, 700], [609, 187, 800], [93, 48, 140], [720, 180, 900],
    [38, 42, 80], [299, 101, 400], [520, 260, 800], [88, 12, 100],
  ].map(([a, b, answer], index) => ({
    cluster: index % 4 === 0 ? "round-and-add" : index % 4 === 1 ? "friendly-estimates" : index % 4 === 2 ? "check-answer" : "reasonable-or-not",
    clusterTitle: index % 4 === 0 ? "Round and add" : index % 4 === 1 ? "Friendly estimates" : index % 4 === 2 ? "Check an answer" : "Reasonableness",
    title: `Estimate ${index + 1}`,
    prompt: `Which is a good estimate for ${a} + ${b}?`,
    options: numberOptions(answer, 50),
    answer: String(answer),
    visual: `early-number|caption=Use friendly numbers to estimate.|numbers=${a},${b},${answer}`,
    misconceptionTargets: ["estimation-rounding-gap", "reasonableness-checking-gap"],
  }));
}

function fractionSeeds(): Seed[] {
  return [
    ["1/2", "Which fraction matches one out of two equal parts?"],
    ["1/3", "Which fraction matches one out of three equal parts?"],
    ["1/4", "Which fraction matches one out of four equal parts?"],
    ["3/4", "Which fraction matches three out of four equal parts?"],
    ["2/3", "Which fraction matches two out of three equal parts?"],
    ["1/5", "Which fraction matches one out of five equal parts?"],
    ["2/4", "Which fraction is the same as one half?"],
    ["4/4", "Which fraction shows the whole?"],
    ["1/6", "Which is a unit fraction?"],
    ["2/5", "Which fraction has 2 parts shaded out of 5?"],
    ["3/6", "Which fraction is the same as one half?"],
    ["1/8", "Which fraction has one shaded part out of 8?"],
  ].map(([answer, prompt], index) => ({
    cluster: index % 4 === 0 ? "unit-fractions" : index % 4 === 1 ? "simple-fractions" : index % 4 === 2 ? "fraction-representations" : "fractions-of-a-whole",
    clusterTitle: index % 4 === 0 ? "Unit fractions" : index % 4 === 1 ? "Simple fractions" : index % 4 === 2 ? "Fraction representations" : "Fractions of a whole",
    title: `Fraction ${answer}`,
    prompt: prompt as string,
    options: ["1/2", "1/3", "1/4", "3/4", "2/3", "1/5", "2/4", "4/4", "1/6", "2/5", "3/6", "1/8"].slice(index, index + 3).includes(answer as string)
      ? ["1/2", "1/3", "1/4", "3/4", "2/3", "1/5", "2/4", "4/4", "1/6", "2/5", "3/6", "1/8"].slice(index, index + 3)
      : [answer as string, "1/2", "1/4"],
    answer: answer as string,
    visual: "early-number|caption=Use equal parts to match the fraction.|groups=1,2,4|labels=shaded,total,parts",
    misconceptionTargets: ["fraction-equal-parts-confusion", "numerator-denominator-gap"],
  }));
}

function moneySeeds(): Seed[] {
  return [
    [3, 2, 5, "A book costs $3 and a pencil costs $2. How much altogether?"],
    [10, -4, 6, "You have $10 and spend $4. How much is left?"],
    [6, 5, 11, "Lunch is $6 and a drink is $5. How much altogether?"],
    [20, -8, 12, "You have $20 and spend $8. How much is left?"],
    [7, 3, 10, "Two items cost $7 and $3. How much altogether?"],
    [15, -6, 9, "You have $15 and spend $6. How much is left?"],
    [4, 9, 13, "A toy is $4 and a card is $9. How much altogether?"],
    [30, -12, 18, "You have $30 and spend $12. How much is left?"],
    [8, 6, 14, "Two snacks cost $8 and $6. How much altogether?"],
    [25, -9, 16, "You have $25 and spend $9. How much is left?"],
    [12, 7, 19, "Two items cost $12 and $7. How much altogether?"],
    [50, -23, 27, "You have $50 and spend $23. How much is left?"],
  ].map(([a, b, answer, prompt], index) => ({
    cluster: Number(b) > 0 ? "money-totals" : "money-change",
    clusterTitle: Number(b) > 0 ? "Money totals" : "Money change",
    title: `Money ${index + 1}`,
    prompt: prompt as string,
    options: [`$${Number(answer) - 1}`, `$${answer}`, `$${Number(answer) + 1}`],
    answer: `$${answer}`,
    visual: `early-number|caption=Use the price cards.|numbers=$${a},$${Math.abs(Number(b))},$${answer}`,
    misconceptionTargets: ["money-total-error", "change-subtraction-confusion"],
  }));
}

export const NUMBER_MIDDLE_PRIMARY_STEP_ASSESSMENTS = [
  defineStep(21, "Read, write, order and compare numbers to 1000 and beyond", "Numbers to 1000+", "Read, write, order and compare larger whole numbers.", placeValueParent, compareSeeds()),
  defineStep(22, "Understand hundreds, tens and ones", "Hundreds, tens and ones", "Use hundreds, tens and ones to describe whole numbers.", placeValueParent, hundredsSeeds()),
  defineStep(23, "Partition and regroup two- and three-digit numbers", "Partition and regroup", "Break apart and recombine two- and three-digit numbers.", placeValueParent, regroupSeeds()),
  defineStep(24, "Use zero as a placeholder", "Zero placeholder", "Understand how zero holds a place inside a number.", placeValueParent, zeroSeeds()),
  defineStep(25, "Add and subtract two- and three-digit numbers using place value", "Add and subtract with place value", "Use place value to add and subtract two- and three-digit numbers.", additiveParent, addSubtractSeeds()),
  defineStep(26, "Recall and apply multiplication facts", "Multiplication facts", "Recall multiplication facts and connect them to equal groups.", multiplicationParent, multiplicationFactsSeeds()),
  defineStep(27, "Multiply and divide using arrays, grouping and known facts", "Arrays, groups and facts", "Use arrays, equal groups and known facts to multiply and divide.", multiplicationParent, arrayDivisionSeeds()),
  defineStep(28, "Estimate and check reasonableness", "Estimate and check", "Use friendly numbers and rough answers to check whether results make sense.", placeValueParent, estimateSeeds()),
  defineStep(29, "Recognise and represent unit fractions and simple fractions", "Simple fractions", "Represent unit fractions and simple fractions with equal parts.", fractionsParent, fractionSeeds()),
  defineStep(30, "Solve practical number problems including money", "Money problems", "Use number knowledge in shopping, change and practical comparisons.", moneyParent, moneySeeds()),
] as const satisfies MiddlePrimaryStepAssessmentDefinition[];

export const NUMBER_MIDDLE_PRIMARY_STEP_ASSESSMENT_ITEMS =
  NUMBER_MIDDLE_PRIMARY_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
