import type { NumberAssessmentBankItem } from "@/lib/clean/assessments/numberAssessmentBanks";

export type FoundationStepAssessmentDefinition = {
  key: string;
  stepNumber: number;
  stepKey: string;
  pathwayStepId: string;
  title: string;
  shortTitle: string;
  description: string;
  items: NumberAssessmentBankItem[];
};

const PROGRESSION_BAND_KEY = "place-value-and-whole-number-operations";
const STAGE_KEY = "foundation-kindergarten";

function stepKey(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pathwayStepId(key: string) {
  return `mathematics::number-and-place-value::${STAGE_KEY}::${key}`;
}

function visual(description: string) {
  return {
    type: "context_card" as const,
    description,
  };
}

type ItemSeed = {
  cluster: string;
  clusterTitle: string;
  title: string;
  prompt: string;
  options: string[];
  answer: string;
  visual: string;
  misconceptionTargets: string[];
};

function makeItem(
  step: { number: number; key: string; description: string },
  seed: ItemSeed,
  index: number,
): NumberAssessmentBankItem {
  return {
    id: `number-step-${step.number}-assess-${String(index + 1).padStart(3, "0")}`,
    progressionBandKey: PROGRESSION_BAND_KEY,
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
      diagnosticNote: "This checks the learner's early number understanding for this pathway step.",
    },
    visualSupport: visual(seed.visual),
  };
}

function defineStep(
  stepNumber: number,
  title: string,
  shortTitle: string,
  description: string,
  seeds: ItemSeed[],
): FoundationStepAssessmentDefinition {
  const key = stepKey(title);
  return {
    key: `number-step-${stepNumber}-${key}-assessment-v1`,
    stepNumber,
    stepKey: key,
    pathwayStepId: pathwayStepId(key),
    title,
    shortTitle,
    description,
    items: seeds.map((seed, index) =>
      makeItem({ number: stepNumber, key, description }, seed, index),
    ),
  };
}

const spokenNumberSeeds: ItemSeed[] = [
  ["one-to-three", "Number words 1-3", "Word one", "The word is one. Which group matches?", ["1 counter", "2 counters", "3 counters"], "1 counter", "early-number|caption=Find one counter.|groups=1,2,3|labels=1 counter,2 counters,3 counters", ["number-word-quantity-gap"]],
  ["one-to-three", "Number words 1-3", "Word three", "The word is three. Which group matches?", ["2 counters", "3 counters", "4 counters"], "3 counters", "early-number|caption=Find three counters.|groups=2,3,4|labels=2 counters,3 counters,4 counters", ["number-word-quantity-gap"]],
  ["four-to-five", "Number words 4-5", "Word four", "The word is four. Which group matches?", ["3 counters", "4 counters", "5 counters"], "4 counters", "early-number|caption=Find four counters.|groups=3,4,5|labels=3 counters,4 counters,5 counters", ["four-five-word-confusion"]],
  ["zero-and-none", "Zero and none", "Word zero", "The word is zero. Which card matches?", ["No counters", "1 counter", "2 counters"], "No counters", "early-number|caption=Find no counters.|groups=0,1,2|labels=No counters,1 counter,2 counters", ["zero-means-one-error"]],
  ["six-to-ten", "Number words 6-10", "Word six", "The word is six. Which group matches?", ["5 counters", "6 counters", "7 counters"], "6 counters", "early-number|caption=Find six counters.|groups=5,6,7|labels=5 counters,6 counters,7 counters", ["teen-and-six-confusion"]],
  ["six-to-ten", "Number words 6-10", "Word eight", "The word is eight. Which group matches?", ["7 counters", "8 counters", "9 counters"], "8 counters", "early-number|caption=Find eight counters.|groups=7,8,9|labels=7 counters,8 counters,9 counters", ["number-word-quantity-gap"]],
  ["matching", "Match word to group", "Two groups", "Which group matches the word five?", ["Card A", "Card B", "Card C"], "Card B", "early-number|caption=Card B has five counters.|groups=4,5,6|labels=Card A,Card B,Card C", ["one-to-one-word-gap"]],
  ["matching", "Match word to group", "Ten group", "Which card shows ten?", ["Card A", "Card B", "Card C"], "Card C", "early-number|caption=Card C has ten counters.|groups=8,9,10|labels=Card A,Card B,Card C", ["counting-sequence-word-gap"]],
  ["same-word", "Same number word", "Same as seven", "Seven is said. Which card shows the same number?", ["6", "7", "8"], "7", "early-number|caption=Find the numeral seven.|numbers=6,7,8", ["number-word-numeral-gap"]],
  ["same-word", "Same number word", "Same as two", "Two is said. Which card shows the same number?", ["1", "2", "3"], "2", "early-number|caption=Find the numeral two.|numbers=1,2,3", ["number-word-numeral-gap"]],
  ["listen-and-choose", "Listen and choose", "Five or six", "The word is five. Which one is right?", ["5", "6", "7"], "5", "early-number|caption=Find five.|numbers=5,6,7", ["adjacent-number-word-confusion"]],
  ["listen-and-choose", "Listen and choose", "Nine", "The word is nine. Which group matches?", ["8 counters", "9 counters", "10 counters"], "9 counters", "early-number|caption=Find nine counters.|groups=8,9,10|labels=8 counters,9 counters,10 counters", ["number-word-quantity-gap"]],
].map(([cluster, clusterTitle, title, prompt, options, answer, visualText, misconceptionTargets]) => ({
  cluster,
  clusterTitle,
  title,
  prompt,
  options,
  answer,
  visual: visualText,
  misconceptionTargets,
} as ItemSeed));

const numeralSeeds: ItemSeed[] = [
  ["recognise-0-to-3", "Recognise 0-3", "Find 2", "Which number is 2?", ["1", "2", "3"], "2", "early-number|caption=Choose the number 2.|numbers=1,2,3", ["numeral-recognition-gap"]],
  ["recognise-0-to-3", "Recognise 0-3", "Find 0", "Which number is 0?", ["0", "1", "10"], "0", "early-number|caption=Choose zero.|numbers=0,1,10", ["zero-ten-confusion"]],
  ["recognise-4-to-6", "Recognise 4-6", "Find 5", "Which number is 5?", ["4", "5", "6"], "5", "early-number|caption=Choose five.|numbers=4,5,6", ["reversed-or-adjacent-numeral-confusion"]],
  ["recognise-4-to-6", "Recognise 4-6", "Find 6", "Which number is 6?", ["5", "6", "9"], "6", "early-number|caption=Choose six.|numbers=5,6,9", ["six-nine-confusion"]],
  ["recognise-7-to-10", "Recognise 7-10", "Find 8", "Which number is 8?", ["6", "8", "9"], "8", "early-number|caption=Choose eight.|numbers=6,8,9", ["numeral-recognition-gap"]],
  ["recognise-7-to-10", "Recognise 7-10", "Find 10", "Which number is 10?", ["1", "10", "0"], "10", "early-number|caption=Choose ten.|numbers=1,10,0", ["one-zero-ten-confusion"]],
  ["match-numeral-quantity", "Match numerals and groups", "4 matches", "Which group matches 4?", ["3 counters", "4 counters", "5 counters"], "4 counters", "early-number|caption=Match 4 to four counters.|groups=3,4,5|labels=3 counters,4 counters,5 counters", ["numeral-quantity-match-gap"]],
  ["match-numeral-quantity", "Match numerals and groups", "7 matches", "Which group matches 7?", ["6 counters", "7 counters", "8 counters"], "7 counters", "early-number|caption=Match 7 to seven counters.|groups=6,7,8|labels=6 counters,7 counters,8 counters", ["numeral-quantity-match-gap"]],
  ["mixed-numerals", "Mixed numerals", "Choose 3", "Which card shows 3?", ["2", "3", "8"], "3", "early-number|caption=Choose three.|numbers=2,3,8", ["numeral-recognition-gap"]],
  ["mixed-numerals", "Mixed numerals", "Choose 9", "Which card shows 9?", ["6", "8", "9"], "9", "early-number|caption=Choose nine.|numbers=6,8,9", ["six-nine-confusion"]],
  ["mixed-numerals", "Mixed numerals", "Choose 1", "Which card shows 1?", ["1", "7", "10"], "1", "early-number|caption=Choose one.|numbers=1,7,10", ["one-ten-confusion"]],
  ["mixed-numerals", "Mixed numerals", "Choose 4", "Which number matches four counters?", ["3", "4", "5"], "4", "early-number|caption=Four counters need number 4.|groups=4|labels=four counters", ["numeral-quantity-match-gap"]],
].map(([cluster, clusterTitle, title, prompt, options, answer, visualText, misconceptionTargets]) => ({
  cluster,
  clusterTitle,
  title,
  prompt,
  options,
  answer,
  visual: visualText,
  misconceptionTargets,
} as ItemSeed));

function countSeeds(limit: number, stepNumber: number): ItemSeed[] {
  const values = stepNumber === 4 ? [3, 5, 7, 10, 4, 6, 8, 9, 2, 10, 5, 7] : [12, 15, 18, 20, 11, 14, 16, 19, 13, 17, 10, 20];
  return values.map((value, index) => ({
    cluster: index % 4 === 0 ? `count-to-${limit}` : index % 4 === 1 ? "one-to-one-counting" : index % 4 === 2 ? "last-number-tells-how-many" : "keep-track-while-counting",
    clusterTitle: index % 4 === 0 ? `Count to ${limit}` : index % 4 === 1 ? "One-to-one counting" : index % 4 === 2 ? "Last number tells how many" : "Keep track while counting",
    title: `Count ${value}`,
    prompt: "Count the counters. How many?",
    options: [String(value - 1), String(value), String(value + 1)],
    answer: String(value),
    visual: `early-number|caption=Count the counters.|groups=${value}|labels=counters`,
    misconceptionTargets: ["one-to-one-counting-error", "counting-sequence-slip"],
  }));
}

const compareSeeds: ItemSeed[] = [
  [3, 5, "Card B has more", "Which group has more?"],
  [6, 4, "Card A has more", "Which group has more?"],
  [5, 5, "They are the same", "Which one has more?"],
  [2, 4, "Card A has fewer", "Which group has fewer?"],
  [7, 6, "Card B has fewer", "Which group has fewer?"],
  [8, 8, "They are the same", "Which one has fewer?"],
  [9, 10, "Card B has more", "Which group has more?"],
  [10, 7, "Card B has fewer", "Which group has fewer?"],
  [4, 6, "Card A has fewer", "Which group has fewer?"],
  [6, 6, "They are the same", "Which one has more?"],
  [1, 3, "Card B has more", "Which group has more?"],
  [5, 2, "Card B has fewer", "Which group has fewer?"],
].map(([a, b, answer, prompt], index) => ({
  cluster: index % 4 === 0 ? "more" : index % 4 === 1 ? "fewer" : index % 4 === 2 ? "same" : "compare-without-spacing",
  clusterTitle: index % 4 === 0 ? "More" : index % 4 === 1 ? "Fewer" : index % 4 === 2 ? "Same amount" : "Compare carefully",
  title: `Compare ${a} and ${b}`,
  prompt,
  options: ["Card A has more", "Card B has more", "They are the same", "Card A has fewer", "Card B has fewer"].includes(answer as string)
    ? ["Card A has more", "Card B has more", "They are the same", "Card A has fewer", "Card B has fewer"].slice(0, 3).includes(answer as string)
      ? ["Card A has more", "Card B has more", "They are the same"]
      : ["Card A has fewer", "Card B has fewer", "They are the same"]
    : ["Card A", "Card B", "They are the same"],
  answer: answer as string,
  visual: `early-number|caption=Compare the two cards.|groups=${a},${b}|labels=Card A,Card B`,
  misconceptionTargets: ["comparison-language-confusion", "spacing-quantity-confusion"],
} as ItemSeed));

const orderSeeds: ItemSeed[] = [
  ["2,3,4", "3", "Which number comes after 2?"],
  ["4,5,6", "5", "Which number comes between 4 and 6?"],
  ["7,8,9", "8", "Which number comes before 9?"],
  ["1,2,3", "2", "Which number comes after 1?"],
  ["5,6,7", "7", "Which number comes after 6?"],
  ["8,9,10", "9", "Which number comes between 8 and 10?"],
  ["3,4,5", "3", "Which number comes before 4?"],
  ["6,7,8", "8", "Which number comes after 7?"],
  ["0,1,2", "1", "Which number comes between 0 and 2?"],
  ["2,3,4", "4", "Which number comes after 3?"],
  ["7,8,9", "7", "Which number comes before 8?"],
  ["9,10,11", "10", "Which number comes after 9?"],
].map(([numbers, answer, prompt], index) => ({
  cluster: index % 4 === 0 ? "next-number" : index % 4 === 1 ? "between-number" : index % 4 === 2 ? "before-number" : "short-sequence",
  clusterTitle: index % 4 === 0 ? "Next number" : index % 4 === 1 ? "Between numbers" : index % 4 === 2 ? "Before number" : "Short sequence",
  title: `Order ${numbers}`,
  prompt,
  options: (numbers as string).split(","),
  answer: answer as string,
  visual: `early-number|caption=Use the number strip.|numbers=${numbers}`,
  misconceptionTargets: ["number-order-confusion", "before-after-language-gap"],
} as ItemSeed));

const partitionSeeds: ItemSeed[] = [
  [5, "2 and 3", ["1 and 4", "2 and 3", "5 and 1"]],
  [4, "1 and 3", ["1 and 3", "2 and 3", "4 and 1"]],
  [6, "4 and 2", ["3 and 2", "4 and 2", "6 and 2"]],
  [7, "5 and 2", ["5 and 2", "4 and 4", "7 and 1"]],
  [8, "3 and 5", ["3 and 5", "4 and 5", "8 and 2"]],
  [10, "6 and 4", ["5 and 4", "6 and 4", "10 and 1"]],
  [3, "1 and 2", ["1 and 2", "2 and 2", "3 and 1"]],
  [9, "4 and 5", ["4 and 5", "5 and 5", "9 and 2"]],
  [6, "1 and 5", ["1 and 5", "2 and 5", "6 and 1"]],
  [7, "3 and 4", ["3 and 4", "4 and 4", "7 and 3"]],
  [8, "2 and 6", ["2 and 6", "3 and 6", "8 and 1"]],
  [10, "5 and 5", ["4 and 5", "5 and 5", "6 and 5"]],
].map(([total, answer, options], index) => ({
  cluster: index % 4 === 0 ? "make-a-number" : index % 4 === 1 ? "break-apart" : index % 4 === 2 ? "combine-parts" : "different-parts",
  clusterTitle: index % 4 === 0 ? "Make a number" : index % 4 === 1 ? "Break apart" : index % 4 === 2 ? "Combine parts" : "Different parts",
  title: `Make ${total}`,
  prompt: `Which parts make ${total}?`,
  options: options as string[],
  answer: answer as string,
  visual: `early-number|caption=Make ${total} counters.|groups=${total}|labels=${total} counters`,
  misconceptionTargets: ["part-whole-confusion", "combining-small-collections-error"],
} as ItemSeed));

const storySeeds: ItemSeed[] = [
  [2, 1, "3", "Two counters join one more. How many now?"],
  [5, -2, "3", "Five counters. Two are taken away. How many left?"],
  [3, 2, "5", "Three counters join two more. How many now?"],
  [4, -1, "3", "Four counters. One is taken away. How many left?"],
  [6, 2, "8", "Six counters join two more. How many now?"],
  [7, -3, "4", "Seven counters. Three are taken away. How many left?"],
  [1, 4, "5", "One counter joins four more. How many now?"],
  [9, -4, "5", "Nine counters. Four are taken away. How many left?"],
  [4, 3, "7", "Four counters join three more. How many now?"],
  [8, -5, "3", "Eight counters. Five are taken away. How many left?"],
  [5, 5, "10", "Five counters join five more. How many now?"],
  [10, -6, "4", "Ten counters. Six are taken away. How many left?"],
].map(([start, change, answer, prompt], index) => ({
  cluster: Number(change) > 0 ? "joining-stories" : "taking-away-stories",
  clusterTitle: Number(change) > 0 ? "Joining stories" : "Taking away stories",
  title: `Story ${index + 1}`,
  prompt: prompt as string,
  options: [String(Number(answer) - 1), String(answer), String(Number(answer) + 1)],
  answer: answer as string,
  visual: `early-number|caption=Use counters for the story.|groups=${start},${Math.abs(Number(change))}|labels=start,change`,
  misconceptionTargets: ["operation-story-confusion", "count-all-vs-change-confusion"],
} as ItemSeed));

const shareSeeds: ItemSeed[] = [
  [4, "2 each", "Share 4 counters between 2 children. How many each?"],
  [6, "3 each", "Share 6 counters between 2 children. How many each?"],
  [2, "1 each", "Share 2 counters between 2 children. How many each?"],
  [8, "4 each", "Share 8 counters between 2 children. How many each?"],
  [10, "5 each", "Share 10 counters between 2 children. How many each?"],
  [6, "2 each", "Share 6 counters between 3 children. How many each?"],
  [9, "3 each", "Share 9 counters between 3 children. How many each?"],
  [3, "1 each", "Share 3 counters between 3 children. How many each?"],
  [5, "Not fair", "Can 5 counters be shared equally between 2 children with no leftovers?"],
  [7, "Not fair", "Can 7 counters be shared equally between 2 children with no leftovers?"],
  [8, "2 each", "Share 8 counters between 4 children. How many each?"],
  [4, "1 each", "Share 4 counters between 4 children. How many each?"],
].map(([total, answer, prompt], index) => ({
  cluster: index < 5 ? "share-between-two" : index < 8 ? "share-between-three" : index < 10 ? "fair-or-not-fair" : "share-between-four",
  clusterTitle: index < 5 ? "Share between two" : index < 8 ? "Share between three" : index < 10 ? "Fair or not fair" : "Share between four",
  title: `Share ${total}`,
  prompt: prompt as string,
  options: answer === "Not fair" ? ["Fair", "Not fair", "Same as 10"] : [answer as string, `${Number(String(answer).split(" ")[0]) + 1} each`, `${Math.max(0, Number(String(answer).split(" ")[0]) - 1)} each`],
  answer: answer as string,
  visual: `early-number|caption=Share the counters fairly.|groups=${total}|labels=${total} counters`,
  misconceptionTargets: ["fair-sharing-gap", "equal-groups-confusion"],
} as ItemSeed));

export const NUMBER_FOUNDATION_STEP_ASSESSMENTS = [
  defineStep(2, "Match spoken number names to quantities", "Number names to quantities", "Connect spoken number words to groups of objects.", spokenNumberSeeds),
  defineStep(3, "Identify numerals 0-10", "Identify numerals", "Recognise written numerals from 0 to 10 and connect them to groups.", numeralSeeds),
  defineStep(4, "Count objects accurately to 10", "Count to 10", "Count small collections with one number for each object.", countSeeds(10, 4)),
  defineStep(5, "Count objects accurately to 20", "Count to 20", "Count collections beyond 10 while keeping track.", countSeeds(20, 5)),
  defineStep(6, "Compare groups as more, fewer or same", "Compare groups", "Compare two groups using more, fewer and same.", compareSeeds),
  defineStep(7, "Order numbers in a short sequence", "Order numbers", "Use before, after and between to order short number sequences.", orderSeeds),
  defineStep(8, "Partition and combine small collections up to 10", "Make numbers to 10", "Break small numbers apart and combine parts to make totals up to 10.", partitionSeeds),
  defineStep(9, "Represent simple addition and subtraction stories with objects", "Object stories", "Use objects to show simple joining and taking-away stories.", storySeeds),
  defineStep(10, "Share small collections equally", "Share equally", "Share small collections fairly and notice equal groups.", shareSeeds),
] as const satisfies FoundationStepAssessmentDefinition[];

export const NUMBER_FOUNDATION_STEP_ASSESSMENT_ITEMS =
  NUMBER_FOUNDATION_STEP_ASSESSMENTS.flatMap((assessment) => assessment.items);
