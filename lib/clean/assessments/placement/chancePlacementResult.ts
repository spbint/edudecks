import type { AssessmentPlacementResultView } from "./assessmentPlacementResult";
import { getChanceEvidenceMode } from "./chanceAnchors";

const SUMMARIES: Record<number, string> = {
  1: "describes everyday occurrences involving chance and uses will/might language to make simple predictions",
  2: "orders likelihood using non-quantitative chance language and recognises variation in experimental results",
  3: "reasons about fairness, possible outcomes, equal likelihood and independence in one-step chance experiments",
  4: "expresses theoretical probability numerically on the 0–1 scale using fractions, decimals or percentages",
  5: "calculates compound-event, complement and replacement probabilities and compares expected with actual results",
  6: "uses probabilistic reasoning with and/or/not/at-least language, conditional data and uncertainty in authentic claims",
};

const TYPICAL_ALIGNMENT: Record<number, string> = {
  1: "Years 3–5",
  2: "Years 3–5",
  3: "Years 3–5",
  4: "Year 6",
  5: "Year 7",
  6: "Years 8–10",
};

function limitations(lowerP: number, upperP = lowerP) {
  const result = [
    "This is an evidence-supported staff-lab result, not a calibrated psychometric score.",
    "A progression band describes current evidence in Understanding chance; it is not a whole-child year level.",
  ];

  if (
    Array.from(
      { length: upperP - lowerP + 1 },
      (_, index) => getChanceEvidenceMode(lowerP + index),
    ).includes("contextual-routing")
  ) {
    result.push(
      "P1 everyday-chance judgements are context-sensitive. Electronic responses can route the learner but should be combined with real-world discussion or observed reasoning before a stronger lower-end claim.",
    );
  }

  return result;
}

function confidence(lowerP: number, upperP = lowerP) {
  return Array.from(
    { length: upperP - lowerP + 1 },
    (_, index) => getChanceEvidenceMode(lowerP + index),
  ).includes("contextual-routing")
    ? ("routing-only" as const)
    : ("provisional-moderate" as const);
}

export function buildChanceCandidateBandResult(input: {
  lowerP: number;
  upperP: number;
}): AssessmentPlacementResultView {
  if (input.upperP <= input.lowerP) {
    throw new Error(
      "Chance placement band upper level must be greater than lower level.",
    );
  }

  const lower = SUMMARIES[input.lowerP] || `shows evidence around P${input.lowerP}`;
  const upper = SUMMARIES[input.upperP] || `shows emerging evidence around P${input.upperP}`;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "understanding-chance",
    subElementLabel: "Understanding chance",
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
        ? getChanceEvidenceMode(input.lowerP) === "contextual-routing"
          ? "Verify the lower everyday-chance reasoning through discussion or an authentic chance situation before strengthening the placement claim."
          : `Verify P${input.upperP} with a fresh probability or chance-reasoning task.`
        : `Continue adaptive boundary probing between P${input.lowerP} and P${input.upperP}.`,
    limitations: limitations(input.lowerP, input.upperP),
  };
}

export function buildChanceEndpointResult(input: {
  relation: "below-or-around" | "at-least";
  pLevel: number;
}): AssessmentPlacementResultView {
  const summary = SUMMARIES[input.pLevel] || `the P${input.pLevel} construct`;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "understanding-chance",
    subElementLabel: "Understanding chance",
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
        ? `The learner demonstrates evidence consistent with ${summary}. The current source progression provides no higher Understanding chance level.`
        : `The electronic route has reached the lower end of the progression around ${summary}. Real-world chance discussion can provide stronger lower-end evidence.`,
    typicalYearAlignment: TYPICAL_ALIGNMENT[input.pLevel],
    nextVerification:
      input.relation === "at-least"
        ? "Use the broader Australian Curriculum Mathematics probability/statistics layer if finer upper-end differentiation is required."
        : "Collect another authentic chance reasoning sample before making a more precise lower-end statement.",
    limitations: [
      "This is open-ended endpoint language; MyLearna does not invent a progression level outside the QCAA source framework.",
      ...limitations(input.pLevel),
    ],
  };
}
