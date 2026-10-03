import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
  type NumberOperationsPlacementPoolKind,
} from "./numberOperationsItemRegistry";
import {
  MEASUREMENT_UNITS_BOUNDARY_CLUSTERS,
  MEASUREMENT_UNITS_EXECUTABLE_ANCHORS,
  MEASUREMENT_UNITS_P6_RESERVE_ITEM,
  MEASUREMENT_UNITS_SEARCH_CLUSTERS,
} from "./measurementUnitsItems";
import {
  CHANCE_BOUNDARY_CLUSTERS,
  CHANCE_EXECUTABLE_ANCHORS,
  CHANCE_P4_RESERVE_ITEM,
  CHANCE_SEARCH_CLUSTERS,
} from "./chanceItems";

export type AssessmentPlacementPoolKind = NumberOperationsPlacementPoolKind;

export type AssessmentPlacementItemRegistryEntry = {
  poolKind: AssessmentPlacementPoolKind;
  poolKey: string;
  item: MyLearnaAssessmentItem;
  lane:
    | "number-operations"
    | "measurement-units"
    | "chance";
};

function clusterEntries(
  poolKind: Exclude<AssessmentPlacementPoolKind, "reserve" | "confirmation">,
  source: Record<string, readonly MyLearnaAssessmentItem[]>,
): AssessmentPlacementItemRegistryEntry[] {
  return Object.entries(source).flatMap(([poolKey, items]) =>
    items.map((item) => ({
      poolKind,
      poolKey,
      item,
      lane: "measurement-units" as const,
    })),
  );
}

const measurementEntries: AssessmentPlacementItemRegistryEntry[] = [
  ...clusterEntries("anchor", MEASUREMENT_UNITS_EXECUTABLE_ANCHORS),
  {
    poolKind: "reserve",
    poolKey: "understanding-units-measurement-p6",
    item: MEASUREMENT_UNITS_P6_RESERVE_ITEM,
    lane: "measurement-units",
  },
  ...clusterEntries("search", MEASUREMENT_UNITS_SEARCH_CLUSTERS),
  ...clusterEntries("boundary", MEASUREMENT_UNITS_BOUNDARY_CLUSTERS),
];

function chanceClusterEntries(
  poolKind: Exclude<AssessmentPlacementPoolKind, "reserve" | "confirmation">,
  source: Record<string, readonly MyLearnaAssessmentItem[]>,
): AssessmentPlacementItemRegistryEntry[] {
  return Object.entries(source).flatMap(([poolKey, items]) =>
    items.map((item) => ({
      poolKind,
      poolKey,
      item,
      lane: "chance" as const,
    })),
  );
}

const chanceEntries: AssessmentPlacementItemRegistryEntry[] = [
  ...chanceClusterEntries("anchor", CHANCE_EXECUTABLE_ANCHORS),
  {
    poolKind: "reserve",
    poolKey: "understanding-chance-p4",
    item: CHANCE_P4_RESERVE_ITEM,
    lane: "chance",
  },
  ...chanceClusterEntries("search", CHANCE_SEARCH_CLUSTERS),
  ...chanceClusterEntries("boundary", CHANCE_BOUNDARY_CLUSTERS),
];


export const ASSESSMENT_PLACEMENT_ITEM_REGISTRY: AssessmentPlacementItemRegistryEntry[] = [
  ...NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.map((entry) => ({
    ...entry,
    lane: "number-operations" as const,
  })),
  ...measurementEntries,
  ...chanceEntries,
];

const byId = new Map(
  ASSESSMENT_PLACEMENT_ITEM_REGISTRY.map((entry) => [entry.item.id, entry]),
);

export function getAssessmentPlacementItemById(itemId: string) {
  return byId.get(itemId) || null;
}

export function getAssessmentPlacementItemInventory() {
  return ASSESSMENT_PLACEMENT_ITEM_REGISTRY.map((entry) => ({
    itemId: entry.item.id,
    version: entry.item.version,
    status: entry.item.status,
    lane: entry.lane,
    poolKind: entry.poolKind,
    poolKey: entry.poolKey,
    curriculumCode: entry.item.curriculum?.code || null,
    responseType: entry.item.response.type,
    stimulusType: entry.item.stimulus.type,
  }));
}
