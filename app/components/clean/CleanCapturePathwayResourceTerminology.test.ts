import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"),
  "utf8",
);

describe("Capture pathway resource terminology", () => {
  it("reads the pathway resource type while preserving worksheet compatibility", () => {
    expect(source).toContain('searchParams.get("pathwayResourceType")');
    expect(source).toContain('searchParams.get("pathwayResourceTitle")');
    expect(source).toContain('searchParams.get("pathwayResourceHref")');
    expect(source).toContain('(worksheetEvidenceMode ? "worksheet-pdf" : null)');
    expect(source).toContain("normalizePathwayResourceType");
    expect(source).toContain("pathwayResourceLabel");
  });

  it("uses the resource name in Capture instead of hard-coding worksheet copy", () => {
    expect(source).toContain("Completed \${pathwayResourceNoun} evidence");
    expect(source).toContain("{pathwayResourceName}</strong>");
    expect(source).toContain("Open {pathwayResourceNoun}");
    expect(source).toContain("pathwayResourceTitleFromQuery");
    expect(source).toContain("pathwayResourceHrefFromQuery");
  });
});
