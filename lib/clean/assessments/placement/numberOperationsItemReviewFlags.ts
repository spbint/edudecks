import { NUMBER_OPERATIONS_ASSET_APPROVALS } from "./numberOperationsAssetApprovals";
import type {
  NumberOperationsPlacementItemRegistryEntry,
} from "./numberOperationsItemRegistry";

export type NumberOperationsItemReviewFlag =
  | "routing-only"
  | "accessibility-alternative"
  | "pending-trusted-asset";

const LABELS: Record<NumberOperationsItemReviewFlag, string> = {
  "routing-only": "Routing-only evidence",
  "accessibility-alternative": "Practical observation alternative required",
  "pending-trusted-asset": "Trusted asset pending review",
};

export function getNumberOperationsItemReviewFlags(
  entry: NumberOperationsPlacementItemRegistryEntry,
): NumberOperationsItemReviewFlag[] {
  const flags: NumberOperationsItemReviewFlag[] = [];
  const tags = entry.item.analytics?.tags || [];

  if (tags.some((tag) => tag.includes("hybrid-routing-only"))) {
    flags.push("routing-only");
  }
  if (tags.some((tag) => tag.includes("accessible-form-required"))) {
    flags.push("accessibility-alternative");
  }

  const pendingAsset = NUMBER_OPERATIONS_ASSET_APPROVALS.some(
    (approval) =>
      approval.status !== "approved" &&
      approval.itemIds.includes(entry.item.id),
  );
  if (pendingAsset) {
    flags.push("pending-trusted-asset");
  }

  return flags;
}

export function numberOperationsItemReviewFlagLabel(
  flag: NumberOperationsItemReviewFlag,
) {
  return LABELS[flag];
}
