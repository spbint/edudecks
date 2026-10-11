import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import AssessmentNumeracySpineLab from "@/app/components/clean/assessment-lab/AssessmentNumeracySpineLab";

export const metadata: Metadata = {
  title: "Numeracy Spine | MyLearna Assessment Lab",
  robots: { index: false, follow: false },
};

export default function NumeracySpineLabPage() {
  return (
    <AssessmentAccessGate mode="lab">
      <AssessmentNumeracySpineLab />
    </AssessmentAccessGate>
  );
}
