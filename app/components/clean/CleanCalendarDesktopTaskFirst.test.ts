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

  it("uses the visible Calendar context for page-level Add", () => {
    expect(source).toContain("resolveCalendarPageLevelCreateDate");
    expect(source).toContain("const pageLevelCreateDate = useMemo");
    expect(source).toContain("openCreatePopover(pageLevelCreateDate)");
    expect(source).not.toContain("openCreatePopover(getTodayDate())");
  });

  it("keeps explicit day-context Add tied to the exact selected day", () => {
    expect(source).toContain("function openCreatePopover(dateValue: string)");
    expect(source).toContain("setPopoverDate(dateValue)");
    expect(source).toContain("openCreatePopover(dateValue)");
  });

  it("uses the same popover date for the modal and explicit Save payload", () => {
    expect(source).toContain("plannedDate={popoverDate}");
    expect(source).toContain("plannedDate: popoverDate");
    expect(source).toContain("await createCleanCalendarItem");
  });

  it("keeps opening and cancelling Add read-only while Save uses the existing write path", () => {
    const openStart = source.indexOf("function openCreatePopover(dateValue: string)");
    const openEnd = source.indexOf("function openEditPopover", openStart);
    const closeStart = source.indexOf("function closePopover()");
    const closeEnd = source.indexOf("function openLearningPeriodEditor", closeStart);
    const saveStart = source.indexOf("async function handlePopoverSave()");
    const saveEnd = source.indexOf("function buildCalendarCaptureHref", saveStart);
    const openBody = source.slice(openStart, openEnd);
    const closeBody = source.slice(closeStart, closeEnd);
    const saveBody = source.slice(saveStart, saveEnd);

    expect(openBody).not.toMatch(/(?:create|update|delete)CleanCalendarItem/);
    expect(openBody).not.toContain("materializeMasterWeekRange");
    expect(closeBody).not.toMatch(/(?:create|update|delete)CleanCalendarItem/);
    expect(closeBody).not.toContain("materializeMasterWeekRange");
    expect(saveBody).toContain("await createCleanCalendarItem(workspace.profile.id, payload)");
  });

  it("keeps empty Calendar copy aligned with the single Add path", () => {
    expect(source).toContain("Use Add learning block to create the first block for this view.");
    expect(source).not.toContain("Use a day below to add the first block for that date.");
  });

  it("does not show Master Week provenance as a default Current Calendar card badge", () => {
    const currentBoardStart = source.indexOf("mylearna-calendar-operational-board");
    const currentBoardEnd = source.indexOf("mylearna-calendar-structural-setup", currentBoardStart);
    const currentBoard = source.slice(currentBoardStart, currentBoardEnd);
    const cardBeforeActions = currentBoard.slice(
      currentBoard.indexOf("<strong style={{ color: \"#0f172a\", fontSize: 14 }}"),
      currentBoard.indexOf("<details onClick={(event) => event.stopPropagation()}>"),
    );

    expect(cardBeforeActions).not.toContain("getSourceLabel(item.sourceType)");
    expect(currentBoard).toContain("Source: {getSourceLabel(item.sourceType)}");
  });
});
