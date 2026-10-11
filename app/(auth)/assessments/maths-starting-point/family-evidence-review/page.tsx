import type { Metadata } from "next";
import Link from "next/link";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import FamilyEvidenceReview from "@/app/components/clean/assessment-starting-point/FamilyEvidenceReview";
import { requireAssessmentLabAccess } from "@/lib/clean/assessments/assessmentLabAccess.server";

const FAMILY_EVIDENCE_REVIEW_ROUTE =
  "/assessments/maths-starting-point/family-evidence-review";

export const metadata: Metadata = {
  title: "Family Learning Evidence Preview | MyLearna",
  description:
    "Staff-only read-only preview of a future family Educational Intelligence evidence experience.",
  robots: { index: false, follow: false },
};

export default async function FamilyEvidenceReviewPage() {
  await requireAssessmentLabAccess(FAMILY_EVIDENCE_REVIEW_ROUTE);

  return (
    <AssessmentAccessGate mode="lab">
      <main
        style={{
          minHeight: "100vh",
          minWidth: 0,
          background: "#F7F8FC",
          padding: "clamp(14px, 4vw, 42px)",
        }}
      >
        <div
          style={{
            width: "min(1180px, 100%)",
            minWidth: 0,
            margin: "0 auto",
            display: "grid",
            gap: 18,
          }}
        >
          <nav aria-label="Starting Point staff preview">
            <Link
              href="/assessments/maths-starting-point/results-preview"
              style={{ color: "#17204B", fontWeight: 850, textDecoration: "none" }}
            >
              ← Back to staff Educational Intelligence results
            </Link>
          </nav>
          <FamilyEvidenceReview />
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
