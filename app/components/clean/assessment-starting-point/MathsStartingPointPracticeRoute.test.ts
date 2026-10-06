import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/practice/maths-starting-point/page.tsx",
  ),
  "utf8",
);

const viewerSource = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/CleanNumberTargetedPracticeViewer.tsx",
  ),
  "utf8",
);

describe("Maths starting-point practice route contract", () => {
  it("stays staff-gated during preview without using the legacy gate", () => {
    expect(routeSource).toContain('AssessmentAccessGate mode="lab"');
    expect(routeSource).toContain(
      'experience="maths-starting-point"',
    );
    expect(routeSource).not.toContain('mode="legacy"');
    expect(routeSource).toContain('background: "#F7F8FC"');
    expect(routeSource).toContain('padding: "clamp(18px, 4vw, 42px)"');
  });

  it("keeps starting-point section navigation on its dedicated practice route", () => {
    expect(viewerSource).toContain(
      '"/practice/maths-starting-point"',
    );
    expect(viewerSource).toContain(
      'Return to Number &amp; Operations Starting Point',
    );
    expect(viewerSource).toContain(
      '!isMathsStartingPoint && exactStepAssessmentHref',
    );
  });
});


it("uses parent-readable starting-point provenance instead of raw sub-element keys", () => {
  expect(viewerSource).toContain(
    "Recommended from your Number &amp; Operations Starting Point",
  );
  expect(viewerSource).toContain(
    '"additive-strategies": "Additive strategies"',
  );
  expect(viewerSource).toContain(
    "startingPointSubElementLabel(sourceSubElement)",
  );
});


it("tracks only safe starting-point practice lifecycle metadata", () => {
  expect(viewerSource).toContain(
    '"maths_starting_point_practice_opened"',
  );
  expect(viewerSource).toContain(
    '"maths_starting_point_practice_completed"',
  );
  expect(viewerSource).toContain(
    'source: "maths-starting-point"',
  );
  expect(viewerSource).not.toContain(
    'trackCoreJourneyEvent("maths_starting_point_practice_completed", { answer',
  );
});


it("does not send learner performance or focus-area outcomes to product analytics", () => {
  expect(viewerSource).not.toContain(
    'correctCount: summary.correctCount',
  );
  expect(viewerSource).not.toContain(
    'area: sourceSubElement || "maths_starting_point"',
  );
});
