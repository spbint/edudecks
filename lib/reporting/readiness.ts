import type {
  AssessmentEngineResult,
  AssessmentEngineSubjectSummary,
} from "@/lib/assessmentEngine";

export type ReadinessStatus =
  | "Ready"
  | "Nearly Ready"
  | "Partial"
  | "Needs Evidence";

export type ReadinessSubject = {
  subjectName: string;
  status: ReadinessStatus;
  evidenceCount: number;
  recentEvidenceCount: number;
  assessmentSummary: string;
  explanation: string;
  nextCapture: string;
};

export type ReadinessReport = {
  overallStatus: ReadinessStatus;
  reportReady: boolean;
  explanation: string;
  subjectReadiness: ReadinessSubject[];
  evidenceGaps: Array<{
    standardId: string;
    officialCode: string;
    title: string;
    subjectName: string;
    reason: string;
  }>;
  captureGuidance: string[];
};

function summarizeSubject(
  subject: AssessmentEngineSubjectSummary,
): ReadinessSubject {
  const evidenceCount =
    subject.secureCount +
    subject.developingCount +
    subject.emergingCount +
    subject.insufficientCount;

  return {
    subjectName: subject.subjectName,
    status: evidenceCount > 0 ? "Partial" : "Needs Evidence",
    evidenceCount,
    recentEvidenceCount: 0,
    assessmentSummary: "Signals are temporarily unavailable during rebuild.",
    explanation: "This surface is temporarily simplified during rebuild.",
    nextCapture: "Continue capturing evidence normally while rebuild is in progress.",
  };
}

export function buildReadinessReport(
  result: AssessmentEngineResult,
): ReadinessReport {
  return {
    overallStatus: "Needs Evidence",
    reportReady: false,
    explanation: "Readiness guidance is temporarily unavailable during rebuild.",
    subjectReadiness: result.subjectSummaries.map(summarizeSubject),
    evidenceGaps: [],
    captureGuidance: [
      "Continue capturing evidence normally while rebuild is in progress.",
    ],
  };
}
