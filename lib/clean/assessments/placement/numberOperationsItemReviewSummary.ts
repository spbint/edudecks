import { NUMBER_OPERATIONS_ASSET_APPROVALS } from "./numberOperationsAssetApprovals";
import {
  NUMBER_OPERATIONS_CONFIRMATION_REVIEW_ITEM_REGISTRY,
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
  NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY,
} from "./numberOperationsItemRegistry";
import { auditNumberOperationsPlacementItems } from "./numberOperationsItemQuality";

export type NumberOperationsItemReviewSummary = {
  totalItems: number;
  customerRouteItems: number;
  confirmationReviewItems: number;
  statusCounts: Record<string, number>;
  structuralIssueCount: number;
  routingOnlyItems: number;
  accessibilityAlternativeItems: number;
  pendingTrustedAssetItems: number;
  customerVisualItems: number;
  customerTextFirstItems: number;
  customerVisualTypeCounts: Record<string, number>;
  cleanStructuralItems: number;
};

export function getNumberOperationsItemReviewSummary(): NumberOperationsItemReviewSummary {
  const issues = auditNumberOperationsPlacementItems();
  const issueItemIds = new Set(issues.map((issue) => issue.itemId));
  const pendingAssetItemIds = new Set(
    NUMBER_OPERATIONS_ASSET_APPROVALS
      .filter((approval) => approval.status !== "approved")
      .flatMap((approval) => approval.itemIds),
  );

  const statusCounts: Record<string, number> = {};
  const customerVisualTypeCounts: Record<string, number> = {};
  let routingOnlyItems = 0;
  let accessibilityAlternativeItems = 0;

  for (const entry of NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY) {
    statusCounts[entry.item.status] =
      (statusCounts[entry.item.status] || 0) + 1;

    const tags = entry.item.analytics?.tags || [];
    if (tags.some((tag) => tag.includes("hybrid-routing-only"))) {
      routingOnlyItems += 1;
    }
    if (tags.some((tag) => tag.includes("accessible-form-required"))) {
      accessibilityAlternativeItems += 1;
    }
  }

  for (const entry of NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY) {
    const stimulusType = entry.item.stimulus.type;
    if (stimulusType !== "none") {
      customerVisualTypeCounts[stimulusType] =
        (customerVisualTypeCounts[stimulusType] || 0) + 1;
    }
  }

  const customerVisualItems = Object.values(customerVisualTypeCounts).reduce(
    (total, count) => total + count,
    0,
  );

  return {
    totalItems: NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.length,
    customerRouteItems: NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.length,
    confirmationReviewItems:
      NUMBER_OPERATIONS_CONFIRMATION_REVIEW_ITEM_REGISTRY.length,
    statusCounts,
    structuralIssueCount: issues.length,
    routingOnlyItems,
    accessibilityAlternativeItems,
    pendingTrustedAssetItems: Array.from(pendingAssetItemIds).filter((itemId) =>
      NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.some(
        (entry) => entry.item.id === itemId,
      ),
    ).length,
    customerVisualItems,
    customerTextFirstItems:
      NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.length -
      customerVisualItems,
    customerVisualTypeCounts,
    cleanStructuralItems:
      NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY.length - issueItemIds.size,
  };
}
