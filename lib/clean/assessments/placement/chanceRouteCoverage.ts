import { CHANCE_ANCHOR_SET } from "./chanceAnchors";
import {
  CHANCE_BOUNDARY_CLUSTERS,
  CHANCE_EXECUTABLE_ANCHORS,
  CHANCE_SEARCH_CLUSTERS,
} from "./chanceItems";
import {
  enumerateAdaptiveRouteCoverage,
  summarizeAdaptiveRouteCoverage,
  type AdaptiveCoverageClusterKind,
} from "./adaptiveProgressionCoverage";

function key(pLevel: number) {
  return `understanding-chance-p${pLevel}`;
}

function clusterSize(kind: AdaptiveCoverageClusterKind, pLevel: number) {
  if (kind === "anchor") {
    return (
      CHANCE_EXECUTABLE_ANCHORS[
        key(pLevel) as keyof typeof CHANCE_EXECUTABLE_ANCHORS
      ]?.length || 0
    );
  }
  if (kind === "search") {
    return (
      CHANCE_SEARCH_CLUSTERS[
        key(pLevel) as keyof typeof CHANCE_SEARCH_CLUSTERS
      ]?.length || 0
    );
  }
  return (
    CHANCE_BOUNDARY_CLUSTERS[
      key(pLevel) as keyof typeof CHANCE_BOUNDARY_CLUSTERS
    ]?.length || 0
  );
}

export const CHANCE_COVERAGE_CONFIG = {
  anchorSet: CHANCE_ANCHOR_SET,
  clusterSize,
  reserveSize: 1,
} as const;

export function enumerateChanceRouteCoverage() {
  return enumerateAdaptiveRouteCoverage(CHANCE_COVERAGE_CONFIG);
}

export function summarizeChanceRouteCoverage() {
  return summarizeAdaptiveRouteCoverage(CHANCE_COVERAGE_CONFIG);
}
