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

  it("keeps synthetic fixtures while accepting server-loaded staging history", () => {
    expect(component).toContain("getMathematicsLearningProfileFixtures");
    expect(component).toContain("MathematicsLearningProfile");
    expect(component).toContain("real intelligence-staging history");
    expect(page).toContain("loadStaffLearningEvidenceHistory");
    expect(component).not.toMatch(/fetch\(|supabase\.|\.rpc\(/);
  });

  it("shows original, recheck and focused history semantics", () => {
    expect(component).toContain("fixtureAttempt(");
    expect(component).toContain("Synthetic deterministic recheck fixture");
    expect(component).toContain("Synthetic focused-attempt fixture");
    expect(component).toContain("persistedHistory.attempts.map");
    expect(component).toContain("append-safe");
  });

  it("exposes the Capture evidence bridge only inside the protected staff preview", () => {
    expect(component).toContain("CaptureLearningEvidencePreview");
    expect(component).toContain('"Capture evidence"');
    expect(page).toContain("requireAssessmentLabAccess(RESULTS_PREVIEW_ROUTE)");
  });
});
