import CleanDayWorkspace from "@/app/components/clean/CleanDayWorkspace";
import MyDayWorkspace from "@/app/components/MyDayWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyDayPage() {
  if (isCleanAppEnabled()) {
    return <CleanDayWorkspace />;
  }

  return <MyDayWorkspace />;
}
