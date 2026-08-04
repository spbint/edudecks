import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const missionSource = readFileSync(join(process.cwd(), "app/components/clean/guidance/GuidedStartFamilySetup.tsx"), "utf8");
const missionDefinitionSource = readFileSync(join(process.cwd(), "app/components/clean/guidance/guidedMissions.ts"), "utf8");
const providerSource = readFileSync(join(process.cwd(), "app/components/clean/guidance/GuidanceProvider.tsx"), "utf8");
const settingsSource = readFileSync(join(process.cwd(), "app/components/clean/guidance/GuidanceToggle.tsx"), "utf8");
const shellSource = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
const profileSource = readFileSync(join(process.cwd(), "app/components/clean/CleanProfileWorkspace.tsx"), "utf8");
const layoutSource = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
const analyticsSource = readFileSync(join(process.cwd(), "lib/clean/analytics/productAnalytics.ts"), "utf8");

describe("Guided Start family setup integration", () => {
  it("uses one mission with real-state steps and no Driver.js destruction completion", () => {
    expect(missionDefinitionSource).toContain('"guided-start-family-setup"');
    expect(missionDefinitionSource).toContain('"not_started" | "active" | "paused" | "completed"');
    expect(missionSource).toContain("workspace.profile");
    expect(missionSource).toContain("workspace.learners.length");
    expect(missionSource).toContain("workspace.setupLoading");
    expect(missionSource).toContain('guidance.setSetupStatus("completed")');
    expect(missionSource).not.toContain("markTourCompleted");
    expect(missionSource).not.toContain("onDestroyed");
  });

  it("keeps the welcome and action-driven copy", () => {
    expect(missionSource).toContain("Let’s set up MyLearna together");
    expect(missionSource).toContain("I’ll guide you one step at a time. You can pause whenever you need.");
    expect(missionSource).toContain("Start guided setup");
    expect(missionSource).toContain("Not now");
    expect(missionSource).toContain("Complete the highlighted step to continue.");
    expect(missionSource).toContain("Family setup complete");
    expect(missionSource).toContain("Continue with My Settings");
    expect(missionSource).toContain('aria-live="polite"');
  });

  it("uses the existing profile targets and observes real profile/learner mutations", () => {
    expect(missionDefinitionSource).toContain('"profile-family-details"');
    expect(missionDefinitionSource).toContain('"profile-add-learner"');
    expect(missionDefinitionSource).toContain('"profile-next-settings"');
    expect(profileSource).toContain('data-guidance-id="profile-family-details"');
    expect(profileSource).toContain('data-guidance-id="profile-add-learner"');
    expect(profileSource).toContain('data-guidance-id="profile-next-settings"');
    expect(profileSource).toContain("createCleanFamilyProfile");
    expect(profileSource).toContain("createCleanLearner");
    expect(profileSource).toContain("workspace.reload");
    expect(missionSource).toContain("scrollIntoView");
  });

  it("supports pause, Escape, restart, reconciliation and safe analytics", () => {
    expect(missionSource).toContain('status: "paused"');
    expect(missionSource).toContain('event.key === "Escape"');
    expect(providerSource).toContain("mylearna:guided-start-restart");
    expect(settingsSource).toContain("Restart family setup guide");
    expect(missionSource).toContain("guided_start_step_completed");
    expect(missionSource).toContain("guided_start_resumed");
    expect(missionSource).toContain("presentation");
    expect(missionSource).not.toContain("learnerId:");
    expect(missionSource).not.toContain("familyId:");
    expect(missionSource).not.toContain("userId:");
    expect(analyticsSource).toContain('"mission"');
    expect(analyticsSource).toContain('"step"');
    expect(analyticsSource).toContain('"presentation"');
  });

  it("renders the mission only in the standard shell and preserves static tours", () => {
    expect(shellSource).toContain("GuidedStartFamilySetup");
    expect(layoutSource).toContain("GuidancePendingTourLauncher");
    expect(layoutSource).not.toContain("<GuidanceWelcomePrompt />");
    expect(providerSource).toContain("markTourCompleted");
  });

  it("keeps the mobile sheet above the shared navigation and accessible", () => {
    expect(missionSource).toContain("--mylearna-mobile-bottom-nav-height");
    expect(missionSource).toContain("env(safe-area-inset-bottom");
    expect(missionSource).toContain("minHeight: 48");
    expect(missionSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(shellSource).toContain("--mylearna-mobile-bottom-nav-height: 62px");
  });
});
