import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const shell = readFileSync(join(root, "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
const authLayout = readFileSync(join(root, "app/(auth)/layout.tsx"), "utf8");
const cleanLayout = readFileSync(join(root, "app/(clean)/layout.tsx"), "utf8");
const analytics = readFileSync(join(root, "lib/clean/analytics/productAnalytics.ts"), "utf8");
const provider = readFileSync(join(root, "app/components/clean/coach/MyLearnaCoachProvider.tsx"), "utf8");
const card = readFileSync(join(root, "app/components/clean/coach/MyLearnaCoachCard.tsx"), "utf8");
const refresh = readFileSync(join(root, "lib/clean/coach/coachRefresh.ts"), "utf8");
const profile = readFileSync(join(root, "app/components/clean/CleanProfileWorkspace.tsx"), "utf8");
const calendar = readFileSync(join(root, "app/components/clean/CleanCalendarWorkspace.tsx"), "utf8");
const settings = readFileSync(join(root, "app/components/clean/CleanSettingsWorkspace.tsx"), "utf8");
const evidence = readFileSync(join(root, "lib/clean/evidence/client.ts"), "utf8");
const reports = readFileSync(join(root, "lib/clean/reports/client.ts"), "utf8");
const setupStateClient = readFileSync(join(root, "lib/clean/setup/setupStateClient.ts"), "utf8");
const calendarClient = readFileSync(join(root, "lib/clean/calendar/client.ts"), "utf8");
const weeklyPlanner = readFileSync(join(root, "lib/clean/outputs/weeklyPlanner.ts"), "utf8");
const engine = readFileSync(join(root, "lib/clean/coach/coachEngine.ts"), "utf8");

describe("MyLearna Coach integration", () => {
  it("wraps both authenticated shells and replaces Ready for today", () => {
    expect(authLayout).toContain("<MyLearnaCoachProvider>");
    expect(cleanLayout).toContain("<MyLearnaCoachProvider>");
    expect(shell).not.toContain("Ready for today");
    expect(provider).toContain("getCoachRecommendation");
  });

  it("keeps one compact recommendation action with a non-competing panel", () => {
    expect(card).toContain("MyLearna Coach");
    expect(card).toContain("Why this?");
    expect(provider).toContain("COACH_OPEN_EVENT");
    expect(provider).toContain("guidedStartActive");
    expect(card).toContain('aria-label="Dismiss MyLearna Coach"');
    expect(card).toContain("min-width: 44px");
    expect(provider).toContain("dismissedRecommendationId");
  });

  it("recognises canonical live-week records without changing PDF output", () => {
    expect(setupStateClient).toContain("listCleanCalendarItems(profile.id");
    expect(setupStateClient).toContain("countValidCleanWeeklyBlocks");
    expect(calendarClient).toContain('requestCoachStateRefresh("weekly-block-created")');
    expect(calendarClient).toContain('requestCoachStateRefresh("weekly-block-updated")');
    expect(calendarClient).toContain('requestCoachStateRefresh("weekly-block-deleted")');
    expect(weeklyPlanner).toContain("CleanCalendarItem");
    expect(weeklyPlanner).not.toContain("MyLearnaCoach");
  });

  it("keeps post-setup sequencing state-driven and route-independent", () => {
    expect(engine).not.toContain('id: "activation-review-my-day"');
    expect(engine).toContain('id: "activation-choose-pathway"');
    expect(engine).toContain('id: "activation-capture-learning"');
    expect(engine).toContain('id: "activation-review-portfolio"');
    expect(engine).toContain('state.reportReadiness === "ready"');
    expect(provider).not.toContain("todayHasPlannedLearning");
  });

  it("keeps dismissal separate from snooze and manual help", () => {
    expect(provider).toContain("isCoachRecommendationDismissed");
    expect(provider).toContain("setPanelOpen(false)");
    expect(provider).toContain('supportMode: "help"');
    expect(provider).toContain("dismissRecommendation");
    expect(card).toContain('aria-label="Dismiss MyLearna Coach"');
    expect(card).toContain("Not now");
  });

  it("allows only safe Coach analytics properties", () => {
    expect(analytics).toContain("recommendationId");
    expect(analytics).toContain("hasMultipleLearners");
    expect(analytics).not.toContain('"learnerId"');
  });

  it("uses one governed refresh contract and wires successful domain mutations", () => {
    expect(refresh).toContain("subscribeToCoachStateRefresh");
    expect(refresh).not.toContain("setInterval");
    expect(provider).toContain("route-revalidation");
    expect(provider).toContain("workspace.reload");
    expect(profile).toContain('requestCoachStateRefresh("learner-created"');
    expect(settings).toContain('requestCoachStateRefresh("settings-saved"');
    expect(calendar).toContain('requestCoachStateRefresh("learning-year-created"');
    expect(calendar).toContain('"weekly-block-created"');
    expect(evidence).toContain('requestCoachStateRefresh(detail.source ?? "evidence-updated")');
    expect(reports).toContain('requestCoachStateRefresh("report-created")');
    expect(reports).toContain('requestCoachStateRefresh("report-updated")');
    expect(reports).toContain('requestCoachStateRefresh("report-deleted")');
  });

  it("closes automatic guidance without disabling manual Coach help", () => {
    expect(provider).toContain("const AUTOMATIC_COACH_ENABLED = false;");
    expect(provider).toContain('panelSupportMode !== "automatic"');
    expect(provider).toContain('setPanelOpen(false)');
    expect(provider).toContain('supportMode: "help"');
    expect(provider).toContain("!panelOpen");
    expect(provider).toContain("GUIDANCE_SURFACE_EVENT");
    expect(readFileSync(join(root, "app/components/clean/guidance/useDriverTour.ts"), "utf8")).toContain("setActiveDriver(null)");
  });
});
