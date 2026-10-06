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

  it("uses Phaser as the normal answer surface without duplicate visible React choices", () => {
    expect(stageSource).toContain("onSubmit: (answer: StartingPointPlayerAnswer) => void");
    expect(stageSource).toContain("selectedOptionIds: getIds()");
    expect(stageSource).toContain("() => [...this.orderedIds]");
    expect(playerSource).not.toContain("className={styles.choices}");
    expect(playerSource).not.toContain("Response recorded");
    expect(playerSource).not.toContain("selectedOptionIds={selectedOptionIds}");
  });

  it("keeps keyboard and practical alternatives secondary and explicit", () => {
    expect(playerSource).toContain("<details className={styles.accessibleFallback}>");
    expect(playerSource).toContain("Can’t use this visual? Use a practical observation instead.");
    expect(playerSource).toContain("No electronic result will be inferred.");
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

  it("uses an immersive application shell while the learner player is active", () => {
    expect(playerSource).toContain('document.body.classList.add("starting-point-player-active")');
    expect(playerSource).toContain("window.history.back()");
    expect(playerStyles).toContain("body.starting-point-player-active .mylearna-v2-sidebar");
    expect(playerStyles).toContain("body.starting-point-player-active .mylearna-v2-mobile-bottom-nav");
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
