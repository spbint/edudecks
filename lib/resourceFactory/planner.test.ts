import { describe, expect, it } from "vitest";

import {
  buildMathResourceFactoryPlan,
  buildResourceFactoryId,
} from "@/lib/resourceFactory/planner";

describe("Resource Factory planner", () => {
  it("builds deterministic maths production seeds from canonical pathway steps", () => {
    const first = buildMathResourceFactoryPlan({ limit: 5 });
    const second = buildMathResourceFactoryPlan({ limit: 5 });

    expect(first).toHaveLength(5);
    expect(second).toEqual(first);
    expect(first[0]).toMatchObject({
      resourceType: "practice",
      difficulty: "developing",
    });
    expect(first[0].resourceId).toMatch(/^MYL-AUTO-MATH-[A-F0-9]{8}$/);
    expect(first[0].strand.length).toBeGreaterThan(0);
    expect(first[0].skill.length).toBeGreaterThan(0);
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
