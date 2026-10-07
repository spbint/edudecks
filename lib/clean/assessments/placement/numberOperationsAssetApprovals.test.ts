import { describe, expect, it } from "vitest";
import { getNumberOperationsPlacementItemById } from "./numberOperationsItemRegistry";
import {
  NUMBER_OPERATIONS_ASSET_APPROVALS,
  getNumberOperationsAssetApproval,
  isNumberOperationsAssetApproved,
} from "./numberOperationsAssetApprovals";

describe("Number & Operations trusted asset approvals", () => {
  it("records the completed Australian currency human visual approval", () => {
    expect(NUMBER_OPERATIONS_ASSET_APPROVALS).toHaveLength(1);
    expect(
      getNumberOperationsAssetApproval({
        subElementKey: "understanding-money",
        pLevel: 1,
      }),
    ).toMatchObject({
      id: "australian-currency-schematic-v1",
      status: "approved",
      approvalProvenance: {
        approvalType: "human-visual-review",
        assetFamily: "Australian currency schematic",
        reviewedImplementationSha:
          "7ca0af353a4aef08b60b2462614e56ce24f8a0df",
        reviewResult: "approved",
        reviewDate: "2026-10-07",
      },
    });
    expect(
      isNumberOperationsAssetApproved({
        subElementKey: "understanding-money",
        pLevel: 1,
      }),
    ).toBe(true);
    expect(
      isNumberOperationsAssetApproved({
        subElementKey: "understanding-money",
        pLevel: 2,
      }),
    ).toBe(true);
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


it("scopes the approved currency asset only to real currency-token placement items", () => {
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
