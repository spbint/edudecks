import { describe, expect, it } from "vitest";
import {
  auditNumberOperationsPlacementItems,
  validatePlacementItem,
} from "./numberOperationsItemQuality";
import {
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
} from "./numberOperationsItemRegistry";

describe("Number Operations placement item quality", () => {
  it("passes the structural quality gate across the full canonical bank", () => {
    expect(auditNumberOperationsPlacementItems()).toEqual([]);
  });

  it("detects an invalid correct option without mutating the registry", () => {
    const source = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.find(
      (entry) => entry.item.response.type === "single-choice",
    );
    expect(source).toBeTruthy();
    if (!source) return;

    const issues = validatePlacementItem({
      ...source,
      item: {
        ...source.item,
        response: {
          ...source.item.response,
          correctOptionIds: ["does-not-exist"],
        },
      },
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "invalid-correct-option" }),
      ]),
    );
  });
});


it("detects duplicate option labels and duplicate correct IDs", () => {
  const source = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.find(
    (entry) => entry.item.response.type === "multiple-choice",
  );
  expect(source).toBeTruthy();
  if (!source) return;

  const options = source.item.response.options || [];
  expect(options.length).toBeGreaterThanOrEqual(2);
  const first = options[0]!;
  const second = options[1]!;

  const issues = validatePlacementItem({
    ...source,
    item: {
      ...source.item,
      response: {
        ...source.item.response,
        options: [
          first,
          { ...second, label: first.label },
          ...options.slice(2),
        ],
        correctOptionIds: [
          source.item.response.correctOptionIds?.[0] || first.id,
          source.item.response.correctOptionIds?.[0] || first.id,
        ],
      },
    },
  });

  expect(issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: "duplicate-option-label" }),
      expect.objectContaining({ code: "duplicate-correct-option" }),
    ]),
  );
});

it("detects ordering template/response mismatches", () => {
  const source = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.find(
    (entry) => entry.item.response.type === "ordering",
  );
  expect(source).toBeTruthy();
  if (!source) return;

  const issues = validatePlacementItem({
    ...source,
    item: {
      ...source.item,
      template: "multiple-choice",
    },
  });

  expect(issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: "template-response-mismatch" }),
    ]),
  );
});

it("detects short-answer template/response mismatches", () => {
  const source = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.find(
    (entry) => entry.item.response.type === "short-answer",
  );
  expect(source).toBeTruthy();
  if (!source) return;

  const issues = validatePlacementItem({
    ...source,
    item: {
      ...source.item,
      template: "multiple-choice",
    },
  });

  expect(issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: "template-response-mismatch" }),
    ]),
  );
});
