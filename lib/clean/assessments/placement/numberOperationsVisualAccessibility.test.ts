import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
} from "./numberOperationsItemRegistry";

describe("Number & Operations score-bearing visual accessibility", () => {
  it("gives every customer-route visual item a practical-observation alternative", () => {
    const visualItems = NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.filter(
      (entry) => entry.item.stimulus.type !== "none",
    );

    expect(visualItems).toHaveLength(9);

    for (const entry of visualItems) {
      expect(
        entry.item.analytics?.tags?.some((tag) =>
          tag.includes("accessible-form-required"),
        ),
        entry.item.id,
      ).toBe(true);
    }
  });

  it("does not expose the canonical quantity in the two place-value visual descriptions", () => {
    const byId = new Map(
      NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.map((entry) => [
        entry.item.id,
        entry.item,
      ]),
    );

    const sixteen = byId.get("myl-anchor-npv-p03-b-v1");
    const fortySeven = byId.get("myl-anchor-cnt-p07-b-v1");

    expect(sixteen?.stimulus.altText).not.toMatch(/one ten and six ones/i);
    expect(sixteen?.stimulus.altText).not.toContain("16");
    expect(fortySeven?.stimulus.altText).not.toMatch(/four tens and seven ones/i);
    expect(fortySeven?.stimulus.altText).not.toContain("47");
  });
});
