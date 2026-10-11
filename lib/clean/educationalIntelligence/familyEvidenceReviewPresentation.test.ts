import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFamilyEvidenceReviewFixtures } from "./familyEvidenceReviewFixtures";
import {
  FAMILY_EVIDENCE_REVIEW_STATE_LABELS,
  presentFamilyEvidenceReview,
} from "./familyEvidenceReviewPresentation";
import { getCaptureLearningEvidenceFixtures } from "./capture/captureLearningEvidenceFixtures";
import { projectLearningEvidenceTimeline } from "./capture/learningEvidenceTimeline";

function collectKeys(value: unknown, keys = new Set<string>()) {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectKeys(entry, keys));
    return keys;
  }
  Object.entries(value).forEach(([key, entry]) => {
    keys.add(key);
    collectKeys(entry, keys);
  });
  return keys;
}

describe("Family Educational Intelligence presentation V1", () => {
  const fixtures = getFamilyEvidenceReviewFixtures();
  const combined = fixtures.find(
    (fixture) => fixture.id === "recheck-with-capture-between",
  )!;
  const assessmentOnly = fixtures.find((fixture) => fixture.id === "assessment-only")!;
  const captureAndUnknown = fixtures.find(
    (fixture) => fixture.id === "capture-with-insufficient-assessment",
  )!;

  it("keeps all five Number & Operations continua independent", () => {
    expect(combined.presentation.areas.map((area) => area.areaName)).toEqual([
      "Number and place value",
      "Counting processes",
      "Additive strategies",
      "Multiplicative strategies",
      "Understanding money",
    ]);
    expect(combined.presentation.scope.fiveContinuaIndependent).toBe(true);
    expect(combined.presentation.scope.wholeMathematicsCoverage).toBe(false);
  });

  it("takes assessment status only from the canonical profile and never from Capture", () => {
    const combinedStatuses = combined.presentation.areas.map((area) => area.currentView.status);
    const assessmentStatuses = getFamilyEvidenceReviewFixtures()
      .find((fixture) => fixture.id === "recheck-with-capture-between")!
      .presentation.areas.map((area) => area.currentView.status);
    expect(combinedStatuses).toEqual(assessmentStatuses);
    expect(combined.presentation.assessmentCaptureBoundary).toMatch(/never change.*automatically/i);
    for (const area of combined.presentation.areas) {
      expect(area.evidence.captureBoundaryStatement).toMatch(/has not changed/i);
    }
  });

  it("allows captured evidence to display without a LearningEvidenceResult", () => {
    const captureFixture = getCaptureLearningEvidenceFixtures();
    const timeline = projectLearningEvidenceTimeline({
      learnerId: captureFixture.learnerId,
      assessmentResults: [],
      capturedEvidence: captureFixture.capturedEvidence,
    });
    const presentation = presentFamilyEvidenceReview({
      learnerDisplayName: "Sample learner",
      currentProfile: null,
      comparison: null,
      timeline,
      captureLabelsBySourceId: captureFixture.labelsByEvidenceId,
    });
    const placeValue = presentation.areas.find(
      (area) => area.continuumId === "number-place-value",
    )!;
    expect(placeValue.currentView).toMatchObject({
      hasAssessmentInterpretation: false,
      status: null,
      statusLabel: "Not assessed",
    });
    expect(placeValue.evidence.capturedEvidenceCount).toBeGreaterThan(0);
  });

  it("keeps unknown and practical-confirmation states explicit", () => {
    const unknown = captureAndUnknown.presentation.areas.find(
      (area) => area.continuumId === "number-place-value",
    )!;
    expect(unknown.currentView.status).toBe("not-enough-evidence");
    expect(unknown.unknowns.statements.join(" ")).toMatch(/not yet have enough structured evidence/i);

    const practical = fixtures
      .find((fixture) => fixture.id === "practical-confirmation")!
      .presentation.areas.find((area) => area.continuumId === "understanding-money")!;
    expect(practical.currentView.status).toBe("practical-confirmation-required");
    expect(practical.unknowns.statements.join(" ")).toMatch(/practical confirmation/i);
  });

  it("reuses the deterministic longitudinal presentation without changing its semantics", () => {
    const additive = combined.presentation.areas.find(
      (area) => area.continuumId === "additive-strategies",
    )!;
    expect(additive.change).toMatchObject({
      available: true,
      previousStatusLabel: "Developing",
      currentStatusLabel: "Consolidating",
    });
    expect(additive.change.whatChanged).not.toMatch(/declined|growth score|percent/i);
  });

  it("retains Capture source provenance and parent-safe review wording", () => {
    const additive = combined.presentation.areas.find(
      (area) => area.continuumId === "additive-strategies",
    )!;
    expect(additive.evidence.capturedBySource).toEqual(
      expect.arrayContaining([
        { sourceLabel: "Captured work", count: 1 },
        { sourceLabel: "Parent observation", count: 1 },
      ]),
    );
    expect(additive.timeline.some((event) => event.reviewLabel === "Relevant to this learning")).toBe(true);

    const unreviewed = fixtures.find((fixture) => fixture.id === "unreviewed-capture")!;
    expect(
      unreviewed.presentation.areas.flatMap((area) => area.timeline).some(
        (event) => event.reviewLabel === "Not reviewed yet",
      ),
    ).toBe(true);
    expect(FAMILY_EVIDENCE_REVIEW_STATE_LABELS).toMatchObject({
      unreviewed: "Not reviewed yet",
      "confirmed-relevant": "Relevant to this learning",
      "not-relevant": "Not relevant to this learning",
    });
  });

  it("preserves deterministic next-learning handoffs without mutation", () => {
    for (const area of assessmentOnly.presentation.areas) {
      expect(area.nextLearning?.pathwayMutation).toBe("not-requested");
      expect(area.nextLearning?.href).toMatch(/^\/my-pathways\?/);
    }
    expect(assessmentOnly.presentation.controls).toEqual({
      readOnly: true,
      portfolioMutation: "not-requested",
      pathwayMutation: "not-requested",
      customerWritePath: false,
    });
  });

  it("has no overall score, percentage, rank or AI judgement", () => {
    const keys = collectKeys(combined.presentation);
    for (const forbidden of [
      "overallMathsScore",
      "overallMathsLevel",
      "percentage",
      "percentile",
      "rank",
      "aiConfidence",
    ]) {
      expect(keys.has(forbidden), forbidden).toBe(false);
    }
    expect(JSON.stringify(combined.presentation)).not.toMatch(/mastery confirmed|photo = mastery/i);
  });

  it("is a pure read-only layer with no Supabase, persistence, write or AI dependency", () => {
    const source = [
      "familyEvidenceReviewPresentation.ts",
      "familyEvidenceReviewFixtures.ts",
    ]
      .map((file) =>
        readFileSync(join(process.cwd(), "lib/clean/educationalIntelligence", file), "utf8"),
      )
      .join("\n")
      .toLowerCase();
    for (const forbidden of [
      "supabase",
      "openai",
      "anthropic",
      "embedding",
      "generative",
      "fetch(",
      ".insert(",
      ".update(",
      "portfolio_highlights",
    ]) {
      expect(source, forbidden).not.toContain(forbidden);
    }
  });

  it("provides all seven required staff preview states", () => {
    expect(fixtures.map((fixture) => fixture.id)).toEqual([
      "structured-and-captured",
      "assessment-only",
      "capture-with-insufficient-assessment",
      "practical-confirmation",
      "recheck-with-capture-between",
      "focused-unknown",
      "unreviewed-capture",
    ]);
  });
});
