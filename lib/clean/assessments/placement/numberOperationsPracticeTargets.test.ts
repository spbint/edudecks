import { describe, expect, it } from "vitest";
import { getNumberOperationsPracticeTarget } from "./numberOperationsPracticeTargets";

describe("Number Operations practice targets", () => {
  it("maps only reviewed broad practice families", () => {
    expect(
      getNumberOperationsPracticeTarget({
        subElementKey: "number-place-value",
        targetP: 7,
      }),
    ).toMatchObject({
      kind: "broad-practice-family",
      moduleId: "number-place-value-operations-practice-module-v1",
      mappingConfidence: "broad-family",
    });

    expect(
      getNumberOperationsPracticeTarget({
        subElementKey: "additive-strategies",
        targetP: 9,
      }),
    ).toMatchObject({
      kind: "broad-practice-family",
      moduleId: "number-rational-operations-practice-module-v1",
    });

    expect(
      getNumberOperationsPracticeTarget({
        subElementKey: "understanding-money",
        targetP: 8,
      }),
    ).toMatchObject({
      kind: "broad-practice-family",
      moduleId: "number-percent-ratio-finance-practice-module-v1",
    });
  });

  it("uses a real strand-level My Pathways handoff when a practice module would mislead", () => {
    const counting = getNumberOperationsPracticeTarget({
      subElementKey: "counting-processes",
      targetP: 6,
    });
    const countingUrl = new URL(counting.href, "https://mylearna.test");

    expect(counting).toMatchObject({
      kind: "pathways-review",
      moduleId: null,
      mappingConfidence: "fallback",
    });
    expect(countingUrl.pathname).toBe("/my-pathways");
    expect(countingUrl.searchParams.get("subjectKey")).toBe("mathematics");
    expect(countingUrl.searchParams.get("strandKey")).toBe("number-and-place-value");
    expect(countingUrl.searchParams.get("pathwayStepId")).toBeNull();

    const laterMultiplicative = getNumberOperationsPracticeTarget({
      subElementKey: "multiplicative-strategies",
      targetP: 9,
    });
    const operationsUrl = new URL(
      laterMultiplicative.href,
      "https://mylearna.test",
    );
    expect(operationsUrl.searchParams.get("strandKey")).toBe(
      "operations-and-calculation",
    );
    expect(operationsUrl.searchParams.get("pathwayStepId")).not.toBeNull();
  });

  it("keeps early place-value and money targets out of over-advanced modules", () => {
    const number = getNumberOperationsPracticeTarget({
      subElementKey: "number-place-value",
      targetP: 4,
    });
    const money = getNumberOperationsPracticeTarget({
      subElementKey: "understanding-money",
      targetP: 2,
    });

    expect(number.kind).toBe("pathways-review");
    expect(new URL(number.href, "https://mylearna.test").searchParams.get("strandKey")).toBe(
      "number-and-place-value",
    );
    expect(money.kind).toBe("pathways-review");
    expect(new URL(money.href, "https://mylearna.test").searchParams.get("strandKey")).toBe(
      "financial-and-real-world-mathematics",
    );
  });

  it("builds targeted-practice links with provenance metadata", () => {
    const target = getNumberOperationsPracticeTarget({
      subElementKey: "additive-strategies",
      targetP: 7,
    });

    expect(target.href).toContain("/practice/maths-starting-point?");
    expect(target.href).toContain(
      "moduleId=number-additive-strategies-practice-module-v1",
    );
    expect(target.href).toContain("sourceProgressionStep=P7");
    expect(target.href).toContain("sourceSubElement=additive-strategies");
  });
});


it("preserves learner context and returns targeted practice to the Maths starting-point utility", () => {
  const target = getNumberOperationsPracticeTarget({
    subElementKey: "additive-strategies",
    targetP: 7,
    learnerId: "learner-123",
  });
  const url = new URL(target.href, "https://mylearna.test");

  expect(url.pathname).toBe("/practice/maths-starting-point");
  expect(url.searchParams.get("learnerId")).toBe("learner-123");
  expect(url.searchParams.get("returnTo")).toBe(
    "/assessments/maths-starting-point?learnerId=learner-123",
  );
  expect(target.href).not.toContain("/assessment-lab/");
});

it("preserves learner context on My Pathways fallback targets", () => {
  const target = getNumberOperationsPracticeTarget({
    subElementKey: "counting-processes",
    targetP: 8,
    learnerId: "learner-123",
  });
  const url = new URL(target.href, "https://mylearna.test");

  expect(url.pathname).toBe("/my-pathways");
  expect(url.searchParams.get("learnerId")).toBe("learner-123");
});


it("never sends starting-point broad practice through the legacy practice route", () => {
  for (const input of [
    { subElementKey: "number-place-value" as const, targetP: 7 },
    { subElementKey: "additive-strategies" as const, targetP: 7 },
    { subElementKey: "multiplicative-strategies" as const, targetP: 6 },
    { subElementKey: "understanding-money" as const, targetP: 6 },
  ]) {
    const target = getNumberOperationsPracticeTarget({
      ...input,
      learnerId: "learner-123",
    });
    expect(target.href).toContain("/practice/maths-starting-point?");
    expect(target.href).not.toContain("/practice/number-targeted");
    expect(target.href).toContain("source=maths-starting-point");
  }
});


it("uses the plain starting-point return when no learner context is supplied", () => {
  const target = getNumberOperationsPracticeTarget({
    subElementKey: "additive-strategies",
    targetP: 7,
  });
  const url = new URL(target.href, "https://mylearna.test");

  expect(url.searchParams.get("returnTo")).toBe(
    "/assessments/maths-starting-point",
  );
});


it("names a source-guided Pathways fallback with the actual recommended step", () => {
  const target = getNumberOperationsPracticeTarget({
    subElementKey: "number-place-value",
    targetP: 4,
    learnerId: "learner-123",
  });

  expect(target.kind).toBe("pathways-review");
  expect(target.label).toBe(
    "Open Understand that ten ones make one ten in My Pathways",
  );
  expect(target.href).toContain("pathwayStepId=");
});
