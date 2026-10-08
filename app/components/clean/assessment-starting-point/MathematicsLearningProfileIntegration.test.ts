import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MATHS_STARTING_POINT_RELEASE } from "@/lib/clean/assessments/mathsStartingPointRelease";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const pageSource = source(
  "app/(auth)/assessments/maths-starting-point/learning-profile/page.tsx",
);
const baselineSource = source(
  "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
);
const anchorSource = source(
  "app/components/clean/assessment-starting-point/AssessmentAnchorPlacementRunner.tsx",
);
const playerSource = source(
  "app/components/clean/assessment-starting-point/AssessmentPlayerV1.tsx",
);
const presentationSource = source(
  "lib/clean/educationalIntelligence/mathematicsLearningProfilePresentation.ts",
);
const pdfSource = source(
  "lib/clean/outputs/mathematicsLearningProfilePdf.ts",
);

describe("Mathematics Learning Profile integration containment", () => {
  it("protects the synthetic fixture route before rendering it", () => {
    expect(pageSource).toContain("await requireAssessmentLabAccess(PROFILE_PREVIEW_ROUTE)");
    expect(pageSource.indexOf("await requireAssessmentLabAccess")).toBeLessThan(
      pageSource.indexOf("<MathematicsLearningProfilePreview"),
    );
  });

  it("projects the real deterministic completion through the canonical result layer", () => {
    expect(baselineSource).toContain("projectStartingPointCompletion");
    expect(baselineSource).toContain("presentMathematicsLearningProfile");
    expect(baselineSource).toContain("<MathematicsLearningProfile");
    expect(baselineSource.indexOf("<MathematicsLearningProfile")).toBeLessThan(
      baselineSource.indexOf("data-legacy-result-equivalence"),
    );
    expect(baselineSource).toContain("completion: baselineSnapshot");
  });

  it("captures only displayed item identity/version metadata for canonical provenance", () => {
    expect(playerSource).toContain("onItemPresented?.({ id: currentItem.id, version: currentItem.version })");
    expect(anchorSource).toContain("onItemPresented={onItemPresented}");
    expect(baselineSource).toContain("onItemPresented={recordItemVersion}");
    expect(baselineSource).not.toContain("correctOptionIds");
    expect(baselineSource).not.toContain("correctValue");
    expect(baselineSource).not.toContain("acceptableValues");
  });

  it("keeps presentation and PDF layers persistence, Supabase and AI free", () => {
    const implementation = `${presentationSource}\n${pdfSource}`.toLowerCase();
    for (const forbidden of [
      "supabase",
      ".insert(",
      ".update(",
      "openai",
      "anthropic",
      "embedding",
      "generative",
    ]) {
      expect(implementation, forbidden).not.toContain(forbidden);
    }
  });

  it("keeps every Starting Point release gate off", () => {
    expect(
      Object.entries(MATHS_STARTING_POINT_RELEASE)
        .filter(([, value]) => typeof value === "boolean")
        .every(([, value]) => value === false),
    ).toBe(true);
  });
});
