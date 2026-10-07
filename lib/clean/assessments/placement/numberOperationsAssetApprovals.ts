import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";

export type NumberOperationsAssetApprovalStatus =
  | "pending-review"
  | "approved";

export type NumberOperationsAssetApproval = {
  id: string;
  status: NumberOperationsAssetApprovalStatus;
  approvalProvenance?: {
    approvalType: "human-visual-review";
    assetFamily: string;
    reviewedImplementationSha: string;
    reviewResult: "approved";
    reviewDate: string;
  };
  subElementKey: NumberOperationsSubElementKey;
  pLevels: number[];
  itemIds: string[];
  reviewCriteria: string[];
  note: string;
};

export const NUMBER_OPERATIONS_ASSET_APPROVALS: NumberOperationsAssetApproval[] = [
  {
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
    subElementKey: "understanding-money",
    pLevels: [1, 2],
    itemIds: [
      "myl-search-mon-p01-b-v1",
      "myl-anchor-mon-p02-a-v1",
      "myl-anchor-mon-p02-b-v1",
    ],
    reviewCriteria: [
      "Denomination labels are unambiguous and match Australian money values.",
      "Relative coin sizes and the 50c shape are represented consistently.",
      "Each denomination reads as a classroom coin schematic rather than a generic token or chip.",
      "Phone rendering remains legible at 390px and 430px widths.",
      "Accessible description does not introduce ambiguity or expose an unrelated answer.",
    ],
    note:
      "Human visual review approved the trusted Australian coin system at the asset level only; customer release remains separately gated.",
  },
];

export function getNumberOperationsAssetApproval(input: {
  subElementKey: NumberOperationsSubElementKey;
  pLevel: number;
}) {
  return (
    NUMBER_OPERATIONS_ASSET_APPROVALS.find(
      (approval) =>
        approval.subElementKey === input.subElementKey &&
        approval.pLevels.includes(input.pLevel),
    ) || null
  );
}

export function isNumberOperationsAssetApproved(input: {
  subElementKey: NumberOperationsSubElementKey;
  pLevel: number;
}) {
  return getNumberOperationsAssetApproval(input)?.status === "approved";
}
