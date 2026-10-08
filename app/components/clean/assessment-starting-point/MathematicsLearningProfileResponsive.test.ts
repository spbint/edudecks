import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/assessment-starting-point/MathematicsLearningProfile.module.css",
  ),
  "utf8",
);
const component = readFileSync(
  join(
    process.cwd(),
    "app/components/clean/assessment-starting-point/MathematicsLearningProfile.tsx",
  ),
  "utf8",
);

describe("Mathematics Learning Profile responsive and print contract", () => {
  it.each([390, 430])(
    "uses the single-column phone layout at %ipx without a fixed content width",
    () => {
      expect(css).toContain("@media (max-width: 560px)");
      expect(css).toMatch(/\.metaGrid,\s*\.areaGrid,\s*\.detailBody\s*{\s*grid-template-columns:\s*1fr/);
      expect(css).toContain("width: 100%");
      expect(css).not.toMatch(/min-width:\s*[4-9]\d{2}px/);
    },
  );

  it("uses a two-column tablet layout at 768px", () => {
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toMatch(/\.areaGrid\s*{\s*grid-template-columns:\s*repeat\(2,/);
  });

  it("uses the full five-area grid at 1024px", () => {
    expect(css).toMatch(/\.areaGrid\s*{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(5,/);
  });

  it("provides a dedicated three-section print projection from the same model", () => {
    expect(css).toContain("@media print");
    expect(css).toContain("break-after: page");
    expect(component).toContain("<PrintDocument profile={profile} />");
    expect(component.match(/className={styles\.printPage}/g)).toHaveLength(3);
  });
});
