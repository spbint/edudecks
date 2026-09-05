import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanMyLearnaWorkspace.tsx"), "utf8");

describe("My Learna parent guidance workspace", () => {
  it("uses a learner-specific, parent-facing hub first viewport", () => {
    expect(source).toContain("selectedLearnerName}&apos;s Learning");
    expect(source).toContain("A calm learning picture");
    expect(source).toContain("Quick actions");
    expect(source).toContain("Current learning");
    expect(source).toContain("Add learning");
    expect(source).toContain("Open My Day");
    expect(source).toContain("View Portfolio");
    expect(source).toContain("View Reports");
    expect(source).toContain("PUBLIC_PATHWAYS_ENABLED");
    expect(source).toContain("Start building {selectedLearnerName}&apos;s learning story");
  });

  it("uses cautious evidence interpretation and transparent record health", () => {
    expect(source).toContain("buildExplainableProgressStory");
    expect(source).toContain("selectCurrentLearningCandidates");
    expect(source).toContain("fallbackPathwayStepIds: summary.nextLearningSteps");
    expect(source).toContain("Current progress remains your confirmation");
    expect(source).toContain("Why this is shown");
    expect(source).toContain("Latest observed progress");
    expect(source).toContain("Completed checks:");
    expect(source).toContain("Your learning record is taking shape.");
    expect(source).toContain("Quiet areas are not treated as missing.");
    expect(source).not.toContain("Progress over time");
    expect(source).not.toContain("academic readiness");
  });

  it("keeps canonical progress in the visible learner hub when My Pathways navigation is hidden", () => {
    expect(source).toContain("const currentLearningSteps = selectCurrentLearningCandidates");
    expect(source).toContain("{currentLearningSteps.length ? currentLearningSteps.map");
    expect(source).not.toContain("PUBLIC_PATHWAYS_ENABLED && currentLearningSteps.length");
  });

  it("shows only factual, bounded check chronology without deriving growth", () => {
    expect(source).toContain("listComparableLearningObservations");
    expect(source).toContain('aria-label="Recent checks"');
    expect(source).toContain("Show earlier checks");
    expect(source).toContain("MyLearna check");
    expect(source).not.toContain("Mastery percentage");
    expect(source).not.toContain("Progress percentage");
    expect(source).not.toContain("Improving");
    expect(source).not.toContain("Declining");
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
    expect(source).toContain("listAssessmentAttemptsForLearner");
    expect(source).toContain("pathwayCapturePath");
    expect(source).toContain("CleanPathwayProgressConfirmation");
    expect(source).toContain("actionLabel=\"Update progress\"");
    expect(source).not.toContain(">Open pathway<");
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
