import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/assessment-starting-point/MathsStartingPointWorkspace.tsx",
  ),
  "utf8",
);

describe("Maths starting-point learner route context", () => {
  it("accepts learnerId only through the canonical family learner list", () => {
    expect(source).toContain('searchParams.get("learnerId")');
    expect(source).toContain(
      "workspace.learners.find",
    );
    expect(source).toContain(
      "if (match) setActiveLearner(match.id)",
    );
  });

  it("updates learnerId in the URL when the user changes learner", () => {
    expect(source).toContain('params.set("learnerId", nextLearnerId)');
    expect(source).toContain(
      'router.replace(',
    );
    expect(source).toContain(
      '/assessments/maths-starting-point?',
    );
  });
});
