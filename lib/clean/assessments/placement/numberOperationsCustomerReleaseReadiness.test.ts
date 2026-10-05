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
        "fresh-recheck-evidence",
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

  it("keeps fresh recheck evidence as an explicit launch requirement", () => {
    const blocker = getMathsStartingPointCustomerReleaseBlockers().find(
      (entry) => entry.id === "fresh-recheck-evidence",
    );

    expect(blocker).toMatchObject({
      id: "fresh-recheck-evidence",
    });
    expect(blocker).not.toHaveProperty("count");
    expect(blocker?.message).toMatch(
      /covers all progression levels but still requires explicit release acceptance/i,
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
