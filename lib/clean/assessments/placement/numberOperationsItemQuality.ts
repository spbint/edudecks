import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
  type NumberOperationsPlacementItemRegistryEntry,
} from "./numberOperationsItemRegistry";

export type PlacementItemQualityIssue = {
  itemId: string;
  code:
    | "missing-prompt"
    | "invalid-version"
    | "invalid-status"
    | "missing-curriculum-code"
    | "missing-skill"
    | "missing-correct-value"
    | "missing-options"
    | "insufficient-options"
    | "missing-option-label"
    | "duplicate-option-id"
    | "duplicate-option-label"
    | "duplicate-correct-option"
    | "invalid-correct-option"
    | "single-choice-answer-count"
    | "ordering-answer-count"
    | "template-response-mismatch"
    | "missing-visual-description"
    | "unversioned-id";
  message: string;
};

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function hasGeneratedVisualDescription(item: MyLearnaAssessmentItem) {
  return [
    "counter-set",
    "ten-frame",
    "number-line",
    "array",
    "place-value-blocks",
    "fraction-bar",
    "currency-tokens",
    "graduated-scale",
    "shape-set",
  ].includes(item.stimulus.type);
}

export function validatePlacementItem(
  entry: NumberOperationsPlacementItemRegistryEntry,
): PlacementItemQualityIssue[] {
  const item = entry.item;
  const issues: PlacementItemQualityIssue[] = [];
  const issue = (
    code: PlacementItemQualityIssue["code"],
    message: string,
  ) => issues.push({ itemId: item.id, code, message });

  if (!safe(item.prompt)) {
    issue("missing-prompt", "Prompt must not be empty.");
  }

  if (!Number.isInteger(item.version) || item.version < 1) {
    issue("invalid-version", "Item version must be a positive integer.");
  }

  if (item.status !== "draft") {
    issue(
      "invalid-status",
      "First-slice placement items must remain draft until the release gate is passed.",
    );
  }

  if (!safe(item.curriculum?.code).startsWith("MYL-MATH-PROG-")) {
    issue(
      "missing-curriculum-code",
      "Item must carry a canonical MyLearna progression code.",
    );
  }

  if (!safe(item.skill?.id) || !safe(item.skill?.name)) {
    issue("missing-skill", "Item must carry a stable skill ID and name.");
  }

  if (!item.id.endsWith(`-v${item.version}`)) {
    issue(
      "unversioned-id",
      "Item ID must end with the exact item version.",
    );
  }

  if (
    item.stimulus.type !== "none" &&
    !safe(item.stimulus.altText) &&
    !hasGeneratedVisualDescription(item)
  ) {
    issue(
      "missing-visual-description",
      "Score-bearing visual must have explicit or deterministic accessible description.",
    );
  }

  if (item.response.type === "short-answer") {
    if (!safe(item.response.correctValue)) {
      issue(
        "missing-correct-value",
        "Short-answer item must define a non-empty correctValue.",
      );
    }
    if (item.template !== "short-answer") {
      issue(
        "template-response-mismatch",
        "Short-answer response must use the short-answer template.",
      );
    }
    return issues;
  }

  const options = item.response.options || [];
  if (!options.length) {
    issue("missing-options", "Choice item must define answer options.");
    return issues;
  }

  if (options.length < 2) {
    issue(
      "insufficient-options",
      "Choice/ordering item must define at least two options.",
    );
  }

  if (options.some((option) => !safe(option.label))) {
    issue("missing-option-label", "Every option must have a visible label.");
  }

  const normalizedLabels = options.map((option) =>
    safe(option.label).toLowerCase(),
  );
  if (new Set(normalizedLabels).size !== normalizedLabels.length) {
    issue(
      "duplicate-option-label",
      "Answer option labels must be unique within an item.",
    );
  }

  const ids = options.map((option) => option.id);
  if (new Set(ids).size !== ids.length) {
    issue("duplicate-option-id", "Choice option IDs must be unique.");
  }

  const correctIds = item.response.correctOptionIds || [];
  const optionIds = new Set(ids);

  if (new Set(correctIds).size !== correctIds.length) {
    issue(
      "duplicate-correct-option",
      "Correct option IDs must not contain duplicates.",
    );
  }

  for (const correctId of correctIds) {
    if (!optionIds.has(correctId)) {
      issue(
        "invalid-correct-option",
        `Correct option ID "${correctId}" does not exist in the item options.`,
      );
    }
  }

  if (item.response.type === "single-choice" && correctIds.length !== 1) {
    issue(
      "single-choice-answer-count",
      "Single-choice item must define exactly one correct option ID.",
    );
  }

  if (item.response.type === "multiple-choice" && !correctIds.length) {
    issue(
      "invalid-correct-option",
      "Multi-select item must define at least one correct option ID.",
    );
  }

  if (item.response.type === "ordering") {
    if (correctIds.length !== options.length) {
      issue(
        "ordering-answer-count",
        "Ordering item must define one correct ordered ID for every option.",
      );
    }
    if (item.template !== "ordering") {
      issue(
        "template-response-mismatch",
        "Ordering response must use the ordering template.",
      );
    }
  }

  if (
    item.template === "ordering" &&
    item.response.type !== "ordering"
  ) {
    issue(
      "template-response-mismatch",
      "Ordering template must use an ordering response.",
    );
  }

  return issues;
}

export function auditNumberOperationsPlacementItems() {
  return NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.flatMap(validatePlacementItem);
}
