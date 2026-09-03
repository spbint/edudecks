import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDemoReportViewModel, demoReducer, initialDemoState } from "@/lib/demo/demoState";
import { demoEvidenceDataset } from "@/lib/demo/demoEvidenceDataset";

const prohibitedImports = [
  "@/lib/supabaseClient",
  "@/app/components/AuthUserProvider",
  "@/app/components/FamilyWorkspaceProvider",
  "@/app/components/clean/CleanFamilyWorkspaceProvider",
  "@/lib/auth/serverRouteAuth",
  "@/lib/clean/workspace/client",
  "@/lib/clean/family/client",
  "@/lib/clean/learners/client",
  "@/lib/clean/calendar/client",
  "@/lib/clean/evidence/client",
  "@/lib/clean/portfolio/client",
  "@/lib/clean/reports/client",
  "@/lib/clean/outputs/client",
  "@/lib/clean/assessments/client",
];

function sourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.includes(".test.") ? [path] : [];
  });
}

describe("Carter public demo fidelity", () => {
  it("keeps demo-owned source outside authenticated and Supabase boundaries", () => {
    const files = ["app/demo", "components/demo", "lib/demo"].flatMap((root) => sourceFiles(join(process.cwd(), root)));
    const matches = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return prohibitedImports.filter((importPath) => source.includes(importPath)).map((importPath) => `${file}:${importPath}`);
    });
    expect(matches).toEqual([]);
  });

  it("starts on Today with an explicit report-first choice, fictional banner, reset and four-step ribbon", () => {
    expect(initialDemoState.activeView).toBe("today");
    const shell = readFileSync(join(process.cwd(), "components/demo/DemoShell.tsx"), "utf8");
    const today = readFileSync(join(process.cwd(), "components/demo/DemoToday.tsx"), "utf8");
    const guide = readFileSync(join(process.cwd(), "components/demo/DemoGuide.tsx"), "utf8");
    expect(shell).toContain("You&apos;re exploring a fictional family. Changes stay in this browser and are not saved.");
    expect(shell).toContain("Reset demo");
    expect(shell).toContain("SEE HOW MYLEARNA WORKS");
    expect(shell).toContain("One learning moment can become part of a useful learning record.");
    expect(shell).toContain("Start with today");
    expect(shell).toContain("Skip to Emma&apos;s report");
    expect(shell).toContain("setShowEntryChoice(true)");
    expect(today).toContain("Emma Carter");
    expect(today).toContain("Noah Carter");
    expect(guide).toContain("Today");
    expect(guide).toContain("Capture");
    expect(guide).toContain("Portfolio");
    expect(guide).toContain("Report");
    expect(shell).not.toContain("Start free");
  });

  it("keeps Emma's proportional reasoning story coherent across the primary flow", () => {
    const report = buildDemoReportViewModel(initialDemoState);
    expect(report.learnerLabel).toBe("Emma Carter");
    expect(report.pathway).toBe("Ratio and Proportional Reasoning");
    expect(report.reportingPeriod).toBe("1 March 2026 to 31 July 2026");
    expect(report.evidenceEntries).toHaveLength(8);
    expect(report.evidenceEntries.map((entry) => entry.step)).toEqual([4, 5, 6, 8, 9, 10, 11, 12]);
    expect(report.evidenceEntries.every((entry) => entry.learningArea === "Mathematics")).toBe(true);
    expect(report.evidenceEntries.every((entry) => !entry.title.includes("Noah"))).toBe(true);
    expect(report.disclaimer).toBe("Sample report generated from fictional demo data.");
  });

  it("supports a truthful direct-report path using the existing Carter report data", () => {
    const directReportState = demoReducer(initialDemoState, { type: "navigate", view: "report" });
    expect(directReportState.activeView).toBe("report");
    expect(directReportState.captureIncludedInPortfolio).toBe(false);
    const report = buildDemoReportViewModel(directReportState);
    expect(report.learnerLabel).toBe("Emma Carter");
    expect(report.evidenceEntries).toHaveLength(8);

    const reportSource = readFileSync(join(process.cwd(), "components/demo/DemoReport.tsx"), "utf8");
    expect(reportSource).toContain("This is the kind of learning record MyLearna builds from the learning you capture over time.");
    expect(reportSource).toContain("Ready to build this with your family?");
    expect(reportSource).toContain("Create your family space");
    expect(reportSource).toContain("/start-free?source=demo-report");
    expect(reportSource).toContain("See the four-step journey");
    expect(reportSource).toContain('trackPublicAcquisitionEvent("public_report_viewed", "/demo")');
  });

  it("uses canonical worksheet assets and removes primary placeholder imagery", () => {
    const primary = demoEvidenceDataset.evidence.filter((item) => item.learnerId === "emma");
    expect(primary).toHaveLength(8);
    for (const item of primary) {
      expect(item.worksheetUrl).toBeTruthy();
      expect(item.imagePlaceholder).toBe("Learning resource used for this activity");
      expect(item.imagePlaceholder).not.toContain("Future sample image");
      expect(existsSync(join(process.cwd(), "public", item.worksheetUrl!.replace(/^\//, "")))).toBe(true);
    }
  });

  it("flows the same Emma record from capture through portfolio into the report", () => {
    const edited = demoReducer(initialDemoState, { type: "update-capture-text", value: "Emma doubled a recipe and explained what changed." });
    const captured = demoReducer(edited, { type: "add-learning-moment" });
    expect(captured.activeView).toBe("portfolio");
    expect(captured.capturedEvidence?.id).toBe("demo-evidence-emma-step-4");
    const included = demoReducer(captured, { type: "add-capture-to-portfolio" });
    const report = buildDemoReportViewModel(included);
    expect(included.captureIncludedInPortfolio).toBe(true);
    expect(report.evidenceEntries).toHaveLength(8);
    expect(report.evidenceEntries.find((entry) => entry.id === "demo-evidence-emma-step-4")?.whatHappened).toContain("doubled a recipe");
  });

  it("resets fictional state and keeps completed-journey handoff public", () => {
    const captured = demoReducer(initialDemoState, { type: "add-learning-moment" });
    expect(demoReducer(captured, { type: "reset" })).toEqual(initialDemoState);
    const reportSource = readFileSync(join(process.cwd(), "components/demo/DemoReport.tsx"), "utf8");
    expect(reportSource).toContain("Preview Emma&apos;s Learning Report");
    expect(reportSource).toContain("Download sample report");
    expect(reportSource).toContain("You&apos;ve taken one learning moment from today&apos;s plan into a printable family report.");
    expect(reportSource).toContain("Use MyLearna with your family");
    expect(reportSource).toContain("/start-free?source=demo-complete");
    expect(reportSource).toContain("Keep exploring");
    expect(reportSource).not.toContain("Buy now");
  });

  it("keeps Explore more available and the sample download demo-only", () => {
    const shellSource = readFileSync(join(process.cwd(), "components/demo/DemoShell.tsx"), "utf8");
    const pdfSource = readFileSync(join(process.cwd(), "lib/demo/demoPdf.ts"), "utf8");
    expect(shellSource).toContain("Explore more of the Carter demo");
    expect(pdfSource).toContain("buildCarterFamilyDemoPdfBytes");
    expect(pdfSource).toContain("mylearna-emma-learning-report-sample.pdf");
    expect(pdfSource).not.toContain("export-history");
    expect(pdfSource).not.toContain("supabase");
    expect(pdfSource).not.toContain("generateCleanReportPdfBytes");
  });
});
