import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  getPathwayStepsByStrand,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  ENGLISH_WORKSHEET_RESOURCES,
  getEnglishWorksheetResourceForPathwayStep,
} from "@/lib/clean/resources/englishWorksheetResources";

const BATCH_A = [
  ["KF-U001", "kf-u001-beginning-sounds", "Beginning Sounds", "MYL-LIT-MORPH-KF-U001-Beginning-Sounds-Worksheet.pdf"],
  ["KF-U002", "kf-u002-ending-sounds", "Ending Sounds", "MYL-LIT-MORPH-KF-U002-Ending-Sounds-Worksheet.pdf"],
  ["KF-U003", "kf-u003-segment-and-blend", "Segment and Blend", "MYL-LIT-MORPH-KF-U003-Segment-and-Blend-Worksheet.pdf"],
  ["KF-U004", "kf-u004-consonant-sounds", "Consonant Sounds", "MYL-LIT-MORPH-KF-U004-Consonant-Sounds-Worksheet.pdf"],
  ["KF-U005", "kf-u005-short-vowel-a", "Short Vowel A", null],
  ["KF-U006", "kf-u006-short-vowel-i", "Short Vowel I", null],
  ["KF-U011", "kf-u011-cvc-word-match", "CVC Word Match", "MYL-LIT-MORPH-KF-U011-CVC-Word-Match-Worksheet.pdf"],
] as const;

function publicPath(resource: { href: string }) {
  return path.join(process.cwd(), "public", resource.href.replace(/^\//, ""));
}

describe("English Word Builders Batch A", () => {
  it("registers the approved explicit foundation identities without duplicates", () => {
    const steps = getPathwayStepsByStrand("english", "spelling-and-word-study");
    const batchSteps = steps.filter((step) => step.stepKey.startsWith("kf-u"));

    expect(batchSteps).toHaveLength(BATCH_A.length);
    expect(new Set(batchSteps.map((step) => step.id)).size).toBe(batchSteps.length);

    BATCH_A.forEach(([, stepKey, title]) => {
      expect(batchSteps).toContainEqual(expect.objectContaining({
        stepKey,
        stepTitle: title,
        id: `english::spelling-and-word-study::foundation-kindergarten::${stepKey}`,
        stageKey: "foundation-kindergarten",
      }));
    });
  });

  it("maps only deployed PDFs to their exact registry identities and public files", () => {
    expect(ENGLISH_WORKSHEET_RESOURCES).toHaveLength(5);

    BATCH_A.forEach(([, stepKey, , expectedFileName]) => {
      const resource = getEnglishWorksheetResourceForPathwayStep({
        pathwayStepId: `english::spelling-and-word-study::foundation-kindergarten::${stepKey}`,
        stepKey,
        subjectKey: "english",
        strandKey: "spelling-and-word-study",
        stageKey: "foundation-kindergarten",
      });

      if (!expectedFileName) {
        expect(resource).toBeNull();
        return;
      }

      expect(resource).toMatchObject({ fileName: expectedFileName, subjectKey: "english" });
      expect(existsSync(publicPath(resource!))).toBe(true);
      expect(resource?.href).toContain(`/resources/worksheets/english/spelling-and-word-study/foundation-kindergarten/${expectedFileName}`);
    });
  });

  it("does not contain malformed or duplicate worksheet filenames", () => {
    const filenames = ENGLISH_WORKSHEET_RESOURCES.map((resource) => resource.fileName);
    expect(new Set(filenames).size).toBe(filenames.length);
    expect(filenames.every((filename) => /^MYL-LIT-MORPH-KF-U\d{3}-[A-Za-z0-9-]+\.pdf$/.test(filename))).toBe(true);
    expect(filenames.some((filename) => /\.pdf\.pdf|\([123]\)/i.test(filename))).toBe(false);
  });
});
