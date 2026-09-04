import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanReportsWorkspace.tsx"),
  "utf8",
);
const portfolioSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPortfolioWorkspace.tsx"),
  "utf8",
);

describe("Portfolio to Reports continuity", () => {
  it("preserves the selected learner through the established, validated query context", () => {
    expect(portfolioSource).toContain("source=portfolio");
    expect(portfolioSource).toContain("learner_id=${encodeURIComponent(selectedLearnerId)}");
    expect(source).toContain('searchParams.get("learner_id")');
    expect(source).toContain('learnerOptions.some((option) => option.value === learnerIdFromQuery)');
    expect(source).toContain("setReportLearnerId(learnerIdFromQuery)");
  });

  it("shows factual Portfolio report context and report-included evidence only", () => {
    expect(source).toContain('data-testid="reports-portfolio-context"');
    expect(source).toContain("Continuing from Portfolio");
    expect(source).toContain("Report-ready records");
    expect(source).toContain("reportIncludedOnly: true");
    expect(source).toContain("No report evidence is available for this period yet.");
    expect(source).toContain("Portfolio inclusion and report inclusion remain separate.");
  });

  it("uses one resolver-backed action hierarchy while retaining existing preview and PDF paths", () => {
    expect(source).toContain("resolveReportNextAction");
    expect(source).toContain("Choose learner");
    expect(source).toContain("Choose reporting period");
    expect(source).toContain("Review evidence");
    expect(source).toContain("Preview report");
    expect(source).toContain("Download report PDF");
    expect(source).toContain('selectedReport.status !== "ready"');
    expect(source).toContain("handleDownloadReportPdf");
    expect(source).toContain("openPreview");
  });

  it("keeps advanced report controls secondary and leaves connected analytics unchanged", () => {
    expect(source).toContain("Edit report details");
    expect(source).toContain("Edit title");
    expect(portfolioSource).toContain('"create_report_selected"');
    expect(source).not.toContain('trackProductEvent("report_previewed"');
  });
});
