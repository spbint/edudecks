import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
  "utf8",
);

describe("Pathways learner selection", () => {
  it("renders the multi-learner selector inside Current Learning before Explore pathway", () => {
    const currentContextStart = workspaceSource.indexOf('aria-label="Curriculum context"');
    const currentPanelStart = workspaceSource.indexOf(
      'className="mylearna-pathways-current-step-panel"',
    );
    const explorerStart = workspaceSource.indexOf('id="pathways-map"');
    const currentContext = workspaceSource.slice(currentContextStart, currentPanelStart);

    expect(currentContextStart).toBeGreaterThan(-1);
    expect(explorerStart).toBeGreaterThan(currentPanelStart);
    expect(currentContext).toContain('htmlFor="pathways-current-learner-selector"');
    expect(currentContext).toContain('id="pathways-current-learner-selector"');
    expect(currentContext).toContain('aria-label="Viewing pathways for"');
    expect(currentContext).toContain("hasMultipleLearners");
    expect(currentContext).toContain("learnerOptions.map");
    expect(currentContext).toContain("minHeight: 44");
  });

  it("keeps a static learner chip for a single-learner family and a read-only Explore summary", () => {
    const currentContext = workspaceSource.slice(
      workspaceSource.indexOf('aria-label="Curriculum context"'),
      workspaceSource.indexOf('className="mylearna-pathways-current-step-panel"'),
    );
    const selectedLearnerSummary = workspaceSource.slice(
      workspaceSource.indexOf('<div style={eyebrowStyle}>Selected learner</div>'),
      workspaceSource.indexOf('<div style={eyebrowStyle}>Subject</div>'),
    );

    expect(currentContext).toContain(
      "{selectedLearnerLabel}",
    );
    expect(selectedLearnerSummary).toContain("Change learner above.");
    expect(selectedLearnerSummary).not.toContain("<select");
  });

  it("uses one validated selection handler that persists selection and updates only internal URL context", () => {
    const handler = workspaceSource.slice(
      workspaceSource.indexOf("function handleSelectPathwaysLearner"),
      workspaceSource.indexOf("const reloadOnDeckItems"),
    );

    expect(handler).toContain("workspace.learners.find");
    expect(handler).toContain("setSelectedLearnerIdOverride(nextLearner.id)");
    expect(handler).toContain('params.set("learnerId", nextLearner.id)');
    expect(handler).toContain("new URLSearchParams(searchParams.toString())");
    expect(handler).toContain('trackPathwayAnalyticsEvent("pathway_learner_changed")');
    expect(handler).not.toContain("createClean");
    expect(handler).not.toContain("savePathwayPlacement");
    expect(workspaceSource).toContain("writePersistedPathwaysUiState({");
    expect(workspaceSource).toContain("selectedLearnerId,");
    expect(workspaceSource).toContain('searchParams.get("learnerId")');
    expect(workspaceSource).toContain("workspace.learners.some((learner) => learner.id === learnerIdFromUrl)");
  });

  it("keeps learner-scoped loaders and action links on the current selection, rejecting late responses", () => {
    expect(workspaceSource).toContain("pathwayLearnerRequestEpochRef");
    expect(workspaceSource).toContain("currentPathwaysLearnerIdRef");
    expect(workspaceSource).toContain("listLearningQueueItems(");
    expect(workspaceSource).toContain("listCleanEvidenceEntries(");
    expect(workspaceSource).toContain("listCleanAssessmentSkillStatuses(");
    expect(workspaceSource).toContain("listAssessmentAttemptsForLearner(");
    expect(workspaceSource).toContain("requestLearnerId !== currentPathwaysLearnerIdRef.current");
    expect(workspaceSource).toContain("learnerId: selectedLearnerId,");
    expect(workspaceSource).toContain("learnerId: selectedLearnerId || null");
  });

  it("builds Pathways-to-Calendar, Capture, practice, assessment, and On Deck actions from the switched learner", () => {
    const planHandoff = workspaceSource.slice(
      workspaceSource.indexOf("const selectedPlacementPlanHref"),
      workspaceSource.indexOf("const selectedPlacementWorksheet"),
    );

    expect(planHandoff).toContain("learnerId: selectedLearnerId");
    expect(planHandoff).not.toContain("James");
    expect(workspaceSource).toContain("selectedPlacementCaptureHref");
    expect(workspaceSource).toContain("selectedPlacementPracticeHref");
    expect(workspaceSource).toContain("selectedPlacementAssessmentHref");
    expect(workspaceSource).toContain("addPathwayStepToLearningQueue");
    expect(workspaceSource).toContain("learnerId: selectedLearnerId,");
  });
});
