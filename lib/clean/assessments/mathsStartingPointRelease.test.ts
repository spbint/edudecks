import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MATHS_STARTING_POINT_RELEASE,
  assertMathsStartingPointPersistenceEnabled,
  assertMathsStartingPointStaffPreviewSafety,
} from "./mathsStartingPointRelease";

describe("Maths starting-point release gate", () => {
  it("keeps the clean candidate staff-only and read-only", () => {
    expect(MATHS_STARTING_POINT_RELEASE).toMatchObject({
      phase: "staff-preview",
      customerVisible: false,
      persistenceEnabled: false,
      evidenceWriteEnabled: false,
      pathwayMutationEnabled: false,
      customerNavigationEnabled: false,
      hostedAcceptanceApproved: false,
      mobileAcceptanceApproved: false,
    });
    expect(assertMathsStartingPointStaffPreviewSafety()).toBe(true);
    expect(() => assertMathsStartingPointPersistenceEnabled()).toThrow(
      /persistence is disabled/i,
    );
  });
});


it("allows a future persistence smoke while the feature remains staff-only", () => {
  const source = readFileSync(
    join(process.cwd(), "lib/clean/assessments/mathsStartingPointRelease.ts"),
    "utf8",
  );

  expect(source).not.toContain(
    'throw new Error("Maths starting-point v1 persistence is not approved.")',
  );
  expect(source).toContain(
    "persistence cannot be enabled while customer visibility is active",
  );
});
