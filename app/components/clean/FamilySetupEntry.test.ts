import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const shellSource = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
const daySource = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");

describe("fresh-account Guided Start entry protection", () => {
  it("holds authenticated pages until family state resolves and redirects incomplete families", () => {
    expect(shellSource).toContain("getFamilySetupRedirectPath");
    expect(shellSource).toContain("shouldHoldForFamilySetup");
    expect(shellSource).toContain("if (familySetupPending && !isFamilyProfileRoute(pathname))");
    expect(shellSource).toContain("router.replace(familySetupRedirect)");
  });

  it("keeps required setup gated while optional My Day guidance stays out of the default view", () => {
    expect(daySource).toContain("const canShowMyDayGuidance");
    expect(daySource).toContain("Boolean(workspace.profile)");
    expect(daySource).toContain("workspace.learners.length > 0");
    expect(daySource).toContain('myDayPresentationState === "SETUP_INCOMPLETE"');
    expect(daySource).toContain('<CleanFirstRunSetupGate currentStep="day" />');
    expect(daySource).not.toContain('config={PAGE_INTRO_VIDEOS.myDay}');
    expect(daySource).not.toContain('tourId="my-day"');
    expect(daySource).not.toContain("GuidanceGettingStartedCard");
  });
});
