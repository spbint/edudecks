import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

const noneStimulus = { type: "none" as const, data: {} };

function curriculum(code: string, yearLevel: string) {
  return {
    country: "Australia",
    jurisdiction: "QCAA Numeracy general capability",
    yearLevel,
    strand: "Number sense and algebra",
    substrand: "Proportional thinking",
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
    stimulus: noneStimulus,
    response: {
      type: "short-answer",
      correctValue: input.correctValue,
      acceptableValues: input.acceptableValues || [input.correctValue],
    },
    feedback: { correct: "Correct.", incorrect: "Not quite." },
    analytics: {
      tags: ["assessment-lab", "proportional-thinking", ...input.tags],
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
    stimulus: noneStimulus,
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
      tags: ["assessment-lab", "proportional-thinking", ...input.tags],
    },
  };
}

export const PROPORTIONAL_P2_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-pro-p02-a-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P02",
    yearLevel: "Years 5–7",
    skillId: "pro-p2-percentage-of-quantity",
    skillName: "Calculate a percentage of a quantity",
    prompt: "What is 75% of 160?",
    correctValue: "120",
    misconceptionTags: ["percentage-of-quantity-error"],
    tags: ["p2", "anchor", "direct-digital"],
  }),
  short({
    id: "myl-anchor-pro-p02-b-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P02",
    yearLevel: "Years 5–7",
    skillId: "pro-p2-quantity-as-percentage",
    skillName: "Express one quantity as a percentage of another",
    prompt: "7 is what percentage of 35?",
    correctValue: "20",
    acceptableValues: ["20", "20%"],
    misconceptionTags: ["quantity-as-percentage-error"],
    tags: ["p2", "anchor", "direct-digital"],
  }),
];

export const PROPORTIONAL_P4_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-pro-p04-a-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P04",
    yearLevel: "Years 7–8",
    skillId: "pro-p4-scale-ratio",
    skillName: "Scale quantities while preserving a ratio",
    prompt:
      "A cordial mixture uses 1 part concentrate to 6 parts water. If 4 litres of concentrate are used, how many litres of water are needed?",
    correctValue: "24",
    acceptableValues: ["24", "24 L", "24 litres", "24 liters"],
    misconceptionTags: ["ratio-scale-factor-error"],
    tags: ["p4", "anchor", "direct-digital"],
  }),
  short({
    id: "myl-anchor-pro-p04-b-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P04",
    yearLevel: "Years 7–8",
    skillId: "pro-p4-rate-distance",
    skillName: "Use a rate to determine a changed quantity",
    prompt:
      "A vehicle travels at a constant 60 km/h. How far does it travel in 30 minutes?",
    correctValue: "30",
    acceptableValues: ["30", "30 km"],
    misconceptionTags: ["rate-time-conversion-error"],
    tags: ["p4", "anchor", "direct-digital"],
  }),
];

export const PROPORTIONAL_P6_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-pro-p06-a-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P06",
    yearLevel: "Years 9–10",
    skillId: "pro-p6-percentage-multiplier",
    skillName: "Apply a percentage increase using a multiplier",
    prompt:
      "A value of $240 increases by 5%. What is the new value?",
    correctValue: "252",
    acceptableValues: ["252", "$252", "252.00", "$252.00"],
    misconceptionTags: ["percentage-increase-multiplier-error"],
    tags: ["p6", "anchor", "direct-digital"],
  }),
  choice({
    id: "myl-anchor-pro-p06-b-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P06",
    yearLevel: "Years 9–10",
    skillId: "pro-p6-inverse-proportion",
    skillName: "Identify an inverse proportional relationship",
    prompt:
      "For the same fixed journey distance, which relationship is approximately inverse proportional?",
    options: [
      {
        id: "speed-time",
        label: "Travel speed and travel time",
      },
      {
        id: "hours-pay",
        label: "Hours worked and pay at a fixed hourly rate",
      },
      {
        id: "mass-force",
        label: "Mass and force at fixed acceleration",
      },
      {
        id: "copies-paper",
        label: "Number of copies and paper used",
      },
    ],
    correctOptionIds: ["speed-time"],
    misconceptionTags: ["direct-vs-inverse-proportion-error"],
    tags: ["p6", "anchor", "direct-digital"],
  }),
];

export const PROPORTIONAL_P4_RESERVE_ITEM = choice({
  id: "myl-anchor-pro-p04-c-v1",
  code: "MYL-MATH-PROG-NSA-PRO-P04",
  yearLevel: "Years 7–8",
  skillId: "pro-p4-ratio-maintenance",
  skillName: "Recognise equivalent ratios",
  prompt: "Which ratio is equivalent to 2:5?",
  options: [
    { id: "4-10", label: "4:10" },
    { id: "4-7", label: "4:7" },
    { id: "6-10", label: "6:10" },
    { id: "2-10", label: "2:10" },
  ],
  correctOptionIds: ["4-10"],
  misconceptionTags: ["equivalent-ratio-error"],
  tags: ["p4", "reserve-probe", "direct-digital"],
});

export const PROPORTIONAL_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-search-pro-p01-a-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P01",
    yearLevel: "Year 5",
    skillId: "pro-p1-percent-as-hundred",
    skillName: "Interpret percentage as a relationship to 100",
    prompt: "What does 25% mean?",
    options: [
      { id: "25-of-100", label: "25 out of every 100" },
      { id: "25-of-10", label: "25 out of every 10" },
      { id: "25-wholes", label: "25 whole groups" },
      { id: "one-quarter-percent", label: "One-quarter of one percent" },
    ],
    correctOptionIds: ["25-of-100"],
    misconceptionTags: ["percent-hundred-meaning-error"],
    tags: ["p1", "search-probe", "trusted-visual-review"],
  }),
  short({
    id: "myl-search-pro-p01-b-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P01",
    yearLevel: "Year 5",
    skillId: "pro-p1-complementary-percent",
    skillName: "Use complementary percentages to make a whole",
    prompt:
      "10% of the counters in a jar are black. What percentage are not black?",
    correctValue: "90",
    acceptableValues: ["90", "90%"],
    misconceptionTags: ["complementary-percentage-error"],
    tags: ["p1", "search-probe", "direct-digital"],
  }),
];

export const PROPORTIONAL_P3_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-boundary-pro-p03-a-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P03",
    yearLevel: "Year 7",
    skillId: "pro-p3-ratio-part-part",
    skillName: "Interpret a ratio as a part-to-part comparison",
    prompt:
      "A mixture contains red:blue counters in the ratio 1:4. What does this mean?",
    options: [
      { id: "one-for-four", label: "For every 1 red counter there are 4 blue counters." },
      { id: "one-total-four", label: "There is 1 counter in total and 4 colours." },
      { id: "four-red-one-blue", label: "For every 4 red counters there is 1 blue counter." },
      { id: "one-quarter-blue", label: "One-quarter of the blue counters are red." },
    ],
    correctOptionIds: ["one-for-four"],
    misconceptionTags: ["ratio-direction-error"],
    tags: ["p3", "boundary-probe", "direct-digital"],
  }),
  choice({
    id: "myl-boundary-pro-p03-b-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P03",
    yearLevel: "Year 7",
    skillId: "pro-p3-rate-meaning",
    skillName: "Interpret a rate as a comparison of unlike quantities",
    prompt: "Which example is a rate?",
    options: [
      { id: "litres-second", label: "5 litres per second" },
      { id: "red-blue", label: "3 red counters to 4 blue counters" },
      { id: "half", label: "1/2 of a whole" },
      { id: "percent", label: "25%" },
    ],
    correctOptionIds: ["litres-second"],
    misconceptionTags: ["ratio-vs-rate-error"],
    tags: ["p3", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-pro-p03-c-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P03",
    yearLevel: "Year 7",
    skillId: "pro-p3-ratio-as-fraction",
    skillName: "Express a part-to-part ratio as a part-of-whole fraction",
    prompt:
      "Rainy:fine days are in the ratio 1:2. What fraction of all the days are rainy?",
    correctValue: "1/3",
    misconceptionTags: ["ratio-to-whole-fraction-error"],
    tags: ["p3", "boundary-probe", "direct-digital"],
  }),
];

export const PROPORTIONAL_P5_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-boundary-pro-p05-a-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P05",
    yearLevel: "Year 8",
    skillId: "pro-p5-find-whole",
    skillName: "Determine the whole from a known percentage",
    prompt: "20% of a quantity is 13. What is the whole quantity?",
    correctValue: "65",
    misconceptionTags: ["percentage-known-part-find-whole-error"],
    tags: ["p5", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-pro-p05-b-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P05",
    yearLevel: "Year 8",
    skillId: "pro-p5-unit-rate",
    skillName: "Use a common unit rate to compare value",
    prompt:
      "Brand A costs $6 for 750 g. Brand B costs $7.50 for 1 kg. Which brand has the lower cost per 100 g? Enter A or B.",
    correctValue: "B",
    acceptableValues: ["B", "b", "Brand B", "brand b"],
    misconceptionTags: ["unit-rate-best-buy-error"],
    tags: ["p5", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-pro-p05-c-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P05",
    yearLevel: "Year 8",
    skillId: "pro-p5-aspect-ratio",
    skillName: "Preserve an aspect ratio when resizing",
    prompt:
      "An image has aspect ratio 3:2. If its width is 600 pixels, what height preserves the ratio?",
    correctValue: "400",
    acceptableValues: ["400", "400 px", "400 pixels"],
    misconceptionTags: ["aspect-ratio-scale-error"],
    tags: ["p5", "boundary-probe", "direct-digital"],
  }),
];

export const PROPORTIONAL_P7_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-search-pro-p07-a-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P07",
    yearLevel: "Years 9–10",
    skillId: "pro-p7-successive-increase",
    skillName: "Use repeated percentage multipliers",
    prompt:
      "A quantity of 100 increases by 3% twice in succession. What is the final quantity?",
    correctValue: "106.09",
    acceptableValues: ["106.09"],
    misconceptionTags: ["successive-percentage-change-error"],
    tags: ["p7", "search-probe", "direct-digital"],
  }),
  short({
    id: "myl-search-pro-p07-b-v1",
    code: "MYL-MATH-PROG-NSA-PRO-P07",
    yearLevel: "Years 9–10",
    skillId: "pro-p7-successive-discount",
    skillName: "Calculate a percentage of a percentage using multipliers",
    prompt:
      "An item costs $200. It is discounted by 20% and then the discounted price is reduced by another 10%. What is the final price?",
    correctValue: "144",
    acceptableValues: ["144", "$144", "144.00", "$144.00"],
    misconceptionTags: ["successive-discount-error"],
    tags: ["p7", "search-probe", "direct-digital"],
  }),
];

export const PROPORTIONAL_EXECUTABLE_ANCHORS = {
  "proportional-thinking-p2": PROPORTIONAL_P2_ANCHOR_ITEMS,
  "proportional-thinking-p4": PROPORTIONAL_P4_ANCHOR_ITEMS,
  "proportional-thinking-p6": PROPORTIONAL_P6_ANCHOR_ITEMS,
} as const;

export const PROPORTIONAL_SEARCH_CLUSTERS = {
  "proportional-thinking-p1": PROPORTIONAL_P1_SEARCH_ITEMS,
  "proportional-thinking-p7": PROPORTIONAL_P7_SEARCH_ITEMS,
} as const;

export const PROPORTIONAL_BOUNDARY_CLUSTERS = {
  "proportional-thinking-p3": PROPORTIONAL_P3_BOUNDARY_ITEMS,
  "proportional-thinking-p5": PROPORTIONAL_P5_BOUNDARY_ITEMS,
} as const;
