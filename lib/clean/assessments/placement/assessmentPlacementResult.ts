export type AssessmentPlacementConfidence =
  | "routing-only"
  | "provisional-moderate"
  | "confirmation-supported";

export type AssessmentPlacementResultView = {
  frameworkId: string;
  subElementKey: string;
  subElementLabel: string;
  status: "candidate-band" | "endpoint";
  lowerP?: number;
  upperP?: number;
  endpoint?: {
    relation: "below-or-around" | "at-least";
    pLevel: number;
  };
  confidence: AssessmentPlacementConfidence;
  claim: string;
  interpretation: string;
  typicalYearAlignment?: string;
  nextVerification: string;
  limitations: string[];
};
