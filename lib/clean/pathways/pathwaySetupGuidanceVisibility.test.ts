import { describe, expect, it } from "vitest";
import { shouldShowPathwaysSetupGuidance } from "@/lib/clean/pathways/pathwaySetupGuidanceVisibility";

describe("Pathways setup guidance visibility", () => {
  it("keeps truthful zero-learner setup guidance", () => {
    expect(
      shouldShowPathwaysSetupGuidance({
        missingSetupItems: ["a learner"],
        missingLearnerSetup: true,
        hasValidSelectedLearner: false,
        hasUsablePathwaysWorkingState: false,
      }),
    ).toBe(true);
  });

  it("hides stale setup guidance when a valid learner has usable Pathways work", () => {
    expect(
      shouldShowPathwaysSetupGuidance({
        missingSetupItems: ["a learning year"],
        missingLearnerSetup: false,
        hasValidSelectedLearner: true,
        hasUsablePathwaysWorkingState: true,
      }),
    ).toBe(false);
  });

  it("hides personalised-recommendation setup prompts when a recommendation can already render", () => {
    expect(
      shouldShowPathwaysSetupGuidance({
        missingSetupItems: ["your first learning period"],
        missingLearnerSetup: false,
        hasValidSelectedLearner: true,
        hasUsablePathwaysWorkingState: true,
      }),
    ).toBe(false);
  });

  it("keeps genuine incomplete setup guidance when Pathways cannot produce a working state", () => {
    expect(
      shouldShowPathwaysSetupGuidance({
        missingSetupItems: ["a learning year"],
        missingLearnerSetup: false,
        hasValidSelectedLearner: true,
        hasUsablePathwaysWorkingState: false,
      }),
    ).toBe(true);
  });

  it("does not show setup guidance when no setup item is missing", () => {
    expect(
      shouldShowPathwaysSetupGuidance({
        missingSetupItems: [],
        missingLearnerSetup: false,
        hasValidSelectedLearner: true,
        hasUsablePathwaysWorkingState: true,
      }),
    ).toBe(false);
  });
});
