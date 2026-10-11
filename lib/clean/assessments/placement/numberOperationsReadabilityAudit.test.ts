import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
} from "./numberOperationsItemRegistry";

describe("Number & Operations parent-reading burden", () => {
  it("keeps customer-route prompts short enough for a phone-led check", () => {
    for (const entry of NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY) {
      expect(
        entry.item.prompt.length,
        `${entry.item.id}: ${entry.item.prompt}`,
      ).toBeLessThanOrEqual(120);
    }
  });

  it("keeps answer-option text bounded on phone screens", () => {
    for (const entry of NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY) {
      for (const option of entry.item.response.options || []) {
        expect(
          option.label.length,
          `${entry.item.id}: ${option.label}`,
        ).toBeLessThanOrEqual(80);
      }
    }
  });

  it("documents the one intentionally long P10 financial comparison option", () => {
    const item = NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.find(
      (entry) => entry.item.id === "myl-search-mon-p10-b-v1",
    )?.item;
    expect(item).toBeTruthy();
    if (!item) return;

    expect(
      Math.max(...(item.response.options || []).map((option) => option.label.length)),
    ).toBe(72);
  });
});
