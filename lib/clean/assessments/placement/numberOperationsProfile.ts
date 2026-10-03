import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "./numberOperationsPlacementResult";

const ORDER: NumberOperationsSubElementKey[] = [
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
];

export type NumberOperationsProfile = {
  frameworkId: "MYL-MATH-AU-NUMERACY-V9";
  expectedSubElements: number;
  assessedSubElements: number;
  complete: boolean;
  directOrProvisionalCount: number;
  routingOnlyCount: number;
  overallStatement: string;
  results: NumberOperationsPlacementResult[];
  nextChecks: Array<{
    subElementKey: NumberOperationsSubElementKey;
    subElementLabel: string;
    action: string;
  }>;
};

export function buildNumberOperationsProfile(
  results: NumberOperationsPlacementResult[],
): NumberOperationsProfile {
  const byKey = new Map<NumberOperationsSubElementKey, NumberOperationsPlacementResult>();

  for (const result of results) {
    byKey.set(result.subElementKey, result);
  }

  const ordered = ORDER.flatMap((key) => {
    const result = byKey.get(key);
    return result ? [result] : [];
  });
  const assessedSubElements = ordered.length;
  const routingOnlyCount = ordered.filter(
    (result) => result.confidence === "routing-only",
  ).length;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    expectedSubElements: ORDER.length,
    assessedSubElements,
    complete: assessedSubElements === ORDER.length,
    directOrProvisionalCount: assessedSubElements - routingOnlyCount,
    routingOnlyCount,
    overallStatement:
      assessedSubElements === ORDER.length
        ? "The Number & Operations profile contains evidence across all five sub-elements. MyLearna does not average these continua into one whole-child level."
        : `The Number & Operations profile currently contains evidence across ${assessedSubElements} of ${ORDER.length} sub-elements. MyLearna does not infer missing sub-elements or average the available results into one whole-child level.`,
    results: ordered,
    nextChecks: ordered.map((result) => ({
      subElementKey: result.subElementKey,
      subElementLabel: result.subElementLabel,
      action: result.nextVerification,
    })),
  };
}
