import type { Metadata } from "next";
import Link from "next/link";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import MathsStartingPointWorkspace from "@/app/components/clean/assessment-starting-point/MathsStartingPointWorkspace";
import { requireAssessmentLabAccess } from "@/lib/clean/assessments/assessmentLabAccess.server";
import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";

const STARTING_POINT_ROUTE = "/assessments/maths-starting-point";

export const metadata: Metadata = {
  title: `${NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.shortDisplayName} | MyLearna`,
  description:
    "A staff-gated preview of MyLearna's parent-facing Number & Operations starting-point utility.",
  robots: { index: false, follow: false },
};

export default async function MathsStartingPointPage() {
  await requireAssessmentLabAccess(STARTING_POINT_ROUTE);

  return (
    <AssessmentAccessGate mode="lab">
      <main
        data-starting-point-route-main
        style={{
          minHeight: "100vh",
          background: "#F7F8FC",
          padding: "clamp(18px, 4vw, 42px)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "grid",
            gap: 20,
          }}
        >
          <section
            data-starting-point-route-header
            style={{
              border: "1px solid #DDE4EE",
              borderRadius: 24,
              background: "#FFFFFF",
              padding: "clamp(20px, 4vw, 32px)",
              display: "grid",
              gap: 10,
            }}
          >
            <span
              style={{
                color: "#166534",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}
            >
              Staff preview · future parent utility
            </span>
            <h1
              style={{
                margin: 0,
                color: "#17204B",
                fontSize: "clamp(32px, 5vw, 48px)",
              }}
            >
              {NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.commercialDisplayName}
            </h1>
            <p
              style={{
                margin: 0,
                maxWidth: 780,
                color: "#4B5563",
                lineHeight: 1.65,
                fontSize: 16,
              }}
            >
              {NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.parentSummary}{" "}
              {NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.parentEvidenceNote}{" "}
              {NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.accessibilityNote}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link
                href="/assessments/maths-starting-point/readiness"
                style={{
                  width: "fit-content",
                  color: "#17204B",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Staff: view release readiness
              </Link>
              <Link
                href="/assessments/maths-starting-point/asset-review"
                style={{
                  width: "fit-content",
                  color: "#92400E",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Staff: review Australian currency asset approval
              </Link>
            </div>
            <Link
              href="/assessments/maths-starting-point/item-review"
              style={{
                width: "fit-content",
                color: "#17204B",
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Staff: review all placement items
            </Link>

          </section>
          <MathsStartingPointWorkspace />
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
