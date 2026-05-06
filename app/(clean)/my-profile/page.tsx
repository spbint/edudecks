import { redirect } from "next/navigation";
import CleanProfileWorkspace from "@/app/components/clean/CleanProfileWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyCleanProfilePage() {
  if (!isCleanAppEnabled()) {
    redirect("/profile");
  }

  return <CleanProfileWorkspace />;
}
