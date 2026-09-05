import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/components/clean/CleanDayWorkspace.tsx"), "utf8");

describe("My Day timeout recovery", () => {
  it("catches the scoped calendar read and presents a recoverable customer state", () => {
    const loadStart = source.indexOf("async function loadItems()");
    const loadEnd = source.indexOf("useEffect(() =>", loadStart + 1);
    const loadBody = source.slice(loadStart, loadEnd);

    expect(loadBody).toContain("listCleanCalendarItems(workspace.profile!.id");
    expect(loadBody).toContain("fromDate: selectedDate");
    expect(loadBody).toContain("toDate: selectedDate");
    expect(loadBody).toContain("limit: 40");
    expect(loadBody).toContain("} catch (error) {");
    expect(loadBody).toContain('setItemsError("We couldn\'t load today\'s learning. Try again.")');
    expect(loadBody).toContain("Sentry.captureException(error");
  });

  it("retries the same read through state only, without automatic Calendar materialisation or writes", () => {
    expect(source).toContain("setDayReloadNonce((current) => current + 1)");
    expect(source).toContain("dayReloadNonce,");
    expect(source).not.toContain("ensureCleanOperationalWeekFromUsualWeek");

    const loadStart = source.indexOf("async function loadItems()");
    const loadEnd = source.indexOf("useEffect(() =>", loadStart + 1);
    const loadBody = source.slice(loadStart, loadEnd);
    expect(loadBody).not.toMatch(/(?:create|update|delete)CleanCalendarItem/);
  });
});
