import { describe, expect, it } from "vitest";
import {
  buildNumberOperationsUnresolvedGuidance,
  getNumberOperationsUnresolvedGuidance,
} from "./numberOperationsUnresolvedGuidance";

describe("Number & Operations unresolved parent guidance", () => {
  it("provides one practical action for each first-slice area", () => {
    const keys = [
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ] as const;

    for (const key of keys) {
      const guidance = getNumberOperationsUnresolvedGuidance(key);
      expect(guidance.subElementKey).toBe(key);
      expect(guidance.headline.trim()).not.toBe("");
      expect(guidance.tryThis.trim()).not.toBe("");
      expect(guidance.evidenceToLookFor.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps unresolved guidance safe for early as well as later learners", () => {
    const number = getNumberOperationsUnresolvedGuidance("number-place-value");
    const multiplicative = getNumberOperationsUnresolvedGuidance(
      "multiplicative-strategies",
    );
    const money = getNumberOperationsUnresolvedGuidance("understanding-money");

    expect(number.tryThis).not.toMatch(/round|decimal|scientific notation/i);
    expect(multiplicative.evidenceToLookFor.join(" ")).not.toMatch(
      /inverse|exponent|scientific notation/i,
    );
    expect(money.evidenceToLookFor.join(" ")).not.toMatch(
      /budget|interest|discount|tax/i,
    );
  });

  it("deduplicates unresolved areas while preserving their order", () => {
    const guidance = buildNumberOperationsUnresolvedGuidance([
      "counting-processes",
      "counting-processes",
      "understanding-money",
    ]);

    expect(guidance.map((item) => item.subElementKey)).toEqual([
      "counting-processes",
      "understanding-money",
    ]);
  });
});
