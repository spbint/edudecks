import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

export const MYLEARNA_ASSESS_DEMO_ITEMS: MyLearnaAssessmentItem[] = [
  {
    id: "npv-subitise-001",
    version: 1,
    status: "draft",
    curriculum: {
      country: "Australia",
      jurisdiction: "ACARA",
      yearLevel: "Foundation",
      strand: "Number",
      substrand: "Number and Place Value",
    },
    skill: {
      id: "subitise-small-collections",
      name: "Recognise small collections without counting",
      description: "Identify a small quantity from a visual arrangement.",
    },
    misconceptionTags: ["counts-one-by-one", "confuses-scattered-arrangements"],
    difficulty: 1,
    template: "counter-card-choice",
    prompt: "Which number matches the counters?",
    stimulus: {
      type: "counter-set",
      data: {
        quantity: 4,
        arrangement: "scattered",
        seed: 1204,
      },
      altText: "Four counters shown in a scattered arrangement.",
    },
    response: {
      type: "single-choice",
      options: [
        {
          id: "a",
          label: "3",
          value: 3,
          feedback: "Count carefully. There are four counters.",
        },
        {
          id: "b",
          label: "4",
          value: 4,
          feedback: "Correct. There are four counters.",
        },
        {
          id: "c",
          label: "5",
          value: 5,
          feedback: "There are fewer than five counters.",
        },
      ],
      correctOptionIds: ["b"],
    },
    feedback: {
      correct: "Correct. You recognised the group of four.",
      incorrect: "Not quite. Look at the counters again and match the total.",
      hint: "Try touching each counter with your eyes as you count.",
    },
    analytics: {
      estimatedTimeSeconds: 30,
      tags: ["foundation", "number", "subitising", "counter-card-choice"],
    },
  },
  {
    id: "npv-subitise-002",
    version: 1,
    status: "draft",
    curriculum: {
      country: "Australia",
      jurisdiction: "ACARA",
      yearLevel: "Foundation",
      strand: "Number",
      substrand: "Number and Place Value",
    },
    skill: {
      id: "subitise-small-collections",
      name: "Recognise small collections without counting",
      description: "Identify a small quantity from a visual arrangement.",
    },
    misconceptionTags: ["confuses-organised-arrangements"],
    difficulty: 1,
    template: "counter-card-choice",
    prompt: "How many counters are shown?",
    stimulus: {
      type: "counter-set",
      data: {
        quantity: 5,
        arrangement: "five-frame",
        seed: 1205,
      },
      altText: "Five counters shown in a clear five-frame arrangement.",
    },
    response: {
      type: "single-choice",
      options: [
        { id: "a", label: "4", value: 4, feedback: "There is one more counter than four." },
        { id: "b", label: "6", value: 6, feedback: "There are fewer than six counters." },
        { id: "c", label: "5", value: 5, feedback: "Correct. The full row shows five." },
      ],
      correctOptionIds: ["c"],
    },
    feedback: {
      correct: "Correct. You recognised the full group of five.",
      incorrect: "Not quite. Look again at the full row of counters.",
      hint: "A full five-frame row has five spaces.",
    },
    analytics: {
      estimatedTimeSeconds: 25,
      tags: ["foundation", "number", "subitising", "five-frame"],
    },
  },
];
