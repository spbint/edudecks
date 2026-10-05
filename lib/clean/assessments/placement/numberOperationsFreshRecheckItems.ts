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

const ADDITIVE_P1_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-add-p01-a-v1", code: "MYL-MATH-PROG-NSA-ADD-P01", yearLevel: "Prep", substrand: "Additive strategies",
    skillId: "add-p1-recheck-removing-effect", skillName: "Recognise the effect of removing from a collection",
    prompt: "A collection has 4 counters. One counter is taken away. What happens to the collection?",
    options: [{ id: "a", label: "It has fewer counters" }, { id: "b", label: "It has more counters" }, { id: "c", label: "It stays the same" }],
    correctOptionIds: ["a"], misconceptionTags: ["removing-effect-error"],
    tags: ["additive-strategies", "p1", "hybrid-routing-only"],
  }),
  shortItem({
    id: "myl-recheck-add-p01-b-v1", code: "MYL-MATH-PROG-NSA-ADD-P01", yearLevel: "Prep", substrand: "Additive strategies",
    skillId: "add-p1-recheck-combine-groups", skillName: "Combine two very small groups",
    prompt: "One group has 1 counter. Another group has 3 counters. How many counters are there altogether?",
    correctValue: "4", misconceptionTags: ["emergent-additive-total-error"],
    tags: ["additive-strategies", "p1", "hybrid-routing-only"],
  }),
] as const;

const ADDITIVE_P2_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-add-p02-a-v1", code: "MYL-MATH-PROG-NSA-ADD-P02", yearLevel: "Prep", substrand: "Additive strategies",
    skillId: "add-p2-recheck-visible-combine", skillName: "Combine two visible small collections",
    prompt: "There are 4 yellow counters and 3 blue counters. How many counters are there altogether?",
    correctValue: "7", misconceptionTags: ["visible-additive-count-all-error"],
    tags: ["additive-strategies", "p2", "hybrid-routing-only"],
  }),
  shortItem({
    id: "myl-recheck-add-p02-b-v1", code: "MYL-MATH-PROG-NSA-ADD-P02", yearLevel: "Prep", substrand: "Additive strategies",
    skillId: "add-p2-recheck-visible-remove", skillName: "Take away from a visible small collection",
    prompt: "There are 8 counters. Three counters are taken away. How many counters remain?",
    correctValue: "5", misconceptionTags: ["visible-subtraction-count-all-error"],
    tags: ["additive-strategies", "p2", "hybrid-routing-only"],
  }),
] as const;

const ADDITIVE_P4_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-add-p04-a-v1", code: "MYL-MATH-PROG-NSA-ADD-P04", yearLevel: "Year 1", substrand: "Additive strategies",
    skillId: "add-p4-recheck-count-on", skillName: "Use counting on for a small addition",
    prompt: "Which count-on sequence can be used to solve 7 + 3?",
    options: [{ id: "a", label: "Start at 7: 8, 9, 10" }, { id: "b", label: "Start at 1: 2, 3, 4" }, { id: "c", label: "Start at 7: 6, 5, 4" }],
    correctOptionIds: ["a"], misconceptionTags: ["counting-on-error"],
    tags: ["additive-strategies", "p4", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-recheck-add-p04-b-v1", code: "MYL-MATH-PROG-NSA-ADD-P04", yearLevel: "Year 1", substrand: "Additive strategies",
    skillId: "add-p4-recheck-count-up", skillName: "Use counting up for a missing addend",
    prompt: "Which count-up sequence finds the missing number in 5 + __ = 9?",
    options: [{ id: "a", label: "Start at 5: 6, 7, 8, 9; four counts" }, { id: "b", label: "Start at 1: 2, 3, 4, 5; five counts" }, { id: "c", label: "Start at 9: 8, 7, 6; three counts" }],
    correctOptionIds: ["a"], misconceptionTags: ["counting-up-to-error"],
    tags: ["additive-strategies", "p4", "hybrid-routing-only"],
  }),
] as const;

const ADDITIVE_P5_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-add-p05-a-v1", code: "MYL-MATH-PROG-NSA-ADD-P05", yearLevel: "Year 1", substrand: "Additive strategies",
    skillId: "add-p5-recheck-count-back", skillName: "Use counting back for subtraction",
    prompt: "Which count-back sequence can be used to solve 13 - 4?",
    options: [{ id: "a", label: "Start at 13: 12, 11, 10, 9" }, { id: "b", label: "Start at 4: 5, 6, 7, 8" }, { id: "c", label: "Start at 13: 14, 15, 16, 17" }],
    correctOptionIds: ["a"], misconceptionTags: ["counting-back-error"],
    tags: ["additive-strategies", "p5", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-recheck-add-p05-b-v1", code: "MYL-MATH-PROG-NSA-ADD-P05", yearLevel: "Year 1", substrand: "Additive strategies",
    skillId: "add-p5-recheck-count-up-difference", skillName: "Use counting up to determine a difference",
    prompt: "Which count-up sequence finds the difference between 9 and 14?",
    options: [{ id: "a", label: "Start at 9: 10, 11, 12, 13, 14; five counts" }, { id: "b", label: "Start at 14: 15, 16, 17, 18, 19; five counts" }, { id: "c", label: "Start at 9: 8, 7, 6, 5, 4; five counts" }],
    correctOptionIds: ["a"], misconceptionTags: ["counting-up-difference-error"],
    tags: ["additive-strategies", "p5", "hybrid-routing-only"],
  }),
] as const;

const ADDITIVE_P7_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-add-p07-a-v1", code: "MYL-MATH-PROG-NSA-ADD-P07", yearLevel: "Year 2", substrand: "Additive strategies",
    skillId: "add-p7-recheck-compensation", skillName: "Use compensation with two-digit subtraction",
    prompt: "Which working correctly uses compensation to calculate 62 - 49?",
    options: [{ id: "a", label: "63 - 50 = 13" }, { id: "b", label: "62 - 50 = 12" }, { id: "c", label: "61 - 49 = 13" }, { id: "d", label: "62 + 49 = 111" }],
    correctOptionIds: ["a"], misconceptionTags: ["two-digit-compensation-error"], tags: ["additive-strategies", "p7"],
  }),
  choiceItem({
    id: "myl-recheck-add-p07-b-v1", code: "MYL-MATH-PROG-NSA-ADD-P07", yearLevel: "Year 2", substrand: "Additive strategies",
    skillId: "add-p7-recheck-associative", skillName: "Reorder addends to simplify mental addition",
    prompt: "Which working reorders the addends to make 36 + 8 + 4 easier?",
    options: [{ id: "a", label: "(36 + 4) + 8 = 40 + 8 = 48" }, { id: "b", label: "36 + (8 - 4) = 40" }, { id: "c", label: "(36 + 8) - 4 = 40" }, { id: "d", label: "36 + 8 + 4 = 3,684" }],
    correctOptionIds: ["a"], misconceptionTags: ["two-digit-addition-strategy-error"], tags: ["additive-strategies", "p7"],
  }),
] as const;

const ADDITIVE_P8_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-add-p08-a-v1", code: "MYL-MATH-PROG-NSA-ADD-P08", yearLevel: "Years 3-5", substrand: "Additive strategies",
    skillId: "add-p8-recheck-place-value", skillName: "Use place-value partitioning with three-digit addition",
    prompt: "Which working correctly uses place value to calculate 326 + 480?",
    options: [{ id: "a", label: "326 + 400 + 80 = 726 + 80 = 806" }, { id: "b", label: "326 + 40 + 8 = 374" }, { id: "c", label: "326 + 48 = 374" }, { id: "d", label: "326 + 400 - 80 = 646" }],
    correctOptionIds: ["a"], misconceptionTags: ["three-digit-addition-error", "place-value-partitioning-error"], tags: ["additive-strategies", "p8"],
  }),
  choiceItem({
    id: "myl-recheck-add-p08-b-v1", code: "MYL-MATH-PROG-NSA-ADD-P08", yearLevel: "Years 3-5", substrand: "Additive strategies",
    skillId: "add-p8-recheck-estimation", skillName: "Estimate to check an additive result",
    prompt: "A learner says 378 + 214 = 1,592. Which estimate best checks that claim?",
    options: [{ id: "a", label: "380 + 210 is about 590, so 1,592 is not reasonable" }, { id: "b", label: "38 + 21 is about 59, so 1,592 is reasonable" }, { id: "c", label: "400 + 200 is about 6,000, so 1,592 is reasonable" }],
    correctOptionIds: ["a"], misconceptionTags: ["additive-estimation-error"], tags: ["additive-strategies", "p8"],
  }),
] as const;

const ADDITIVE_P10_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-add-p10-a-v1", code: "MYL-MATH-PROG-NSA-ADD-P10", yearLevel: "Years 7-8", substrand: "Additive strategies",
    skillId: "add-p10-recheck-unrelated-fractions", skillName: "Add fractions with unrelated denominators",
    prompt: "Calculate 3/4 + 2/7. Give your answer as an improper fraction.", correctValue: "29/28",
    misconceptionTags: ["unrelated-denominator-addition-error"], tags: ["additive-strategies", "p10"],
  }),
  shortItem({
    id: "myl-recheck-add-p10-b-v1", code: "MYL-MATH-PROG-NSA-ADD-P10", yearLevel: "Years 7-8", substrand: "Additive strategies",
    skillId: "add-p10-recheck-integers", skillName: "Add and subtract integers",
    prompt: "Calculate -11 + 18 - 9.", correctValue: "-2", misconceptionTags: ["integer-addition-error"], tags: ["additive-strategies", "p10"],
  }),
] as const;

const MULTIPLICATIVE_P1_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mul-p01-a-v1", code: "MYL-MATH-PROG-NSA-MUL-P01", yearLevel: "Prep", substrand: "Multiplicative strategies",
    skillId: "mul-p1-recheck-equal-share", skillName: "Share a very small collection equally",
    prompt: "8 counters are shared equally between 2 people. How many counters does each person receive?", correctValue: "4",
    misconceptionTags: ["early-equal-sharing-error"], tags: ["multiplicative-strategies", "p1", "hybrid-routing-only"],
  }),
  shortItem({
    id: "myl-recheck-mul-p01-b-v1", code: "MYL-MATH-PROG-NSA-MUL-P01", yearLevel: "Prep", substrand: "Multiplicative strategies",
    skillId: "mul-p1-recheck-equal-groups", skillName: "Make equal groups and determine a total",
    prompt: "There are 2 equal groups of 3 counters. How many counters are there altogether?", correctValue: "6",
    misconceptionTags: ["early-equal-groups-error"], tags: ["multiplicative-strategies", "p1", "hybrid-routing-only"],
  }),
] as const;

const MULTIPLICATIVE_P2_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mul-p02-a-v1", code: "MYL-MATH-PROG-NSA-MUL-P02", yearLevel: "Year 1", substrand: "Multiplicative strategies",
    skillId: "mul-p2-recheck-visible-groups", skillName: "Use visible equal groups",
    prompt: "Three visible groups each contain 4 counters. How many counters are there altogether?", correctValue: "12",
    misconceptionTags: ["perceptual-multiple-error"], tags: ["multiplicative-strategies", "p2", "hybrid-routing-only"],
  }),
  shortItem({
    id: "myl-recheck-mul-p02-b-v1", code: "MYL-MATH-PROG-NSA-MUL-P02", yearLevel: "Year 1", substrand: "Multiplicative strategies",
    skillId: "mul-p2-recheck-visible-share", skillName: "Use visible equal sharing",
    prompt: "10 counters are shared equally between 5 people. How many counters does each person receive?", correctValue: "2",
    misconceptionTags: ["perceptual-sharing-error"], tags: ["multiplicative-strategies", "p2", "hybrid-routing-only"],
  }),
] as const;

const MULTIPLICATIVE_P4_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mul-p04-a-v1", code: "MYL-MATH-PROG-NSA-MUL-P04", yearLevel: "Year 2", substrand: "Multiplicative strategies",
    skillId: "mul-p4-recheck-repeated-addition", skillName: "Use repeated composite units additively",
    prompt: "Which repeated addition represents five lots of 3?",
    options: [{ id: "a", label: "3 + 3 + 3 + 3 + 3" }, { id: "b", label: "5 + 3" }, { id: "c", label: "5 + 5 + 5 + 5 + 5" }],
    correctOptionIds: ["a"], misconceptionTags: ["repeated-addition-composite-unit-error"], tags: ["multiplicative-strategies", "p4", "hybrid-routing-only"],
  }),
  choiceItem({
    id: "myl-recheck-mul-p04-b-v1", code: "MYL-MATH-PROG-NSA-MUL-P04", yearLevel: "Year 2", substrand: "Multiplicative strategies",
    skillId: "mul-p4-recheck-repeated-subtraction", skillName: "Use repeated subtraction to form equal groups",
    prompt: "Which sequence uses repeated subtraction to find how many groups of 5 can be made from 20?",
    options: [{ id: "a", label: "20, 15, 10, 5, 0" }, { id: "b", label: "20, 19, 18, 17, 16" }, { id: "c", label: "20, 25, 30, 35, 40" }],
    correctOptionIds: ["a"], misconceptionTags: ["repeated-subtraction-grouping-error"], tags: ["multiplicative-strategies", "p4", "hybrid-routing-only"],
  }),
] as const;

const MULTIPLICATIVE_P5_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mul-p05-a-v1", code: "MYL-MATH-PROG-NSA-MUL-P05", yearLevel: "Years 2-3", substrand: "Multiplicative strategies",
    skillId: "mul-p5-recheck-array", skillName: "Represent multiplication with an array",
    prompt: "An array has 5 rows of 3. Which multiplication equation matches it?",
    options: [{ id: "a", label: "5 x 3 = 15" }, { id: "b", label: "5 + 3 = 8" }, { id: "c", label: "15 - 5 = 10" }, { id: "d", label: "15 / 3 = 3" }],
    correctOptionIds: ["a"], misconceptionTags: ["array-equation-error"], tags: ["multiplicative-strategies", "p5"],
  }),
  choiceItem({
    id: "myl-recheck-mul-p05-b-v1", code: "MYL-MATH-PROG-NSA-MUL-P05", yearLevel: "Years 2-3", substrand: "Multiplicative strategies",
    skillId: "mul-p5-recheck-sharing", skillName: "Represent division as equal sharing",
    prompt: "Which equation represents sharing 18 objects equally among 6 people?",
    options: [{ id: "a", label: "18 / 6 = 3" }, { id: "b", label: "18 - 6 = 12" }, { id: "c", label: "18 + 6 = 24" }, { id: "d", label: "6 / 18 = 3" }],
    correctOptionIds: ["a"], misconceptionTags: ["division-sharing-representation-error"], tags: ["multiplicative-strategies", "p5"],
  }),
] as const;

const MULTIPLICATIVE_P7_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mul-p07-a-v1", code: "MYL-MATH-PROG-NSA-MUL-P07", yearLevel: "Years 4-5", substrand: "Multiplicative strategies",
    skillId: "mul-p7-recheck-distributive", skillName: "Use distributive partitioning for multiplication",
    prompt: "Which working correctly uses the distributive property to calculate 6 x 74?",
    options: [{ id: "a", label: "6 x 70 + 6 x 4 = 420 + 24 = 444" }, { id: "b", label: "6 x 70 + 4 = 424" }, { id: "c", label: "6 + 70 + 4 = 80" }, { id: "d", label: "6 x 70 + 6 + 4 = 430" }],
    correctOptionIds: ["a"], misconceptionTags: ["distributive-multiplication-error"], tags: ["multiplicative-strategies", "p7"],
  }),
  choiceItem({
    id: "myl-recheck-mul-p07-b-v1", code: "MYL-MATH-PROG-NSA-MUL-P07", yearLevel: "Years 4-5", substrand: "Multiplicative strategies",
    skillId: "mul-p7-recheck-double-half", skillName: "Use doubling and halving as a multiplicative strategy",
    prompt: "Which calculation uses doubling and halving to work out 18 x 25?",
    options: [{ id: "a", label: "9 x 50" }, { id: "b", label: "36 x 25" }, { id: "c", label: "9 x 25" }, { id: "d", label: "18 x 50" }],
    correctOptionIds: ["a"], misconceptionTags: ["doubling-halving-multiplication-error"], tags: ["multiplicative-strategies", "p7"],
  }),
] as const;

const MULTIPLICATIVE_P8_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mul-p08-a-v1", code: "MYL-MATH-PROG-NSA-MUL-P08", yearLevel: "Year 6", substrand: "Multiplicative strategies",
    skillId: "mul-p8-recheck-multistep", skillName: "Solve a multi-step multiplicative problem",
    prompt: "15 cartons hold 28 items each. All the items are shared equally among 7 groups. How many items does each group receive?", correctValue: "60",
    misconceptionTags: ["multi-step-multiplicative-error"], tags: ["multiplicative-strategies", "p8"],
  }),
  choiceItem({
    id: "myl-recheck-mul-p08-b-v1", code: "MYL-MATH-PROG-NSA-MUL-P08", yearLevel: "Year 6", substrand: "Multiplicative strategies",
    skillId: "mul-p8-recheck-operation-sequence", skillName: "Choose a multi-step multiplicative expression",
    prompt: "Nine shelves hold 42 books each. Then 35 books are removed. Which expression finds the number left?",
    options: [{ id: "a", label: "9 x 42 - 35" }, { id: "b", label: "9 + 42 - 35" }, { id: "c", label: "42 / 9 + 35" }, { id: "d", label: "9 x (42 + 35)" }],
    correctOptionIds: ["a"], misconceptionTags: ["multi-step-operation-choice-error"], tags: ["multiplicative-strategies", "p8"],
  }),
] as const;

const MULTIPLICATIVE_P10_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mul-p10-a-v1", code: "MYL-MATH-PROG-NSA-MUL-P10", yearLevel: "Years 7-10", substrand: "Multiplicative strategies",
    skillId: "mul-p10-recheck-decimal-scaling", skillName: "Multiply decimals efficiently using place value",
    prompt: "Calculate 0.372 x 300.", correctValue: "111.6", acceptableValues: ["111.6", "111.60"],
    misconceptionTags: ["decimal-scaling-error"], tags: ["multiplicative-strategies", "p10"],
  }),
  shortItem({
    id: "myl-recheck-mul-p10-b-v1", code: "MYL-MATH-PROG-NSA-MUL-P10", yearLevel: "Years 7-10", substrand: "Multiplicative strategies",
    skillId: "mul-p10-recheck-scientific-notation", skillName: "Operate multiplicatively with scientific notation",
    prompt: "Calculate (3 x 10^5) x (2 x 10^-2). Give the result as an ordinary number.", correctValue: "6000", acceptableValues: ["6000", "6,000"],
    misconceptionTags: ["scientific-notation-multiplication-error"], tags: ["multiplicative-strategies", "p10"],
  }),
] as const;

const MONEY_P1_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mon-p01-a-v1", code: "MYL-MATH-PROG-NSA-MON-P01", yearLevel: "Prep-Year 1", substrand: "Understanding money",
    skillId: "money-p1-recheck-context", skillName: "Recognise a situation that uses money",
    prompt: "Which situation usually involves paying money?",
    options: [{ id: "a", label: "Buying fruit at a market" }, { id: "b", label: "Listening to birds outside" }, { id: "c", label: "Drawing a picture at home" }, { id: "d", label: "Counting clouds" }],
    correctOptionIds: ["a"], misconceptionTags: ["money-context-recognition-error"], tags: ["understanding-money", "p1", "asset-review"],
  }),
  choiceItem({
    id: "myl-recheck-mon-p01-b-v1", code: "MYL-MATH-PROG-NSA-MON-P01", yearLevel: "Prep-Year 1", substrand: "Understanding money",
    skillId: "money-p1-recheck-face-value", skillName: "Identify a money denomination by face value",
    prompt: "Which money token has a face value of one dollar?",
    stimulus: { type: "currency-tokens", data: { layout: "row", tokens: [{ denomination: "20c" }, { denomination: "$1" }, { denomination: "$2" }] }, altText: "Three Australian money tokens are shown. Their denominations are intentionally not stated because recognising face value is the task." },
    options: [{ id: "a", label: "20c" }, { id: "b", label: "$1" }, { id: "c", label: "$2" }], correctOptionIds: ["b"],
    misconceptionTags: ["money-face-value-recognition-error"], tags: ["understanding-money", "p1", "asset-review", "separate-accessible-form-required"],
  }),
] as const;

const MONEY_P3_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mon-p03-a-v1", code: "MYL-MATH-PROG-NSA-MON-P03", yearLevel: "Years 1-2", substrand: "Understanding money",
    skillId: "money-p3-recheck-same-denomination", skillName: "Determine the value of same-denomination coins",
    prompt: "Six 20c tokens have a total value of how many cents?", correctValue: "120", acceptableValues: ["120", "120c"],
    misconceptionTags: ["same-denomination-total-error"], tags: ["understanding-money", "p3"],
  }),
  shortItem({
    id: "myl-recheck-mon-p03-b-v1", code: "MYL-MATH-PROG-NSA-MON-P03", yearLevel: "Years 1-2", substrand: "Understanding money",
    skillId: "money-p3-recheck-whole-dollar", skillName: "Write the value of a small money collection",
    prompt: "Four $2 tokens have a total value of how many dollars?", correctValue: "8", acceptableValues: ["8", "$8", "8.00", "$8.00"],
    misconceptionTags: ["small-money-collection-value-error"], tags: ["understanding-money", "p3"],
  }),
] as const;

const MONEY_P4_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mon-p04-a-v1", code: "MYL-MATH-PROG-NSA-MON-P04", yearLevel: "Years 3-4", substrand: "Understanding money",
    skillId: "money-p4-recheck-equivalence", skillName: "Recognise an equivalent coin value",
    prompt: "Which collection is equal to $4?",
    options: [{ id: "a", label: "8 x 50c" }, { id: "b", label: "4 x 50c" }, { id: "c", label: "4 x 20c" }, { id: "d", label: "2 x $1" }],
    correctOptionIds: ["a"], misconceptionTags: ["money-equivalence-error"], tags: ["understanding-money", "p4"],
  }),
  choiceItem({
    id: "myl-recheck-mon-p04-b-v1", code: "MYL-MATH-PROG-NSA-MON-P04", yearLevel: "Years 3-4", substrand: "Understanding money",
    skillId: "money-p4-recheck-order", skillName: "Order money amounts by monetary value",
    prompt: "Which amount has the greatest value?",
    options: [{ id: "a", label: "$2.40" }, { id: "b", label: "$3.05" }, { id: "c", label: "$2.95" }, { id: "d", label: "$0.35" }],
    correctOptionIds: ["b"], misconceptionTags: ["money-value-order-error"], tags: ["understanding-money", "p4"],
  }),
] as const;

const MONEY_P6_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mon-p06-a-v1", code: "MYL-MATH-PROG-NSA-MON-P06", yearLevel: "Year 4", substrand: "Understanding money",
    skillId: "money-p6-recheck-total", skillName: "Calculate the total cost of different items",
    prompt: "An item costs $6.75 and another costs $3.40. What is the total cost in dollars?", correctValue: "10.15", acceptableValues: ["10.15", "$10.15"],
    misconceptionTags: ["money-additive-total-error"], tags: ["understanding-money", "p6"],
  }),
  shortItem({
    id: "myl-recheck-mon-p06-b-v1", code: "MYL-MATH-PROG-NSA-MON-P06", yearLevel: "Year 4", substrand: "Understanding money",
    skillId: "money-p6-recheck-change", skillName: "Calculate change to the nearest five cents",
    prompt: "A purchase costs $16.45. How much change should be given from $25.00?", correctValue: "8.55", acceptableValues: ["8.55", "$8.55"],
    misconceptionTags: ["money-change-error"], tags: ["understanding-money", "p6"],
  }),
] as const;

const MONEY_P7_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mon-p07-a-v1", code: "MYL-MATH-PROG-NSA-MON-P07", yearLevel: "Years 4-6", substrand: "Understanding money",
    skillId: "money-p7-recheck-repeated-purchase", skillName: "Use multiplication with dollars and cents",
    prompt: "80 tickets cost 25 cents each. What is the total cost in dollars?", correctValue: "20", acceptableValues: ["20", "$20", "20.00", "$20.00"],
    misconceptionTags: ["cents-dollars-multiplication-error"], tags: ["understanding-money", "p7"],
  }),
  shortItem({
    id: "myl-recheck-mon-p07-b-v1", code: "MYL-MATH-PROG-NSA-MON-P07", yearLevel: "Years 4-6", substrand: "Understanding money",
    skillId: "money-p7-recheck-split-bill", skillName: "Split a bill using multiplicative reasoning",
    prompt: "A bill of $108 is split equally between 9 people. How many dollars does each person pay?", correctValue: "12", acceptableValues: ["12", "$12", "12.00", "$12.00"],
    misconceptionTags: ["bill-splitting-error"], tags: ["understanding-money", "p7"],
  }),
] as const;

const MONEY_P9_RECHECK_ITEMS = [
  choiceItem({
    id: "myl-recheck-mon-p09-a-v1", code: "MYL-MATH-PROG-NSA-MON-P09", yearLevel: "Years 8-9", substrand: "Understanding money",
    skillId: "money-p9-recheck-best-buy", skillName: "Use proportional reasoning to determine a best buy",
    prompt: "Which is the better buy per 100 g?",
    options: [{ id: "a", label: "600 g for $5.40" }, { id: "b", label: "900 g for $7.20" }, { id: "c", label: "They cost the same per 100 g" }],
    correctOptionIds: ["b"], misconceptionTags: ["unit-rate-comparison-error"], tags: ["understanding-money", "p9"],
  }),
  shortItem({
    id: "myl-recheck-mon-p09-b-v1", code: "MYL-MATH-PROG-NSA-MON-P09", yearLevel: "Years 8-9", substrand: "Understanding money",
    skillId: "money-p9-recheck-profit", skillName: "Calculate percentage profit",
    prompt: "An item is bought for $120 and sold for $150. What percentage profit is made?", correctValue: "25", acceptableValues: ["25", "25%"],
    misconceptionTags: ["percentage-profit-error"], tags: ["understanding-money", "p9"],
  }),
] as const;

const MONEY_P10_RECHECK_ITEMS = [
  shortItem({
    id: "myl-recheck-mon-p10-a-v1", code: "MYL-MATH-PROG-NSA-MON-P10", yearLevel: "Years 9-10", substrand: "Understanding money",
    skillId: "money-p10-recheck-compound-interest", skillName: "Reason about compound interest",
    prompt: "$2,000 earns 5% interest each year for 2 years, compounded annually. What is the final balance in dollars?", correctValue: "2205", acceptableValues: ["2205", "$2205", "2205.00", "$2205.00"],
    misconceptionTags: ["compound-vs-simple-interest-error"], tags: ["understanding-money", "p10"],
  }),
  choiceItem({
    id: "myl-recheck-mon-p10-b-v1", code: "MYL-MATH-PROG-NSA-MON-P10", yearLevel: "Years 9-10", substrand: "Understanding money",
    skillId: "money-p10-recheck-financial-decision", skillName: "Compare long-term financial choices",
    prompt: "When comparing two phone purchase plans, which information supports a full long-term comparison?",
    options: [{ id: "a", label: "Only the upfront price" }, { id: "b", label: "Upfront price, monthly payments, contract length, fees and included usage" }, { id: "c", label: "Only the phone colour" }, { id: "d", label: "Only the first monthly payment" }],
    correctOptionIds: ["b"], misconceptionTags: ["financial-decision-narrow-cost-error"], tags: ["understanding-money", "p10"],
  }),
] as const;

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
    pLevel: 1,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P1_RECHECK_ITEMS,
    note: "Fresh P1 Additive evidence; electronic correctness remains routing-only without observed manipulation and explanation.",
  },
  {
    subElementKey: "additive-strategies",
    pLevel: 2,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P2_RECHECK_ITEMS,
    note: "Fresh P2 Additive evidence; electronic correctness remains routing-only without observation of visible-material strategy.",
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
    pLevel: 4,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P4_RECHECK_ITEMS,
    note: "Fresh P4 Additive evidence explicitly elicits count-on and count-up working; it remains hybrid routing evidence.",
  },
  {
    subElementKey: "additive-strategies",
    pLevel: 5,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P5_RECHECK_ITEMS,
    note: "Fresh P5 Additive evidence explicitly elicits count-back and count-up-for-difference working; it remains hybrid routing evidence.",
  },
  {
    subElementKey: "additive-strategies",
    pLevel: 6,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P6_RECHECK_ITEMS,
    reserveItem: ADDITIVE_P6_RECHECK_RESERVE,
    note:
      "Fresh P6 Additive evidence explicitly samples flexible and part-part-whole strategies.",
  },
  {
    subElementKey: "additive-strategies",
    pLevel: 7,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P7_RECHECK_ITEMS,
    note: "Fresh P7 Additive evidence explicitly elicits compensation and associative reordering strategies.",
  },
  {
    subElementKey: "additive-strategies",
    pLevel: 8,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P8_RECHECK_ITEMS,
    note: "Fresh P8 Additive evidence samples place-value partitioning and estimation as a reasonableness check.",
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
    subElementKey: "additive-strategies",
    pLevel: 10,
    source: "fresh-recheck-draft",
    items: ADDITIVE_P10_RECHECK_ITEMS,
    note: "Fresh P10 Additive evidence across unrelated-denominator fractions and integer operations.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 1,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P1_RECHECK_ITEMS,
    note: "Fresh P1 Multiplicative evidence; electronic correctness remains routing-only without observed equal sharing or grouping.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 2,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P2_RECHECK_ITEMS,
    note: "Fresh P2 Multiplicative evidence; electronic correctness remains routing-only without observation of perceptual grouping.",
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
    pLevel: 4,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P4_RECHECK_ITEMS,
    note: "Fresh P4 Multiplicative evidence explicitly elicits repeated addition and repeated subtraction; it remains hybrid routing evidence.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 5,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P5_RECHECK_ITEMS,
    note: "Fresh P5 Multiplicative evidence samples symbolic array and equal-sharing representations.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 6,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P6_RECHECK_ITEMS,
    reserveItem: MULTIPLICATIVE_P6_RECHECK_RESERVE,
    note:
      "Fresh P6 Multiplicative evidence samples related multiples and contextual single-digit multiplication.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 7,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P7_RECHECK_ITEMS,
    note: "Fresh P7 Multiplicative evidence explicitly elicits distributive and doubling-and-halving strategies.",
  },
  {
    subElementKey: "multiplicative-strategies",
    pLevel: 8,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P8_RECHECK_ITEMS,
    note: "Fresh P8 Multiplicative evidence samples multi-step solution and operation selection.",
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
    subElementKey: "multiplicative-strategies",
    pLevel: 10,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P10_RECHECK_ITEMS,
    note: "Fresh P10 Multiplicative evidence across decimal scaling and scientific notation.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 1,
    source: "fresh-recheck-draft",
    items: MONEY_P1_RECHECK_ITEMS,
    note: "Fresh P1 Money evidence remains behind the trusted Australian currency-asset approval gate.",
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
    pLevel: 3,
    source: "fresh-recheck-draft",
    items: MONEY_P3_RECHECK_ITEMS,
    note: "Fresh P3 Money evidence samples totals for same-denomination cent and dollar collections.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 4,
    source: "fresh-recheck-draft",
    items: MONEY_P4_RECHECK_ITEMS,
    note: "Fresh P4 Money evidence samples equivalent collections and ordering by monetary value.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 5,
    source: "fresh-recheck-draft",
    items: MONEY_P5_RECHECK_ITEMS,
    reserveItem: MONEY_P5_RECHECK_RESERVE,
    note:
      "Fresh P5 Money evidence samples notation and mixed-collection totals.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 6,
    source: "fresh-recheck-draft",
    items: MONEY_P6_RECHECK_ITEMS,
    note: "Fresh P6 Money evidence samples total cost and change to the nearest five cents.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 7,
    source: "fresh-recheck-draft",
    items: MONEY_P7_RECHECK_ITEMS,
    note: "Fresh P7 Money evidence samples repeated cost and equal bill splitting.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 8,
    source: "fresh-recheck-draft",
    items: MONEY_P8_RECHECK_ITEMS,
    note:
      "Fresh upper-anchor Money evidence across discounts and simple interest.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 9,
    source: "fresh-recheck-draft",
    items: MONEY_P9_RECHECK_ITEMS,
    note: "Fresh P9 Money evidence samples unit-rate best-buy reasoning and percentage profit.",
  },
  {
    subElementKey: "understanding-money",
    pLevel: 10,
    source: "fresh-recheck-draft",
    items: MONEY_P10_RECHECK_ITEMS,
    note: "Fresh P10 Money evidence samples compound interest and full-cost financial comparison.",
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
