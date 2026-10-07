import type { NumberOperationsSubElementKey } from "./placement/numberOperationsPlacementResult";

export const NUMBER_OPERATIONS_STARTING_POINT_PRODUCT = {
  commercialDisplayName: "MyLearna Maths Starting Point — Number & Operations",
  shortDisplayName: "Number & Operations Starting Point",
  assessedAreas: [
    { key: "number-place-value", label: "Number and place value", shortLabel: "Number & place value" },
    { key: "counting-processes", label: "Counting processes", shortLabel: "Counting" },
    { key: "additive-strategies", label: "Additive thinking", shortLabel: "Additive strategies" },
    { key: "multiplicative-strategies", label: "Multiplicative thinking", shortLabel: "Multiplicative strategies" },
    { key: "understanding-money", label: "Understanding money", shortLabel: "Money" },
  ] satisfies ReadonlyArray<{
    key: NumberOperationsSubElementKey;
    label: string;
    shortLabel: string;
  }>,
  parentSummary:
    "A short adaptive check to help identify where learning should begin across number and place value, counting, additive thinking, multiplicative thinking and money.",
  parentEvidenceNote:
    "Your child can be at different points in different areas. MyLearna looks at each area separately and recommends useful next learning — this is not a pass/fail test and it does not produce one overall Maths score.",
  accessibilityNote:
    "Some questions offer another accessible or practical way to answer.",
} as const;

export const NUMBER_OPERATIONS_STARTING_POINT_ROUTE =
  "/assessments/maths-starting-point";
