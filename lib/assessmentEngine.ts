export type AssessmentEngineFilters = {
  classId?: string;
  studentId?: string;
  frameworkId?: string;
};

export type AssessmentEngineClass = {
  id: string;
  name: string;
  year_level: number | null;
};

export type AssessmentEngineStudent = {
  id: string;
  class_id: string | null;
  display_name: string;
};

export type AssessmentEngineFramework = {
  id: string;
  code: string;
  name: string;
};

export type AssessmentJudgementStatus =
  | "Secure"
  | "Developing"
  | "Emerging"
  | "Insufficient";

export type AssessmentJudgementConfidence = "High" | "Moderate" | "Low";

export type AssessmentEngineStandardRow = {
  standardId: string;
  frameworkId: string;
  officialCode: string;
  title: string;
  subjectName: string;
  strandName: string;
  levelLabel: string;
  judgement: AssessmentJudgementStatus;
  confidence: AssessmentJudgementConfidence;
  judgementScore: number;
  freshnessDays: number | null;
  evidenceCount: number;
  assessmentCount: number;
  evidenceStrength: number;
  assessmentStrength: number;
  overallStrength: number;
  latestEvidenceDate: string | null;
  latestAssessmentDate: string | null;
  rationale: string;
  nextStep: string;
};

export type AssessmentEngineSubjectSummary = {
  subjectName: string;
  secureCount: number;
  developingCount: number;
  emergingCount: number;
  insufficientCount: number;
  averageScore: number;
};

export type AssessmentEngineGap = {
  standardId: string;
  officialCode: string;
  title: string;
  subjectName: string;
  reason: string;
};

export type AssessmentEngineResult = {
  classes: AssessmentEngineClass[];
  students: AssessmentEngineStudent[];
  frameworks: AssessmentEngineFramework[];
  standards: AssessmentEngineStandardRow[];
  subjectSummaries: AssessmentEngineSubjectSummary[];
  headline: {
    secureCount: number;
    developingCount: number;
    emergingCount: number;
    insufficientCount: number;
    averageScore: number;
    evidenceLinkedCount: number;
    assessmentLinkedCount: number;
  };
  gaps: AssessmentEngineGap[];
};

export async function loadAssessmentEngine(
  _filters: AssessmentEngineFilters = {},
): Promise<AssessmentEngineResult> {
  return {
    classes: [],
    students: [],
    frameworks: [],
    standards: [],
    subjectSummaries: [],
    headline: {
      secureCount: 0,
      developingCount: 0,
      emergingCount: 0,
      insufficientCount: 0,
      averageScore: 0,
      evidenceLinkedCount: 0,
      assessmentLinkedCount: 0,
    },
    gaps: [],
  };
}
