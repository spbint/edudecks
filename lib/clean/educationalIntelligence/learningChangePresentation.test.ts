import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getLearningChangePresentationFixtures } from "./learningChangeFixtures";

describe("Learning change presentation", () => {
  it("uses parent-safe evidence language without a growth score or whole-Maths claim", () => {
    const fixtures = getLearningChangePresentationFixtures();
    expect(fixtures).toHaveLength(3);
    const serialized = JSON.stringify(fixtures);
    expect(serialized).toContain("Since the last check");
    expect(serialized).toContain("not automatically proof of improvement");
    expect(serialized).not.toMatch(/growthScore|overallScore|percentage|percentile|rank|passFail/i);
    expect(fixtures[0].presentation.scope).toMatchObject({
      label: "Number & Operations",
      fiveContinuaIndependent: true,
      wholeMathematicsCoverage: false,
    });
  });

  it("presents unknown and practical changes without ordinal language", () => {
    const fixtures = getLearningChangePresentationFixtures();
    const focused = fixtures.find((fixture) => fixture.id === "focused-recheck")!;
    expect(
      focused.presentation.areas.some(
        (area) => area.evidenceChange.kind === "evidence-now-sufficient",
      ),
    ).toBe(true);
    const practical = fixtures.find((fixture) => fixture.id === "practical-resolved")!;
    expect(
      practical.presentation.areas.find(
        (area) => area.continuumId === "understanding-money",
      )?.practicalConfirmation.kind,
    ).toBe("resolved");
    expect(JSON.stringify(fixtures)).not.toMatch(/went backwards|dropped|accelerated/i);
  });

  it("has no Supabase or AI dependency in the comparison layer", () => {
    const files = [
      "lib/clean/educationalIntelligence/learningEvidenceComparison.ts",
      "lib/clean/educationalIntelligence/numberOperationsLearningChange.ts",
      "lib/clean/educationalIntelligence/learningChangePresentation.ts",
    ];
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toMatch(/supabase|openai|embedding|llm|generative/i);
  });

  it("does not expose technical comparison provenance in parent-safe presentation", () => {
    const serialized = JSON.stringify(getLearningChangePresentationFixtures());
    expect(serialized).not.toMatch(
      /constructId|itemId|deterministicRule|curriculumMappingVersion|answerKey/i,
    );
  });
});
