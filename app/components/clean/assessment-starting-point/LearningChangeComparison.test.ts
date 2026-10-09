import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const comparisonSource = readFileSync(
  "app/components/clean/assessment-starting-point/LearningChangeComparison.tsx",
  "utf8",
);
const historySource = readFileSync(
  "app/components/clean/assessment-starting-point/LearningEvidenceResultsPreview.tsx",
  "utf8",
);

describe("staff longitudinal comparison UI", () => {
  it("offers compare, history and individual profile views", () => {
    expect(historySource).toContain("Compare attempts");
    expect(historySource).toContain("History");
    expect(historySource).toContain("Open this profile");
    expect(historySource).toContain("LearningChangeComparison");
  });

  it("communicates change with text and expandable evidence detail", () => {
    expect(comparisonSource).toContain("Previous");
    expect(comparisonSource).toContain("Current");
    expect(comparisonSource).toContain("Evidence and recommendation detail");
    expect(comparisonSource).toContain("Current next learning");
    expect(comparisonSource).toContain("comparison.evidenceNote");
  });

  it("keeps Pathways mutation and overall scoring out of the view", () => {
    expect(comparisonSource).toContain("No comparison changes My Pathways");
    expect(comparisonSource).not.toMatch(/overallScore|growthScore|percentage|percentile|rank/i);
  });
});
