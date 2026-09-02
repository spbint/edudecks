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
});
