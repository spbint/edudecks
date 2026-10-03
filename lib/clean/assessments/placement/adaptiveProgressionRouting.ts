export type AdaptiveBinaryResult = 0 | 1 | null;

export type AdaptiveProgressionAnchorSet<Key extends string = string> = {
  key: Key;
  minP: number;
  maxP: number;
  lowerP: number;
  initialP: number;
  upperP: number;
};

export type AdaptiveInitialRoute =
  | { kind: "awaiting"; score: null }
  | { kind: "down"; score: 0; targetP: number }
  | { kind: "same-level-extra"; score: 1; targetP: number }
  | { kind: "up"; score: 2; targetP: number };

export type AdaptiveBranchRoute =
  | { kind: "awaiting" }
  | { kind: "search-down"; fromP: number }
  | { kind: "search-up"; fromP: number }
  | { kind: "bracket"; lowerP: number; upperP: number };

export type AdaptiveSearchRoute =
  | { kind: "awaiting" }
  | { kind: "search-down"; fromP: number }
  | { kind: "search-up"; fromP: number }
  | { kind: "bracket"; lowerP: number; upperP: number }
  | {
      kind: "endpoint";
      relation: "below-or-around" | "at-least";
      pLevel: number;
    };

export type AdaptiveProgressionBracket = {
  lowerP: number;
  upperP: number;
};

export function scoreAdaptiveCluster(
  results: [AdaptiveBinaryResult, AdaptiveBinaryResult],
) {
  if (results.some((result) => result === null)) return null;
  return (results[0] || 0) + (results[1] || 0);
}

export function routeAdaptiveInitial(
  anchorSet: AdaptiveProgressionAnchorSet,
  results: [AdaptiveBinaryResult, AdaptiveBinaryResult],
): AdaptiveInitialRoute {
  const score = scoreAdaptiveCluster(results);
  if (score === null) return { kind: "awaiting", score: null };
  if (score === 0) return { kind: "down", score: 0, targetP: anchorSet.lowerP };
  if (score === 1) {
    return {
      kind: "same-level-extra",
      score: 1,
      targetP: anchorSet.initialP,
    };
  }
  return { kind: "up", score: 2, targetP: anchorSet.upperP };
}

export function resolveAdaptiveInitialWithReserve(
  anchorSet: AdaptiveProgressionAnchorSet,
  results: [AdaptiveBinaryResult, AdaptiveBinaryResult],
  reserveResult: AdaptiveBinaryResult,
): AdaptiveInitialRoute {
  const initial = routeAdaptiveInitial(anchorSet, results);
  if (initial.kind !== "same-level-extra" || reserveResult === null) return initial;

  return reserveResult === 1
    ? { kind: "up", score: 2, targetP: anchorSet.upperP }
    : { kind: "down", score: 0, targetP: anchorSet.lowerP };
}

export function routeAdaptiveBranch(
  anchorSet: AdaptiveProgressionAnchorSet,
  initialRoute: AdaptiveInitialRoute,
  results: [AdaptiveBinaryResult, AdaptiveBinaryResult],
): AdaptiveBranchRoute {
  if (
    initialRoute.kind === "awaiting" ||
    initialRoute.kind === "same-level-extra"
  ) {
    return { kind: "awaiting" };
  }

  const score = scoreAdaptiveCluster(results);
  if (score === null) return { kind: "awaiting" };

  if (initialRoute.kind === "up") {
    return score === 2
      ? { kind: "search-up", fromP: anchorSet.upperP }
      : {
          kind: "bracket",
          lowerP: anchorSet.initialP,
          upperP: anchorSet.upperP,
        };
  }

  return score === 0
    ? { kind: "search-down", fromP: anchorSet.lowerP }
    : {
        kind: "bracket",
        lowerP: anchorSet.lowerP,
        upperP: anchorSet.initialP,
      };
}

export function nextAdaptiveSearchTarget(
  anchorSet: AdaptiveProgressionAnchorSet,
  route: AdaptiveBranchRoute | AdaptiveSearchRoute,
) {
  if (route.kind === "search-down") {
    return route.fromP > anchorSet.minP ? route.fromP - 1 : null;
  }
  if (route.kind === "search-up") {
    return route.fromP < anchorSet.maxP ? route.fromP + 1 : null;
  }
  return null;
}

export function routeAdaptiveSearch(
  anchorSet: AdaptiveProgressionAnchorSet,
  direction: "down" | "up",
  pLevel: number,
  results: [AdaptiveBinaryResult, AdaptiveBinaryResult],
): AdaptiveSearchRoute {
  const score = scoreAdaptiveCluster(results);
  if (score === null) return { kind: "awaiting" };

  if (direction === "up") {
    if (score === 2) {
      return pLevel >= anchorSet.maxP
        ? { kind: "endpoint", relation: "at-least", pLevel }
        : { kind: "search-up", fromP: pLevel };
    }
    return {
      kind: "bracket",
      lowerP: Math.max(anchorSet.minP, pLevel - 1),
      upperP: pLevel,
    };
  }

  if (score === 0) {
    return pLevel <= anchorSet.minP
      ? { kind: "endpoint", relation: "below-or-around", pLevel }
      : { kind: "search-down", fromP: pLevel };
  }

  return {
    kind: "bracket",
    lowerP: pLevel,
    upperP: Math.min(anchorSet.maxP, pLevel + 1),
  };
}

export function nextAdaptiveBoundaryTarget(
  bracket: AdaptiveProgressionBracket,
) {
  if (bracket.upperP - bracket.lowerP <= 1) return null;
  return Math.floor((bracket.lowerP + bracket.upperP) / 2);
}

export function applyAdaptiveBoundaryEvidence(
  bracket: AdaptiveProgressionBracket,
  targetP: number,
  supported: boolean,
): AdaptiveProgressionBracket {
  if (targetP <= bracket.lowerP || targetP >= bracket.upperP) {
    throw new Error(
      "Boundary target must sit strictly inside the current bracket.",
    );
  }

  return supported
    ? { lowerP: targetP, upperP: bracket.upperP }
    : { lowerP: bracket.lowerP, upperP: targetP };
}
