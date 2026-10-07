import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { adaptAssessmentItemForStartingPointPlayer } from "@/lib/clean/assessments/interactivePlayer/startingPointPlayerContract";
import {
  getStartingPointRendererQaEdgeCases,
  getStartingPointRendererQaItems,
  getStartingPointRendererCoverageSummary,
} from "@/lib/clean/assessments/interactivePlayer/startingPointRendererCoverage";
import { MATHS_STARTING_POINT_RELEASE } from "@/lib/clean/assessments/mathsStartingPointRelease";
import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";
import { NUMBER_OPERATIONS_ASSET_APPROVALS } from "@/lib/clean/assessments/placement/numberOperationsAssetApprovals";

const customerCopyFiles = [
  "app/(auth)/assessments/maths-starting-point/page.tsx",
  "app/components/clean/assessment-starting-point/MathsStartingPointWorkspace.tsx",
  "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
  "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
  "app/components/clean/assessment-starting-point/AssessmentPlayerV1.tsx",
  "app/components/clean/assessment-starting-point/AssessmentNumberOperationsParentUtilityCard.tsx",
  "app/(auth)/practice/maths-starting-point/page.tsx",
].map((path) => readFileSync(join(process.cwd(), path), "utf8")).join("\n");
const showcaseRoute = readFileSync(
  join(process.cwd(), "app/(auth)/assessments/maths-starting-point/player-showcase/page.tsx"),
  "utf8",
);

describe("Number & Operations Starting Point commercial readiness", () => {
  it("uses an honest modular product identity and names all five assessed areas", () => {
    expect(NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.commercialDisplayName).toBe(
      "MyLearna Maths Starting Point — Number & Operations",
    );
    expect(NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.shortDisplayName).toBe(
      "Number & Operations Starting Point",
    );
    expect(NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.assessedAreas.map((area) => area.key)).toEqual([
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ]);
    for (const phrase of ["number and place value", "counting", "additive thinking", "multiplicative thinking", "money"]) {
      expect(NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.parentSummary.toLowerCase()).toContain(phrase);
    }
    expect(NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.parentEvidenceNote).toContain("not a pass/fail test");
    expect(NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.parentEvidenceNote).toContain("does not produce one overall Maths score");
  });

  it("does not claim whole-Mathematics coverage in the customer assessment experience", () => {
    for (const forbidden of ["complete Maths assessment", "whole Maths Starting Point", "full mathematics assessment", "all of mathematics", "full Maths"]) {
      expect(customerCopyFiles.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("derives staff full-estate QA from canonical renderer inventory and uses the actual adapter", () => {
    const items = getStartingPointRendererQaItems();
    const summary = getStartingPointRendererCoverageSummary();
    expect(items).toHaveLength(220);
    expect(summary).toMatchObject({
      totalActiveItems: 220,
      initialPlacementItems: 120,
      freshRecheckItems: 100,
      practicalAlternativeItems: 18,
      routingOnlyEvidenceItems: 59,
    });
    for (const { item, coverage } of items) {
      const model = adaptAssessmentItemForStartingPointPlayer(item);
      expect(model.itemId).toBe(coverage.itemId);
      expect(model.itemVersion).toBe(coverage.itemVersion);
      expect(model.kind).toBe(coverage.rendererFamily);
    }
    expect(getStartingPointRendererQaEdgeCases().length).toBeGreaterThanOrEqual(8);
  });

  it("checks staff access on the server before serializing canonical QA items", () => {
    expect(showcaseRoute).toContain("await requireAssessmentLabAccess(SHOWCASE_ROUTE)");
    expect(showcaseRoute.indexOf("await requireAssessmentLabAccess")).toBeLessThan(
      showcaseRoute.indexOf("getStartingPointRendererQaItems()"),
    );
  });

  it("records currency asset approval while keeping every release gate dark", () => {
    expect(NUMBER_OPERATIONS_ASSET_APPROVALS.find((asset) => asset.id === "australian-currency-schematic-v1")?.status).toBe("approved");
    expect(Object.entries(MATHS_STARTING_POINT_RELEASE).filter(([, value]) => typeof value === "boolean").every(([, value]) => value === false)).toBe(true);
  });
});
