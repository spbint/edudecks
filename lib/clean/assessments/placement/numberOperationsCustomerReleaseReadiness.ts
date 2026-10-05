import { MATHS_STARTING_POINT_RELEASE } from "@/lib/clean/assessments/mathsStartingPointRelease";
import { NUMBER_OPERATIONS_ASSET_APPROVALS } from "./numberOperationsAssetApprovals";
import {
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
} from "./numberOperationsItemRegistry";

export type MathsStartingPointCustomerReleaseBlocker = {
  id:
    | "customer-visibility"
    | "customer-navigation"
    | "persistence"
    | "evidence-write"
    | "hosted-acceptance"
    | "mobile-acceptance"
    | "fresh-recheck-evidence"
    | "draft-items"
    | "pending-trusted-assets";
  message: string;
  count?: number;
};

export function getMathsStartingPointCustomerReleaseBlockers(): MathsStartingPointCustomerReleaseBlocker[] {
  const blockers: MathsStartingPointCustomerReleaseBlocker[] = [];

  if (!MATHS_STARTING_POINT_RELEASE.customerVisible) {
    blockers.push({
      id: "customer-visibility",
      message: "Customer visibility has not been approved.",
    });
  }

  if (!MATHS_STARTING_POINT_RELEASE.customerNavigationEnabled) {
    blockers.push({
      id: "customer-navigation",
      message: "Customer My Pathways navigation has not been approved.",
    });
  }

  if (!MATHS_STARTING_POINT_RELEASE.persistenceEnabled) {
    blockers.push({
      id: "persistence",
      message: "Baseline persistence has not been activated and smoke-tested.",
    });
  }

  if (!MATHS_STARTING_POINT_RELEASE.evidenceWriteEnabled) {
    blockers.push({
      id: "evidence-write",
      message:
        "Confirmed starting-point evidence is not yet authorised to write into the learner evidence flow.",
    });
  }

  if (!MATHS_STARTING_POINT_RELEASE.hostedAcceptanceApproved) {
    blockers.push({
      id: "hosted-acceptance",
      message:
        "The authenticated hosted parent-flow rehearsal has not been accepted.",
    });
  }

  if (!MATHS_STARTING_POINT_RELEASE.mobileAcceptanceApproved) {
    blockers.push({
      id: "mobile-acceptance",
      message:
        "The 390px/430px parent-flow mobile rehearsal has not been accepted.",
    });
  }

  if (!MATHS_STARTING_POINT_RELEASE.freshRecheckFormsApproved) {
    blockers.push({
      id: "fresh-recheck-evidence",
      message:
        "Fresh alternate assessment evidence for later rechecks has not yet been accepted across the customer-route areas.",
    });
  }

  const draftItems = NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.filter(
    (entry) => entry.item.status !== "published",
  );
  if (draftItems.length) {
    blockers.push({
      id: "draft-items",
      message:
        "Customer-route placement items remain non-published until academic and hosted QA are accepted.",
      count: draftItems.length,
    });
  }

  const pendingAssets = NUMBER_OPERATIONS_ASSET_APPROVALS.filter(
    (approval) => approval.status !== "approved",
  );
  if (pendingAssets.length) {
    blockers.push({
      id: "pending-trusted-assets",
      message:
        "At least one score-bearing trusted asset set still requires explicit visual approval.",
      count: pendingAssets.length,
    });
  }

  return blockers;
}

export function assertMathsStartingPointCustomerReleaseReady() {
  const blockers = getMathsStartingPointCustomerReleaseBlockers();
  if (blockers.length) {
    throw new Error(
      `Maths starting-point customer release is blocked: ${blockers
        .map((blocker) => blocker.id)
        .join(", ")}.`,
    );
  }
  return true;
}
