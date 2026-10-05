import { describe, expect, it } from "vitest";
import {
  assertMathsStartingPointCustomerReleaseReady,
  getMathsStartingPointCustomerReleaseBlockers,
} from "./numberOperationsCustomerReleaseReadiness";

describe("Maths starting-point customer release readiness", () => {
  it("refuses customer release while current staff-preview gates and content reviews remain open", () => {
    const blockers = getMathsStartingPointCustomerReleaseBlockers();
    const ids = blockers.map((blocker) => blocker.id);

    expect(ids).toEqual(
      expect.arrayContaining([
        "customer-visibility",
        "customer-navigation",
        "persistence",
        "evidence-write",
        "hosted-acceptance",
        "mobile-acceptance",
        "draft-items",
        "pending-trusted-assets",
      ]),
    );
    expect(
      blockers.find((blocker) => blocker.id === "draft-items")?.count,
    ).toBe(120);
    expect(
      blockers.find((blocker) => blocker.id === "pending-trusted-assets")?.count,
    ).toBe(1);
    expect(() => assertMathsStartingPointCustomerReleaseReady()).toThrow(
      /customer release is blocked/i,
    );
  });

  it("does not treat automatic Pathways mutation as a launch requirement", () => {
    expect(
      getMathsStartingPointCustomerReleaseBlockers().map((blocker) =>
        String(blocker.id),
      ),
    ).not.toContain("pathway-mutation");
  });
});
