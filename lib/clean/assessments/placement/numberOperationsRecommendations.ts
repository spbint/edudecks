import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "./numberOperationsPlacementResult";

export type NumberOperationsRecommendationKind =
  | "practice-next-level"
  | "verify-with-observation"
  | "support-and-recheck"
  | "extend-beyond-progression";

export type NumberOperationsRecommendation = {
  subElementKey: NumberOperationsSubElementKey;
  subElementLabel: string;
  kind: NumberOperationsRecommendationKind;
  targetP: number | null;
  title: string;
  rationale: string;
  recheckRecommended: boolean;
  resourceLinkStatus: "not-yet-mapped";
};

export function buildNumberOperationsRecommendation(
  result: NumberOperationsPlacementResult,
): NumberOperationsRecommendation {
  if (result.confidence === "routing-only") {
    const targetP =
      result.status === "candidate-band"
        ? result.upperP ?? result.lowerP ?? null
        : result.endpoint?.pLevel ?? null;

    return {
      subElementKey: result.subElementKey,
      subElementLabel: result.subElementLabel,
      kind: "verify-with-observation",
      targetP,
      title: "Verify this learning with stronger evidence",
      rationale:
        "The electronic assessment located a useful learning neighbourhood, but this construct needs observed, practical or otherwise stronger evidence before MyLearna should treat the placement as high-confidence.",
      recheckRecommended: true,
      resourceLinkStatus: "not-yet-mapped",
    };
  }

  if (result.status === "endpoint" && result.endpoint) {
    if (result.endpoint.relation === "at-least") {
      return {
        subElementKey: result.subElementKey,
        subElementLabel: result.subElementLabel,
        kind: "extend-beyond-progression",
        targetP: result.endpoint.pLevel,
        title: "Extend beyond this progression",
        rationale:
          "The current evidence reaches the top of this Numeracy progression. The next learning decision should use the full Australian Curriculum Mathematics layer or another higher-resolution source rather than inventing a new P level.",
        recheckRecommended: false,
        resourceLinkStatus: "not-yet-mapped",
      };
    }

    return {
      subElementKey: result.subElementKey,
      subElementLabel: result.subElementLabel,
      kind: "support-and-recheck",
      targetP: result.endpoint.pLevel,
      title: "Strengthen the foundations and check again",
      rationale:
        "The current evidence sits at or below the lower end of this progression. Use practical, scaffolded learning and collect additional evidence before narrowing the placement.",
      recheckRecommended: true,
      resourceLinkStatus: "not-yet-mapped",
    };
  }

  const targetP = result.upperP ?? null;
  return {
    subElementKey: result.subElementKey,
    subElementLabel: result.subElementLabel,
    kind: "practice-next-level",
    targetP,
    title: targetP
      ? `Practise toward P${targetP}`
      : "Practise the next supported learning step",
    rationale:
      result.lowerP !== undefined && result.upperP !== undefined
        ? `Evidence currently supports learning around P${result.lowerP}–P${result.upperP}. Target practice should concentrate on the P${result.upperP} construct, then re-check with fresh items rather than repeating the same questions.`
        : "Use the current evidence band to select the next learning target, then re-check with fresh evidence.",
    recheckRecommended: true,
    resourceLinkStatus: "not-yet-mapped",
  };
}

export function buildNumberOperationsRecommendations(
  results: NumberOperationsPlacementResult[],
) {
  return results.map(buildNumberOperationsRecommendation);
}
