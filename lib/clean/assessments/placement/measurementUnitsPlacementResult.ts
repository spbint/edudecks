import type { AssessmentPlacementResultView } from "./assessmentPlacementResult";
import { getMeasurementUnitsEvidenceMode } from "./measurementUnitsAnchors";

const SUMMARIES: Record<number, string> = {
  1: "uses everyday language and gestures to describe measurable size attributes",
  2: "directly compares and orders objects by attributes such as length, mass and capacity",
  3: "chooses and uses uniform informal units without gaps or overlaps and counts the units used",
  4: "repeats a single informal unit to measure and describes turns by direction and amount",
  5: "selects metric units, uses array structure for area and connects turns with familiar angles",
  6: "measures and estimates with metric units, interprets graduated instruments and compares angles with a right angle",
  7: "calculates perimeter and area and measures or reasons about angles in degrees",
  8: "converts metric units and uses formulas for rectangles and triangles with key angle measures",
  9: "uses formulas for non-rectangular areas, right-prism volume or surface area, and circle measurements",
  10: "solves complex measurement problems using composite-shape formulas, volume/capacity relationships, Pythagoras, similarity or trigonometry",
};

const TYPICAL_ALIGNMENT: Record<number, string> = {
  1: "Prep",
  2: "Prep–Year 2",
  3: "Years 1–2",
  4: "Year 3",
  5: "Year 3",
  6: "Years 3–5",
  7: "Year 5",
  8: "Years 6–7",
  9: "Years 7–9",
  10: "Years 9–10",
};

function evidenceLimitations(lowerP: number, upperP = lowerP) {
  const modes = Array.from(
    { length: upperP - lowerP + 1 },
    (_, index) => getMeasurementUnitsEvidenceMode(lowerP + index),
  );

  const limitations = [
    "This is an evidence-supported staff-lab result, not a calibrated psychometric score.",
    "A progression band describes the strongest current evidence in this measurement sub-element; it is not a whole-child year level.",
  ];

  if (modes.includes("hybrid-practical")) {
    limitations.push(
      "This band includes constructs that require observed use of real or virtual measurement materials. Electronic correctness can route the learner but cannot by itself establish high-confidence practical measurement performance.",
    );
  }

  if (modes.includes("trusted-visual-review")) {
    limitations.push(
      "Some score-bearing measurement constructs depend on trusted visual assets or calibrated diagrams and remain subject to hosted visual/device review.",
    );
  }

  return limitations;
}

function confidence(lowerP: number, upperP = lowerP) {
  return Array.from(
    { length: upperP - lowerP + 1 },
    (_, index) => getMeasurementUnitsEvidenceMode(lowerP + index),
  ).includes("hybrid-practical")
    ? ("routing-only" as const)
    : ("provisional-moderate" as const);
}

export function buildMeasurementUnitsCandidateBandResult(input: {
  lowerP: number;
  upperP: number;
}): AssessmentPlacementResultView {
  if (input.upperP <= input.lowerP) {
    throw new Error(
      "Measurement placement band upper level must be greater than lower level.",
    );
  }

  const lower = SUMMARIES[input.lowerP] || `shows evidence around P${input.lowerP}`;
  const upper = SUMMARIES[input.upperP] || `shows emerging evidence around P${input.upperP}`;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "understanding-units-measurement",
    subElementLabel: "Understanding units of measurement",
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
        ? getMeasurementUnitsEvidenceMode(input.lowerP) === "hybrid-practical"
          ? `Verify the P${input.lowerP}–P${input.upperP} band with observed practical measurement evidence before strengthening the placement claim.`
          : `Verify P${input.upperP} across a fresh set of measurement indicators.`
        : `Continue adaptive boundary probing between P${input.lowerP} and P${input.upperP}.`,
    limitations: evidenceLimitations(input.lowerP, input.upperP),
  };
}

export function buildMeasurementUnitsEndpointResult(input: {
  relation: "below-or-around" | "at-least";
  pLevel: number;
}): AssessmentPlacementResultView {
  const summary = SUMMARIES[input.pLevel] || `the P${input.pLevel} construct`;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    subElementKey: "understanding-units-measurement",
    subElementLabel: "Understanding units of measurement",
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
        ? `The learner demonstrates evidence consistent with ${summary}. The current source progression provides no higher level within this sub-element.`
        : `The electronic route has reached the lower end of the progression around ${summary}. Practical measurement evidence is needed before making a more precise lower-end statement.`,
    typicalYearAlignment: TYPICAL_ALIGNMENT[input.pLevel],
    nextVerification:
      input.relation === "at-least"
        ? "Use the full Australian Curriculum Mathematics measurement content or another evidence source if finer upper-end differentiation is required."
        : "Collect observed practical measurement evidence using real objects, informal units or appropriate measuring tools.",
    limitations: [
      "This is open-ended endpoint language; MyLearna does not invent a progression level outside the QCAA source framework.",
      ...evidenceLimitations(input.pLevel),
    ],
  };
}
