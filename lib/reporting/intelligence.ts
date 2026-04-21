import type { AssessmentEngineResult } from "@/lib/assessmentEngine";

export type ReportingMode =
  | "parent_friendly"
  | "teacher_professional"
  | "authority_ready_concise";

export type ReportingIntelligence = {
  overallSummary: string;
  evidenceReadinessNote: string;
  strengths: string[];
  areasForGrowth: string[];
  nextSteps: string[];
  subjectInsights: Array<{
    subjectName: string;
    summary: string;
    strengths: string;
    growth: string;
    nextSteps: string;
    evidenceReadiness: string;
  }>;
};

export function generateReportingIntelligence(
  _result: AssessmentEngineResult,
  learnerName: string,
  _mode: ReportingMode,
): ReportingIntelligence {
  return {
    overallSummary: `${learnerName}'s reporting guidance is temporarily unavailable during rebuild.`,
    evidenceReadinessNote:
      "Reporting intelligence has been removed from active use during rebuild.",
    strengths: ["Continue using capture, planner, and reports without the removed guidance layer."],
    areasForGrowth: ["Reporting guidance is temporarily unavailable."],
    nextSteps: ["Keep saving evidence and reports while the rebuild is in progress."],
    subjectInsights: [],
  };
}
