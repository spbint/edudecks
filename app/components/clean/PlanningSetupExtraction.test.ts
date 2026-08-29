import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const calendar = readFileSync(join(process.cwd(), "app/components/clean/CleanCalendarWorkspace.tsx"), "utf8");
const day = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");
const account = readFileSync(join(process.cwd(), "app/components/clean/CleanAccountMenu.tsx"), "utf8");
const settings = readFileSync(join(process.cwd(), "app/components/clean/CleanSettingsWorkspace.tsx"), "utf8");
const route = readFileSync(join(process.cwd(), "app/(clean)/my-settings/planning/page.tsx"), "utf8");

describe("Planning Setup extraction", () => {
  it("provides an authenticated Planning Setup route and account-menu entry", () => {
    expect(route).toContain("CleanCalendarWorkspace planningOnly");
    expect(account).toContain('href="/my-settings/planning"');
    expect(account).toContain("Planning Setup");
  });

  it("reuses structural planning state and presents the Master Week vocabulary", () => {
    expect(calendar).toContain("planningOnly");
    expect(calendar).toContain("Planning Setup");
    expect(calendar).toContain("Master Week");
    expect(calendar).toContain("Current Calendar");
    expect(calendar).toContain("Calendar settings");
    expect(calendar).toContain("learning year");
    expect(calendar).toContain("learning periods");
    expect(calendar).toContain("createCleanMasterTemplate");
    expect(calendar).toContain("createCleanTemplateBlock");
  });

  it("keeps operational Calendar and live-item execution separate", () => {
    expect(calendar).toContain("mylearna-calendar-operational-board");
    expect(calendar).toContain("mylearna-calendar-structural-setup");
    expect(calendar).toContain("mylearna-calendar-usual-week-setup");
    expect(calendar).toContain("mylearna-calendar-shell-operational");
    expect(calendar).toContain("handleCalendarCompletionToggle");
    expect(calendar).toContain("Capture this moment");
    expect(calendar).toContain("View capture");
    expect(calendar).toContain("setPlanningView(\"week\")");
  });

  it("routes first-value planning to Calendar while preserving structural settings guidance", () => {
    expect(day).toContain('href="/my-calendar"');
    expect(day).not.toContain('href="/my-settings/planning"');
    expect(settings).toContain('nextHref="/my-settings/planning"');
    expect(settings).toContain("Open Planning Setup");
  });
});
