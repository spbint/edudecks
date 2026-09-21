import { getClassicalCurriculumResourceForPathwayStep } from "@/lib/clean/resources/classicalCurriculumResources";
import { getEnglishWorksheetResourceForPathwayStep } from "@/lib/clean/resources/englishWorksheetResources";
import { getWorksheetResourceForPathwayStep as getMathWorksheetResourceForPathwayStep } from "@/lib/clean/resources/mathWorksheetResources";
import type { WorksheetResource, WorksheetStepContext } from "@/lib/clean/resources/worksheetResources";

export function getPathwayResourceForPathwayStep(
  context: WorksheetStepContext,
): WorksheetResource | null {
  if (context.subjectKey === "english") {
    return getEnglishWorksheetResourceForPathwayStep(context);
  }
  if (context.subjectKey === "classical") {
    return getClassicalCurriculumResourceForPathwayStep(context);
  }
  if (context.subjectKey === "mathematics") {
    return getMathWorksheetResourceForPathwayStep(context);
  }
  return null;
}
