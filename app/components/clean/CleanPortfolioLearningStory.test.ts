import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPortfolioWorkspace.tsx"),
  "utf8",
);

describe("Portfolio Learning Story presentation", () => {
  it("keeps the factual story and early-data state above the full record", () => {
    expect(source).toContain('className="mylearna-portfolio-learning-story"');
    expect(source).toContain("Learning story");
    expect(source).toContain("Portfolio learning");
    expect(source).toContain("Learning areas represented");
    expect(source).toContain("Latest learning");
    expect(source).toContain("Start ${selectedLearnerLabel}'s learning story");
  });

  it("only renders a featured section when parent-selected highlights exist", () => {
    expect(source).toContain("learningStoryHighlights.length ? (");
    expect(source).toContain("Featured evidence");
    expect(source).toContain("learningStoryRecentItems.length ? (");
  });

  it("keeps the established record actions and explicit-open analytics path", () => {
    expect(source).toContain("Download learning record");
    expect(source).toContain("Create full report");
    expect(source).toContain("Capture learning");
    expect(source).toContain("onClick={() => openEvidence(item)}");
    expect(source).toContain("latestEvidenceIdFromQuery");
  });
});
