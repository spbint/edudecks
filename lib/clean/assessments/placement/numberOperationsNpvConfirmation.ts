import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";

export type NpvAdjacentBandConfirmationOutcome =
  | "lower-supported-upper-not-yet"
  | "both-supported"
  | "evidence-inconsistent";

export type NpvAdjacentBandConfirmation = {
  lowerP: number;
  upperP: number;
  lowerCorrect: number;
  upperCorrect: number;
  lowerTotal: number;
  upperTotal: number;
  outcome: NpvAdjacentBandConfirmationOutcome;
  claim: string;
  interpretation: string;
  confidence: "routing-only" | "confirmation-supported";
  nextAction: string;
};

export function evaluateNpvAdjacentBandConfirmation(input: {
  lowerP: number;
  upperP: number;
  lowerResponses: MyLearnaAssessmentResponse[];
  upperResponses: MyLearnaAssessmentResponse[];
}): NpvAdjacentBandConfirmation {
  if (input.upperP !== input.lowerP + 1) {
    throw new Error("NPV confirmation requires an adjacent progression band.");
  }

  const lowerTotal = input.lowerResponses.length;
  const upperTotal = input.upperResponses.length;
  if (lowerTotal < 2 || upperTotal < 2) {
    throw new Error("NPV confirmation requires two fresh items at each side of the band.");
  }

  const lowerCorrect = input.lowerResponses.filter((response) => response.correct).length;
  const upperCorrect = input.upperResponses.filter((response) => response.correct).length;
  const lowerSupported = lowerCorrect >= 2;
  const upperSupported = upperCorrect >= 2;
  const hybrid = input.lowerP <= 1;

  if (!lowerSupported) {
    return {
      lowerP: input.lowerP,
      upperP: input.upperP,
      lowerCorrect,
      upperCorrect,
      lowerTotal,
      upperTotal,
      outcome: "evidence-inconsistent",
      claim: `Fresh confirmation evidence is not yet consistent enough to confirm the P${input.lowerP}–P${input.upperP} band.`,
      interpretation:
        "The fresh lower-band items were not both supported. MyLearna should retain the earlier routing evidence, collect more evidence and avoid strengthening the placement claim.",
      confidence: "routing-only",
      nextAction:
        "Collect another practical or fresh digital evidence sample before reporting a stronger Number and place value statement.",
    };
  }

  if (upperSupported) {
    return {
      lowerP: input.lowerP,
      upperP: input.upperP,
      lowerCorrect,
      upperCorrect,
      lowerTotal,
      upperTotal,
      outcome: "both-supported",
      claim: `Fresh evidence supports indicators at both P${input.lowerP} and P${input.upperP}.`,
      interpretation:
        `The learner demonstrated the lower and upper sides of the adjacent band on fresh items. MyLearna can say that evidence reaches P${input.upperP}, but should not invent a higher level without checking the next progression level.`,
      confidence: hybrid ? "routing-only" : "confirmation-supported",
      nextAction:
        input.upperP >= 10
          ? "Use the broader Australian Curriculum Mathematics layer for any finer upper-end differentiation."
          : `Check fresh P${input.upperP + 1} indicators if finer differentiation is needed.`,
    };
  }

  return {
    lowerP: input.lowerP,
    upperP: input.upperP,
    lowerCorrect,
    upperCorrect,
    lowerTotal,
    upperTotal,
    outcome: "lower-supported-upper-not-yet",
    claim: `Fresh evidence supports P${input.lowerP} indicators; P${input.upperP} is not yet consistently demonstrated.`,
    interpretation:
      `The strongest fresh evidence sits at P${input.lowerP}. The learner may show some emerging P${input.upperP} knowledge, but the upper level was not supported across both confirmation items.`,
    confidence: hybrid ? "routing-only" : "confirmation-supported",
    nextAction:
      `Target learning toward the P${input.upperP} indicators, then re-check with different items after practice.`,
  };
}