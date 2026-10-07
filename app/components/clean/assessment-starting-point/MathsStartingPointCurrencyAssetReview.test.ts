import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/assessments/maths-starting-point/asset-review/page.tsx",
  ),
  "utf8",
);

describe("Maths starting-point currency asset review route", () => {
  it("is staff-gated, noindex and read-only", () => {
    expect(source).toContain('AssessmentAccessGate mode="lab"');
    expect(source).toContain("index: false");
    expect(source).toContain("follow: false");
    expect(source).toContain("Review outcome is not changed here");
    expect(source).not.toContain("updateNumberOperationsAssetApproval");
  });

  it("renders the exact P1/P2 review sets at phone widths", () => {
    expect(source).toContain('width={390}');
    expect(source).toContain('width={430}');
    expect(source).toContain('title="All coin denominations · 390px"');
    expect(source).toContain('title="All coin denominations · 430px"');
    expect(source).toContain('title="P1 face-value item · 390px"');
    expect(source).toContain('title="P2 ordering item · 390px"');
    expect(source).toContain('title="P2 counting item · 390px"');
    expect(source).toContain('"australian-currency-schematic-v1"');
  });
});
