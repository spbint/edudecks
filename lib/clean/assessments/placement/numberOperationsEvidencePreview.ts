import type {
  NumberOperationsProfile,
} from "./numberOperationsProfile";
import type {
  NumberOperationsPlacementResult,
} from "./numberOperationsPlacementResult";

export type NumberOperationsEvidencePreview = {
  kind: "mylearna-assessment-evidence-preview-v1";
  sourceType: "mylearna_assessment";
  sourceFormId: "number-operations-baseline";
  frameworkId: NumberOperationsProfile["frameworkId"];
  title: string;
  summary: string;
  learningArea: "Mathematics";
  assessedSubElements: number;
  expectedSubElements: number;
  routingOnlySubElements: number;
  curriculumNodeIds: string[];
  resultBands: Array<{
    subElementKey: NumberOperationsPlacementResult["subElementKey"];
    subElementLabel: string;
    bandLabel: string;
    confidence: NumberOperationsPlacementResult["confidence"];
  }>;
  requiresParentConfirmation: true;
  portfolioEligibleAfterConfirmation: true;
  reportEligibleAfterConfirmation: true;
};

function bandLabel(result: NumberOperationsPlacementResult) {
  if (
    result.status === "candidate-band" &&
    result.lowerP !== undefined &&
    result.upperP !== undefined
  ) {
    return `P${result.lowerP}–P${result.upperP}`;
  }

  if (result.endpoint) {
    return result.endpoint.relation === "at-least"
      ? `At least P${result.endpoint.pLevel}`
      : `Below / around P${result.endpoint.pLevel}`;
  }

  return "Evidence captured";
}

function curriculumNodeId(result: NumberOperationsPlacementResult) {
  if (
    result.status === "candidate-band" &&
    result.lowerP !== undefined &&
    result.upperP !== undefined
  ) {
    return [
      "mylearna",
      "mathematics",
      "au-numeracy-v9",
      result.subElementKey,
      `p${result.lowerP}-p${result.upperP}`,
    ].join("::");
  }

  if (result.endpoint) {
    return [
      "mylearna",
      "mathematics",
      "au-numeracy-v9",
      result.subElementKey,
      result.endpoint.relation === "at-least"
        ? `at-least-p${result.endpoint.pLevel}`
        : `below-or-around-p${result.endpoint.pLevel}`,
    ].join("::");
  }

  return [
    "mylearna",
    "mathematics",
    "au-numeracy-v9",
    result.subElementKey,
    "evidence",
  ].join("::");
}

export function buildNumberOperationsEvidencePreview(
  profile: NumberOperationsProfile,
): NumberOperationsEvidencePreview {
  const results = profile.results.map((result) => ({
    subElementKey: result.subElementKey,
    subElementLabel: result.subElementLabel,
    bandLabel: bandLabel(result),
    confidence: result.confidence,
  }));

  const coverage =
    profile.assessedSubElements === profile.expectedSubElements
      ? "all five Number & Operations sub-elements"
      : `${profile.assessedSubElements} of ${profile.expectedSubElements} Number & Operations sub-elements`;

  const routingNote = profile.routingOnlyCount
    ? ` ${profile.routingOnlyCount} result${profile.routingOnlyCount === 1 ? "" : "s"} remain routing-only and need stronger or observed evidence before a higher-confidence statement.`
    : "";

  return {
    kind: "mylearna-assessment-evidence-preview-v1",
    sourceType: "mylearna_assessment",
    sourceFormId: "number-operations-baseline",
    frameworkId: profile.frameworkId,
    title: "MyLearna Number & Operations baseline",
    summary:
      `Assessment evidence was collected across ${coverage}. Results remain separate progression bands rather than being averaged into one mathematics level.${routingNote}`,
    learningArea: "Mathematics",
    assessedSubElements: profile.assessedSubElements,
    expectedSubElements: profile.expectedSubElements,
    routingOnlySubElements: profile.routingOnlyCount,
    curriculumNodeIds: profile.results.map(curriculumNodeId),
    resultBands: results,
    requiresParentConfirmation: true,
    portfolioEligibleAfterConfirmation: true,
    reportEligibleAfterConfirmation: true,
  };
}
