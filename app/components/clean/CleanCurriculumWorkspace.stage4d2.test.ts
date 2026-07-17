import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCurriculumWorkspace.tsx"),
  "utf8",
);

describe("CleanCurriculumWorkspace Stage 4D.2 copy", () => {
  it("replaces the unclear support-area evidence metric with parent-facing evidence labels", () => {
    expect(source).not.toContain("support areas with evidence");
    expect(source).toContain("learning areas");
    expect(source).toContain("with evidence");
    expect(source).toContain("learning records");
    expect(source).toContain("progress judgements");
  });
});
