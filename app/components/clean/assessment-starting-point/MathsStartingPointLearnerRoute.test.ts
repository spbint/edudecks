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
      "workspace.learners.find",
    );
    expect(source).toContain(
      "setActiveLearner(routeLearner.id)",
    );
    expect(source).toContain(
      "routeLearnerSyncPending",
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


it("does not mount learner-specific assessment state while route and workspace learner disagree", () => {
  expect(source).toContain(
    'if (routeLearnerSyncPending) {',
  );
  expect(source).toContain(
    'Switching to the selected learner...',
  );
  expect(source).toContain(
    'if (loading || routeLearnerSyncPending) return;',
  );
});


it("provides a learner-preserving return to Mathematics Pathways", () => {
  expect(source).toContain(
    'subjectKey: "mathematics"',
  );
  expect(source).toContain(
    "/my-pathways?",
  );
  expect(source).toContain(
    "learnerId: activeLearner.id",
  );
  expect(source).toContain(
    "Mathematics Pathways",
  );
});
