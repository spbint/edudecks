import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanProgramsWorkspace.tsx"),
  "utf8",
);

describe("CleanProgramsWorkspace 5A.1 customer surface", () => {
  it("keeps the landing view focused on reusable program definitions", () => {
    expect(source).toContain("Create reusable learning programs and organise their lessons.");
    expect(source).toContain("Existing Programs");
    expect(source).toContain("Create Program");
    expect(source).toContain("Open / Edit");
  });

  it("keeps zero-lesson programs useful without inventing progress", () => {
    expect(source).toContain("No lessons yet. Add lesson or Paste lesson list to start this program.");
    expect(source).toContain("Program starts with");
    expect(source).not.toContain("0% complete");
  });

  it("does not expose the retired static planning controls", () => {
    expect(source).not.toContain("Add to Master week");
    expect(source).not.toContain("Plan in My Calendar");
    expect(source).not.toContain("Weeks / segments");
    expect(source).not.toContain("Add segment");
    expect(source).not.toContain("createCleanProgramSegment");
    expect(source).not.toContain("calendar_items");
  });

  it("retains the 5A.1 lesson editing controls", () => {
    ["Add lesson", "Paste lesson list", "Move up", "Move down", "Remove", "reorderCleanProgramLessons"].forEach((value) => {
      expect(source).toContain(value);
    });
  });
});
