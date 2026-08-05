import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const shell = read("app/components/clean/design-v2/MyLearnaAppShellV2.tsx");
const profile = read("app/components/clean/CleanProfileWorkspace.tsx");
const calendar = read("app/components/clean/CleanCalendarWorkspace.tsx");
const setupStatus = read("lib/clean/setup/setupStatus.ts");
const setupClient = read("lib/clean/setup/setupStateClient.ts");

describe("final Homeschool onboarding polish", () => {
  it("uses resolved real setup state to suppress premature Ready for today", () => {
    expect(shell).not.toContain("Ready for today");
    expect(shell).toContain("GuidedStartFamilySetup");
    expect(read("app/components/clean/coach/MyLearnaCoachProvider.tsx")).toContain("getCoachRecommendation");
    expect(setupStatus).toContain("hasWeeklyBlock");
    expect(setupClient).toContain("listCleanTemplateBlocks");
  });

  it("gates the Profile to Settings handoff on an authorised saved learner", () => {
    expect(profile).toContain("const canContinueToSettings");
    expect(profile).toContain("workspace.learners.length > 0");
    expect(profile).toContain("!submitting");
    expect(profile).toContain("!error");
    expect(profile).toContain("canContinueToSettings ?");
  });

  it("keeps Calendar in year, period, optional break, weekly block order", () => {
    expect(calendar).toContain('const masterWeekStartedEnough = hasMasterWeekBlock;');
    expect(calendar).toContain('"Add your first learning period"');
    expect(calendar).toContain('"Add your first weekly learning block"');
    expect(calendar).toContain("Your first learning plan is ready");
    expect(calendar).toContain('"Add a learning period first"');
    expect(calendar).toContain("disabled={!selectedAcademicYear || !hasRealLearningPeriod}");
    expect(calendar).toContain("Add a break or holiday");
    expect(calendar).not.toContain("Skip for now");
  });

  it("uses native date constraints and realignment before defensive validation", () => {
    expect(calendar).toContain("min={yearStartsOn}");
    expect(calendar).toContain("min={periodStartsOn}");
    expect(calendar).toContain("max={selectedAcademicYear?.endsOn}");
    expect(calendar).toContain("if (nextStart > periodEndsOn) setPeriodEndsOn(nextStart)");
    expect(calendar).toContain("if (nextStart > editingLearningPeriodEndsOn)");
    expect(calendar).toContain("if (periodStartsOn > periodEndsOn)");
  });

  it("keeps learning-year edit, warning, cancel and same-record update paths", () => {
    expect(calendar).toContain("openAcademicYearEditor");
    expect(calendar).toContain("persistAcademicYearUpdate");
    expect(calendar).toContain("pendingAcademicYearUpdate");
    expect(calendar).toContain("Learning year updated.");
    expect(calendar).toContain("Cancel");
    expect(calendar).toContain("deleteCleanAcademicYear");
  });
});
