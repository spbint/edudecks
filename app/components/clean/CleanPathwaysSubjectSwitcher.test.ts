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
    expect(currentContext).toContain("IN_DEVELOPMENT_PATHWAY_SUBJECT_OPTIONS.map");
    expect(currentContext).toContain("handleSelectSubject");
    expect(workspaceSource).not.toContain('id="pathway-subject-selector"');
  });

  it("shows active and in-development subjects in the native selector", () => {
    const subjectSelector = workspaceSource.slice(
      workspaceSource.indexOf('id="pathways-current-subject-selector"'),
      workspaceSource.indexOf("</select>", workspaceSource.indexOf('id="pathways-current-subject-selector"')),
    );

    expect(subjectSelector).toContain('<optgroup label="Active">');
    expect(subjectSelector).toContain('<optgroup label="In development">');
    expect(subjectSelector).toContain("LIVE_PATHWAY_SUBJECTS.map");
    expect(subjectSelector).toContain("IN_DEVELOPMENT_PATHWAY_SUBJECT_OPTIONS.map");
    expect(subjectSelector).toContain("disabled");
    expect(subjectSelector).toContain("aria-label={option.screenReaderLabel}");
    expect(subjectSelector).toContain("{option.customerLabel}");
  });

  it("keeps active and in-development subject availability content-driven", () => {
    expect(workspaceSource).toContain("getPathwaySubjectAvailabilityOptions");
    expect(workspaceSource).toContain("isCustomerPathwaySubjectActive");
    expect(workspaceSource).toContain("option.selectable");
  });

  it("ignores in-development subject selections without replacing the current context", () => {
    const handleSelectSubject = workspaceSource.slice(
      workspaceSource.indexOf("function handleSelectSubject"),
      workspaceSource.indexOf("function handleSelectSubjectStrand"),
    );

    expect(handleSelectSubject).toContain("!isCustomerPathwaySubjectActive");
    expect(handleSelectSubject.indexOf("return;")).toBeLessThan(
      handleSelectSubject.indexOf("setSelectedSubjectKey(nextSubjectKey)"),
    );
    expect(handleSelectSubject.indexOf("return;")).toBeLessThan(
      handleSelectSubject.indexOf("replacePathwayViewParams(nextSubjectKey, nextStrandKey)"),
    );
    expect(handleSelectSubject.indexOf("return;")).toBeLessThan(
      handleSelectSubject.indexOf('trackPathwayAnalyticsEvent("pathway_subject_selected"'),
    );
  });

  it("does not render empty future-subject Pathways content for unavailable subjects", () => {
    expect(workspaceSource).not.toContain("<PathwaySubjectPlaceholderSection subject={selectedSubject} />");
    expect(workspaceSource).not.toContain("function PathwaySubjectPlaceholderSection");
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
