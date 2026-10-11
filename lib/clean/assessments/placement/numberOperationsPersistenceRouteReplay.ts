import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { isNumberOperationsAssetApproved } from "./numberOperationsAssetApprovals";
import {
  applyBoundaryEvidence,
  getNumberOperationsAnchorSet,
  getPlacementEvidencePolicy,
  getProgressionEvidenceMode,
  nextBoundaryTarget,
  nextSearchTarget,
  resolveInitialAnchorWithReserve,
  routeBranchAnchor,
  routeInitialAnchor,
  routeSearchCluster,
  type BinaryAnchorResult,
  type NumberOperationsAnchorSet,
} from "./numberOperationsAnchors";
import {
  NUMBER_OPERATIONS_BOUNDARY_CLUSTERS,
  NUMBER_OPERATIONS_SEARCH_CLUSTERS,
} from "./numberOperationsP0Items";
import {
  buildNumberOperationsCandidateBandResult,
  buildNumberOperationsEndpointResult,
  type NumberOperationsPlacementResult,
  type NumberOperationsSubElementKey,
} from "./numberOperationsPlacementResult";
import {
  buildNumberOperationsProfile,
} from "./numberOperationsProfile";
import {
  buildNumberOperationsEvidencePreview,
} from "./numberOperationsEvidencePreview";
import type {
  NumberOperationsBaselinePersistenceDraft,
  NumberOperationsBaselineResponsePersistenceDraft,
} from "./numberOperationsPersistenceDraft";
import {
  sanitizeNumberOperationsBaselinePersistenceDraft,
} from "./numberOperationsPersistenceServerValidation";

type StageGroup = {
  stageKind: NumberOperationsBaselineResponsePersistenceDraft["stageKind"];
  progressionLevel: number;
  stageDirection: "down" | "up" | null;
  bracketLowerP: number | null;
  bracketUpperP: number | null;
  responses: NumberOperationsBaselineResponsePersistenceDraft[];
};

function stageIdentity(response: NumberOperationsBaselineResponsePersistenceDraft) {
  return [
    response.stageKind,
    response.progressionLevel,
    response.stageDirection ?? "",
    response.bracketLowerP ?? "",
    response.bracketUpperP ?? "",
  ].join("|");
}

function groupResponses(
  responses: NumberOperationsBaselineResponsePersistenceDraft[],
): StageGroup[] {
  const groups: StageGroup[] = [];
  for (const response of [...responses].sort(
    (left, right) => left.itemOrder - right.itemOrder,
  )) {
    const previous = groups[groups.length - 1];
    if (
      previous &&
      stageIdentity(previous.responses[0]!) === stageIdentity(response)
    ) {
      previous.responses.push(response);
      continue;
    }
    groups.push({
      stageKind: response.stageKind,
      progressionLevel: response.progressionLevel,
      stageDirection: response.stageDirection,
      bracketLowerP: response.bracketLowerP,
      bracketUpperP: response.bracketUpperP,
      responses: [response],
    });
  }
  return groups;
}

function assessmentResponses(group: StageGroup): MyLearnaAssessmentResponse[] {
  return group.responses.map((response) => ({
    itemId: response.itemId,
    selectedOptionIds: [...response.selectedOptionIds],
    ...(response.responseValue !== null
      ? { responseValue: response.responseValue }
      : {}),
    correct: response.correct,
    skillId: response.skillId,
    misconceptionTags: [...response.misconceptionTags],
    ...(response.timeSpentSeconds !== null
      ? { timeSpentSeconds: response.timeSpentSeconds }
      : {}),
  }));
}

function pair(group: StageGroup): [BinaryAnchorResult, BinaryAnchorResult] {
  const responses = assessmentResponses(group);
  return [
    responses[0] ? (responses[0].correct ? 1 : 0) : null,
    responses[1] ? (responses[1].correct ? 1 : 0) : null,
  ];
}

function approvedToRoute(set: NumberOperationsAnchorSet, pLevel: number) {
  const evidenceMode = getProgressionEvidenceMode(set, pLevel);
  return getPlacementEvidencePolicy({
    evidenceMode,
    assetApproved: isNumberOperationsAssetApproved({
      subElementKey: set.key,
      pLevel,
    }),
  }).mayRoute;
}

function evidenceLimitationsForRange(
  set: NumberOperationsAnchorSet,
  lowerP: number,
  upperP: number,
) {
  const limitations = new Set<string>();
  for (let pLevel = lowerP; pLevel <= upperP; pLevel += 1) {
    const evidenceMode = getProgressionEvidenceMode(set, pLevel);
    if (evidenceMode === "direct") continue;
    limitations.add(
      getPlacementEvidencePolicy({
        evidenceMode,
        assetApproved: isNumberOperationsAssetApproved({
          subElementKey: set.key,
          pLevel,
        }),
      }).reason,
    );
  }
  return Array.from(limitations);
}

function bandResult(
  set: NumberOperationsAnchorSet,
  lowerP: number,
  upperP: number,
) {
  return buildNumberOperationsCandidateBandResult({
    subElementKey: set.key,
    lowerP,
    upperP,
    evidenceLimitations: evidenceLimitationsForRange(set, lowerP, upperP),
  });
}

function endpointResult(
  set: NumberOperationsAnchorSet,
  relation: "below-or-around" | "at-least",
  pLevel: number,
) {
  const evidenceMode = getProgressionEvidenceMode(set, pLevel);
  const evidenceLimitations =
    evidenceMode === "direct"
      ? []
      : [
          getPlacementEvidencePolicy({
            evidenceMode,
            assetApproved: isNumberOperationsAssetApproved({
              subElementKey: set.key,
              pLevel,
            }),
          }).reason,
        ];
  return buildNumberOperationsEndpointResult({
    subElementKey: set.key,
    relation,
    pLevel,
    evidenceLimitations,
  });
}

function hasSearchCluster(set: NumberOperationsAnchorSet, pLevel: number) {
  const key = `${set.key}-p${pLevel}` as keyof typeof NUMBER_OPERATIONS_SEARCH_CLUSTERS;
  return Boolean(NUMBER_OPERATIONS_SEARCH_CLUSTERS[key]);
}

function hasBoundaryCluster(set: NumberOperationsAnchorSet, pLevel: number) {
  const key = `${set.key}-p${pLevel}` as keyof typeof NUMBER_OPERATIONS_BOUNDARY_CLUSTERS;
  return Boolean(NUMBER_OPERATIONS_BOUNDARY_CLUSTERS[key]);
}

function replayArea(
  subElementKey: NumberOperationsSubElementKey,
  responses: NumberOperationsBaselineResponsePersistenceDraft[],
): NumberOperationsPlacementResult | null {
  const set = getNumberOperationsAnchorSet(subElementKey);
  if (!set) throw new Error(`Unknown Number & Operations area: ${subElementKey}`);

  const groups = groupResponses(responses);
  let cursor = 0;

  const finish = (result: NumberOperationsPlacementResult | null) => {
    if (cursor !== groups.length) {
      throw new Error(
        `Unexpected extra response stages after the ${subElementKey} route resolved.`,
      );
    }
    return result;
  };

  const consume = (input: {
    stageKind: StageGroup["stageKind"];
    pLevel: number;
    count: number;
    direction?: "down" | "up" | null;
    bracket?: { lowerP: number; upperP: number } | null;
  }) => {
    const group = groups[cursor];
    if (!group) return null;

    const expectedDirection = input.direction ?? null;
    const expectedLower = input.bracket?.lowerP ?? null;
    const expectedUpper = input.bracket?.upperP ?? null;

    if (
      group.stageKind !== input.stageKind ||
      group.progressionLevel !== input.pLevel ||
      group.stageDirection !== expectedDirection ||
      group.bracketLowerP !== expectedLower ||
      group.bracketUpperP !== expectedUpper
    ) {
      throw new Error(
        `Unexpected ${subElementKey} route stage at item order ${group.responses[0]?.itemOrder ?? "?"}.`,
      );
    }
    if (group.responses.length !== input.count) {
      throw new Error(
        `${subElementKey} ${input.stageKind} P${input.pLevel} expected ${input.count} responses.`,
      );
    }

    cursor += 1;
    return group;
  };

  const initial = consume({
    stageKind: "initial",
    pLevel: set.initialP,
    count: 2,
  });
  if (!initial) return finish(null);

  const initialPair = pair(initial);
  let initialRoute = routeInitialAnchor(set, initialPair);

  if (initialRoute.kind === "same-level-extra") {
    const reserve = consume({
      stageKind: "reserve",
      pLevel: set.initialP,
      count: 1,
    });
    if (!reserve) return finish(null);
    const reserveResponse = assessmentResponses(reserve)[0];
    initialRoute = resolveInitialAnchorWithReserve(
      set,
      initialPair,
      reserveResponse ? (reserveResponse.correct ? 1 : 0) : null,
    );
  }

  if (initialRoute.kind !== "down" && initialRoute.kind !== "up") {
    return finish(null);
  }

  if (!approvedToRoute(set, initialRoute.targetP)) {
    return finish(null);
  }

  const branch = consume({
    stageKind: "branch",
    pLevel: initialRoute.targetP,
    count: 2,
    direction: initialRoute.kind,
  });
  if (!branch) return finish(null);

  let route = routeBranchAnchor(set, initialRoute, pair(branch));

  const resolveBracket = (
    bracket: { lowerP: number; upperP: number },
  ): NumberOperationsPlacementResult | null => {
    const targetP = nextBoundaryTarget(bracket);
    if (!targetP) return bandResult(set, bracket.lowerP, bracket.upperP);
    if (!approvedToRoute(set, targetP)) return null;
    if (!hasBoundaryCluster(set, targetP)) {
      return bandResult(set, bracket.lowerP, bracket.upperP);
    }

    const boundary = consume({
      stageKind: "boundary",
      pLevel: targetP,
      count: 3,
      bracket,
    });
    if (!boundary) return null;

    const supported =
      assessmentResponses(boundary).filter((response) => response.correct).length >=
      2;
    return resolveBracket(
      applyBoundaryEvidence(bracket, targetP, supported),
    );
  };

  while (true) {
    if (route.kind === "bracket") {
      return finish(
        resolveBracket({
          lowerP: route.lowerP,
          upperP: route.upperP,
        }),
      );
    }

    if (route.kind !== "search-down" && route.kind !== "search-up") {
      return finish(null);
    }

    const direction = route.kind === "search-up" ? "up" : "down";
    const targetP = nextSearchTarget(set, route);
    if (!targetP) return finish(null);
    if (!approvedToRoute(set, targetP)) return finish(null);
    if (!hasSearchCluster(set, targetP)) return finish(null);

    const search = consume({
      stageKind: "search",
      pLevel: targetP,
      count: 2,
      direction,
    });
    if (!search) return finish(null);

    const searchRoute = routeSearchCluster(set, direction, targetP, pair(search));

    if (searchRoute.kind === "endpoint") {
      return finish(
        endpointResult(set, searchRoute.relation, searchRoute.pLevel),
      );
    }

    if (searchRoute.kind === "bracket") {
      return finish(
        resolveBracket({
          lowerP: searchRoute.lowerP,
          upperP: searchRoute.upperP,
        }),
      );
    }

    if (
      searchRoute.kind === "search-down" ||
      searchRoute.kind === "search-up"
    ) {
      route = searchRoute;
      continue;
    }

    return finish(null);
  }
}

function stable(value: unknown) {
  return JSON.stringify(value);
}

export function buildTrustedNumberOperationsBaselinePersistenceDraft(
  draft: NumberOperationsBaselinePersistenceDraft,
  options: { allowNonPublishedItems?: boolean } = {},
): NumberOperationsBaselinePersistenceDraft {
  const sanitized = sanitizeNumberOperationsBaselinePersistenceDraft(draft, {
    allowNonPublishedItems: options.allowNonPublishedItems,
  });

  const scope = sanitized.attempt
    .scopeSubElements as NumberOperationsSubElementKey[];
  const results: NumberOperationsPlacementResult[] = [];
  const unresolved: NumberOperationsSubElementKey[] = [];

  for (const subElementKey of scope) {
    const areaResponses = sanitized.responses.filter(
      (response) => response.subElementKey === subElementKey,
    );
    const result = replayArea(subElementKey, areaResponses);
    if (result) results.push(result);
    else unresolved.push(subElementKey);
  }

  const profile = buildNumberOperationsProfile(results, {
    expectedSubElementKeys: scope,
  });
  const evidencePreview = buildNumberOperationsEvidencePreview(profile);
  const status = unresolved.length ? "partial" : "complete";

  if (
    sanitized.attempt.assessedSubElements !== profile.assessedSubElements ||
    sanitized.attempt.expectedSubElements !== profile.expectedSubElements ||
    stable(sanitized.attempt.unresolvedSubElements) !== stable(unresolved) ||
    sanitized.attempt.status !== status
  ) {
    throw new Error(
      "Browser baseline completion state does not match replayed evidence.",
    );
  }

  if (stable(sanitized.attempt.profileSnapshot) !== stable(profile)) {
    throw new Error(
      "Browser placement profile does not match replayed trusted evidence.",
    );
  }

  if (
    stable(sanitized.attempt.evidencePreviewSnapshot) !==
    stable(evidencePreview)
  ) {
    throw new Error(
      "Browser evidence preview does not match replayed trusted evidence.",
    );
  }

  return {
    attempt: {
      ...sanitized.attempt,
      status,
      assessedSubElements: profile.assessedSubElements,
      expectedSubElements: profile.expectedSubElements,
      scopeSubElements: [...scope],
      unresolvedSubElements: [...unresolved],
      profileSnapshot: profile,
      evidencePreviewSnapshot: evidencePreview,
    },
    responses: sanitized.responses,
  };
}
