import { describe, expect, it } from "vitest";
import { resolveReportNextAction } from "@/lib/clean/reports/reportNextAction";

describe("report next action", () => {
  const readyContext = {
    hasLearner: true,
    hasReportingPeriod: true,
    hasReportEvidence: true,
    hasSelectedReport: true,
    reportStatus: "draft" as const,
  };

  it("keeps learner and reporting-period setup ahead of report actions", () => {
    expect(resolveReportNextAction({ ...readyContext, hasLearner: false })).toBe("choose_learner");
    expect(resolveReportNextAction({ ...readyContext, hasReportingPeriod: false })).toBe("choose_reporting_period");
  });

  it("uses report inclusion evidence rather than pretending a zero-evidence report is ready", () => {
    expect(resolveReportNextAction({ ...readyContext, hasReportEvidence: false })).toBe("review_evidence");
  });

  it("follows the existing report lifecycle once factual context is available", () => {
    expect(resolveReportNextAction({ ...readyContext, hasSelectedReport: false, reportStatus: null })).toBe("start_report");
    expect(resolveReportNextAction(readyContext)).toBe("preview_report");
    expect(resolveReportNextAction({ ...readyContext, reportStatus: "ready" })).toBe("download_report");
    expect(resolveReportNextAction({ ...readyContext, reportStatus: "archived" })).toBe("continue_report");
  });
});
