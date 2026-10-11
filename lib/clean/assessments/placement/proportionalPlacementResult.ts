import type { AssessmentPlacementResultView } from "./assessmentPlacementResult";

const SUMMARIES: Record<number, string> = {
  1: "understands percentage as a relationship to 100, recognises 100% as a whole and uses complementary percentages",
  2: "moves fluently among fraction, decimal and percentage forms and calculates percentages of quantities or one quantity as a percentage of another",
  3: "interprets ratios as part-to-part comparisons and rates as comparisons between unlike quantities",
  4: "uses ratios to scale quantities and rates to determine how quantities change",
  5: "determines the whole from a percentage, compares unit rates and preserves ratios or aspect ratios",
  6: "uses percentage multipliers, rates, ratios, direct and inverse proportion and scale factors in authentic problems",
  7: "uses proportional relationships flexibly in formulas and repeated percentage changes such as successive discounts or compound growth",
};

const TYPICAL_ALIGNMENT: Record<number, string> = {
  1: "Year 5",
  2: "Years 5–7",
  3: "Year 7",
  4: "Years 7–8",
  5: "Year 8",
  6: "Years 9–10",
  7: "Years 9–10",
};

export function buildProportionalCandidateBandResult(input: {
  lowerP: number;
  upperP: number;
}): AssessmentPlacementResultView {
  if (input.upperP <= input.lowerP) {
    throw new Error("Proportional placement band upper level must be greater than lower level.");
  }
  const lower = SUMMARIES[input.lowerP] || `shows evidence around P${input.lowerP}`;
  const upper = SUMMARIES[input.upperP] || `shows emerging evidence around P${input.upperP}`;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "proportional-thinking",
    subElementLabel: "Proportional thinking",
    status: "candidate-band",
    lowerP: input.lowerP,
    upperP: input.upperP,
    confidence: "provisional-moderate",
    claim: `Current assessment evidence is concentrated between P${input.lowerP} and P${input.upperP}.`,
    interpretation:
      input.upperP - input.lowerP === 1
        ? `Evidence supports the P${input.lowerP} construct — ${lower} — while P${input.upperP} (${upper}) is the next level requiring confirmation.`
        : `The adaptive assessment has localised the learner between P${input.lowerP} (${lower}) and P${input.upperP} (${upper}). Further boundary evidence is required before narrowing the band.`,
    typicalYearAlignment:
      TYPICAL_ALIGNMENT[input.lowerP] === TYPICAL_ALIGNMENT[input.upperP]
        ? TYPICAL_ALIGNMENT[input.lowerP]
        : `${TYPICAL_ALIGNMENT[input.lowerP]} to ${TYPICAL_ALIGNMENT[input.upperP]}`,
    nextVerification:
      input.upperP - input.lowerP === 1
        ? `Verify P${input.upperP} with fresh percent, ratio or rate reasoning tasks.`
        : `Continue adaptive boundary probing between P${input.lowerP} and P${input.upperP}.`,
    limitations: [
      "This is an evidence-supported staff-lab result, not a calibrated psychometric score.",
      "A progression band describes current evidence in Proportional thinking; it is not a whole-child year level.",
    ],
  };
}

export function buildProportionalEndpointResult(input: {
  relation: "below-or-around" | "at-least";
  pLevel: number;
}): AssessmentPlacementResultView {
  const summary = SUMMARIES[input.pLevel] || `the P${input.pLevel} construct`;
  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "proportional-thinking",
    subElementLabel: "Proportional thinking",
    status: "endpoint",
    endpoint: { relation: input.relation, pLevel: input.pLevel },
    confidence: "provisional-moderate",
    claim:
      input.relation === "at-least"
        ? `Current evidence reaches at least P${input.pLevel}.`
        : `Current evidence is below or around P${input.pLevel}.`,
    interpretation:
      input.relation === "at-least"
        ? `The learner demonstrates evidence consistent with ${summary}. The current source progression provides no higher Proportional thinking level.`
        : `The adaptive route has reached the lower end of the progression around ${summary}.`,
    typicalYearAlignment: TYPICAL_ALIGNMENT[input.pLevel],
    nextVerification:
      input.relation === "at-least"
        ? "Use the broader Australian Curriculum Mathematics proportional/rational-number layer if finer upper-end differentiation is required."
        : "Collect another fresh percent or proportional reasoning sample before making a more precise lower-end statement.",
    limitations: [
      "This is open-ended endpoint language; MyLearna does not invent a progression level outside the QCAA source framework.",
      "This is not yet a calibrated psychometric result.",
    ],
  };
}
