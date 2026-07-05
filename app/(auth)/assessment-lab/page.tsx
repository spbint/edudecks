import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import AssessmentLabWorkspace from "@/app/components/clean/assessment-lab/AssessmentLabWorkspace";

export const metadata = {
  title: "Assessment Lab | MyLearna",
};

export default function AssessmentLabPage() {
  return (
    <AssessmentAccessGate mode="lab">
      <AssessmentLabWorkspace />
    </AssessmentAccessGate>
  );
}
