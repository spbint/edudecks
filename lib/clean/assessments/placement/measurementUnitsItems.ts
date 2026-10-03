import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";

const noneStimulus = { type: "none" as const, data: {} };

function curriculum(code: string, yearLevel: string) {
  return {
    country: "Australia",
    jurisdiction: "QCAA Numeracy general capability",
    yearLevel,
    strand: "Measurement and geometry",
    substrand: "Understanding units of measurement",
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
      tags: ["assessment-lab", "measurement-units", ...input.tags],
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
      tags: ["assessment-lab", "measurement-units", ...input.tags],
    },
  };
}

export const MEASUREMENT_UNITS_P3_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-anchor-uom-p03-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P03",
    yearLevel: "Prep–Year 2",
    skillId: "uom-p3-select-informal-unit",
    skillName: "Select an appropriate informal unit",
    prompt: "Which method is best for measuring the length of a book with informal units?",
    options: [
      {
        id: "paperclips",
        label: "Use identical paper clips end to end with no gaps or overlaps.",
      },
      {
        id: "cups",
        label: "Fill cups with water and count the cups.",
      },
      {
        id: "mixed",
        label: "Use a pencil, a coin and a block because they are different sizes.",
      },
      {
        id: "gaps",
        label: "Place paper clips along the book but leave spaces between them.",
      },
    ],
    correctOptionIds: ["paperclips"],
    misconceptionTags: [
      "informal-unit-attribute-mismatch",
      "non-uniform-unit-error",
    ],
    tags: ["p3", "hybrid-practical", "routing-only"],
  }),
  choice({
    id: "myl-anchor-uom-p03-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P03",
    yearLevel: "Prep–Year 2",
    skillId: "uom-p3-no-gaps-overlaps",
    skillName: "Recognise gaps and overlaps as measurement errors",
    prompt: "Why is a length measurement unreliable if equal blocks are placed with gaps between them?",
    options: [
      {
        id: "gaps-not-measured",
        label: "The gaps are part of the length but are not being measured.",
      },
      {
        id: "too-many-blocks",
        label: "Equal blocks always make the answer too large.",
      },
      {
        id: "need-different-blocks",
        label: "The blocks should all be different sizes.",
      },
      {
        id: "must-start-middle",
        label: "Measurement should always start from the middle.",
      },
    ],
    correctOptionIds: ["gaps-not-measured"],
    misconceptionTags: ["measurement-gap-overlap-error"],
    tags: ["p3", "hybrid-practical", "routing-only"],
  }),
];

export const MEASUREMENT_UNITS_P6_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-uom-p06-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P06",
    yearLevel: "Years 3–5",
    skillId: "uom-p6-scale-calibration",
    skillName: "Interpret equal intervals on a metric scale",
    prompt: "What mass does the pointer show, in kilograms?",
    correctValue: "2.25",
    acceptableValues: ["2.25", "2.25 kg"],
    stimulus: {
      type: "graduated-scale",
      data: {
        min: 2,
        max: 3,
        majorStep: 1,
        subdivisions: 4,
        marker: 2.25,
        unit: "kg",
        orientation: "horizontal",
      },
    },
    misconceptionTags: ["scaled-instrument-interval-error"],
    tags: ["p6", "scale-interpretation", "trusted-deterministic-visual"],
  }),
  short({
    id: "myl-anchor-uom-p06-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P06",
    yearLevel: "Years 3–5",
    skillId: "uom-p6-square-unit-area",
    skillName: "Determine area from square metric units",
    prompt:
      "Each square represents 1 square centimetre. What is the area of the rectangle shown?",
    correctValue: "24",
    acceptableValues: ["24", "24 cm2", "24 cm²"],
    stimulus: {
      type: "array",
      data: {
        rows: 4,
        columns: 6,
        itemShape: "square",
        showGrouping: true,
      },
      altText:
        "A rectangle made from 4 rows and 6 columns of equal square units. Each square represents one square centimetre.",
    },
    misconceptionTags: ["area-square-unit-count-error"],
    tags: ["p6", "metric-area", "trusted-deterministic-visual"],
  }),
];

export const MEASUREMENT_UNITS_P9_ANCHOR_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-anchor-uom-p09-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P09",
    yearLevel: "Years 7–9",
    skillId: "uom-p9-trapezium-area",
    skillName: "Calculate the area of a trapezium",
    prompt:
      "A trapezium has parallel sides of 8 cm and 14 cm and a perpendicular height of 5 cm. What is its area in square centimetres?",
    correctValue: "55",
    acceptableValues: ["55", "55 cm2", "55 cm²"],
    misconceptionTags: ["trapezium-area-formula-error"],
    tags: ["p9", "formula-area"],
  }),
  short({
    id: "myl-anchor-uom-p09-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P09",
    yearLevel: "Years 7–9",
    skillId: "uom-p9-right-prism-volume",
    skillName: "Calculate the volume of a right rectangular prism",
    prompt:
      "A rectangular prism measures 4 cm by 3 cm by 6 cm. What is its volume in cubic centimetres?",
    correctValue: "72",
    acceptableValues: ["72", "72 cm3", "72 cm³"],
    misconceptionTags: ["prism-volume-formula-error"],
    tags: ["p9", "formula-volume"],
  }),
];

export const MEASUREMENT_UNITS_P6_RESERVE_ITEM = choice({
  id: "myl-anchor-uom-p06-c-v1",
  code: "MYL-MATH-PROG-MG-UOM-P06",
  yearLevel: "Years 3–5",
  skillId: "uom-p6-right-angle-comparison",
  skillName: "Compare an angle with a right angle",
  prompt: "A 70° angle is how large compared with a right angle?",
  options: [
    { id: "less", label: "Less than a right angle" },
    { id: "equal", label: "Equal to a right angle" },
    { id: "greater", label: "Greater than a right angle" },
  ],
  correctOptionIds: ["less"],
  misconceptionTags: ["right-angle-comparison-error"],
  tags: ["p6", "reserve-probe"],
});

export const MEASUREMENT_UNITS_EXECUTABLE_ANCHORS = {
  "understanding-units-measurement-p3": MEASUREMENT_UNITS_P3_ANCHOR_ITEMS,
  "understanding-units-measurement-p6": MEASUREMENT_UNITS_P6_ANCHOR_ITEMS,
  "understanding-units-measurement-p9": MEASUREMENT_UNITS_P9_ANCHOR_ITEMS,
} as const;
