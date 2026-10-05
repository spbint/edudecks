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

  it("reviews only customer-route score-bearing visuals in a 390px frame", () => {
    expect(source).toContain("NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY");
    expect(source).toContain('entry.item.stimulus.type !== "none"');
    expect(source).toContain("maxWidth: 390");
    expect(source).toContain("AssessmentStimulus");
    expect(source).toContain("Accessible description");
  });
});
