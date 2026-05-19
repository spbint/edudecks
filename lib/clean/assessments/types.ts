export const CLEAN_ASSESSMENT_SUBJECT_KEYS = ["mathematics", "english"] as const;

export const CLEAN_ASSESSMENT_STAGE_KEYS = [
  "Foundation",
  "Lower Primary",
  "Middle Primary",
  "Upper Primary",
  "Lower Secondary",
] as const;

export const CLEAN_ASSESSMENT_STATUS_VALUES = [
  "Not assessed yet",
  "Still developing",
  "Developing",
  "Secure",
  "Strong",
] as const;

export type CleanAssessmentSubjectKey = (typeof CLEAN_ASSESSMENT_SUBJECT_KEYS)[number];
export type CleanAssessmentStageKey = (typeof CLEAN_ASSESSMENT_STAGE_KEYS)[number];
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
