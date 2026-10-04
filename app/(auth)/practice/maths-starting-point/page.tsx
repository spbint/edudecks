import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import CleanNumberTargetedPracticeViewer from "@/app/components/clean/CleanNumberTargetedPracticeViewer";

export const metadata: Metadata = {
  title: "Number & Operations Starting Point Practice | MyLearna",
  description:
    "Staff-gated preview of targeted practice recommended by the MyLearna Number & Operations starting-point utility.",
  robots: { index: false, follow: false },
};

export default function MathsStartingPointPracticePage() {
  return (
    <AssessmentAccessGate mode="lab">
      <main
        style={{
          minHeight: "100vh",
          background: "#F7F8FC",
          padding: "clamp(18px, 4vw, 42px)",
        }}
      >
        <CleanNumberTargetedPracticeViewer experience="maths-starting-point" />
      </main>
    </AssessmentAccessGate>
  );
}
