import { describe, expect, it } from "vitest";
import { getMathematicsLearningProfileEvidenceFixtures } from "./mathematicsLearningProfileFixtures";
import { projectNumberOperationsLearningChange } from "./numberOperationsLearningChange";

describe("Number & Operations longitudinal projection", () => {
  it("keeps five continua independent and the source attempts immutable", () => {
    const fixtures = getMathematicsLearningProfileEvidenceFixtures();
    const previous = fixtures.find((fixture) => fixture.id === "mixed")!;
    const current = fixtures.find((fixture) => fixture.id === "recheck")!;
    const before = JSON.stringify([previous.results, current.results]);

    const projection = projectNumberOperationsLearningChange({
      previousResults: previous.results,
      currentResults: current.results,
    });

    expect(projection.continua.map((area) => area.continuumId)).toEqual([
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ]);
    expect(JSON.stringify([previous.results, current.results])).toBe(before);
    expect(JSON.stringify(projection)).not.toMatch(
      /overallScore|growthScore|percentage|percentile|rank|passFail/i,
    );
  });

  it("preserves original and recheck identity", () => {
    const fixtures = getMathematicsLearningProfileEvidenceFixtures();
    const projection = projectNumberOperationsLearningChange({
      previousResults: fixtures.find((fixture) => fixture.id === "mixed")!.results,
      currentResults: fixtures.find((fixture) => fixture.id === "recheck")!.results,
    });
    expect(projection.previousAttempt).toMatchObject({
      attemptId: "fixture-mixed-initial",
      attemptKind: "initial",
    });
    expect(projection.currentAttempt).toMatchObject({
      attemptId: "fixture-recheck",
      attemptKind: "recheck",
    });
  });
});
