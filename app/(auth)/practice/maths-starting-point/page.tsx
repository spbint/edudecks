import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import CleanNumberTargetedPracticeViewer from "@/app/components/clean/CleanNumberTargetedPracticeViewer";

export const metadata: Metadata = {
  title: "Maths Starting Point Practice | MyLearna",
  description:
    "Staff-gated preview of targeted practice recommended by the MyLearna Maths starting-point utility.",
  robots: { index: false, follow: false },
};

export default function MathsStartingPointPracticePage() {
  return (
    <AssessmentAccessGate mode="lab">
      <CleanNumberTargetedPracticeViewer experience="maths-starting-point" />
    </AssessmentAccessGate>
  );
}
