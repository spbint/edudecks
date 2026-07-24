import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanMyLearnaWorkspace.tsx"), "utf8");

describe("My Learna parent guidance workspace", () => {
  it("uses a learner-specific, parent-facing first viewport", () => {
    expect(source).toContain("selectedLearnerName}&apos;s Learning");
    expect(source).toContain("A calm learning picture");
    expect(source).toContain("Current focus");
    expect(source).toContain("Continue learning");
    expect(source).toContain("Choose a learning pathway");
    expect(source).toContain("Add evidence");
    expect(source).toContain("Add a quick note or photo");
  });

  it("uses cautious evidence interpretation and transparent record health", () => {
    expect(source).toContain("Your latest saved judgement is");
    expect(source).toContain("There is not enough saved evidence yet to describe change over time.");
    expect(source).toContain("Your learning record is taking shape.");
    expect(source).toContain("Quiet areas are not treated as missing.");
    expect(source).not.toContain("Progress over time");
    expect(source).not.toContain("academic readiness");
  });

  it("provides accessible progressive disclosure and preserves deeper links", () => {
    expect(source).toContain("Progress and judgements");
    expect(source).toContain("Recent records");
    expect(source).toContain("Learning areas");
    expect(source).toContain("Reports and records");
    expect(source).toContain("aria-expanded={open}");
    expect(source).toContain("aria-controls={contentId}");
    expect(source).toContain("minHeight: 48");
    expect(source).toContain("/my-portfolio");
    expect(source).toContain("/my-reports");
    expect(source).toContain("generateCurriculumCoveragePdfBytes");
  });

  it("keeps recent evidence fresh when the route or evidence changes", () => {
    expect(source).toContain("reloadLearnerData");
    expect(source).toContain("subscribeToCleanEvidenceChanges");
    expect(source).toContain('window.addEventListener("pageshow"');
    expect(source).toContain('document.addEventListener("visibilitychange"');
    expect(source).toContain('window.addEventListener("focus"');
    expect(source).toContain("Refreshing recent records");
    expect(source).toContain("setEntriesError(normalizeCleanErrorMessage");
    expect(source).not.toContain("setEntries([]);\n        setEntriesError");
  });
});
