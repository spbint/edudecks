import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
  "utf8",
);
const englishSource = readFileSync(
  join(process.cwd(), "lib/clean/pathways/englishPathways.ts"),
  "utf8",
);

describe("desktop Pathways subject switcher", () => {
  it("renders a compact interactive subject selector in the current-learning context", () => {
    const currentContext = workspaceSource.slice(
      workspaceSource.indexOf('aria-label="Curriculum context"'),
      workspaceSource.indexOf('className="mylearna-pathways-current-step-panel"'),
    );

    expect(currentContext).toContain('htmlFor="pathways-current-subject-selector"');
    expect(currentContext).toContain('aria-label="Pathways subject"');
    expect(currentContext).toContain("LIVE_PATHWAY_SUBJECTS.map");
    expect(currentContext).toContain("handleSelectSubject");
    expect(workspaceSource).not.toContain('id="pathway-subject-selector"');
  });

  it("only promotes live registry-backed subjects in the switcher", () => {
    expect(workspaceSource).toContain("const LIVE_PATHWAY_SUBJECTS = PATHWAY_SUBJECTS.filter");
    expect(workspaceSource).toContain("config?.domainCards.some");
    expect(workspaceSource).toContain("config.workspaceBuilders[domain.key]");
  });

  it("switching subjects clears stale exact-step URL context without writing progress or evidence", () => {
    const replacePathwayViewParams = workspaceSource.slice(
      workspaceSource.indexOf("function replacePathwayViewParams"),
      workspaceSource.indexOf("function handleSelectSubjectStrand"),
    );
    const handleSelectSubject = workspaceSource.slice(
      workspaceSource.indexOf("function handleSelectSubject"),
      workspaceSource.indexOf("function handleSelectSubjectStrand"),
    );

    expect(handleSelectSubject).toContain("DETAILED_SUBJECT_CONFIGS[nextSubjectKey]?.defaultStrandKey");
    expect(handleSelectSubject).toContain("setSelectedSubjectKey(nextSubjectKey)");
    expect(replacePathwayViewParams).toContain('params.delete("stageKey")');
    expect(replacePathwayViewParams).toContain('params.delete("pathwayStepId")');
    expect(replacePathwayViewParams).toContain('params.delete("stepKey")');
    expect(replacePathwayViewParams).not.toContain("savePathwayPlacement");
    expect(replacePathwayViewParams).not.toContain("listCleanEvidenceEntries");
  });

  it("defaults English switches to Morphology & Spelling", () => {
    expect(englishSource).toContain('export const DEFAULT_ENGLISH_STRAND_KEY = "morphology-and-spelling"');
    expect(englishSource).toContain('"morphology-and-spelling": (currentFocusStageKey)');
  });

  it("uses a subject-safe selected-step fallback so Mathematics state cannot leak into English", () => {
    const selectedPlacementStep = workspaceSource.slice(
      workspaceSource.indexOf("const selectedPlacementStep = useMemo"),
      workspaceSource.indexOf("const selectedPlacementStrandSteps = useMemo"),
    );

    expect(selectedPlacementStep).toContain("selectedSubjectDefaultPathwayStepId");
    expect(selectedPlacementStep).toContain("focusStep.subjectKey === selectedSubjectKey");
    expect(selectedPlacementStep).toContain("focusStep.strandKey === selectedStrandKey");
  });
});
