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
  it("provides independent alternate evidence across all 48 progression levels", () => {
    const coverage = getNumberOperationsFreshRecheckCoverage();

    expect(coverage).toMatchObject({
      requiredProgressionLevels: 48,
      coveredProgressionLevels: 48,
      missingProgressionLevels: 0,
      alternateItems: 100,
      complete: true,
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

  it("provides two-item clusters for every level in the other four continua", () => {
    const continua = [
      ["counting-processes", 8],
      ["additive-strategies", 10],
      ["multiplicative-strategies", 10],
      ["understanding-money", 10],
    ] as const;

    for (const [subElementKey, maxP] of continua) {
      for (let pLevel = 1; pLevel <= maxP; pLevel += 1) {
        const cluster = getNumberOperationsFreshRecheckCluster(
          subElementKey,
          pLevel,
        );
        expect(cluster, `${subElementKey} P${pLevel}`).not.toBeNull();
        expect(cluster?.source).toBe("fresh-recheck-draft");
        expect(cluster?.items).toHaveLength(2);
      }
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

  it("keeps every alternate item draft, versioned, tagged and canonically coded", () => {
    for (const cluster of NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS) {
      const prefix = {
        "number-place-value": "NPV",
        "counting-processes": "CNT",
        "additive-strategies": "ADD",
        "multiplicative-strategies": "MUL",
        "understanding-money": "MON",
      }[cluster.subElementKey];
      const expectedCode = `MYL-MATH-PROG-NSA-${prefix}-P${String(cluster.pLevel).padStart(2, "0")}`;

      for (const item of cluster.items) {
        expect(item.status, item.id).toBe("draft");
        expect(item.version, item.id).toBe(1);
        expect(item.curriculum?.code, item.id).toBe(expectedCode);
        expect(item.analytics?.tags || [], item.id).toContain(
          "maths-starting-point",
        );
        expect(item.misconceptionTags?.length || 0, item.id).toBeGreaterThan(0);
      }
    }
  });

  it("uses prompts that are independent from the initial customer-route items", () => {
    const evidenceFingerprint = (item: (typeof NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY)[number]["item"]) =>
      JSON.stringify({
        prompt: item.prompt.trim(),
        stimulus: item.stimulus,
        options: item.response.options || [],
        correctValue: item.response.correctValue,
      });
    const routeEvidence = new Set(
      NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.map(
        (entry) => evidenceFingerprint(entry.item),
      ),
    );

    const newClusterKeys = new Set([
      ...[1, 2, 4, 5, 7, 8, 10].map(
        (pLevel) => `additive-strategies:p${pLevel}`,
      ),
      ...[1, 2, 4, 5, 7, 8, 10].map(
        (pLevel) => `multiplicative-strategies:p${pLevel}`,
      ),
      ...[1, 3, 4, 6, 7, 9, 10].map(
        (pLevel) => `understanding-money:p${pLevel}`,
      ),
    ]);

    for (const cluster of NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS) {
      const key = `${cluster.subElementKey}:p${cluster.pLevel}`;
      if (!newClusterKeys.has(key)) continue;
      for (const item of cluster.items) {
        expect(routeEvidence.has(evidenceFingerprint(item)), item.id).toBe(false);
      }
    }
  });

  it("elicits named strategies instead of inferring them from final answers", () => {
    const strategyItems: Record<string, string> = {
      "myl-recheck-add-p04-a-v1": "count-on sequence",
      "myl-recheck-add-p04-b-v1": "count-up sequence",
      "myl-recheck-add-p05-a-v1": "count-back sequence",
      "myl-recheck-add-p05-b-v1": "count-up sequence",
      "myl-recheck-add-p07-a-v1": "uses compensation",
      "myl-recheck-add-p07-b-v1": "reorders the addends",
      "myl-recheck-add-p08-a-v1": "uses place value",
      "myl-recheck-add-p08-b-v1": "estimate",
      "myl-recheck-mul-p04-a-v1": "repeated addition",
      "myl-recheck-mul-p04-b-v1": "repeated subtraction",
      "myl-recheck-mul-p07-a-v1": "distributive property",
      "myl-recheck-mul-p07-b-v1": "doubling and halving",
    };
    const items = new Map(
      getNumberOperationsFreshRecheckItems().map((item) => [item.id, item]),
    );

    for (const [itemId, wording] of Object.entries(strategyItems)) {
      const item = items.get(itemId);
      expect(item, itemId).toBeTruthy();
      expect(item?.response.type, itemId).toBe("single-choice");
      expect(item?.prompt.toLowerCase(), itemId).toContain(
        wording.toLowerCase(),
      );
    }
  });

  it("locks the higher-risk arithmetic and money answer keys in the new tranche", () => {
    const expectedShortAnswers: Record<string, string> = {
      "myl-recheck-add-p10-a-v1": "29/28",
      "myl-recheck-add-p10-b-v1": "-2",
      "myl-recheck-mul-p08-a-v1": "60",
      "myl-recheck-mul-p10-a-v1": "111.6",
      "myl-recheck-mul-p10-b-v1": "6000",
      "myl-recheck-mon-p03-a-v1": "120",
      "myl-recheck-mon-p06-a-v1": "10.15",
      "myl-recheck-mon-p06-b-v1": "8.55",
      "myl-recheck-mon-p07-a-v1": "20",
      "myl-recheck-mon-p09-b-v1": "25",
      "myl-recheck-mon-p10-a-v1": "2205",
    };
    const expectedChoices: Record<string, string[]> = {
      "myl-recheck-add-p07-a-v1": ["a"],
      "myl-recheck-add-p08-b-v1": ["a"],
      "myl-recheck-mul-p07-a-v1": ["a"],
      "myl-recheck-mul-p08-b-v1": ["a"],
      "myl-recheck-mon-p01-b-v1": ["b"],
      "myl-recheck-mon-p04-b-v1": ["b"],
      "myl-recheck-mon-p09-a-v1": ["b"],
      "myl-recheck-mon-p10-b-v1": ["b"],
    };
    const items = new Map(
      getNumberOperationsFreshRecheckItems().map((item) => [item.id, item]),
    );

    for (const [itemId, correctValue] of Object.entries(expectedShortAnswers)) {
      const item = items.get(itemId);
      expect(item?.response.type, itemId).toBe("short-answer");
      expect(item?.response.correctValue, itemId).toBe(correctValue);
    }
    for (const [itemId, correctOptionIds] of Object.entries(expectedChoices)) {
      expect(items.get(itemId)?.response.correctOptionIds, itemId).toEqual(
        correctOptionIds,
      );
    }
  });

  it("keeps Money P1-P2 rechecks behind trusted asset review", () => {
    for (const pLevel of [1, 2]) {
      const cluster = getNumberOperationsFreshRecheckCluster(
        "understanding-money",
        pLevel,
      );
      expect(cluster, `Money P${pLevel}`).not.toBeNull();
      for (const item of cluster?.items || []) {
        expect(item.analytics?.tags || [], item.id).toContain("asset-review");
      }
    }
  });
});
