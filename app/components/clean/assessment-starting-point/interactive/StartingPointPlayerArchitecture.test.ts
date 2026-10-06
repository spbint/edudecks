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
const designSystemSource = readFileSync(
  join(componentDirectory, "startingPointPlayerDesignSystem.ts"),
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
      expect(designSystemSource, forbidden).not.toContain(forbidden);
    }
  });

  it("uses Phaser as the normal answer surface without duplicate visible React choices", () => {
    expect(stageSource).toContain("onSubmit: (answer: StartingPointPlayerAnswer) => void");
    expect(stageSource).toContain("selectedOptionIds: getIds()");
    expect(stageSource).toContain("() => [...this.orderedIds]");
    expect(playerSource).not.toContain("className={styles.choices}");
    expect(playerSource).not.toContain("Response recorded");
    expect(playerSource).not.toContain("selectedOptionIds={selectedOptionIds}");
    expect(stageSource).toContain("model.options.length === 0");
    expect(stageSource).toContain("responseValue: numericValue");
  });

  it("keeps keyboard and practical alternatives secondary and explicit", () => {
    expect(playerSource).toContain("<details className={styles.accessibleFallback}>");
    expect(playerSource).toContain("Can’t use this visual? Use a practical observation instead.");
    expect(playerSource).toContain("No electronic result will be inferred.");
  });

  it("keeps the showcase staff-only and noindex", () => {
    expect(routeSource).toContain('<AssessmentAccessGate mode="lab">');
    expect(routeSource).toContain("robots: { index: false, follow: false }");
    expect(routeSource).toContain("MONEY_P1_SEARCH_ITEMS[1]");
    expect(routeSource).toContain("MONEY_P2_ANCHOR_ITEMS[0]");
    expect(routeSource).toContain("MONEY_P2_ANCHOR_ITEMS[1]");
  });

  it("provides explicit 390px, 430px and desktop review frames", () => {
    expect(showcaseSource).toContain('label: "Phone · 390px", width: 390');
    expect(showcaseSource).toContain(
      'label: "Large phone · 430px", width: 430',
    );
    expect(showcaseSource).toContain('label: "Tablet · 768px", width: 768');
    expect(showcaseSource).toContain(
      'label: "Desktop · 1024px", width: 1024',
    );
    expect(playerStyles).toContain("@media (max-width: 430px)");
    expect(playerStyles).toContain("min-height: 52px");
  });

  it("centralises reusable visual and motion primitives", () => {
    for (const primitive of [
      "createChoiceCard",
      "createPrimaryAction",
      "createDropSlot",
      "createCounter",
      "createUnitCube",
      "createTenRod",
      "createHundredFlat",
      "createThousandCube",
      "createCurrencyToken",
    ]) {
      expect(designSystemSource).toContain(`function ${primitive}`);
      expect(stageSource).toContain(`${primitive}(`);
    }
    expect(designSystemSource).toContain("PLAYER_MOTION");
    expect(stageSource).toContain(
      'matchMedia("(prefers-reduced-motion: reduce)")',
    );
    expect(playerStyles).toContain("@media (prefers-reduced-motion: reduce)");
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
