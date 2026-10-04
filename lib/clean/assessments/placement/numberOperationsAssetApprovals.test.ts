import { describe, expect, it } from "vitest";
import { getNumberOperationsPlacementItemById } from "./numberOperationsItemRegistry";
import {
  NUMBER_OPERATIONS_ASSET_APPROVALS,
  getNumberOperationsAssetApproval,
  isNumberOperationsAssetApproved,
} from "./numberOperationsAssetApprovals";

describe("Number & Operations trusted asset approvals", () => {
  it("keeps Australian currency P1-P2 pending until hosted visual review passes", () => {
    expect(NUMBER_OPERATIONS_ASSET_APPROVALS).toHaveLength(1);
    expect(
      getNumberOperationsAssetApproval({
        subElementKey: "understanding-money",
        pLevel: 1,
      }),
    ).toMatchObject({
      id: "australian-currency-schematic-v1",
      status: "pending-review",
    });
    expect(
      isNumberOperationsAssetApproved({
        subElementKey: "understanding-money",
        pLevel: 1,
      }),
    ).toBe(false);
    expect(
      isNumberOperationsAssetApproved({
        subElementKey: "understanding-money",
        pLevel: 2,
      }),
    ).toBe(false);
  });

  it("does not invent asset gates for direct non-money progression levels", () => {
    expect(
      getNumberOperationsAssetApproval({
        subElementKey: "number-place-value",
        pLevel: 6,
      }),
    ).toBeNull();
    expect(
      isNumberOperationsAssetApproved({
        subElementKey: "number-place-value",
        pLevel: 6,
      }),
    ).toBe(false);
  });
});


it("scopes the pending currency approval only to real currency-token placement items", () => {
  const approval = NUMBER_OPERATIONS_ASSET_APPROVALS.find(
    (candidate) => candidate.id === "australian-currency-schematic-v1",
  );
  expect(approval).toBeTruthy();
  if (!approval) return;

  expect(approval.itemIds).toHaveLength(3);

  for (const itemId of approval.itemIds) {
    const entry = getNumberOperationsPlacementItemById(itemId);
    expect(entry, itemId).not.toBeNull();
    expect(entry?.item.stimulus.type, itemId).toBe("currency-tokens");
  }
});
