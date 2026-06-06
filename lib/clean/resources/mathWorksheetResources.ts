import type { PathwaySubjectKey } from "@/lib/clean/pathways/pathwaySubjects";

export type MathWorksheetResourceType = "worksheet-pdf";

export type MathWorksheetResource = {
  pathwayStepId: string;
  stepKey: string;
  subjectKey: PathwaySubjectKey;
  strandKey: string;
  stageKey: string;
  stepNumber: number;
  title: string;
  fileName: string;
  href: string;
  resourceType: MathWorksheetResourceType;
};

export type MathWorksheetStepContext = {
  pathwayStepId?: string | null;
  stepKey?: string | null;
  subjectKey?: string | null;
  strandKey?: string | null;
  stageKey?: string | null;
};

const SMALL_QUANTITIES_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S001-Recognise-Small-Quantities-Without-Counting.pdf";

export const MATH_WORKSHEET_RESOURCES: MathWorksheetResource[] = [
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::recognise-small-quantities-without-counting",
    stepKey: "recognise-small-quantities-without-counting",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 1,
    title: "Recognise Small Quantities Without Counting",
    fileName: SMALL_QUANTITIES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${SMALL_QUANTITIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function getWorksheetResourceForPathwayStep(
  context: MathWorksheetStepContext,
): MathWorksheetResource | null {
  const pathwayStepId = safe(context.pathwayStepId);
  const stepKey = safe(context.stepKey);
  const subjectKey = safe(context.subjectKey);
  const strandKey = safe(context.strandKey);
  const stageKey = safe(context.stageKey);

  return (
    MATH_WORKSHEET_RESOURCES.find((resource) => {
      if (pathwayStepId && resource.pathwayStepId === pathwayStepId) {
        return true;
      }

      return (
        Boolean(stepKey) &&
        resource.stepKey === stepKey &&
        resource.subjectKey === subjectKey &&
        resource.strandKey === strandKey &&
        resource.stageKey === stageKey
      );
    }) ?? null
  );
}

