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
  });

  it("closes automatic guidance without disabling manual Coach help", () => {
    expect(provider).toContain('panelSupportMode !== "automatic"');
    expect(provider).toContain('setPanelOpen(false)');
    expect(provider).toContain('supportMode: "help"');
    expect(provider).toContain("!panelOpen");
    expect(provider).toContain("GUIDANCE_SURFACE_EVENT");
    expect(readFileSync(join(root, "app/components/clean/guidance/useDriverTour.ts"), "utf8")).toContain("setActiveDriver(null)");
  });
});
