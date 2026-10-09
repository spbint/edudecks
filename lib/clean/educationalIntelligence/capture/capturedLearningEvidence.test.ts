import { describe, expect, it } from "vitest";
import { getCaptureLearningEvidenceFixtures } from "./captureLearningEvidenceFixtures";
import {
  adaptCleanCaptureToLearningEvidence,
  constructReferenceFromLearningEvidenceResult,
  linkCapturedEvidenceToConstruct,
  reviewCapturedEvidenceConstructLink,
} from "./capturedLearningEvidence";

describe("CapturedLearningEvidenceV1", () => {
  it("allows authentic evidence to exist without a construct or judgement", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const unlinked = fixture.capturedEvidence.find((item) =>
      item.evidenceId.endsWith("unlinked-note"),
    );
    expect(unlinked?.constructLinks).toEqual([]);
    expect(unlinked).not.toHaveProperty("developmentalStatus");
    expect(unlinked).not.toHaveProperty("recommendation");
  });

  it("links one capture to multiple canonical constructs through human assignments", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const workSample = fixture.capturedEvidence.find((item) =>
      item.evidenceId.includes("work-sample"),
    );
    expect(workSample?.constructLinks).toHaveLength(2);
    expect(workSample?.constructLinks.every((link) => link.assignedBy.kind === "human")).toBe(true);
    expect(workSample?.constructLinks.map((link) => link.construct.constructId)).toEqual(
      expect.arrayContaining([
        fixture.constructChoices.find((choice) => choice.continuumId === "additive-strategies")?.constructId,
        fixture.constructChoices.find((choice) => choice.continuumId === "counting-processes")?.constructId,
      ]),
    );
  });

  it("denies a cross-tenant or cross-learner link envelope", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const evidence = fixture.capturedEvidence[0];
    const construct = fixture.constructChoices[0];
    expect(() =>
      linkCapturedEvidenceToConstruct({
        evidence,
        construct,
        actorId: fixture.actorId,
        assignedAt: "2026-10-10T00:00:00.000Z",
        familyId: "another-family",
        learnerId: fixture.learnerId,
      }),
    ).toThrow(/same family envelope/i);
  });

  it("reviews evidence relevance without confirming a developmental status", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const evidence = fixture.capturedEvidence[0];
    const reviewed = reviewCapturedEvidenceConstructLink({
      evidence,
      linkId: evidence.constructLinks[0].linkId,
      reviewState: "not-relevant",
      actorId: fixture.actorId,
      reviewedAt: "2026-10-11T00:00:00.000Z",
    });
    expect(reviewed.constructLinks[0].reviewState).toBe("not-relevant");
    expect(reviewed).not.toHaveProperty("interpretation");
  });

  it("preserves the independent Portfolio decision from the raw capture", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const source = fixture.capturedEvidence[0];
    expect(source.portfolioInclusion).toBe("not-included");
    const relinked = linkCapturedEvidenceToConstruct({
      evidence: source,
      construct: fixture.constructChoices[0],
      actorId: fixture.actorId,
      assignedAt: "2026-10-12T00:00:00.000Z",
      familyId: fixture.familyId,
      learnerId: fixture.learnerId,
    });
    expect(relinked.portfolioInclusion).toBe("not-included");
    expect(relinked).not.toHaveProperty("pathwayMutation");
  });

  it("adapts by reference without copying raw note or media content", () => {
    const fixture = getCaptureLearningEvidenceFixtures();
    const result = fixture.assessmentResults[0];
    const raw = {
      id: "capture-minimal",
      familyId: fixture.familyId,
      learnerId: fixture.learnerId,
      programId: null,
      calendarItemId: null,
      observedOn: "2026-10-10",
      title: "Private title",
      whatHappened: "Private note body",
      reflection: "Private reflection",
      learningArea: "Mathematics",
      curriculumNodeIds: [],
      attachmentUrls: ["family/ref/photo.jpg"],
      imageUrl: null,
      includeInPortfolio: false,
      includeInReport: false,
      createdByUserId: fixture.actorId,
      createdAt: null,
      updatedAt: null,
    };
    let adapted = adaptCleanCaptureToLearningEvidence(raw);
    adapted = linkCapturedEvidenceToConstruct({
      evidence: adapted,
      construct: constructReferenceFromLearningEvidenceResult(result),
      actorId: fixture.actorId,
      assignedAt: "2026-10-10T00:00:00.000Z",
      familyId: fixture.familyId,
      learnerId: fixture.learnerId,
    });
    expect(JSON.stringify(adapted)).not.toContain("Private note body");
    expect(JSON.stringify(adapted)).not.toContain("Private reflection");
    expect(adapted.artifactReferences[0].reference).toBe("family/ref/photo.jpg");
  });
});
