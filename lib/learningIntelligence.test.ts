import { describe, expect, it } from "vitest";
import {
  deriveLearningIntelligence,
  type LearningIntelligenceInput,
  type LearningMomentumLabel,
  type LearningThinAreaLabel,
} from "@/lib/learningIntelligence";

const MOMENTUM_LABELS: LearningMomentumLabel[] = [
  "Getting started",
  "Building momentum",
  "Ready to review",
  "Close to usable",
];

const THIN_AREA_LABELS: LearningThinAreaLabel[] = [
  "Evidence is still thin",
  "The week needs a starting point",
  "The learning story is still narrow",
  "A short report draft would help next",
];

function makeInput(overrides: Partial<LearningIntelligenceInput> = {}): LearningIntelligenceInput {
  return {
    studentId: "learner-1",
    highlightEvidenceId: "evidence-1",
    hasPlanDirection: false,
    hasPlannerActions: false,
    evidenceCount: 0,
    recentEvidenceCount: 0,
    linkedEvidenceCount: 0,
    coverageAreaCount: 0,
    hasSavedDraft: false,
    hasReportSelection: false,
    hasFamilyNote: false,
    ...overrides,
  };
}

describe("deriveLearningIntelligence", () => {
  it("routes a starting-from-scratch state to planner", () => {
    const result = deriveLearningIntelligence(makeInput());

    expect(result.targetPage).toBe("planner");
    expect(result.targetHref).toContain("/planner");
    expect(result.targetHref).toContain("focus=start-planning");
    expect(result.ctaLabel).toBe("Set a weekly direction");
    expect(result.reason.length).toBeGreaterThan(20);
    expect(result.momentumLabel).toBe("Getting started");
    expect(result.thinAreaLabel).toBe("The week needs a starting point");
  });

  it("routes planning without evidence to capture", () => {
    const result = deriveLearningIntelligence(
      makeInput({
        hasPlanDirection: true,
      }),
    );

    expect(result.targetPage).toBe("capture");
    expect(result.targetHref).toContain("/capture");
    expect(result.targetHref).toContain("focus=start-evidence");
    expect(result.ctaLabel).toBe("Capture a learning moment");
    expect(result.momentumLabel).toBe("Building momentum");
    expect(result.thinAreaLabel).toBe("Evidence is still thin");
  });

  it("routes reviewable evidence to portfolio", () => {
    const result = deriveLearningIntelligence(
      makeInput({
        evidenceCount: 2,
        recentEvidenceCount: 1,
        coverageAreaCount: 2,
      }),
    );

    expect(result.targetPage).toBe("portfolio");
    expect(result.targetHref).toContain("/portfolio");
    expect(result.targetHref).toContain("studentId=learner-1");
    expect(result.ctaLabel).toBe("Browse the portfolio");
    expect(result.momentumLabel).toBe("Ready to review");
    expect(result.thinAreaLabel).toBeUndefined();
  });

  it("keeps a narrow evidence story in the portfolio review branch", () => {
    const result = deriveLearningIntelligence(
      makeInput({
        evidenceCount: 3,
        recentEvidenceCount: 1,
        coverageAreaCount: 1,
      }),
    );

    expect(result.targetPage).toBe("portfolio");
    expect(result.thinAreaLabel).toBe("The learning story is still narrow");
    expect(result.momentumLabel).toBe("Ready to review");
  });

  it("prefers reports when stronger report-shaping signals are present", () => {
    const result = deriveLearningIntelligence(
      makeInput({
        evidenceCount: 3,
        recentEvidenceCount: 2,
        hasReportSelection: true,
        coverageAreaCount: 2,
      }),
    );

    expect(result.targetPage).toBe("reports");
    expect(result.targetHref).toContain("/reports");
    expect(result.targetHref).toContain("focus=refine-evidence");
    expect(result.ctaLabel).toBe("Shape this into a report");
    expect(result.momentumLabel).toBe("Close to usable");
    expect(result.thinAreaLabel).toBe("A short report draft would help next");
  });

  it("does not treat a bare saved draft with thin evidence as report-ready", () => {
    const result = deriveLearningIntelligence(
      makeInput({
        evidenceCount: 1,
        recentEvidenceCount: 1,
        hasSavedDraft: true,
      }),
    );

    expect(result.targetPage).toBe("capture");
    expect(result.momentumLabel).toBe("Building momentum");
    expect(result.thinAreaLabel).toBe("Evidence is still thin");
  });

  it("does not let report-ready signals fall through to the portfolio branch", () => {
    const result = deriveLearningIntelligence(
      makeInput({
        evidenceCount: 3,
        recentEvidenceCount: 2,
        hasSavedDraft: true,
        hasReportSelection: true,
        coverageAreaCount: 3,
      }),
    );

    expect(result.targetPage).toBe("reports");
    expect(result.momentumLabel).not.toBe("Ready to review");
  });

  it("uses the capture fallback when there is only a very light evidence start", () => {
    const result = deriveLearningIntelligence(
      makeInput({
        evidenceCount: 1,
        recentEvidenceCount: 0,
      }),
    );

    expect(result.targetPage).toBe("capture");
    expect(result.targetHref).toContain("/capture");
    expect(result.ctaLabel).toBe("Capture another learning moment");
    expect(result.momentumLabel).toBe("Building momentum");
    expect(result.thinAreaLabel).toBe("Evidence is still thin");
  });

  it("keeps labels inside the intended calm families for covered scenarios", () => {
    const scenarios = [
      makeInput(),
      makeInput({ hasPlanDirection: true }),
      makeInput({ evidenceCount: 2, recentEvidenceCount: 1, coverageAreaCount: 2 }),
      makeInput({ evidenceCount: 4, linkedEvidenceCount: 2, coverageAreaCount: 2 }),
      makeInput({ evidenceCount: 1 }),
    ];

    scenarios.forEach((input) => {
      const result = deriveLearningIntelligence(input);
      expect(MOMENTUM_LABELS).toContain(result.momentumLabel);
      if (result.thinAreaLabel) {
        expect(THIN_AREA_LABELS).toContain(result.thinAreaLabel);
      }
      expect(result.targetHref.startsWith("/")).toBe(true);
      expect(result.reason.length).toBeGreaterThan(20);
    });
  });
});
