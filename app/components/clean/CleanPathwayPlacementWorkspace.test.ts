import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwayPlacementWorkspace.tsx"),
  "utf8",
);

describe("MyLearna Classical pathway placement band gate", () => {
  it("requires an explicitly recognised Years 3-4 learner before offering Classical placement", () => {
    expect(source).toContain("tryInferPathwayStageFromYearLevel");
    expect(source).toContain(
      'selectedSubjectKey !== "classical" || recognisedLearnerStageKey === "middle-primary"',
    );
    expect(source).toContain(
      'selectedSubjectKey !== "classical" ||',
    );
    expect(source).toContain(
      "(classicalBandAvailable && candidate.stageKey === recognisedLearnerStageKey)",
    );
    expect(source).toContain(
      "const gentleStartingStep = classicalBandAvailable",
    );
    expect(source).toContain(
      "const canContinueStrand = Boolean(selectedStrand && classicalBandAvailable)",
    );
  });

  it("blocks both suggested and manual placement when the Classical band is not live", () => {
    expect(source).toContain("MyLearna Classical is currently live for Years 3–4.");
    expect(source).toContain("disabled={!canContinueStrand}");
    expect(source.match(/disabled={!canContinueStrand}/g) || []).toHaveLength(2);
    expect(source).toContain(
      'cursor: canContinueStrand ? "pointer" : "not-allowed"',
    );
  });
});
