import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import AssessmentAnchorRoutingLab from "@/app/components/clean/assessment-lab/AssessmentAnchorRoutingLab";

export const metadata: Metadata = {
  title: "Assessment Anchor Routing Lab | MyLearna",
  robots: { index: false, follow: false },
};

export default function AssessmentAnchorRoutingLabPage() {
  return (
    <AssessmentAccessGate mode="lab">
      <AssessmentAnchorRoutingLab />
    </AssessmentAccessGate>
  );
}
