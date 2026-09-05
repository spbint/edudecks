import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"), "utf8");

describe("Calendar planning model", () => {
  it("presents Current Calendar as the ordinary desktop working surface", () => {
    expect(source).toContain('data-testid="desktop-calendar-task-first"');
    expect(source).toContain("Current Calendar");
    expect(source).toContain("See and adjust what is actually planned on real dates.");
    expect(source).toContain("Real planned learning, by date.");
    expect(source).not.toContain('aria-label="Calendar planning mode"');
  });

  it("keeps Master Week secondary for ordinary Calendar while preserving planning setup", () => {
    expect(source).toContain('if (!planningOnly || setupLoading || !masterWeekBlocksResolved || calendarModelDefaultedRef.current) return;');
    expect(source).toContain('calendarSettingsOpen && shouldShowWeeklyPlanner && planningView === "master"');
    expect(source).toContain("Add your first Master Week block");
    expect(source).toContain("Your Master Week is ready.");
    expect(source).toContain('href="/my-day"');
  });

  it("keeps dated planning in Current Calendar with Week and Month boards", () => {
    expect(source).toContain('{!planningOnly ? (');
    expect(source).toContain("Current Calendar");
    expect(source).toContain("Week");
    expect(source).toContain("Month");
    expect(source).toContain("openEditPopover(item)");
  });

  it("keeps learning dates and breaks behind Calendar settings", () => {
    expect(source).toContain("Calendar settings");
    expect(source).toContain("Set learning dates, terms and breaks when you need them.");
    expect(source).toContain("calendarSettingsOpen ? <section");
  });

  it("preserves planning controls and adds completion/capture actions for live items", () => {
    expect(source).toContain("handleCalendarCompletionToggle");
    expect(source).toContain("updateCleanCalendarItem");
    expect(source).toContain("Mark complete");
    expect(source).toContain("Capture this moment");
    expect(source).toContain("View capture");
    expect(source).toContain("evidence_entry_id");
    expect(source).toContain("Edit");
    expect(source).toContain("Delete");
  });

  it("uses one clear default add path and keeps item management secondary", () => {
    const currentBoardStart = source.indexOf("mylearna-calendar-operational-board");
    const currentBoardEnd = source.indexOf("mylearna-calendar-structural-setup", currentBoardStart);
    expect(currentBoardStart).toBeGreaterThan(-1);
    expect(currentBoardEnd).toBeGreaterThan(currentBoardStart);
    const currentBoard = source.slice(currentBoardStart, currentBoardEnd);

    expect(source).toContain("Add learning block");
    expect(currentBoard).not.toContain("Add block");
    expect(currentBoard).toContain("<details onClick={(event) => event.stopPropagation()}>");
    expect(currentBoard).toContain("<summary");
    expect(currentBoard).toContain("Actions");
    expect(currentBoard).not.toContain("Program:");
    expect(currentBoard).not.toContain("Week / segment:");
  });

  it("does not materialise or reconcile while a customer only views Calendar", () => {
    const reloadStart = source.indexOf("const reloadCalendarItems");
    const reloadEnd = source.indexOf("useEffect(() =>", reloadStart);
    expect(reloadStart).toBeGreaterThan(-1);
    expect(reloadEnd).toBeGreaterThan(reloadStart);
    const reloadBody = source.slice(reloadStart, reloadEnd);
    expect(reloadBody).not.toContain("materializeMasterWeekRange");
    expect(reloadBody).not.toMatch(/(?:insert|update|delete)CleanCalendarItem/);
  });

  it("keeps view switching read-only", () => {
    const currentBoardStart = source.indexOf("mylearna-calendar-operational-board");
    const currentBoardEnd = source.indexOf("mylearna-calendar-structural-setup", currentBoardStart);
    const currentBoard = source.slice(currentBoardStart, currentBoardEnd);

    expect(currentBoard).toContain("setSelectedWeekStart");
    expect(currentBoard).toContain("setCalendarBoardView");
    expect(currentBoard).not.toContain("materializeMasterWeekRange");
    expect(currentBoard).not.toMatch(/(?:create|update|delete)CleanCalendarItem/);
    expect(currentBoard).not.toContain("handleApplyGeneratedWeek");
  });

  it("carries occurrence context into the existing capture route", () => {
    expect(source).toContain("calendar_item_id: item.id");
    expect(source).toContain("observed_on: item.plannedDate");
    expect(source).toContain("program_id");
    expect(source).toContain("program_segment_id");
    expect(source).toContain("returnTo");
  });

  it("keeps Master Week template rendering separate from dated item actions", () => {
    expect(source).toContain("templateBlocksByWeekday");
    expect(source).toContain("handleTemplateBlockDelete");
  });
});
