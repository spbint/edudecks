import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/assessment-starting-point/LearningEvidenceResultsPreview.tsx",
  ),
  "utf8",
);
const page = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/assessments/maths-starting-point/results-preview/page.tsx",
  ),
  "utf8",
);

describe("staff My Results preview", () => {
  it("is protected server-side and excluded from search", () => {
    expect(page).toContain("requireAssessmentLabAccess(RESULTS_PREVIEW_ROUTE)");
    expect(page).toContain("robots: { index: false, follow: false }");
  });

  it("uses synthetic profile projections without enabling a write action", () => {
    expect(component).toContain("getMathematicsLearningProfileFixtures");
    expect(component).toContain("MathematicsLearningProfile");
    expect(component).toContain("no database writes");
    expect(component).not.toMatch(/fetch\(|supabase\.|\.rpc\(/);
  });

  it("shows original, recheck and focused history semantics", () => {
    expect(component).toContain('attempts: [mixed, recheck]');
    expect(component).toContain('attempts: [focused]');
    expect(component).toContain("append-safe");
  });
});
