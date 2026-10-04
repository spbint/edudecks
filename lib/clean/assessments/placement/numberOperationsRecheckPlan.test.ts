import { describe, expect, it } from "vitest";
import { buildNumberOperationsRecheckPlan } from "./numberOperationsRecheckPlan";

describe("Number & Operations recheck plans", () => {
  it("uses observed learning before retesting routing-only evidence", () => {
    const plan = buildNumberOperationsRecheckPlan({
      subElementKey: "counting-processes",
      state: "verify-in-learning",
    });

    expect(plan).toMatchObject({
      trigger: "after-observation",
      minimumFreshEvidence: 1,
      repeatSameItemsImmediately: false,
    });
    expect(plan.guidance).toMatch(/Do not repeat the same electronic questions yet/i);
    expect(plan.evidenceToLookFor.length).toBeGreaterThanOrEqual(3);
  });

  it("uses readiness conditions rather than a fixed number of days for normal next learning", () => {
    const plan = buildNumberOperationsRecheckPlan({
      subElementKey: "additive-strategies",
      state: "build-next",
    });

    expect(plan.trigger).toBe("after-practice");
    expect(plan.guidance).toMatch(/different examples/i);
    expect(plan.guidance).toMatch(/independently/i);
    expect(plan.guidance).not.toMatch(/days|weeks/i);
  });

  it("does not encourage repeated testing at the extension endpoint", () => {
    const plan = buildNumberOperationsRecheckPlan({
      subElementKey: "multiplicative-strategies",
      state: "extend",
    });

    expect(plan).toMatchObject({
      trigger: "when-ready-for-extension",
      headline: "No immediate recheck needed",
      repeatSameItemsImmediately: false,
    });
  });
});
