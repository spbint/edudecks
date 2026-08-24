import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"), "utf8");

describe("live Calendar execution actions", () => {
  it("uses one progressive next action for master-to-week planning", () => {
    expect(source).toContain("Set up your usual week");
    expect(source).toContain("Preview this week from master");
    expect(source).toContain("Add master blocks to this week");
    expect(source).toContain("This week already contains these master blocks");
    expect(source).toContain("nextMasterTemplates.length === 1");
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

  it("keeps master-week template rendering separate from live item actions", () => {
    expect(source).toContain("templateBlocksByWeekday");
    expect(source).toContain("handleTemplateBlockDelete");
  });
});
