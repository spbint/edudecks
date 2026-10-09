import { describe, expect, it } from "vitest";
import { getCaptureLearningEvidenceFixtures } from "./captureLearningEvidenceFixtures";
import { projectLearningEvidenceTimeline } from "./learningEvidenceTimeline";

describe("learning evidence timeline", () => {
  it("coexists across assessment and authentic evidence with provenance", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const construct = fixture.constructChoices.find(
      (choice) => choice.continuumId === "additive-strategies",
    );
    const timeline = projectLearningEvidenceTimeline({
      learnerId: fixture.learnerId,
      constructId: construct?.constructId,
      assessmentResults: fixture.assessmentResults,
      capturedEvidence: fixture.capturedEvidence,
    });
    expect(timeline.map((event) => event.sourceLane)).toEqual(
      expect.arrayContaining(["structured-assessment", "authentic-capture"]),
    );
    expect(timeline.filter((event) => event.sourceLane === "authentic-capture")).toHaveLength(2);
    expect(
      timeline.every((event) => Boolean(event.provenance.originatingSubsystem)),
    ).toBe(true);
  });

  it("never turns a captured event into an assessment interpretation", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const timeline = projectLearningEvidenceTimeline({
      learnerId: fixture.learnerId,
      assessmentResults: fixture.assessmentResults,
      capturedEvidence: fixture.capturedEvidence,
    });
    expect(
      timeline
        .filter((event) => event.sourceLane === "authentic-capture")
        .every((event) => event.assessmentInterpretation === null),
    ).toBe(true);
  });

  it("is pure, chronological and leaves original/recheck results unchanged", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const before = structuredClone(fixture.assessmentResults);
    const first = projectLearningEvidenceTimeline({
      learnerId: fixture.learnerId,
      assessmentResults: fixture.assessmentResults,
      capturedEvidence: fixture.capturedEvidence,
    });
    const second = projectLearningEvidenceTimeline({
      learnerId: fixture.learnerId,
      assessmentResults: fixture.assessmentResults,
      capturedEvidence: fixture.capturedEvidence,
    });
    expect(first).toEqual(second);
    expect(fixture.assessmentResults).toEqual(before);
    expect(first.map((event) => Date.parse(event.occurredAt))).toEqual(
      [...first.map((event) => Date.parse(event.occurredAt))].sort((a, b) => a - b),
    );
    expect(new Set(first.filter((event) => event.sourceLane === "structured-assessment").map((event) => event.assessmentInterpretation?.attemptKind))).toEqual(
      new Set(["initial", "recheck"]),
    );
  });

  it("does not produce a growth score, total percentage or overall Maths level", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const serialized = JSON.stringify(
      projectLearningEvidenceTimeline({
        learnerId: fixture.learnerId,
        assessmentResults: fixture.assessmentResults,
        capturedEvidence: fixture.capturedEvidence,
      }),
    );
    expect(serialized).not.toMatch(/growthScore|overallMaths|percentage|percentile|rank/i);
  });
});
