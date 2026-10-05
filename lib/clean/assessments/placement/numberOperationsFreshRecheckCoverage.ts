import {
  NUMBER_OPERATIONS_ANCHOR_SETS,
} from "./numberOperationsAnchors";
import {
  NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS,
  getNumberOperationsFreshRecheckItems,
} from "./numberOperationsFreshRecheckItems";

export type NumberOperationsFreshRecheckCoverage = {
  requiredProgressionLevels: number;
  coveredProgressionLevels: number;
  missingProgressionLevels: number;
  alternateItems: number;
  complete: boolean;
  coveredKeys: string[];
  missingKeys: string[];
};

function requiredKeys() {
  return NUMBER_OPERATIONS_ANCHOR_SETS.flatMap((set) =>
    Array.from(
      { length: set.maxP - set.minP + 1 },
      (_, index) => `${set.key}:p${set.minP + index}`,
    ),
  );
}

export function getNumberOperationsFreshRecheckCoverage(): NumberOperationsFreshRecheckCoverage {
  const required = requiredKeys();
  const covered = new Set(
    NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS
      .filter((cluster) => cluster.items.length >= 2)
      .map((cluster) => `${cluster.subElementKey}:p${cluster.pLevel}`),
  );
  const coveredKeys = required.filter((key) => covered.has(key));
  const missingKeys = required.filter((key) => !covered.has(key));

  return {
    requiredProgressionLevels: required.length,
    coveredProgressionLevels: coveredKeys.length,
    missingProgressionLevels: missingKeys.length,
    alternateItems: getNumberOperationsFreshRecheckItems().length,
    complete: missingKeys.length === 0,
    coveredKeys,
    missingKeys,
  };
}
