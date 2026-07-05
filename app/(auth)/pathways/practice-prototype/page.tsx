import type { Metadata } from "next";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import CleanPathwayPracticeWorkspace from "@/app/components/clean/CleanPathwayPracticeWorkspace";
import { makeNumbersTo10Practice } from "@/lib/clean/pathways/practiceActivities";

export const metadata: Metadata = {
  title: "Pathway Practice | MyLearna",
  description:
    "A focused MyLearna practice experience connected to the learner's current pathway step.",
};

export default function PathwayPracticePage() {
  return (
    <AssessmentAccessGate mode="legacy">
      <CleanPathwayPracticeWorkspace activity={makeNumbersTo10Practice} />
    </AssessmentAccessGate>
  );
}
