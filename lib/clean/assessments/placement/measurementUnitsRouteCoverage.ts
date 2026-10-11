import {
  MEASUREMENT_UNITS_ANCHOR_SET,
} from "./measurementUnitsAnchors";
import {
  MEASUREMENT_UNITS_BOUNDARY_CLUSTERS,
  MEASUREMENT_UNITS_EXECUTABLE_ANCHORS,
  MEASUREMENT_UNITS_SEARCH_CLUSTERS,
} from "./measurementUnitsItems";
import {
  enumerateAdaptiveRouteCoverage,
  summarizeAdaptiveRouteCoverage,
  type AdaptiveCoverageClusterKind,
} from "./adaptiveProgressionCoverage";

function key(pLevel: number) {
  return `understanding-units-measurement-p${pLevel}`;
}

function clusterSize(
  kind: AdaptiveCoverageClusterKind,
  pLevel: number,
) {
  if (kind === "anchor") {
    return (
      MEASUREMENT_UNITS_EXECUTABLE_ANCHORS[
        key(pLevel) as keyof typeof MEASUREMENT_UNITS_EXECUTABLE_ANCHORS
      ]?.length || 0
    );
  }
  if (kind === "search") {
    return (
      MEASUREMENT_UNITS_SEARCH_CLUSTERS[
        key(pLevel) as keyof typeof MEASUREMENT_UNITS_SEARCH_CLUSTERS
      ]?.length || 0
    );
  }
  return (
    MEASUREMENT_UNITS_BOUNDARY_CLUSTERS[
      key(pLevel) as keyof typeof MEASUREMENT_UNITS_BOUNDARY_CLUSTERS
    ]?.length || 0
  );
}

export const MEASUREMENT_UNITS_COVERAGE_CONFIG = {
  anchorSet: MEASUREMENT_UNITS_ANCHOR_SET,
  clusterSize,
  reserveSize: 1,
} as const;

export function enumerateMeasurementUnitsRouteCoverage() {
  return enumerateAdaptiveRouteCoverage(
    MEASUREMENT_UNITS_COVERAGE_CONFIG,
  );
}

export function summarizeMeasurementUnitsRouteCoverage() {
  return summarizeAdaptiveRouteCoverage(
    MEASUREMENT_UNITS_COVERAGE_CONFIG,
  );
}
