import type { CleanReportStatus } from "@/lib/clean/reports/types";

export type ReportNextAction =
  | "choose_learner"
  | "choose_reporting_period"
  | "review_evidence"
  | "start_report"
  | "continue_report"
  | "preview_report"
  | "download_report";

export type ReportNextActionInput = {
  hasLearner: boolean;
  hasReportingPeriod: boolean;
  hasReportEvidence: boolean;
  hasSelectedReport: boolean;
  reportStatus: CleanReportStatus | null;
};

/**
 * Selects a single factual next action for the existing report lifecycle.
 * This describes configured report context only; it makes no judgement about
 * a learner's progress, mastery, or the quality of their evidence.
 */
export function resolveReportNextAction({
  hasLearner,
  hasReportingPeriod,
  hasReportEvidence,
  hasSelectedReport,
  reportStatus,
}: ReportNextActionInput): ReportNextAction {
  if (!hasLearner) return "choose_learner";
  if (!hasReportingPeriod) return "choose_reporting_period";
  if (!hasReportEvidence) return "review_evidence";
  if (!hasSelectedReport) return "start_report";
  if (reportStatus === "archived") return "continue_report";
  if (reportStatus === "ready") return "download_report";
  return "preview_report";
}
