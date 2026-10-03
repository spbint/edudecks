export type NumberOperationsPlacementConfidence =
  | "routing-only"
  | "provisional-moderate";

export type NumberOperationsPlacementResult = {
  frameworkId: "MYL-MATH-AU-NUMERACY-V9";
  subElementKey:
    | "number-place-value"
    | "counting-processes"
    | "additive-strategies"
    | "multiplicative-strategies"
    | "understanding-money";
  subElementLabel: string;
  status: "candidate-band" | "endpoint";
  lowerP?: number;
  upperP?: number;
  endpoint?: {
    relation: "below-or-around" | "at-least";
    pLevel: number;
  };
  confidence: NumberOperationsPlacementConfidence;
  claim: string;
  interpretation: string;
  typicalYearAlignment?: string;
  nextVerification: string;
  limitations: string[];
};

const NPV_SUMMARIES: Record<number, string> = {
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
};

const NPV_TYPICAL_ALIGNMENT: Record<number, string> = {
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
};

export function buildNpvCandidateBandResult(input: {
  lowerP: number;
  upperP: number;
  evidenceLimitations?: string[];
}): NumberOperationsPlacementResult {
  if (input.upperP <= input.lowerP) {
    throw new Error("Placement band upper level must be greater than lower level.");
  }

  const lowerSummary =
    NPV_SUMMARIES[input.lowerP] || `shows evidence around P${input.lowerP}`;
  const upperSummary =
    NPV_SUMMARIES[input.upperP] || `shows emerging evidence around P${input.upperP}`;
  const limitations = [
    "This is an evidence-supported staff-lab result, not a calibrated psychometric score.",
    "A progression band describes the strongest current evidence; it is not a whole-child year level.",
    ...(input.evidenceLimitations || []),
  ];

  const confidence: NumberOperationsPlacementConfidence =
    input.evidenceLimitations?.length ? "routing-only" : "provisional-moderate";

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "number-place-value",
    subElementLabel: "Number and place value",
    status: "candidate-band",
    lowerP: input.lowerP,
    upperP: input.upperP,
    confidence,
    claim: `Current assessment evidence is concentrated between P${input.lowerP} and P${input.upperP}.`,
    interpretation:
      input.upperP - input.lowerP === 1
        ? `Evidence supports the P${input.lowerP} construct — ${lowerSummary} — while P${input.upperP} (${upperSummary}) is the next level requiring confirmation.`
        : `The adaptive assessment has localised the learner between P${input.lowerP} (${lowerSummary}) and P${input.upperP} (${upperSummary}). Further boundary evidence is required before narrowing the band.`,
    typicalYearAlignment:
      NPV_TYPICAL_ALIGNMENT[input.lowerP] === NPV_TYPICAL_ALIGNMENT[input.upperP]
        ? NPV_TYPICAL_ALIGNMENT[input.lowerP]
        : `${NPV_TYPICAL_ALIGNMENT[input.lowerP] || "not mapped"} to ${NPV_TYPICAL_ALIGNMENT[input.upperP] || "not mapped"}`,
    nextVerification:
      input.upperP - input.lowerP === 1
        ? `Verify P${input.upperP} across more than one construct/indicator family.`
        : `Continue adaptive boundary probing between P${input.lowerP} and P${input.upperP}.`,
    limitations,
  };
}

export function buildNpvEndpointResult(input: {
  relation: "below-or-around" | "at-least";
  pLevel: number;
  evidenceLimitations?: string[];
}): NumberOperationsPlacementResult {
  const summary =
    NPV_SUMMARIES[input.pLevel] || `the P${input.pLevel} construct`;
  const limitations = [
    "This is open-ended endpoint language; MyLearna does not invent a progression level outside the source framework.",
    "This is not yet a calibrated psychometric result.",
    ...(input.evidenceLimitations || []),
  ];

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "number-place-value",
    subElementLabel: "Number and place value",
    status: "endpoint",
    endpoint: {
      relation: input.relation,
      pLevel: input.pLevel,
    },
    confidence: input.evidenceLimitations?.length
      ? "routing-only"
      : "provisional-moderate",
    claim:
      input.relation === "at-least"
        ? `Current evidence reaches at least P${input.pLevel}.`
        : `Current evidence is below or around P${input.pLevel}.`,
    interpretation:
      input.relation === "at-least"
        ? `The learner demonstrates evidence consistent with ${summary}. The current source progression provides no higher level to test within this sub-element.`
        : `The learner does not yet show consistent evidence above the lower end of the current progression around ${summary}.`,
    typicalYearAlignment: NPV_TYPICAL_ALIGNMENT[input.pLevel],
    nextVerification:
      input.relation === "at-least"
        ? "Use the full Australian Curriculum Mathematics layer or another evidence source if finer upper-end differentiation is required."
        : "Use observed/targeted lower-level evidence before making a more precise statement.",
    limitations,
  };
}
