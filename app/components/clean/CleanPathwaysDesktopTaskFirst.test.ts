import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
  "utf8",
);
const actionRowSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwayStepActionRow.tsx"),
  "utf8",
);

describe("desktop Pathways task-first hierarchy", () => {
  it("leads with current learning before the full pathway explorer", () => {
    const currentLearning = workspaceSource.indexOf(
      'data-guidance-id="pathways-current-step"',
    );
    const explorer = workspaceSource.indexOf('id="pathways-map"');

    expect(currentLearning).toBeGreaterThan(-1);
    expect(explorer).toBeGreaterThan(currentLearning);
    expect(workspaceSource).toContain("Current learning");
    expect(workspaceSource).toContain("{selectedLearnerLabel}");
    expect(workspaceSource).toContain("selectedPlacementStep.subjectTitle");
    expect(workspaceSource).toContain("selectedPlacementStep.strandTitle");
    expect(workspaceSource).toContain("selectedPlacementStageTitle");
    expect(workspaceSource).toContain("selectedPlacementStep.stepTitle");
  });

  it("uses the canonical action row for one recommended current-step action", () => {
    const currentPanel = workspaceSource.slice(
      workspaceSource.indexOf('className="mylearna-pathways-current-step-panel"'),
      workspaceSource.indexOf('aria-label="Step adjustment actions"'),
    );

    expect(currentPanel).toContain("<CleanPathwayStepActionRow");
    expect(currentPanel).toContain("emphasizePrimary");
    expect(currentPanel).toContain("selectedPlacementAssessmentHref");
    expect(currentPanel).toContain("selectedPlacementPracticeHref");
    expect(currentPanel).toContain("selectedPlacementComplete ? selectedPlacementNextStepHref : \"\"");
    expect(workspaceSource).not.toContain('aria-label="Learning package actions"');
    expect(actionRowSource).toContain("resolvePathwayNextAction");
    expect(workspaceSource).not.toContain("resolvePathwayNextAction");
  });

  it("keeps pathway exploration available but secondary and deep-link aware", () => {
    expect(workspaceSource).toContain('className="mylearna-pathways-explorer"');
    expect(workspaceSource).toContain("pathwayExplorerForcedOpen");
    expect(workspaceSource).toContain("getReturnedPathwayDetailPanelId()");
    expect(workspaceSource).toContain("open={pathwayExplorerForcedOpen || pathwayExplorerOpen}");
    expect(workspaceSource).toContain("Browse subjects, strands, stages and all learning steps.");
    expect(workspaceSource).toContain("<PathwayStageJourney");
    expect(workspaceSource).toContain("<DetailedMathematicsStepCard");
    expect(workspaceSource).toContain("onActiveStageChange={handleSelectWorkspaceStage}");
  });

  it("does not put optional product guidance ahead of the Pathways task", () => {
    expect(workspaceSource).not.toContain("GuidancePageAction");
    expect(workspaceSource).not.toContain("CoreJourneyCue");
    expect(workspaceSource).toContain("<CleanFirstRunSetupGate currentStep=\"pathways\" />");
    expect(workspaceSource).toContain("<CleanFeedbackPrompt pageName=\"My Pathways\" />");
  });

  it("preserves exact Pathways capture and return context without adding persistence", () => {
    expect(workspaceSource).toContain("buildPathwayCaptureSearchParams");
    expect(workspaceSource).toContain("appendPathwayCaptureReturnTo");
    expect(workspaceSource).toContain("pathwayStepId: selectedPlacementStep.id");
    expect(workspaceSource).toContain("stepKey: selectedPlacementStep.stepKey");
    expect(workspaceSource).toContain("detailPanelId: `pathway-step-${selectedPlacementStep.strandKey}");
    expect(workspaceSource).not.toContain("ensureCleanOperationalWeekFromUsualWeek");
  });
});
