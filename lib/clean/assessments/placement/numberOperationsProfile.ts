import type {
  NumberOperationsPlacementResult,
  NumberOperationsSubElementKey,
} from "./numberOperationsPlacementResult";
import {
  buildNumberOperationsRecommendations,
  type NumberOperationsRecommendation,
} from "./numberOperationsRecommendations";

export const NUMBER_OPERATIONS_PROFILE_ORDER: NumberOperationsSubElementKey[] = [
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
];

export type NumberOperationsProfile = {
  frameworkId: "MYL-MATH-AU-NUMERACY-V9";
  expectedSubElementKeys: NumberOperationsSubElementKey[];
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
  recommendations: NumberOperationsRecommendation[];
};

function resolveExpectedSubElementKeys(
  requested?: NumberOperationsSubElementKey[],
) {
  if (!requested?.length) return [...NUMBER_OPERATIONS_PROFILE_ORDER];
  const requestedSet = new Set(requested);
  const scoped = NUMBER_OPERATIONS_PROFILE_ORDER.filter((key) =>
    requestedSet.has(key),
  );
  return scoped.length ? scoped : [...NUMBER_OPERATIONS_PROFILE_ORDER];
}

function profileStatement(input: {
  expectedSubElementKeys: NumberOperationsSubElementKey[];
  assessedSubElements: number;
  complete: boolean;
}) {
  const expected = input.expectedSubElementKeys.length;

  if (expected === 1) {
    return input.complete
      ? "The Number & Operations profile contains evidence for the selected area only. MyLearna does not treat this focused result as a whole Number & Operations or whole-Maths level."
      : "The selected Number & Operations area does not yet have reportable electronic evidence. MyLearna leaves it open rather than inferring a result.";
  }

  if (expected === NUMBER_OPERATIONS_PROFILE_ORDER.length && input.complete) {
    return "The Number & Operations profile contains evidence across all five sub-elements. MyLearna does not average these continua into one whole-child level.";
  }

  return `The Number & Operations profile currently contains evidence across ${input.assessedSubElements} of ${expected} selected sub-elements. MyLearna does not infer missing sub-elements or average the available results into one whole-child level.`;
}

export function buildNumberOperationsProfile(
  results: NumberOperationsPlacementResult[],
  options: {
    expectedSubElementKeys?: NumberOperationsSubElementKey[];
  } = {},
): NumberOperationsProfile {
  const expectedSubElementKeys = resolveExpectedSubElementKeys(
    options.expectedSubElementKeys,
  );
  const expectedSet = new Set(expectedSubElementKeys);
  const byKey = new Map<
    NumberOperationsSubElementKey,
    NumberOperationsPlacementResult
  >();

  for (const result of results) {
    if (expectedSet.has(result.subElementKey)) {
      byKey.set(result.subElementKey, result);
    }
  }

  const ordered = expectedSubElementKeys.flatMap((key) => {
    const result = byKey.get(key);
    return result ? [result] : [];
  });
  const assessedSubElements = ordered.length;
  const expectedSubElements = expectedSubElementKeys.length;
  const complete = assessedSubElements === expectedSubElements;
  const routingOnlyCount = ordered.filter(
    (result) => result.confidence === "routing-only",
  ).length;

  return {
    frameworkId: "MYL-MATH-AU-NUMERACY-V9",
    expectedSubElementKeys,
    expectedSubElements,
    assessedSubElements,
    complete,
    directOrProvisionalCount: assessedSubElements - routingOnlyCount,
    routingOnlyCount,
    overallStatement: profileStatement({
      expectedSubElementKeys,
      assessedSubElements,
      complete,
    }),
    results: ordered,
    nextChecks: ordered.map((result) => ({
      subElementKey: result.subElementKey,
      subElementLabel: result.subElementLabel,
      action: result.nextVerification,
    })),
    recommendations: buildNumberOperationsRecommendations(ordered),
  };
}
