import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const outputs = readFileSync(
  join(process.cwd(), "app/components/clean/CleanOutputsWorkspace.tsx"),
  "utf8",
);
const outputsClient = readFileSync(
  join(process.cwd(), "lib/clean/outputs/client.ts"),
  "utf8",
);

describe("My Outputs role and history", () => {
  it("surfaces only genuine formal-report export records as recent history", () => {
    expect(outputs).toContain('data-testid="outputs-history"');
    expect(outputs).toContain("listCleanReportExportsForFamily");
    expect(outputs).toContain("Formal report download history");
    expect(outputs).toContain("Your downloaded files stay in your browser");
    expect(outputsClient).toContain('from("report_exports")');
    expect(outputsClient).toContain('.eq("family_id", familyId)');
    expect(outputsClient).toContain('.order("created_at", { ascending: false })');
  });

  it("keeps the normal document owners clear without adding a competing generator", () => {
    expect(outputs).toContain("Download learning records from Portfolio");
    expect(outputs).toContain("formal reports from My Reports");
    expect(outputs).toContain('href="/my-portfolio"');
    expect(outputs).toContain('href="/my-reports"');
    expect(outputs).toContain("Formal report fallback");
    expect(outputs).toContain("Advanced export tools");
    expect(outputs).not.toContain("Create portfolio");
  });

  it("provides a calm empty state and keeps advanced exports available", () => {
    expect(outputs).toContain("No saved outputs yet.");
    expect(outputs).toContain("Curriculum Coverage Record");
    expect(outputs).toContain("Weekly Fridge Planner");
    expect(outputs).toContain("Download Brent evidence pack");
  });

  it("uses responsive history rows without exposing technical export identifiers", () => {
    expect(outputs).toContain("mylearna-outputs-history-meta");
    expect(outputs).toContain("mylearna-outputs-history-actions");
    expect(outputs).toContain("Open in My Reports");
    expect(outputs).not.toContain("entry.id}</span>");
    expect(outputs).not.toContain("entry.familyId");
  });
});
