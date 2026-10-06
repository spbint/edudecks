import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const componentDirectory = join(
  process.cwd(),
  "app/components/clean/assessment-starting-point/interactive",
);
const stageSource = readFileSync(
  join(componentDirectory, "PhaserAssessmentStage.tsx"),
  "utf8",
);
const playerSource = readFileSync(
  join(componentDirectory, "StartingPointPlayer.tsx"),
  "utf8",
);
const playerStyles = readFileSync(
  join(componentDirectory, "StartingPointPlayer.module.css"),
  "utf8",
);
const showcaseSource = readFileSync(
  join(componentDirectory, "StartingPointPlayerShowcase.tsx"),
  "utf8",
);
const routeSource = readFileSync(
  join(
    process.cwd(),
    "app/(auth)/assessments/maths-starting-point/player-showcase/page.tsx",
  ),
  "utf8",
);

describe("Starting Point player architecture", () => {
  it("keeps Phaser dynamically isolated from unrelated MyLearna routes", () => {
    expect(stageSource).toContain('void import("phaser")');
    expect(playerSource).toContain("dynamic(");
    expect(playerSource).toContain("ssr: false");
  });

  it("keeps placement, routing, progression and persistence decisions out of Phaser", () => {
    for (const forbidden of [
      "numberOperationsPlacement",
      "routeAnchor",
      "progressionLevel",
      "persistenceEnabled",
      "pathwayMutation",
      "supabase",
      "scoreAssessmentItem",
    ]) {
      expect(stageSource, forbidden).not.toContain(forbidden);
    }
  });

  it("keeps the showcase staff-only and noindex", () => {
    expect(routeSource).toContain('<AssessmentAccessGate mode="lab">');
    expect(routeSource).toContain("robots: { index: false, follow: false }");
  });

  it("provides explicit 390px, 430px and desktop review frames", () => {
    expect(showcaseSource).toContain('label: "Phone · 390px", width: 390');
    expect(showcaseSource).toContain(
      'label: "Large phone · 430px", width: 430',
    );
    expect(showcaseSource).toContain('label: "Desktop · 760px", width: 760');
    expect(playerStyles).toContain("@media (max-width: 430px)");
    expect(playerStyles).toContain("min-height: 50px");
  });

  it("does not expose internal placement language in the learner player", () => {
    for (const forbidden of [
      "P-level",
      "progression level",
      "routing proof",
      "evidence ceiling",
      "curriculum code",
    ]) {
      expect(playerSource.toLowerCase(), forbidden).not.toContain(
        forbidden.toLowerCase(),
      );
    }
    expect(playerSource).not.toContain(">Restart<");
  });
});
