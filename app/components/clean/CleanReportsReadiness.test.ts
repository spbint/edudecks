import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanReportsWorkspace.tsx"), "utf8");

describe("Reports learning record summary", () => {
  it("keeps the summary factual and contextual to Reports", () => {
    expect(source).toContain("Your learning record");
    expect(source).toContain("Your report is already taking shape.");
    expect(source).toContain("ready to appear in reports");
    expect(source).toContain("include photos or files");
    expect(source).not.toMatch(/compliant|requirements met|curriculum covered|mastery|on track/i);
  });

  it("reads evidence without changing report inclusion or other product state", () => {
    expect(source).toContain("listCleanEvidenceEntries");
    expect(source).not.toContain("updateCleanEvidenceEntry");
    expect(source).not.toContain("includeInReport: true");
    expect(source).not.toContain("createCleanCalendarItem");
    expect(source).not.toContain("addPathwayStepToLearningQueue");
  });
});
