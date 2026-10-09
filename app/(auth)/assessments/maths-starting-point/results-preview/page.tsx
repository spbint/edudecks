import type { Metadata } from "next";
import Link from "next/link";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import LearningEvidenceResultsPreview from "@/app/components/clean/assessment-starting-point/LearningEvidenceResultsPreview";
import { requireAssessmentLabAccess } from "@/lib/clean/assessments/assessmentLabAccess.server";

const RESULTS_PREVIEW_ROUTE =
  "/assessments/maths-starting-point/results-preview";

export const metadata: Metadata = {
  title: "My Results Educational Intelligence Preview | MyLearna",
  description:
    "Staff-only synthetic preview of append-safe Learning Evidence Result history.",
  robots: { index: false, follow: false },
};

export default async function LearningEvidenceResultsPreviewPage() {
  await requireAssessmentLabAccess(RESULTS_PREVIEW_ROUTE);

  return (
    <AssessmentAccessGate mode="lab">
      <main
        style={{
          minHeight: "100vh",
          background: "#F7F8FC",
          padding: "clamp(16px, 4vw, 42px)",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 20 }}>
          <nav aria-label="Starting Point staff preview">
            <Link
              href="/assessments/maths-starting-point"
              style={{ color: "#17204B", fontWeight: 850, textDecoration: "none" }}
            >
              ← Back to the real Starting Point journey
            </Link>
          </nav>
          <LearningEvidenceResultsPreview />
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
