import { describe, expect, it } from "vitest";
import { buildNumberOperationsPathwaysHandoff } from "./numberOperationsPathwaysHandoff";

describe("Number & Operations My Pathways handoff", () => {
  it("uses a source-guided canonical step when the crosswalk supports it", () => {
    const handoff = buildNumberOperationsPathwaysHandoff({
      subElementKey: "number-place-value",
      targetP: 10,
    });
    const url = new URL(handoff.href, "https://mylearna.test");

    expect(handoff).toMatchObject({
      mappingConfidence: "source-guided-step",
      strandKey: "number-and-place-value",
      stageKey: "years-9-10-consolidation",
      stepTitle: "Work with standard form and very large or very small numbers",
    });
    expect(url.searchParams.get("subjectKey")).toBe("mathematics");
    expect(url.searchParams.get("stageKey")).toBe("years-9-10-consolidation");
    expect(url.searchParams.get("pathwayStepId")).toBe(handoff.pathwayStepId);
    expect(url.searchParams.get("stepKey")).toBeNull();
  });

  it("keeps mixed Counting P1 evidence at strand level instead of inventing one exact step", () => {
    const handoff = buildNumberOperationsPathwaysHandoff({
      subElementKey: "counting-processes",
      targetP: 1,
    });
    const url = new URL(handoff.href, "https://mylearna.test");

    expect(handoff.mappingConfidence).toBe("strand-level");
    expect(handoff.pathwayStepId).toBeNull();
    expect(url.searchParams.get("strandKey")).toBe("number-and-place-value");
    expect(url.searchParams.get("pathwayStepId")).toBeNull();
  });

  it("keeps ambiguous counting targets at strand level", () => {
    const handoff = buildNumberOperationsPathwaysHandoff({
      subElementKey: "counting-processes",
      targetP: 8,
    });
    const url = new URL(handoff.href, "https://mylearna.test");

    expect(handoff.mappingConfidence).toBe("strand-level");
    expect(handoff.pathwayStepId).toBeNull();
    expect(url.searchParams.get("strandKey")).toBe("number-and-place-value");
    expect(url.searchParams.get("pathwayStepId")).toBeNull();
  });

  it("preserves learner context when the product shell supplies it", () => {
    const handoff = buildNumberOperationsPathwaysHandoff({
      subElementKey: "additive-strategies",
      targetP: 8,
      learnerId: "learner-123",
    });
    const url = new URL(handoff.href, "https://mylearna.test");

    expect(url.searchParams.get("learnerId")).toBe("learner-123");
    expect(handoff.strandKey).toBe("operations-and-calculation");
    expect(handoff.mappingConfidence).toBe("source-guided-step");
  });
});


it("uses only query parameters that the live My Pathways workspace consumes", () => {
  const handoff = buildNumberOperationsPathwaysHandoff({
    subElementKey: "understanding-money",
    targetP: 8,
    learnerId: "learner-123",
  });
  const url = new URL(handoff.href, "https://mylearna.test");

  expect([...url.searchParams.keys()].sort()).toEqual(
    [
      "learnerId",
      "pathwayStepId",
      "stageKey",
      "strandKey",
      "subjectKey",
    ].sort(),
  );
  expect(url.searchParams.get("stepKey")).toBeNull();
  expect(url.searchParams.get("openStep")).toBeNull();
});
