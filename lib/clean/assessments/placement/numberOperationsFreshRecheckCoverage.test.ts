import { describe, expect, it } from "vitest";
import {
  getNumberOperationsFreshRecheckCoverage,
} from "./numberOperationsFreshRecheckCoverage";
import {
  NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS,
  getNumberOperationsFreshRecheckCluster,
  getNumberOperationsFreshRecheckItems,
} from "./numberOperationsFreshRecheckItems";
import {
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
} from "./numberOperationsItemRegistry";

describe("Number & Operations fresh recheck evidence", () => {
  it("makes the remaining alternate-evidence gap explicit across all 48 progression levels", () => {
    const coverage = getNumberOperationsFreshRecheckCoverage();

    expect(coverage).toMatchObject({
      requiredProgressionLevels: 48,
      coveredProgressionLevels: 27,
      missingProgressionLevels: 21,
      alternateItems: 58,
      complete: false,
    });
  });

  it("recognises the existing NPV confirmation estate as alternate draft evidence", () => {
    for (let pLevel = 1; pLevel <= 10; pLevel += 1) {
      const cluster = getNumberOperationsFreshRecheckCluster(
        "number-place-value",
        pLevel,
      );
      expect(cluster, `NPV P${pLevel}`).not.toBeNull();
      expect(cluster?.source, `NPV P${pLevel}`).toBe("npv-confirmation");
      expect(cluster?.items, `NPV P${pLevel}`).toHaveLength(2);
    }
  });

  it("adds independent lower, initial and upper anchor evidence for the other four continua", () => {
    const expected = [
      ["counting-processes", 2],
      ["counting-processes", 5],
      ["counting-processes", 7],
      ["additive-strategies", 3],
      ["additive-strategies", 6],
      ["additive-strategies", 9],
      ["multiplicative-strategies", 3],
      ["multiplicative-strategies", 6],
      ["multiplicative-strategies", 9],
      ["understanding-money", 2],
      ["understanding-money", 5],
      ["understanding-money", 8],
    ] as const;

    for (const [subElementKey, pLevel] of expected) {
      const cluster = getNumberOperationsFreshRecheckCluster(
        subElementKey,
        pLevel,
      );
      expect(cluster, `${subElementKey} P${pLevel}`).not.toBeNull();
      expect(cluster?.source).toBe("fresh-recheck-draft");
      expect(cluster?.items).toHaveLength(2);
    }

    for (const [subElementKey, pLevel] of [
      ["counting-processes", 5],
      ["additive-strategies", 6],
      ["multiplicative-strategies", 6],
      ["understanding-money", 5],
    ] as const) {
      expect(
        getNumberOperationsFreshRecheckCluster(subElementKey, pLevel)
          ?.reserveItem,
      ).toBeTruthy();
    }
  });

  it("now covers every Counting progression level with alternate evidence", () => {
    const coverage = getNumberOperationsFreshRecheckCoverage();
    for (let pLevel = 1; pLevel <= 8; pLevel += 1) {
      expect(coverage.coveredKeys, `Counting P${pLevel}`).toContain(
        `counting-processes:p${pLevel}`,
      );
    }
  });

  it("covers every lower, initial and upper anchor level with alternate evidence", () => {
    const anchorKeys = [
      "number-place-value:p3",
      "number-place-value:p6",
      "number-place-value:p9",
      "counting-processes:p2",
      "counting-processes:p5",
      "counting-processes:p7",
      "additive-strategies:p3",
      "additive-strategies:p6",
      "additive-strategies:p9",
      "multiplicative-strategies:p3",
      "multiplicative-strategies:p6",
      "multiplicative-strategies:p9",
      "understanding-money:p2",
      "understanding-money:p5",
      "understanding-money:p8",
    ];

    const coverage = getNumberOperationsFreshRecheckCoverage();
    for (const key of anchorKeys) {
      expect(coverage.coveredKeys, key).toContain(key);
    }
  });

  it("keeps fresh recheck item ids separate from the live customer-route item estate", () => {
    const routeIds = new Set(
      NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.map(
        (entry) => entry.item.id,
      ),
    );
    const freshItems = getNumberOperationsFreshRecheckItems();
    const ids = freshItems.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const item of freshItems) {
      expect(routeIds.has(item.id), item.id).toBe(false);
      expect(item.status, item.id).toBe("draft");
    }
  });

  it("does not pretend the first fresh tranche is release-complete", () => {
    const covered = new Set(
      NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS.map(
        (cluster) => `${cluster.subElementKey}:p${cluster.pLevel}`,
      ),
    );

    expect(covered.has("additive-strategies:p8")).toBe(false);
    expect(covered.has("additive-strategies:p10")).toBe(false);
    expect(covered.has("multiplicative-strategies:p10")).toBe(false);
    expect(covered.has("understanding-money:p9")).toBe(false);
  });
});
