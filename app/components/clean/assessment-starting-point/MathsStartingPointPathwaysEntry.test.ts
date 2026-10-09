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
    expect(source).toContain("Staff preview · Number & Operations starting point");
    expect(source).toContain("/assessments/maths-starting-point?");
    expect(source).toContain("learnerId: selectedLearner.id");
    expect(source).toContain("MATHS_STARTING_POINT_FOCUSED_AREAS");
    expect(source).toContain("Check Number & place value");
    expect(source).toContain("Check addition & subtraction");
    expect(source).toContain("Check multiplication & division");
    expect(source).toContain("Check Money");
    expect(source).toContain("Full five-area picture");
  });
});


it("shows the entry only in the three Mathematics strands actually covered by v1", () => {
  expect(source).toContain("MATHS_STARTING_POINT_STRANDS");
  expect(source).toContain('"number-and-place-value"');
  expect(source).toContain('"operations-and-calculation"');
  expect(source).toContain('"financial-and-real-world-mathematics"');
  expect(source).toContain(
    "MATHS_STARTING_POINT_STRANDS.has(selectedSubjectWorkspace.key)",
  );
  expect(source).not.toContain('"geometry-spatial-reasoning",\n]);');
});


it("maps the three live Number & Operations strands to relevant focused checks", () => {
  expect(source).toContain('"number-and-place-value": [');
  expect(source).toContain('area: "number-place-value"');
  expect(source).toContain('"operations-and-calculation": [');
  expect(source).toContain('area: "additive-strategies"');
  expect(source).toContain('area: "multiplicative-strategies"');
  expect(source).toContain('"financial-and-real-world-mathematics": [');
  expect(source).toContain('area: "understanding-money"');
  expect(source).toContain("area: focus.area");
});


it("offers Counting as a focused Number & place value starting-point check", () => {
  expect(source).toContain('area: "counting-processes"');
  expect(source).toContain('label: "Check Counting"');
});

it("makes the focused-vs-full question burden explicit in My Pathways", () => {
  expect(source).toContain("focused 6–11 question check");
  expect(source).toContain("full check uses 30–55 questions");
  expect(source).toContain("can be paused between areas");
});
