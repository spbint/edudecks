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
      coveredProgressionLevels: 14,
      missingProgressionLevels: 34,
      alternateItems: 32,
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

  it("adds independent initial-level recheck clusters for the other four continua", () => {
    const expected = [
      ["counting-processes", 5],
      ["additive-strategies", 6],
      ["multiplicative-strategies", 6],
      ["understanding-money", 5],
    ] as const;

    for (const [subElementKey, pLevel] of expected) {
      const cluster = getNumberOperationsFreshRecheckCluster(
        subElementKey,
        pLevel,
      );
      expect(cluster, `${subElementKey} P${pLevel}`).not.toBeNull();
      expect(cluster?.source).toBe("fresh-recheck-draft");
      expect(cluster?.items).toHaveLength(2);
      expect(cluster?.reserveItem).toBeTruthy();
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

    expect(covered.has("counting-processes:p4")).toBe(false);
    expect(covered.has("additive-strategies:p9")).toBe(false);
    expect(covered.has("multiplicative-strategies:p10")).toBe(false);
    expect(covered.has("understanding-money:p8")).toBe(false);
  });
});
