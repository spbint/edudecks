import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");
const calendarClient = readFileSync(join(process.cwd(), "lib/clean/calendar/client.ts"), "utf8");

describe("My Day Calendar completion", () => {
  it("uses the established Calendar update path while retaining existing complete and undo controls", () => {
    expect(source).toContain("updateCleanCalendarItem");
    expect(source).not.toContain("setCleanCalendarItemCompletion");
    expect(source).toContain("item.completedAt ? null : new Date().toISOString()");
    expect(source).toContain("Mark complete");
    expect(calendarClient).toContain("clean_set_calendar_item_completion");
  });

  it("updates the visible item and planning cache optimistically, with a precise failure rollback", () => {
    expect(source).toContain("const previousItem = item");
    expect(source).toContain("const optimisticItem = { ...item, completedAt: nextCompletedAt }");
    expect(source).toContain("writeCleanPlanningCalendarItems(cacheKey, nextItems)");
    expect(source).toContain("currentItem.id === item.id ? previousItem : currentItem");
    expect(source).toContain("writeCleanPlanningCalendarItems(cacheKey, restoredItems)");
    expect(source).toContain("completionPendingIdsRef.current.has(item.id)");
    expect(source).toContain("completionPendingIdsRef.current.add(item.id)");
  });

  it("defers the planner PDF implementation until the explicit download action", () => {
    expect(source).not.toContain('from "@/lib/clean/outputs/weeklyPlanner"');
    expect(source).toContain('await import("@/lib/clean/outputs/weeklyPlanner")');
    expect(source).toContain("buildCleanDailyPlannerPdfFilename");
    expect(source).toContain("generateCleanDailyPlannerPdfBytes");
  });
});
