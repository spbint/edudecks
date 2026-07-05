import ActivityPlayerV5 from "@/app/components/clean/activity-player-v5/ActivityPlayerV5";
import { buildActivityPlayerV5Samples } from "@/app/components/clean/activity-player-v5/sampleActivities";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";

export const metadata = {
  title: "Activity Player V5 Preview | MyLearna",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ActivityPlayerV5PreviewPage() {
  return (
    <AssessmentAccessGate mode="legacy">
      <ActivityPlayerV5
        activities={buildActivityPlayerV5Samples()}
        chrome="embedded"
      />
    </AssessmentAccessGate>
  );
}
