import { scoreAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessScoring";
import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";
import type {
  NumberOperationsBaselinePersistenceDraft,
  NumberOperationsBaselineResponsePersistenceDraft,
} from "./numberOperationsPersistenceDraft";
import {
  getNumberOperationsPlacementItemById,
  type NumberOperationsPlacementItemRegistryEntry,
  type NumberOperationsPlacementPoolKind,
} from "./numberOperationsItemRegistry";
import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";

const VALID_SUB_ELEMENTS = new Set<NumberOperationsSubElementKey>([
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
]);

const STAGE_POOL_KIND: Record<
  NumberOperationsBaselineResponsePersistenceDraft["stageKind"],
  NumberOperationsPlacementPoolKind
> = {
  initial: "anchor",
  reserve: "reserve",
  branch: "anchor",
  search: "search",
  boundary: "boundary",
};

function cloneItem(item: MyLearnaAssessmentItem) {
  return JSON.parse(JSON.stringify(item)) as Record<string, unknown>;
}

function stringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return value.map((entry) => entry.trim());
}

function unique(values: string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must not contain duplicates.`);
  }
}

function validIso(value: unknown, label: string) {
  const text = String(value ?? "").trim();
  const parsed = Date.parse(text);
  if (!text || !Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid datetime.`);
  }
  return new Date(parsed).toISOString();
}

function parseRegistryPool(entry: NumberOperationsPlacementItemRegistryEntry) {
  const match = entry.poolKey.match(
    /^(number-place-value|counting-processes|additive-strategies|multiplicative-strategies|understanding-money)-p(\d+)$/,
  );
  if (!match) {
    throw new Error(`Unsupported placement pool key: ${entry.poolKey}`);
  }
  return {
    subElementKey: match[1] as NumberOperationsSubElementKey,
    pLevel: Number(match[2]),
  };
}

function validateAttemptEnvelope(
  attempt: NumberOperationsBaselinePersistenceDraft["attempt"],
) {
  if (attempt.frameworkId !== "MYL-MATH-AU-NUMERACY-V9") {
    throw new Error("Unexpected Number & Operations framework.");
  }
  if (attempt.formId !== "number-operations-baseline") {
    throw new Error("Unexpected Number & Operations form.");
  }
  if (attempt.sourceRoute !== "/assessments/maths-starting-point") {
    throw new Error("Unexpected Number & Operations source route.");
  }
  if (attempt.mode !== "diagnostic") {
    throw new Error("Unexpected Number & Operations attempt mode.");
  }

  const scope = stringArray(attempt.scopeSubElements, "scopeSubElements");
  unique(scope, "scopeSubElements");
  if (
    scope.length < 1 ||
    scope.length > 5 ||
    scope.some(
      (key) => !VALID_SUB_ELEMENTS.has(key as NumberOperationsSubElementKey),
    )
  ) {
    throw new Error("scopeSubElements contains an unsupported area.");
  }
  if (attempt.expectedSubElements !== scope.length) {
    throw new Error("expectedSubElements must match scopeSubElements.");
  }

  const unresolved = stringArray(
    attempt.unresolvedSubElements,
    "unresolvedSubElements",
  );
  unique(unresolved, "unresolvedSubElements");
  if (unresolved.some((key) => !scope.includes(key))) {
    throw new Error("unresolvedSubElements must stay inside scopeSubElements.");
  }
  if (
    attempt.assessedSubElements < 0 ||
    attempt.assessedSubElements > attempt.expectedSubElements ||
    attempt.assessedSubElements + unresolved.length !==
      attempt.expectedSubElements
  ) {
    throw new Error(
      "Every requested scope area must be assessed or unresolved.",
    );
  }

  if (
    attempt.status === "complete" &&
    (unresolved.length > 0 ||
      attempt.assessedSubElements !== attempt.expectedSubElements)
  ) {
    throw new Error("A complete baseline must cover its full requested scope.");
  }
  if (
    attempt.status === "partial" &&
    (unresolved.length < 1 ||
      attempt.assessedSubElements >= attempt.expectedSubElements)
  ) {
    throw new Error("A partial baseline must contain unresolved scope.");
  }

  const startedAt = validIso(attempt.startedAt, "startedAt");
  const completedAt = validIso(attempt.completedAt, "completedAt");
  if (Date.parse(completedAt) < Date.parse(startedAt)) {
    throw new Error("completedAt cannot be before startedAt.");
  }

  const profile = attempt.profileSnapshot;
  if (
    profile.expectedSubElements !== attempt.expectedSubElements ||
    profile.assessedSubElements !== attempt.assessedSubElements ||
    JSON.stringify(profile.expectedSubElementKeys) !== JSON.stringify(scope)
  ) {
    throw new Error("Profile snapshot scope does not match the attempt.");
  }

  const evidence = attempt.evidencePreviewSnapshot;
  if (
    evidence.expectedSubElements !== attempt.expectedSubElements ||
    evidence.assessedSubElements !== attempt.assessedSubElements ||
    JSON.stringify(evidence.scopeSubElements) !== JSON.stringify(scope)
  ) {
    throw new Error("Evidence preview scope does not match the attempt.");
  }

  return {
    scope: scope as NumberOperationsSubElementKey[],
    startedAt,
    completedAt,
  };
}

function validateResponseShape(
  item: MyLearnaAssessmentItem,
  response: NumberOperationsBaselineResponsePersistenceDraft,
) {
  const selectedOptionIds = stringArray(
    response.selectedOptionIds,
    "selectedOptionIds",
  );
  unique(selectedOptionIds, "selectedOptionIds");

  const optionIds = new Set((item.response.options || []).map((option) => option.id));
  if (selectedOptionIds.some((id) => !optionIds.has(id))) {
    throw new Error(`Response for ${item.id} contains an unknown option id.`);
  }

  if (item.response.type === "short-answer") {
    if (selectedOptionIds.length) {
      throw new Error(`Short-answer item ${item.id} cannot contain option ids.`);
    }
    if (!String(response.responseValue ?? "").trim()) {
      throw new Error(`Short-answer item ${item.id} requires a response value.`);
    }
  } else {
    if (String(response.responseValue ?? "").trim()) {
      throw new Error(`Choice item ${item.id} cannot contain a response value.`);
    }
    if (item.response.type === "single-choice" && selectedOptionIds.length !== 1) {
      throw new Error(`Single-choice item ${item.id} requires one selected option.`);
    }
    if (
      item.response.type === "multiple-choice" &&
      (selectedOptionIds.length < 1 || selectedOptionIds.length > optionIds.size)
    ) {
      throw new Error(`Multiple-choice item ${item.id} has an invalid selection count.`);
    }
    if (
      item.response.type === "ordering" &&
      selectedOptionIds.length !== optionIds.size
    ) {
      throw new Error(`Ordering item ${item.id} must include every option exactly once.`);
    }
  }

  if (
    response.timeSpentSeconds !== null &&
    (!Number.isFinite(response.timeSpentSeconds) ||
      response.timeSpentSeconds < 0)
  ) {
    throw new Error(`Invalid timeSpentSeconds for ${item.id}.`);
  }

  return selectedOptionIds;
}

function sanitizeResponse(
  response: NumberOperationsBaselineResponsePersistenceDraft,
  scope: NumberOperationsSubElementKey[],
  options: { allowNonPublishedItems: boolean },
): NumberOperationsBaselineResponsePersistenceDraft {
  if (!VALID_SUB_ELEMENTS.has(response.subElementKey as NumberOperationsSubElementKey)) {
    throw new Error("Response contains an unsupported Number & Operations area.");
  }
  if (!scope.includes(response.subElementKey as NumberOperationsSubElementKey)) {
    throw new Error("Response sits outside the requested Number & Operations scope.");
  }

  const entry = getNumberOperationsPlacementItemById(response.itemId);
  if (!entry) {
    throw new Error(`Unknown Number & Operations item: ${response.itemId}`);
  }
  if (!options.allowNonPublishedItems && entry.item.status !== "published") {
    throw new Error(`Placement item ${response.itemId} is not published.`);
  }

  const expectedPoolKind = STAGE_POOL_KIND[response.stageKind];
  if (!expectedPoolKind || entry.poolKind !== expectedPoolKind) {
    throw new Error(
      `Item ${response.itemId} does not belong to stage ${response.stageKind}.`,
    );
  }

  const pool = parseRegistryPool(entry);
  if (
    pool.subElementKey !== response.subElementKey ||
    pool.pLevel !== response.progressionLevel
  ) {
    throw new Error(
      `Item ${response.itemId} does not match the claimed area/progression level.`,
    );
  }

  if (
    response.itemVersion !== entry.item.version ||
    response.itemPoolKind !== entry.poolKind ||
    response.itemPoolKey !== entry.poolKey
  ) {
    throw new Error(
      `Item ${response.itemId} metadata is stale or does not match the registry.`,
    );
  }

  if (
    response.itemOrder < 1 ||
    !Number.isInteger(response.itemOrder)
  ) {
    throw new Error("itemOrder must be a positive integer.");
  }

  const selectedOptionIds = validateResponseShape(entry.item, response);
  const rescored = scoreAssessmentItem(
    entry.item,
    selectedOptionIds,
    response.timeSpentSeconds ?? undefined,
    response.responseValue ?? undefined,
  );

  return {
    subElementKey: pool.subElementKey,
    stageKind: response.stageKind,
    progressionLevel: pool.pLevel,
    stageDirection: response.stageDirection,
    bracketLowerP: response.bracketLowerP,
    bracketUpperP: response.bracketUpperP,
    itemId: entry.item.id,
    itemVersion: entry.item.version,
    itemPoolKind: entry.poolKind,
    itemPoolKey: entry.poolKey,
    itemSnapshot: cloneItem(entry.item),
    itemOrder: response.itemOrder,
    selectedOptionIds: [...rescored.selectedOptionIds],
    responseValue: rescored.responseValue ?? null,
    correct: rescored.correct,
    skillId: entry.item.skill.id,
    misconceptionTags: [...rescored.misconceptionTags],
    timeSpentSeconds: rescored.timeSpentSeconds ?? null,
  };
}

export function sanitizeNumberOperationsBaselinePersistenceDraft(
  draft: NumberOperationsBaselinePersistenceDraft,
  options: { allowNonPublishedItems?: boolean } = {},
): NumberOperationsBaselinePersistenceDraft {
  const attempt = validateAttemptEnvelope(draft.attempt);
  const allowNonPublishedItems = options.allowNonPublishedItems === true;

  const itemIds = draft.responses.map((response) => response.itemId);
  unique(itemIds, "response item ids");

  const itemOrders = draft.responses.map((response) => String(response.itemOrder));
  unique(itemOrders, "response item orders");

  const responses = draft.responses
    .map((response) =>
      sanitizeResponse(response, attempt.scope, { allowNonPublishedItems }),
    )
    .sort((left, right) => left.itemOrder - right.itemOrder);

  responses.forEach((response, index) => {
    if (response.itemOrder !== index + 1) {
      throw new Error("Response itemOrder values must form a contiguous sequence.");
    }
  });

  return {
    attempt: {
      ...draft.attempt,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      scopeSubElements: [...attempt.scope],
      unresolvedSubElements: [...draft.attempt.unresolvedSubElements],
    },
    responses,
  };
}
