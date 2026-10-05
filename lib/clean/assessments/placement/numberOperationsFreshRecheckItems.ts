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
    pLevel: 5,
    source: "fresh-recheck-draft",
    items: COUNTING_P5_RECHECK_ITEMS,
    reserveItem: COUNTING_P5_RECHECK_RESERVE,
    note:
      "Fresh initial-level Counting evidence only. Remaining Counting levels still require alternate recheck coverage.",
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
    subElementKey: "multiplicative-strategies",
    pLevel: 6,
    source: "fresh-recheck-draft",
    items: MULTIPLICATIVE_P6_RECHECK_ITEMS,
    reserveItem: MULTIPLICATIVE_P6_RECHECK_RESERVE,
    note:
      "Fresh initial-level Multiplicative evidence only. Remaining Multiplicative levels still require alternate recheck coverage.",
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
