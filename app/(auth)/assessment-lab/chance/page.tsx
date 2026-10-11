import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import AssessmentChanceLab from "@/app/components/clean/assessment-lab/AssessmentChanceLab";

export const metadata: Metadata = {
  title: "Understanding Chance Lab | MyLearna",
  robots: { index: false, follow: false },
};

export default function ChanceLabPage() {
  return (
    <AssessmentAccessGate mode="lab">
      <AssessmentChanceLab />
    </AssessmentAccessGate>
  );
}
