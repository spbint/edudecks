import { describe, expect, it } from "vitest";
import { getMathematicsLearningProfileEvidenceFixtures } from "./mathematicsLearningProfileFixtures";
import { compareLearningEvidenceResults } from "./learningEvidenceComparison";

function fixtures() {
  const values = getMathematicsLearningProfileEvidenceFixtures();
  const mixed = values.find((fixture) => fixture.id === "mixed");
  const focused = values.find((fixture) => fixture.id === "focused");
  const recheck = values.find((fixture) => fixture.id === "recheck");
  if (!mixed || !focused || !recheck) throw new Error("Missing fixtures");
  return { mixed, focused, recheck };
}

describe("Learning Evidence Comparison V1", () => {
  it("distinguishes new evidence from unchanged interpretation", () => {
    const { mixed } = fixtures();
    const previous = mixed.results[0];
    const current = structuredClone(previous);
    current.id = "current-result";
    current.assessment.attemptId = "current-attempt";
    current.assessment.attemptKind = "recheck";
    current.evaluatedAt = "2026-11-20T03:00:00.000Z";
    current.evidence.sources[0].sourceId = "current-attempt";

    const comparison = compareLearningEvidenceResults(previous, current);
    expect(comparison.changes).toMatchObject({
      evidence: "new-evidence",
      interpretation: "unchanged",
      recommendation: "unchanged",
    });
    expect(comparison.classifications).toEqual(["new-evidence"]);
  });

  it("does not call unknown to interpreted automatic improvement", () => {
    const { focused, recheck } = fixtures();
    const comparison = compareLearningEvidenceResults(
      focused.results[0],
      recheck.results[0],
    );
    expect(comparison.changes).toMatchObject({
      evidence: "evidence-now-sufficient",
      interpretation: "became-interpretable",
      progression: "changed-without-direction",
    });
    expect(JSON.stringify(comparison)).not.toMatch(/improv|growth|declin/i);
  });

  it("keeps unknown to unknown unresolved", () => {
    const { focused } = fixtures();
    const previous = focused.results[0];
    const current = structuredClone(previous);
    current.id = "later-unknown";
    current.assessment.attemptId = "later-focused";
    current.assessment.attemptKind = "recheck";
    current.evaluatedAt = "2026-11-20T03:00:00.000Z";
    const comparison = compareLearningEvidenceResults(previous, current);
    expect(comparison.changes.evidence).toBe("still-unresolved");
    expect(comparison.classifications).toContain("still-unresolved");
  });

  it("separates interpreted to insufficient from directional movement", () => {
    const { mixed, recheck } = fixtures();
    const comparison = compareLearningEvidenceResults(
      mixed.results[4],
      recheck.results[4],
    );
    expect(comparison.changes).toMatchObject({
      evidence: "evidence-now-insufficient",
      interpretation: "became-unresolved",
      progression: "changed-without-direction",
    });
  });

  it("represents practical confirmation resolution and new requirements separately", () => {
    const { mixed } = fixtures();
    const previous = mixed.results[4];
    const confirmed = structuredClone(previous);
    confirmed.id = "confirmed-result";
    confirmed.assessment.attemptId = "confirmed-attempt";
    confirmed.assessment.attemptKind = "recheck";
    confirmed.evidence.practicalConfirmation = {
      state: "confirmed",
      evidenceReference: "observation-1",
    };
    confirmed.evidence.sources.push({
      sourceType: "practical-observation",
      sourceId: "observation-1",
    });
    expect(
      compareLearningEvidenceResults(previous, confirmed).changes
        .practicalConfirmation,
    ).toBe("resolved");

    const electronicallyInterpreted = structuredClone(confirmed);
    electronicallyInterpreted.id = "interpreted-result";
    electronicallyInterpreted.assessment.attemptId = "interpreted-attempt";
    electronicallyInterpreted.evidence.practicalConfirmation = {
      state: "not-required",
      evidenceReference: null,
    };
    expect(
      compareLearningEvidenceResults(previous, electronicallyInterpreted).changes
        .practicalConfirmation,
    ).toBe("resolved");

    const laterRequired = structuredClone(mixed.results[0]);
    laterRequired.id = "required-result";
    laterRequired.assessment.attemptId = "required-attempt";
    laterRequired.assessment.attemptKind = "recheck";
    laterRequired.evidence.practicalConfirmation.state = "required";
    expect(
      compareLearningEvidenceResults(mixed.results[0], laterRequired).changes
        .practicalConfirmation,
    ).toBe("required");
  });

  it("keeps recommendation history deterministic without mutation", () => {
    const { mixed } = fixtures();
    const previous = mixed.results[1];
    const current = structuredClone(previous);
    current.id = "recommendation-current";
    current.assessment.attemptId = "recommendation-attempt";
    current.assessment.attemptKind = "recheck";
    if (!current.recommendation) throw new Error("Missing recommendation");
    current.recommendation.recommendationId = "changed-recommendation";
    current.recommendation.label = "Different next learning";

    const before = JSON.stringify([previous, current]);
    const comparison = compareLearningEvidenceResults(previous, current);
    expect(comparison.changes.recommendation).toBe("changed");
    expect(comparison.previous.recommendation?.recommendationId).not.toBe(
      comparison.current.recommendation?.recommendationId,
    );
    expect(comparison.current.recommendation?.pathwayMutation).toBe(
      "not-requested",
    );
    expect(JSON.stringify([previous, current])).toBe(before);
  });

  it("marks incompatible mapping or noncanonical construct changes not comparable", () => {
    const { mixed } = fixtures();
    const previous = mixed.results[2];
    const mappingChanged = structuredClone(previous);
    mappingChanged.id = "mapping-current";
    mappingChanged.assessment.attemptId = "mapping-attempt";
    mappingChanged.construct.authority.mappingVersion = "mapping-v2";
    mappingChanged.provenance.curriculumMappingVersion = "mapping-v2";
    expect(
      compareLearningEvidenceResults(previous, mappingChanged).alignment,
    ).toMatchObject({ validity: "not-comparable", reason: "different-mapping" });

    const constructChanged = structuredClone(previous);
    constructChanged.id = "construct-current";
    constructChanged.assessment.attemptId = "construct-attempt";
    constructChanged.construct.constructId = "unrelated-construct";
    expect(
      compareLearningEvidenceResults(previous, constructChanged).alignment,
    ).toMatchObject({ validity: "not-comparable", reason: "different-construct" });
  });

  it("surfaces assessment, rule and item version changes without inventing incompatibility", () => {
    const { mixed } = fixtures();
    const previous = mixed.results[1];
    const current = structuredClone(previous);
    current.id = "version-current";
    current.assessment.attemptId = "version-attempt";
    current.assessment.attemptKind = "recheck";
    current.assessment.assessmentVersion = 2;
    current.provenance.assessmentVersion = 2;
    current.provenance.deterministicRule.ruleVersion = "v2";
    current.provenance.sourceItemVersions[0].itemVersion = 2;

    const comparison = compareLearningEvidenceResults(previous, current);
    expect(comparison.alignment.validity).toBe("valid");
    expect(comparison.provenance).toMatchObject({
      assessmentVersionChanged: true,
      deterministicRuleVersionChanged: true,
      sourceItemVersionsChanged: true,
    });
  });

  it("allows directional wording only for compatible canonical progression positions", () => {
    const { mixed } = fixtures();
    const previous = structuredClone(mixed.results[3]);
    previous.construct.progression = {
      identifier: "P3-P4",
      kind: "band",
      lowerLevel: "P3",
      upperLevel: "P4",
      endpointRelation: null,
    };
    previous.construct.constructId = `${previous.construct.authority.frameworkId}::${previous.construct.continuumId}::P3-P4`;
    const current = structuredClone(previous);
    current.id = "later-result";
    current.assessment.attemptId = "later-attempt";
    current.assessment.attemptKind = "recheck";
    current.construct.progression = {
      identifier: "P5-P6",
      kind: "band",
      lowerLevel: "P5",
      upperLevel: "P6",
      endpointRelation: null,
    };
    current.construct.constructId = `${current.construct.authority.frameworkId}::${current.construct.continuumId}::P5-P6`;

    expect(compareLearningEvidenceResults(previous, current)).toMatchObject({
      alignment: { validity: "valid", reason: "canonical-progression-construct" },
      changes: { progression: "later-learning-position" },
    });
  });
});
