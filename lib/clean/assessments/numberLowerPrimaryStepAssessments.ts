import type {
  NumberAssessmentBankItem,
  NumberAssessmentBankKey,
} from "@/lib/clean/assessments/numberAssessmentBanks";
import { NUMBER_ADDITIVE_STRATEGIES_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberAdditiveStrategiesAssessmentItems";
import { NUMBER_FRACTIONS_FOUNDATIONS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberFractionsFoundationsAssessmentItems";
import { NUMBER_MULTIPLICATION_DIVISION_FLUENCY_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberMultiplicationDivisionFluencyAssessmentItems";
import { NUMBER_PLACE_VALUE_OPERATIONS_ITEM_BANK_KEY } from "@/lib/clean/assessments/numberPlaceValueOperationsAssessmentItems";

export type LowerPrimaryStepAssessmentDefinition = {
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

const STAGE_KEY = "lower-primary";

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

function item(
  step: {
    number: number;
    key: string;
    description: string;
    progressionBandKey: string;
  },
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
    format: "early_number_visual_card",
    options: seed.options,
    expectedAnswer: seed.answer,
    acceptableAnswers: [seed.answer],
    markingGuide: "Auto-check the selected option.",
    workedSolution: seed.answer,
    misconceptionTargets: seed.misconceptionTargets,
    adaptiveRoute: {
      ifIncorrectGoToStepKey: step.key,
      ifCorrectGoToStepKey: step.key,
      practiceRecommendation: "Practise this exact pathway step with visual number cards.",
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
): LowerPrimaryStepAssessmentDefinition {
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
      item(
        {
          number: stepNumber,
          key: stepKey,
          description,
          progressionBandKey: parent.progressionBandKey,
        },
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

function sequenceSeeds(): Seed[] {
  return [
    [34, "35", "What number comes next after 34?"],
    [72, "71", "What number comes before 72?"],
    [98, "99", "Count on one from 98. What number comes next?"],
    [40, "39", "Count back one from 40. What number comes before?"],
    [106, "107", "What number comes next after 106?"],
    [120, "119", "What number comes before 120?"],
    [58, "60", "Count by twos: 56, 58, __."],
    [85, "80", "Count back by fives: 90, 85, __."],
    [13, "16", "Count on: 13, 14, 15, __."],
    [50, "47", "Count back: 50, 49, 48, __."],
    [99, "100", "What number comes after 99?"],
    [101, "100", "What number comes before 101?"],
  ].map(([start, answer, prompt], index) => ({
    cluster: index % 4 === 0 ? "count-forwards" : index % 4 === 1 ? "count-backwards" : index % 4 === 2 ? "cross-tens" : "skip-and-track",
    clusterTitle: index % 4 === 0 ? "Count forwards" : index % 4 === 1 ? "Count backwards" : index % 4 === 2 ? "Cross tens" : "Skip and track",
    title: `Sequence ${index + 1}`,
    prompt: prompt as string,
    options: [String(Number(answer) - 1), String(answer), String(Number(answer) + 1)],
    answer: answer as string,
    visual: `early-number|caption=Use the number track near ${start}.|numbers=${Number(answer) - 1},${answer},${Number(answer) + 1}`,
    misconceptionTargets: ["counting-sequence-slip", "crossing-ten-boundary-error"],
  }));
}

function readWriteOrderSeeds(): Seed[] {
  return [
    [42, "42", "Which number is forty-two?"],
    [17, "17", "Which number is seventeen?"],
    [64, "64", "Which number matches 6 tens and 4 ones?"],
    [83, "83", "Which number matches 8 tens and 3 ones?"],
    [35, "35", "Which number is between 34 and 36?"],
    [76, "76", "Which number is just after 75?"],
    [29, "29", "Which number is just before 30?"],
    [100, "100", "Which number is one hundred?"],
    [58, "58", "Which number matches fifty-eight?"],
    [91, "91", "Which number matches 9 tens and 1 one?"],
    [24, "24", "Which is the smallest number: 24, 42 or 34?"],
    [87, "87", "Which is the largest number: 78, 87 or 68?"],
  ].map(([value, answer, prompt], index) => ({
    cluster: index % 4 === 0 ? "read-numbers" : index % 4 === 1 ? "write-numbers" : index % 4 === 2 ? "place-value-match" : "order-numbers",
    clusterTitle: index % 4 === 0 ? "Read numbers" : index % 4 === 1 ? "Write numbers" : index % 4 === 2 ? "Place-value match" : "Order numbers",
    title: `Read and order ${value}`,
    prompt: prompt as string,
    options: [String(Number(answer) - 1), String(answer), String(Number(answer) + 10)],
    answer: answer as string,
    visual: `early-number|caption=Look at the number cards.|numbers=${Number(answer) - 1},${answer},${Number(answer) + 10}`,
    misconceptionTargets: ["teen-ty-number-confusion", "tens-ones-reversal"],
  }));
}

function skipCountSeeds(): Seed[] {
  return [
    ["2s", "8", "Count by 2s: 2, 4, 6, __."],
    ["5s", "20", "Count by 5s: 5, 10, 15, __."],
    ["10s", "40", "Count by 10s: 10, 20, 30, __."],
    ["2s", "14", "Count by 2s: 8, 10, 12, __."],
    ["5s", "35", "Count by 5s: 20, 25, 30, __."],
    ["10s", "70", "Count by 10s: 40, 50, 60, __."],
    ["2s", "18", "Which number belongs in the 2s count?"],
    ["5s", "45", "Which number belongs in the 5s count?"],
    ["10s", "90", "Which number belongs in the 10s count?"],
    ["2s", "20", "Count by 2s after 18."],
    ["5s", "50", "Count by 5s after 45."],
    ["10s", "100", "Count by 10s after 90."],
  ].map(([pattern, answer, prompt]) => ({
    cluster: pattern as string,
    clusterTitle: `Skip count by ${pattern}`,
    title: `Skip count ${pattern}`,
    prompt: prompt as string,
    options: [String(Number(answer) - 1), String(answer), String(Number(answer) + 1)],
    answer: answer as string,
    visual: `early-number|caption=Use the skip-count number cards.|numbers=${Number(answer) - 10},${Number(answer) - 5},${answer}`,
    misconceptionTargets: ["skip-count-step-error", "counting-pattern-gap"],
  }));
}

function tensSeeds(): Seed[] {
  return [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 30, 60].map((value, index) => ({
    cluster: index % 4 === 0 ? "make-a-ten" : index % 4 === 1 ? "count-tens" : index % 4 === 2 ? "tens-and-ones" : "ten-as-a-unit",
    clusterTitle: index % 4 === 0 ? "Make a ten" : index % 4 === 1 ? "Count tens" : index % 4 === 2 ? "Tens and ones" : "Ten as one group",
    title: `${value} as tens`,
    prompt: value === 10 ? "How many ones make one ten?" : `How many tens are in ${value}?`,
    options: value === 10 ? ["9", "10", "11"] : [String(value / 10 - 1), String(value / 10), String(value / 10 + 1)],
    answer: value === 10 ? "10" : String(value / 10),
    visual: `early-number|caption=Use tens frames.|groups=${value / 10}|labels=tens`,
    misconceptionTargets: ["ten-ones-unit-confusion", "place-value-grouping-gap"],
  }));
}

function partitionSeeds(): Seed[] {
  return [34, 52, 47, 86, 29, 63, 75, 91, 18, 40, 68, 99].map((value, index) => {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return {
      cluster: index % 4 === 0 ? "tens-part" : index % 4 === 1 ? "ones-part" : index % 4 === 2 ? "match-partition" : "build-number",
      clusterTitle: index % 4 === 0 ? "Tens part" : index % 4 === 1 ? "Ones part" : index % 4 === 2 ? "Match a partition" : "Build a number",
      title: `Partition ${value}`,
      prompt: `Which parts make ${value}?`,
      options: [`${tens} tens and ${ones} ones`, `${ones} tens and ${tens} ones`, `${tens + 1} tens and ${ones} ones`],
      answer: `${tens} tens and ${ones} ones`,
      visual: `early-number|caption=Build ${value} with tens and ones.|groups=${tens},${ones}|labels=tens,ones`,
      misconceptionTargets: ["tens-ones-reversal", "place-value-partition-gap"],
    };
  });
}

function renameSeeds(): Seed[] {
  return [26, 34, 42, 51, 63, 75, 80, 91, 28, 46, 57, 69].map((value, index) => {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return {
      cluster: index % 4 === 0 ? "rename-one-ten" : index % 4 === 1 ? "flexible-tens" : index % 4 === 2 ? "same-number" : "regroup-ones",
      clusterTitle: index % 4 === 0 ? "Rename one ten" : index % 4 === 1 ? "Flexible tens" : index % 4 === 2 ? "Same number" : "Regroup ones",
      title: `Rename ${value}`,
      prompt: `Which is another way to make ${value}?`,
      options: [`${tens - 1} tens and ${ones + 10} ones`, `${tens} tens and ${ones + 10} ones`, `${tens + 1} tens and ${ones} ones`],
      answer: `${tens - 1} tens and ${ones + 10} ones`,
      visual: `early-number|caption=Rename ${value} by trading one ten.|groups=${tens},${ones}|labels=tens,ones`,
      misconceptionTargets: ["regrouping-place-value-gap", "tens-ones-reversal"],
    };
  });
}

function additiveSeeds(): Seed[] {
  return [
    [8, 5, "13", "How many altogether?"],
    [14, -6, "8", "How many are left?"],
    [9, 7, "16", "How many altogether?"],
    [18, -9, "9", "How many are left?"],
    [6, 6, "12", "Double 6 is what number?"],
    [15, -7, "8", "What is 15 take away 7?"],
    [10, 4, "14", "10 and 4 more makes what?"],
    [17, -8, "9", "What is 17 take away 8?"],
    [7, 8, "15", "How many altogether?"],
    [20, -5, "15", "How many are left?"],
    [9, 9, "18", "Double 9 is what number?"],
    [13, -4, "9", "What is 13 take away 4?"],
  ].map(([a, b, answer, prompt], index) => ({
    cluster: Number(b) > 0 ? "addition-facts" : "subtraction-facts",
    clusterTitle: Number(b) > 0 ? "Addition facts" : "Subtraction facts",
    title: `Fact ${index + 1}`,
    prompt: prompt as string,
    options: [String(Number(answer) - 1), String(answer), String(Number(answer) + 1)],
    answer: answer as string,
    visual: `early-number|caption=Use the counters.|groups=${a},${Math.abs(Number(b))}|labels=start,change`,
    misconceptionTargets: ["known-fact-recall-gap", "addition-subtraction-confusion"],
  }));
}

function supportedAdditiveSeeds(): Seed[] {
  return [24, 36, 45, 58, 67, 72, 83, 91, 28, 49, 55, 76].map((value, index) => {
    const add = index % 2 === 0 ? 5 : -4;
    const answer = value + add;
    return {
      cluster: add > 0 ? "add-with-support" : "subtract-with-support",
      clusterTitle: add > 0 ? "Add with support" : "Subtract with support",
      title: `Supported calculation ${index + 1}`,
      prompt: add > 0 ? `${value} add 5. What is the answer?` : `${value} take away 4. What is the answer?`,
      options: [String(answer - 1), String(answer), String(answer + 1)],
      answer: String(answer),
      visual: `early-number|caption=Use tens and ones to solve.|groups=${Math.floor(value / 10)},${value % 10},${Math.abs(add)}|labels=tens,ones,change`,
      misconceptionTargets: ["place-value-calculation-gap", "counting-on-error"],
    };
  });
}

function equalGroupsSeeds(): Seed[] {
  return [
    [2, 3, "6", "Two groups of three. How many altogether?"],
    [3, 2, "6", "Three groups of two. How many altogether?"],
    [4, 2, "8", "Four groups of two. How many altogether?"],
    [2, 5, "10", "Two groups of five. How many altogether?"],
    [3, 3, "9", "Three groups of three. How many altogether?"],
    [5, 2, "10", "Five groups of two. How many altogether?"],
    [4, 3, "12", "Four groups of three. How many altogether?"],
    [3, 4, "12", "Three groups of four. How many altogether?"],
    [2, 4, "8", "Two rows of four. How many altogether?"],
    [4, 4, "16", "Four groups of four. How many altogether?"],
    [5, 3, "15", "Five groups of three. How many altogether?"],
    [2, 6, "12", "Two groups of six. How many altogether?"],
  ].map(([groups, size, answer, prompt], index) => ({
    cluster: index % 2 === 0 ? "equal-groups" : "arrays",
    clusterTitle: index % 2 === 0 ? "Equal groups" : "Arrays",
    title: `Groups ${index + 1}`,
    prompt: prompt as string,
    options: [String(Number(answer) - 1), String(answer), String(Number(answer) + 2)],
    answer: answer as string,
    visual: `early-number|caption=See ${groups} groups of ${size}.|groups=${groups},${size}|labels=groups,in each group`,
    misconceptionTargets: ["equal-groups-counting-error", "array-structure-gap"],
  }));
}

function fractionSeeds(): Seed[] {
  return [
    ["one half", "Which picture shows one half?", ["one half", "one quarter", "whole"]],
    ["one quarter", "Which picture shows one quarter?", ["one half", "one quarter", "whole"]],
    ["2 equal parts", "A whole is shared into two equal parts. What are the parts called?", ["halves", "quarters", "ones"]],
    ["4 equal parts", "A whole is shared into four equal parts. What are the parts called?", ["halves", "quarters", "ones"]],
    ["fair share", "Which sharing is fair?", ["same amount for each person", "one person gets all", "one part is much bigger"]],
    ["not fair", "Which picture is not a fair share?", ["unequal parts", "equal halves", "equal quarters"]],
    ["half of 6", "Share 6 counters equally between 2. How many each?", ["2", "3", "4"]],
    ["quarter of 8", "Share 8 counters equally between 4. How many each?", ["1", "2", "4"]],
    ["one half", "Which word matches 1/2?", ["one half", "one quarter", "one whole"]],
    ["one quarter", "Which word matches 1/4?", ["one half", "one quarter", "one whole"]],
    ["equal parts", "What must be true for halves?", ["parts are equal", "parts are different sizes", "there are 4 parts"]],
    ["equal parts", "What must be true for quarters?", ["4 equal parts", "2 unequal parts", "1 whole only"]],
  ].map(([answer, prompt, options], index) => ({
    cluster: index % 4 === 0 ? "halves" : index % 4 === 1 ? "quarters" : index % 4 === 2 ? "fair-sharing" : "equal-parts",
    clusterTitle: index % 4 === 0 ? "Halves" : index % 4 === 1 ? "Quarters" : index % 4 === 2 ? "Fair sharing" : "Equal parts",
    title: `Fractions ${index + 1}`,
    prompt: prompt as string,
    options: options as string[],
    answer: answer as string,
    visual: "early-number|caption=Use the sharing picture.|groups=2,4|labels=halves,quarters",
    misconceptionTargets: ["equal-parts-confusion", "fair-sharing-gap"],
  }));
}

export const NUMBER_LOWER_PRIMARY_STEP_ASSESSMENTS = [
  defineStep(11, "Count forwards and backwards within 100 or 120", "Count within 120", "Count forwards and backwards through two-digit and early three-digit numbers.", placeValueParent, sequenceSeeds()),
  defineStep(12, "Read, write and order numbers to 100 or 120", "Read and order to 120", "Read, write, compare and order numbers to 100 or 120.", placeValueParent, readWriteOrderSeeds()),
  defineStep(13, "Skip count by 2s, 5s and 10s", "Skip count", "Use repeated counting patterns by 2s, 5s and 10s.", placeValueParent, skipCountSeeds()),
  defineStep(14, "Understand that ten ones make one ten", "Ten ones make one ten", "See ten ones as one ten and count groups of ten.", placeValueParent, tensSeeds()),
  defineStep(15, "Partition two-digit numbers into tens and ones", "Tens and ones", "Break two-digit numbers into tens and ones.", placeValueParent, partitionSeeds()),
  defineStep(16, "Rename two-digit numbers in different ways", "Rename two-digit numbers", "Regroup tens and ones to rename the same two-digit number.", placeValueParent, renameSeeds()),
  defineStep(17, "Add and subtract within 20 using known facts", "Facts within 20", "Use known facts to add and subtract within 20.", additiveParent, additiveSeeds()),
  defineStep(18, "Add and subtract one- and two-digit numbers with support", "Supported addition and subtraction", "Use drawings, counters and place-value support to add and subtract.", additiveParent, supportedAdditiveSeeds()),
  defineStep(19, "Understand simple equal groups and arrays", "Equal groups and arrays", "Recognise equal groups and arrays as early multiplication and division structures.", multiplicationParent, equalGroupsSeeds()),
  defineStep(20, "Begin halves, quarters and simple sharing", "Halves, quarters and sharing", "Use fair sharing language for halves, quarters and simple equal parts.", fractionsParent, fractionSeeds()),
] as const satisfies LowerPrimaryStepAssessmentDefinition[];

export const NUMBER_LOWER_PRIMARY_STEP_ASSESSMENT_ITEMS =
  NUMBER_LOWER_PRIMARY_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
