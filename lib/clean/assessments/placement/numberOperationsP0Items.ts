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
  choiceItem({
    id: "myl-anchor-npv-p09-a-v1",
    code: "MYL-MATH-PROG-NSA-NPV-P09",
    yearLevel: "Years 6–8",
    substrand: "Number and place value",
    skillId: "npv-p9-negative-order",
    skillName: "Order negative and positive numbers",
    prompt: "Which list is ordered from smallest to largest?",
    options: [
      { id: "a", label: "-12, -2.5, 0, 4" },
      { id: "b", label: "-2.5, -12, 0, 4" },
      { id: "c", label: "0, -2.5, -12, 4" },
      { id: "d", label: "4, 0, -2.5, -12" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["negative-number-order-error", "absolute-value-order-confusion"],
    tags: ["number-place-value", "p9", "npv-p09-a", "adapted-existing-construct"],
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

export const NUMBER_OPERATIONS_SEARCH_CLUSTERS = {
  "number-place-value-p2": NPV_P2_SEARCH_ITEMS,
  "number-place-value-p10": NPV_P10_SEARCH_ITEMS,
  "counting-processes-p8": COUNTING_P8_SEARCH_ITEMS,
  "additive-strategies-p10": ADDITIVE_P10_SEARCH_ITEMS,
  "multiplicative-strategies-p10": MULTIPLICATIVE_P10_SEARCH_ITEMS,
  "understanding-money-p9": MONEY_P9_SEARCH_ITEMS,
  "understanding-money-p10": MONEY_P10_SEARCH_ITEMS,
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
  "counting-processes-p5": COUNTING_P5_ANCHOR_ITEMS,
  "counting-processes-p7": COUNTING_P7_ANCHOR_ITEMS,
  "additive-strategies-p6": ADDITIVE_P6_ANCHOR_ITEMS,
  "additive-strategies-p9": ADDITIVE_P9_ANCHOR_ITEMS,
  "multiplicative-strategies-p6": MULTIPLICATIVE_P6_ANCHOR_ITEMS,
  "multiplicative-strategies-p9": MULTIPLICATIVE_P9_ANCHOR_ITEMS,
  "understanding-money-p5": MONEY_P5_ANCHOR_ITEMS,
  "understanding-money-p8": MONEY_P8_ANCHOR_ITEMS,
} as const;
