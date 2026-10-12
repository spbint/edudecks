import { describe, expect, it } from "vitest";
import { getMathematicsLearningProfileEvidenceFixtures } from "./mathematicsLearningProfileFixtures";
import { projectMyLearnaReadOnlyIntelligence } from "./myLearnaReadOnlyIntelligence";

const fixtures = getMathematicsLearningProfileEvidenceFixtures();
const initial = fixtures.find((fixture) => fixture.id === "mixed")!;
const recheck = fixtures.find((fixture) => fixture.id === "recheck")!;

describe("My Learna read-only Educational Intelligence", () => {
  it("shows defensible assessment explanations without needing a recheck", () => {
    const result = projectMyLearnaReadOnlyIntelligence({
      results: initial.results,
      learnerDisplayName: "Ava",
    });

    expect(result.currentProfile?.areas).toHaveLength(5);
    expect(result.currentProfile?.areas.every((area) => area.evidence.whyStatement.length > 0)).toBe(true);
    expect(result.comparison).toBeNull();
  });

  it("uses the accepted deterministic longitudinal presentation for two complete attempts", () => {
    const result = projectMyLearnaReadOnlyIntelligence({
      results: [...initial.results, ...recheck.results],
      learnerDisplayName: "Ava",
    });

    expect(result.currentProfile?.assessment.attemptKind).toBe("recheck");
    expect(result.comparison?.title).toBe("Since the last check");
    expect(result.comparison?.areas).toHaveLength(5);
    expect(result.comparison?.explanation).toContain("does not calculate a growth score");
    expect(JSON.stringify(result)).not.toMatch(/percentage/i);
    expect(result.comparison?.explanation).toContain("one overall Maths level");
  });

  it("does not fabricate a profile or comparison from absent or partial canonical data", () => {
    expect(projectMyLearnaReadOnlyIntelligence({ results: [] })).toEqual({
      currentProfile: null,
      comparison: null,
    });
    expect(projectMyLearnaReadOnlyIntelligence({ results: initial.results.slice(0, 4) })).toEqual({
      currentProfile: null,
      comparison: null,
    });
  });
});
