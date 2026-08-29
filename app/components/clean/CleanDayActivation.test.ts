import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");

describe("My Day activation safeguards", () => {
  it("uses one responsive first-value presentation rather than viewport-based render logic", () => {
    expect(source).toContain("mylearna-day-first-value");
    expect(source).toContain("@media (min-width: 768px)");
    expect(source).toContain("@media (max-width: 767px)");
    expect(source).not.toMatch(/window\.innerWidth|navigator\.userAgent/);
  });

  it("preserves existing My Day, Calendar and Quick Capture routes", () => {
    expect(source).toContain('const calendarPathBase =');
    expect(source).toContain('const capturePathBase =');
    expect(source).toContain('href={calendarPathBase}');
    expect(source).toContain('mode=quick');
  });

  it("uses the shared Quick Add form for activation and mature My Day", () => {
    expect(source).toContain("function renderQuickAddForm()");
    expect(source).toContain("mylearna-day-quick-add-form");
    expect(source).toContain("onClick={openQuickAdd}");
    expect(source).toContain("Add to My Day");
    expect(source).toContain("onClick={closeQuickAdd}");
    expect(source.match(/function renderQuickAddForm\(\)/g)).toHaveLength(1);
  });

  it("keeps the same first-value flow on mobile", () => {
    expect(source).toContain("mylearna-day-mature-content");
    expect(source).toContain("mylearna-day-mature-content-populated_day");
    expect(source).toContain("Capture something you already did");
    expect(source).toContain("Open My Calendar");
  });

  it("does not derive an activation state until setup and selected-day data resolve", () => {
    expect(source).toContain("!workspace.setupLoading");
    expect(source).toContain("itemsResolvedKey === dayPrimaryKey");
    expect(source).toContain("!itemsLoading");
    expect(source).toContain('data-testid="my-day-primary-loading-state"');
    expect(source).toContain("myDayPresentationState ? (");
  });

  it("makes adding today's learning the first-value action", () => {
    expect(source).toContain("What are you learning today?");
    expect(source).toContain("What are you learning on this day?");
    expect(source).toContain("Add something for today");
    expect(source).toContain("Add something for this day");
    expect(source).toContain("Plan our Master Week");
    expect(source).toContain('href={calendarPathBase}');
    expect(source).not.toContain('href="/my-settings/planning"');
    expect(source).toContain("Capture something you already did");
    expect(source).toContain('trackFirstValueChoice("add-today")');
    expect(source).toContain('trackFirstValueChoice("capture")');
    expect(source).toContain('trackFirstValueChoice("plan-master-week")');
    expect(source).toContain('myDayPresentationState === "RETURNING_EMPTY"');
  });

  it("keeps first value local, dated and learner-aware", () => {
    expect(source).toContain("plannedDate: selectedDate");
    expect(source).toContain('sourceType: "manual"');
    expect(source).toContain("setItems((current) => [...current, createdItem])");
    expect(source).toContain("setExpandedItemIds([createdItem.id])");
    expect(source).toContain('setQuickAddMessage("Added to My Day.")');
    expect(source).toContain("defaultQuickAddLearnerId");
    expect(source).toContain("accountSetup.activeLearnerId");
    expect(source).toContain('"Whole family"');
    expect(source).toContain("returnTo=${encodeURIComponent(buildDayPath(selectedDate))}");
    expect(source).toContain('params.set("returnTo", buildDayPath(selectedDate))');
  });

  it("keeps daily navigation available for resolved returning and populated days", () => {
    expect(source).toContain("mylearna-day-essential-navigator");
    expect(source).toContain('myDayPresentationState === "RETURNING_EMPTY" || myDayPresentationState === "POPULATED_DAY"');
    expect(source).toContain("Go to previous day");
    expect(source).toContain("Go to next day");
    expect(source).toContain("buildDayPath(today)");
  });
});
