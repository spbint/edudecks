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
      'Return to Maths starting point',
    );
    expect(viewerSource).toContain(
      '!isMathsStartingPoint && exactStepAssessmentHref',
    );
  });
});


it("uses parent-readable starting-point provenance instead of raw sub-element keys", () => {
  expect(viewerSource).toContain(
    "Recommended from your Maths starting-point check",
  );
  expect(viewerSource).toContain(
    '"additive-strategies": "Additive strategies"',
  );
  expect(viewerSource).toContain(
    "startingPointSubElementLabel(sourceSubElement)",
  );
});
