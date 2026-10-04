import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

const qCAA = (
  code: string,
  yearLevel: string,
  substrand: string,
): NonNullable<MyLearnaAssessmentItem["curriculum"]> => ({
  country: "Australia",
  jurisdiction: "QCAA Numeracy general capability",
  yearLevel,
  strand: "Number sense and algebra",
  substrand,
  code,
});

const noneStimulus = { type: "none" as const, data: {} };

function shortAnswerItem(input: {
  id: string;
  code: string;
  yearLevel: string;
  substrand: string;
  skillId: string;
  skillName: string;
  description?: string;
  prompt: string;
  correctValue: string;
  acceptableValues?: string[];
  misconceptionTags?: string[];
  stimulus?: MyLearnaAssessmentItem["stimulus"];
  tags: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: qCAA(input.code, input.yearLevel, input.substrand),
    skill: {
      id: input.skillId,
      name: input.skillName,
      ...(input.description ? { description: input.description } : {}),
    },
    misconceptionTags: input.misconceptionTags || [],
    difficulty: 2,
    template: "short-answer",
    prompt: input.prompt,
    stimulus: input.stimulus || noneStimulus,
    response: {
      type: "short-answer",
      correctValue: input.correctValue,
      acceptableValues: input.acceptableValues || [input.correctValue],
    },
    feedback: {
      correct: "Correct.",
      incorrect: "Not quite.",
    },
    analytics: {
      tags: ["assessment-lab", "p0-anchor", ...input.tags],
    },
  };
}

function orderingItem(input: {
  id: string;
  code: string;
  yearLevel: string;
  substrand: string;
  skillId: string;
  skillName: string;
  prompt: string;
  options: Array<{ id: string; label: string; value?: unknown }>;
  correctOptionIds: string[];
  misconceptionTags?: string[];
  stimulus?: MyLearnaAssessmentItem["stimulus"];
  tags: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: qCAA(input.code, input.yearLevel, input.substrand),
    skill: { id: input.skillId, name: input.skillName },
    misconceptionTags: input.misconceptionTags || [],
    difficulty: 2,
    template: "ordering",
    prompt: input.prompt,
    stimulus: input.stimulus || noneStimulus,
    response: {
      type: "ordering",
      options: input.options.map((option) => ({
        id: option.id,
        label: option.label,
        value: option.value ?? option.label,
      })),
      correctOptionIds: input.correctOptionIds,
    },
    feedback: {
      correct: "Correct.",
      incorrect: "Not quite.",
    },
    analytics: {
      tags: ["assessment-lab", "p0-anchor", ...input.tags],
    },
  };
}

function choiceItem(input: {
  id: string;
  code: string;
  yearLevel: string;
  substrand: string;
  skillId: string;
  skillName: string;
  prompt: string;
  options: Array<{ id: string; label: string; value?: unknown }>;
  correctOptionIds: string[];
  multi?: boolean;
  misconceptionTags?: string[];
  stimulus?: MyLearnaAssessmentItem["stimulus"];
  tags: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: qCAA(input.code, input.yearLevel, input.substrand),
    skill: { id: input.skillId, name: input.skillName },
    misconceptionTags: input.misconceptionTags || [],
    difficulty: 2,
    template: "multiple-choice",
    prompt: input.prompt,
    stimulus: input.stimulus || noneStimulus,
    response: {
      type: input.multi ? "multiple-choice" : "single-choice",
      options: input.options.map((option) => ({
        id: option.id,
        label: option.label,
        value: option.value ?? option.label,
      })),
      correctOptionIds: input.correctOptionIds,
    },
    feedback: {
      correct: "Correct.",
      incorrect: "Not quite.",
    },
    analytics: {
      tags: ["assessment-lab", "p0-anchor", ...input.tags],
    },
  };
}


export const NPV_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-search-npv-p01-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P01",
    yearLevel: "Prep",
    substrand: "Number and place value",
    skillId: "npv-p1-small-quantity",
    skillName: "Recognise a very small quantity",
    prompt: "Which numeral matches the collection?",
    stimulus: {
      type: "counter-set",
      data: { quantity: 3, arrangement: "dice", seed: 301, maxQuantity: 3 },
      altText:
        "A very small collection of counters. The quantity is intentionally not stated because recognising it is the task.",
    },
    options: [
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
      { id: "d", label: "4" },
    ],
    correctOptionIds: ["c"],
    misconceptionTags: ["small-quantity-recognition-error"],
    tags: [
      "search-probe",
      "number-place-value",
      "p1",
      "hybrid-routing-only",
      "separate-accessible-form-required",
    ],
  }),
  choiceItem({
    id: "myl-search-npv-p01-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P01",
    yearLevel: "Prep",
    substrand: "Number and place value",
    skillId: "npv-p1-familiar-numeral",
    skillName: "Identify a familiar number name and numeral",
    prompt: "Which numeral is two?",
    options: [
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "5" },
      { id: "d", label: "7" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["familiar-numeral-recognition-error"],
    tags: ["search-probe", "number-place-value", "p1", "hybrid-routing-only"],
  }),
];

export const COUNTING_P2_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-anchor-cnt-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P02",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "counting-p2-small-subitising",
    skillName: "Recognise a small collection",
    prompt: "How many counters are shown?",
    stimulus: {
      type: "counter-set",
      data: { quantity: 5, arrangement: "five-frame", seed: 205, maxQuantity: 5 },
      altText:
        "A small organised collection of counters. The quantity is intentionally not stated because recognising it is the task.",
    },
    options: [
      { id: "a", label: "3" },
      { id: "b", label: "4" },
      { id: "c", label: "5" },
      { id: "d", label: "6" },
    ],
    correctOptionIds: ["c"],
    misconceptionTags: ["small-collection-recognition-error"],
    tags: [
      "counting-processes",
      "p2",
      "cnt-p02-a",
      "hybrid-routing-only",
      "separate-accessible-form-required",
    ],
  }),
  choiceItem({
    id: "myl-anchor-cnt-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P02",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "counting-p2-count-small-set",
    skillName: "Count a very small visible collection",
    prompt: "Which numeral matches the collection?",
    stimulus: {
      type: "counter-set",
      data: { quantity: 3, arrangement: "scattered", seed: 203, maxQuantity: 3 },
      altText:
        "A very small scattered collection of counters. The quantity is intentionally not stated because counting it is the task.",
    },
    options: [
      { id: "a", label: "2" },
      { id: "b", label: "3" },
      { id: "c", label: "4" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["one-to-one-counting-error"],
    tags: [
      "counting-processes",
      "p2",
      "cnt-p02-b",
      "hybrid-routing-only",
      "separate-accessible-form-required",
    ],
  }),
];

export const ADDITIVE_P3_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-anchor-add-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P03",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p3-concealed-total",
    skillName: "Solve an additive task with concealed quantities",
    prompt: "5 counters are hidden under one cup and 3 counters are hidden under another. How many counters are there altogether?",
    correctValue: "8",
    misconceptionTags: ["concealed-quantity-addition-error"],
    tags: ["additive-strategies", "p3", "add-p03-a", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-anchor-add-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P03",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p3-second-concealed-total",
    skillName: "Retain and combine two concealed quantities",
    prompt: "4 counters are hidden in one box and 2 are hidden in another. How many counters are hidden altogether?",
    correctValue: "6",
    misconceptionTags: ["concealed-quantity-addition-error"],
    tags: ["additive-strategies", "p3", "add-p03-b", "hybrid-routing-only"],
  }),
];

export const MULTIPLICATIVE_P3_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-anchor-mul-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P03",
    yearLevel: "Year 2",
    substrand: "Multiplicative strategies",
    skillId: "mul-p3-concealed-equal-groups",
    skillName: "Determine a total from concealed equal groups",
    prompt: "There are 4 closed packs. Each pack has 5 markers inside. How many markers are there altogether?",
    correctValue: "20",
    misconceptionTags: ["composite-unit-total-error", "adds-group-count-to-group-size"],
    tags: ["multiplicative-strategies", "p3", "mul-p03-a", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-anchor-mul-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P03",
    yearLevel: "Year 2",
    substrand: "Multiplicative strategies",
    skillId: "mul-p3-second-concealed-equal-groups",
    skillName: "Count using imagined composite units",
    prompt: "There are 3 closed boxes. Each box has 6 objects inside. How many objects are there altogether?",
    correctValue: "18",
    misconceptionTags: ["composite-unit-total-error"],
    tags: ["multiplicative-strategies", "p3", "mul-p03-b", "hybrid-routing-only"],
  }),
];

export const NPV_P3_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-anchor-npv-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P03",
    yearLevel: "Prep",
    substrand: "Number and place value",
    skillId: "npv-p3-teen-numeral-recognition",
    skillName: "Recognise and interpret teen numerals",
    prompt: "Which numeral shows seventeen?",
    options: [
      { id: "a", label: "71" },
      { id: "b", label: "17" },
      { id: "c", label: "16" },
      { id: "d", label: "27" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["teen-numeral-reversal", "digit-order-confusion"],
    tags: ["number-place-value", "p3", "npv-p03-a"],
  }),
  shortAnswerItem({
    id: "myl-anchor-npv-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P03",
    yearLevel: "Prep",
    substrand: "Number and place value",
    skillId: "npv-p3-ten-and-some-more",
    skillName: "Represent a teen number as one ten and some more",
    prompt: "What number is shown?",
    correctValue: "16",
    stimulus: {
      type: "place-value-blocks",
      data: { tens: 1, ones: 6, layout: "grouped" },
      altText: "Place-value blocks showing one ten and six ones.",
    },
    misconceptionTags: ["teen-number-structure-error"],
    tags: ["number-place-value", "p3", "npv-p03-b"],
  }),
];

export const NPV_P6_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-anchor-npv-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P06",
    yearLevel: "Year 3",
    substrand: "Number and place value",
    skillId: "npv-p6-flexible-renaming",
    skillName: "Flexibly rename a four-digit number",
    prompt: "Select every representation equal to 4,300.",
    options: [
      { id: "four-thousands-three-hundreds", label: "4 thousands and 3 hundreds" },
      { id: "three-thousands-thirteen-hundreds", label: "3 thousands and 13 hundreds" },
      { id: "forty-three-hundreds", label: "43 hundreds" },
      { id: "four-thousands-thirty-hundreds", label: "4 thousands and 30 hundreds" },
      { id: "four-hundreds-three-tens", label: "4 hundreds and 3 tens" },
    ],
    correctOptionIds: [
      "four-thousands-three-hundreds",
      "three-thousands-thirteen-hundreds",
      "forty-three-hundreds",
    ],
    multi: true,
    misconceptionTags: ["flexible-renaming-error", "place-value-partitioning-error"],
    tags: ["number-place-value", "p6", "npv-p06-a", "adapted-existing-item"],
  }),
  shortAnswerItem({
    id: "myl-anchor-npv-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P06",
    yearLevel: "Year 3",
    substrand: "Number and place value",
    skillId: "npv-p6-round-natural",
    skillName: "Round a natural number to the nearest hundred",
    prompt: "3,486 rounded to the nearest 100 is:",
    correctValue: "3500",
    acceptableValues: ["3500", "3,500"],
    misconceptionTags: ["rounding-place-value-error"],
    tags: ["number-place-value", "p6", "npv-p06-b", "adapted-existing-item"],
  }),
];

export const NPV_P9_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  orderingItem({
    id: "myl-anchor-npv-p09-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P09",
    yearLevel: "Years 6–8",
    substrand: "Number and place value",
    skillId: "npv-p9-negative-order",
    skillName: "Order negative and positive numbers",
    prompt: "Order these numbers from smallest to largest.",
    options: [
      { id: "v-4", label: "4" },
      { id: "v-neg-2-5", label: "-2.5" },
      { id: "v-0", label: "0" },
      { id: "v-neg-12", label: "-12" },
    ],
    correctOptionIds: ["v-neg-12", "v-neg-2-5", "v-0", "v-4"],
    misconceptionTags: ["negative-number-order-error", "absolute-value-order-confusion"],
    tags: [
      "number-place-value",
      "p9",
      "npv-p09-a",
      "adapted-existing-construct",
      "direct-ordering",
    ],
  }),
  shortAnswerItem({
    id: "myl-anchor-npv-p09-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P09",
    yearLevel: "Years 6–8",
    substrand: "Number and place value",
    skillId: "npv-p9-round-decimal",
    skillName: "Round a decimal to a specified number of decimal places",
    prompt: "Round 63.487 to 2 decimal places.",
    correctValue: "63.49",
    misconceptionTags: ["decimal-rounding-error", "truncation-confusion"],
    tags: ["number-place-value", "p9", "npv-p09-b", "adapted-existing-item"],
  }),
];

export const COUNTING_P5_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-anchor-cnt-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P05",
    yearLevel: "Year 1",
    substrand: "Counting processes",
    skillId: "counting-processes-p5-next-previous",
    skillName: "Determine the next or previous number within 1–100",
    description: "Samples the P5 counting-sequence indicator without supplying a number track.",
    prompt: "What number comes immediately before 63?",
    correctValue: "62",
    misconceptionTags: ["count-sequence-boundary-error", "restarts-count-from-one"],
    tags: ["counting-processes", "p5", "cnt-p05-a"],
  }),
  shortAnswerItem({
    id: "myl-anchor-cnt-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P05",
    yearLevel: "Year 1",
    substrand: "Counting processes",
    skillId: "counting-processes-p5-collection",
    skillName: "Match a collection up to 20 to its numeral",
    description:
      "Samples the P5 collection-to-numeral indicator using a deterministic visual collection.",
    prompt: "How many counters are shown?",
    correctValue: "14",
    stimulus: {
      type: "array",
      data: { rows: 2, columns: 7, itemShape: "circle" },
      altText:
        "A rectangular arrangement of identical counters. The quantity is intentionally not stated because counting the collection is the task.",
    },
    misconceptionTags: ["one-to-one-counting-error", "collection-numeral-mismatch"],
    tags: [
      "counting-processes",
      "p5",
      "cnt-p05-b",
      "visual-counting-separate-accessible-form-required",
    ],
  }),
];


export const COUNTING_P7_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-anchor-cnt-p07-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P07",
    yearLevel: "Years 2–4",
    substrand: "Counting processes",
    skillId: "counting-p7-off-decade-fives",
    skillName: "Continue a count by fives off the decade",
    prompt: "Continue the sequence: 8, 13, 18, 23, __",
    correctValue: "28",
    misconceptionTags: ["skip-count-interval-error", "off-decade-counting-error"],
    tags: ["counting-processes", "p7", "cnt-p07-a"],
  }),
  shortAnswerItem({
    id: "myl-anchor-cnt-p07-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P07",
    yearLevel: "Years 2–4",
    substrand: "Counting processes",
    skillId: "counting-p7-grouped-quantity",
    skillName: "Count a grouped quantity and residual",
    prompt: "What total quantity is represented?",
    correctValue: "47",
    stimulus: {
      type: "place-value-blocks",
      data: { tens: 4, ones: 7, layout: "grouped" },
      altText: "A grouped representation showing four tens and seven ones.",
    },
    misconceptionTags: ["grouped-counting-error", "residual-counting-error"],
    tags: ["counting-processes", "p7", "cnt-p07-b"],
  }),
];

export const ADDITIVE_P6_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-anchor-add-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P06",
    yearLevel: "Years 1–2",
    substrand: "Additive strategies",
    skillId: "add-p6-bridge-ten",
    skillName: "Use a flexible bridge-to-10 strategy",
    prompt: "Which working is an efficient way to calculate 8 + 6?",
    options: [
      { id: "a", label: "8 + 2 + 4 = 14" },
      { id: "b", label: "8 + 6 = 86" },
      { id: "c", label: "8 + 8 + 6 = 22" },
      { id: "d", label: "10 + 8 = 18" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["bridge-to-ten-gap", "additive-strategy-error"],
    tags: ["additive-strategies", "p6", "add-p06-a"],
  }),
  shortAnswerItem({
    id: "myl-anchor-add-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P06",
    yearLevel: "Years 1–2",
    substrand: "Additive strategies",
    skillId: "add-p6-part-part-whole",
    skillName: "Use part-part-whole knowledge for a missing addend",
    prompt: "Complete the number sentence: 6 + __ = 13",
    correctValue: "7",
    misconceptionTags: ["missing-addend-error", "part-part-whole-gap"],
    tags: ["additive-strategies", "p6", "add-p06-b"],
  }),
];

export const ADDITIVE_P9_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-anchor-add-p09-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P09",
    yearLevel: "Years 5–7",
    substrand: "Additive strategies",
    skillId: "add-p9-related-denominator-fractions",
    skillName: "Add fractions with related denominators",
    prompt: "Calculate 1/4 + 3/8. Give your answer as a fraction.",
    correctValue: "5/8",
    misconceptionTags: ["fraction-common-denominator-error"],
    tags: ["additive-strategies", "p9", "add-p09-a", "adapted-existing-item"],
  }),
  shortAnswerItem({
    id: "myl-anchor-add-p09-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P09",
    yearLevel: "Years 5–7",
    substrand: "Additive strategies",
    skillId: "add-p9-decimal-addition",
    skillName: "Add decimals using place-value partitioning",
    prompt: "Calculate 2.375 + 0.48.",
    correctValue: "2.855",
    misconceptionTags: ["decimal-place-alignment-error"],
    tags: ["additive-strategies", "p9", "add-p09-b"],
  }),
];



export const MONEY_P2_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-anchor-mon-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P02",
    yearLevel: "Year 1",
    substrand: "Understanding money",
    skillId: "money-p2-face-value-order",
    skillName: "Order money denominations by face value",
    prompt: "Which list orders these money values from least to greatest?",
    stimulus: {
      type: "currency-tokens",
      data: {
        layout: "row",
        tokens: [
          { denomination: "$2" },
          { denomination: "20c" },
          { denomination: "$1" },
          { denomination: "50c" },
        ],
      },
      altText: "Money tokens shown in this order: $2, 20c, $1, 50c.",
    },
    options: [
      { id: "a", label: "20c, 50c, $1, $2" },
      { id: "b", label: "$2, $1, 50c, 20c" },
      { id: "c", label: "20c, $1, 50c, $2" },
      { id: "d", label: "50c, 20c, $1, $2" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["money-face-value-order-error", "dollars-cents-order-confusion"],
    tags: ["understanding-money", "p2", "mon-p02-a", "currency-token-review"],
  }),
  shortAnswerItem({
    id: "myl-anchor-mon-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P02",
    yearLevel: "Year 1",
    substrand: "Understanding money",
    skillId: "money-p2-count-denomination",
    skillName: "Count money tokens with the same face value",
    prompt: "How many 20c tokens are shown?",
    correctValue: "3",
    stimulus: {
      type: "currency-tokens",
      data: {
        layout: "grid",
        tokens: [
          { denomination: "20c" },
          { denomination: "$1" },
          { denomination: "20c" },
          { denomination: "50c" },
          { denomination: "20c" },
        ],
      },
      altText: "Money tokens shown in this order: 20c, $1, 20c, 50c, 20c.",
    },
    misconceptionTags: ["money-denomination-count-error"],
    tags: ["understanding-money", "p2", "mon-p02-b", "currency-token-review"],
  }),
];

export const MONEY_P5_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-anchor-mon-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P05",
    yearLevel: "Year 4",
    substrand: "Understanding money",
    skillId: "money-p5-notation",
    skillName: "Write dollars and cents in standard decimal notation",
    prompt: "Which is the correct way to write 3 dollars and 7 cents?",
    options: [
      { id: "a", label: "$3.07" },
      { id: "b", label: "$3.70" },
      { id: "c", label: "$3.7" },
      { id: "d", label: "$307" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["money-decimal-place-value-error", "cents-dollars-conversion-error"],
    tags: ["understanding-money", "p5", "mon-p05-a", "adapted-existing-item"],
  }),
  shortAnswerItem({
    id: "myl-anchor-mon-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P05",
    yearLevel: "Year 4",
    substrand: "Understanding money",
    skillId: "money-p5-mixed-collection-total",
    skillName: "Determine the total value of a mixed money collection",
    prompt: "A collection has two $2 coins, three 50c coins and two 20c coins. What is the total value in dollars?",
    correctValue: "5.90",
    acceptableValues: ["5.90", "5.9", "$5.90", "$5.9"],
    misconceptionTags: ["money-total-error", "dollars-cents-conversion-error"],
    tags: ["understanding-money", "p5", "mon-p05-b", "text-first-before-currency-assets"],
  }),
];

export const MONEY_P8_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-anchor-mon-p08-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P08",
    yearLevel: "Years 6–8",
    substrand: "Understanding money",
    skillId: "money-p8-discount",
    skillName: "Calculate a percentage discount and sale price",
    prompt: "A $90 jacket is reduced by 20%. What is the sale price in dollars?",
    correctValue: "72",
    acceptableValues: ["72", "$72", "72.00", "$72.00"],
    misconceptionTags: ["discount-vs-sale-price-error", "percentage-of-quantity-error"],
    tags: ["understanding-money", "p8", "mon-p08-a", "adapted-existing-item"],
  }),
  shortAnswerItem({
    id: "myl-anchor-mon-p08-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P08",
    yearLevel: "Years 6–8",
    substrand: "Understanding money",
    skillId: "money-p8-simple-interest",
    skillName: "Calculate simple interest from a percentage rate",
    prompt: "$500 is borrowed for 1 year at 6% simple interest. How many dollars of interest are charged?",
    correctValue: "30",
    acceptableValues: ["30", "$30", "30.00", "$30.00"],
    misconceptionTags: ["simple-interest-error", "percentage-rate-error"],
    tags: ["understanding-money", "p8", "mon-p08-b"],
  }),
];

export const MULTIPLICATIVE_P6_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-anchor-mul-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P06",
    yearLevel: "Years 4–5",
    substrand: "Multiplicative strategies",
    skillId: "mul-p6-context-multiplication",
    skillName: "Interpret and solve a single-digit multiplication context",
    prompt: "A bookshelf has 8 shelves. Each shelf holds 9 books. How many books can it hold altogether?",
    correctValue: "72",
    misconceptionTags: ["multiplication-context-error", "times-table-fluency-gap"],
    tags: ["multiplicative-strategies", "p6", "mul-p06-a", "adapted-existing-item"],
  }),
  shortAnswerItem({
    id: "myl-anchor-mul-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P06",
    yearLevel: "Years 4–5",
    substrand: "Multiplicative strategies",
    skillId: "mul-p6-sharing-division",
    skillName: "Interpret and solve equal-sharing division",
    prompt: "24 counters are shared equally between 6 learners. How many counters does each learner get?",
    correctValue: "4",
    misconceptionTags: ["division-sharing-grouping-confusion"],
    tags: ["multiplicative-strategies", "p6", "mul-p06-b", "adapted-existing-item"],
  }),
];

export const MULTIPLICATIVE_P9_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-anchor-mul-p09-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P09",
    yearLevel: "Years 6–8",
    substrand: "Multiplicative strategies",
    skillId: "mul-p9-prime-powers",
    skillName: "Express a number as a product of prime factors",
    prompt: "Which expression writes 72 as a product of prime powers?",
    options: [
      { id: "a", label: "2³ × 3²" },
      { id: "b", label: "2² × 3³" },
      { id: "c", label: "6² × 2" },
      { id: "d", label: "8 × 9" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["prime-factorisation-error", "exponent-notation-error"],
    tags: ["multiplicative-strategies", "p9", "mul-p09-a", "adapted-existing-construct"],
  }),
  shortAnswerItem({
    id: "myl-anchor-mul-p09-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P09",
    yearLevel: "Years 6–8",
    substrand: "Multiplicative strategies",
    skillId: "mul-p9-fraction-of-quantity",
    skillName: "Calculate a fraction of a quantity multiplicatively",
    prompt: "A learner spends 3/5 of $40 on supplies. How many dollars are spent?",
    correctValue: "24",
    acceptableValues: ["24", "$24", "24.00", "$24.00"],
    misconceptionTags: ["fraction-of-quantity-error"],
    tags: ["multiplicative-strategies", "p9", "mul-p09-b", "adapted-existing-item"],
  }),
];



export const NPV_P2_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-search-npv-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P02",
    yearLevel: "Prep",
    substrand: "Number and place value",
    skillId: "npv-p2-numeral-recognition",
    skillName: "Identify numerals within 1–10",
    prompt: "Which numeral shows six?",
    options: [
      { id: "a", label: "9" },
      { id: "b", label: "6" },
      { id: "c", label: "5" },
      { id: "d", label: "8" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["numeral-recognition-error", "six-nine-reversal"],
    tags: ["search-probe", "number-place-value", "p2"],
  }),
  choiceItem({
    id: "myl-search-npv-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P02",
    yearLevel: "Prep",
    substrand: "Number and place value",
    skillId: "npv-p2-order-to-ten",
    skillName: "Order numerals within 1–10",
    prompt: "Which list is ordered from smallest to largest?",
    options: [
      { id: "a", label: "2, 5, 8" },
      { id: "b", label: "8, 5, 2" },
      { id: "c", label: "5, 2, 8" },
      { id: "d", label: "2, 8, 5" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["numeral-order-error"],
    tags: ["search-probe", "number-place-value", "p2"],
  }),
];

export const NPV_P10_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-search-npv-p10-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P10",
    yearLevel: "Years 9–10",
    substrand: "Number and place value",
    skillId: "npv-p10-large-number-scientific",
    skillName: "Interpret very large numbers using powers of ten",
    prompt: "Which expression represents seven billion?",
    options: [
      { id: "a", label: "7 × 10⁶" },
      { id: "b", label: "7 × 10⁷" },
      { id: "c", label: "7 × 10⁸" },
      { id: "d", label: "7 × 10⁹" },
    ],
    correctOptionIds: ["d"],
    misconceptionTags: ["scientific-notation-place-error"],
    tags: ["search-probe", "number-place-value", "p10"],
  }),
  choiceItem({
    id: "myl-search-npv-p10-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P10",
    yearLevel: "Years 9–10",
    substrand: "Number and place value",
    skillId: "npv-p10-small-number-scientific",
    skillName: "Interpret very small numbers using powers of ten",
    prompt: "Which expression is equal to 0.000000001?",
    options: [
      { id: "a", label: "1 × 10⁻³" },
      { id: "b", label: "1 × 10⁻⁶" },
      { id: "c", label: "1 × 10⁻⁹" },
      { id: "d", label: "1 × 10⁹" },
    ],
    correctOptionIds: ["c"],
    misconceptionTags: ["negative-exponent-place-error"],
    tags: ["search-probe", "number-place-value", "p10"],
  }),
];

export const COUNTING_P8_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-search-cnt-p08-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P08",
    yearLevel: "Years 4–6",
    substrand: "Counting processes",
    skillId: "counting-p8-rational-sequence",
    skillName: "Count flexibly in rational numbers",
    prompt: "Continue the sequence: 4, 3.7, 3.4, 3.1, __",
    correctValue: "2.8",
    misconceptionTags: ["decimal-counting-interval-error"],
    tags: ["search-probe", "counting-processes", "p8"],
  }),
  shortAnswerItem({
    id: "myl-search-cnt-p08-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P08",
    yearLevel: "Years 4–6",
    substrand: "Counting processes",
    skillId: "counting-p8-negative-sequence",
    skillName: "Extend a count into negative numbers",
    prompt: "Continue the sequence: 0, -1, -2, -3, __",
    correctValue: "-4",
    misconceptionTags: ["negative-counting-direction-error"],
    tags: ["search-probe", "counting-processes", "p8"],
  }),
];

export const ADDITIVE_P10_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-search-add-p10-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P10",
    yearLevel: "Years 7–8",
    substrand: "Additive strategies",
    skillId: "add-p10-unrelated-denominator-fractions",
    skillName: "Add fractions with unrelated denominators",
    prompt: "Calculate 2/3 + 5/8. Give your answer as an improper fraction.",
    correctValue: "31/24",
    misconceptionTags: ["unrelated-denominator-addition-error"],
    tags: ["search-probe", "additive-strategies", "p10"],
  }),
  shortAnswerItem({
    id: "myl-search-add-p10-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P10",
    yearLevel: "Years 7–8",
    substrand: "Additive strategies",
    skillId: "add-p10-integer-addition",
    skillName: "Add and subtract integers",
    prompt: "Calculate -8 + 13 - 6.",
    correctValue: "-1",
    misconceptionTags: ["integer-addition-error"],
    tags: ["search-probe", "additive-strategies", "p10"],
  }),
];

export const MULTIPLICATIVE_P10_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-search-mul-p10-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P10",
    yearLevel: "Years 7–10",
    substrand: "Multiplicative strategies",
    skillId: "mul-p10-decimal-scaling",
    skillName: "Multiply decimals efficiently using place value",
    prompt: "Calculate 0.461 × 200.",
    correctValue: "92.2",
    acceptableValues: ["92.2", "92.20"],
    misconceptionTags: ["decimal-scaling-error"],
    tags: ["search-probe", "multiplicative-strategies", "p10"],
  }),
  shortAnswerItem({
    id: "myl-search-mul-p10-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P10",
    yearLevel: "Years 7–10",
    substrand: "Multiplicative strategies",
    skillId: "mul-p10-scientific-notation-product",
    skillName: "Operate multiplicatively with scientific notation",
    prompt: "Calculate (2.5 × 10^6) × (4 × 10^-3). Give the result as an ordinary number.",
    correctValue: "10000",
    acceptableValues: ["10000", "10,000"],
    misconceptionTags: ["scientific-notation-multiplication-error"],
    tags: ["search-probe", "multiplicative-strategies", "p10"],
  }),
];

export const MONEY_P9_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-search-mon-p09-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P09",
    yearLevel: "Years 8–9",
    substrand: "Understanding money",
    skillId: "money-p9-best-buy",
    skillName: "Use proportional reasoning to determine a best buy",
    prompt: "Which is the better buy per 100 g?",
    options: [
      { id: "a", label: "750 g for $6.00" },
      { id: "b", label: "1 kg for $7.50" },
      { id: "c", label: "They cost the same per 100 g" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["unit-rate-comparison-error"],
    tags: ["search-probe", "understanding-money", "p9"],
  }),
  shortAnswerItem({
    id: "myl-search-mon-p09-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P09",
    yearLevel: "Years 8–9",
    substrand: "Understanding money",
    skillId: "money-p9-profit-percentage",
    skillName: "Calculate percentage profit",
    prompt: "An item is bought for $80 and sold for $100. What percentage profit is made?",
    correctValue: "25",
    acceptableValues: ["25", "25%"],
    misconceptionTags: ["percentage-profit-error"],
    tags: ["search-probe", "understanding-money", "p9"],
  }),
];

export const MONEY_P10_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-search-mon-p10-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P10",
    yearLevel: "Years 9–10",
    substrand: "Understanding money",
    skillId: "money-p10-compound-interest",
    skillName: "Reason about compound interest",
    prompt: "$1,000 earns 10% interest each year for 2 years, compounded annually. What is the final balance in dollars?",
    correctValue: "1210",
    acceptableValues: ["1210", "$1210", "1210.00", "$1210.00"],
    misconceptionTags: ["compound-vs-simple-interest-error"],
    tags: ["search-probe", "understanding-money", "p10"],
  }),
  choiceItem({
    id: "myl-search-mon-p10-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P10",
    yearLevel: "Years 9–10",
    substrand: "Understanding money",
    skillId: "money-p10-financial-decision",
    skillName: "Compare long-term financial choices",
    prompt: "When comparing two car-purchase options, which information is most important for a full long-term comparison?",
    options: [
      { id: "a", label: "Only the advertised purchase price" },
      { id: "b", label: "Purchase price, loan repayments, insurance, maintenance and depreciation" },
      { id: "c", label: "Only the colour and model year" },
      { id: "d", label: "Only the first monthly repayment" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["financial-decision-narrow-cost-error"],
    tags: ["search-probe", "understanding-money", "p10"],
  }),
];


export const COUNTING_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-search-cnt-p01-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P01",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "cnt-p1-number-word",
    skillName: "Recognise a number word in an early counting context",
    prompt: "Which word is a number word?",
    options: [
      { id: "a", label: "three" },
      { id: "b", label: "blue" },
      { id: "c", label: "jump" },
      { id: "d", label: "table" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["early-number-word-recognition-error"],
    tags: ["search-probe", "counting-processes", "p1", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-search-cnt-p01-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P01",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "cnt-p1-subitise-three",
    skillName: "Recognise a very small collection",
    prompt: "Which numeral matches the collection?",
    stimulus: {
      type: "counter-set",
      data: { quantity: 3, arrangement: "dice", seed: 101, maxQuantity: 3 },
      altText:
        "A very small collection of counters. The quantity is intentionally not stated because recognising it is the task.",
    },
    options: [
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
      { id: "d", label: "4" },
    ],
    correctOptionIds: ["c"],
    misconceptionTags: ["early-subitising-error"],
    tags: [
      "search-probe",
      "counting-processes",
      "p1",
      "hybrid-routing-only",
      "separate-accessible-form-required",
    ],
  }),
];

export const ADDITIVE_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-search-add-p01-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P01",
    yearLevel: "Prep",
    substrand: "Additive strategies",
    skillId: "add-p1-adding-effect",
    skillName: "Recognise the effect of adding to a collection",
    prompt: "A collection has 3 counters. One counter is added. What happens to the collection?",
    options: [
      { id: "a", label: "It has more counters" },
      { id: "b", label: "It has fewer counters" },
      { id: "c", label: "It stays the same" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["adding-effect-error"],
    tags: ["search-probe", "additive-strategies", "p1", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-search-add-p01-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P01",
    yearLevel: "Prep",
    substrand: "Additive strategies",
    skillId: "add-p1-combine-groups",
    skillName: "Combine two very small groups",
    prompt: "There are 2 counters in one group and 1 counter in another. How many counters are there altogether?",
    correctValue: "3",
    misconceptionTags: ["emergent-additive-total-error"],
    tags: ["search-probe", "additive-strategies", "p1", "hybrid-routing-only"],
  }),
];

export const ADDITIVE_P2_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-search-add-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P02",
    yearLevel: "Prep",
    substrand: "Additive strategies",
    skillId: "add-p2-visible-combine",
    skillName: "Combine two visible small collections",
    prompt: "There are 3 red counters and 2 blue counters. How many counters are there altogether?",
    correctValue: "5",
    misconceptionTags: ["visible-additive-count-all-error"],
    tags: ["search-probe", "additive-strategies", "p2", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-search-add-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P02",
    yearLevel: "Prep",
    substrand: "Additive strategies",
    skillId: "add-p2-visible-remove",
    skillName: "Take away from a visible small collection",
    prompt: "There are 7 counters. Two counters are taken away. How many counters remain?",
    correctValue: "5",
    misconceptionTags: ["visible-subtraction-count-all-error"],
    tags: ["search-probe", "additive-strategies", "p2", "hybrid-routing-only"],
  }),
];

export const MULTIPLICATIVE_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-search-mul-p01-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P01",
    yearLevel: "Prep",
    substrand: "Multiplicative strategies",
    skillId: "mul-p1-equal-share",
    skillName: "Share a very small collection equally",
    prompt: "6 counters are shared equally between 2 people. How many counters does each person receive?",
    correctValue: "3",
    misconceptionTags: ["early-equal-sharing-error"],
    tags: ["search-probe", "multiplicative-strategies", "p1", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-search-mul-p01-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P01",
    yearLevel: "Prep",
    substrand: "Multiplicative strategies",
    skillId: "mul-p1-equal-groups-total",
    skillName: "Make equal groups and determine a total",
    prompt: "There are 3 equal groups with 2 counters in each group. How many counters are there altogether?",
    correctValue: "6",
    misconceptionTags: ["early-equal-groups-error"],
    tags: ["search-probe", "multiplicative-strategies", "p1", "hybrid-routing-only"],
  }),
];

export const MULTIPLICATIVE_P2_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-search-mul-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P02",
    yearLevel: "Year 1",
    substrand: "Multiplicative strategies",
    skillId: "mul-p2-visible-groups",
    skillName: "Use visible equal groups",
    prompt: "Four visible groups each contain 2 counters. How many counters are there altogether?",
    correctValue: "8",
    misconceptionTags: ["perceptual-multiple-error"],
    tags: ["search-probe", "multiplicative-strategies", "p2", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-search-mul-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P02",
    yearLevel: "Year 1",
    substrand: "Multiplicative strategies",
    skillId: "mul-p2-visible-share",
    skillName: "Use visible equal sharing",
    prompt: "8 counters are shared equally between 4 people. How many counters does each person receive?",
    correctValue: "2",
    misconceptionTags: ["perceptual-sharing-error"],
    tags: ["search-probe", "multiplicative-strategies", "p2", "hybrid-routing-only"],
  }),
];

export const MONEY_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-search-mon-p01-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P01",
    yearLevel: "Prep–Year 1",
    substrand: "Understanding money",
    skillId: "money-p1-money-situation",
    skillName: "Recognise a situation that uses money",
    prompt: "Which situation usually involves using money?",
    options: [
      { id: "a", label: "Buying a snack at a shop" },
      { id: "b", label: "Looking at the weather" },
      { id: "c", label: "Counting steps on a walk" },
      { id: "d", label: "Reading a story" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["money-context-recognition-error"],
    tags: ["search-probe", "understanding-money", "p1"],
  }),
  choiceItem({
    id: "myl-search-mon-p01-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P01",
    yearLevel: "Prep–Year 1",
    substrand: "Understanding money",
    skillId: "money-p1-face-value",
    skillName: "Identify a money denomination by face value",
    prompt: "Which money token has a face value of two dollars?",
    stimulus: {
      type: "currency-tokens",
      data: {
        layout: "row",
        tokens: [
          { denomination: "50c" },
          { denomination: "$1" },
          { denomination: "$2" },
        ],
      },
      altText: "Money tokens shown in this order: 50c, $1, $2.",
    },
    options: [
      { id: "a", label: "50c" },
      { id: "b", label: "$1" },
      { id: "c", label: "$2" },
    ],
    correctOptionIds: ["c"],
    misconceptionTags: ["money-face-value-recognition-error"],
    tags: ["search-probe", "understanding-money", "p1", "asset-review"],
  }),
];

export const NUMBER_OPERATIONS_SEARCH_CLUSTERS = {
  "number-place-value-p1": NPV_P1_SEARCH_ITEMS,
  "number-place-value-p2": NPV_P2_SEARCH_ITEMS,
  "number-place-value-p10": NPV_P10_SEARCH_ITEMS,
  "counting-processes-p1": COUNTING_P1_SEARCH_ITEMS,
  "counting-processes-p8": COUNTING_P8_SEARCH_ITEMS,
  "additive-strategies-p1": ADDITIVE_P1_SEARCH_ITEMS,
  "additive-strategies-p2": ADDITIVE_P2_SEARCH_ITEMS,
  "additive-strategies-p10": ADDITIVE_P10_SEARCH_ITEMS,
  "multiplicative-strategies-p1": MULTIPLICATIVE_P1_SEARCH_ITEMS,
  "multiplicative-strategies-p2": MULTIPLICATIVE_P2_SEARCH_ITEMS,
  "multiplicative-strategies-p10": MULTIPLICATIVE_P10_SEARCH_ITEMS,
  "understanding-money-p1": MONEY_P1_SEARCH_ITEMS,
  "understanding-money-p9": MONEY_P9_SEARCH_ITEMS,
  "understanding-money-p10": MONEY_P10_SEARCH_ITEMS,
} as const;


export const NPV_P4_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-boundary-npv-p04-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P04",
    yearLevel: "Years 1–2",
    substrand: "Number and place value",
    skillId: "npv-p4-read-numeral",
    skillName: "Read and interpret numerals to and beyond 100",
    prompt: "Which numeral shows one hundred and eight?",
    options: [
      { id: "a", label: "18" },
      { id: "b", label: "108" },
      { id: "c", label: "180" },
      { id: "d", label: "1008" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["zero-placeholder-error", "numeral-reading-error"],
    tags: ["boundary-probe", "number-place-value", "p4"],
  }),
  choiceItem({
    id: "myl-boundary-npv-p04-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P04",
    yearLevel: "Years 1–2",
    substrand: "Number and place value",
    skillId: "npv-p4-rename-two-digit",
    skillName: "Rename a two-digit number using tens and ones",
    prompt: "Select every representation equal to 68.",
    options: [
      { id: "a", label: "6 tens and 8 ones" },
      { id: "b", label: "68 ones" },
      { id: "c", label: "60 + 8" },
      { id: "d", label: "8 tens and 6 ones" },
    ],
    correctOptionIds: ["a", "b", "c"],
    multi: true,
    misconceptionTags: ["tens-ones-renaming-error"],
    tags: ["boundary-probe", "number-place-value", "p4"],
  }),
  choiceItem({
    id: "myl-boundary-npv-p04-c-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P04",
    yearLevel: "Years 1–2",
    substrand: "Number and place value",
    skillId: "npv-p4-order-within-100",
    skillName: "Compare numerals within 100",
    prompt: "Which number is greatest?",
    options: [
      { id: "a", label: "38" },
      { id: "b", label: "56" },
      { id: "c", label: "70" },
      { id: "d", label: "26" },
    ],
    correctOptionIds: ["c"],
    misconceptionTags: ["two-digit-comparison-error"],
    tags: ["boundary-probe", "number-place-value", "p4"],
  }),
];

export const NPV_P5_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-boundary-npv-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P05",
    yearLevel: "Year 2",
    substrand: "Number and place value",
    skillId: "npv-p5-read-three-digit",
    skillName: "Read and identify a three-digit numeral",
    prompt: "Which numeral shows two hundred and seventy-six?",
    options: [
      { id: "a", label: "267" },
      { id: "b", label: "276" },
      { id: "c", label: "726" },
      { id: "d", label: "206" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["three-digit-numeral-order-error"],
    tags: ["boundary-probe", "number-place-value", "p5"],
  }),
  choiceItem({
    id: "myl-boundary-npv-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P05",
    yearLevel: "Year 2",
    substrand: "Number and place value",
    skillId: "npv-p5-flexible-renaming",
    skillName: "Flexibly rename a three-digit number",
    prompt: "Select every representation equal to 247.",
    options: [
      { id: "a", label: "2 hundreds, 4 tens and 7 ones" },
      { id: "b", label: "2 hundreds and 47 ones" },
      { id: "c", label: "24 tens and 7 ones" },
      { id: "d", label: "247 ones" },
      { id: "e", label: "2 hundreds, 7 tens and 4 ones" },
    ],
    correctOptionIds: ["a", "b", "c", "d"],
    multi: true,
    misconceptionTags: ["three-digit-renaming-error"],
    tags: ["boundary-probe", "number-place-value", "p5"],
  }),
  shortAnswerItem({
    id: "myl-boundary-npv-p05-c-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P05",
    yearLevel: "Year 2",
    substrand: "Number and place value",
    skillId: "npv-p5-internal-zero",
    skillName: "Interpret an internal zero in place-value notation",
    prompt: "8 hundreds and 7 ones is written as what numeral?",
    correctValue: "807",
    misconceptionTags: ["internal-zero-placeholder-error"],
    tags: ["boundary-probe", "number-place-value", "p5"],
  }),
];

export const NPV_P7_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-boundary-npv-p07-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P07",
    yearLevel: "Years 3–4",
    substrand: "Number and place value",
    skillId: "npv-p7-compare-decimals",
    skillName: "Compare decimals to two decimal places",
    prompt: "Which number is greater?",
    options: [
      { id: "a", label: "0.19" },
      { id: "b", label: "0.2" },
      { id: "c", label: "They are equal" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["decimal-length-comparison-error"],
    tags: ["boundary-probe", "number-place-value", "p7"],
  }),
  choiceItem({
    id: "myl-boundary-npv-p07-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P07",
    yearLevel: "Years 3–4",
    substrand: "Number and place value",
    skillId: "npv-p7-money-decimal-notation",
    skillName: "Write dollars and cents using decimal notation",
    prompt: "Which notation shows 4 dollars and 5 cents?",
    options: [
      { id: "a", label: "$4.5" },
      { id: "b", label: "$4.05" },
      { id: "c", label: "$4.50" },
      { id: "d", label: "$45.00" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["decimal-place-value-money-error"],
    tags: ["boundary-probe", "number-place-value", "p7"],
  }),
  shortAnswerItem({
    id: "myl-boundary-npv-p07-c-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P07",
    yearLevel: "Years 3–4",
    substrand: "Number and place value",
    skillId: "npv-p7-round-large-natural",
    skillName: "Round a larger natural number for a purpose",
    prompt: "Round 9,863 to the nearest thousand.",
    correctValue: "10000",
    acceptableValues: ["10000", "10,000"],
    misconceptionTags: ["large-number-rounding-error"],
    tags: ["boundary-probe", "number-place-value", "p7"],
  }),
];

export const NPV_P8_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  orderingItem({
    id: "myl-boundary-npv-p08-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P08",
    yearLevel: "Years 4–5",
    substrand: "Number and place value",
    skillId: "npv-p8-order-decimals",
    skillName: "Order decimals expressed to unequal numbers of places",
    prompt: "Order these numbers from smallest to largest.",
    options: [
      { id: "v-2-15", label: "2.15" },
      { id: "v-1-4", label: "1.4" },
      { id: "v-1-375", label: "1.375" },
    ],
    correctOptionIds: ["v-1-375", "v-1-4", "v-2-15"],
    misconceptionTags: ["unequal-decimal-place-order-error"],
    tags: ["boundary-probe", "number-place-value", "p8", "direct-ordering"],
  }),
  shortAnswerItem({
    id: "myl-boundary-npv-p08-b-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P08",
    yearLevel: "Years 4–5",
    substrand: "Number and place value",
    skillId: "npv-p8-adjacent-place-multiplicative",
    skillName: "Relate adjacent decimal place values multiplicatively",
    prompt: "0.2 is how many times as great as 0.02?",
    correctValue: "10",
    misconceptionTags: ["decimal-place-multiplicative-error"],
    tags: ["boundary-probe", "number-place-value", "p8"],
  }),
  shortAnswerItem({
    id: "myl-boundary-npv-p08-c-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P08",
    yearLevel: "Years 4–5",
    substrand: "Number and place value",
    skillId: "npv-p8-round-decimal",
    skillName: "Round a decimal to two decimal places",
    prompt: "Round 4.678 to 2 decimal places.",
    correctValue: "4.68",
    misconceptionTags: ["decimal-rounding-error"],
    tags: ["boundary-probe", "number-place-value", "p8"],
  }),
];


export const COUNTING_P6_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-cnt-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P06",
    yearLevel: "Years 1–3",
    substrand: "Counting processes",
    skillId: "cnt-p6-count-beyond-100",
    skillName: "Continue counting beyond 100",
    prompt: "Continue the count: 198, 199, 200, __",
    correctValue: "201",
    misconceptionTags: ["counting-across-hundred-error"],
    tags: ["boundary-probe", "counting-processes", "p6"],
  }),
  shortAnswerItem({
    id: "myl-boundary-cnt-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P06",
    yearLevel: "Years 1–3",
    substrand: "Counting processes",
    skillId: "cnt-p6-skip-count-fives",
    skillName: "Count by fives from zero",
    prompt: "Continue the sequence: 0, 5, 10, 15, __",
    correctValue: "20",
    misconceptionTags: ["skip-count-five-error"],
    tags: ["boundary-probe", "counting-processes", "p6"],
  }),
  shortAnswerItem({
    id: "myl-boundary-cnt-p06-c-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P06",
    yearLevel: "Years 1–3",
    substrand: "Counting processes",
    skillId: "cnt-p6-backward-tens",
    skillName: "Count backwards by tens",
    prompt: "Continue the count backwards by tens: 80, 70, 60, __",
    correctValue: "50",
    misconceptionTags: ["backward-tens-count-error"],
    tags: ["boundary-probe", "counting-processes", "p6"],
  }),
];

export const ADDITIVE_P7_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-boundary-add-p07-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P07",
    yearLevel: "Year 2",
    substrand: "Additive strategies",
    skillId: "add-p7-compensation",
    skillName: "Use compensation with two-digit subtraction",
    prompt: "Which working correctly uses compensation to calculate 47 - 38?",
    options: [
      { id: "a", label: "49 - 40 = 9" },
      { id: "b", label: "47 - 40 = 7" },
      { id: "c", label: "45 - 38 = 9" },
      { id: "d", label: "47 + 38 = 85" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["two-digit-compensation-error"],
    tags: ["boundary-probe", "additive-strategies", "p7"],
  }),
  shortAnswerItem({
    id: "myl-boundary-add-p07-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P07",
    yearLevel: "Year 2",
    substrand: "Additive strategies",
    skillId: "add-p7-associative-strategy",
    skillName: "Reorder addends to simplify mental addition",
    prompt: "Calculate 23 + 9 + 7.",
    correctValue: "39",
    misconceptionTags: ["two-digit-addition-strategy-error"],
    tags: ["boundary-probe", "additive-strategies", "p7"],
  }),
  shortAnswerItem({
    id: "myl-boundary-add-p07-c-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P07",
    yearLevel: "Year 2",
    substrand: "Additive strategies",
    skillId: "add-p7-inverse",
    skillName: "Use addition and subtraction as inverse operations",
    prompt: "Complete the related addition fact that can solve 23 - 16: 16 + __ = 23",
    correctValue: "7",
    misconceptionTags: ["addition-subtraction-inverse-error"],
    tags: ["boundary-probe", "additive-strategies", "p7"],
  }),
];

export const ADDITIVE_P8_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-add-p08-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P08",
    yearLevel: "Years 3–5",
    substrand: "Additive strategies",
    skillId: "add-p8-three-digit-addition",
    skillName: "Add three-digit numbers using place value",
    prompt: "Calculate 250 + 457.",
    correctValue: "707",
    misconceptionTags: ["three-digit-addition-error"],
    tags: ["boundary-probe", "additive-strategies", "p8"],
  }),
  choiceItem({
    id: "myl-boundary-add-p08-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P08",
    yearLevel: "Years 3–5",
    substrand: "Additive strategies",
    skillId: "add-p8-estimation",
    skillName: "Estimate to check an additive result",
    prompt: "Which is the best quick estimate for 249 + 437?",
    options: [
      { id: "a", label: "250 + 440 = 690" },
      { id: "b", label: "200 + 400 = 6000" },
      { id: "c", label: "25 + 44 = 69" },
      { id: "d", label: "249 + 400 = 249400" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["additive-estimation-error"],
    tags: ["boundary-probe", "additive-strategies", "p8"],
  }),
  shortAnswerItem({
    id: "myl-boundary-add-p08-c-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P08",
    yearLevel: "Years 3–5",
    substrand: "Additive strategies",
    skillId: "add-p8-three-digit-second",
    skillName: "Apply partitioning with three-digit numbers",
    prompt: "Calculate 184 + 270.",
    correctValue: "454",
    misconceptionTags: ["three-digit-place-value-addition-error"],
    tags: ["boundary-probe", "additive-strategies", "p8"],
  }),
];

export const MULTIPLICATIVE_P7_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-mul-p07-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P07",
    yearLevel: "Years 4–5",
    substrand: "Multiplicative strategies",
    skillId: "mul-p7-inverse-unknown",
    skillName: "Use inverse operations to solve a missing factor",
    prompt: "Complete the equation: 14 × __ = 336",
    correctValue: "24",
    misconceptionTags: ["multiplicative-inverse-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p7"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mul-p07-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P07",
    yearLevel: "Years 4–5",
    substrand: "Multiplicative strategies",
    skillId: "mul-p7-distributive",
    skillName: "Use distributive partitioning for multiplication",
    prompt: "Calculate 7 × 83.",
    correctValue: "581",
    misconceptionTags: ["distributive-multiplication-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p7"],
  }),
  choiceItem({
    id: "myl-boundary-mul-p07-c-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P07",
    yearLevel: "Years 4–5",
    substrand: "Multiplicative strategies",
    skillId: "mul-p7-estimation",
    skillName: "Estimate to check a product",
    prompt: "Which estimate is most useful for checking 198 × 31?",
    options: [
      { id: "a", label: "200 × 30 = 6,000" },
      { id: "b", label: "20 × 3 = 60" },
      { id: "c", label: "198 + 31 = 229" },
      { id: "d", label: "200 × 300 = 60,000" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["multiplicative-estimation-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p7"],
  }),
];

export const MULTIPLICATIVE_P8_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-mul-p08-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P08",
    yearLevel: "Year 6",
    substrand: "Multiplicative strategies",
    skillId: "mul-p8-multistep-sharing",
    skillName: "Solve a multi-step multiplicative problem",
    prompt: "12 boxes hold 24 items each. All the items are shared equally among 8 groups. How many items does each group receive?",
    correctValue: "36",
    misconceptionTags: ["multi-step-multiplicative-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p8"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mul-p08-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P08",
    yearLevel: "Year 6",
    substrand: "Multiplicative strategies",
    skillId: "mul-p8-mixed-operations",
    skillName: "Combine multiplication and subtraction in context",
    prompt: "There are 18 rows of 26 chairs. If 37 chairs are reserved, how many chairs are not reserved?",
    correctValue: "431",
    misconceptionTags: ["multiplicative-mixed-operation-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p8"],
  }),
  choiceItem({
    id: "myl-boundary-mul-p08-c-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P08",
    yearLevel: "Year 6",
    substrand: "Multiplicative strategies",
    skillId: "mul-p8-operation-sequence",
    skillName: "Choose a multi-step multiplicative expression",
    prompt: "Eight crates hold 36 bottles each. Then 24 bottles are removed. Which expression finds the number left?",
    options: [
      { id: "a", label: "8 × 36 - 24" },
      { id: "b", label: "8 + 36 - 24" },
      { id: "c", label: "36 ÷ 8 + 24" },
      { id: "d", label: "8 × (36 + 24)" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["multi-step-operation-choice-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p8"],
  }),
];

export const MONEY_P6_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-mon-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P06",
    yearLevel: "Year 4",
    substrand: "Understanding money",
    skillId: "money-p6-total",
    skillName: "Calculate the total cost of different items",
    prompt: "An item costs $4.80 and another costs $2.65. What is the total cost in dollars?",
    correctValue: "7.45",
    acceptableValues: ["7.45", "$7.45"],
    misconceptionTags: ["money-additive-total-error"],
    tags: ["boundary-probe", "understanding-money", "p6"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mon-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P06",
    yearLevel: "Year 4",
    substrand: "Understanding money",
    skillId: "money-p6-change",
    skillName: "Calculate change to the nearest five cents",
    prompt: "A purchase costs $13.35. How much change should be given from $20.00?",
    correctValue: "6.65",
    acceptableValues: ["6.65", "$6.65"],
    misconceptionTags: ["money-change-error"],
    tags: ["boundary-probe", "understanding-money", "p6"],
  }),
  choiceItem({
    id: "myl-boundary-mon-p06-c-v1",
    code: "MYL-MATH-PROG-NSA-MON-P06",
    yearLevel: "Year 4",
    substrand: "Understanding money",
    skillId: "money-p6-profit-loss",
    skillName: "Identify profit or loss",
    prompt: "An item is bought for $12 and sold for $15. What happened?",
    options: [
      { id: "a", label: "A $3 profit" },
      { id: "b", label: "A $3 loss" },
      { id: "c", label: "No profit or loss" },
      { id: "d", label: "A $27 profit" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["profit-loss-condition-error"],
    tags: ["boundary-probe", "understanding-money", "p6"],
  }),
];

export const MONEY_P7_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-mon-p07-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P07",
    yearLevel: "Years 4–6",
    substrand: "Understanding money",
    skillId: "money-p7-repeated-purchase",
    skillName: "Use multiplication with dollars and cents",
    prompt: "150 copies cost 15 cents each. What is the total cost in dollars?",
    correctValue: "22.50",
    acceptableValues: ["22.50", "22.5", "$22.50", "$22.5"],
    misconceptionTags: ["cents-dollars-multiplication-error"],
    tags: ["boundary-probe", "understanding-money", "p7"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mon-p07-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P07",
    yearLevel: "Years 4–6",
    substrand: "Understanding money",
    skillId: "money-p7-split-bill",
    skillName: "Split a bill using multiplicative reasoning",
    prompt: "A bill of $84 is split equally between 6 people. How many dollars does each person pay?",
    correctValue: "14",
    acceptableValues: ["14", "$14", "14.00", "$14.00"],
    misconceptionTags: ["bill-splitting-error"],
    tags: ["boundary-probe", "understanding-money", "p7"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mon-p07-c-v1",
    code: "MYL-MATH-PROG-NSA-MON-P07",
    yearLevel: "Years 4–6",
    substrand: "Understanding money",
    skillId: "money-p7-subscription",
    skillName: "Calculate repeated subscription costs",
    prompt: "A subscription costs $18.50 each month for 6 months. What is the total cost in dollars?",
    correctValue: "111",
    acceptableValues: ["111", "$111", "111.00", "$111.00"],
    misconceptionTags: ["repeated-money-multiplication-error"],
    tags: ["boundary-probe", "understanding-money", "p7"],
  }),
];


export const COUNTING_P3_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-cnt-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P03",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "cnt-p3-after-with-full-count",
    skillName: "Determine the number after a given number within 1–10",
    prompt: "What number comes after 6?",
    correctValue: "7",
    misconceptionTags: ["early-before-after-error"],
    tags: ["boundary-probe", "counting-processes", "p3", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-boundary-cnt-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P03",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "cnt-p3-before-with-full-count",
    skillName: "Determine the number before a given number within 1–10",
    prompt: "What number comes before 6?",
    correctValue: "5",
    misconceptionTags: ["early-before-after-error"],
    tags: ["boundary-probe", "counting-processes", "p3", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-boundary-cnt-p03-c-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P03",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "cnt-p3-cardinality",
    skillName: "Connect a count with the total quantity",
    prompt: "A learner counts a collection: 1, 2, 3, 4, 5. How many objects are in the collection?",
    options: [
      { id: "a", label: "1" },
      { id: "b", label: "4" },
      { id: "c", label: "5" },
      { id: "d", label: "6" },
    ],
    correctOptionIds: ["c"],
    misconceptionTags: ["cardinality-error"],
    tags: ["boundary-probe", "counting-processes", "p3", "hybrid-routing-only"],
  }),
];

export const COUNTING_P4_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-cnt-p04-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P04",
    yearLevel: "Prep–Year 1",
    substrand: "Counting processes",
    skillId: "cnt-p4-immediate-next",
    skillName: "Use the count sequence from a non-one starting point",
    prompt: "Start at 8. What number comes immediately next?",
    correctValue: "9",
    misconceptionTags: ["immediate-next-error"],
    tags: ["boundary-probe", "counting-processes", "p4", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-boundary-cnt-p04-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P04",
    yearLevel: "Prep–Year 1",
    substrand: "Counting processes",
    skillId: "cnt-p4-continue-from-six",
    skillName: "Continue counting from a number other than one",
    prompt: "Continue the count: 6, 7, 8, __",
    correctValue: "9",
    misconceptionTags: ["continue-count-nonone-error"],
    tags: ["boundary-probe", "counting-processes", "p4", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-boundary-cnt-p04-c-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P04",
    yearLevel: "Prep–Year 1",
    substrand: "Counting processes",
    skillId: "cnt-p4-count-independent-type",
    skillName: "Treat equal counts as the same quantity across different objects",
    prompt: "Which statement is true?",
    options: [
      { id: "a", label: "5 counters and 5 books represent the same quantity" },
      { id: "b", label: "5 counters is always more than 5 books" },
      { id: "c", label: "The kind of object changes what the number 5 means" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["count-object-type-dependence-error"],
    tags: ["boundary-probe", "counting-processes", "p4", "hybrid-routing-only"],
  }),
];

export const ADDITIVE_P4_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-add-p04-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P04",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p4-count-on",
    skillName: "Solve a small addition problem by counting on",
    prompt: "Calculate 6 + 3.",
    correctValue: "9",
    misconceptionTags: ["counting-on-error"],
    tags: ["boundary-probe", "additive-strategies", "p4", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-boundary-add-p04-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P04",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p4-missing-addend",
    skillName: "Solve a missing-addend problem",
    prompt: "Complete the equation: 6 + __ = 9",
    correctValue: "3",
    misconceptionTags: ["counting-up-to-error"],
    tags: ["boundary-probe", "additive-strategies", "p4", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-boundary-add-p04-c-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P04",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p4-zero",
    skillName: "Use the additive property of zero",
    prompt: "Calculate 5 + 0.",
    correctValue: "5",
    misconceptionTags: ["additive-zero-error"],
    tags: ["boundary-probe", "additive-strategies", "p4", "hybrid-routing-only"],
  }),
];

export const ADDITIVE_P5_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-add-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P05",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p5-count-back",
    skillName: "Solve a subtraction problem by counting back",
    prompt: "Calculate 10 - 3.",
    correctValue: "7",
    misconceptionTags: ["counting-back-error"],
    tags: ["boundary-probe", "additive-strategies", "p5", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-boundary-add-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P05",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p5-missing-subtrahend",
    skillName: "Solve a missing-subtrahend problem",
    prompt: "Complete the equation: 12 - __ = 8",
    correctValue: "4",
    misconceptionTags: ["counting-down-to-error"],
    tags: ["boundary-probe", "additive-strategies", "p5", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-boundary-add-p05-c-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P05",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p5-difference-up",
    skillName: "Count up to determine a small difference",
    prompt: "How many numbers do you count on from 8 to reach 12?",
    correctValue: "4",
    misconceptionTags: ["counting-up-difference-error"],
    tags: ["boundary-probe", "additive-strategies", "p5", "hybrid-routing-only"],
  }),
];

export const MULTIPLICATIVE_P4_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-mul-p04-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P04",
    yearLevel: "Year 2",
    substrand: "Multiplicative strategies",
    skillId: "mul-p4-repeated-addition",
    skillName: "Use repeated composite units additively",
    prompt: "Four lots of 3 means 3 + 3 + 3 + 3. What is the total?",
    correctValue: "12",
    misconceptionTags: ["repeated-addition-composite-unit-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p4", "hybrid-routing-only"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mul-p04-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P04",
    yearLevel: "Year 2",
    substrand: "Multiplicative strategies",
    skillId: "mul-p4-repeated-subtraction",
    skillName: "Use repeated subtraction to form equal groups",
    prompt: "How many groups of 4 can be made from 24?",
    correctValue: "6",
    misconceptionTags: ["repeated-subtraction-grouping-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p4", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-boundary-mul-p04-c-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P04",
    yearLevel: "Year 2",
    substrand: "Multiplicative strategies",
    skillId: "mul-p4-repeated-subtraction-sequence",
    skillName: "Recognise repeated subtraction by a composite unit",
    prompt: "Which sequence shows repeatedly subtracting 4 from 24 until zero?",
    options: [
      { id: "a", label: "24, 20, 16, 12, 8, 4, 0" },
      { id: "b", label: "24, 23, 22, 21, 20" },
      { id: "c", label: "24, 28, 32, 36" },
      { id: "d", label: "24, 12, 6, 3" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["repeated-subtraction-sequence-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p4", "hybrid-routing-only"],
  }),
];

export const MULTIPLICATIVE_P5_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-boundary-mul-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P05",
    yearLevel: "Years 2–3",
    substrand: "Multiplicative strategies",
    skillId: "mul-p5-array",
    skillName: "Represent multiplication with an array",
    prompt: "An array has 3 rows of 4. Which multiplication equation matches it?",
    options: [
      { id: "a", label: "3 × 4 = 12" },
      { id: "b", label: "3 + 4 = 7" },
      { id: "c", label: "12 ÷ 4 = 4" },
      { id: "d", label: "4 - 3 = 1" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["array-equation-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p5"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mul-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P05",
    yearLevel: "Years 2–3",
    substrand: "Multiplicative strategies",
    skillId: "mul-p5-sharing",
    skillName: "Represent division as equal sharing",
    prompt: "12 objects are shared equally among 4 people. How many objects does each person receive?",
    correctValue: "3",
    misconceptionTags: ["division-sharing-representation-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p5"],
  }),
  choiceItem({
    id: "myl-boundary-mul-p05-c-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P05",
    yearLevel: "Years 2–3",
    substrand: "Multiplicative strategies",
    skillId: "mul-p5-symbolic",
    skillName: "Represent equal groups with multiplication symbols",
    prompt: "Which equation represents 3 groups of 4?",
    options: [
      { id: "a", label: "3 × 4 = 12" },
      { id: "b", label: "3 + 4 = 7" },
      { id: "c", label: "4 - 3 = 1" },
      { id: "d", label: "3 ÷ 4 = 12" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["multiplication-symbolic-representation-error"],
    tags: ["boundary-probe", "multiplicative-strategies", "p5"],
  }),
];

export const MONEY_P3_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  shortAnswerItem({
    id: "myl-boundary-mon-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P03",
    yearLevel: "Years 1–2",
    substrand: "Understanding money",
    skillId: "money-p3-same-denomination-total",
    skillName: "Determine the value of same-denomination coins",
    prompt: "Four 50c tokens have a total value of how many cents?",
    correctValue: "200",
    acceptableValues: ["200", "200c"],
    misconceptionTags: ["same-denomination-total-error"],
    tags: ["boundary-probe", "understanding-money", "p3"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mon-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P03",
    yearLevel: "Years 1–2",
    substrand: "Understanding money",
    skillId: "money-p3-whole-dollar-value",
    skillName: "Write the value of a small money collection",
    prompt: "Five $1 tokens have a total value of how many dollars?",
    correctValue: "5",
    acceptableValues: ["5", "$5", "5.00", "$5.00"],
    misconceptionTags: ["small-money-collection-value-error"],
    tags: ["boundary-probe", "understanding-money", "p3"],
  }),
  shortAnswerItem({
    id: "myl-boundary-mon-p03-c-v1",
    code: "MYL-MATH-PROG-NSA-MON-P03",
    yearLevel: "Years 1–2",
    substrand: "Understanding money",
    skillId: "money-p3-cent-value",
    skillName: "Count a small collection by coin value",
    prompt: "Three 20c tokens have a total value of how many cents?",
    correctValue: "60",
    acceptableValues: ["60", "60c"],
    misconceptionTags: ["small-cent-collection-value-error"],
    tags: ["boundary-probe", "understanding-money", "p3"],
  }),
];

export const MONEY_P4_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choiceItem({
    id: "myl-boundary-mon-p04-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P04",
    yearLevel: "Years 3–4",
    substrand: "Understanding money",
    skillId: "money-p4-equivalent-five-dollars",
    skillName: "Recognise an equivalent coin value",
    prompt: "Which collection is equal to $5?",
    options: [
      { id: "a", label: "10 × 50c" },
      { id: "b", label: "5 × 50c" },
      { id: "c", label: "5 × 20c" },
      { id: "d", label: "2 × $1" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["money-equivalence-error"],
    tags: ["boundary-probe", "understanding-money", "p4"],
  }),
  choiceItem({
    id: "myl-boundary-mon-p04-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P04",
    yearLevel: "Years 3–4",
    substrand: "Understanding money",
    skillId: "money-p4-multiple-representations",
    skillName: "Represent the same money value in multiple ways",
    prompt: "Select every collection equal to $2.",
    options: [
      { id: "a", label: "2 × $1" },
      { id: "b", label: "4 × 50c" },
      { id: "c", label: "10 × 20c" },
      { id: "d", label: "2 × 20c" },
    ],
    correctOptionIds: ["a", "b", "c"],
    multi: true,
    misconceptionTags: ["multiple-money-representations-error"],
    tags: ["boundary-probe", "understanding-money", "p4"],
  }),
  choiceItem({
    id: "myl-boundary-mon-p04-c-v1",
    code: "MYL-MATH-PROG-NSA-MON-P04",
    yearLevel: "Years 3–4",
    substrand: "Understanding money",
    skillId: "money-p4-order-value",
    skillName: "Order money amounts by monetary value",
    prompt: "Which amount has the greatest value?",
    options: [
      { id: "a", label: "$1.50" },
      { id: "b", label: "$2.00" },
      { id: "c", label: "$1.80" },
      { id: "d", label: "$0.95" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["money-value-order-error"],
    tags: ["boundary-probe", "understanding-money", "p4"],
  }),
];

export const NUMBER_OPERATIONS_BOUNDARY_CLUSTERS = {
  "number-place-value-p4": NPV_P4_BOUNDARY_ITEMS,
  "number-place-value-p5": NPV_P5_BOUNDARY_ITEMS,
  "number-place-value-p7": NPV_P7_BOUNDARY_ITEMS,
  "number-place-value-p8": NPV_P8_BOUNDARY_ITEMS,
  "counting-processes-p3": COUNTING_P3_BOUNDARY_ITEMS,
  "counting-processes-p4": COUNTING_P4_BOUNDARY_ITEMS,
  "counting-processes-p6": COUNTING_P6_BOUNDARY_ITEMS,
  "additive-strategies-p4": ADDITIVE_P4_BOUNDARY_ITEMS,
  "additive-strategies-p5": ADDITIVE_P5_BOUNDARY_ITEMS,
  "additive-strategies-p7": ADDITIVE_P7_BOUNDARY_ITEMS,
  "additive-strategies-p8": ADDITIVE_P8_BOUNDARY_ITEMS,
  "multiplicative-strategies-p4": MULTIPLICATIVE_P4_BOUNDARY_ITEMS,
  "multiplicative-strategies-p5": MULTIPLICATIVE_P5_BOUNDARY_ITEMS,
  "multiplicative-strategies-p7": MULTIPLICATIVE_P7_BOUNDARY_ITEMS,
  "multiplicative-strategies-p8": MULTIPLICATIVE_P8_BOUNDARY_ITEMS,
  "understanding-money-p3": MONEY_P3_BOUNDARY_ITEMS,
  "understanding-money-p4": MONEY_P4_BOUNDARY_ITEMS,
  "understanding-money-p6": MONEY_P6_BOUNDARY_ITEMS,
  "understanding-money-p7": MONEY_P7_BOUNDARY_ITEMS,
} as const;

export const NPV_P6_RESERVE_ITEM = shortAnswerItem({
  id: "myl-anchor-npv-p06-c-v1",
  code: "MYL-MATH-PROG-NSA-NPV-P06",
  yearLevel: "Year 3",
  substrand: "Number and place value",
  skillId: "npv-p6-tenths-decimal",
  skillName: "Represent tenths using decimal notation",
  prompt: "Write three tenths as a decimal.",
  correctValue: "0.3",
  acceptableValues: ["0.3", ".3"],
  misconceptionTags: ["tenths-decimal-notation-error"],
  tags: ["number-place-value", "p6", "npv-p06-c", "reserve-probe"],
});

export const COUNTING_P5_RESERVE_ITEM = choiceItem({
  id: "myl-anchor-cnt-p05-c-v1",
  code: "MYL-MATH-PROG-NSA-CNT-P05",
  yearLevel: "Year 1",
  substrand: "Counting processes",
  skillId: "counting-p5-zero",
  skillName: "Use zero to represent no objects",
  prompt: "Which numeral represents no objects?",
  options: [
    { id: "a", label: "0" },
    { id: "b", label: "1" },
    { id: "c", label: "10" },
    { id: "d", label: "20" },
  ],
  correctOptionIds: ["a"],
  misconceptionTags: ["zero-as-none-error"],
  tags: ["counting-processes", "p5", "cnt-p05-c", "reserve-probe"],
});

export const ADDITIVE_P6_RESERVE_ITEM = choiceItem({
  id: "myl-anchor-add-p06-c-v1",
  code: "MYL-MATH-PROG-NSA-ADD-P06",
  yearLevel: "Years 1–2",
  substrand: "Additive strategies",
  skillId: "add-p6-difference",
  skillName: "Interpret subtraction as a difference",
  prompt: "Which number sentence shows the difference between 8 and 3?",
  options: [
    { id: "a", label: "8 - 3 = 5" },
    { id: "b", label: "8 + 3 = 11" },
    { id: "c", label: "8 - 5 = 3 + 5" },
    { id: "d", label: "3 - 8 = 5" },
  ],
  correctOptionIds: ["a"],
  misconceptionTags: ["difference-vs-take-away-confusion"],
  tags: ["additive-strategies", "p6", "add-p06-c", "reserve-probe"],
});

export const MULTIPLICATIVE_P6_RESERVE_ITEM = choiceItem({
  id: "myl-anchor-mul-p06-c-v1",
  code: "MYL-MATH-PROG-NSA-MUL-P06",
  yearLevel: "Years 4–5",
  substrand: "Multiplicative strategies",
  skillId: "mul-p6-remainder",
  skillName: "Interpret a remainder after grouping",
  prompt: "26 counters are put into groups of 4. Which result is correct?",
  options: [
    { id: "a", label: "6 full groups with 2 counters left over" },
    { id: "b", label: "7 full groups with 2 counters left over" },
    { id: "c", label: "6 full groups with no counters left over" },
    { id: "d", label: "5 full groups with 6 counters left over" },
  ],
  correctOptionIds: ["a"],
  misconceptionTags: ["remainder-interpretation-error", "division-grouping-error"],
  tags: ["multiplicative-strategies", "p6", "mul-p06-c", "reserve-probe"],
});

export const MONEY_P5_RESERVE_ITEM = shortAnswerItem({
  id: "myl-anchor-mon-p05-c-v1",
  code: "MYL-MATH-PROG-NSA-MON-P05",
  yearLevel: "Year 4",
  substrand: "Understanding money",
  skillId: "money-p5-mixed-collection",
  skillName: "Determine the value of a mixed money collection",
  prompt: "A purse contains four $1 coins, three 20c coins and two 10c coins. What is the total value in dollars?",
  correctValue: "4.80",
  acceptableValues: ["4.80", "4.8", "$4.80", "$4.8"],
  misconceptionTags: ["money-total-error", "dollars-cents-conversion-error"],
  tags: ["understanding-money", "p5", "mon-p05-c", "reserve-probe"],
});

export const NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS = {
  "number-place-value-p6": NPV_P6_RESERVE_ITEM,
  "counting-processes-p5": COUNTING_P5_RESERVE_ITEM,
  "additive-strategies-p6": ADDITIVE_P6_RESERVE_ITEM,
  "multiplicative-strategies-p6": MULTIPLICATIVE_P6_RESERVE_ITEM,
  "understanding-money-p5": MONEY_P5_RESERVE_ITEM,
} as const;

export const NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS = {
  "number-place-value-p3": NPV_P3_ANCHOR_ITEMS,
  "number-place-value-p6": NPV_P6_ANCHOR_ITEMS,
  "number-place-value-p9": NPV_P9_ANCHOR_ITEMS,
  "counting-processes-p2": COUNTING_P2_ANCHOR_ITEMS,
  "counting-processes-p5": COUNTING_P5_ANCHOR_ITEMS,
  "counting-processes-p7": COUNTING_P7_ANCHOR_ITEMS,
  "additive-strategies-p3": ADDITIVE_P3_ANCHOR_ITEMS,
  "additive-strategies-p6": ADDITIVE_P6_ANCHOR_ITEMS,
  "additive-strategies-p9": ADDITIVE_P9_ANCHOR_ITEMS,
  "multiplicative-strategies-p3": MULTIPLICATIVE_P3_ANCHOR_ITEMS,
  "multiplicative-strategies-p6": MULTIPLICATIVE_P6_ANCHOR_ITEMS,
  "multiplicative-strategies-p9": MULTIPLICATIVE_P9_ANCHOR_ITEMS,
  "understanding-money-p2": MONEY_P2_ANCHOR_ITEMS,
  "understanding-money-p5": MONEY_P5_ANCHOR_ITEMS,
  "understanding-money-p8": MONEY_P8_ANCHOR_ITEMS,
} as const;
