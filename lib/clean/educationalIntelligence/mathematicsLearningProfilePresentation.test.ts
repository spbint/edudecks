import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getMathematicsLearningProfileFixtures } from "./mathematicsLearningProfileFixtures";
import {
  MATHEMATICS_LEARNING_PROFILE_STATUS_COPY,
} from "./mathematicsLearningProfilePresentation";

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

describe("Mathematics Learning Profile V1 presentation", () => {
  const fixtures = getMathematicsLearningProfileFixtures();
  const mixed = fixtures.find((fixture) => fixture.id === "mixed")!;
  const focused = fixtures.find((fixture) => fixture.id === "focused")!;
  const recheck = fixtures.find((fixture) => fixture.id === "recheck")!;

  it("retains all five Number & Operations continua independently", () => {
    expect(mixed.presentation.areas.map((area) => area.areaName)).toEqual([
      "Number and place value",
      "Counting processes",
      "Additive strategies",
      "Multiplicative strategies",
      "Understanding money",
    ]);
    expect(mixed.presentation.areas.map((area) => area.status)).toEqual([
      "secure",
      "consolidating",
      "developing",
      "needs-support",
      "practical-confirmation-required",
    ]);
  });

  it("defines parent-safe wording for all six canonical statuses", () => {
    expect(Object.values(MATHEMATICS_LEARNING_PROFILE_STATUS_COPY).map((copy) => copy.label)).toEqual([
      "Secure",
      "Consolidating",
      "Developing",
      "Needs support",
      "Not enough evidence",
      "Practical confirmation required",
    ]);
    expect(MATHEMATICS_LEARNING_PROFILE_STATUS_COPY["not-enough-evidence"].explanation).not.toMatch(
      /fail|incorrect|below standard/i,
    );
    expect(
      MATHEMATICS_LEARNING_PROFILE_STATUS_COPY["practical-confirmation-required"].explanation,
    ).toMatch(/practical observation/i);
  });

  it("keeps focused-attempt areas unknown rather than failed", () => {
    const notAssessed = focused.presentation.areas.filter(
      (area) => area.continuumId !== "additive-strategies",
    );
    expect(notAssessed).toHaveLength(4);
    for (const area of notAssessed) {
      expect(area.status).toBe("not-enough-evidence");
      expect(area.statusLabel).toBe("Not enough evidence");
      expect(area.evidence.sufficiencyLabel).toBe("Not assessed in this check");
      expect(area.evidence.whyStatement).toMatch(/kept it unknown/i);
      expect(area.nextLearning.available).toBe(false);
    }
  });

  it("preserves deterministic handoffs without requesting a Pathways mutation", () => {
    for (const area of mixed.presentation.areas) {
      expect(area.nextLearning.available).toBe(true);
      expect(area.nextLearning.actionLabel).toBe("Continue learning");
      expect(area.nextLearning.href).toMatch(/^\/my-pathways\?/);
      expect(area.nextLearning.pathwayMutation).toBe("not-requested");
    }
  });

  it("states the limited scope and has no aggregate score fields", () => {
    expect(mixed.presentation.scope.label).toBe("Number & Operations Starting Point");
    expect(mixed.presentation.scope.wholeMathematicsCoverage).toBe(false);
    expect(mixed.presentation.scope.statement).toMatch(/not a complete assessment of all Mathematics/i);

    const keys = collectKeys(mixed.presentation);
    for (const forbidden of [
      "percentage",
      "overallPercentage",
      "overallMathsLevel",
      "rank",
      "percentile",
      "pass",
      "score",
    ]) {
      expect(keys.has(forbidden), forbidden).toBe(false);
    }
  });

  it("preserves original and recheck classification", () => {
    expect(mixed.presentation.assessment).toMatchObject({
      attemptKind: "initial",
      attemptLabel: "Original profile",
    });
    expect(recheck.presentation.assessment).toMatchObject({
      attemptKind: "recheck",
      attemptLabel: "Recheck profile",
    });
  });

  it("is a pure deterministic projection", () => {
    const fixtureProfile = getMathematicsLearningProfileFixtures()[0]!.presentation;
    const sourceFixture = getMathematicsLearningProfileFixtures()[0]!.presentation;
    expect(fixtureProfile).toEqual(sourceFixture);
    expect(JSON.stringify(fixtures)).toEqual(JSON.stringify(getMathematicsLearningProfileFixtures()));
  });

  it("has no Supabase, persistence, analytics or AI dependency", () => {
    const presentationSource = readFileSync(
      join(process.cwd(), "lib/clean/educationalIntelligence/mathematicsLearningProfilePresentation.ts"),
      "utf8",
    ).toLowerCase();
    const fixtureSource = readFileSync(
      join(process.cwd(), "lib/clean/educationalIntelligence/mathematicsLearningProfileFixtures.ts"),
      "utf8",
    ).toLowerCase();
    const source = `${presentationSource}\n${fixtureSource}`;
    for (const forbidden of [
      "supabase",
      "openai",
      "anthropic",
      "embedding",
      "generative",
      "fetch(",
      ".insert(",
      ".update(",
      "trackproductevent",
    ]) {
      expect(source, forbidden).not.toContain(forbidden);
    }
  });
});
