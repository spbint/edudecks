import type { Metadata } from "next";
import CleanNumberAssessmentPlayer from "@/app/components/clean/CleanNumberAssessmentPlayer";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";

export const metadata: Metadata = {
  title: "Number Assessment | MyLearna",
  description:
    "A MyLearna Number assessment session with switchable Number focus areas.",
};

export default function NumberAssessmentPage() {
  return (
    <AssessmentAccessGate mode="legacy">
      <CleanNumberAssessmentPlayer />
    </AssessmentAccessGate>
  );
}
