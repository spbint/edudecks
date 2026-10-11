import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import AssessmentMeasurementUnitsLab from "@/app/components/clean/assessment-lab/AssessmentMeasurementUnitsLab";

export const metadata: Metadata = {
  title: "Measurement Units Lab | MyLearna",
  robots: { index: false, follow: false },
};

export default function MeasurementUnitsLabPage() {
  return (
    <AssessmentAccessGate mode="lab">
      <AssessmentMeasurementUnitsLab />
    </AssessmentAccessGate>
  );
}
