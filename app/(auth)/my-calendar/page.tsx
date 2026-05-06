import CleanCalendarWorkspace from "@/app/components/clean/CleanCalendarWorkspace";
import FamilyCalendarTemplateWorkspace from "@/app/components/FamilyCalendarTemplateWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyCalendarPage() {
  if (isCleanAppEnabled()) {
    return <CleanCalendarWorkspace />;
  }

  return <FamilyCalendarTemplateWorkspace />;
}
