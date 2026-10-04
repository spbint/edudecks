import { describe, expect, it } from "vitest";
import { getNumberOperationsBaselineBudget } from "./numberOperationsBaselineBudget";

describe("Number Operations baseline question budget", () => {
  it("keeps the all-in-one baseline bounded and transparent", () => {
    const budget = getNumberOperationsBaselineBudget();

    expect(budget.areaCount).toBe(5);
    expect(budget.minimumQuestions).toBe(30);
    expect(budget.maximumQuestions).toBe(55);
    expect(budget.maximumQuestions).toBeGreaterThanOrEqual(
      budget.minimumQuestions,
    );
    expect(budget.bySubElement).toHaveLength(5);
  });

  it("keeps every area within the single-area route budget", () => {
    for (const area of getNumberOperationsBaselineBudget().bySubElement) {
      expect(area.minimumQuestions).toBe(6);
      expect(area.maximumQuestions).toBe(11);
    }
  });
});


it("does not describe the full five-area electronic route as a quick quiz", () => {
  const budget = getNumberOperationsBaselineBudget();

  expect(budget.minimumQuestions).toBe(30);
  expect(budget.maximumQuestions).toBe(55);
});
