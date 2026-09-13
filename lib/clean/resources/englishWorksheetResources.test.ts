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

    expect(batchSteps).toHaveLength(20);
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
    expect(ENGLISH_WORKSHEET_RESOURCES).toHaveLength(18);

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

  it("resolves the locally available continuation units without creating U005 or U006 mappings", () => {
    const continuation = [
      ["kf-u007-short-vowel-o", "MYL-LIT-MORPH-KF-U007-Short-Vowel-O-Worksheet.pdf"],
      ["kf-u008-short-vowel-u", "MYL-LIT-MORPH-KF-U008-Short-Vowel-U-Worksheet.pdf"],
      ["kf-u009-short-vowel-e", "MYL-LIT-MORPH-KF-U009-Short-Vowel-E-Worksheet.pdf"],
      ["kf-u010-cvc-word-practice", "MYL-LIT-MORPH-KF-U010-CVC-Word-Practice-Worksheet.pdf"],
      ["kf-u012-cvc-word-write", "MYL-LIT-MORPH-KF-U012-CVC-Word-Write-Worksheet.pdf"],
      ["kf-u013-cvc-word-read-and-colour", "MYL-LIT-MORPH-KF-U013-CVC-Word-Read-and-Colour-Worksheet.pdf"],
      ["kf-u014-cvc-word-sentences", "MYL-LIT-MORPH-KF-U014-CVC-Word-Sentences-Worksheet.pdf"],
      ["kf-u015-cvc-word-spot-and-write", "MYL-LIT-MORPH-KF-U015-CVC-Word-Spot-and-Write-Worksheet.pdf"],
      ["kf-u016-cvc-word-practice", "MYL-LIT-MORPH-KF-U016-CVC-Word-Practice-Worksheet.pdf"],
      ["kf-u017-cvc-word-sounds", "MYL-LIT-MORPH-KF-U017-CVC-Word-Sounds-Worksheet.pdf"],
      ["kf-u018-cvc-word-match-and-sort", "MYL-LIT-MORPH-KF-U018-CVC-Word-Match-and-Sort-Worksheet.pdf"],
      ["kf-u019-cvc-word-build-and-write", "MYL-LIT-MORPH-KF-U019-CVC-Word-Build-and-Write-Worksheet.pdf"],
      ["kf-u020-cvc-word-read-and-find", "MYL-LIT-MORPH-KF-U020-CVC-Word-Read-and-Find-Worksheet.pdf"],
    ] as const;

    continuation.forEach(([stepKey, fileName]) => {
      const resource = getEnglishWorksheetResourceForPathwayStep({
        pathwayStepId: `english::spelling-and-word-study::foundation-kindergarten::${stepKey}`,
        stepKey,
        subjectKey: "english",
        strandKey: "spelling-and-word-study",
        stageKey: "foundation-kindergarten",
      });
      expect(resource?.fileName).toBe(fileName);
      expect(existsSync(publicPath(resource!))).toBe(true);
    });
  });

  it("does not contain malformed or duplicate worksheet filenames", () => {
    const filenames = ENGLISH_WORKSHEET_RESOURCES.map((resource) => resource.fileName);
    expect(new Set(filenames).size).toBe(filenames.length);
    expect(filenames.every((filename) => /^MYL-LIT-MORPH-KF-U\d{3}-[A-Za-z0-9-]+\.pdf$/.test(filename))).toBe(true);
    expect(filenames.some((filename) => /\.pdf\.pdf|\([123]\)/i.test(filename))).toBe(false);
  });
});
