import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import AssessmentFractionsLab from "@/app/components/clean/assessment-lab/AssessmentFractionsLab";

export const metadata: Metadata = {
  title: "Interpreting Fractions Lab | MyLearna",
  robots: { index: false, follow: false },
};

export default function FractionsLabPage() {
  return (
    <AssessmentAccessGate mode="lab">
      <AssessmentFractionsLab />
    </AssessmentAccessGate>
  );
}
