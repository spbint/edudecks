import { redirect } from "next/navigation";
import CleanOutputsWorkspace from "@/app/components/clean/CleanOutputsWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyOutputsPage() {
  if (!isCleanAppEnabled()) {
    redirect("/my-reports");
  }

  return <CleanOutputsWorkspace />;
}
