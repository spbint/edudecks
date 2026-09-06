import { existsSync, readFileSync } from "node:fs";
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
const customerActionAvailabilitySource = readFileSync(
  join(process.cwd(), "lib/clean/pathways/pathwayCustomerActionAvailability.ts"),
  "utf8",
);
const setupGuidanceVisibilitySource = readFileSync(
  join(process.cwd(), "lib/clean/pathways/pathwaySetupGuidanceVisibility.ts"),
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

  it("renders one pathway exploration entry and avoids a permanent start receipt", () => {
    expect(workspaceSource.match(/Explore pathway/g) || []).toHaveLength(1);
    expect(workspaceSource).not.toContain("Pathway started");
    expect(workspaceSource).not.toContain("Ready to keep going. Open the current step");
  });

  it("keeps non-current pathway steps compact until deliberately opened", () => {
    const detailedCard = workspaceSource.slice(
      workspaceSource.indexOf("function DetailedMathematicsStepCard"),
      workspaceSource.indexOf("function getReturnedPathwayDetailPanelId"),
    );
    const revealCard = workspaceSource.slice(
      workspaceSource.indexOf("function NumberRevealStepCard"),
      workspaceSource.indexOf("function NumberPathwayRevealPanel"),
    );

    expect(detailedCard).toContain("const isCurrentLearningStep = stageIndex === currentStageIndex && stepIndex === 0");
    expect(detailedCard).toContain("const showStepActions = isOpen || isCurrentLearningStep");
    expect(detailedCard).toContain("{showStepActions ? (");
    expect(detailedCard).toContain("emphasizePrimary={isCurrentLearningStep}");
    expect(revealCard).toContain("worksheetResource && primary");
    expect(revealCard).toContain("Worksheet ready");
  });

  it("de-emphasises evidence metadata outside the primary current-learning chip row", () => {
    const currentPanelStart = workspaceSource.indexOf(
      'className="mylearna-pathways-current-step-panel"',
    );
    const primaryStatusRow = workspaceSource.slice(
      currentPanelStart,
      workspaceSource.indexOf("<strong style={{ color: \"#17204B\"", currentPanelStart),
    );

    expect(primaryStatusRow).toContain("Current step");
    expect(primaryStatusRow).toContain("selectedPlacementProgressStory?.currentProgress");
    expect(primaryStatusRow).not.toContain("Evidence attached");
    expect(primaryStatusRow).not.toContain("Photo attached");
    expect(primaryStatusRow).not.toContain("Portfolio");
    expect(primaryStatusRow).not.toContain("Reports");
    expect(workspaceSource).toContain('className="mylearna-pathways-current-evidence-detail"');
    expect(workspaceSource).toContain("Evidence and record details");
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

  it("keeps customer Pathways actions focused on approved surfaces", () => {
    expect(customerActionAvailabilitySource).toContain("CUSTOMER_PATHWAY_PRACTICE_AVAILABLE = false");
    expect(customerActionAvailabilitySource).toContain("CUSTOMER_PATHWAY_ASSESSMENT_AVAILABLE = false");
    expect(customerActionAvailabilitySource).toContain("CUSTOMER_PATHWAY_WORKSHEET_VIEW_AVAILABLE = false");
    expect(actionRowSource).toContain("\"check-understanding\": Boolean(customerAssessmentHref)");
    expect(actionRowSource).toContain("practise: Boolean(customerPracticeHref)");
    expect(actionRowSource).toContain("worksheet: CUSTOMER_PATHWAY_WORKSHEET_VIEW_AVAILABLE && Boolean(worksheetResource)");
    expect(actionRowSource).toContain('return "Add to Portfolio"');
    expect(actionRowSource).not.toContain("View worksheet");
    expect(workspaceSource).not.toContain(">Open worksheet<");
    expect(workspaceSource).not.toContain(">Add completed work<");
  });

  it("keeps underlying assessment implementation and route files available", () => {
    expect(
      existsSync(join(process.cwd(), "app/components/clean/CleanNumberAssessmentPlayer.tsx")),
    ).toBe(true);
    expect(
      existsSync(join(process.cwd(), "app/(auth)/assessments/number/page.tsx")),
    ).toBe(true);
  });

  it("suppresses stale setup guidance when Pathways already has a valid working state", () => {
    expect(workspaceSource).toContain("shouldShowPathwaysSetupGuidance");
    expect(workspaceSource).toContain("hasValidSelectedLearner: Boolean(selectedLearner)");
    expect(workspaceSource).toContain("hasUsablePathwaysWorkingState");
    expect(workspaceSource).toContain("selectedPlacementStep");
    expect(workspaceSource).toContain("selectedPlacementProgressStory");
    expect(setupGuidanceVisibilitySource).toContain("if (missingLearnerSetup) return true");
    expect(setupGuidanceVisibilitySource).toContain("hasValidSelectedLearner && hasUsablePathwaysWorkingState");
    expect(setupGuidanceVisibilitySource).not.toContain("supabase");
    expect(setupGuidanceVisibilitySource).not.toContain(".insert(");
    expect(setupGuidanceVisibilitySource).not.toContain(".update(");
    expect(setupGuidanceVisibilitySource).not.toContain(".upsert(");
  });
});
