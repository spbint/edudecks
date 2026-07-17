import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { finalProductNavSections } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import { buildMyLearnaRedirectPath } from "@/app/(auth)/my-learna/page";

const shellSource = readFileSync(
  join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"),
  "utf8",
);

const reportsSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanReportsWorkspace.tsx"),
  "utf8",
);

const captureSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCaptureWorkspace.tsx"),
  "utf8",
);

const dataSource = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCurriculumWorkspace.tsx"),
  "utf8",
);

describe("Stage 7 final web integration", () => {
  it("locks the final Plan Capture Grow navigation groups", () => {
    expect(finalProductNavSections.map((section) => section.label)).toEqual([
      "PLAN",
      "CAPTURE",
      "GROW",
    ]);
    expect(finalProductNavSections.map((section) => section.items.map((item) => item.label))).toEqual([
      ["My Calendar", "My Pathways"],
      ["My Capture", "My Portfolio"],
      ["My Data", "My Reports"],
    ]);
    expect(shellSource).toContain("dayNavItem");
    expect(shellSource).toContain("settingsNavItem");
  });

  it("keeps retired destinations out of the primary navigation", () => {
    const primaryLabels = [
      "My Day",
      ...finalProductNavSections.flatMap((section) => section.items.map((item) => item.label)),
      "My Settings",
    ];
    expect(primaryLabels).toEqual([
      "My Day",
      "My Calendar",
      "My Pathways",
      "My Capture",
      "My Portfolio",
      "My Data",
      "My Reports",
      "My Settings",
    ]);
    expect(primaryLabels).not.toContain("My Review");
    expect(primaryLabels).not.toContain("My Learna");
    expect(primaryLabels).not.toContain("Output History");
  });

  it("redirects legacy My Learna links to My Data while preserving query context", () => {
    expect(
      buildMyLearnaRedirectPath({
        learner: "learner-1",
        view: "progress",
      }),
    ).toBe("/my-data?learner=learner-1&view=progress");
  });

  it("keeps Output History inside My Reports rather than top-level navigation", () => {
    expect(reportsSource).toContain("Output history");
    expect(shellSource).not.toContain("href: \"/my-outputs\"");
    expect(shellSource).not.toContain("label: \"Output History\"");
  });

  it("preserves Stage 5 unified capture controls", () => {
    expect(captureSource).toContain("Record learning");
    expect(captureSource).toContain("CANONICAL_LEARNING_AREAS");
    expect(captureSource).toContain("Secure");
    expect(captureSource).toContain("Parent note");
    expect(captureSource).toContain("Learner reflection");
    expect(captureSource).toContain("Add to Portfolio");
    expect(captureSource).toContain("Include in Reports");
    expect(captureSource).toContain("disabled={submitting");
  });

  it("preserves Stage 4D My Data progress judgement consistency copy", () => {
    expect(dataSource).toContain("Progress observations");
    expect(dataSource).toContain("progress");
    expect(dataSource).toContain("judgements");
    expect(dataSource).toContain("saved");
    expect(dataSource).not.toContain("support areas with evidence");
  });

  it("keeps technical product terms out of active shell labels", () => {
    expect(shellSource).not.toContain("Next signal");
    expect(shellSource).not.toContain("Coming soon");
    expect(finalProductNavSections.flatMap((section) => section.items.map((item) => item.label))).not.toContain("v1");
  });
});
