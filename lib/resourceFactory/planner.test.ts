import { describe, expect, it } from "vitest";

import {
  buildMathResourceFactoryPlan,
  buildResourceFactoryId,
  RESOURCE_FACTORY_PRIMARY_STAGE_KEYS,
} from "@/lib/resourceFactory/planner";

describe("Resource Factory planner", () => {
  it("builds deterministic primary-years maths seeds from canonical pathway steps", () => {
    const first = buildMathResourceFactoryPlan({ limit: 5 });
    const second = buildMathResourceFactoryPlan({ limit: 5 });

    expect(first).toHaveLength(5);
    expect(second).toEqual(first);
    expect(first.every((seed) => seed.resourceType === "practice")).toBe(true);
    expect(first[0].resourceId).toMatch(/^MYL-AUTO-MATH-[A-F0-9]{8}$/);
    expect(first[0].strand.length).toBeGreaterThan(0);
    expect(first[0].skill.length).toBeGreaterThan(0);
    expect(new Set(first.map((seed) => seed.slug)).size).toBe(5);
  });

  it("uses the intended primary stage set by default", () => {
    const plan = buildMathResourceFactoryPlan({ limit: 50 });
    const stageLabels = new Set(plan.map((seed) => seed.yearLevels[0]));

    expect(RESOURCE_FACTORY_PRIMARY_STAGE_KEYS).toEqual([
      "lower-primary",
      "middle-primary",
      "upper-elementary",
      "upper-primary",
    ]);
    expect(stageLabels.has("Foundation / Kindergarten")).toBe(false);
    expect(stageLabels.has("Lower Secondary")).toBe(false);
  });

  it("skips variants already manufactured by the agent lane", () => {
    const initial = buildMathResourceFactoryPlan({ limit: 2 });
    const next = buildMathResourceFactoryPlan({
      existingResourceIds: [initial[0].resourceId],
      limit: 2,
    });

    expect(next).toHaveLength(2);
    expect(next.map((seed) => seed.resourceId)).not.toContain(
      initial[0].resourceId,
    );
  });

  it("uses pathway identity plus variant to generate stable unique IDs", () => {
    const practice = buildResourceFactoryId({
      pathwayStepId:
        "mathematics::number-and-place-value::middle-primary::understand-place-value",
      resourceType: "practice",
    });
    const challenge = buildResourceFactoryId({
      pathwayStepId:
        "mathematics::number-and-place-value::middle-primary::understand-place-value",
      resourceType: "challenge",
    });

    expect(practice).not.toBe(challenge);
    expect(practice).toBe(
      buildResourceFactoryId({
        pathwayStepId:
          "mathematics::number-and-place-value::middle-primary::understand-place-value",
        resourceType: "practice",
      }),
    );
  });
});
