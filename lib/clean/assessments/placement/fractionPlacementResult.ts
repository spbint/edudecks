import type { AssessmentPlacementResultView } from "./assessmentPlacementResult";
import { getFractionEvidenceMode } from "./fractionAnchors";

const SUMMARIES: Record<number, string> = {
  1: "creates and recognises equal halves of wholes and collections while identifying the part and the whole",
  2: "uses repeated halving to make halves, quarters and eighths across different fraction models",
  3: "accumulates fractional parts, interprets symbolic fractions and uses halves, quarters and eighths in measurement contexts",
  4: "re-imagines the whole, creates thirds and distinguishes examples from non-examples of equal fraction partitions",
  5: "reasons about equal wholes, equivalent fractions and fractions greater than one",
  6: "treats fractions as numbers and division statements, locates them on number lines and connects benchmark fractions with decimals",
  7: "connects fraction, decimal and percentage representations and compares or orders fractions by relative size",
  8: "operates with fractions, including same-denominator addition/subtraction, fractions of quantities and multiplication/division meaning",
  9: "uses fractions proportionally as ratios to compare the sizes of two sets",
};

const TYPICAL_ALIGNMENT: Record<number, string> = {
  1: "Year 2",
  2: "Year 2",
  3: "Year 2",
  4: "Year 3",
  5: "Years 3–4",
  6: "Years 4–5",
  7: "Years 5–6",
  8: "Years 5–7",
  9: "Years 7–9",
};

function modes(lowerP: number, upperP = lowerP) {
  return Array.from(
    { length: upperP - lowerP + 1 },
    (_, index) => getFractionEvidenceMode(lowerP + index),
  );
}

function confidence(lowerP: number, upperP = lowerP) {
  return modes(lowerP, upperP).includes("hybrid-practical")
    ? ("routing-only" as const)
    : ("provisional-moderate" as const);
}

function limitations(lowerP: number, upperP = lowerP) {
  const evidenceModes = modes(lowerP, upperP);
  const result = [
    "This is an evidence-supported staff-lab result, not a calibrated psychometric score.",
    "A progression band describes current evidence in Interpreting fractions; it is not a whole-child year level.",
  ];

  if (evidenceModes.includes("hybrid-practical")) {
    result.push(
      "Early fraction constructs include physically creating equal parts and repeated halving. Electronic responses can route the learner but should be combined with observed or practical evidence before a stronger lower-end claim.",
    );
  }

  if (evidenceModes.includes("trusted-visual-review")) {
    result.push(
      "Some fraction constructs depend on trusted equal-part and number-line visuals. Those score-bearing assets remain subject to hosted visual/device review.",
    );
  }

  return result;
}

export function buildFractionCandidateBandResult(input: {
  lowerP: number;
  upperP: number;
}): AssessmentPlacementResultView {
  if (input.upperP <= input.lowerP) {
    throw new Error(
      "Fraction placement band upper level must be greater than lower level.",
    );
  }

  const lower = SUMMARIES[input.lowerP] || `shows evidence around P${input.lowerP}`;
  const upper = SUMMARIES[input.upperP] || `shows emerging evidence around P${input.upperP}`;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "interpreting-fractions",
    subElementLabel: "Interpreting fractions",
    status: "candidate-band",
    lowerP: input.lowerP,
    upperP: input.upperP,
    confidence: confidence(input.lowerP, input.upperP),
    claim: `Current assessment evidence is concentrated between P${input.lowerP} and P${input.upperP}.`,
    interpretation:
      input.upperP - input.lowerP === 1
        ? `Evidence supports the P${input.lowerP} construct — ${lower} — while P${input.upperP} (${upper}) is the next level requiring confirmation.`
        : `The adaptive assessment has localised the learner between P${input.lowerP} (${lower}) and P${input.upperP} (${upper}). Further boundary evidence is required before narrowing the band.`,
    typicalYearAlignment:
      TYPICAL_ALIGNMENT[input.lowerP] === TYPICAL_ALIGNMENT[input.upperP]
        ? TYPICAL_ALIGNMENT[input.lowerP]
        : `${TYPICAL_ALIGNMENT[input.lowerP] || "not mapped"} to ${TYPICAL_ALIGNMENT[input.upperP] || "not mapped"}`,
    nextVerification:
      input.upperP - input.lowerP === 1
        ? getFractionEvidenceMode(input.lowerP) === "hybrid-practical"
          ? "Verify the adjacent band with a practical equal-partition or repeated-halving task before strengthening the lower-end claim."
          : `Verify P${input.upperP} with fresh fraction representations or reasoning tasks.`
        : `Continue adaptive boundary probing between P${input.lowerP} and P${input.upperP}.`,
    limitations: limitations(input.lowerP, input.upperP),
  };
}

export function buildFractionEndpointResult(input: {
  relation: "below-or-around" | "at-least";
  pLevel: number;
}): AssessmentPlacementResultView {
  const summary = SUMMARIES[input.pLevel] || `the P${input.pLevel} construct`;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "interpreting-fractions",
    subElementLabel: "Interpreting fractions",
    status: "endpoint",
    endpoint: {
      relation: input.relation,
      pLevel: input.pLevel,
    },
    confidence: confidence(input.pLevel),
    claim:
      input.relation === "at-least"
        ? `Current evidence reaches at least P${input.pLevel}.`
        : `Current electronic evidence is below or around P${input.pLevel}.`,
    interpretation:
      input.relation === "at-least"
        ? `The learner demonstrates evidence consistent with ${summary}. The current source progression provides no higher Interpreting fractions level.`
        : `The electronic route has reached the lower end of the progression around ${summary}. Practical equal-partition evidence is needed before making a more precise lower-end statement.`,
    typicalYearAlignment: TYPICAL_ALIGNMENT[input.pLevel],
    nextVerification:
      input.relation === "at-least"
        ? "Use the broader Australian Curriculum Mathematics rational-number layer if finer upper-end differentiation is required."
        : "Collect a practical fraction-making or repeated-halving evidence sample before making a more precise lower-end statement.",
    limitations: [
      "This is open-ended endpoint language; MyLearna does not invent a progression level outside the QCAA source framework.",
      ...limitations(input.pLevel),
    ],
  };
}
