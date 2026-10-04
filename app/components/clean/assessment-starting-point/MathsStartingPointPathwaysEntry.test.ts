import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
  "utf8",
);

describe("Maths starting-point My Pathways entry", () => {
  it("uses the existing internal assessment permission rather than a customer feature flag", () => {
    expect(source).toContain("useAuthUser");
    expect(source).toContain("canAccessAssessmentLab");
    expect(source).toContain("canPreviewMathsStartingPoint");
    expect(source).toContain('selectedSubjectKey === "mathematics"');
    expect(source).not.toContain(
      "CUSTOMER_PATHWAY_ASSESSMENT_AVAILABLE && canPreviewMathsStartingPoint",
    );
  });

  it("links the selected learner into the staff-only Maths starting-point utility", () => {
    expect(source).toContain("Staff preview · Maths starting point");
    expect(source).toContain("Find a starting point");
    expect(source).toContain("/assessments/maths-starting-point?");
    expect(source).toContain("learnerId: selectedLearner.id");
  });
});
