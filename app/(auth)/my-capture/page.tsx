import { redirect } from "next/navigation";
import CleanCaptureWorkspace from "@/app/components/clean/CleanCaptureWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyCapturePage() {
  if (!isCleanAppEnabled()) {
    redirect("/capture");
  }

  return <CleanCaptureWorkspace />;
}
