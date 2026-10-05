import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/assessments/maths-starting-point/readiness/page.tsx",
  ),
  "utf8",
);

describe("Maths starting-point readiness route", () => {
  it("is staff-gated, noindex and read-only", () => {
    expect(source).toContain('AssessmentAccessGate mode="lab"');
    expect(source).toContain("index: false");
    expect(source).toContain("follow: false");
    expect(source).toContain("Nothing on this page changes release state");
    expect(source).not.toContain("updateNumberOperationsAssetApproval");
    expect(source).not.toContain("updateMathsStartingPointRelease");
  });

  it("shows release gates, item count and trusted asset review state", () => {
    expect(source).toContain("getMathsStartingPointCustomerReleaseBlockers");
    expect(source).toContain("NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY");
    expect(source).toContain("NUMBER_OPERATIONS_ASSET_APPROVALS");
    expect(source).toContain("MATHS_STARTING_POINT_RELEASE");
  });
});
