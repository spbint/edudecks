export type NumeracyProgressionElementKey =
  | "number-sense-algebra"
  | "measurement-geometry"
  | "statistics-probability";

export type NumeracyProgressionSubElementKey =
  | "number-place-value"
  | "counting-processes"
  | "additive-strategies"
  | "multiplicative-strategies"
  | "interpreting-fractions"
  | "proportional-thinking"
  | "number-patterns-algebraic-thinking"
  | "understanding-money"
  | "understanding-units-measurement"
  | "understanding-geometric-properties"
  | "positioning-locating"
  | "measuring-time"
  | "understanding-chance"
  | "interpreting-representing-data";

export type NumeracyProgressionSubElement = {
  key: NumeracyProgressionSubElementKey;
  label: string;
  elementKey: NumeracyProgressionElementKey;
  minP: 1;
  maxP: number;
  sourcePages: number[];
  implementation:
    | "adaptive-first-slice"
    | "blueprint-next";
};

export const NUMERACY_PROGRESSION_ELEMENTS = [
  {
    key: "number-sense-algebra" as const,
    label: "Number sense and algebra",
    sourceTablePage: 2,
  },
  {
    key: "measurement-geometry" as const,
    label: "Measurement and geometry",
    sourceTablePage: 14,
  },
  {
    key: "statistics-probability" as const,
    label: "Statistics and probability",
    sourceTablePage: 19,
  },
];

export const NUMERACY_PROGRESSION_SUB_ELEMENTS: NumeracyProgressionSubElement[] = [
  {
    key: "number-place-value",
    label: "Number and place value",
    elementKey: "number-sense-algebra",
    minP: 1,
    maxP: 10,
    sourcePages: [2, 3, 4],
    implementation: "adaptive-first-slice",
  },
  {
    key: "counting-processes",
    label: "Counting processes",
    elementKey: "number-sense-algebra",
    minP: 1,
    maxP: 8,
    sourcePages: [2, 5],
    implementation: "adaptive-first-slice",
  },
  {
    key: "additive-strategies",
    label: "Additive strategies",
    elementKey: "number-sense-algebra",
    minP: 1,
    maxP: 10,
    sourcePages: [2, 6],
    implementation: "adaptive-first-slice",
  },
  {
    key: "multiplicative-strategies",
    label: "Multiplicative strategies",
    elementKey: "number-sense-algebra",
    minP: 1,
    maxP: 10,
    sourcePages: [2, 7],
    implementation: "adaptive-first-slice",
  },
  {
    key: "interpreting-fractions",
    label: "Interpreting fractions",
    elementKey: "number-sense-algebra",
    minP: 1,
    maxP: 9,
    sourcePages: [2, 8, 9],
    implementation: "blueprint-next",
  },
  {
    key: "proportional-thinking",
    label: "Proportional thinking",
    elementKey: "number-sense-algebra",
    minP: 1,
    maxP: 7,
    sourcePages: [2, 10],
    implementation: "blueprint-next",
  },
  {
    key: "number-patterns-algebraic-thinking",
    label: "Number patterns and algebraic thinking",
    elementKey: "number-sense-algebra",
    minP: 1,
    maxP: 9,
    sourcePages: [2, 11, 12, 13],
    implementation: "blueprint-next",
  },
  {
    key: "understanding-money",
    label: "Understanding money",
    elementKey: "number-sense-algebra",
    minP: 1,
    maxP: 10,
    sourcePages: [2, 13],
    implementation: "adaptive-first-slice",
  },
  {
    key: "understanding-units-measurement",
    label: "Understanding units of measurement",
    elementKey: "measurement-geometry",
    minP: 1,
    maxP: 10,
    sourcePages: [14, 15, 16],
    implementation: "blueprint-next",
  },
  {
    key: "understanding-geometric-properties",
    label: "Understanding geometric properties",
    elementKey: "measurement-geometry",
    minP: 1,
    maxP: 7,
    sourcePages: [14, 16, 17],
    implementation: "blueprint-next",
  },
  {
    key: "positioning-locating",
    label: "Positioning and locating",
    elementKey: "measurement-geometry",
    minP: 1,
    maxP: 5,
    sourcePages: [14, 17, 18],
    implementation: "blueprint-next",
  },
  {
    key: "measuring-time",
    label: "Measuring time",
    elementKey: "measurement-geometry",
    minP: 1,
    maxP: 7,
    sourcePages: [14, 18],
    implementation: "blueprint-next",
  },
  {
    key: "understanding-chance",
    label: "Understanding chance",
    elementKey: "statistics-probability",
    minP: 1,
    maxP: 6,
    sourcePages: [19, 20],
    implementation: "blueprint-next",
  },
  {
    key: "interpreting-representing-data",
    label: "Interpreting and representing data",
    elementKey: "statistics-probability",
    minP: 1,
    maxP: 8,
    sourcePages: [19, 20, 21, 22],
    implementation: "blueprint-next",
  },
];

export function getNumeracyProgressionSubElement(
  key: NumeracyProgressionSubElementKey,
) {
  return NUMERACY_PROGRESSION_SUB_ELEMENTS.find((item) => item.key === key) || null;
}

export function getNumeracyImplementationSummary() {
  const implemented = NUMERACY_PROGRESSION_SUB_ELEMENTS.filter(
    (item) => item.implementation === "adaptive-first-slice",
  );
  const next = NUMERACY_PROGRESSION_SUB_ELEMENTS.filter(
    (item) => item.implementation === "blueprint-next",
  );

  return {
    elementCount: NUMERACY_PROGRESSION_ELEMENTS.length,
    subElementCount: NUMERACY_PROGRESSION_SUB_ELEMENTS.length,
    implementedCount: implemented.length,
    blueprintNextCount: next.length,
    implemented,
    next,
  };
}

export const NUMERACY_PROGRESSION_SOURCE = {
  title: "Numeracy general capability — Sequence of numeracy progressions",
  authority: "Queensland Curriculum & Assessment Authority",
  curriculumVersion: "Australian Curriculum Version 9.0",
  publication: "March 2024",
  pages: 22,
} as const;
