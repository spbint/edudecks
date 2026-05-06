import CleanReportsWorkspace from "@/app/components/clean/CleanReportsWorkspace";
import FamilyReportsWorkspace from "@/app/components/FamilyReportsWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyReportsPage() {
  if (isCleanAppEnabled()) {
    return <CleanReportsWorkspace />;
  }

  return <FamilyReportsWorkspace includeShell />;
}
