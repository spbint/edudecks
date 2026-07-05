import ActivityPlayerV4 from "@/app/components/clean/activity-player-v4/ActivityPlayerV4";
import { buildActivityPlayerV4Samples } from "@/app/components/clean/activity-player-v4/activityPlayerV4Samples";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";

export const metadata = {
  title: "Activity Player V4 Preview | MyLearna",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ActivityPlayerV4PreviewPage() {
  return (
    <AssessmentAccessGate mode="legacy">
      <ActivityPlayerV4
        samples={buildActivityPlayerV4Samples()}
        chrome="embedded"
        previewLabel="Activity Player V4 preview"
        showQuestionPicker
      />
    </AssessmentAccessGate>
  );
}
