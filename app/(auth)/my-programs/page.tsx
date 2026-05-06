import CleanProgramsWorkspace from "@/app/components/clean/CleanProgramsWorkspace";
import FamilyProgramsWorkspace from "@/app/components/FamilyProgramsWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyProgramsPage() {
  if (isCleanAppEnabled()) {
    return <CleanProgramsWorkspace />;
  }

  return <FamilyProgramsWorkspace />;
}
