import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/assessments/maths-starting-point/visual-review/page.tsx",
  ),
  "utf8",
);

describe("Maths starting-point visual review", () => {
  it("is staff-gated, noindex and read-only", () => {
    expect(source).toContain('AssessmentAccessGate mode="lab"');
    expect(source).toContain("index: false");
    expect(source).toContain("follow: false");
    expect(source).toContain("does not alter item status");
  });

  it("reviews the full active trusted-asset estate at both required phone widths", () => {
    expect(source).toContain("getTrustedMathAssetCoverage");
    expect(source).toContain("coverage.baseTenVisuals");
    expect(source).toContain("coverage.currencyVisuals");
    expect(source).toContain("([390, 430] as const)");
    expect(source).toContain("maxWidth: frameWidth");
    expect(source).toContain("AssessmentStimulus");
    expect(source).toContain("CurrencyAuditVisual");
  });

  it("provides direct staff shortcuts for every requested QA target", () => {
    for (const anchor of [
      "historical-qa-77",
      "historical-qa-79",
      "historical-qa-141",
      "all-base-ten-visuals",
      "all-currency-visuals",
    ]) {
      expect(source).toContain(anchor);
    }
  });
});
