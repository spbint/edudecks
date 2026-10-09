import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import MathsStartingPointItemReview from "@/app/components/clean/assessment-starting-point/MathsStartingPointItemReview";

export const metadata: Metadata = {
  title: "Starting Point Item Review | MyLearna",
  description:
    "Staff-only QA review of the Number & Operations placement item estate.",
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
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <MathsStartingPointItemReview />
        </div>
      </main>
    </AssessmentAccessGate>
  );
}
