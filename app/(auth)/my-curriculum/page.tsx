import CleanCurriculumWorkspace from "@/app/components/clean/CleanCurriculumWorkspace";
import FamilyCurriculumMapWorkspace from "@/app/components/FamilyCurriculumMapWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyCurriculumPage() {
  if (isCleanAppEnabled()) {
    return <CleanCurriculumWorkspace />;
  }

  return <FamilyCurriculumMapWorkspace />;
}
