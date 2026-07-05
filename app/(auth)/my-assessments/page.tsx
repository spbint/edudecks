import CleanAssessmentsWorkspace from "@/app/components/clean/CleanAssessmentsWorkspace";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";

export default function MyAssessmentsPage() {
  return (
    <AssessmentAccessGate mode="legacy">
      <CleanAssessmentsWorkspace />
    </AssessmentAccessGate>
  );
}
