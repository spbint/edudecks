import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const itemSources = [
  "lib/clean/assessments/placement/numberOperationsP0Items.ts",
  "lib/clean/assessments/placement/numberOperationsNpvConfirmationItems.ts",
  "lib/clean/assessments/placement/numberOperationsFreshRecheckItems.ts",
].map((path) => readFileSync(join(process.cwd(), path), "utf8"));

describe("Maths starting-point item provenance", () => {
  it("uses clean production-candidate provenance rather than assessment-lab tags", () => {
    for (const source of itemSources) {
      expect(source).not.toContain('"assessment-lab"');
      expect(source).toContain('"maths-starting-point"');
    }
  });
});
