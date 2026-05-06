import { redirect } from "next/navigation";
import CleanSettingsWorkspace from "@/app/components/clean/CleanSettingsWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyCleanSettingsPage() {
  if (!isCleanAppEnabled()) {
    redirect("/settings");
  }

  return <CleanSettingsWorkspace />;
}
