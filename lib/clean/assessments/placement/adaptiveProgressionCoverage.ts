import {
  applyAdaptiveBoundaryEvidence,
  nextAdaptiveBoundaryTarget,
  nextAdaptiveSearchTarget,
  resolveAdaptiveInitialWithReserve,
  routeAdaptiveBranch,
  routeAdaptiveInitial,
  routeAdaptiveSearch,
  type AdaptiveBranchRoute,
  type AdaptiveInitialRoute,
  type AdaptiveProgressionAnchorSet,
  type AdaptiveProgressionBracket,
} from "./adaptiveProgressionRouting";

export type AdaptiveCoverageClusterKind =
  | "anchor"
  | "search"
  | "boundary";

export type AdaptiveCoveragePath = {
  questions: number;
  terminal:
    | "adjacent-band"
    | "top-endpoint"
    | "bottom-endpoint"
    | "unresolved-missing-content";
  trace: string[];
};

export type AdaptiveCoverageSummary = {
  key: string;
  pathCount: number;
  minQuestions: number;
  maxQuestions: number;
  unresolvedPaths: number;
  terminalCounts: Record<AdaptiveCoveragePath["terminal"], number>;
};

export type AdaptiveCoverageConfig = {
  anchorSet: AdaptiveProgressionAnchorSet;
  clusterSize: (
    kind: AdaptiveCoverageClusterKind,
    pLevel: number,
  ) => number;
  reserveSize: number;
};

type ClusterScore = 0 | 1 | 2;

function pair(score: ClusterScore): [0 | 1, 0 | 1] {
  if (score === 0) return [0, 0];
  if (score === 1) return [1, 0];
  return [1, 1];
}

function unresolved(
  questions: number,
  trace: string[],
  reason: string,
): AdaptiveCoveragePath {
  return {
    questions,
    terminal: "unresolved-missing-content",
    trace: [...trace, reason],
  };
}

function exploreBoundary(
  config: AdaptiveCoverageConfig,
  bracket: AdaptiveProgressionBracket,
  questions: number,
  trace: string[],
): AdaptiveCoveragePath[] {
  const targetP = nextAdaptiveBoundaryTarget(bracket);
  if (!targetP) {
    return [
      {
        questions,
        terminal: "adjacent-band",
        trace: [...trace, `Adjacent P${bracket.lowerP}–P${bracket.upperP}`],
      },
    ];
  }

  const count = config.clusterSize("boundary", targetP);
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
    const narrowed = applyAdaptiveBoundaryEvidence(
      bracket,
      targetP,
      supported,
    );
    return exploreBoundary(
      config,
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
  config: AdaptiveCoverageConfig,
  direction: "down" | "up",
  fromP: number,
  questions: number,
  trace: string[],
): AdaptiveCoveragePath[] {
  const route: AdaptiveBranchRoute =
    direction === "up"
      ? { kind: "search-up", fromP }
      : { kind: "search-down", fromP };
  const targetP = nextAdaptiveSearchTarget(config.anchorSet, route);

  if (!targetP) {
    return [
      {
        questions,
        terminal:
          direction === "up" ? "top-endpoint" : "bottom-endpoint",
        trace: [...trace, `Endpoint from P${fromP}`],
      },
    ];
  }

  const count = config.clusterSize("search", targetP);
  if (!count) {
    return [
      unresolved(
        questions,
        trace,
        `Missing search cluster at P${targetP}`,
      ),
    ];
  }

  return ([0, 1, 2] as ClusterScore[]).flatMap((score) => {
    const next = routeAdaptiveSearch(
      config.anchorSet,
      direction,
      targetP,
      pair(score),
    );
    const nextTrace = [...trace, `Search P${targetP}: ${score}/2`];

    if (next.kind === "endpoint") {
      return [
        {
          questions: questions + count,
          terminal:
            next.relation === "at-least"
              ? "top-endpoint"
              : "bottom-endpoint",
          trace: nextTrace,
        } satisfies AdaptiveCoveragePath,
      ];
    }

    if (next.kind === "bracket") {
      return exploreBoundary(
        config,
        { lowerP: next.lowerP, upperP: next.upperP },
        questions + count,
        nextTrace,
      );
    }

    if (next.kind === "search-up" || next.kind === "search-down") {
      return exploreSearch(
        config,
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
  config: AdaptiveCoverageConfig,
  initial: AdaptiveInitialRoute,
  questions: number,
  trace: string[],
): AdaptiveCoveragePath[] {
  if (initial.kind !== "down" && initial.kind !== "up") {
    return [
      unresolved(
        questions,
        trace,
        "Initial route did not resolve to a branch",
      ),
    ];
  }

  const count = config.clusterSize("anchor", initial.targetP);
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
    const route = routeAdaptiveBranch(
      config.anchorSet,
      initial,
      pair(score),
    );
    const nextQuestions = questions + count;
    const nextTrace = [
      ...trace,
      `Branch P${initial.targetP}: ${score}/2`,
    ];

    if (route.kind === "bracket") {
      return exploreBoundary(
        config,
        { lowerP: route.lowerP, upperP: route.upperP },
        nextQuestions,
        nextTrace,
      );
    }

    if (route.kind === "search-up" || route.kind === "search-down") {
      return exploreSearch(
        config,
        route.kind === "search-up" ? "up" : "down",
        route.fromP,
        nextQuestions,
        nextTrace,
      );
    }

    return [
      unresolved(
        nextQuestions,
        nextTrace,
        "Unexpected awaiting branch route",
      ),
    ];
  });
}

export function enumerateAdaptiveRouteCoverage(
  config: AdaptiveCoverageConfig,
): AdaptiveCoveragePath[] {
  const initialCount = config.clusterSize(
    "anchor",
    config.anchorSet.initialP,
  );
  if (!initialCount) {
    return [
      unresolved(
        0,
        [],
        `Missing initial anchor at P${config.anchorSet.initialP}`,
      ),
    ];
  }

  return ([0, 1, 2] as ClusterScore[]).flatMap((score) => {
    const initialPair = pair(score);
    const route = routeAdaptiveInitial(
      config.anchorSet,
      initialPair,
    );
    const trace = [
      `Initial P${config.anchorSet.initialP}: ${score}/2`,
    ];

    if (route.kind === "same-level-extra") {
      if (!config.reserveSize) {
        return [
          unresolved(
            initialCount,
            trace,
            `Missing reserve probe at P${config.anchorSet.initialP}`,
          ),
        ];
      }

      return ([0, 1] as const).flatMap((reserve) => {
        const resolved = resolveAdaptiveInitialWithReserve(
          config.anchorSet,
          initialPair,
          reserve,
        );
        return exploreBranch(
          config,
          resolved,
          initialCount + config.reserveSize,
          [
            ...trace,
            `Reserve P${config.anchorSet.initialP}: ${reserve ? "supported" : "not supported"}`,
          ],
        );
      });
    }

    return exploreBranch(config, route, initialCount, trace);
  });
}

export function summarizeAdaptiveRouteCoverage(
  config: AdaptiveCoverageConfig,
): AdaptiveCoverageSummary {
  const paths = enumerateAdaptiveRouteCoverage(config);
  const terminalCounts: AdaptiveCoverageSummary["terminalCounts"] = {
    "adjacent-band": 0,
    "top-endpoint": 0,
    "bottom-endpoint": 0,
    "unresolved-missing-content": 0,
  };

  for (const path of paths) {
    terminalCounts[path.terminal] += 1;
  }

  const questionCounts = paths.map((path) => path.questions);

  return {
    key: config.anchorSet.key,
    pathCount: paths.length,
    minQuestions: Math.min(...questionCounts),
    maxQuestions: Math.max(...questionCounts),
    unresolvedPaths: terminalCounts["unresolved-missing-content"],
    terminalCounts,
  };
}
