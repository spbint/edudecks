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
import {
  classifyStartingPointDevelopmentalAccessibility,
  type StartingPointDevelopmentalStage,
  type StartingPointReadAloudClassification,
  type StartingPointStimulusCoverage,
} from "./startingPointDevelopmentalAccessibility";

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
  developmentalStage: StartingPointDevelopmentalStage;
  readAloud: StartingPointReadAloudClassification;
  stimulusCoverage: StartingPointStimulusCoverage;
};

export type StartingPointRendererQaItem = {
  item: MyLearnaAssessmentItem;
  coverage: StartingPointRendererCoverageEntry;
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
  const developmentalAccessibility =
    classifyStartingPointDevelopmentalAccessibility(item);

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
    developmentalStage: developmentalAccessibility.developmentalStage,
    readAloud: developmentalAccessibility.readAloud,
    stimulusCoverage: developmentalAccessibility.stimulusCoverage,
  };
}

export function getStartingPointRendererQaItems(): StartingPointRendererQaItem[] {
  const initial = NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY
    .filter((entry) => entry.item.status !== "retired")
    .map((entry) => ({
      item: entry.item,
      coverage: resolveStartingPointRendererCoverage({
          item: entry.item,
          assessmentRole: entry.poolKind,
          form: "initial-placement",
        }),
    }));

  const fresh = NUMBER_OPERATIONS_FRESH_RECHECK_CLUSTERS.flatMap((cluster) => [
    ...cluster.items.map((item) => ({
      item,
      coverage: resolveStartingPointRendererCoverage({
        item,
        assessmentRole: "fresh-recheck" as const,
        form: "fresh-recheck",
      }),
    })),
    ...(cluster.reserveItem
      ? [
          {
            item: cluster.reserveItem,
            coverage: resolveStartingPointRendererCoverage({
            item: cluster.reserveItem,
            assessmentRole: "fresh-recheck-reserve",
            form: "fresh-recheck",
            }),
          },
        ]
      : []),
  ]).filter((entry) => entry.coverage.itemStatus !== "retired");

  const inventory = [...initial, ...fresh].sort((left, right) =>
    left.coverage.continuum.localeCompare(right.coverage.continuum) ||
    Number(left.coverage.progressionTarget.slice(1)) - Number(right.coverage.progressionTarget.slice(1)) ||
    left.coverage.form.localeCompare(right.coverage.form) ||
    left.coverage.itemId.localeCompare(right.coverage.itemId),
  );
  const itemIds = new Set<string>();
  for (const entry of inventory) {
    if (itemIds.has(entry.coverage.itemId)) {
      throw new Error(`Starting Point renderer inventory contains duplicate item ${entry.coverage.itemId}.`);
    }
    itemIds.add(entry.coverage.itemId);
  }
  return inventory;
}

export function getStartingPointRendererCoverageInventory() {
  return getStartingPointRendererQaItems().map((entry) => entry.coverage);
}

export function getStartingPointRendererQaEdgeCases() {
  const entries = getStartingPointRendererQaItems();
  const longestPrompt = [...entries].sort(
    (left, right) => right.item.prompt.length - left.item.prompt.length,
  )[0];
  const mostChoices = [...entries].sort(
    (left, right) =>
      (right.item.response.options?.length ?? 0) -
      (left.item.response.options?.length ?? 0),
  )[0];
  const longestChoice = [...entries].sort((left, right) => {
    const maxLength = (entry: StartingPointRendererQaItem) =>
      Math.max(0, ...(entry.item.response.options ?? []).map((option) =>
        String(option.label ?? option.value).length,
      ));
    return maxLength(right) - maxLength(left);
  })[0];
  const largestCounterSet = [...entries]
    .filter((entry) => entry.item.stimulus.type === "counter-set")
    .sort((left, right) =>
      Number((right.item.stimulus.data as { quantity?: number }).quantity ?? 0) -
      Number((left.item.stimulus.data as { quantity?: number }).quantity ?? 0),
    )[0];
  const representatives = [
    { label: "Longest prompt", entry: longestPrompt },
    { label: "Most answer choices", entry: mostChoices },
    { label: "Longest answer label", entry: longestChoice },
    { label: "Largest counter set", entry: largestCounterSet },
    {
      label: "Ordering interaction",
      entry: entries.find((entry) => entry.coverage.rendererFamily === "drag-to-order"),
    },
    {
      label: "Place-value interaction",
      entry: entries.find((entry) => entry.coverage.rendererFamily === "place-value"),
    },
    {
      label: "Australian currency",
      entry: entries.find((entry) => entry.coverage.rendererFamily === "australian-currency"),
    },
    {
      label: "Accessibility alternative",
      entry: entries.find((entry) => entry.coverage.accessibilityLimited),
    },
    {
      label: "Fresh recheck",
      entry: entries.find((entry) => entry.coverage.form === "fresh-recheck"),
    },
  ];
  return representatives.flatMap(({ label, entry }) =>
    entry ? [{ label, itemId: entry.item.id }] : [],
  );
}

export function getStartingPointRendererCoverageSummary() {
  const inventory = getStartingPointRendererCoverageInventory();
  const rendererCounts = new Map<StartingPointInteractionKind, number>();
  const continuumCounts = new Map<
    StartingPointContinuum,
    Map<StartingPointInteractionKind, number>
  >();
  const developmentalStageCounts = new Map<StartingPointDevelopmentalStage, number>();
  const readAloudCounts = new Map<StartingPointReadAloudClassification, number>();
  const stimulusCoverageCounts = new Map<StartingPointStimulusCoverage, number>();

  for (const entry of inventory) {
    developmentalStageCounts.set(entry.developmentalStage, (developmentalStageCounts.get(entry.developmentalStage) ?? 0) + 1);
    readAloudCounts.set(entry.readAloud, (readAloudCounts.get(entry.readAloud) ?? 0) + 1);
    stimulusCoverageCounts.set(entry.stimulusCoverage, (stimulusCoverageCounts.get(entry.stimulusCoverage) ?? 0) + 1);
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
    developmentalStageCounts,
    readAloudCounts,
    stimulusCoverageCounts,
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
    "developmental_stage",
    "read_aloud",
    "stimulus_coverage",
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
      entry.developmentalStage,
      entry.readAloud,
      entry.stimulusCoverage,
    ].join("\t"),
  );
  return [header, ...rows].join("\n");
}
