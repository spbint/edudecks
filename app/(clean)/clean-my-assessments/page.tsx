import CleanAssessmentsWorkspace from "@/app/components/clean/CleanAssessmentsWorkspace";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";

export default function CleanMyAssessmentsPage() {
  return (
    <AssessmentAccessGate mode="legacy">
      <CleanAssessmentsWorkspace />
    </AssessmentAccessGate>
  );
}
