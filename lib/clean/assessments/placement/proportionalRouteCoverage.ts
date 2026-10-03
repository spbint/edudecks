import { PROPORTIONAL_ANCHOR_SET } from "./proportionalAnchors";
import {
  PROPORTIONAL_BOUNDARY_CLUSTERS,
  PROPORTIONAL_EXECUTABLE_ANCHORS,
  PROPORTIONAL_SEARCH_CLUSTERS,
} from "./proportionalItems";
import {
  enumerateAdaptiveRouteCoverage,
  summarizeAdaptiveRouteCoverage,
  type AdaptiveCoverageClusterKind,
} from "./adaptiveProgressionCoverage";

function key(pLevel: number) {
  return `proportional-thinking-p${pLevel}`;
}

function clusterSize(kind: AdaptiveCoverageClusterKind, pLevel: number) {
  if (kind === "anchor") {
    return PROPORTIONAL_EXECUTABLE_ANCHORS[
      key(pLevel) as keyof typeof PROPORTIONAL_EXECUTABLE_ANCHORS
    ]?.length || 0;
  }
  if (kind === "search") {
    return PROPORTIONAL_SEARCH_CLUSTERS[
      key(pLevel) as keyof typeof PROPORTIONAL_SEARCH_CLUSTERS
    ]?.length || 0;
  }
  return PROPORTIONAL_BOUNDARY_CLUSTERS[
    key(pLevel) as keyof typeof PROPORTIONAL_BOUNDARY_CLUSTERS
  ]?.length || 0;
}

export const PROPORTIONAL_COVERAGE_CONFIG = {
  anchorSet: PROPORTIONAL_ANCHOR_SET,
  clusterSize,
  reserveSize: 1,
} as const;

export function enumerateProportionalRouteCoverage() {
  return enumerateAdaptiveRouteCoverage(PROPORTIONAL_COVERAGE_CONFIG);
}

export function summarizeProportionalRouteCoverage() {
  return summarizeAdaptiveRouteCoverage(PROPORTIONAL_COVERAGE_CONFIG);
}
