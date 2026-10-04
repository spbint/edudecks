import { describe, expect, it } from "vitest";
import { buildNumberOperationsPathwaysHandoff } from "./numberOperationsPathwaysHandoff";

describe("Number & Operations My Pathways handoff", () => {
  it.each([
    ["number-place-value", "number-and-place-value"],
    ["counting-processes", "number-and-place-value"],
    ["additive-strategies", "operations-and-calculation"],
    ["multiplicative-strategies", "operations-and-calculation"],
    ["understanding-money", "financial-and-real-world-mathematics"],
  ] as const)("maps %s to the reviewed Maths strand %s", (subElementKey, strandKey) => {
    const handoff = buildNumberOperationsPathwaysHandoff({ subElementKey });
    const url = new URL(handoff.href, "https://mylearna.test");

    expect(url.pathname).toBe("/my-pathways");
    expect(url.searchParams.get("subjectKey")).toBe("mathematics");
    expect(url.searchParams.get("strandKey")).toBe(strandKey);
    expect(handoff.mappingConfidence).toBe("strand-level");
    expect(handoff.note).toMatch(/does not claim an exact progression-level-to-pathway-step match/i);
  });

  it("preserves learner context when the product shell supplies it", () => {
    const handoff = buildNumberOperationsPathwaysHandoff({
      subElementKey: "additive-strategies",
      learnerId: "learner-123",
    });
    const url = new URL(handoff.href, "https://mylearna.test");

    expect(url.searchParams.get("learnerId")).toBe("learner-123");
  });
});
