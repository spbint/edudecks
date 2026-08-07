import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDemoReportViewModel, demoReducer, initialDemoState } from "@/lib/demo/demoState";

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

describe("interactive Carter demo", () => {
  it("keeps demo-owned source outside authenticated and Supabase boundaries", () => {
    const files = ["app/demo", "components/demo", "lib/demo"].flatMap((root) =>
      sourceFiles(join(process.cwd(), root)),
    );
    const matches = files.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return prohibitedImports.filter((importPath) => source.includes(importPath)).map((importPath) => `${file}:${importPath}`);
    });
    expect(matches).toEqual([]);
  });

  it("starts on Today with a fictional banner, both Carter learners and reset", () => {
    expect(initialDemoState.activeView).toBe("today");
    const shell = readFileSync(join(process.cwd(), "components/demo/DemoShell.tsx"), "utf8");
    const today = readFileSync(join(process.cwd(), "components/demo/DemoToday.tsx"), "utf8");
    expect(shell).toContain("You’re exploring a fictional family. Changes stay in this browser and are not saved.");
    expect(shell).toContain("Reset demo");
    expect(today).toContain("Emma Carter");
    expect(today).toContain("Noah Carter");
    expect(shell).not.toContain("Start free");
  });

  it("updates a temporary capture, portfolio selection and report model", () => {
    const edited = demoReducer(initialDemoState, { type: "update-capture-text", value: "Emma explained two quarters make one half while cooking." });
    const captured = demoReducer(edited, { type: "add-learning-moment" });
    expect(captured.activeView).toBe("portfolio");
    expect(captured.capturedEvidence?.note).toContain("two quarters");
    expect(captured.capturedEvidence?.temporary).toBe(true);

    const included = demoReducer(captured, { type: "add-capture-to-portfolio" });
    const report = buildDemoReportViewModel(included);
    expect(included.activeView).toBe("report");
    expect(included.captureIncludedInPortfolio).toBe(true);
    expect(report.familyLabel).toBe("The Carter Family");
    expect(report.evidenceEntries.some((entry) => entry.title === "Fractions in everyday life")).toBe(true);
    expect(report.disclaimer).toBe("Sample report generated from fictional demo data.");
  });

  it("resets the fictional demo to its initial state", () => {
    const captured = demoReducer(initialDemoState, { type: "add-learning-moment" });
    expect(demoReducer(captured, { type: "reset" })).toEqual(initialDemoState);
  });

  it("keeps the completion handoff inside the public demo boundary", () => {
    const report = readFileSync(join(process.cwd(), "components/demo/DemoReport.tsx"), "utf8");
    expect(report).toContain("You’ve taken one learning moment from today’s plan into a printable family report.");
    expect(report).toContain("Use MyLearna with your family");
    expect(report).toContain("/start-free?source=demo-complete");
    expect(report).toContain("Keep exploring");
    expect(report).not.toContain("Buy now");
  });
});
