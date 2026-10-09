import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import StartingPointVisualTruthReview from "@/app/components/clean/assessment-starting-point/interactive/StartingPointVisualTruthReview";
import { requireAssessmentLabAccess } from "@/lib/clean/assessments/assessmentLabAccess.server";
import { getStartingPointVisualTruthInventory } from "@/lib/clean/assessments/interactivePlayer/startingPointVisualTruthAudit";

export const metadata: Metadata = {
  title: "Starting Point Visual Truth Audit | MyLearna",
  description: "Protected staff review of mathematical stimulus and canonical evidence coherence.",
  robots: { index: false, follow: false },
};

const VISUAL_TRUTH_ROUTE = "/assessments/maths-starting-point/visual-truth";

export default async function StartingPointVisualTruthAuditPage() {
  await requireAssessmentLabAccess(VISUAL_TRUTH_ROUTE);
  const entries = getStartingPointVisualTruthInventory();

  return (
    <AssessmentAccessGate mode="lab">
      <StartingPointVisualTruthReview entries={entries} />
    </AssessmentAccessGate>
  );
}
