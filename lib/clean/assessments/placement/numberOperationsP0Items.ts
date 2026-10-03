import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

/**
 * Executable P0 anchor items that have been authored directly in the new canonical model.
 *
 * These remain Assessment Lab only. They are not calibrated placement items and do not
 * enable customer assessments.
 */
export const COUNTING_P5_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  {
    id: "myl-anchor-cnt-p05-a-v1",
    version: 1,
    status: "draft",
    curriculum: {
      country: "Australia",
      jurisdiction: "QCAA Numeracy general capability",
      yearLevel: "Year 1",
      strand: "Number sense and algebra",
      substrand: "Counting processes",
      code: "MYL-MATH-PROG-NSA-CNT-P05",
    },
    skill: {
      id: "counting-processes-p5-next-previous",
      name: "Determine the next or previous number within 1–100",
      description:
        "Samples the P5 counting-sequence indicator without supplying a number track.",
    },
    misconceptionTags: [
      "count-sequence-boundary-error",
      "restarts-count-from-one",
    ],
    difficulty: 2,
    template: "short-answer",
    prompt: "What number comes immediately before 63?",
    stimulus: {
      type: "none",
      data: {},
    },
    response: {
      type: "short-answer",
      correctValue: "62",
      acceptableValues: ["62"],
    },
    feedback: {
      correct: "Correct. 62 comes immediately before 63.",
      incorrect: "Not quite. Think about the number immediately before 63.",
      hint: "Count back by one from 63.",
    },
    analytics: {
      estimatedTimeSeconds: 20,
      tags: [
        "assessment-lab",
        "p0-anchor",
        "counting-processes",
        "p5",
        "cnt-p05-a",
      ],
    },
  },
  {
    id: "myl-anchor-cnt-p05-b-v1",
    version: 1,
    status: "draft",
    curriculum: {
      country: "Australia",
      jurisdiction: "QCAA Numeracy general capability",
      yearLevel: "Year 1",
      strand: "Number sense and algebra",
      substrand: "Counting processes",
      code: "MYL-MATH-PROG-NSA-CNT-P05",
    },
    skill: {
      id: "counting-processes-p5-collection",
      name: "Match a collection up to 20 to its numeral",
      description:
        "Samples the P5 collection-to-numeral indicator using a deterministic visual collection.",
    },
    misconceptionTags: [
      "one-to-one-counting-error",
      "collection-numeral-mismatch",
    ],
    difficulty: 2,
    template: "short-answer",
    prompt: "How many counters are shown?",
    stimulus: {
      type: "array",
      data: {
        rows: 2,
        columns: 7,
        itemShape: "circle",
      },
      altText:
        "A rectangular arrangement of identical counters. The quantity is intentionally not stated because counting the collection is the task.",
    },
    response: {
      type: "short-answer",
      correctValue: "14",
      acceptableValues: ["14"],
    },
    feedback: {
      correct: "Correct. The collection contains 14 counters.",
      incorrect: "Not quite. Count each counter exactly once.",
      hint: "Keep track of each row as you count.",
    },
    analytics: {
      estimatedTimeSeconds: 35,
      tags: [
        "assessment-lab",
        "p0-anchor",
        "counting-processes",
        "p5",
        "cnt-p05-b",
        "visual-counting-separate-accessible-form-required",
      ],
    },
  },
];

export const NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS = {
  "counting-processes-p5": COUNTING_P5_ANCHOR_ITEMS,
} as const;
