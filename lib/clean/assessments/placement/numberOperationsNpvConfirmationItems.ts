import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

const noneStimulus = { type: "none" as const, data: {} };

function curriculum(code: string, yearLevel: string) {
  return {
    country: "Australia",
    jurisdiction: "QCAA Numeracy general capability",
    yearLevel,
    strand: "Number sense and algebra",
    substrand: "Number and place value",
    code,
  };
}

function short(input: {
  id: string;
  p: number;
  yearLevel: string;
  skillId: string;
  skillName: string;
  prompt: string;
  correctValue: string;
  acceptableValues?: string[];
  stimulus?: MyLearnaAssessmentItem["stimulus"];
  misconceptionTags?: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: curriculum(
      `MYL-MATH-PROG-NSA-NPV-P${String(input.p).padStart(2, "0")}`,
      input.yearLevel,
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
      tags: [
        "maths-starting-point",
        "confirmation",
        "number-place-value",
        `p${input.p}`,
      ],
    },
  };
}

function choice(input: {
  id: string;
  p: number;
  yearLevel: string;
  skillId: string;
  skillName: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  correctOptionIds: string[];
  multi?: boolean;
  misconceptionTags?: string[];
  stimulus?: MyLearnaAssessmentItem["stimulus"];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: curriculum(
      `MYL-MATH-PROG-NSA-NPV-P${String(input.p).padStart(2, "0")}`,
      input.yearLevel,
    ),
    skill: { id: input.skillId, name: input.skillName },
    misconceptionTags: input.misconceptionTags || [],
    difficulty: 2,
    template: "multiple-choice",
    prompt: input.prompt,
    stimulus: input.stimulus || noneStimulus,
    response: {
      type: input.multi ? "multiple-choice" : "single-choice",
      options: input.options.map((option) => ({
        ...option,
        value: option.label,
      })),
      correctOptionIds: input.correctOptionIds,
    },
    feedback: { correct: "Correct.", incorrect: "Not quite." },
    analytics: {
      tags: [
        "maths-starting-point",
        "confirmation",
        "number-place-value",
        `p${input.p}`,
      ],
    },
  };
}

function ordering(input: {
  id: string;
  p: number;
  yearLevel: string;
  skillId: string;
  skillName: string;
  prompt: string;
  values: Array<{ id: string; label: string }>;
  correctOrder: string[];
  misconceptionTags?: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: curriculum(
      `MYL-MATH-PROG-NSA-NPV-P${String(input.p).padStart(2, "0")}`,
      input.yearLevel,
    ),
    skill: { id: input.skillId, name: input.skillName },
    misconceptionTags: input.misconceptionTags || [],
    difficulty: 2,
    template: "ordering",
    prompt: input.prompt,
    stimulus: noneStimulus,
    response: {
      type: "ordering",
      options: input.values.map((value) => ({
        ...value,
        value: value.label,
      })),
      correctOptionIds: input.correctOrder,
    },
    feedback: { correct: "Correct.", incorrect: "Not quite." },
    analytics: {
      tags: [
        "maths-starting-point",
        "confirmation",
        "number-place-value",
        `p${input.p}`,
        "direct-ordering",
      ],
    },
  };
}

export const NPV_CONFIRMATION_P1: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-confirm-npv-p01-a-v1",
    p: 1,
    yearLevel: "Prep",
    skillId: "npv-p1-confirm-small-quantity",
    skillName: "Recognise a very small quantity",
    prompt: "Which numeral matches the collection?",
    stimulus: {
      type: "counter-set",
      data: { quantity: 2, arrangement: "scattered", seed: 901, maxQuantity: 3 },
      altText:
        "A very small collection of counters. The quantity is intentionally not stated because recognising it is the task.",
    },
    options: [
      { id: "one", label: "1" },
      { id: "two", label: "2" },
      { id: "three", label: "3" },
    ],
    correctOptionIds: ["two"],
    misconceptionTags: ["small-quantity-recognition-error"],
  }),
  choice({
    id: "myl-confirm-npv-p01-b-v1",
    p: 1,
    yearLevel: "Prep",
    skillId: "npv-p1-confirm-familiar-numeral",
    skillName: "Identify a familiar numeral",
    prompt: "Which numeral is five?",
    options: [
      { id: "three", label: "3" },
      { id: "five", label: "5" },
      { id: "seven", label: "7" },
    ],
    correctOptionIds: ["five"],
    misconceptionTags: ["familiar-numeral-recognition-error"],
  }),
];

export const NPV_CONFIRMATION_P2: MyLearnaAssessmentItem[] = [
  ordering({
    id: "myl-confirm-npv-p02-a-v1",
    p: 2,
    yearLevel: "Prep",
    skillId: "npv-p2-confirm-order-to-ten",
    skillName: "Order numerals within 1–10",
    prompt: "Order these numbers from smallest to largest.",
    values: [
      { id: "eight", label: "8" },
      { id: "two", label: "2" },
      { id: "five", label: "5" },
    ],
    correctOrder: ["two", "five", "eight"],
    misconceptionTags: ["numeral-order-error"],
  }),
  choice({
    id: "myl-confirm-npv-p02-b-v1",
    p: 2,
    yearLevel: "Prep",
    skillId: "npv-p2-confirm-ten-equivalence",
    skillName: "Recognise one ten as ten ones",
    prompt: "Which representation has the same value as one ten?",
    options: [
      { id: "ten-ones", label: "10 ones" },
      { id: "one-one", label: "1 one" },
      { id: "two-ones", label: "2 ones" },
      { id: "twenty-ones", label: "20 ones" },
    ],
    correctOptionIds: ["ten-ones"],
    misconceptionTags: ["ten-ones-equivalence-error"],
  }),
];

export const NPV_CONFIRMATION_P3: MyLearnaAssessmentItem[] = [
  ordering({
    id: "myl-confirm-npv-p03-a-v1",
    p: 3,
    yearLevel: "Prep",
    skillId: "npv-p3-confirm-order-teen",
    skillName: "Order teen numbers",
    prompt: "Order these numbers from smallest to largest.",
    values: [
      { id: "nineteen", label: "19" },
      { id: "twelve", label: "12" },
      { id: "seventeen", label: "17" },
    ],
    correctOrder: ["twelve", "seventeen", "nineteen"],
    misconceptionTags: ["teen-number-order-error"],
  }),
  short({
    id: "myl-confirm-npv-p03-b-v1",
    p: 3,
    yearLevel: "Prep",
    skillId: "npv-p3-confirm-ten-and-more",
    skillName: "Represent a teen number as ten and some more",
    prompt: "What number is one ten and eight ones?",
    correctValue: "18",
    misconceptionTags: ["teen-number-structure-error"],
  }),
];

export const NPV_CONFIRMATION_P4: MyLearnaAssessmentItem[] = [
  ordering({
    id: "myl-confirm-npv-p04-a-v1",
    p: 4,
    yearLevel: "Years 1–2",
    skillId: "npv-p4-confirm-order-within-100",
    skillName: "Order numerals within 100",
    prompt: "Order these numbers from smallest to largest.",
    values: [
      { id: "seventy-two", label: "72" },
      { id: "twenty-one", label: "21" },
      { id: "twenty-seven", label: "27" },
    ],
    correctOrder: ["twenty-one", "twenty-seven", "seventy-two"],
    misconceptionTags: ["two-digit-comparison-error"],
  }),
  choice({
    id: "myl-confirm-npv-p04-b-v1",
    p: 4,
    yearLevel: "Years 1–2",
    skillId: "npv-p4-confirm-rename",
    skillName: "Rename a two-digit number flexibly",
    prompt: "Select every representation equal to 54.",
    options: [
      { id: "5t4o", label: "5 tens and 4 ones" },
      { id: "54o", label: "54 ones" },
      { id: "50plus4", label: "50 + 4" },
      { id: "4t5o", label: "4 tens and 5 ones" },
    ],
    correctOptionIds: ["5t4o", "54o", "50plus4"],
    multi: true,
    misconceptionTags: ["tens-ones-renaming-error"],
  }),
];

export const NPV_CONFIRMATION_P5: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-confirm-npv-p05-a-v1",
    p: 5,
    yearLevel: "Year 2",
    skillId: "npv-p5-confirm-flexible-renaming",
    skillName: "Flexibly rename a three-digit number",
    prompt: "Select every representation equal to 326.",
    options: [
      { id: "3h2t6o", label: "3 hundreds, 2 tens and 6 ones" },
      { id: "3h26o", label: "3 hundreds and 26 ones" },
      { id: "32t6o", label: "32 tens and 6 ones" },
      { id: "326o", label: "326 ones" },
      { id: "3h6t2o", label: "3 hundreds, 6 tens and 2 ones" },
    ],
    correctOptionIds: ["3h2t6o", "3h26o", "32t6o", "326o"],
    multi: true,
    misconceptionTags: ["three-digit-renaming-error"],
  }),
  short({
    id: "myl-confirm-npv-p05-b-v1",
    p: 5,
    yearLevel: "Year 2",
    skillId: "npv-p5-confirm-internal-zero",
    skillName: "Interpret an internal zero",
    prompt: "5 hundreds and 4 ones is written as what numeral?",
    correctValue: "504",
    misconceptionTags: ["internal-zero-placeholder-error"],
  }),
];

export const NPV_CONFIRMATION_P6: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-confirm-npv-p06-a-v1",
    p: 6,
    yearLevel: "Year 3",
    skillId: "npv-p6-confirm-four-digit-renaming",
    skillName: "Flexibly partition a four-digit number",
    prompt: "Select every representation equal to 6,240.",
    options: [
      { id: "6k2h4t", label: "6 thousands, 2 hundreds and 4 tens" },
      { id: "62h4t", label: "62 hundreds and 4 tens" },
      { id: "5k12h4t", label: "5 thousands, 12 hundreds and 4 tens" },
      { id: "6k24h", label: "6 thousands and 24 hundreds" },
    ],
    correctOptionIds: ["6k2h4t", "62h4t", "5k12h4t"],
    multi: true,
    misconceptionTags: ["four-digit-renaming-error"],
  }),
  short({
    id: "myl-confirm-npv-p06-b-v1",
    p: 6,
    yearLevel: "Year 3",
    skillId: "npv-p6-confirm-tenths",
    skillName: "Represent tenths as decimals",
    prompt: "Write two tenths as a decimal.",
    correctValue: "0.2",
    acceptableValues: ["0.2", ".2"],
    misconceptionTags: ["tenths-decimal-notation-error"],
  }),
];

export const NPV_CONFIRMATION_P7: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-confirm-npv-p07-a-v1",
    p: 7,
    yearLevel: "Years 3–4",
    skillId: "npv-p7-confirm-hundredths",
    skillName: "Interpret decimal hundredths",
    prompt: "Which notation shows seven and five hundredths?",
    options: [
      { id: "7-05", label: "7.05" },
      { id: "7-5", label: "7.5" },
      { id: "7-50", label: "7.50" },
      { id: "705", label: "705" },
    ],
    correctOptionIds: ["7-05"],
    misconceptionTags: ["hundredths-place-value-error"],
  }),
  short({
    id: "myl-confirm-npv-p07-b-v1",
    p: 7,
    yearLevel: "Years 3–4",
    skillId: "npv-p7-confirm-round-thousand",
    skillName: "Round larger natural numbers",
    prompt: "Round 48,649 to the nearest thousand.",
    correctValue: "49000",
    acceptableValues: ["49000", "49,000"],
    misconceptionTags: ["large-number-rounding-error"],
  }),
];

export const NPV_CONFIRMATION_P8: MyLearnaAssessmentItem[] = [
  ordering({
    id: "myl-confirm-npv-p08-a-v1",
    p: 8,
    yearLevel: "Years 4–5",
    skillId: "npv-p8-confirm-order-decimals",
    skillName: "Order decimals with unequal numbers of places",
    prompt: "Order these numbers from smallest to largest.",
    values: [
      { id: "0-7", label: "0.7" },
      { id: "0-407", label: "0.407" },
      { id: "0-47", label: "0.47" },
    ],
    correctOrder: ["0-407", "0-47", "0-7"],
    misconceptionTags: ["unequal-decimal-place-order-error"],
  }),
  short({
    id: "myl-confirm-npv-p08-b-v1",
    p: 8,
    yearLevel: "Years 4–5",
    skillId: "npv-p8-confirm-place-scaling",
    skillName: "Relate adjacent decimal place values multiplicatively",
    prompt: "0.3 is how many times as great as 0.03?",
    correctValue: "10",
    misconceptionTags: ["decimal-place-multiplicative-error"],
  }),
];

export const NPV_CONFIRMATION_P9: MyLearnaAssessmentItem[] = [
  ordering({
    id: "myl-confirm-npv-p09-a-v1",
    p: 9,
    yearLevel: "Years 6–8",
    skillId: "npv-p9-confirm-negative-order",
    skillName: "Order negative and positive numbers",
    prompt: "Order these numbers from smallest to largest.",
    values: [
      { id: "3", label: "3" },
      { id: "-1-2", label: "-1.2" },
      { id: "0", label: "0" },
      { id: "-6", label: "-6" },
    ],
    correctOrder: ["-6", "-1-2", "0", "3"],
    misconceptionTags: ["negative-number-order-error"],
  }),
  short({
    id: "myl-confirm-npv-p09-b-v1",
    p: 9,
    yearLevel: "Years 6–8",
    skillId: "npv-p9-confirm-scale-hundred",
    skillName: "Scale a decimal by a power of ten",
    prompt: "Calculate 100 × 0.036.",
    correctValue: "3.6",
    misconceptionTags: ["power-of-ten-place-shift-error"],
  }),
];

export const NPV_CONFIRMATION_P10: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-confirm-npv-p10-a-v1",
    p: 10,
    yearLevel: "Years 9–10",
    skillId: "npv-p10-confirm-large-scientific",
    skillName: "Express a very large number in scientific notation",
    prompt: "Which expression represents eight billion?",
    options: [
      { id: "8e6", label: "8 × 10⁶" },
      { id: "8e8", label: "8 × 10⁸" },
      { id: "8e9", label: "8 × 10⁹" },
      { id: "8e10", label: "8 × 10¹⁰" },
    ],
    correctOptionIds: ["8e9"],
    misconceptionTags: ["scientific-notation-place-error"],
  }),
  ordering({
    id: "myl-confirm-npv-p10-b-v1",
    p: 10,
    yearLevel: "Years 9–10",
    skillId: "npv-p10-confirm-small-scientific-order",
    skillName: "Compare very small numbers in scientific notation",
    prompt: "Order these positive numbers from smallest to largest.",
    values: [
      { id: "2e-4", label: "2 × 10⁻⁴" },
      { id: "6e-8", label: "6 × 10⁻⁸" },
      { id: "3e-6", label: "3 × 10⁻⁶" },
    ],
    correctOrder: ["6e-8", "3e-6", "2e-4"],
    misconceptionTags: ["negative-exponent-magnitude-error"],
  }),
];

export const NPV_CONFIRMATION_CLUSTERS = {
  1: NPV_CONFIRMATION_P1,
  2: NPV_CONFIRMATION_P2,
  3: NPV_CONFIRMATION_P3,
  4: NPV_CONFIRMATION_P4,
  5: NPV_CONFIRMATION_P5,
  6: NPV_CONFIRMATION_P6,
  7: NPV_CONFIRMATION_P7,
  8: NPV_CONFIRMATION_P8,
  9: NPV_CONFIRMATION_P9,
  10: NPV_CONFIRMATION_P10,
} as const;
