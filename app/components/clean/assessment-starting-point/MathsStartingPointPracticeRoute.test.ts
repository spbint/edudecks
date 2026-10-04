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
