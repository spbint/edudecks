import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import AssessmentItemReviewLab from "@/app/components/clean/assessment-lab/AssessmentItemReviewLab";

export const metadata: Metadata = {
  title: "Assessment Item Review Lab | MyLearna",
  robots: { index: false, follow: false },
};

export default function AssessmentItemReviewLabPage() {
  return (
    <AssessmentAccessGate mode="lab">
      <AssessmentItemReviewLab />
    </AssessmentAccessGate>
  );
}
