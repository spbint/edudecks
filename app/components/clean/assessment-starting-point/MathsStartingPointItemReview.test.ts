import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const route = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/assessments/maths-starting-point/item-review/page.tsx",
  ),
  "utf8",
);
const catalog = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/assessment-starting-point/MathsStartingPointItemReviewCatalog.tsx",
  ),
  "utf8",
);

describe("Maths starting-point item review catalogue", () => {
  it("is staff-gated, noindex and read-only", () => {
    expect(route).toContain('AssessmentAccessGate mode="lab"');
    expect(route).toContain("index: false");
    expect(route).toContain("follow: false");
    expect(route).toContain("does not approve, publish or mutate any item");
    expect(catalog).not.toContain("update");
    expect(catalog).not.toContain("publishItem");
  });

  it("reviews the canonical placement registry with useful QA filters", () => {
    expect(catalog).toContain("NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY");
    expect(catalog).toContain("AssessmentStimulus");
    expect(catalog).toContain("Accessibility review");
    expect(catalog).toContain("Observation-limited");
    expect(catalog).toContain("Asset review");
    expect(catalog).toContain("Correct order:");
    expect(catalog).toContain("Canonical:");
  });
});
