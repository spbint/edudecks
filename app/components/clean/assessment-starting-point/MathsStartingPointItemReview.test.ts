import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/assessments/maths-starting-point/item-review/page.tsx",
  ),
  "utf8",
);
const viewer = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/assessment-starting-point/MathsStartingPointItemReview.tsx",
  ),
  "utf8",
);

describe("Maths starting-point staff item review", () => {
  it("is staff-gated and read-only", () => {
    expect(page).toContain('AssessmentAccessGate mode="lab"');
    expect(page).toContain("index: false");
    expect(page).toContain("follow: false");
    expect(viewer).toContain("Staff-only item QA");
    expect(viewer).not.toContain("update");
    expect(viewer).not.toContain("publishItem");
  });

  it("reviews the canonical registry with practical filters and trust flags", () => {
    expect(viewer).toContain("NUMBER_OPERATIONS_PLACEMENT_ITEM_REGISTRY");
    expect(viewer).toContain("All areas");
    expect(viewer).toContain("All P-levels");
    expect(viewer).toContain("All pools");
    expect(viewer).toContain("All statuses");
    expect(viewer).toContain("Routing-only evidence");
    expect(viewer).toContain("Practical observation alternative required");
    expect(viewer).toContain("Trusted asset pending review");
  });
});
