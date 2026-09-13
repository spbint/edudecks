import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getRegionalStageLabel } from "@/lib/clean/regionalStageLabels";
import {
  DEFAULT_ENGLISH_STRAND_KEY,
  ENGLISH_DOMAIN_CARDS,
  ENGLISH_STRAND_WORKSPACE_BUILDERS,
} from "@/lib/clean/pathways/englishPathways";
import {
  getPathwayStepById,
  getPathwayStepsByStrand,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import { getEnglishWorksheetResourceForPathwayStep } from "@/lib/clean/resources/englishWorksheetResources";

const PREFIX_RE_PATHWAY_STEP_ID =
  "english::morphology-and-spelling::upper-elementary::u001-prefix-re";
const PREFIX_RE_WORKSHEET_FILE =
  "MYL-LIT-MORPH-UE-U001-Prefix-Re-Worksheet.pdf";
const EXPECTED_PREFIX_RE_PUBLIC_PATH = join(
  process.cwd(),
  "public",
  "resources",
  "worksheets",
  "english",
  "morphology-and-spelling",
  "upper-elementary",
  PREFIX_RE_WORKSHEET_FILE,
);

describe("English Morphology & Spelling pathway foundation", () => {
  it("registers English Morphology & Spelling as the default English pathway", () => {
    expect(DEFAULT_ENGLISH_STRAND_KEY).toBe("morphology-and-spelling");
    expect(ENGLISH_DOMAIN_CARDS[0]).toMatchObject({
      key: "morphology-and-spelling",
      title: "Morphology & Spelling",
      status: "first-detailed",
    });
    expect(ENGLISH_STRAND_WORKSPACE_BUILDERS["morphology-and-spelling"]).toBeTypeOf(
      "function",
    );
  });

  it("registers U001 Prefix re- with the supplied learning goal", () => {
    const workspace = ENGLISH_STRAND_WORKSPACE_BUILDERS["morphology-and-spelling"](
      "upper-elementary",
    );
    const prefixReStage = workspace.stages.find((stage) => stage.key === "upper-elementary");
    const prefixReStep = prefixReStage?.steps[0] || null;
    const registryStep = getPathwayStepById(
      "english",
      "morphology-and-spelling",
      "upper-elementary",
      "u001-prefix-re",
    );

    expect(workspace.title).toBe("Morphology & Spelling");
    expect(getRegionalStageLabel("upper-elementary", "AU", prefixReStage?.title)).toBe(
      "Upper Elementary",
    );
    expect(prefixReStep).toMatchObject({
      stepKey: "u001-prefix-re",
      title: "Prefix re-",
      learningIntention:
        "Today I am learning that the prefix re- usually means again.",
    });
    expect(registryStep).toMatchObject({
      id: PREFIX_RE_PATHWAY_STEP_ID,
      subjectKey: "english",
      strandKey: "morphology-and-spelling",
      stageKey: "upper-elementary",
      stepKey: "u001-prefix-re",
      stepTitle: "Prefix re-",
    });
  });

  it("keeps the Morphology sequence extendable without inventing future units", () => {
    const steps = getPathwayStepsByStrand("english", "morphology-and-spelling");

    expect(steps).toHaveLength(56);
    expect(steps[0]?.id).toBe(PREFIX_RE_PATHWAY_STEP_ID);
  });

  it("registers the available Roots E1 steps after advanced morphology", () => {
    const steps = getPathwayStepsByStrand("english", "morphology-and-spelling");
    const roots = steps.filter((step) => step.stepKey.startsWith("r-u"));

    expect(roots).toHaveLength(16);
    expect(roots.every((step) => step.stageKey === "lower-secondary")).toBe(true);
    expect(roots.map((step) => step.stepKey)).toEqual([
      "r-u001-root-bio",
      "r-u002-root-geo",
      "r-u003-root-graph-gram",
      "r-u004-root-phon",
      "r-u005-root-tele",
      "r-u006-root-chron",
      "r-u007-root-morph",
      "r-u009-root-macro",
      "r-u010-root-photo-phot",
      "r-u011-root-therm",
      "r-u013-root-astro-astr",
      "r-u014-root-metr-meter",
      "r-u016-root-auto",
      "r-u017-root-demo-dem",
      "r-u018-root-psych",
      "r-u019-root-log-logy",
    ]);
  });

  it("resolves the real Prefix re- worksheet through the existing identity", () => {
    expect(existsSync(EXPECTED_PREFIX_RE_PUBLIC_PATH)).toBe(true);
    const resource = getEnglishWorksheetResourceForPathwayStep({
      pathwayStepId: PREFIX_RE_PATHWAY_STEP_ID,
      subjectKey: "english",
      strandKey: "morphology-and-spelling",
      stageKey: "upper-elementary",
      stepKey: "u001-prefix-re",
    });

    expect(resource).toMatchObject({
      fileName: PREFIX_RE_WORKSHEET_FILE,
      subjectKey: "english",
      strandKey: "morphology-and-spelling",
      stageKey: "upper-elementary",
    });
  });
});
