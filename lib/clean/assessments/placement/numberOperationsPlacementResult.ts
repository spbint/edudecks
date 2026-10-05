import type {
  AssessmentPlacementConfidence,
  AssessmentPlacementResultView,
} from "./assessmentPlacementResult";

export type NumberOperationsPlacementConfidence = Exclude<
  AssessmentPlacementConfidence,
  "confirmation-supported"
>;

export type NumberOperationsSubElementKey =
  | "number-place-value"
  | "counting-processes"
  | "additive-strategies"
  | "multiplicative-strategies"
  | "understanding-money";

export type NumberOperationsPlacementResult = Omit<
  AssessmentPlacementResultView,
  "frameworkId" | "subElementKey" | "confidence"
> & {
  frameworkId: "MYL-MATH-AU-NUMERACY-V9";
  subElementKey: NumberOperationsSubElementKey;
  confidence: NumberOperationsPlacementConfidence;
};

const LEVEL_SUMMARIES: Record<
  NumberOperationsSubElementKey,
  Record<number, string>
> = {
  "number-place-value": {
    1: "recognises familiar numerals and very small quantities",
    2: "identifies numerals and quantities to 10 and begins early place-value structure",
    3: "reads and interprets numbers to 20 and treats teen numbers as one ten and some more",
    4: "reads, orders and renames numbers to and beyond 100 using tens, ones and zero as a placeholder",
    5: "reads and flexibly renames three-digit numbers and interprets internal zero",
    6: "reads and flexibly partitions four-digit numbers, rounds natural numbers and extends place value to tenths",
    7: "works with larger numerals and decimals through hundredths/thousandths and compares decimals to two places",
    8: "reasons multiplicatively across decimal place values, compares unequal-length decimals and rounds decimals",
    9: "uses negative numbers, place-value scaling by powers of 10 and purpose-specific decimal rounding",
    10: "interprets very large and very small numbers through powers and scientific notation",
  },
  "counting-processes": {
    1: "recognises number words in early counting contexts",
    2: "uses a stable count from one, subitises small collections and counts very small sets",
    3: "uses one-to-one correspondence and cardinality while counting within 1–10",
    4: "continues counting from a non-one start and keeps track of counted items",
    5: "uses next/previous number knowledge within 1–100 and counts collections independently of arrangement",
    6: "counts forward/backward beyond 100 and skip-counts in twos, fives and tens",
    7: "counts efficiently in larger groups, including off-decade sequences and grouped quantities",
    8: "extends counting beyond whole numbers and applies abstract counting processes",
  },
  "additive-strategies": {
    1: "describes adding-to and taking-away situations with small collections",
    2: "represents and solves small additive situations with visible materials or drawings",
    3: "mentally represents concealed quantities but still relies on counting from one",
    4: "uses counting-on strategies for addition and missing-addend problems",
    5: "uses counting-back/up strategies for subtraction and missing-subtrahend problems",
    6: "uses flexible combinations, part-part-whole knowledge and difference thinking within 20",
    7: "uses flexible two-digit additive strategies and inverse relationships",
    8: "uses place value, partitioning and estimation with three-digit numbers and beyond",
    9: "adds and subtracts decimals and fractions with related denominators",
    10: "operates additively with rational numbers including integers and unrelated-denominator fractions",
  },
  "multiplicative-strategies": {
    1: "forms and shares equal groups by dealing or grouping and counts by ones",
    2: "uses visible groups or multiples in counting, sharing and grouping situations",
    3: "uses imagined composite units for concealed equal groups",
    4: "uses repeated abstract composite units through repeated addition or subtraction",
    5: "coordinates composite units and represents multiplication/division with groups, arrays and symbols",
    6: "uses flexible single-digit multiplication/division facts and interprets multiplicative contexts",
    7: "uses inverse operations and distributive/partitioning strategies with multi-digit numbers",
    8: "solves multi-step multiplicative situations with multi-digit natural numbers",
    9: "works multiplicatively with rational numbers, prime factors and exponents",
    10: "operates multiplicatively with decimals, scientific notation and complex rational-number models",
  },
  "understanding-money": {
    1: "recognises money situations and identifies Australian denominations by face value",
    2: "sorts and orders denominations by face value and counts pieces of the same denomination",
    3: "counts small money collections and records whole-dollar or whole-cent values",
    4: "recognises equivalent money values and represents the same amount in multiple ways",
    5: "counts larger mixed collections and records dollars and cents in decimal notation",
    6: "calculates totals and change and identifies profit/loss conditions",
    7: "uses multiplicative money relationships for repeated purchases, splitting and simple budgets",
    8: "uses percentages for discounts, GST, tax tables and simple interest",
    9: "uses proportional strategies for best buys, payment plans, currency and percentage profit/loss",
    10: "makes longer-term financial decisions involving compound interest, depreciation, loans and ongoing costs",
  },
};

const LABELS: Record<NumberOperationsSubElementKey, string> = {
  "number-place-value": "Number and place value",
  "counting-processes": "Counting processes",
  "additive-strategies": "Additive strategies",
  "multiplicative-strategies": "Multiplicative strategies",
  "understanding-money": "Understanding money",
};

const TYPICAL_ALIGNMENT: Record<
  NumberOperationsSubElementKey,
  Record<number, string>
> = {
  "number-place-value": {
    1: "Prep",
    2: "Prep",
    3: "Prep",
    4: "Years 1–2",
    5: "Year 2",
    6: "Year 3",
    7: "Years 3–4",
    8: "Years 4–5",
    9: "Years 6–8",
    10: "Years 9–10",
  },
  "counting-processes": {
    1: "Prep",
    2: "Prep",
    3: "Prep",
    4: "Prep–Year 1",
    5: "Year 1",
    6: "Years 1–3",
    7: "Years 2–4",
    8: "Years 4–6",
  },
  "additive-strategies": {
    1: "Prep",
    2: "Prep",
    3: "Year 1",
    4: "Year 1",
    5: "Year 1",
    6: "Years 1–2",
    7: "Year 2",
    8: "Years 3–5",
    9: "Years 5–7",
    10: "Years 7–8",
  },
  "multiplicative-strategies": {
    1: "Prep",
    2: "Year 1",
    3: "Year 2",
    4: "Year 2",
    5: "Years 2–3",
    6: "Years 4–5",
    7: "Years 4–5",
    8: "Year 6",
    9: "Years 6–8",
    10: "Years 7–10",
  },
  "understanding-money": {
    1: "Prep–Year 1",
    2: "Year 1",
    3: "Years 1–2",
    4: "Years 3–4",
    5: "Year 4",
    6: "Year 4",
    7: "Years 4–6",
    8: "Years 6–8",
    9: "Years 8–9",
    10: "Years 9–10",
  },
};

function evidenceLimitations(extra: string[] = []) {
  return [
    "This is an evidence-supported staff-lab result, not a calibrated psychometric score.",
    "A progression band describes the strongest current evidence; it is not a whole-child year level.",
    ...extra,
  ];
}

export function buildNumberOperationsCandidateBandResult(input: {
  subElementKey: NumberOperationsSubElementKey;
  lowerP: number;
  upperP: number;
  evidenceLimitations?: string[];
}): NumberOperationsPlacementResult {
  if (input.upperP <= input.lowerP) {
    throw new Error("Placement band upper level must be greater than lower level.");
  }

  const summaries = LEVEL_SUMMARIES[input.subElementKey];
  const lowerSummary =
    summaries[input.lowerP] || `shows evidence around P${input.lowerP}`;
  const upperSummary =
    summaries[input.upperP] || `shows emerging evidence around P${input.upperP}`;
  const extra = input.evidenceLimitations || [];

  const result: NumberOperationsPlacementResult = {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: input.subElementKey,
    subElementLabel: LABELS[input.subElementKey],
    status: "candidate-band",
    lowerP: input.lowerP,
    upperP: input.upperP,
    confidence: extra.length ? "routing-only" : "provisional-moderate",
    claim: `Current assessment evidence is concentrated between P${input.lowerP} and P${input.upperP}.`,
    interpretation:
      input.upperP - input.lowerP === 1
        ? `Evidence supports the P${input.lowerP} construct — ${lowerSummary} — while P${input.upperP} (${upperSummary}) is the next level requiring confirmation.`
        : `The adaptive assessment has localised the learner between P${input.lowerP} (${lowerSummary}) and P${input.upperP} (${upperSummary}). Further boundary evidence is required before narrowing the band.`,
    nextVerification:
      input.upperP - input.lowerP === 1
        ? `Verify P${input.upperP} across more than one construct/indicator family.`
        : `Continue adaptive boundary probing between P${input.lowerP} and P${input.upperP}.`,
    limitations: evidenceLimitations(extra),
  };

  const alignment = TYPICAL_ALIGNMENT[input.subElementKey];
  const lowerAlignment = alignment[input.lowerP];
  const upperAlignment = alignment[input.upperP];
  if (lowerAlignment || upperAlignment) {
    result.typicalYearAlignment =
      lowerAlignment === upperAlignment
        ? lowerAlignment
        : `${lowerAlignment || "not mapped"} to ${upperAlignment || "not mapped"}`;
  }

  return result;
}

export function buildNumberOperationsEndpointResult(input: {
  subElementKey: NumberOperationsSubElementKey;
  relation: "below-or-around" | "at-least";
  pLevel: number;
  evidenceLimitations?: string[];
}): NumberOperationsPlacementResult {
  const summary =
    LEVEL_SUMMARIES[input.subElementKey][input.pLevel] ||
    `the P${input.pLevel} construct`;
  const extra = input.evidenceLimitations || [];

  const result: NumberOperationsPlacementResult = {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: input.subElementKey,
    subElementLabel: LABELS[input.subElementKey],
    status: "endpoint",
    endpoint: { relation: input.relation, pLevel: input.pLevel },
    confidence: extra.length ? "routing-only" : "provisional-moderate",
    claim:
      input.relation === "at-least"
        ? `Current evidence reaches at least P${input.pLevel}.`
        : `Current evidence is below or around P${input.pLevel}.`,
    interpretation:
      input.relation === "at-least"
        ? `The learner demonstrates evidence consistent with ${summary}. The current source progression provides no higher level to test within this sub-element.`
        : `The learner does not yet show consistent evidence above the lower end of the current progression around ${summary}.`,
    nextVerification:
      input.relation === "at-least"
        ? "Use the full Australian Curriculum Mathematics layer or another evidence source if finer upper-end differentiation is required."
        : "Use observed/targeted lower-level evidence before making a more precise statement.",
    limitations: [
      "This is open-ended endpoint language; MyLearna does not invent a progression level outside the source framework.",
      "This is not yet a calibrated psychometric result.",
      ...extra,
    ],
  };

  result.typicalYearAlignment =
    TYPICAL_ALIGNMENT[input.subElementKey][input.pLevel];

  return result;
}

export function buildNpvCandidateBandResult(input: {
  lowerP: number;
  upperP: number;
  evidenceLimitations?: string[];
}) {
  return buildNumberOperationsCandidateBandResult({
    subElementKey: "number-place-value",
    ...input,
  });
}

export function buildNpvEndpointResult(input: {
  relation: "below-or-around" | "at-least";
  pLevel: number;
  evidenceLimitations?: string[];
}) {
  return buildNumberOperationsEndpointResult({
    subElementKey: "number-place-value",
    ...input,
  });
}
