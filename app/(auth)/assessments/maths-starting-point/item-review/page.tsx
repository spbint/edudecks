import type { Metadata } from "next";
import Link from "next/link";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import MathsStartingPointItemReviewCatalog from "@/app/components/clean/assessment-starting-point/MathsStartingPointItemReviewCatalog";

export const metadata: Metadata = {
  title: "Starting Point Item Review | MyLearna",
  description:
    "Staff-only read-only catalogue for reviewing MyLearna Number & Operations placement items.",
  robots: { index: false, follow: false },
};

export default function MathsStartingPointItemReviewPage() {
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
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gap: 18,
          }}
        >
          <section
            style={{
              border: "1px solid #DDE4EE",
              borderRadius: 20,
              background: "#FFFFFF",
              padding: "clamp(18px, 4vw, 26px)",
              display: "grid",
              gap: 8,
            }}
          >
            <span
              style={{
                color: "#92400E",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
              }}
            >
              Staff-only · read-only item QA
            </span>
            <h1 style={{ margin: 0, color: "#17204B" }}>
              Number &amp; Operations placement items
            </h1>
            <p style={{ margin: 0, color: "#4B5563", lineHeight: 1.6 }}>
              Review the exact draft items used by the adaptive starting-point
              engine. This page does not approve, publish or mutate any item.
            </p>
            <Link
              href="/assessments/maths-starting-point"
              style={{
                width: "fit-content",
                color: "#17204B",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              ← Back to Maths starting point
            </Link>
          </section>

          <MathsStartingPointItemReviewCatalog />
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
