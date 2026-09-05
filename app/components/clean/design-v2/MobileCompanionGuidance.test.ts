import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("mobile companion guidance boundaries", () => {
  it("uses the shell's established 900px breakpoint for optional companion guidance", () => {
    const companionSource = readSource("app/components/clean/design-v2/useMobileCompanion.ts");
    expect(companionSource).toContain('"(max-width: 900px)"');
    expect(companionSource).toContain("useSyncExternalStore");
  });

  it("suppresses optional Core Journey and page-guide surfaces on mobile only", () => {
    const coreJourneySource = readSource("app/components/clean/design-v2/CoreJourneyCue.tsx");
    const pageIntroSource = readSource("app/components/clean/CleanPageIntroVideo.tsx");
    const guidanceActionSource = readSource("app/components/clean/guidance/GuidanceToggle.tsx");

    expect(coreJourneySource).toContain("useMobileCompanion");
    expect(coreJourneySource).toContain("if (mobileCompanion) return null;");
    expect(coreJourneySource.match(/if \(mobileCompanion\) return null;/g)).toHaveLength(2);
    expect(pageIntroSource).toContain("if (mobileCompanion || !availableConfigs.length) return null;");
    expect(guidanceActionSource).toContain("if (mobileCompanion || !hydrated");
  });

  it("keeps MyLearna Coach available manually while suppressing its automatic card on mobile", () => {
    const coachSource = readSource("app/components/clean/coach/MyLearnaCoachProvider.tsx");
    expect(coachSource).toContain("const mobileCompanion = useMobileCompanion();");
    expect(coachSource).toContain("automaticRecommendation &&\n      !mobileCompanion");
    expect(coachSource).toContain("{panelOpen ? <MyLearnaCoachPanel /> : null}");
  });
});
