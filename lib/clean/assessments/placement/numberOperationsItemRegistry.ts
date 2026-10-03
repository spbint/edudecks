import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  NUMBER_OPERATIONS_BOUNDARY_CLUSTERS,
  NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS,
  NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS,
  NUMBER_OPERATIONS_SEARCH_CLUSTERS,
} from "./numberOperationsP0Items";

export type NumberOperationsPlacementPoolKind =
  | "anchor"
  | "reserve"
  | "search"
  | "boundary";

export type NumberOperationsPlacementItemRegistryEntry = {
  poolKind: NumberOperationsPlacementPoolKind;
  poolKey: string;
  item: MyLearnaAssessmentItem;
};

function entriesFromClusterMap(
  poolKind: Exclude<NumberOperationsPlacementPoolKind, "reserve">,
  source: Record<string, readonly MyLearnaAssessmentItem[]>,
) {
  return Object.entries(source).flatMap(([poolKey, items]) =>
    items.map(
      (item) =>
        ({
          poolKind,
          poolKey,
          item,
        }) satisfies NumberOperationsPlacementItemRegistryEntry,
    ),
  );
}

function reserveEntries() {
  return Object.entries(NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS).map(
    ([poolKey, item]) =>
      ({
        poolKind: "reserve",
        poolKey,
        item,
      }) satisfies NumberOperationsPlacementItemRegistryEntry,
  );
}

export const NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY: NumberOperationsPlacementItemRegistryEntry[] =
  [
    ...entriesFromClusterMap(
      "anchor",
      NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS,
    ),
    ...reserveEntries(),
    ...entriesFromClusterMap("search", NUMBER_OPERATIONS_SEARCH_CLUSTERS),
    ...entriesFromClusterMap("boundary", NUMBER_OPERATIONS_BOUNDARY_CLUSTERS),
  ];

const byId = new Map(
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.map((entry) => [
    entry.item.id,
    entry,
  ]),
);

export function getNumberOperationsPlacementItemById(itemId: string) {
  return byId.get(itemId) || null;
}

export function getNumberOperationsPlacementItemInventory() {
  return NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.map((entry) => ({
    itemId: entry.item.id,
    version: entry.item.version,
    status: entry.item.status,
    poolKind: entry.poolKind,
    poolKey: entry.poolKey,
    curriculumCode: entry.item.curriculum?.code || null,
    responseType: entry.item.response.type,
    stimulusType: entry.item.stimulus.type,
  }));
}
