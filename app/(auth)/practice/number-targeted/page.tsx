import CleanNumberTargetedPracticeViewer from "@/app/components/clean/CleanNumberTargetedPracticeViewer";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";

export default function NumberTargetedPracticePage() {
  return (
    <AssessmentAccessGate mode="legacy">
      <CleanNumberTargetedPracticeViewer />
    </AssessmentAccessGate>
  );
}
