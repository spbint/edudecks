import {
  applyBoundaryEvidence,
  nextBoundaryTarget,
  nextSearchTarget,
  resolveInitialAnchorWithReserve,
  routeBranchAnchor,
  routeInitialAnchor,
  routeSearchCluster,
  type BranchAnchorRoute,
  type InitialAnchorRoute,
  type NumberOperationsAnchorSet,
  type ProgressionBracket,
} from "./numberOperationsAnchors";
import {
  NUMBER_OPERATIONS_BOUNDARY_CLUSTERS,
  NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS,
  NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS,
  NUMBER_OPERATIONS_SEARCH_CLUSTERS,
} from "./numberOperationsP0Items";

type ClusterScore = 0 | 1 | 2;

export type NumberOperationsRouteCoveragePath = {
  questions: number;
  terminal:
    | "adjacent-band"
    | "top-endpoint"
    | "bottom-endpoint"
    | "unresolved-missing-content";
  trace: string[];
};

export type NumberOperationsRouteCoverageSummary = {
  subElementKey: NumberOperationsAnchorSet["key"];
  pathCount: number;
  minQuestions: number;
  maxQuestions: number;
  unresolvedPaths: number;
  terminalCounts: Record<NumberOperationsRouteCoveragePath["terminal"], number>;
};

function pair(score: ClusterScore): [0 | 1, 0 | 1] {
  if (score === 0) return [0, 0];
  if (score === 1) return [1, 0];
  return [1, 1];
}

function key(set: NumberOperationsAnchorSet, pLevel: number) {
  return `${set.key}-p${pLevel}`;
}

function anchorCount(set: NumberOperationsAnchorSet, pLevel: number) {
  const items =
    NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS[
      key(set, pLevel) as keyof typeof NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS
    ];
  return items?.length || 0;
}

function reserveCount(set: NumberOperationsAnchorSet) {
  const item =
    NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS[
      key(set, set.initialP) as keyof typeof NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS
    ];
  return item ? 1 : 0;
}

function searchCount(set: NumberOperationsAnchorSet, pLevel: number) {
  const items =
    NUMBER_OPERATIONS_SEARCH_CLUSTERS[
      key(set, pLevel) as keyof typeof NUMBER_OPERATIONS_SEARCH_CLUSTERS
    ];
  return items?.length || 0;
}

function boundaryCount(set: NumberOperationsAnchorSet, pLevel: number) {
  const items =
    NUMBER_OPERATIONS_BOUNDARY_CLUSTERS[
      key(set, pLevel) as keyof typeof NUMBER_OPERATIONS_BOUNDARY_CLUSTERS
    ];
  return items?.length || 0;
}

function unresolved(
  questions: number,
  trace: string[],
  reason: string,
): NumberOperationsRouteCoveragePath {
  return {
    questions,
    terminal: "unresolved-missing-content",
    trace: [...trace, reason],
  };
}

function exploreBoundary(
  set: NumberOperationsAnchorSet,
  bracket: ProgressionBracket,
  questions: number,
  trace: string[],
): NumberOperationsRouteCoveragePath[] {
  const targetP = nextBoundaryTarget(bracket);
  if (!targetP) {
    return [
      {
        questions,
        terminal: "adjacent-band",
        trace: [...trace, `Adjacent P${bracket.lowerP}–P${bracket.upperP}`],
      },
    ];
  }

  const count = boundaryCount(set, targetP);
  if (!count) {
    return [
      unresolved(
        questions,
        trace,
        `Missing boundary cluster at P${targetP}`,
      ),
    ];
  }

  return [false, true].flatMap((supported) => {
    const narrowed = applyBoundaryEvidence(bracket, targetP, supported);
    return exploreBoundary(
      set,
      narrowed,
      questions + count,
      [
        ...trace,
        `Boundary P${targetP}: ${supported ? "supported" : "not supported"}`,
      ],
    );
  });
}

function exploreSearch(
  set: NumberOperationsAnchorSet,
  direction: "down" | "up",
  fromP: number,
  questions: number,
  trace: string[],
): NumberOperationsRouteCoveragePath[] {
  const route: BranchAnchorRoute =
    direction === "up"
      ? { kind: "search-up", fromP }
      : { kind: "search-down", fromP };
  const targetP = nextSearchTarget(set, route);

  if (!targetP) {
    return [
      {
        questions,
        terminal: direction === "up" ? "top-endpoint" : "bottom-endpoint",
        trace: [...trace, `Endpoint from P${fromP}`],
      },
    ];
  }

  const count = searchCount(set, targetP);
  if (!count) {
    return [
      unresolved(questions, trace, `Missing search cluster at P${targetP}`),
    ];
  }

  return ([0, 1, 2] as ClusterScore[]).flatMap((score) => {
    const next = routeSearchCluster(set, direction, targetP, pair(score));
    const nextTrace = [
      ...trace,
      `Search P${targetP}: ${score}/2`,
    ];

    if (next.kind === "endpoint") {
      return [
        {
          questions: questions + count,
          terminal:
            next.relation === "at-least" ? "top-endpoint" : "bottom-endpoint",
          trace: nextTrace,
        } satisfies NumberOperationsRouteCoveragePath,
      ];
    }

    if (next.kind === "bracket") {
      return exploreBoundary(
        set,
        { lowerP: next.lowerP, upperP: next.upperP },
        questions + count,
        nextTrace,
      );
    }

    if (next.kind === "search-up" || next.kind === "search-down") {
      return exploreSearch(
        set,
        next.kind === "search-up" ? "up" : "down",
        next.fromP,
        questions + count,
        nextTrace,
      );
    }

    return [
      unresolved(
        questions + count,
        nextTrace,
        "Unexpected awaiting search route",
      ),
    ];
  });
}

function exploreBranch(
  set: NumberOperationsAnchorSet,
  initial: InitialAnchorRoute,
  questions: number,
  trace: string[],
): NumberOperationsRouteCoveragePath[] {
  if (initial.kind !== "down" && initial.kind !== "up") {
    return [
      unresolved(questions, trace, "Initial route did not resolve to a branch"),
    ];
  }

  const count = anchorCount(set, initial.targetP);
  if (!count) {
    return [
      unresolved(
        questions,
        trace,
        `Missing branch anchor at P${initial.targetP}`,
      ),
    ];
  }

  return ([0, 1, 2] as ClusterScore[]).flatMap((score) => {
    const route = routeBranchAnchor(set, initial, pair(score));
    const nextQuestions = questions + count;
    const nextTrace = [
      ...trace,
      `Branch P${initial.targetP}: ${score}/2`,
    ];

    if (route.kind === "bracket") {
      return exploreBoundary(
        set,
        { lowerP: route.lowerP, upperP: route.upperP },
        nextQuestions,
        nextTrace,
      );
    }

    if (route.kind === "search-up" || route.kind === "search-down") {
      return exploreSearch(
        set,
        route.kind === "search-up" ? "up" : "down",
        route.fromP,
        nextQuestions,
        nextTrace,
      );
    }

    return [
      unresolved(nextQuestions, nextTrace, "Unexpected awaiting branch route"),
    ];
  });
}

export function enumerateNumberOperationsRouteCoverage(
  set: NumberOperationsAnchorSet,
): NumberOperationsRouteCoveragePath[] {
  const initialCount = anchorCount(set, set.initialP);
  if (!initialCount) {
    return [
      unresolved(0, [], `Missing initial anchor at P${set.initialP}`),
    ];
  }

  return ([0, 1, 2] as ClusterScore[]).flatMap((score) => {
    const initialPair = pair(score);
    const route = routeInitialAnchor(set, initialPair);
    const trace = [`Initial P${set.initialP}: ${score}/2`];

    if (route.kind === "same-level-extra") {
      const extraCount = reserveCount(set);
      if (!extraCount) {
        return [
          unresolved(
            initialCount,
            trace,
            `Missing reserve probe at P${set.initialP}`,
          ),
        ];
      }

      return ([0, 1] as const).flatMap((reserve) => {
        const resolved = resolveInitialAnchorWithReserve(
          set,
          initialPair,
          reserve,
        );
        return exploreBranch(
          set,
          resolved,
          initialCount + extraCount,
          [...trace, `Reserve P${set.initialP}: ${reserve ? "supported" : "not supported"}`],
        );
      });
    }

    return exploreBranch(set, route, initialCount, trace);
  });
}

export function summarizeNumberOperationsRouteCoverage(
  set: NumberOperationsAnchorSet,
): NumberOperationsRouteCoverageSummary {
  const paths = enumerateNumberOperationsRouteCoverage(set);
  const terminalCounts: NumberOperationsRouteCoverageSummary["terminalCounts"] =
    {
      "adjacent-band": 0,
      "top-endpoint": 0,
      "bottom-endpoint": 0,
      "unresolved-missing-content": 0,
    };

  for (const path of paths) terminalCounts[path.terminal] += 1;

  const questionCounts = paths.map((path) => path.questions);

  return {
    subElementKey: set.key,
    pathCount: paths.length,
    minQuestions: Math.min(...questionCounts),
    maxQuestions: Math.max(...questionCounts),
    unresolvedPaths: terminalCounts["unresolved-missing-content"],
    terminalCounts,
  };
}
