import { describe, expect, it } from "vitest";
import { NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY } from "./numberOperationsItemRegistry";

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

describe("Number & Operations early prompt language load", () => {
  it("keeps Prep/Year 1 prompts concise in the first placement slice", () => {
    const early = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.filter((entry) =>
      /^(Prep|Prep–Year 1|Year 1)$/.test(entry.item.curriculum?.yearLevel || ""),
    );

    expect(early.length).toBeGreaterThan(0);

    for (const entry of early) {
      expect(
        wordCount(entry.item.prompt),
        `${entry.item.id}: ${entry.item.prompt}`,
      ).toBeLessThanOrEqual(18);
    }
  });

  it("keeps the five simplified early prompts under the same language ceiling", () => {
    const ids = new Set([
      "myl-anchor-add-p03-a-v1",
      "myl-anchor-add-p03-b-v1",
      "myl-search-add-p01-b-v1",
      "myl-search-mul-p01-b-v1",
      "myl-boundary-cnt-p03-c-v1",
    ]);

    const selected = NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.filter((entry) =>
      ids.has(entry.item.id),
    );

    expect(selected).toHaveLength(ids.size);
    for (const entry of selected) {
      expect(wordCount(entry.item.prompt), entry.item.id).toBeLessThanOrEqual(18);
    }
  });
});
