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
import { getWorksheetResourceForPathwayStep } from "@/lib/clean/resources/mathWorksheetResources";

const PREFIX_RE_PATHWAY_STEP_ID =
  "english::morphology-and-spelling::middle-primary::u001-prefix-re";
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
      "middle-primary",
    );
    const prefixReStage = workspace.stages.find((stage) => stage.key === "middle-primary");
    const prefixReStep = prefixReStage?.steps[0] || null;
    const registryStep = getPathwayStepById(
      "english",
      "morphology-and-spelling",
      "middle-primary",
      "u001-prefix-re",
    );

    expect(workspace.title).toBe("Morphology & Spelling");
    expect(getRegionalStageLabel("middle-primary", "US", prefixReStage?.title)).toBe(
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
      stageKey: "middle-primary",
      stepKey: "u001-prefix-re",
      stepTitle: "Prefix re-",
    });
  });

  it("keeps the Morphology sequence extendable without inventing future units", () => {
    const steps = getPathwayStepsByStrand("english", "morphology-and-spelling");

    expect(steps).toHaveLength(1);
    expect(steps[0]?.id).toBe(PREFIX_RE_PATHWAY_STEP_ID);
  });

  it("does not expose a fake Prefix re- worksheet when the real PDF is absent", () => {
    const assetExists = existsSync(EXPECTED_PREFIX_RE_PUBLIC_PATH);
    const resource = getWorksheetResourceForPathwayStep({
      pathwayStepId: PREFIX_RE_PATHWAY_STEP_ID,
      subjectKey: "english",
      strandKey: "morphology-and-spelling",
      stageKey: "middle-primary",
      stepKey: "u001-prefix-re",
    });

    if (assetExists) {
      expect(resource).toMatchObject({
        fileName: PREFIX_RE_WORKSHEET_FILE,
        subjectKey: "english",
        strandKey: "morphology-and-spelling",
        stageKey: "middle-primary",
      });
    } else {
      expect(resource).toBeNull();
    }
  });
});
