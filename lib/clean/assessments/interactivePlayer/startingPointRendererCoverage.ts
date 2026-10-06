import type {
  MyLearnaAssessmentItem,
  MyLearnaAssessmentStimulus,
} from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
  type NumberOperationsPlacementPoolKind,
} from "@/lib/clean/assessments/placement/numberOperationsItemRegistry";
import {
  NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS,
} from "@/lib/clean/assessments/placement/numberOperationsFreshRecheckItems";
import {
  inferStartingPointInteraction,
  type StartingPointInteractionKind,
} from "./startingPointPlayerContract";

export type StartingPointContinuum =
  | "number-place-value"
  | "counting-processes"
  | "additive-strategies"
  | "multiplicative-strategies"
  | "understanding-money";

export type StartingPointAssessmentForm =
  | "initial-placement"
  | "fresh-recheck";

export type StartingPointEvidenceClassification =
  | "electronic"
  | "electronic-with-practical-alternative"
  | "practical-only";

export type StartingPointRendererCoverageEntry = {
  itemId: string;
  itemVersion: number;
  itemStatus: MyLearnaAssessmentItem["status"];
  continuum: StartingPointContinuum;
  progressionTarget: `P${number}`;
  assessmentRole: NumberOperationsPlacementPoolKind | "fresh-recheck" | "fresh-recheck-reserve";
  form: StartingPointAssessmentForm;
  responseType: MyLearnaAssessmentItem["response"]["type"];
  stimulusType: MyLearnaAssessmentStimulus["type"];
  evidenceClassification: StartingPointEvidenceClassification;
  electronicallyRenderable: boolean;
  accessibilityLimited: boolean;
  routingOnlyEvidence: boolean;
  assetType: "none" | "counter" | "place-value" | "australian-currency";
  rendererFamily: StartingPointInteractionKind | null;
};

const CONTINUA: readonly StartingPointContinuum[] = [
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
];

const SUPPORTED_STIMULUS_TYPES = new Set([
  "none",
  "counter-set",
  "place-value-blocks",
  "currency-tokens",
]);

const PRACTICAL_ONLY_TAGS = new Set([
  "practical-only",
  "practical-observation-only",
]);

function tagsFor(item: MyLearnaAssessmentItem) {
  return item.analytics?.tags ?? [];
}

function continuumFor(item: MyLearnaAssessmentItem): StartingPointContinuum {
  const continuum = CONTINUA.find((candidate) => tagsFor(item).includes(candidate));
  if (!continuum) {
    throw new Error(`Starting Point item ${item.id} has no canonical continuum tag.`);
  }
  return continuum;
}

function progressionFor(item: MyLearnaAssessmentItem): `P${number}` {
  const tag = tagsFor(item).find((candidate) => /^p\d+$/i.test(candidate));
  if (!tag) {
    throw new Error(`Starting Point item ${item.id} has no canonical progression tag.`);
  }
  return `P${Number(tag.slice(1))}`;
}

function assetTypeFor(
  stimulusType: MyLearnaAssessmentStimulus["type"],
): StartingPointRendererCoverageEntry["assetType"] {
  if (stimulusType === "counter-set") return "counter";
  if (stimulusType === "place-value-blocks") return "place-value";
  if (stimulusType === "currency-tokens") return "australian-currency";
  return "none";
}

export function resolveStartingPointRendererCoverage(input: {
  item: MyLearnaAssessmentItem;
  assessmentRole: StartingPointRendererCoverageEntry["assessmentRole"];
  form: StartingPointAssessmentForm;
}): StartingPointRendererCoverageEntry {
  const { item } = input;
  const tags = tagsFor(item);
  const practicalOnly = tags.some((tag) => PRACTICAL_ONLY_TAGS.has(tag));
  const accessibilityLimited = tags.some((tag) =>
    tag.includes("separate-accessible-form-required"),
  );

  if (!practicalOnly && !SUPPORTED_STIMULUS_TYPES.has(item.stimulus.type)) {
    throw new Error(
      `Starting Point item ${item.id} uses unsupported electronic stimulus ${item.stimulus.type}.`,
    );
  }

  const rendererFamily = practicalOnly
    ? null
    : inferStartingPointInteraction(item);
  if (
    item.response.type !== "short-answer" &&
    (item.response.options?.length ?? 0) === 0
  ) {
    throw new Error(
      `Starting Point item ${item.id} has no canonical options for ${rendererFamily}.`,
    );
  }

  return {
    itemId: item.id,
    itemVersion: item.version,
    itemStatus: item.status,
    continuum: continuumFor(item),
    progressionTarget: progressionFor(item),
    assessmentRole: input.assessmentRole,
    form: input.form,
    responseType: item.response.type,
    stimulusType: item.stimulus.type,
    evidenceClassification: practicalOnly
      ? "practical-only"
      : accessibilityLimited
        ? "electronic-with-practical-alternative"
        : "electronic",
    electronicallyRenderable: !practicalOnly,
    accessibilityLimited,
    routingOnlyEvidence: tags.includes("hybrid-routing-only"),
    assetType: assetTypeFor(item.stimulus.type),
    rendererFamily,
  };
}

export function getStartingPointRendererCoverageInventory() {
  const initial = NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY
    .filter((entry) => entry.item.status !== "retired")
    .map((entry) =>
      resolveStartingPointRendererCoverage({
        item: entry.item,
        assessmentRole: entry.poolKind,
        form: "initial-placement",
      }),
    );

  const fresh = NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS.flatMap((cluster) => [
    ...cluster.items.map((item) =>
      resolveStartingPointRendererCoverage({
        item,
        assessmentRole: "fresh-recheck" as const,
        form: "fresh-recheck",
      }),
    ),
    ...(cluster.reserveItem
      ? [
          resolveStartingPointRendererCoverage({
            item: cluster.reserveItem,
            assessmentRole: "fresh-recheck-reserve",
            form: "fresh-recheck",
          }),
        ]
      : []),
  ]).filter((entry) => entry.itemStatus !== "retired");

  const inventory = [...initial, ...fresh].sort((left, right) =>
    left.continuum.localeCompare(right.continuum) ||
    Number(left.progressionTarget.slice(1)) - Number(right.progressionTarget.slice(1)) ||
    left.form.localeCompare(right.form) ||
    left.itemId.localeCompare(right.itemId),
  );
  const itemIds = new Set<string>();
  for (const entry of inventory) {
    if (itemIds.has(entry.itemId)) {
      throw new Error(`Starting Point renderer inventory contains duplicate item ${entry.itemId}.`);
    }
    itemIds.add(entry.itemId);
  }
  return inventory;
}

export function getStartingPointRendererCoverageSummary() {
  const inventory = getStartingPointRendererCoverageInventory();
  const rendererCounts = new Map<StartingPointInteractionKind, number>();
  const continuumCounts = new Map<
    StartingPointContinuum,
    Map<StartingPointInteractionKind, number>
  >();

  for (const entry of inventory) {
    if (!entry.rendererFamily) continue;
    rendererCounts.set(
      entry.rendererFamily,
      (rendererCounts.get(entry.rendererFamily) ?? 0) + 1,
    );
    const byRenderer = continuumCounts.get(entry.continuum) ?? new Map();
    byRenderer.set(
      entry.rendererFamily,
      (byRenderer.get(entry.rendererFamily) ?? 0) + 1,
    );
    continuumCounts.set(entry.continuum, byRenderer);
  }

  return {
    totalActiveItems: inventory.length,
    electronicallyRenderableItems: inventory.filter(
      (entry) => entry.electronicallyRenderable,
    ).length,
    practicalOnlyItems: inventory.filter(
      (entry) => entry.evidenceClassification === "practical-only",
    ).length,
    practicalAlternativeItems: inventory.filter(
      (entry) => entry.accessibilityLimited,
    ).length,
    routingOnlyEvidenceItems: inventory.filter(
      (entry) => entry.routingOnlyEvidence,
    ).length,
    initialPlacementItems: inventory.filter(
      (entry) => entry.form === "initial-placement",
    ).length,
    freshRecheckItems: inventory.filter(
      (entry) => entry.form === "fresh-recheck",
    ).length,
    rendererCounts,
    continuumCounts,
  };
}

export function formatStartingPointRendererCoverageMatrix() {
  const header = [
    "continuum",
    "progression",
    "item_id",
    "version",
    "role",
    "form",
    "response",
    "stimulus",
    "evidence",
    "renderer",
  ].join("\t");
  const rows = getStartingPointRendererCoverageInventory().map((entry) =>
    [
      entry.continuum,
      entry.progressionTarget,
      entry.itemId,
      entry.itemVersion,
      entry.assessmentRole,
      entry.form,
      entry.responseType,
      entry.stimulusType,
      entry.evidenceClassification,
      entry.rendererFamily ?? "practical-only",
    ].join("\t"),
  );
  return [header, ...rows].join("\n");
}
