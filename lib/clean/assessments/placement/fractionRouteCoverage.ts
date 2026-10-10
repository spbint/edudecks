import { FRACTION_ANCHOR_SET } from "./fractionAnchors";
import {
  FRACTION_BOUNDARY_CLUSTERS,
  FRACTION_EXECUTABLE_ANCHORS,
  FRACTION_SEARCH_CLUSTERS,
} from "./fractionItems";
import {
  enumerateAdaptiveRouteCoverage,
  summarizeAdaptiveRouteCoverage,
  type AdaptiveCoverageClusterKind,
} from "./adaptiveProgressionCoverage";

function key(pLevel: number) {
  return `interpreting-fractions-p${pLevel}`;
}

function clusterSize(kind: AdaptiveCoverageClusterKind, pLevel: number) {
  if (kind === "anchor") {
    return (
      FRACTION_EXECUTABLE_ANCHORS[
        key(pLevel) as keyof typeof FRACTION_EXECUTABLE_ANCHORS
      ]?.length || 0
    );
  }
  if (kind === "search") {
    return (
      FRACTION_SEARCH_CLUSTERS[
        key(pLevel) as keyof typeof FRACTION_SEARCH_CLUSTERS
      ]?.length || 0
    );
  }
  return (
    FRACTION_BOUNDARY_CLUSTERS[
      key(pLevel) as keyof typeof FRACTION_BOUNDARY_CLUSTERS
    ]?.length || 0
  );
}

export const FRACTION_COVERAGE_CONFIG = {
  anchorSet: FRACTION_ANCHOR_SET,
  clusterSize,
  reserveSize: 1,
} as const;

export function enumerateFractionRouteCoverage() {
  return enumerateAdaptiveRouteCoverage(FRACTION_COVERAGE_CONFIG);
}

export function summarizeFractionRouteCoverage() {
  return summarizeAdaptiveRouteCoverage(FRACTION_COVERAGE_CONFIG);
}
