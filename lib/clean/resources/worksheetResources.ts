import type { PathwaySubjectKey } from "@/lib/clean/pathways/pathwaySubjects";

export type WorksheetResourceType = "worksheet-pdf";

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
