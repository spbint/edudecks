import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"),
  "utf8",
);

describe("desktop app shell hierarchy", () => {
  it("keeps the existing Plan, Capture and Grow sidebar destinations authoritative", () => {
    expect(source).toContain("finalProductNavSections");
    expect(source).toContain("<MyPlanNavGroup pathname={pathname} />");
    expect(source).toContain('label: "My Pathways"');
    expect(source).toContain('label: "My Learna"');
    expect(source).toContain('label: "My Reports"');
  });

  it("uses a restrained desktop header with one brand and explicit manual Help", () => {
    expect(source).toContain("<MyLearnaBrandMark showBeta={false} />");
    expect(source).toContain("mylearna-v2-desktop-help");
    expect(source).toContain("href=\"/my-community\"");
    expect(source).toContain("@media (min-width: 901px)");
  });

  it("keeps the 900px mobile companion boundary and its four primary destinations", () => {
    expect(source).toContain("@media (max-width: 900px)");
    expect(source).toContain('aria-label="Today"');
    expect(source).toContain('label: "Capture"');
    expect(source).toContain('label: "Portfolio"');
    expect(source).toContain('label="Open More navigation"');
  });
});
