import type { PathwaySubjectKey } from "@/lib/clean/pathways/pathwaySubjects";

export type WorksheetResourceType = "worksheet-pdf" | "booklet-pdf" | "reading-pdf" | "reference-pdf";

export function normalizePathwayResourceType(
  value: unknown,
): WorksheetResourceType | null {
  const resourceType = String(value ?? "").trim();
  return (
    ["worksheet-pdf", "booklet-pdf", "reading-pdf", "reference-pdf"] as const
  ).includes(resourceType as WorksheetResourceType)
    ? (resourceType as WorksheetResourceType)
    : null;
}

export function pathwayResourceLabel(
  resourceType: WorksheetResourceType | null | undefined,
) {
  switch (resourceType) {
    case "booklet-pdf":
      return "Booklet";
    case "reading-pdf":
      return "Reading";
    case "reference-pdf":
      return "Reference";
    case "worksheet-pdf":
      return "Worksheet";
    default:
      return null;
  }
}

export function pathwayResourceAvailabilityLabel(
  resourceType: WorksheetResourceType | null | undefined,
) {
  const label = pathwayResourceLabel(resourceType);
  return label ? `${label} available` : null;
}

export type WorksheetResource = {
  pathwayStepId: string;
  stepKey: string;
  subjectKey: PathwaySubjectKey;
  strandKey: string;
  stageKey: string;
  stageDisplay?: string;
  stepNumber: number;
  pathwayStepTitle?: string;
  title: string;
  curriculumCode?: string;
  concept?: string;
  includesAnswerSheet?: boolean;
  regionalVariants?: string[];
  containsRegionalMoneyPages?: boolean;
  fileName: string;
  href: string;
  resourceType: WorksheetResourceType;
};

export type WorksheetStepContext = {
  pathwayStepId?: string | null;
  stepKey?: string | null;
  subjectKey?: string | null;
  strandKey?: string | null;
  stageKey?: string | null;
};
