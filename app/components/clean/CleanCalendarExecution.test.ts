import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"), "utf8");

describe("Calendar planning model", () => {
  it("presents Master Week and Current Calendar as the two top-level modes", () => {
    expect(source).toContain('aria-label="Calendar planning mode"');
    expect(source).toContain("Master Week");
    expect(source).toContain("Current Calendar");
    expect(source).toContain('planningView === "master"');
    expect(source).toContain('planningView === "week"');
  });

  it("defaults a family without Master Week blocks to Master Week", () => {
    expect(source).toContain("if (!hasMasterWeekBlock) setPlanningView(\"master\")");
    expect(source).toContain("Add your first Master Week block");
    expect(source).toContain("Your Master Week is ready.");
    expect(source).toContain('href="/my-day"');
  });

  it("keeps dated planning in Current Calendar with Week and Month boards", () => {
    expect(source).toContain('planningView === "week"');
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
    expect(source).toContain("Mark complete");
    expect(source).toContain("Capture this moment");
    expect(source).toContain("View capture");
    expect(source).toContain("evidence_entry_id");
    expect(source).toContain("Edit");
    expect(source).toContain("Delete");
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
