import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_CONFIRMATION_REVIEW_ITEM_REGISTRY,
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
} from "./numberOperationsItemRegistry";

describe("Number & Operations customer-route item estate", () => {
  it("separates the 120 parent-route items from 20 confirmation-only review items", () => {
    expect(NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY).toHaveLength(140);
    expect(NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY).toHaveLength(120);
    expect(NUMBER_OPERATIONS_CONFIRMATION_REVIEW_ITEM_REGISTRY).toHaveLength(20);
    expect(
      NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.some(
        (entry) => entry.poolKind === "confirmation",
      ),
    ).toBe(false);
    expect(
      NUMBER_OPERATIONS_CONFIRMATION_REVIEW_ITEM_REGISTRY.every(
        (entry) => entry.poolKind === "confirmation",
      ),
    ).toBe(true);
  });
});
