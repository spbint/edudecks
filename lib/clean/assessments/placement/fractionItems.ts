import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

const noneStimulus = { type: "none" as const, data: {} };

function curriculum(code: string, yearLevel: string) {
  return {
    country: "Australia",
    jurisdiction: "QCAA Numeracy general capability",
    yearLevel,
    strand: "Number sense and algebra",
    substrand: "Interpreting fractions",
    code,
  };
}

function short(input: {
  id: string;
  code: string;
  yearLevel: string;
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
    curriculum: curriculum(input.code, input.yearLevel),
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
      tags: ["assessment-lab", "interpreting-fractions", ...input.tags],
    },
  };
}

function choice(input: {
  id: string;
  code: string;
  yearLevel: string;
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
    curriculum: curriculum(input.code, input.yearLevel),
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
      tags: ["assessment-lab", "interpreting-fractions", ...input.tags],
    },
  };
}

function ordering(input: {
  id: string;
  code: string;
  yearLevel: string;
  skillId: string;
  skillName: string;
  prompt: string;
  values: Array<{ id: string; label: string }>;
  correctOrder: string[];
  misconceptionTags?: string[];
  tags: string[];
}): MyLearnaAssessmentItem {
  return {
    id: input.id,
    version: 1,
    status: "draft",
    curriculum: curriculum(input.code, input.yearLevel),
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
        "assessment-lab",
        "interpreting-fractions",
        "direct-ordering",
        ...input.tags,
      ],
    },
  };
}

export const FRACTION_P3_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-fra-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P03",
    yearLevel: "Year 2",
    skillId: "fra-p3-accumulate-parts",
    skillName: "Interpret accumulated fractional parts",
    prompt: "What fraction of the whole bar is shaded?",
    correctValue: "3/4",
    stimulus: {
      type: "fraction-bar",
      data: {
        numerator: 3,
        denominator: 4,
        showLabels: false,
      },
      altText:
        "A bar divided into four equal parts. Three parts are shaded and one part is unshaded.",
    },
    misconceptionTags: ["fraction-part-whole-count-error"],
    tags: ["p3", "anchor", "trusted-deterministic-visual"],
  }),
  choice({
    id: "myl-anchor-fra-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P03",
    yearLevel: "Year 2",
    skillId: "fra-p3-symbolic-part-whole",
    skillName: "Interpret fraction notation using part-whole knowledge",
    prompt: "What does 3/4 mean?",
    options: [
      { id: "three-quarters", label: "Three one-quarter parts" },
      { id: "three-wholes", label: "Three whole objects" },
      { id: "four-thirds", label: "Four one-third parts" },
      { id: "third-quarter", label: "Only the third quarter, not the first two" },
    ],
    correctOptionIds: ["three-quarters"],
    misconceptionTags: ["fraction-symbol-interpretation-error"],
    tags: ["p3", "anchor", "trusted-visual-review"],
  }),
];

export const FRACTION_P6_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-fra-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P06",
    yearLevel: "Years 4–5",
    skillId: "fra-p6-fraction-as-division",
    skillName: "Connect a fraction with division",
    prompt:
      "Two identical chocolate bars are shared equally among 3 people. What fraction of one bar does each person receive altogether?",
    correctValue: "2/3",
    misconceptionTags: ["fraction-division-connection-error"],
    tags: ["p6", "anchor", "direct-digital"],
  }),
  short({
    id: "myl-anchor-fra-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P06",
    yearLevel: "Years 4–5",
    skillId: "fra-p6-number-line-location",
    skillName: "Interpret a fraction location on a number line",
    prompt: "What fraction is marked on the number line?",
    correctValue: "2/3",
    stimulus: {
      type: "number-line",
      data: {
        min: 0,
        max: 1,
        step: 1 / 3,
        marker: 2 / 3,
        hiddenLabels: [1 / 3, 2 / 3],
      },
      altText:
        "Number line from zero to one divided into three equal intervals. A marker is placed on the second interior division.",
    },
    misconceptionTags: ["fraction-number-line-location-error"],
    tags: ["p6", "anchor", "trusted-deterministic-visual"],
  }),
];

export const FRACTION_P9_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-fra-p09-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P09",
    yearLevel: "Years 7–9",
    skillId: "fra-p9-ratio-part-whole",
    skillName: "Interpret a ratio as fractions of the whole",
    prompt:
      "A pattern has black:white pieces in the ratio 2:3. What fraction of all pieces are black?",
    correctValue: "2/5",
    misconceptionTags: ["ratio-to-fraction-whole-error"],
    tags: ["p9", "anchor", "direct-digital"],
  }),
  short({
    id: "myl-anchor-fra-p09-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P09",
    yearLevel: "Years 7–9",
    skillId: "fra-p9-ratio-part-part",
    skillName: "Interpret a part-to-part ratio fractionally",
    prompt:
      "Red:blue counters are in the ratio 3:4. The number of red counters is what fraction of the number of blue counters?",
    correctValue: "3/4",
    misconceptionTags: ["ratio-part-part-fraction-error"],
    tags: ["p9", "anchor", "direct-digital"],
  }),
];

export const FRACTION_P6_RESERVE_ITEM = choice({
  id: "myl-anchor-fra-p06-c-v1",
  code: "MYL-MATH-PROG-NSA-FRA-P06",
  yearLevel: "Years 4–5",
  skillId: "fra-p6-benchmark-decimal",
  skillName: "Connect a benchmark fraction with its decimal equivalent",
  prompt: "Which decimal is equivalent to 1/4?",
  options: [
    { id: "0-25", label: "0.25" },
    { id: "0-4", label: "0.4" },
    { id: "0-14", label: "0.14" },
    { id: "2-5", label: "2.5" },
  ],
  correctOptionIds: ["0-25"],
  misconceptionTags: ["fraction-decimal-equivalence-error"],
  tags: ["p6", "reserve-probe", "direct-digital"],
});

export const FRACTION_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-search-fra-p01-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P01",
    yearLevel: "Year 2",
    skillId: "fra-p1-equal-halves",
    skillName: "Recognise that halves require two equal parts",
    prompt:
      "A sandwich is divided into two pieces. What must be true for each piece to be one-half of the whole sandwich?",
    options: [
      { id: "equal", label: "The two pieces must be equal in size." },
      { id: "different", label: "One piece must be larger than the other." },
      { id: "three", label: "There must be three pieces." },
      { id: "any", label: "Any two pieces are automatically halves." },
    ],
    correctOptionIds: ["equal"],
    misconceptionTags: ["halves-equal-parts-error"],
    tags: ["p1", "search-probe", "hybrid-practical", "routing-only"],
  }),
  choice({
    id: "myl-search-fra-p01-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P01",
    yearLevel: "Year 2",
    skillId: "fra-p1-part-whole",
    skillName: "Identify the part and whole in a half",
    prompt:
      "A paper strip is folded into two equal pieces. One piece is what fraction of the original strip?",
    options: [
      { id: "half", label: "1/2" },
      { id: "third", label: "1/3" },
      { id: "quarter", label: "1/4" },
      { id: "two", label: "2" },
    ],
    correctOptionIds: ["half"],
    misconceptionTags: ["half-part-whole-error"],
    tags: ["p1", "search-probe", "hybrid-practical", "routing-only"],
  }),
];

export const FRACTION_P2_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-search-fra-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P02",
    yearLevel: "Year 2",
    skillId: "fra-p2-repeated-halving",
    skillName: "Create quarters through repeated halving",
    prompt:
      "Eight counters are split into two equal groups, then each group is split in half again. What fraction of the original collection is each final group?",
    correctValue: "1/4",
    misconceptionTags: ["repeated-halving-fraction-error"],
    tags: ["p2", "search-probe", "hybrid-practical", "routing-only"],
  }),
  choice({
    id: "myl-search-fra-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P02",
    yearLevel: "Year 2",
    skillId: "fra-p2-eighth-name",
    skillName: "Name a fractional part created by repeated halving",
    prompt:
      "A whole is divided into 8 equal parts. What is one of those equal parts called?",
    options: [
      { id: "eighth", label: "one-eighth" },
      { id: "quarter", label: "one-quarter" },
      { id: "half", label: "one-half" },
      { id: "eight", label: "eight wholes" },
    ],
    correctOptionIds: ["eighth"],
    misconceptionTags: ["fraction-name-denominator-error"],
    tags: ["p2", "search-probe", "hybrid-practical", "routing-only"],
  }),
];

export const FRACTION_P4_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-boundary-fra-p04-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P04",
    yearLevel: "Year 3",
    skillId: "fra-p4-thirds-equal-sharing",
    skillName: "Create thirds by equal sharing",
    prompt:
      "Twelve strawberries are shared equally among 3 people. What fraction of the collection does each person receive?",
    options: [
      { id: "third", label: "1/3" },
      { id: "quarter", label: "1/4" },
      { id: "half", label: "1/2" },
      { id: "three", label: "3/1" },
    ],
    correctOptionIds: ["third"],
    misconceptionTags: ["thirds-sharing-error"],
    tags: ["p4", "boundary-probe", "trusted-visual-review"],
  }),
  choice({
    id: "myl-boundary-fra-p04-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P04",
    yearLevel: "Year 3",
    skillId: "fra-p4-more-parts-smaller",
    skillName: "Recognise that more equal parts create smaller parts",
    prompt:
      "Two identical cakes are used. One is cut into 3 equal pieces and the other into 6 equal pieces. Which single piece is larger?",
    options: [
      { id: "third", label: "One-third of the first cake" },
      { id: "sixth", label: "One-sixth of the second cake" },
      { id: "same", label: "They are the same size" },
    ],
    correctOptionIds: ["third"],
    misconceptionTags: ["denominator-size-inversion-error"],
    tags: ["p4", "boundary-probe", "trusted-visual-review"],
  }),
  choice({
    id: "myl-boundary-fra-p04-c-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P04",
    yearLevel: "Year 3",
    skillId: "fra-p4-valid-partition",
    skillName: "Identify a valid equal partition",
    prompt: "Which description represents a whole divided into thirds?",
    options: [
      { id: "three-equal", label: "The whole is divided into 3 equal parts." },
      { id: "three-unequal", label: "The whole is divided into 3 unequal parts." },
      { id: "four-equal", label: "The whole is divided into 4 equal parts." },
    ],
    correctOptionIds: ["three-equal"],
    misconceptionTags: ["equal-partition-error"],
    tags: ["p4", "boundary-probe", "trusted-visual-review"],
  }),
];

export const FRACTION_P5_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-boundary-fra-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P05",
    yearLevel: "Years 3–4",
    skillId: "fra-p5-equivalence",
    skillName: "Recognise equivalent fractions",
    prompt: "Which fraction is equivalent to 2/6?",
    options: [
      { id: "one-third", label: "1/3" },
      { id: "one-sixth", label: "1/6" },
      { id: "two-thirds", label: "2/3" },
      { id: "three-sixths", label: "3/6" },
    ],
    correctOptionIds: ["one-third"],
    misconceptionTags: ["fraction-equivalence-error"],
    tags: ["p5", "boundary-probe", "trusted-visual-review"],
  }),
  choice({
    id: "myl-boundary-fra-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P05",
    yearLevel: "Years 3–4",
    skillId: "fra-p5-greater-than-one",
    skillName: "Interpret a fraction greater than one",
    prompt: "Which statement about 4/3 is correct?",
    options: [
      { id: "greater", label: "It is greater than one whole." },
      { id: "less", label: "It is less than one whole." },
      { id: "zero", label: "It is equal to zero." },
      { id: "half", label: "It is exactly one-half." },
    ],
    correctOptionIds: ["greater"],
    misconceptionTags: ["improper-fraction-whole-error"],
    tags: ["p5", "boundary-probe", "trusted-visual-review"],
  }),
  choice({
    id: "myl-boundary-fra-p05-c-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P05",
    yearLevel: "Years 3–4",
    skillId: "fra-p5-unit-fraction-size",
    skillName: "Compare unit fractions of equal wholes",
    prompt:
      "Two identical pizzas are used. Which piece is larger: one-sixth of a pizza or one-eighth of a pizza?",
    options: [
      { id: "sixth", label: "1/6" },
      { id: "eighth", label: "1/8" },
      { id: "same", label: "They are the same size" },
    ],
    correctOptionIds: ["sixth"],
    misconceptionTags: ["unit-fraction-size-error"],
    tags: ["p5", "boundary-probe", "trusted-visual-review"],
  }),
];

export const FRACTION_P7_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-boundary-fra-p07-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P07",
    yearLevel: "Years 5–6",
    skillId: "fra-p7-fdp-equivalence",
    skillName: "Recognise fraction-decimal-percentage equivalence",
    prompt: "Which set shows three equivalent representations?",
    options: [
      { id: "half", label: "1/2 = 0.5 = 50%" },
      { id: "quarter-wrong", label: "1/4 = 0.4 = 40%" },
      { id: "three-quarter-wrong", label: "3/4 = 0.3 = 30%" },
      { id: "tenth-wrong", label: "1/10 = 0.01 = 1%" },
    ],
    correctOptionIds: ["half"],
    misconceptionTags: ["fraction-decimal-percent-equivalence-error"],
    tags: ["p7", "boundary-probe", "direct-digital"],
  }),
  ordering({
    id: "myl-boundary-fra-p07-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P07",
    yearLevel: "Years 5–6",
    skillId: "fra-p7-order-fractions",
    skillName: "Compare and order fractions by relative size",
    prompt: "Order these fractions from smallest to largest.",
    values: [
      { id: "three-fifths", label: "3/5" },
      { id: "four-ninths", label: "4/9" },
      { id: "one-half", label: "1/2" },
    ],
    correctOrder: ["four-ninths", "one-half", "three-fifths"],
    misconceptionTags: ["fraction-ordering-error"],
    tags: ["p7", "boundary-probe", "direct-digital"],
  }),
  choice({
    id: "myl-boundary-fra-p07-c-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P07",
    yearLevel: "Years 5–6",
    skillId: "fra-p7-compare-unlike",
    skillName: "Compare fractions with unlike denominators",
    prompt: "Which fraction is greater?",
    options: [
      { id: "two-thirds", label: "2/3" },
      { id: "three-quarters", label: "3/4" },
      { id: "equal", label: "They are equal" },
    ],
    correctOptionIds: ["three-quarters"],
    misconceptionTags: ["unlike-denominator-comparison-error"],
    tags: ["p7", "boundary-probe", "direct-digital"],
  }),
];

export const FRACTION_P8_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-boundary-fra-p08-a-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P08",
    yearLevel: "Years 5–7",
    skillId: "fra-p8-add-same-denominator",
    skillName: "Add fractions with the same denominator",
    prompt: "Calculate 3/8 + 2/8.",
    correctValue: "5/8",
    misconceptionTags: ["same-denominator-addition-error"],
    tags: ["p8", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-fra-p08-b-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P08",
    yearLevel: "Years 5–7",
    skillId: "fra-p8-fraction-of-quantity",
    skillName: "Calculate a fraction of a quantity",
    prompt: "What is 2/3 of 18?",
    correctValue: "12",
    misconceptionTags: ["fraction-of-quantity-error"],
    tags: ["p8", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-fra-p08-c-v1",
    code: "MYL-MATH-PROG-NSA-FRA-P08",
    yearLevel: "Years 5–7",
    skillId: "fra-p8-divide-by-fraction",
    skillName: "Interpret division by a fraction",
    prompt: "How many one-quarter pieces are contained in one-half?",
    correctValue: "2",
    misconceptionTags: ["divide-by-fraction-meaning-error"],
    tags: ["p8", "boundary-probe", "direct-digital"],
  }),
];

export const FRACTION_EXECUTABLE_ANCHORS = {
  "interpreting-fractions-p3": FRACTION_P3_ANCHOR_ITEMS,
  "interpreting-fractions-p6": FRACTION_P6_ANCHOR_ITEMS,
  "interpreting-fractions-p9": FRACTION_P9_ANCHOR_ITEMS,
} as const;

export const FRACTION_SEARCH_CLUSTERS = {
  "interpreting-fractions-p1": FRACTION_P1_SEARCH_ITEMS,
  "interpreting-fractions-p2": FRACTION_P2_SEARCH_ITEMS,
} as const;

export const FRACTION_BOUNDARY_CLUSTERS = {
  "interpreting-fractions-p4": FRACTION_P4_BOUNDARY_ITEMS,
  "interpreting-fractions-p5": FRACTION_P5_BOUNDARY_ITEMS,
  "interpreting-fractions-p7": FRACTION_P7_BOUNDARY_ITEMS,
  "interpreting-fractions-p8": FRACTION_P8_BOUNDARY_ITEMS,
} as const;
