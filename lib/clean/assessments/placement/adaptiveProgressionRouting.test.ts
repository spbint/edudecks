import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_ANCHOR_SETS,
  resolveInitialAnchorWithReserve,
  routeBranchAnchor,
  routeInitialAnchor,
  routeSearchCluster,
} from "./numberOperationsAnchors";
import {
  resolveAdaptiveInitialWithReserve,
  routeAdaptiveBranch,
  routeAdaptiveInitial,
  routeAdaptiveSearch,
} from "./adaptiveProgressionRouting";

const PAIRS = [
  [0, 0],
  [1, 0],
  [1, 1],
] as const;

describe("generic adaptive progression routing", () => {
  it("matches the established Number & Operations initial and branch behaviour", () => {
    for (const set of NUMBER_OPERATIONS_ANCHOR_SETS) {
      for (const initialPair of PAIRS) {
        expect(routeAdaptiveInitial(set, [...initialPair])).toEqual(
          routeInitialAnchor(set, [...initialPair]),
        );

        for (const reserve of [0, 1] as const) {
          const genericResolved = resolveAdaptiveInitialWithReserve(
            set,
            [...initialPair],
            reserve,
          );
          const existingResolved = resolveInitialAnchorWithReserve(
            set,
            [...initialPair],
            reserve,
          );
          expect(genericResolved).toEqual(existingResolved);

          for (const branchPair of PAIRS) {
            expect(
              routeAdaptiveBranch(set, genericResolved, [...branchPair]),
            ).toEqual(
              routeBranchAnchor(set, existingResolved, [...branchPair]),
            );
          }
        }
      }
    }
  });

  it("matches the established Number & Operations search behaviour", () => {
    for (const set of NUMBER_OPERATIONS_ANCHOR_SETS) {
      for (const direction of ["down", "up"] as const) {
        for (let pLevel = set.minP; pLevel <= set.maxP; pLevel += 1) {
          for (const pair of PAIRS) {
            expect(
              routeAdaptiveSearch(set, direction, pLevel, [...pair]),
            ).toEqual(
              routeSearchCluster(set, direction, pLevel, [...pair]),
            );
          }
        }
      }
    }
  });
});
