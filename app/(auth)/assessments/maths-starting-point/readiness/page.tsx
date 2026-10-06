import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import {
  getMathsStartingPointCustomerReleaseBlockers,
} from "@/lib/clean/assessments/placement/numberOperationsCustomerReleaseReadiness";
import {
  NUMBER_OPERATIONS_ASSET_APPROVALS,
} from "@/lib/clean/assessments/placement/numberOperationsAssetApprovals";
import {
  NUMBER_OPERATIONS_CONFIRMATION_REVIEW_ITEM_REGISTRY,
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY,
} from "@/lib/clean/assessments/placement/numberOperationsItemRegistry";
import {
  getNumberOperationsItemReviewSummary,
} from "@/lib/clean/assessments/placement/numberOperationsItemReviewSummary";
import {
  getNumberOperationsFreshRecheckCoverage,
} from "@/lib/clean/assessments/placement/numberOperationsFreshRecheckCoverage";
import { MATHS_STARTING_POINT_RELEASE } from "@/lib/clean/assessments/mathsStartingPointRelease";
import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";

export const metadata: Metadata = {
  title: `${NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.shortDisplayName} readiness | MyLearna`,
  description:
    "Staff-only release readiness view for the Number & Operations starting-point utility.",
  robots: { index: false, follow: false },
};

const panel: React.CSSProperties = {
  border: "1px solid #E1E6F0",
  borderRadius: 18,
  background: "#FFFFFF",
  padding: 16,
  display: "grid",
  gap: 10,
};

const BLOCKER_LABELS: Record<string, string> = {
  "customer-visibility": "Customer visibility",
  "customer-navigation": "Customer My Pathways navigation",
  persistence: "Baseline persistence",
  "evidence-write": "Evidence write",
  "hosted-acceptance": "Hosted parent-flow acceptance",
  "mobile-acceptance": "Mobile parent-flow acceptance",
  "fresh-recheck-evidence": "Fresh recheck evidence",
  "draft-items": "Placement item release state",
  "pending-trusted-assets": "Trusted asset approval",
};

export default function MathsStartingPointReadinessPage() {
  const blockers = getMathsStartingPointCustomerReleaseBlockers();
  const draftItems = NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.filter(
    (entry) => entry.item.status !== "published",
  );
  const pendingAssets = NUMBER_OPERATIONS_ASSET_APPROVALS.filter(
    (approval) => approval.status !== "approved",
  );
  const itemReview = getNumberOperationsItemReviewSummary();
  const freshRecheck = getNumberOperationsFreshRecheckCoverage();
  const visualMix = Object.entries(itemReview.customerVisualTypeCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  return (
    <AssessmentAccessGate mode="lab">
      <main
        style={{
          minHeight: "100vh",
          background: "#F7F8FC",
          padding: "clamp(18px, 4vw, 42px)",
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            display: "grid",
            gap: 18,
          }}
        >
          <section style={panel}>
            <span
              style={{
                color: "#92400E",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Staff-only release readiness
            </span>
            <h1 style={{ margin: 0, color: "#17204B" }}>
              Number &amp; Operations starting point
            </h1>
            <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
              This page is read-only. It summarises the gates that must be cleared
              before the utility can be considered for customer release.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link
                href="/assessments/maths-starting-point"
                style={{
                  color: "#17204B",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                ← Back to starting-point preview
              </Link>
              <Link
                href="/assessments/maths-starting-point/asset-review"
                style={{
                  color: "#92400E",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Review pending currency asset
              </Link>
              <Link
                href="/assessments/maths-starting-point/item-review"
                style={{
                  color: "#17204B",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Review placement items
              </Link>
              <Link
                href="/assessments/maths-starting-point/visual-review"
                style={{
                  color: "#17204B",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Review all 10 score-bearing visuals
              </Link>
              <Link
                href="/assessments/maths-starting-point/player-showcase"
                style={{
                  color: "#5535DF",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Review all 220 items in the commercial player
              </Link>
            </div>
          </section>

          <section style={panel}>
            <strong style={{ color: "#17204B", fontSize: 18 }}>
              Current release phase
            </strong>
            <dl
              style={{
                margin: 0,
                display: "grid",
                gridTemplateColumns: "minmax(180px, 1fr) minmax(100px, auto)",
                gap: "8px 14px",
              }}
            >
              {[
                ["Phase", MATHS_STARTING_POINT_RELEASE.phase],
                ["Customer visible", String(MATHS_STARTING_POINT_RELEASE.customerVisible)],
                ["Customer navigation", String(MATHS_STARTING_POINT_RELEASE.customerNavigationEnabled)],
                ["Persistence", String(MATHS_STARTING_POINT_RELEASE.persistenceEnabled)],
                ["Evidence write", String(MATHS_STARTING_POINT_RELEASE.evidenceWriteEnabled)],
                ["Pathway mutation", String(MATHS_STARTING_POINT_RELEASE.pathwayMutationEnabled)],
                ["Hosted acceptance", String(MATHS_STARTING_POINT_RELEASE.hostedAcceptanceApproved)],
                ["Mobile acceptance", String(MATHS_STARTING_POINT_RELEASE.mobileAcceptanceApproved)],
                ["Fresh recheck forms", String(MATHS_STARTING_POINT_RELEASE.freshRecheckFormsApproved)],
              ].map(([label, value]) => (
                <React.Fragment key={label}>
                  <dt style={{ color: "#64748B" }}>{label}</dt>
                  <dd style={{ margin: 0, color: "#17204B", fontWeight: 800 }}>
                    {value}
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          </section>

          <section style={panel}>
            <strong style={{ color: "#17204B", fontSize: 18 }}>
              Customer release blockers · {blockers.length}
            </strong>
            <div style={{ display: "grid", gap: 10 }}>
              {blockers.map((blocker) => (
                <article
                  key={blocker.id}
                  style={{
                    border: "1px solid #F5D08A",
                    borderRadius: 14,
                    background: "#FFFDF5",
                    padding: 12,
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <strong style={{ color: "#92400E" }}>
                    {BLOCKER_LABELS[blocker.id] || blocker.id}
                    {typeof blocker.count === "number"
                      ? " · " + blocker.count
                      : ""}
                  </strong>
                  <span style={{ color: "#6B4F1D", lineHeight: 1.55 }}>
                    {blocker.message}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section style={panel}>
            <strong style={{ color: "#17204B" }}>Content review snapshot</strong>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 8,
              }}
            >
              {[
                ["All registry items", String(itemReview.totalItems)],
                ["Customer-route items", String(itemReview.customerRouteItems)],
                ["Confirmation-only review items", String(itemReview.confirmationReviewItems)],
                ["Automated structural issues", String(itemReview.structuralIssueCount)],
                ["Routing-only items", String(itemReview.routingOnlyItems)],
                ["Accessibility alternatives", String(itemReview.accessibilityAlternativeItems)],
                ["Pending-asset items", String(itemReview.pendingTrustedAssetItems)],
                ["Needs-attention customer items", String(itemReview.attentionCustomerItems)],
                ["Routine-review customer items", String(itemReview.routineCustomerItems)],
                ["Score-bearing visual items", String(itemReview.customerVisualItems)],
                ["Text-first customer items", String(itemReview.customerTextFirstItems)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    border: "1px solid #E1E6F0",
                    borderRadius: 12,
                    padding: 10,
                    display: "grid",
                    gap: 3,
                  }}
                >
                  <span style={{ color: "#64748B", fontSize: 12 }}>{label}</span>
                  <strong style={{ color: "#17204B", fontSize: 20 }}>{value}</strong>
                </div>
              ))}
            </div>
            <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
              {draftItems.length} of {NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.length} customer-route
              placement items remain non-published review items. The separate{" "}
              {NUMBER_OPERATIONS_CONFIRMATION_REVIEW_ITEM_REGISTRY.length} confirmation-only
              items remain staff/lab review inventory and do not block the v1 parent route.
            </span>
            <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
              Customer-route visual mix: {visualMix || "none"}.
            </span>
            <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
              {pendingAssets.length} trusted asset set
              {pendingAssets.length === 1 ? "" : "s"} remain pending review.
            </span>
            {pendingAssets.map((approval) => (
              <div
                key={approval.id}
                style={{
                  border: "1px solid #E1E6F0",
                  borderRadius: 12,
                  padding: 10,
                  display: "grid",
                  gap: 3,
                }}
              >
                <strong style={{ color: "#17204B" }}>{approval.id}</strong>
                <span style={{ color: "#64748B" }}>
                  {approval.subElementKey} · P{approval.pLevels.join("–P")}
                </span>
                <span style={{ color: "#4B5563", lineHeight: 1.5 }}>
                  {approval.note}
                </span>
              </div>
            ))}
          </section>

          <section style={panel}>
            <strong style={{ color: "#17204B" }}>Fresh recheck evidence</strong>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 8,
              }}
            >
              {[
                ["Progression levels required", String(freshRecheck.requiredProgressionLevels)],
                ["Levels with alternate evidence", String(freshRecheck.coveredProgressionLevels)],
                ["Levels still missing", String(freshRecheck.missingProgressionLevels)],
                ["Alternate draft items", String(freshRecheck.alternateItems)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    border: "1px solid #E1E6F0",
                    borderRadius: 12,
                    padding: 10,
                    display: "grid",
                    gap: 3,
                  }}
                >
                  <span style={{ color: "#64748B", fontSize: 12 }}>{label}</span>
                  <strong style={{ color: "#17204B", fontSize: 20 }}>{value}</strong>
                </div>
              ))}
            </div>
            <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
              Alternate evidence now covers all 48 required progression levels across the five
              Number &amp; Operations continua. The forms remain draft and customer release stays
              blocked until the alternate evidence has completed review and the full recheck
              route has passed hosted QA.
            </span>
          </section>

          <section
            style={{
              ...panel,
              borderColor: "#CFE3D5",
              background: "#F7FCF8",
            }}
          >
            <strong style={{ color: "#166534" }}>
              Nothing on this page changes release state
            </strong>
            <span style={{ color: "#4B5563", lineHeight: 1.55 }}>
              Clearing a blocker still requires the corresponding reviewed code,
              hosted QA, database action or explicit release approval. This view
              cannot publish items, approve assets, enable persistence or expose
              the feature to families.
            </span>
          </section>
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
