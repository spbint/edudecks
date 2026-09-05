import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"),
  "utf8",
);

describe("Desktop Calendar task-first presentation", () => {
  it("places Current Calendar before setup and planning administration", () => {
    const taskHeaderIndex = source.indexOf('data-testid="desktop-calendar-task-first"');
    const currentCalendarIndex = source.indexOf("mylearna-calendar-operational-board");
    const planningToolsIndex = source.indexOf("mylearna-calendar-structural-setup");
    const masterWeekIndex = source.indexOf("mylearna-calendar-usual-week-setup");

    expect(taskHeaderIndex).toBeGreaterThan(-1);
    expect(currentCalendarIndex).toBeGreaterThan(taskHeaderIndex);
    expect(planningToolsIndex).toBeGreaterThan(currentCalendarIndex);
    expect(masterWeekIndex).toBeGreaterThan(planningToolsIndex);
  });

  it("does not render optional guidance above ordinary Calendar work", () => {
    expect(source).not.toContain("CoreJourneyCue");
    expect(source).not.toContain("CoreJourneyHelp");
    expect(source).not.toContain("CleanWorkflowRibbon");
    expect(source).not.toContain("CleanPageIntroVideo");
    expect(source).not.toContain("GuidancePageAction");
    expect(source).toContain('<CleanFirstRunSetupGate currentStep="calendar" />');
    expect(source).toContain("GuidanceSetupProgress");
  });

  it("keeps Master Week and learning periods behind secondary planning tools", () => {
    expect(source).toContain("Planning tools");
    expect(source).toContain('aria-expanded={calendarSettingsOpen}');
    expect(source).toContain("calendarSettingsOpen ? <section");
    expect(source).toContain(
      'calendarSettingsOpen && shouldShowWeeklyPlanner && planningView === "master"',
    );
    expect(source).toContain("Calendar settings");
    expect(source).toContain("Learning periods");
    expect(source).toContain("Master Week");
  });

  it("keeps print and download available from the Current Calendar toolbar", () => {
    const currentBoardStart = source.indexOf("mylearna-calendar-operational-board");
    const currentBoardEnd = source.indexOf("mylearna-calendar-structural-setup", currentBoardStart);
    const currentBoard = source.slice(currentBoardStart, currentBoardEnd);

    expect(currentBoard).toContain("Print / Download");
    expect(currentBoard).toContain("Download week plan PDF");
    expect(currentBoard).toContain("Download month plan PDF");
    expect(currentBoard).toContain("Download today&apos;s plan");
  });

  it("keeps ordinary Calendar open, retry and view changes read-only", () => {
    const reloadStart = source.indexOf("const reloadCalendarItems");
    const reloadEnd = source.indexOf("useEffect(() =>", reloadStart);
    const reloadBody = source.slice(reloadStart, reloadEnd);
    const currentBoardStart = source.indexOf("mylearna-calendar-operational-board");
    const currentBoardEnd = source.indexOf("mylearna-calendar-structural-setup", currentBoardStart);
    const currentBoard = source.slice(currentBoardStart, currentBoardEnd);

    expect(reloadBody).not.toContain("materializeMasterWeekRange");
    expect(reloadBody).not.toMatch(/(?:create|update|delete)CleanCalendarItem/);
    expect(currentBoard).toContain("setSelectedWeekStart");
    expect(currentBoard).toContain("setCalendarBoardView");
    expect(currentBoard).not.toContain("materializeMasterWeekRange");
    expect(currentBoard).not.toContain("handleApplyGeneratedWeek");
  });
});
