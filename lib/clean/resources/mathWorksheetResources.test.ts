import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { MATH_WORKSHEET_RESOURCES } from "@/lib/clean/resources/mathWorksheetResources";

const WORKSHEET_FILENAME_PATTERN =
  /^MYL-MATH-[A-Z]+-[A-Z0-9]+-S\d{3}-[A-Za-z0-9-]+\.pdf$/;

function publicPathFromHref(href: string) {
  const normalizedHref = href.split(/[?#]/)[0] ?? "";
  return path.join(process.cwd(), "public", normalizedHref.replace(/^\/+/, ""));
}

describe("math worksheet resource references", () => {
  it("point to existing public PDF files with stable worksheet filenames", () => {
    const missingFiles: string[] = [];
    const invalidFilenames: string[] = [];
    const doublePdfFilenames: string[] = [];
    const filenameCounts = new Map<string, number>();

    MATH_WORKSHEET_RESOURCES.forEach((resource) => {
      filenameCounts.set(resource.fileName, (filenameCounts.get(resource.fileName) ?? 0) + 1);

      if (!WORKSHEET_FILENAME_PATTERN.test(resource.fileName)) {
        invalidFilenames.push(resource.fileName);
      }

      if (/\.pdf\.pdf$/i.test(resource.fileName) || /\.pdf\.pdf$/i.test(resource.href)) {
        doublePdfFilenames.push(`${resource.fileName} -> ${resource.href}`);
      }

      if (!existsSync(publicPathFromHref(resource.href))) {
        missingFiles.push(`${resource.fileName} -> ${resource.href}`);
      }
    });

    const duplicateFilenames = [...filenameCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([filename, count]) => `${filename} (${count})`);

    if (duplicateFilenames.length) {
      console.warn(
        [
          "Duplicate worksheet filenames are currently warnings only:",
          ...duplicateFilenames,
        ].join("\n"),
      );
    }

    expect(invalidFilenames).toEqual([]);
    expect(doublePdfFilenames).toEqual([]);
    expect(missingFiles).toEqual([]);
  });
});
