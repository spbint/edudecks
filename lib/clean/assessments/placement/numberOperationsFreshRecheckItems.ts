import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";
import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";
import { NPV_CONFIRMATION_CLUSTERS } from "./numberOperationsNpvConfirmationItems";

const noneStimulus = { type: "none" as const, data: {} };

function curriculum(
  code: string,
  yearLevel: string,
  substrand: string,
): NonNullable<MyLearnaAssessmentItem["curriculum"]> {
  return {
    country: "Australia",
    jurisdiction: "QCAA Numeracy general capability",
    yearLevel,
    strand: "Number sense and algebra",
    substrand,
    code,
  };
}

function shortItem(input: {
  id: string;
  code: string;
  yearLevel: string;
  substrand: string;
  skillId: string;
  skillName: string;
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
    curriculum: curriculum(
      input.code,
      input.yearLevel,
      input.substrand,
    ),
    skill: { id: input.skillId, name: input.skillName },
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
    feedback: { correct: "Correct.", incorrect: "Not quite." },
    analytics: {
      tags: ["maths-starting-point", "fresh-recheck", ...input.tags],
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
  options: Array<{ id: string; label: string }>;
  correctOptionIds: string[];
  misconceptionTags?: string[];
  stimulus?: MyLearnaAssessmentItem["stimulus"];
  tags: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: curriculum(
      input.code,
      input.yearLevel,
      input.substrand,
    ),
    skill: { id: input.skillId, name: input.skillName },
    misconceptionTags: input.misconceptionTags || [],
    difficulty: 2,
    template: "multiple-choice",
    prompt: input.prompt,
    stimulus: input.stimulus || noneStimulus,
    response: {
      type: "single-choice",
      options: input.options.map((option) => ({
        ...option,
        value: option.label,
      })),
      correctOptionIds: input.correctOptionIds,
    },
    feedback: { correct: "Correct.", incorrect: "Not quite." },
    analytics: {
      tags: ["maths-starting-point", "fresh-recheck", ...input.tags],
    },
  };
}

export type NumberOperationsFreshRecheckCluster = {
  subElementKey: NumberOperationsSubElementKey;
  pLevel: number;
  source: "npv-confirmation" | "fresh-recheck-draft";
  items: readonly MyLearnaAssessmentItem[];
  reserveItem?: MyLearnaAssessmentItem;
  note: string;
};

const COUNTING_P1_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-cnt-p01-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P01",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "counting-p1-recheck-number-word",
    skillName: "Recognise a number word in an early counting context",
    prompt: "Which word is a number word?",
    options: [
      { id: "a", label: "five" },
      { id: "b", label: "green" },
      { id: "c", label: "skip" },
      { id: "d", label: "window" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["early-number-word-recognition-error"],
    tags: ["counting-processes", "p1", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-recheck-cnt-p01-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P01",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "counting-p1-recheck-subitise",
    skillName: "Subitise a very small collection",
    prompt: "Which numeral matches the collection?",
    stimulus: {
      type: "counter-set",
      data: { quantity: 2, arrangement: "dice", seed: 112, maxQuantity: 3 },
      altText:
        "A very small collection of counters. The quantity is intentionally not stated because recognising it is the task.",
    },
    options: [
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["early-subitising-error"],
    tags: [
      "counting-processes",
      "p1",
      "hybrid-routing-only",
      "separate-accessible-form-required",
    ],
  }),
] as const;

const COUNTING_P3_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-cnt-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P03",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "counting-p3-recheck-after",
    skillName: "Determine the number after a given number within 1–10",
    prompt: "What number comes after 7?",
    correctValue: "8",
    misconceptionTags: ["early-before-after-error"],
    tags: ["counting-processes", "p3", "hybrid-routing-only"],
  }),
  shortItem({
    id: "myl-recheck-cnt-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P03",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "counting-p3-recheck-before",
    skillName: "Determine the number before a given number within 1–10",
    prompt: "What number comes before 8?",
    correctValue: "7",
    misconceptionTags: ["early-before-after-error"],
    tags: ["counting-processes", "p3", "hybrid-routing-only"],
  }),
] as const;

const COUNTING_P4_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-cnt-p04-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P04",
    yearLevel: "Prep–Year 1",
    substrand: "Counting processes",
    skillId: "counting-p4-recheck-continue",
    skillName: "Continue counting from a number other than one",
    prompt: "Continue the count: 4, 5, 6, __",
    correctValue: "7",
    misconceptionTags: ["continue-count-nonone-error"],
    tags: ["counting-processes", "p4", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-recheck-cnt-p04-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P04",
    yearLevel: "Prep–Year 1",
    substrand: "Counting processes",
    skillId: "counting-p4-recheck-object-type",
    skillName: "Treat equal counts as the same quantity across different objects",
    prompt: "Which statement is true?",
    options: [
      { id: "a", label: "6 buttons and 6 books represent the same quantity" },
      { id: "b", label: "6 buttons is always more than 6 books" },
      { id: "c", label: "The kind of object changes what the number 6 means" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["count-object-type-dependence-error"],
    tags: ["counting-processes", "p4", "hybrid-routing-only"],
  }),
] as const;

const COUNTING_P6_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-cnt-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P06",
    yearLevel: "Years 1–3",
    substrand: "Counting processes",
    skillId: "counting-p6-recheck-beyond-100",
    skillName: "Continue counting beyond 100",
    prompt: "Continue the count: 298, 299, 300, __",
    correctValue: "301",
    misconceptionTags: ["count-sequence-boundary-error"],
    tags: ["counting-processes", "p6"],
  }),
  shortItem({
    id: "myl-recheck-cnt-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P06",
    yearLevel: "Years 1–3",
    substrand: "Counting processes",
    skillId: "counting-p6-recheck-twos",
    skillName: "Count by twos from zero",
    prompt: "Continue the sequence: 0, 2, 4, 6, __",
    correctValue: "8",
    misconceptionTags: ["skip-count-interval-error"],
    tags: ["counting-processes", "p6"],
  }),
] as const;

const COUNTING_P8_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-cnt-p08-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P08",
    yearLevel: "Years 4–6",
    substrand: "Counting processes",
    skillId: "counting-p8-recheck-rational",
    skillName: "Count flexibly in rational numbers",
    prompt: "Continue the sequence: 5, 4.5, 4, 3.5, __",
    correctValue: "3",
    misconceptionTags: ["decimal-counting-interval-error"],
    tags: ["counting-processes", "p8"],
  }),
  shortItem({
    id: "myl-recheck-cnt-p08-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P08",
    yearLevel: "Years 4–6",
    substrand: "Counting processes",
    skillId: "counting-p8-recheck-outcomes",
    skillName: "Systematically quantify possible outcomes",
    prompt: "A shirt comes in 4 colours and 3 sizes. How many different colour-and-size combinations are possible?",
    correctValue: "12",
    misconceptionTags: ["abstract-counting-outcomes-error"],
    tags: ["counting-processes", "p8"],
  }),
] as const;

const COUNTING_P2_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-cnt-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P02",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "counting-p2-recheck-subitise",
    skillName: "Conceptually subitise a small collection",
    prompt: "How many counters are shown?",
    stimulus: {
      type: "counter-set",
      data: { quantity: 4, arrangement: "five-frame", seed: 224, maxQuantity: 5 },
      altText:
        "A small organised collection of counters. The quantity is intentionally not stated because recognising it is the task.",
    },
    options: [
      { id: "a", label: "2" },
      { id: "b", label: "3" },
      { id: "c", label: "4" },
      { id: "d", label: "5" },
    ],
    correctOptionIds: ["c"],
    misconceptionTags: ["small-collection-recognition-error"],
    tags: [
      "counting-processes",
      "p2",
      "hybrid-routing-only",
      "separate-accessible-form-required",
    ],
  }),
  choiceItem({
    id: "myl-recheck-cnt-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P02",
    yearLevel: "Prep",
    substrand: "Counting processes",
    skillId: "counting-p2-recheck-small-count",
    skillName: "Count a very small visible collection",
    prompt: "Which numeral matches the collection?",
    stimulus: {
      type: "counter-set",
      data: { quantity: 2, arrangement: "scattered", seed: 222, maxQuantity: 3 },
      altText:
        "A very small scattered collection of counters. The quantity is intentionally not stated because counting it is the task.",
    },
    options: [
      { id: "a", label: "1" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
    ],
    correctOptionIds: ["b"],
    misconceptionTags: ["one-to-one-counting-error"],
    tags: [
      "counting-processes",
      "p2",
      "hybrid-routing-only",
      "separate-accessible-form-required",
    ],
  }),
] as const;

const COUNTING_P7_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-cnt-p07-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P07",
    yearLevel: "Years 2–4",
    substrand: "Counting processes",
    skillId: "counting-p7-recheck-off-decade-tens",
    skillName: "Continue a count by tens off the decade",
    prompt: "Continue the sequence: 12, 22, 32, 42, __",
    correctValue: "52",
    misconceptionTags: ["skip-count-interval-error", "off-decade-counting-error"],
    tags: ["counting-processes", "p7"],
  }),
  shortItem({
    id: "myl-recheck-cnt-p07-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P07",
    yearLevel: "Years 2–4",
    substrand: "Counting processes",
    skillId: "counting-p7-recheck-grouped-residual",
    skillName: "Count a grouped quantity and residual",
    prompt: "What total quantity is represented?",
    correctValue: "64",
    stimulus: {
      type: "place-value-blocks",
      data: { tens: 6, ones: 4, layout: "grouped" },
      altText:
        "A grouped place-value representation with tens and ones. The exact quantities are intentionally not stated because interpreting the total is the task.",
    },
    misconceptionTags: ["grouped-counting-error", "residual-counting-error"],
    tags: [
      "counting-processes",
      "p7",
      "separate-accessible-form-required",
    ],
  }),
] as const;

const ADDITIVE_P3_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-add-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P03",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p3-recheck-concealed-total",
    skillName: "Solve an additive task with concealed quantities",
    prompt: "6 counters are hidden under one cup. 2 are hidden under another. How many counters are there altogether?",
    correctValue: "8",
    misconceptionTags: ["concealed-quantity-addition-error"],
    tags: ["additive-strategies", "p3", "hybrid-routing-only"],
  }),
  shortItem({
    id: "myl-recheck-add-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P03",
    yearLevel: "Year 1",
    substrand: "Additive strategies",
    skillId: "add-p3-recheck-second-concealed",
    skillName: "Retain and combine two concealed quantities",
    prompt: "3 counters are hidden in one box. 4 are hidden in another. How many counters are hidden altogether?",
    correctValue: "7",
    misconceptionTags: ["concealed-quantity-addition-error"],
    tags: ["additive-strategies", "p3", "hybrid-routing-only"],
  }),
] as const;

const ADDITIVE_P9_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-add-p09-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P09",
    yearLevel: "Years 5–7",
    substrand: "Additive strategies",
    skillId: "add-p9-recheck-related-fractions",
    skillName: "Add fractions with related denominators",
    prompt: "Calculate 2/5 + 1/10. Give your answer as a fraction.",
    correctValue: "1/2",
    acceptableValues: ["1/2", "5/10"],
    misconceptionTags: ["fraction-common-denominator-error"],
    tags: ["additive-strategies", "p9"],
  }),
  shortItem({
    id: "myl-recheck-add-p09-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P09",
    yearLevel: "Years 5–7",
    substrand: "Additive strategies",
    skillId: "add-p9-recheck-decimal-addition",
    skillName: "Add decimals to three decimal places",
    prompt: "Calculate 3.206 + 0.75.",
    correctValue: "3.956",
    misconceptionTags: ["decimal-place-alignment-error"],
    tags: ["additive-strategies", "p9"],
  }),
] as const;

const MULTIPLICATIVE_P3_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mul-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P03",
    yearLevel: "Year 2",
    substrand: "Multiplicative strategies",
    skillId: "mul-p3-recheck-concealed-groups",
    skillName: "Determine a total from concealed equal groups",
    prompt: "There are 5 closed packs. Each pack has 4 markers inside. How many markers are there altogether?",
    correctValue: "20",
    misconceptionTags: ["composite-unit-total-error"],
    tags: ["multiplicative-strategies", "p3", "hybrid-routing-only"],
  }),
  shortItem({
    id: "myl-recheck-mul-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P03",
    yearLevel: "Year 2",
    substrand: "Multiplicative strategies",
    skillId: "mul-p3-recheck-second-concealed",
    skillName: "Count using imagined composite units",
    prompt: "There are 2 closed boxes. Each box has 7 objects inside. How many objects are there altogether?",
    correctValue: "14",
    misconceptionTags: ["composite-unit-total-error"],
    tags: ["multiplicative-strategies", "p3", "hybrid-routing-only"],
  }),
] as const;

const MULTIPLICATIVE_P9_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mul-p09-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P09",
    yearLevel: "Years 6–8",
    substrand: "Multiplicative strategies",
    skillId: "mul-p9-recheck-prime-factors",
    skillName: "Express a number as a product of prime factors",
    prompt: "Which expression writes 108 as a product of prime powers?",
    options: [
      { id: "a", label: "2² × 3³" },
      { id: "b", label: "2³ × 3²" },
      { id: "c", label: "2 × 3 × 18" },
      { id: "d", label: "10² + 8" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["prime-factorisation-error", "exponent-form-error"],
    tags: ["multiplicative-strategies", "p9"],
  }),
  shortItem({
    id: "myl-recheck-mul-p09-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P09",
    yearLevel: "Years 6–8",
    substrand: "Multiplicative strategies",
    skillId: "mul-p9-recheck-fraction-of-quantity",
    skillName: "Calculate a fraction of a quantity multiplicatively",
    prompt: "Calculate one third of 18.",
    correctValue: "6",
    misconceptionTags: ["fraction-of-quantity-error"],
    tags: ["multiplicative-strategies", "p9"],
  }),
] as const;

const MONEY_P2_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mon-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P02",
    yearLevel: "Year 1",
    substrand: "Understanding money",
    skillId: "money-p2-recheck-face-value-order",
    skillName: "Order money denominations by face value",
    prompt: "Which list orders these money values from least to greatest?",
    stimulus: {
      type: "currency-tokens",
      data: {
        layout: "row",
        tokens: [
          { denomination: "$1" },
          { denomination: "10c" },
          { denomination: "$2" },
          { denomination: "50c" },
        ],
      },
      altText:
        "Four Australian money tokens are shown in an order that must be interpreted visually. Their denominations are intentionally not stated because ordering their values is the task.",
    },
    options: [
      { id: "a", label: "10c, 50c, $1, $2" },
      { id: "b", label: "$2, $1, 50c, 10c" },
      { id: "c", label: "10c, $1, 50c, $2" },
      { id: "d", label: "50c, 10c, $1, $2" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["money-face-value-order-error", "dollars-cents-order-confusion"],
    tags: [
      "understanding-money",
      "p2",
      "asset-review",
      "separate-accessible-form-required",
    ],
  }),
  shortItem({
    id: "myl-recheck-mon-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P02",
    yearLevel: "Year 1",
    substrand: "Understanding money",
    skillId: "money-p2-recheck-count-denomination",
    skillName: "Count money tokens with the same face value",
    prompt: "How many 50c tokens are shown?",
    correctValue: "3",
    stimulus: {
      type: "currency-tokens",
      data: {
        layout: "grid",
        tokens: [
          { denomination: "50c" },
          { denomination: "$1" },
          { denomination: "20c" },
          { denomination: "50c" },
          { denomination: "$2" },
          { denomination: "50c" },
        ],
      },
      altText:
        "Six Australian money tokens are shown. Their denominations are intentionally not stated because identifying and counting a target denomination is the task.",
    },
    misconceptionTags: ["money-denomination-count-error"],
    tags: [
      "understanding-money",
      "p2",
      "asset-review",
      "separate-accessible-form-required",
    ],
  }),
] as const;

const MONEY_P8_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mon-p08-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P08",
    yearLevel: "Years 6–8",
    substrand: "Understanding money",
    skillId: "money-p8-recheck-discount",
    skillName: "Calculate a percentage discount and sale price",
    prompt: "A $120 item is reduced by 25%. What is the sale price in dollars?",
    correctValue: "90",
    acceptableValues: ["90", "$90", "90.00", "$90.00"],
    misconceptionTags: ["discount-vs-sale-price-error", "percentage-of-quantity-error"],
    tags: ["understanding-money", "p8"],
  }),
  shortItem({
    id: "myl-recheck-mon-p08-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P08",
    yearLevel: "Years 6–8",
    substrand: "Understanding money",
    skillId: "money-p8-recheck-simple-interest",
    skillName: "Calculate simple interest from a percentage rate",
    prompt: "$800 is invested for 1 year at 5% simple interest. How many dollars of interest are earned?",
    correctValue: "40",
    acceptableValues: ["40", "$40", "40.00", "$40.00"],
    misconceptionTags: ["simple-interest-error", "percentage-rate-error"],
    tags: ["understanding-money", "p8"],
  }),
] as const;

const COUNTING_P5_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-cnt-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P05",
    yearLevel: "Year 1",
    substrand: "Counting processes",
    skillId: "counting-p5-recheck-next-number",
    skillName: "Determine the next number within 1–100",
    prompt: "What number comes immediately after 74?",
    correctValue: "75",
    misconceptionTags: ["count-sequence-boundary-error", "restarts-count-from-one"],
    tags: ["counting-processes", "p5"],
  }),
  shortItem({
    id: "myl-recheck-cnt-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-CNT-P05",
    yearLevel: "Year 1",
    substrand: "Counting processes",
    skillId: "counting-p5-recheck-collection",
    skillName: "Match a collection up to 20 to its numeral",
    prompt: "How many counters are shown?",
    correctValue: "17",
    stimulus: {
      type: "counter-set",
      data: {
        quantity: 17,
        arrangement: "scattered",
        seed: 517,
        maxQuantity: 20,
      },
      altText:
        "A scattered collection of identical counters. The quantity is intentionally not stated because counting the collection is the task.",
    },
    misconceptionTags: ["one-to-one-counting-error", "collection-numeral-mismatch"],
    tags: [
      "counting-processes",
      "p5",
      "separate-accessible-form-required",
    ],
  }),
] as const;

const COUNTING_P5_RECHECK_RESERVE = choiceItem({
  id: "myl-recheck-cnt-p05-c-v1",
  code: "MYL-MATH-PROG-NSA-CNT-P05",
  yearLevel: "Year 1",
  substrand: "Counting processes",
  skillId: "counting-p5-recheck-zero",
  skillName: "Use zero to represent no objects",
  prompt: "A container is empty. Which numeral shows how many objects are inside?",
  options: [
    { id: "a", label: "0" },
    { id: "b", label: "1" },
    { id: "c", label: "10" },
    { id: "d", label: "20" },
  ],
  correctOptionIds: ["a"],
  misconceptionTags: ["zero-as-none-error"],
  tags: ["counting-processes", "p5", "reserve-probe"],
});

const ADDITIVE_P6_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-add-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P06",
    yearLevel: "Years 1–2",
    substrand: "Additive strategies",
    skillId: "add-p6-recheck-bridge-ten",
    skillName: "Use a flexible bridge-to-10 strategy",
    prompt: "Which working is an efficient way to calculate 9 + 7?",
    options: [
      { id: "a", label: "9 + 1 + 6 = 16" },
      { id: "b", label: "9 + 7 = 97" },
      { id: "c", label: "9 + 9 + 7 = 25" },
      { id: "d", label: "10 + 9 = 19" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["bridge-to-ten-gap", "additive-strategy-error"],
    tags: ["additive-strategies", "p6"],
  }),
  choiceItem({
    id: "myl-recheck-add-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-ADD-P06",
    yearLevel: "Years 1–2",
    substrand: "Additive strategies",
    skillId: "add-p6-recheck-part-whole",
    skillName: "Use part-part-whole knowledge for a missing addend",
    prompt: "Which working uses part-part-whole thinking to solve 8 + __ = 15?",
    options: [
      { id: "a", label: "8 + 2 = 10, then 5 more, so the missing part is 7" },
      { id: "b", label: "15 + 8 = 23, so the missing part is 23" },
      { id: "c", label: "15 - 2 = 13, so the missing part is 13" },
      { id: "d", label: "8 + 8 = 16, so the missing part is 8" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["missing-addend-error", "part-part-whole-gap"],
    tags: ["additive-strategies", "p6"],
  }),
] as const;

const ADDITIVE_P6_RECHECK_RESERVE = choiceItem({
  id: "myl-recheck-add-p06-c-v1",
  code: "MYL-MATH-PROG-NSA-ADD-P06",
  yearLevel: "Years 1–2",
  substrand: "Additive strategies",
  skillId: "add-p6-recheck-difference",
  skillName: "Interpret subtraction as a difference",
  prompt: "Which number sentence shows the difference between 12 and 5?",
  options: [
    { id: "a", label: "12 - 5 = 7" },
    { id: "b", label: "12 + 5 = 17" },
    { id: "c", label: "5 - 12 = 7" },
    { id: "d", label: "12 - 7 = 12" },
  ],
  correctOptionIds: ["a"],
  misconceptionTags: ["difference-vs-take-away-confusion"],
  tags: ["additive-strategies", "p6", "reserve-probe"],
});

const MULTIPLICATIVE_P6_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mul-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P06",
    yearLevel: "Years 4–5",
    substrand: "Multiplicative strategies",
    skillId: "mul-p6-recheck-related-multiple",
    skillName: "Use a known multiple to calculate a related multiple",
    prompt: "If 5 × 8 = 40, which working uses that fact to calculate 10 × 8?",
    options: [
      { id: "a", label: "40 + 40 = 80" },
      { id: "b", label: "40 + 8 = 48" },
      { id: "c", label: "40 - 8 = 32" },
      { id: "d", label: "5 + 8 = 13" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["related-multiple-strategy-error"],
    tags: ["multiplicative-strategies", "p6"],
  }),
  shortItem({
    id: "myl-recheck-mul-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-MUL-P06",
    yearLevel: "Years 4–5",
    substrand: "Multiplicative strategies",
    skillId: "mul-p6-recheck-context",
    skillName: "Interpret and solve a single-digit multiplication context",
    prompt: "There are 7 trays with 8 pencils on each tray. How many pencils are there altogether?",
    correctValue: "56",
    misconceptionTags: ["multiplication-context-error", "times-table-fluency-gap"],
    tags: ["multiplicative-strategies", "p6"],
  }),
] as const;

const MULTIPLICATIVE_P6_RECHECK_RESERVE = choiceItem({
  id: "myl-recheck-mul-p06-c-v1",
  code: "MYL-MATH-PROG-NSA-MUL-P06",
  yearLevel: "Years 4–5",
  substrand: "Multiplicative strategies",
  skillId: "mul-p6-recheck-one-zero",
  skillName: "Use the multiplicative properties of one and zero",
  prompt: "Which statement is always true?",
  options: [
    { id: "a", label: "1 × 9 = 9" },
    { id: "b", label: "0 × 9 = 9" },
    { id: "c", label: "1 × 9 = 10" },
    { id: "d", label: "0 × 9 = 1" },
  ],
  correctOptionIds: ["a"],
  misconceptionTags: ["multiplicative-identity-zero-error"],
  tags: ["multiplicative-strategies", "p6", "reserve-probe"],
});

const MONEY_P5_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mon-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-MON-P05",
    yearLevel: "Year 4",
    substrand: "Understanding money",
    skillId: "money-p5-recheck-notation",
    skillName: "Write dollars and cents in standard decimal notation",
    prompt: "Which is the correct way to write 5 dollars and 4 cents?",
    options: [
      { id: "a", label: "$5.04" },
      { id: "b", label: "$5.40" },
      { id: "c", label: "$5.4" },
      { id: "d", label: "$504" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["money-decimal-place-value-error", "cents-dollars-conversion-error"],
    tags: ["understanding-money", "p5"],
  }),
  shortItem({
    id: "myl-recheck-mon-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-MON-P05",
    yearLevel: "Year 4",
    substrand: "Understanding money",
    skillId: "money-p5-recheck-mixed-total",
    skillName: "Determine the total value of a mixed money collection",
    prompt: "A collection has one $5 coin, two $2 coins and three 20c coins. What is the total value in dollars?",
    correctValue: "9.60",
    acceptableValues: ["9.60", "9.6", "$9.60", "$9.6"],
    misconceptionTags: ["money-total-error", "dollars-cents-conversion-error"],
    tags: ["understanding-money", "p5"],
  }),
] as const;

const MONEY_P5_RECHECK_RESERVE = shortItem({
  id: "myl-recheck-mon-p05-c-v1",
  code: "MYL-MATH-PROG-NSA-MON-P05",
  yearLevel: "Year 4",
  substrand: "Understanding money",
  skillId: "money-p5-recheck-second-total",
  skillName: "Determine the value of a mixed money collection",
  prompt: "A purse has three $1 coins, two 50c coins and four 10c coins. What is the total value in dollars?",
  correctValue: "4.40",
  acceptableValues: ["4.40", "4.4", "$4.40", "$4.4"],
  misconceptionTags: ["money-total-error", "dollars-cents-conversion-error"],
  tags: ["understanding-money", "p5", "reserve-probe"],
});

const NPV_RECHECK_CLUSTERS: NumberOperationsFreshRecheckCluster[] =
  Object.entries(NPV_CONFIRMATION_CLUSTERS).map(([pLevel, items]) => ({
    subElementKey: "number-place-value",
    pLevel: Number(pLevel),
    source: "npv-confirmation",
    items,
    note:
      "Existing independent NPV confirmation items provide alternate evidence for this progression level. They remain draft review content.",
  }));

export const NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS: NumberOperationsFreshRecheckCluster[] = [
  ...NPV_RECHECK_CLUSTERS,
  {
    subElementKey: "counting-processes",
    pLevel: 1,
    source: "fresh-recheck-draft",
    items: COUNTING_P1_RECHECK_ITEMS,
    note:
      "Fresh P1 Counting evidence spans number-word recognition and pre-counting subitising; digital evidence remains routing-only.",
  },
  {
    subElementKey: "counting-processes",
    pLevel: 2,
    source: "fresh-recheck-draft",
    items: COUNTING_P2_RECHECK_ITEMS,
    note:
      "Fresh lower-anchor Counting evidence. Strategy-dependent digital correctness remains routing-only.",
  },
  {
    subElementKey: "counting-processes",
    pLevel: 3,
    source: "fresh-recheck-draft",
    items: COUNTING_P3_RECHECK_ITEMS,
    note:
      "Fresh P3 Counting evidence for before/after sequence knowledge; strategy-dependent evidence remains routing-only.",
  },
  {
    subElementKey: "counting-processes",
    pLevel: 4,
    source: "fresh-recheck-draft",
    items: COUNTING_P4_RECHECK_ITEMS,
    note:
      "Fresh P4 Counting evidence for continuing from non-one starts and count invariance; digital evidence remains routing-only.",
  },
  {
    subElementKey: "counting-processes",
    pLevel: 5,
    source: "fresh-recheck-draft",
    items: COUNTING_P5_RECHECK_ITEMS,
    reserveItem: COUNTING_P5_RECHECK_RESERVE,
    note:
      "Fresh initial-level Counting evidence only. Remaining Counting levels still require alternate recheck coverage.",
  },
  {
    subElementKey: "counting-processes",
    pLevel: 6,
    source: "fresh-recheck-draft",
    items: COUNTING_P6_RECHECK_ITEMS,
    note:
      "Fresh P6 Counting evidence across counting beyond 100 and skip counting.",
  },
  {
    subElementKey: "counting-processes",
    pLevel: 7,
    source: "fresh-recheck-draft",
    items: COUNTING_P7_RECHECK_ITEMS,
    note:
      "Fresh upper-anchor Counting evidence across off-decade counting and grouped quantities.",
  },
  {
    subElementKey: "counting-processes",
    pLevel: 8,
    source: "fresh-recheck-draft",
    items: COUNTING_P8_RECHECK_ITEMS,
    note:
      "Fresh P8 Counting evidence spans rational-number counting and abstract quantification.",
  },
  {
    subElementKey: "additive-strategies",
    pLevel: 3,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P3_RECHECK_ITEMS,
    note:
      "Fresh lower-anchor Additive evidence. Concealed-quantity correctness remains routing-only without observation.",
  },
  {
    subElementKey: "additive-strategies",
    pLevel: 6,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P6_RECHECK_ITEMS,
    reserveItem: ADDITIVE_P6_RECHECK_RESERVE,
    note:
      "Fresh initial-level Additive evidence only. Remaining Additive levels still require alternate recheck coverage.",
  },
  {
    subElementKey: "additive-strategies",
    pLevel: 9,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P9_RECHECK_ITEMS,
    note:
      "Fresh upper-anchor Additive evidence across related-denominator fractions and decimal addition.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 3,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P3_RECHECK_ITEMS,
    note:
      "Fresh lower-anchor Multiplicative evidence. Concealed composite-unit correctness remains routing-only without observation.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 6,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P6_RECHECK_ITEMS,
    reserveItem: MULTIPLICATIVE_P6_RECHECK_RESERVE,
    note:
      "Fresh initial-level Multiplicative evidence only. Remaining Multiplicative levels still require alternate recheck coverage.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 9,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P9_RECHECK_ITEMS,
    note:
      "Fresh upper-anchor Multiplicative evidence across prime factors/exponents and rational-number multiplication.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 2,
    source: "fresh-recheck-draft",
    items: MONEY_P2_RECHECK_ITEMS,
    note:
      "Fresh lower-anchor Money content exists but remains behind the same trusted currency-asset approval gate.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 5,
    source: "fresh-recheck-draft",
    items: MONEY_P5_RECHECK_ITEMS,
    reserveItem: MONEY_P5_RECHECK_RESERVE,
    note:
      "Fresh initial-level Money evidence only. Remaining Money levels still require alternate recheck coverage.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 8,
    source: "fresh-recheck-draft",
    items: MONEY_P8_RECHECK_ITEMS,
    note:
      "Fresh upper-anchor Money evidence across discounts and simple interest.",
  },
];

const byKey = new Map(
  NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS.map((cluster) => [
    `${cluster.subElementKey}:p${cluster.pLevel}`,
    cluster,
  ]),
);

export function getNumberOperationsFreshRecheckCluster(
  subElementKey: NumberOperationsSubElementKey,
  pLevel: number,
) {
  return byKey.get(`${subElementKey}:p${pLevel}`) || null;
}

export function getNumberOperationsFreshRecheckItems() {
  return NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS.flatMap((cluster) => [
    ...cluster.items,
    ...(cluster.reserveItem ? [cluster.reserveItem] : []),
  ]);
}
