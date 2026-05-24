import {
  PATHWAY_STAGE_ORDER,
  type PathwayStageKey,
} from "@/lib/clean/pathways/mathematicsNumberPrototype";
import {
  PATHWAY_SUBJECTS,
  type PathwaySubjectKey,
} from "@/lib/clean/pathways/pathwaySubjects";

export const CLEAN_ASSESSMENT_SUBJECT_KEYS = PATHWAY_SUBJECTS.filter(
  (subject) => subject.status === "detailed",
).map((subject) => subject.key) as PathwaySubjectKey[];

export const CLEAN_ASSESSMENT_STAGE_KEYS = PATHWAY_STAGE_ORDER as readonly PathwayStageKey[];

export const CLEAN_ASSESSMENT_STAGE_TITLES: Record<PathwayStageKey, string> = {
  "foundation-kindergarten": "Foundation / Kindergarten",
  "lower-primary": "Lower Primary",
  "middle-primary": "Middle Primary",
  "upper-primary": "Upper Primary",
  "lower-secondary": "Lower Secondary",
  "years-9-10-consolidation": "Years 9–10 / consolidation",
};

export const CLEAN_ASSESSMENT_LEGACY_STAGE_MAP: Record<string, PathwayStageKey> = {
  foundation: "foundation-kindergarten",
  "foundation / kindergarten": "foundation-kindergarten",
  kindergarten: "foundation-kindergarten",
  "foundation-kindergarten": "foundation-kindergarten",
  "lower primary": "lower-primary",
  "lower-primary": "lower-primary",
  "middle primary": "middle-primary",
  "middle-primary": "middle-primary",
  "upper primary": "upper-primary",
  "upper-primary": "upper-primary",
  "lower secondary": "lower-secondary",
  "lower-secondary": "lower-secondary",
  "years 9-10 / consolidation": "years-9-10-consolidation",
  "years 9–10 / consolidation": "years-9-10-consolidation",
  "years-9-10-consolidation": "years-9-10-consolidation",
};

export const CLEAN_ASSESSMENT_STATUS_VALUES = [
  "Not assessed yet",
  "Still developing",
  "Developing",
  "Secure",
  "Strong",
] as const;

export type CleanAssessmentSubjectKey = PathwaySubjectKey;
export type CleanAssessmentStageKey = PathwayStageKey;
export type CleanAssessmentStatusValue = (typeof CLEAN_ASSESSMENT_STATUS_VALUES)[number];

export type CleanAssessmentSkillStatus = {
  id: string;
  familyId: string;
  learnerId: string;
  subjectKey: CleanAssessmentSubjectKey;
  skillKey: string;
  stageKey: CleanAssessmentStageKey;
  status: CleanAssessmentStatusValue;
  note: string | null;
  createdByUserId: string;
  createdAt: string | null;
  updatedAt: string | null;
  pathwayStepId: string | null;
  strandKey: string | null;
  stepKey: string | null;
};

export type ListCleanAssessmentSkillStatusesOptions = {
  subjectKey?: CleanAssessmentSubjectKey | null;
};

export type UpsertCleanAssessmentSkillStatusInput = {
  learnerId: string;
  subjectKey: CleanAssessmentSubjectKey;
  skillKey: string;
  stageKey: CleanAssessmentStageKey;
  status: CleanAssessmentStatusValue;
  note?: string | null;
};

export type CleanAssessmentEvidenceLink = {
  sourceContext: "my-assessments";
  statusRecordId: string;
  statusSavedAt: string | null;
  subjectKey: CleanAssessmentSubjectKey;
  skillKey: string;
  stageKey: CleanAssessmentStageKey;
  assessmentStatus: CleanAssessmentStatusValue;
};

export function getCleanAssessmentStageTitle(stageKey: CleanAssessmentStageKey) {
  return CLEAN_ASSESSMENT_STAGE_TITLES[stageKey];
}
