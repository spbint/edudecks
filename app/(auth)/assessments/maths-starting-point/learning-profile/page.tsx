import type { Metadata } from "next";
import Link from "next/link";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import MathematicsLearningProfilePreview from "@/app/components/clean/assessment-starting-point/MathematicsLearningProfilePreview";
import { requireAssessmentLabAccess } from "@/lib/clean/assessments/assessmentLabAccess.server";

const PROFILE_PREVIEW_ROUTE =
  "/assessments/maths-starting-point/learning-profile";

export const metadata: Metadata = {
  title: "Mathematics Learning Profile V1 | MyLearna staff preview",
  description:
    "Staff-only review of the persistence-neutral Number & Operations Learning Profile.",
  robots: { index: false, follow: false },
};

export default async function MathematicsLearningProfilePreviewPage() {
  await requireAssessmentLabAccess(PROFILE_PREVIEW_ROUTE);

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
          <MathematicsLearningProfilePreview />
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
