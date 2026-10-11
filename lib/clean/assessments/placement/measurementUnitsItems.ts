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


export const MEASUREMENT_UNITS_P1_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-search-uom-p01-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P01",
    yearLevel: "Prep",
    skillId: "uom-p1-measurable-attribute-language",
    skillName: "Recognise everyday language for a measurable attribute",
    prompt: "A learner says, ‘My tower is tall.’ Which attribute are they describing?",
    options: [
      { id: "height", label: "Height" },
      { id: "colour", label: "Colour" },
      { id: "shape-name", label: "Shape name" },
      { id: "pattern", label: "Pattern" },
    ],
    correctOptionIds: ["height"],
    misconceptionTags: ["measurable-attribute-language-gap"],
    tags: ["p1", "search-probe", "hybrid-practical", "routing-only"],
  }),
  choice({
    id: "myl-search-uom-p01-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P01",
    yearLevel: "Prep",
    skillId: "uom-p1-size-comparison-language",
    skillName: "Use everyday size language",
    prompt: "Which sentence describes the size of an object?",
    options: [
      { id: "heavy", label: "This box is heavy." },
      { id: "red", label: "This box is red." },
      { id: "striped", label: "This box is striped." },
      { id: "square", label: "This box has a square face." },
    ],
    correctOptionIds: ["heavy"],
    misconceptionTags: ["measurable-attribute-language-gap"],
    tags: ["p1", "search-probe", "hybrid-practical", "routing-only"],
  }),
];

export const MEASUREMENT_UNITS_P2_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-search-uom-p02-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P02",
    yearLevel: "Prep–Year 2",
    skillId: "uom-p2-direct-length-comparison",
    skillName: "Interpret a direct length comparison",
    prompt:
      "Two ribbons start at the same line. Ribbon A reaches farther than Ribbon B. Which ribbon is longer?",
    options: [
      { id: "a", label: "Ribbon A" },
      { id: "b", label: "Ribbon B" },
      { id: "same", label: "They must be the same length" },
    ],
    correctOptionIds: ["a"],
    misconceptionTags: ["direct-comparison-error"],
    tags: ["p2", "search-probe", "hybrid-practical", "routing-only"],
  }),
  choice({
    id: "myl-search-uom-p02-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P02",
    yearLevel: "Prep–Year 2",
    skillId: "uom-p2-order-height",
    skillName: "Reason from pairwise height comparisons",
    prompt:
      "Asha is taller than Ben. Ben is taller than Kai. Who is shortest?",
    options: [
      { id: "asha", label: "Asha" },
      { id: "ben", label: "Ben" },
      { id: "kai", label: "Kai" },
    ],
    correctOptionIds: ["kai"],
    misconceptionTags: ["measurement-order-comparison-error"],
    tags: ["p2", "search-probe", "hybrid-practical", "routing-only"],
  }),
];

export const MEASUREMENT_UNITS_P4_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-boundary-uom-p04-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P04",
    yearLevel: "Years 1–3",
    skillId: "uom-p4-repeat-single-unit",
    skillName: "Use one informal unit repeatedly",
    prompt:
      "You have one paper clip to measure a line. Which method gives a sensible measurement?",
    options: [
      {
        id: "repeat-mark",
        label:
          "Place the paper clip at the start, mark its end, move it to the mark, and repeat with no gaps.",
      },
      {
        id: "one-only",
        label: "Place the paper clip once and call the line one paper clip long.",
      },
      {
        id: "random",
        label: "Place the paper clip at different random places along the line.",
      },
      {
        id: "overlap",
        label: "Move the paper clip forward but overlap half of it each time.",
      },
    ],
    correctOptionIds: ["repeat-mark"],
    misconceptionTags: ["repeated-unit-measurement-error"],
    tags: ["p4", "boundary-probe", "hybrid-practical", "routing-only"],
  }),
  choice({
    id: "myl-boundary-uom-p04-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P04",
    yearLevel: "Years 1–3",
    skillId: "uom-p4-turn-description",
    skillName: "Describe the direction and amount of a turn",
    prompt: "Which instruction describes a quarter turn to the right?",
    options: [
      { id: "quarter-right", label: "Turn 90° clockwise." },
      { id: "half-right", label: "Turn 180° clockwise." },
      { id: "full", label: "Turn 360°." },
      { id: "quarter-left", label: "Turn 90° anticlockwise." },
    ],
    correctOptionIds: ["quarter-right"],
    misconceptionTags: ["turn-amount-direction-error"],
    tags: ["p4", "boundary-probe", "hybrid-practical", "routing-only"],
  }),
  choice({
    id: "myl-boundary-uom-p04-c-v1",
    code: "MYL-MATH-PROG-MG-UOM-P04",
    yearLevel: "Years 1–3",
    skillId: "uom-p4-estimate-check",
    skillName: "Check an informal measurement estimate",
    prompt:
      "You estimate a desk is about 6 handspans long. What is the best way to check?",
    options: [
      {
        id: "measure-handspans",
        label: "Measure it with the same handspan unit and count the units.",
      },
      {
        id: "guess-again",
        label: "Make a second guess without measuring.",
      },
      {
        id: "different-units",
        label: "Use different-sized objects for each part of the desk.",
      },
    ],
    correctOptionIds: ["measure-handspans"],
    misconceptionTags: ["estimate-check-error"],
    tags: ["p4", "boundary-probe", "hybrid-practical", "routing-only"],
  }),
];

export const MEASUREMENT_UNITS_P5_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  choice({
    id: "myl-boundary-uom-p05-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P05",
    yearLevel: "Year 3",
    skillId: "uom-p5-select-metric-unit",
    skillName: "Choose an appropriate metric unit",
    prompt: "Which metric unit is most appropriate for the length of a classroom?",
    options: [
      { id: "m", label: "metres (m)" },
      { id: "ml", label: "millilitres (mL)" },
      { id: "kg", label: "kilograms (kg)" },
      { id: "c", label: "degrees Celsius (°C)" },
    ],
    correctOptionIds: ["m"],
    misconceptionTags: ["metric-unit-attribute-mismatch"],
    tags: ["p5", "boundary-probe", "trusted-visual-review"],
  }),
  short({
    id: "myl-boundary-uom-p05-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P05",
    yearLevel: "Year 3",
    skillId: "uom-p5-array-area",
    skillName: "Use array structure to calculate area",
    prompt:
      "Each square is one square unit. What is the area of the rectangle shown?",
    correctValue: "35",
    stimulus: {
      type: "array",
      data: {
        rows: 5,
        columns: 7,
        itemShape: "square",
        showGrouping: true,
      },
      altText:
        "A rectangle made from 5 rows and 7 columns of equal square units. The number of square units is the quantity to determine.",
    },
    misconceptionTags: ["array-area-structure-error"],
    tags: ["p5", "boundary-probe", "trusted-deterministic-visual"],
  }),
  choice({
    id: "myl-boundary-uom-p05-c-v1",
    code: "MYL-MATH-PROG-MG-UOM-P05",
    yearLevel: "Year 3",
    skillId: "uom-p5-angle-as-turn",
    skillName: "Connect a quarter turn with a right angle",
    prompt: "A quarter turn makes which familiar angle?",
    options: [
      { id: "right", label: "A right angle" },
      { id: "straight", label: "A straight angle" },
      { id: "full", label: "A full revolution" },
      { id: "zero", label: "No angle" },
    ],
    correctOptionIds: ["right"],
    misconceptionTags: ["turn-angle-connection-error"],
    tags: ["p5", "boundary-probe", "trusted-visual-review"],
  }),
];

export const MEASUREMENT_UNITS_P7_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-boundary-uom-p07-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P07",
    yearLevel: "Year 5",
    skillId: "uom-p7-perimeter-unknown-side",
    skillName: "Calculate perimeter from side lengths",
    prompt:
      "A rectangle is 8 cm long and 5 cm wide. What is its perimeter in centimetres?",
    correctValue: "26",
    acceptableValues: ["26", "26 cm"],
    misconceptionTags: ["perimeter-area-confusion"],
    tags: ["p7", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-uom-p07-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P07",
    yearLevel: "Year 5",
    skillId: "uom-p7-rectangle-area",
    skillName: "Calculate area using metric units",
    prompt:
      "A rectangle measures 9 cm by 4 cm. What is its area in square centimetres?",
    correctValue: "36",
    acceptableValues: ["36", "36 cm2", "36 cm²"],
    misconceptionTags: ["rectangle-area-error"],
    tags: ["p7", "boundary-probe", "direct-digital"],
  }),
  choice({
    id: "myl-boundary-uom-p07-c-v1",
    code: "MYL-MATH-PROG-MG-UOM-P07",
    yearLevel: "Year 5",
    skillId: "uom-p7-angle-degrees",
    skillName: "Interpret angle size in degrees",
    prompt: "Which angle is obtuse?",
    options: [
      { id: "45", label: "45°" },
      { id: "90", label: "90°" },
      { id: "120", label: "120°" },
      { id: "180", label: "180°" },
    ],
    correctOptionIds: ["120"],
    misconceptionTags: ["angle-classification-error"],
    tags: ["p7", "boundary-probe", "direct-digital"],
  }),
];

export const MEASUREMENT_UNITS_P8_BOUNDARY_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-boundary-uom-p08-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P08",
    yearLevel: "Years 6–7",
    skillId: "uom-p8-metric-conversion",
    skillName: "Convert between adjacent metric units",
    prompt: "Convert 3.4 metres to centimetres.",
    correctValue: "340",
    acceptableValues: ["340", "340 cm"],
    misconceptionTags: ["metric-conversion-place-value-error"],
    tags: ["p8", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-uom-p08-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P08",
    yearLevel: "Years 6–7",
    skillId: "uom-p8-triangle-area",
    skillName: "Use the triangle area formula",
    prompt:
      "A triangle has a base of 12 cm and a perpendicular height of 7 cm. What is its area in square centimetres?",
    correctValue: "42",
    acceptableValues: ["42", "42 cm2", "42 cm²"],
    misconceptionTags: ["triangle-area-formula-error"],
    tags: ["p8", "boundary-probe", "direct-digital"],
  }),
  short({
    id: "myl-boundary-uom-p08-c-v1",
    code: "MYL-MATH-PROG-MG-UOM-P08",
    yearLevel: "Years 6–7",
    skillId: "uom-p8-key-angle",
    skillName: "Use key angle measures",
    prompt: "A straight angle is how many degrees?",
    correctValue: "180",
    acceptableValues: ["180", "180°"],
    misconceptionTags: ["key-angle-measure-error"],
    tags: ["p8", "boundary-probe", "direct-digital"],
  }),
];

export const MEASUREMENT_UNITS_P10_SEARCH_ITEMS: MyLearnaAssessmentItem[] = [
  short({
    id: "myl-search-uom-p10-a-v1",
    code: "MYL-MATH-PROG-MG-UOM-P10",
    yearLevel: "Years 9–10",
    skillId: "uom-p10-pythagoras",
    skillName: "Apply Pythagoras’ theorem",
    prompt:
      "A right triangle has perpendicular sides 6 m and 8 m. What is the length of the hypotenuse in metres?",
    correctValue: "10",
    acceptableValues: ["10", "10 m"],
    misconceptionTags: ["pythagoras-theorem-error"],
    tags: ["p10", "search-probe", "direct-digital"],
  }),
  short({
    id: "myl-search-uom-p10-b-v1",
    code: "MYL-MATH-PROG-MG-UOM-P10",
    yearLevel: "Years 9–10",
    skillId: "uom-p10-volume-capacity",
    skillName: "Connect volume and capacity",
    prompt:
      "A container has an internal volume of 2,500 cubic centimetres. What is its capacity in litres?",
    correctValue: "2.5",
    acceptableValues: ["2.5", "2.5 L", "2.5 litres", "2.5 liters"],
    misconceptionTags: ["volume-capacity-conversion-error"],
    tags: ["p10", "search-probe", "direct-digital"],
  }),
];

export const MEASUREMENT_UNITS_SEARCH_CLUSTERS = {
  "understanding-units-measurement-p1": MEASUREMENT_UNITS_P1_SEARCH_ITEMS,
  "understanding-units-measurement-p2": MEASUREMENT_UNITS_P2_SEARCH_ITEMS,
  "understanding-units-measurement-p10": MEASUREMENT_UNITS_P10_SEARCH_ITEMS,
} as const;

export const MEASUREMENT_UNITS_BOUNDARY_CLUSTERS = {
  "understanding-units-measurement-p4": MEASUREMENT_UNITS_P4_BOUNDARY_ITEMS,
  "understanding-units-measurement-p5": MEASUREMENT_UNITS_P5_BOUNDARY_ITEMS,
  "understanding-units-measurement-p7": MEASUREMENT_UNITS_P7_BOUNDARY_ITEMS,
  "understanding-units-measurement-p8": MEASUREMENT_UNITS_P8_BOUNDARY_ITEMS,
} as const;

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
