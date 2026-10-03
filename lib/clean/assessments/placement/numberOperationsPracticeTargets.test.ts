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

  it("does not force-map counting or mixed later multiplicative constructs", () => {
    expect(
      getNumberOperationsPracticeTarget({
        subElementKey: "counting-processes",
        targetP: 6,
      }),
    ).toMatchObject({
      kind: "pathways-review",
      href: "/my-pathways",
      moduleId: null,
      mappingConfidence: "fallback",
    });

    expect(
      getNumberOperationsPracticeTarget({
        subElementKey: "multiplicative-strategies",
        targetP: 9,
      }),
    ).toMatchObject({
      kind: "pathways-review",
      moduleId: null,
    });
  });

  it("keeps early place-value and money targets out of over-advanced modules", () => {
    expect(
      getNumberOperationsPracticeTarget({
        subElementKey: "number-place-value",
        targetP: 4,
      }).kind,
    ).toBe("pathways-review");

    expect(
      getNumberOperationsPracticeTarget({
        subElementKey: "understanding-money",
        targetP: 2,
      }).kind,
    ).toBe("pathways-review");
  });

  it("builds targeted-practice links with provenance metadata", () => {
    const target = getNumberOperationsPracticeTarget({
      subElementKey: "additive-strategies",
      targetP: 7,
    });

    expect(target.href).toContain("/practice/number-targeted?");
    expect(target.href).toContain(
      "moduleId=number-additive-strategies-practice-module-v1",
    );
    expect(target.href).toContain("sourceProgressionStep=P7");
    expect(target.href).toContain("sourceSubElement=additive-strategies");
  });
});
