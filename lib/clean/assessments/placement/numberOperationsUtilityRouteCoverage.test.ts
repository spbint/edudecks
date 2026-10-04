import { describe, expect, it } from "vitest";
import {
  NUMERACY_PROGRESSION_SUB_ELEMENTS,
} from "./numeracyProgressionRegistry";
import {
  getNumberOperationsPracticeTarget,
} from "./numberOperationsPracticeTargets";

const FIRST_SLICE = new Set([
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
] as const);

describe("Maths starting-point next-learning route coverage", () => {
  it("gives every first-slice progression level a non-legacy next-learning destination", () => {
    let checked = 0;

    for (const subElement of NUMERACY_PROGRESSION_SUB_ELEMENTS) {
      if (!FIRST_SLICE.has(subElement.key as never)) continue;

      for (let pLevel = subElement.minP; pLevel <= subElement.maxP; pLevel += 1) {
        const target = getNumberOperationsPracticeTarget({
          subElementKey: subElement.key as
            | "number-place-value"
            | "counting-processes"
            | "additive-strategies"
            | "multiplicative-strategies"
            | "understanding-money",
          targetP: pLevel,
          learnerId: "learner-coverage",
        });
        const url = new URL(target.href, "https://mylearna.test");

        expect(
          ["/practice/maths-starting-point", "/my-pathways"],
          `${subElement.key} P${pLevel}`,
        ).toContain(url.pathname);
        expect(url.pathname).not.toBe("/practice/number-targeted");
        expect(url.pathname).not.toBe("/assessments/number");
        expect(url.searchParams.get("learnerId")).toBe("learner-coverage");

        if (url.pathname === "/practice/maths-starting-point") {
          expect(url.searchParams.get("source")).toBe("maths-starting-point");
          expect(url.searchParams.get("returnTo")).toBe(
            "/assessments/maths-starting-point?learnerId=learner-coverage",
          );
          expect(url.searchParams.get("moduleId")).toBeTruthy();
        } else {
          expect(url.searchParams.get("subjectKey")).toBe("mathematics");
          expect(url.searchParams.get("strandKey")).toBeTruthy();
        }

        checked += 1;
      }
    }

    expect(checked).toBe(48);
  });
});
