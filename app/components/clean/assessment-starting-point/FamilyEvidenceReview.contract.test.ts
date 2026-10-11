import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const component = readFileSync(
  join(process.cwd(), "app/components/clean/assessment-starting-point/FamilyEvidenceReview.tsx"),
  "utf8",
);
const css = readFileSync(
  join(process.cwd(), "app/components/clean/assessment-starting-point/FamilyEvidenceReview.module.css"),
  "utf8",
);
const page = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/assessments/maths-starting-point/family-evidence-review/page.tsx",
  ),
  "utf8",
);

describe("family evidence review route and responsive contract", () => {
  it("is protected server-side, non-indexed and absent from customer navigation", () => {
    expect(page).toContain("requireAssessmentLabAccess(FAMILY_EVIDENCE_REVIEW_ROUTE)");
    expect(page).toContain("robots: { index: false, follow: false }");
    expect(page).toContain('<AssessmentAccessGate mode="lab">');
    expect(page).not.toMatch(/supabase|insert\(|update\(|rpc\(/i);
  });

  it.each([390, 430])("uses a single-column layout at %ipx", () => {
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toMatch(/\.fixturePanel,\s*\.areaGrid,\s*\.detailGrid,\s*\.facts\s*{\s*grid-template-columns:\s*minmax\(0, 1fr\)/);
    expect(css).not.toMatch(/min-width:\s*[4-9]\d{2}px/);
  });

  it("uses a two-column tablet layout and five-column desktop overview", () => {
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toMatch(/\.areaGrid\s*{\s*grid-template-columns:\s*repeat\(2,/);
    expect(css).toMatch(/\.areaGrid\s*{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(5,/);
  });

  it("uses semantic, keyboard-operable native controls and text source labels", () => {
    expect(component).toContain("<ol");
    expect(component).toContain("<time");
    expect(component).toContain('type="button"');
    expect(component).toContain("aria-pressed");
    expect(css).toContain(":focus-visible");
  });
});
